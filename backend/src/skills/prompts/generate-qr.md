# Skill: Generate QR Code

Generate QR codes for URLs, text, WiFi networks, vCards, or any data.

## Supported Formats

- **URL**: plain web address
- **WiFi**: WIFI:T:WPA;S:NetworkName;P:Password;;
- **vCard**: BEGIN:VCARD...END:VCARD
- **Email**: mailto:address
- **Phone**: tel:+number
- **SMS**: smsto:+number:message
- **Geo**: geo:lat,lon

## Rules

- Use the generate-qrcode tool to create the QR image
- Auto-detect the data type and format it properly
- Always explain what the QR code contains
- For WiFi QR codes, use the standard WIFI: format
