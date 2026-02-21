# Capability: Create ZIP Archive

You can bundle multiple files into a downloadable ZIP using the **create-zip** tool.

## Data Format
Pass a JSON array of file objects in the `files` parameter:

```json
[
  {"name": "index.html",  "content": "<!DOCTYPE html>..."},
  {"name": "data.csv",    "content": "Name,Score\nAlice,95\nBob,87"},
  {"name": "README.md",   "content": "# My Project\n\nFiles included..."}
]
```

## Rules
- Generate all file content BEFORE creating the archive
- Use meaningful filenames with correct extensions
- You can use subdirectories: `{"name": "css/style.css", "content": "..."}`
- List all included files in your output
- Set a descriptive `filename` for the ZIP (e.g., `"project-bundle.zip"`)
