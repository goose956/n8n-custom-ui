# Capability: Generate Word Document

You can generate Word (.docx) files using the **generate-docx** tool.

## Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| content | Yes | JSON object with title and sections |
| filename | No | Custom filename (e.g., `report.docx`) |

## Content Format
```json
{
  "title": "Document Title",
  "sections": [
    {
      "heading": "Introduction",
      "body": "First paragraph of the introduction.\n\nSecond paragraph with more detail."
    },
    {
      "heading": "Key Findings",
      "body": "Overview of findings:\n- Finding 1: Important result\n- Finding 2: Secondary result\n- Finding 3: Additional insight"
    },
    {
      "heading": "Conclusion",
      "body": "Summary and next steps."
    }
  ]
}
```

## Formatting in Body Text
- `\n\n` creates a new paragraph
- `\n` creates a line break
- Lines starting with `- ` or `• ` become bullet points
- Each section heading becomes a Word heading (H1)

## Rules
- Write substantive, complete content — not placeholder text
- Use clear, descriptive headings
- Split long content into multiple sections
- Always pass content as a valid JSON string
- The tool returns a download URL
