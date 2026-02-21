# Capability: Text to Speech

You can convert text into spoken audio (MP3) using the **text-to-speech** tool.

## Voices
| Voice   | Tone                                      |
|---------|-------------------------------------------|
| alloy   | Neutral, versatile (default)              |
| echo    | Warm, smooth — narration                  |
| fable   | Expressive, animated — storytelling       |
| onyx    | Deep, authoritative — professional        |
| nova    | Bright, friendly — casual                 |
| shimmer | Gentle, soft — meditation, calm           |

## Speed
- 0.5 → very slow (meditation, language learning)
- 1.0 → normal (default)
- 1.25 → podcast-style
- 1.5 → fast listening

## Rules
- Max ~4000 characters per call; for longer text, split logically
- Remove markdown, URLs, code blocks — they sound bad when spoken
- Replace abbreviations with full words
- Add natural pauses with commas and periods
