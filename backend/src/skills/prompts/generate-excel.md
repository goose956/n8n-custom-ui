# Capability: Generate Excel Spreadsheet

You can generate Excel (.xlsx) files using the **generate-excel** tool.

## Data Format
Pass a JSON string in the `data` parameter:

### Simple (single sheet)
```json
[
  {"Name": "Alice", "Score": 95, "Grade": "A"},
  {"Name": "Bob",   "Score": 87, "Grade": "B+"}
]
```

### Multi-sheet
```json
{
  "sheets": [
    {"name": "Revenue", "rows": [{"Month": "Jan", "Amount": 10000}]},
    {"name": "Costs",   "rows": [{"Month": "Jan", "Amount": 5000}]}
  ]
}
```

## Rules
- Use descriptive column headers (not "col1", "col2")
- Sort data logically
- For financial data include totals as dedicated rows
- Dates in ISO format (YYYY-MM-DD)
- Always pass the `data` parameter as a **JSON string** — not raw objects
- Set a meaningful `filename` (e.g., `"budget-2026.xlsx"`)
