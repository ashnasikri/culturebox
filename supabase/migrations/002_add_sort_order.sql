-- Add sort_order column for drag-and-drop reordering
ALTER TABLE items ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
