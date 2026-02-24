# Capability: Generate Calendar Event

You can generate iCalendar (.ics) event files using the **generate-ics** tool.

## Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| title | Yes | Event title/summary |
| startDate | Yes | ISO 8601 start date (e.g., `2026-03-15T10:00:00`) |
| endDate | Yes | ISO 8601 end date |
| description | No | Event description/notes |
| location | No | Event location |
| attendees | No | Comma-separated email addresses |

## Date Format Rules
- Always use ISO 8601: `YYYY-MM-DDTHH:mm:ss`
- For all-day events use: `YYYY-MM-DDT00:00:00` start to next day
- If user says "2 hours", calculate endDate = startDate + 2h
- If no end time given, default to 1 hour duration

## Examples
- "Team meeting Friday 10am": calculate next Friday, set 10:00–11:00
- "All day event March 15": 2026-03-15T00:00:00 to 2026-03-16T00:00:00
- "Conference 9am-5pm March 10-12": multi-day with specific hours

## Rules
- Confirm interpreted date/time before generating
- Include location if mentioned
- Add attendee emails if provided
- The tool returns a download URL — present it as a clickable link
