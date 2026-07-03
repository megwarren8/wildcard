/* ------------------------------------------------------------------
 *  Question data + vibe / source metadata.
 *
 *  Rows are loaded from a real JSON file (data/questions.json); each is
 *  { vibe, source, guest, q, a }. Per the design handoff, the card
 *  accent is VIBE-coded - a card's festive colour comes from its Vibe
 *  (VIBE_ACCENT) - and filtering is two independent dimensions (Vibe AND
 *  Source) applied together.
 * ------------------------------------------------------------------ */

/** The 10 vibes, in display order (matches the design handoff). */
export const VIBES = [
  'Favorites', 'Food', 'Hot takes', 'Would you rather', 'Hypotheticals',
  'Quantities', 'Childhood & school', 'Advice & life', 'Just silly', 'Miscellaneous',
];

/** Per-vibe accent colour - drives each card's --accent (theme-independent). */
export const VIBE_ACCENT = {
  'Favorites': '#E08BC4',
  'Food': '#F2A65A',
  'Hot takes': '#EE6C6C',
  'Would you rather': '#9B8BE0',
  'Hypotheticals': '#6BA8E8',
  'Quantities': '#3FB8C9',
  'Childhood & school': '#2BB7B3',
  'Advice & life': '#5FC59A',
  'Just silly': '#E89AD6',
  'Miscellaneous': '#F2C94C',
};

/** The 6 sources (shows / podcasts), in display order. */
export const SOURCES = ['Hot Ones', 'Good Hang', 'SmartLess', 'New Heights', 'Call Her Daddy', 'On Purpose'];

/** Accent colour for a vibe; 'All vibes' / unknown falls back to yellow (--a2). */
export function vibeAccent(vibe) {
  return VIBE_ACCENT[vibe] || 'var(--a2)';
}

/** Fetch the question bank from data/questions.json. */
export async function loadQuestions() {
  const res = await fetch('data/questions.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load questions (${res.status})`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('questions.json is not an array');
  return rows;
}

/**
 * Filter the bank by the two independent dimensions, applied together (AND).
 * Both `vibes` and `sources` are ARRAYS (multiselect); an empty array on a
 * dimension means "no filter" (i.e. All) on that dimension. Callers guard the
 * empty pool.
 */
export function poolFor(all, { vibes = [], sources = [] } = {}) {
  return all.filter((r) =>
    (vibes.length === 0 || vibes.includes(r.vibe)) &&
    (sources.length === 0 || sources.includes(r.source)));
}
