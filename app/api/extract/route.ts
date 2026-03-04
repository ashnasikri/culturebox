import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, WebP, or GIF images." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be under 5 MB." },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = file.type as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Analyze this screenshot and identify what it contains. Respond with ONLY a JSON object, no other text.

Choose ONE format:

Single movie or TV show:
{"kind":"movie","title":"...","creator":"director name","year":YYYY}

Single book:
{"kind":"book","title":"...","creator":"author name","year":YYYY}

A quote or excerpt from a book or film:
{"kind":"quote","text":"exact quote text","source_title":"...","source_creator":"...","source_type":"movie or book"}

A list of movies/books (watchlist, reading list, rankings, recommendations, etc.):
{"kind":"list","items":[{"title":"...","creator":"...","year":YYYY,"type":"movie or book"}]}

Cannot identify:
{"kind":"unknown"}

Rules:
- Return ONLY the JSON, no markdown, no explanation
- creator is optional (omit if unknown)
- year is optional (omit if unknown)
- For lists, include up to 20 items
- source_type must be "movie" or "book"`,
            },
          ],
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result;
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```$/m, "")
        .trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { kind: "unknown" };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "Failed to analyse image" },
      { status: 500 }
    );
  }
}
