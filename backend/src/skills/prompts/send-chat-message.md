# Capability: Send Chat Message

You can send messages to Slack, Microsoft Teams, or Discord using the **send-chat-message** tool.

## Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| webhookUrl | Yes | Incoming webhook URL |
| message | Yes | Message text content |
| platform | No | slack, teams, discord (auto-detected from URL) |

## Platform Detection
- URLs containing `discord.com` → Discord
- URLs containing `office.com` or `microsoft.com` → Teams
- All other webhook URLs → Slack (default)

## Message Formatting
### Slack
- Bold: `*text*`, Italic: `_text_`, Code: `` `text` ``
- Links: `<url|display text>`

### Teams
- Bold: `**text**`, Italic: `*text*`
- Links: `[display text](url)`

### Discord
- Bold: `**text**`, Italic: `*text*`, Code: `` `text` ``
- Max 2000 characters per message

## Rules
- NEVER send to webhook URLs unless explicitly provided by the user
- Auto-detect platform from the URL
- Keep messages concise and actionable
- Use emoji for clarity: ✅ ❌ ⚠️ 📊 🔔
- For long content, summarize rather than truncate
