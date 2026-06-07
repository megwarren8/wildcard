/* ------------------------------------------------------------------
 *  DOM builders for reel cards + the idle screen.
 *  (Vanilla equivalent of the prototype's <Card> and <IdleMark>.)
 * ------------------------------------------------------------------ */

import { vibeAccent } from './data.js';
import { TARGET_IDX } from './reel.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/** One reel cell: cream card with a question front layer + answer back layer. */
export function buildCard(row, { active = false } = {}) {
  const wrap = el('div', 'card-wrap' + (active ? ' active' : ''));
  const accent = vibeAccent(row.vibe); // festive colour, vibe-coded

  const card = el('div', 'card');
  card.style.setProperty('--accent', accent);

  // Front — vibe chip eyebrow + the question.
  const q = el('div', 'layer q');
  const eyebrow = el('div', 'q-eyebrow');
  eyebrow.appendChild(el('span', 'vibe-chip', row.vibe));
  q.appendChild(eyebrow);
  const long = (row.q || '').length > 95;
  q.appendChild(el('p', 'q-text' + (long ? ' sm' : ''), row.q));

  // Back — the answer + attribution (source pill on the card's vibe accent).
  const a = el('div', 'layer a');
  a.appendChild(el('span', 'a-label', 'They said'));
  a.appendChild(el('p', 'a-text', row.a));
  const attrib = el('div', 'attrib');
  attrib.appendChild(el('span', 'who', row.guest));
  const src = el('span', 'src', row.source);
  src.style.background = accent;
  attrib.appendChild(src);
  a.appendChild(attrib);

  card.append(q, a);
  wrap.appendChild(card);
  return wrap;
}

/** Build the absolutely-positioned reel strip for a spin. */
export function buildStripEl(cards) {
  const strip = el('div', 'reel-strip');
  cards.forEach((row, i) => strip.appendChild(buildCard(row, { active: i === TARGET_IDX })));
  return strip;
}

/** Toggle the answer on the active card. */
export function setRevealed(stripEl, revealed) {
  if (!stripEl) return;
  const card = stripEl.children[TARGET_IDX] && stripEl.children[TARGET_IDX].querySelector('.card');
  if (card) card.classList.toggle('revealed', revealed);
}

/** Build the idle screen (big "?" mark + copy). */
export function buildIdle(promptCount) {
  const idle = el('div', 'idle-card');
  idle.appendChild(el('div', 'im im-q', '?'));

  const p = el('p');
  p.append('Hit ', Object.assign(el('b'), { textContent: 'Spin' }), ' to draw a random ice-breaker');
  idle.appendChild(p);

  idle.appendChild(el('span', 'idle-sub', `${promptCount} prompts loaded`));
  return idle;
}
