# Phase 06 content formats

- Website: normalized `http:` or `https:` URL. IDN hosts are normalized by the browser URL parser; no request is sent.
- Text: original UTF-8 text, including Arabic, emoji, and line breaks.
- Wi-Fi: `WIFI:T:...;S:...;P:...;H:...;;` with reserved-character escaping. WPA/WPA2, WPA3-Personal, and open networks are available; WPA3 reader support varies.
- Contact: vCard 3.0 with CRLF lines and escaped backslashes, commas, semicolons, and newlines.
- WhatsApp: official `https://wa.me/<international-number>` URL with an optional encoded message.
- Email: `mailto:` URI with URL-encoded subject and body.
- Phone and SMS: `tel:` and modern `sms:<number>?body=...` URIs.
- Location: explicit `https://www.google.com/maps?q=<latitude>,<longitude>` URL; GPS access is never requested.
- Event: iCalendar `VEVENT` with a validated IANA time zone and ordered local date-times. Camera recognition varies.
- Crypto: Bitcoin uses its documented `bitcoin:` URI and optional positive amount. Ethereum uses `ethereum:<address>` without an amount. USDT is deliberately emitted as labeled static text for the explicitly selected ERC-20 or TRC-20 network because a single universally compatible payment URI is not available.

The editor uses QR version-40 byte capacities for the selected error-correction level (L 2953, M 2331, Q 1663, H 1273 bytes) as an early validation guard. Final generation remains the authoritative capacity check.
