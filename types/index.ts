export type ItemType = "movie" | "book";

export type MovieStatus = "watched" | "want_to";
export type BookStatus = "read" | "reading" | "want_to";
export type ItemStatus = MovieStatus | BookStatus;

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  creator: string | null;
  year: number | null;
  cover_image_url: string | null;
  status: ItemStatus;
  progress: number | null;
  finished_month: string | null;
  finished_year: number | null;
  imdb_id: string | null;
  openlibrary_id: string | null;
  created_at: string;
  sort_order: number | null;
  notes: string | null;
  note_count?: number;
}

export interface Note {
  id: string;
  item_id: string;
  text: string;
  created_at: string;
}

export interface Quote {
  id: string;
  text: string;
  source_item_id: string | null;
  source_title: string;
  source_creator: string;
  type: ItemType;
  created_at: string;
}

export interface Screenshot {
  id: string;
  storage_path: string;
  processed: boolean;
  result_item_id: string | null;
  result_quote_id: string | null;
  created_at: string;
}

export interface BulkReviewItem {
  title: string;
  creator: string;
  year: number | null;
  coverUrl: string | null;
  sourceId: string;
  type: ItemType;
  status: string;
  alreadyInVault: boolean;
  checked: boolean;
}

export type ExtractionResponse =
  | { kind: "movie"; title: string; creator?: string; year?: number }
  | { kind: "book"; title: string; creator?: string; year?: number }
  | { kind: "quote"; text: string; source_title?: string; source_creator?: string; source_type?: ItemType }
  | { kind: "list"; items: Array<{ title: string; creator?: string; year?: number; type: ItemType }> }
  | { kind: "unknown" };

export interface SearchResult {
  title: string;
  creator: string;
  year: number | null;
  coverUrl: string | null;
  sourceId: string;
  type: ItemType;
}

export type Tab = "movies" | "books" | "quotes";
