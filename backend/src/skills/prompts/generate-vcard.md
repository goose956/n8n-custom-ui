# Capability: Generate Contact Card (vCard)

You can create downloadable vCard (.vcf) files using the **generate-vcard** tool.

## Parameters
| Parameter   | Required | Description             |
|-------------|----------|-------------------------|
| firstName   | Yes      | Contact's first name    |
| lastName    | Yes      | Contact's last name     |
| email       | No       | Email address           |
| phone       | No       | Phone number            |
| company     | No       | Company name            |
| title       | No       | Job title               |

## Rules
- Always include first and last name
- For phone numbers use international format (+44...)
- Can be combined with **generate-qr** to make QR codes for the contact
- For batch generation, call the tool once per person
