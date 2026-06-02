/* ------------------------------------------------------------------
 *  Question data — loaded from a real JSON file (no global, no Babel).
 * ------------------------------------------------------------------ */

export const SOURCE_META = {
  'On Purpose': { tag: 'On Purpose · Final Five', short: 'On Purpose', accent: 'a3' },
  'Hot Ones':   { tag: 'Hot Ones',               short: 'Hot Ones',   accent: 'a1' },
};

/** Accent token name ('a1' | 'a3') for a row's source. */
export function accentFor(source) {
  return (SOURCE_META[source] && SOURCE_META[source].accent) || 'a3';
}

/** Source pill label for a row. */
export function tagFor(source) {
  return (SOURCE_META[source] && SOURCE_META[source].tag) || source;
}

/** Fetch the question bank from data/questions.json. */
export async function loadQuestions() {
  const res = await fetch('data/questions.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load questions (${res.status})`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('questions.json is not an array');
  return rows;
}

/** Filter the bank by the chosen pool. */
export function poolFor(all, source) {
  if (source === 'On Purpose' || source === 'Hot Ones') {
    return all.filter((r) => r.source === source);
  }
  return all; // 'Everything'
}
