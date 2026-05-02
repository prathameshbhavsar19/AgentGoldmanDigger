#!/usr/bin/env bash
# Add or renew Let's Encrypt TLS for a domain (after DNS A/AAAA points to this server).
# Usage: sudo ./scripts/enable-letsencrypt.sh your.domain.com you@example.com
set -euo pipefail
DOMAIN="${1:-}"
EMAIL="${2:-}"
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Usage: sudo $0 <domain> <letsencrypt-account-email>" >&2
  exit 1
fi
exec certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect
