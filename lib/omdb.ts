import { SearchResult } from "@/types";

const OMDB_BASE = "https://www.omdbapi.com";

interface OMDbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
}

interface OMDbDetail {
  Title: string;
  Year: string;
  Director: string;
  Poster: string;
  imdbID: string;
  Response: string;
}

export async function searchMovies(query: string): Promise<SearchResult[]> {
  const key = process.env.OMDB_API_KEY;
  const res = await fetch(
    `${OMDB_BASE}/?apikey=${key}&s=${encodeURIComponent(query)}&type=movie`
  );
  const data = await res.json();
  const items: OMDbSearchItem[] = (data.Search ?? []).slice(0, 5);

  if (items.length === 0) return [];

  // Fetch details in parallel to get directors
  const detailed = await Promise.all(
    items.map((item) => getMovieDetail(item.imdbID))
  );

  return detailed
    .filter((d) => d.Response !== "False")
    .map((d) => ({
      title: d.Title,
      creator: d.Director === "N/A" ? "" : d.Director,
      year: parseInt(d.Year) || null,
      coverUrl: d.Poster !== "N/A" ? d.Poster : null,
      sourceId: d.imdbID,
      type: "movie" as const,
    }));
}

export async function getMovieDetail(imdbID: string): Promise<OMDbDetail> {
  const key = process.env.OMDB_API_KEY;
  const res = await fetch(
    `${OMDB_BASE}/?apikey=${key}&i=${encodeURIComponent(imdbID)}`
  );
  return res.json();
}
