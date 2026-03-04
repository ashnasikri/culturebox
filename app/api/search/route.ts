import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/omdb";
import { SearchResult } from "@/types";

const OL_BASE = "https://openlibrary.org";
const OL_COVERS = "https://covers.openlibrary.org";
const GB_BASE = "https://www.googleapis.com/books/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    if (type === "movie") {
      const results = await searchMovies(query);
      return NextResponse.json({ results });
    }

    if (type === "book") {
      const results = await searchBooksNormalized(query);
      return NextResponse.json({ results });
    }

    return NextResponse.json(
      { error: "Type must be 'movie' or 'book'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

async function searchBooksNormalized(
  query: string
): Promise<SearchResult[]> {
  const olRes = await fetch(
    `${OL_BASE}/search.json?q=${encodeURIComponent(query)}&limit=5`
  );
  const olData = await olRes.json();
  const docs = (olData.docs ?? []).slice(0, 5);

  const results = await Promise.all(
    docs.map(async (doc: Record<string, unknown>): Promise<SearchResult> => {
      let coverUrl: string | null = null;

      // Try Open Library cover by edition key
      if (doc.cover_edition_key) {
        coverUrl = `${OL_COVERS}/b/olid/${doc.cover_edition_key}-M.jpg`;
      } else if (doc.cover_i) {
        coverUrl = `${OL_COVERS}/b/id/${doc.cover_i}-M.jpg`;
      }

      // Fallback to Google Books for cover
      if (!coverUrl) {
        coverUrl = await getGoogleBooksCover(doc.title as string);
      }

      return {
        title: doc.title as string,
        creator: (doc.author_name as string[])?.[0] ?? "",
        year: (doc.first_publish_year as number) ?? null,
        coverUrl,
        sourceId: doc.key as string,
        type: "book",
      };
    })
  );

  return results;
}

async function getGoogleBooksCover(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${GB_BASE}/volumes?q=${encodeURIComponent(title)}&maxResults=1`
    );
    const data = await res.json();
    const url = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    return url?.replace("http://", "https://") ?? null;
  } catch {
    return null;
  }
}
