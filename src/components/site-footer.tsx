import { hours, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-teal text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-10 text-center lg:pt-10 lg:pb-4">
        <p className="font-ui text-[14px] leading-[19.6px] font-semibold">
          CAFE: {hours.weekdays.label} {hours.weekdays.display} &nbsp;|&nbsp;{" "}
          {hours.weekend.label} {hours.weekend.display}
        </p>
        <p className="font-ui text-[14px] leading-[19.6px] font-semibold">
          {hours.publicHolidays.label} {hours.publicHolidays.display}
        </p>

        <p className="mt-[18px] font-strapline text-[16px] tracking-[1px] uppercase lg:text-[20px]">
          {site.strapline}
        </p>

        <address className="mt-[14px] not-italic">
          <p className="font-ui text-[14px] font-semibold">{site.addressLine}</p>
          <p className="font-ui text-[14px] text-balance">
            EMAIL{" "}
            <a
              href={`mailto:${site.email}`}
              className="whitespace-nowrap underline underline-offset-2 hover:no-underline"
            >
              {site.email}
            </a>
            <span className="mx-2" />
            <span className="text-[16px] font-semibold">PHONE</span>{" "}
            <a
              href={site.phoneHref}
              className="text-[16px] font-semibold whitespace-nowrap underline underline-offset-2 hover:no-underline"
            >
              {site.phone}
            </a>
          </p>
        </address>
      </div>
    </footer>
  );
}
