# Capability: Edit Image

You can process and edit images using the **edit-image** tool.

## Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| imageUrl | Yes | Source image URL (remote or local `/skill-images/...`) |
| operations | Yes | JSON object of operations to apply |

## Available Operations
```json
{
  "resize": {"width": 800, "height": 600},
  "rotate": 90,
  "flip": true,
  "flop": true,
  "grayscale": true,
  "blur": 5,
  "watermark": "© My Company",
  "format": "webp"
}
```

| Operation | Value | Description |
|-----------|-------|-------------|
| resize | `{width?, height?}` | Scale to fit (maintains aspect ratio if one dimension omitted) |
| rotate | degrees | Rotate: 90, 180, 270 |
| flip | true | Flip vertically |
| flop | true | Mirror horizontally |
| grayscale | true | Convert to black & white |
| blur | sigma (1–20) | Gaussian blur |
| watermark | text | Diagonal text watermark overlay |
| format | png/jpeg/webp | Convert output format |

## Common Sizes
- Instagram post: 1080×1080
- LinkedIn post: 1200×630
- Twitter header: 1500×500
- Thumbnail: 300×300

## Rules
- Combine multiple operations in a single call
- Always show the result as an inline image: `![Result](url)`
- For resize, specify only width OR height to maintain aspect ratio
- Operations are applied in order: resize → rotate → flip → effects → format
- Pass operations as a valid JSON string
