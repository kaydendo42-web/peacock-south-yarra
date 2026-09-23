#!/usr/bin/env bash
# Set the owner console login on Vercel without the password ever touching
# the screen, the shell history, the repo or a chat log.
#
#   npm run set-owner-password
#
# Asks for a username and a password (typed twice, hidden), hashes the
# password with scripts/hash-password.mjs, and stores the username and the
# scrypt hash as Vercel environment variables for production and preview.
# The plain password is never stored anywhere. Redeploy afterwards: a
# deployment reads its environment when it is built.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .vercel/project.json ]; then
  echo "Not linked to Vercel. Run: vercel link --project peacock-south-yarra" >&2
  exit 1
fi

read -r -p "Username for the owner console [jenny]: " username
username="${username:-jenny}"

read -r -s -p "New password (12+ characters): " pw1; echo
read -r -s -p "Same password again: " pw2; echo

if [ "$pw1" != "$pw2" ]; then
  echo "The two passwords did not match. Nothing was changed." >&2
  exit 1
fi
if [ "${#pw1}" -lt 12 ]; then
  echo "Use at least 12 characters. Nothing was changed." >&2
  exit 1
fi

hash="$(printf '%s' "$pw1" | node scripts/hash-password.mjs)"
unset pw1 pw2

for env in production preview; do
  printf '%s' "$username" | vercel env add PEACOCK_OWNER_USERNAME "$env" --force --no-sensitive >/dev/null
  printf '%s' "$hash" | vercel env add PEACOCK_OWNER_PASSWORD_HASH "$env" --force --sensitive >/dev/null
  echo "Saved for $env."
done

echo
echo "Done. Sign-in is now '$username' with the password you just typed."
echo "It takes effect on the next deployment. To apply it now:"
echo "  vercel redeploy \$(vercel ls peacock-south-yarra --prod 2>/dev/null | grep -m1 -o 'https://[^ ]*') --target production"
