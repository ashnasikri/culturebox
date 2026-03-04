const GB_BASE = "https://www.googleapis.com/books/v1";

export async function searchGoogleBooks(query: string) {
  const res = await fetch(
    `${GB_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=10`
  );
  const data = await res.json();
  return data.items ?? [];
}

export function getGoogleBookCover(
  imageLinks: { thumbnail?: string; smallThumbnail?: string } | undefined
) {
  if (!imageLinks) return null;
  // Prefer thumbnail, upgrade to https
  const url = imageLinks.thumbnail ?? imageLinks.smallThumbnail ?? null;
  return url?.replace("http://", "https://") ?? null;
}
