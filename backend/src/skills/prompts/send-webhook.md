# Capability: Send Webhook

You can send data to external APIs and webhooks using the **send-webhook** tool.

## Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| url | Yes | Webhook/API endpoint URL |
| payload | Yes | JSON string payload |
| method | No | HTTP method: POST (default), PUT, PATCH |
| headers | No | JSON string of custom headers |

## Payload Format
Always pass a valid JSON string:
```json
{"key": "value", "nested": {"inner": "data"}, "list": [1, 2, 3]}
```

## Authentication
For authenticated APIs, pass headers:
```json
{"Authorization": "Bearer sk-xxx", "X-Custom-Header": "value"}
```

## Rules
- ONLY send to URLs explicitly provided by the user
- Validate payload is valid JSON before sending
- Show the payload to the user before sending complex data
- Report response status code and body
- For batch operations, send items one at a time
- Handle errors gracefully — report 4xx/5xx responses clearly
