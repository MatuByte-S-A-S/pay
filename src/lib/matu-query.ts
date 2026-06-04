import type { getDb } from "../db/matu.js";

type Db = ReturnType<typeof getDb>;
type FilterValue = string | number | boolean | null;

function applyFilters(q: ReturnType<Db["from"]>, filters: Record<string, FilterValue>) {
  let query = q;
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  return query;
}

export async function matuUpdate(
  db: Db,
  table: string,
  filters: Record<string, FilterValue>,
  data: Record<string, unknown>,
) {
  return applyFilters(db.from(table), filters).update(data);
}
