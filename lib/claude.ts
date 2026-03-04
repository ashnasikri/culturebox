import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractFromScreenshot(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Analyze this screenshot and extract structured data. Determine if it shows a movie, book, or quote.

Return ONLY valid JSON:
- Movie/book: {"type": "movie"|"book", "title": "...", "creator": "...", "year": 2024}
- Quote: {"type": "movie"|"book", "title": "source", "creator": "...", "year": 2024, "quote": "the quote text"}

No markdown, no explanation — just the JSON object.`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
