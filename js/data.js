/* ------------------------------------------------------------------
 *  Question data + vibe / source metadata.
 *
 *  Rows are loaded from a real JSON file (data/questions.json); each is
 *  { vibe, source, guest, q, a }. Per the design handoff, the card
 *  accent is VIBE-coded — a card's festive colour comes from its Vibe
 *  (VIBE_ACCENT) — and filtering is two independent dimensions (Vibe AND
 *  Source) applied together.
 * ------------------------------------------------------------------ */

/** The 10 vibes, in display order (matches the design handoff). */
export const VIBES = [
  'Favorites', 'Food', 'Hot takes', 'Would you rather', 'Hypotheticals',
  'Quantities', 'Childhood & school', 'Advice & life', 'Just silly', 'Miscellaneous',
];

/** Per-vibe accent colour — drives each card's --accent (theme-independent). */
export const VIBE_ACCENT = {
  'Favorites': '#ff5e9c',
  'Food': '#ff8a3d',
  'Hot takes': '#ff4d4d',
  'Would you rather': '#9d6bff',
  'Hypotheticals': '#5b8cff',
  'Quantities': '#2fb8d6',
  'Childhood & school': '#2fd6b0',
  'Advice & life': '#36c46f',
  'Just silly': '#ff6ad5',
  'Miscellaneous': '#ffb13c',
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
 * Filter the bank by the two independent dimensions, applied together (AND):
 * vibe ('Everything' + the 10 vibes) and source ('Everything' + the 6 sources).
 * Some vibe×source combos have few or zero cards — callers guard the empty pool.
 */
export function poolFor(all, { vibe = 'Everything', source = 'Everything' } = {}) {
  return all.filter((r) =>
    (vibe === 'Everything' || r.vibe === vibe) &&
    (source === 'Everything' || r.source === source));
}
