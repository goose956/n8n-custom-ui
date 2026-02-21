# Skill: Render PDF

Export the finished content as a downloadable PDF document.

## Your Process

1. **Gather the content**: Take ALL the content produced in previous phases
2. **Call the PDF tool**: Pass the COMPLETE content to the generate-pdf tool
3. **Confirm**: Verify the PDF was created and include the download link

## Rules

- Pass the **ENTIRE content** to the PDF tool — never truncate, summarise, or shorten it
- **Include images**: If images were generated earlier, include them in the content using markdown syntax `![description](/skill-images/exact_filename.png)` with the EXACT path returned by the generate-image tool. The PDF renderer will embed them automatically.
- Use the EXACT image paths from tool outputs — do NOT rewrite `/skill-images/file.png` as `https://skill-images.file.png` or any other format
- Include a meaningful title for the PDF
- Use a descriptive filename (e.g., "ai_trends_2026_article.pdf")
- Call the PDF tool **exactly once**
- This is typically the LAST phase — do not continue after generating the PDF
