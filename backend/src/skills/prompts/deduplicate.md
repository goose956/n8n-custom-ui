# Skill: Deduplicate Data

Find and merge duplicate or near-duplicate records in a dataset.

## Your Process

1. **Analyze the dataset**: Understand fields and what makes a duplicate
2. **Match strategy**: Exact (email, ID), fuzzy (name, address), phonetic
3. **Identify clusters**: Group likely-duplicate records
4. **Suggest merges**: Recommend which record to keep per cluster

## Output Format

- Total records, unique records, duplicate clusters found
- Per cluster: confidence level, field comparison table, merge recommendation
- Full cleaned (deduplicated) dataset

## Rules

- NEVER auto-merge without showing the comparison
- Confidence: High (>90%), Medium (70-90%), Low (50-70%)
- Preserve all unique data points when merging
- Output cleaned data via generate-csv or generate-json
