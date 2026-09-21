# The Peacock domain preparation

## Recommended arrangement
Jenny / Crazy Domains: domain registration, renewal, current billing.
Cloudflare Free: DNS management.
Vercel: Next.js hosting when the production site is approved.

Before deployment, strongly recommended: update the installed Vercel CLI
with `npm i -g vercel@latest`. This session found 59.11.7 installed while
the integration tooling recommends the newer release for compatibility.

Changing DNS providers does not transfer the domain registration or move its
renewal billing. Jenny's existing Crazy Domains renewal can continue unchanged.
A real registrar transfer would need a payment method and contact information
in the receiving Cloudflare account. The published supported-TLD list checked
21 September 2026 does not list com.au. Cloudflare DNS can still serve it.

## Prepare while reviewing the local site
1. Use a Cloudflare account owned by Jenny/the business and invite the agency.
2. Add thepeacock.com.au (the domain, without www or https) on the Free plan.
3. Import existing DNS, then compare with the authoritative provider's full zone.
   Automatic scans are not guaranteed to discover every record.
4. Preserve all website records, subdomains and email MX/TXT/CNAME records,
   including SPF, DKIM, DMARC and verification entries.
5. Leave the nameserver change pending until the record comparison is complete.
   Do not cancel Wix, Crazy Domains, email hosting, or domain auto-renewal.

## When ready
Check whether DNSSEC is enabled before switching nameservers. Follow Cloudflare's
DNSSEC migration instructions to avoid stale DS records. Change only nameservers
at Crazy Domains after matching the records. Existing Wix targets can remain while
Cloudflare becomes authoritative; this is separate from the website launch.

After site approval and a production deployment, add apex and www to the hosting
project and copy its exact requested DNS targets. Begin with DNS-only records;
avoid enabling a second proxy until the hosting configuration has been checked.
Preserve email entries. Test HTTPS, canonical redirects, booking, contact and menu.
After the DNS move is stable, enable Cloudflare DNSSEC and publish its DS record
at the registrar. Keep the existing services until the cutover is verified.

Sources:
https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/
https://www.cloudflare.com/tld-policies/
