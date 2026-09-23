import test from "node:test";
import assert from "node:assert/strict";
import {
  guestCancellation,
  guestConfirmation,
  messagesFor,
  notify,
  resendMailer,
  siteOrigin,
  venueAlert,
  whenLabel,
} from "../src/booking/server/email.ts";

const booking = {
  id: "PK-ABC234",
  tableId: "v5",
  // 9:00am in Melbourne is 23:00 the day before in UTC — the server's clock.
  startsAt: "2026-09-30T23:00:00.000Z",
  durationMin: 75,
  partySize: 4,
  guestName: "Sarah Nguyen",
  phone: "0400 000 001",
  email: "sarah@example.com",
  notes: "Birthday",
  status: "confirmed",
};

test("times read in Melbourne time whatever the server's clock says", () => {
  assert.equal(whenLabel(booking.startsAt), "Thursday 1 October at 9:00 am");
});

test("the guest gets their reference, time, party and table, with replies going to the venue", () => {
  const m = guestConfirmation(booking, "hello@thepeacock.com.au");
  assert.equal(m.to, "sarah@example.com");
  assert.equal(m.replyTo, "hello@thepeacock.com.au");
  for (const s of ["PK-ABC234", "Thursday 1 October at 9:00 am", "4 people", "V5", "Birthday", "03 8596 2342"]) {
    assert.ok(m.text.includes(s), `text mentions ${s}`);
    assert.ok(m.html.includes(s), `html mentions ${s}`);
  }
});

test("the venue alert carries the guest's contact details and a run sheet link", () => {
  const m = venueAlert(booking, "https://peacock-south-yarra.vercel.app", "hello@thepeacock.com.au");
  assert.equal(m.to, "hello@thepeacock.com.au");
  assert.equal(m.replyTo, "sarah@example.com", "Jenny can reply straight to the guest");
  assert.match(m.subject, /^New booking: Sarah Nguyen, 4 people, Thursday 1 October at 9:00 am$/);
  for (const s of ["0400 000 001", "sarah@example.com", "https://peacock-south-yarra.vercel.app/owners/bookings"]) {
    assert.ok(m.text.includes(s), `text mentions ${s}`);
  }
});

test("guest-typed text cannot inject markup or break the subject line", () => {
  const nasty = { ...booking, guestName: 'Eve <img src=x onerror=alert(1)>\r\nBcc: a@b.c', notes: "<script>x</script>" };
  for (const m of [guestConfirmation(nasty, "v@x.au"), venueAlert(nasty, "https://x", "v@x.au"), guestCancellation(nasty, "v@x.au")]) {
    assert.ok(!m.html.includes("<img"), "no raw tag");
    assert.ok(!m.html.includes("<script>"), "no raw script");
    assert.ok(!/[\r\n]/.test(m.subject), "subject is one line");
  }
});

test("a new booking sends two emails; a cancellation sends one, to the guest", () => {
  const env = { CONTACT_TO_EMAIL: "jenny@example.com" };
  assert.deepEqual(messagesFor("created", booking, env).map((m) => m.to), ["sarah@example.com", "jenny@example.com"]);
  assert.deepEqual(messagesFor("cancelled", booking, env).map((m) => m.to), ["sarah@example.com"]);
  assert.deepEqual(
    messagesFor("created", booking, { CONTACT_TO_EMAIL: "a@x.au", BOOKING_NOTIFY_EMAIL: "bookings@x.au" }).map((m) => m.to)[1],
    "bookings@x.au",
    "a dedicated booking inbox wins over the contact one",
  );
});

test("links follow the Vercel production URL, falling back to the site's own", () => {
  assert.equal(siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "peacock-south-yarra.vercel.app" }), "https://peacock-south-yarra.vercel.app");
  assert.equal(siteOrigin({}), "https://www.thepeacock.com.au");
});

test("no key or no from-address means no mailer, not a crash", () => {
  assert.equal(resendMailer({}), null);
  assert.equal(resendMailer({ RESEND_API_KEY: "re_x" }), null);
  assert.ok(resendMailer({ RESEND_API_KEY: "re_x", CONTACT_FROM_EMAIL: "The Peacock <b@x.au>" }));
});

test("the mailer posts to Resend with the key in the header, never the URL", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ id: "1" }), { status: 200 });
  });
  const mailer = resendMailer({ RESEND_API_KEY: "re_secret", BOOKING_FROM_EMAIL: "The Peacock <bookings@x.au>" });
  await mailer.send(guestConfirmation(booking, "v@x.au"));
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[0].init.headers.Authorization, "Bearer re_secret");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.from, "The Peacock <bookings@x.au>");
  assert.deepEqual(body.to, ["sarah@example.com"]);
  assert.equal(body.reply_to, "v@x.au");
});

test("a failing mail provider is logged, never thrown", async (t) => {
  t.mock.method(console, "error", () => {});
  const sent = [];
  const flaky = {
    async send(m) {
      sent.push(m.to);
      if (m.to === "sarah@example.com") throw new Error("Resend returned 500");
    },
  };
  await notify(flaky, "created", booking, { CONTACT_TO_EMAIL: "jenny@example.com" });
  assert.deepEqual(sent.sort(), ["jenny@example.com", "sarah@example.com"], "one failure does not stop the other");
  assert.equal(console.error.mock.callCount(), 1);
  await notify(null, "created", booking, {}); // unconfigured: silently nothing
});
