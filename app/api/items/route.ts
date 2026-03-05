import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function statusPriority(status: string): number {
  if (status === "reading") return 0;
  if (status === "watched" || status === "read") return 1;
  return 2; // want_to
}

function sortItems(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...items].sort((a, b) => {
    const posA = (a.sort_order as number | null | undefined) ?? null;
    const posB = (b.sort_order as number | null | undefined) ?? null;

    // Items with positions come first, sorted by position
    if (posA !== null && posB !== null) {
      if (posA !== posB) return posA - posB;
      // Tiebreaker: created_at asc
      return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime();
    }
    if (posA !== null) return -1;
    if (posB !== null) return 1;

    // Both null: fall back to status sort
    const pa = statusPriority(a.status as string);
    const pb = statusPriority(b.status as string);
    if (pa !== pb) return pa - pb;

    // Finished group: sort by finish date desc
    if (pa === 1) {
      const yearDiff = ((b.finished_year as number) ?? 0) - ((a.finished_year as number) ?? 0);
      if (yearDiff !== 0) return yearDiff;
      const mA = MONTH_NUM[(a.finished_month as string) ?? ""] ?? 0;
      const mB = MONTH_NUM[(b.finished_month as string) ?? ""] ?? 0;
      return mB - mA;
    }

    // Reading + want_to: created_at desc
    return (
      new Date(b.created_at as string).getTime() -
      new Date(a.created_at as string).getTime()
    );
  });
}

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let query = supabase.from("items").select("*");
  if (type) query = query.eq("type", type);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = data ?? [];

  // Fetch note counts for all items
  const { data: noteCounts } = await supabase
    .from("notes")
    .select("item_id")
    .in("item_id", items.map((i) => i.id));

  const countMap: Record<string, number> = {};
  for (const row of noteCounts ?? []) {
    countMap[row.item_id] = (countMap[row.item_id] ?? 0) + 1;
  }

  const itemsWithCounts = items.map((item) => ({
    ...item,
    note_count: countMap[item.id] ?? 0,
  }));

  return NextResponse.json({ items: sortItems(itemsWithCounts) });
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("items")
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
