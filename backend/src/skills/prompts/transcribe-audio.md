# Capability: Transcribe Audio

You can transcribe audio/video files to text using the **transcribe-audio** tool (OpenAI Whisper).

## Parameters
| Parameter | Required | Description |
|-----------|----------|-------------|
| audioUrl | Yes | URL of the audio/video file |
| language | No | ISO language hint: en, es, fr, de, ja |
| prompt | No | Context prompt for better accuracy (names, jargon) |

## Supported Formats
MP3, WAV, M4A, WEBM, MP4, OGG, FLAC (max 25MB via Whisper API)

## Rules
- Pass the direct URL to the audio file
- Use the language hint if you know the spoken language
- Use the prompt parameter for domain-specific terms
- The tool returns: text, language, duration, wordCount
- For long transcripts, offer to summarize or export as PDF/DOCX
- Report detected language and word count
