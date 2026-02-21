# Skill: Template Fill

Fill templates with data — mail merge, form letters, personalized content.

## Your Process

1. **Parse the template**: Identify all placeholders ({{var}}, {var}, [VAR], etc.)
2. **Map data**: Match provided data fields to template variables
3. **Generate outputs**: Produce one filled output per data record
4. **Format**: Present all outputs clearly separated

## Rules

- If a field is missing, insert "[MISSING: fieldName]"
- Preserve ALL original template formatting
- If multiple records, generate ALL — never truncate
- Clearly separate each generated output
