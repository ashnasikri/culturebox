import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST() {
  const supabase = createServiceClient();

  // Fetch all quotes and all books
  const [{ data: quotes }, { data: books }] = await Promise.all([
    supabase.from("quotes").select("id, source_title, source_item_id"),
    supabase.from("items").select("id, title").eq("type", "book"),
  ]);

  if (!quotes || !books) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

  // Build a lowercase title → item id map
  const titleMap = new Map<string, string>();
  for (const book of books) {
    titleMap.set(book.title.toLowerCase().trim(), book.id);
  }

  // Find quotes that can be matched to a book
  const updates: { id: string; source_item_id: string }[] = [];
  for (const quote of quotes) {
    if (!quote.source_title) continue;
    const match = titleMap.get(quote.source_title.toLowerCase().trim());
    if (match && quote.source_item_id !== match) {
      updates.push({ id: quote.id, source_item_id: match });
    }
  }

  // Apply updates
  let updated = 0;
  for (const { id, source_item_id } of updates) {
    const { error } = await supabase
      .from("quotes")
      .update({ source_item_id })
      .eq("id", id);
    if (!error) updated++;
  }

  return NextResponse.json({
    total_quotes: quotes.length,
    matched: updates.length,
    updated,
  });
}
