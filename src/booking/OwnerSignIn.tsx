"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "./data";

/**
 * Owner sign-in.
 *
 * The password is checked on the server against a scrypt hash and the answer
 * comes back as an HttpOnly cookie, so nothing here ever holds a credential or
 * a token. On success the router is sent back to the server for the run sheet,
 * which re-reads the cookie and decides for itself whether to render.
 */
export default function OwnerSignIn() {
  const router = useRouter();
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const session = await signIn(username, password);
    if (!session) {
      setBusy(false);
      setError(true);
      return;
    }
    router.replace("/owners/bookings");
    router.refresh();
  };

  return (
    <div className="pt-root pt-frame--login">
      <div className="gate-wrap gate-wrap--standalone">
        <form className="panel gate enter login" onSubmit={submit}>
          <h1 className="display t-22 gate__title">Owners</h1>
          <p className="t-13 ink-60 gate__lede">
            Sign in to see the day’s bookings.
          </p>

          <hr className="rule" />

          <label className="stack-8">
            <span className="label">Username</span>
            <input
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="stack-8">
            <span className="label">Password</span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </label>

          {error ? (
            <p className="t-13 dock__error" role="status">
              Those details did not match. Try again.
            </p>
          ) : null}

          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
