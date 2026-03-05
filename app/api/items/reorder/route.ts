import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// POST /api/items/reorder
// Body: { ids: string[] } — ordered array of item IDs
// Assigns position 0..n to each item in order
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const { ids } = await request.json();

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
  }

  await Promise.all(
    ids.map((id: string, idx: number) =>
      supabase.from("items").update({ sort_order: idx }).eq("id", id)
    )
  );

  return NextResponse.json({ success: true });
}
