const OL_BASE = "https://openlibrary.org";
const OL_COVERS = "https://covers.openlibrary.org";

export async function searchBooks(query: string) {
  const res = await fetch(
    `${OL_BASE}/search.json?q=${encodeURIComponent(query)}&limit=10`
  );
  const data = await res.json();
  return data.docs ?? [];
}

export function getCoverUrl(
  coverId: number | undefined,
  size: "S" | "M" | "L" = "M"
) {
  if (!coverId) return null;
  return `${OL_COVERS}/b/id/${coverId}-${size}.jpg`;
}
