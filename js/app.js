/* ==================================================================
 *  WILDCARD — main controller.
 *
 *  State machine:  idle → spinning → landed → revealed  (and back to
 *  landed, or a new spinning). All state is local; the active strip
 *  cell is the source of truth for the landed card.
 * ================================================================== */

import { loadQuestions, poolFor } from './data.js';
import { buildStrip, runSpin } from './reel.js';
import { buildStripEl, buildIdle, setRevealed } from './cards.js';
import { fireSparks } from './confetti.js';
import { loadSettings, initSettings } from './settings.js';

/* --- DOM refs ------------------------------------------------------ */
const reelWindow = document.getElementById('reelWindow');
const sparkHost  = document.getElementById('sparkHost');
const controls   = document.getElementById('controls');
const pull       = document.getElementById('pull');
const pullFace   = pull.querySelector('.pull-face');

/* --- state --------------------------------------------------------- */
let all = [];
let pool = [];
let phase = 'idle';            // idle | spinning | landed | revealed
let stripEl = null;            // the mounted .reel-strip
let contentEl = null;          // idle-card or reel-strip currently in the window
let cancelSpin = null;         // teardown for the running spin
let autoRevealTimer = 0;
let drawn = 0;

const settings = loadSettings();

/* --- helpers ------------------------------------------------------- */
function mountContent(node) {
  if (contentEl && contentEl.parentNode) contentEl.remove();
  contentEl = node;
  if (node) reelWindow.insertBefore(node, reelWindow.firstChild);
}

function setPhase(p) {
  phase = p;
  render();
}

/* --- spin / reveal ------------------------------------------------- */
function spin() {
  if (phase === 'spinning' || pool.length === 0) return;
  clearTimeout(autoRevealTimer);
  if (cancelSpin) cancelSpin();

  const { cards } = buildStrip(pool);
  stripEl = buildStripEl(cards);
  mountContent(stripEl);
  setPhase('spinning');

  cancelSpin = runSpin(stripEl, settings.spinSpeed, onLanded);
}

function onLanded() {
  cancelSpin = null;
  drawn += 1;
  setPhase('landed');
  if (settings.confetti) fireSparks(sparkHost);
  maybeAutoReveal();
}

function maybeAutoReveal() {
  clearTimeout(autoRevealTimer);
  if (phase === 'landed' && settings.revealMode === 'Show answer') {
    autoRevealTimer = setTimeout(() => { if (phase === 'landed') setPhase('revealed'); }, 260);
  }
}

function toggleAnswer() {
  clearTimeout(autoRevealTimer);
  if (phase === 'revealed') setPhase('landed');
  else if (phase === 'landed') setPhase('revealed');
}

/* --- render -------------------------------------------------------- */
function render() {
  // Window contents (idle screen only ever shows before the first spin).
  if (phase === 'idle') mountContent(buildIdle(pool.length));

  // Lock-in flash while a card is showing.
  reelWindow.classList.toggle('locked', phase === 'landed' || phase === 'revealed');

  // Card flip.
  setRevealed(stripEl, phase === 'revealed');

  // Primary button.
  pullFace.textContent =
    phase === 'spinning' ? 'Spinning…' : phase === 'idle' ? 'Spin' : 'Spin again';
  pull.classList.toggle('busy', phase === 'spinning');
  pull.classList.toggle('invite', phase === 'idle');
  pull.disabled = phase === 'spinning';

  renderRevealBtn();
}

function renderRevealBtn() {
  let label = null;
  if (phase === 'landed' && settings.revealMode === 'Guess first') label = 'Reveal the answer';
  else if (phase === 'revealed') label = '← Back to question';

  const existing = controls.querySelector('.reveal');
  // Recreate on label change so the pop-in animation replays each appearance.
  if (existing && existing.textContent === label) return;
  if (existing) existing.remove();
  if (!label) return;

  const btn = document.createElement('button');
  btn.className = 'btn reveal';
  btn.textContent = label;
  btn.addEventListener('click', () => { btn.blur(); toggleAnswer(); });
  controls.insertBefore(btn, pull);
}

/* --- keyboard ------------------------------------------------------ */
function onKey(e) {
  // Ignore when focus is in a form control or the settings panel.
  if (e.target.closest && (e.target.closest('input, textarea, select, button') || e.target.closest('#settings'))) return;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (phase === 'landed' && settings.revealMode === 'Guess first') toggleAnswer();
    else spin();
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    toggleAnswer();
  }
}

/* --- settings changes ---------------------------------------------- */
function onSettingChange(key) {
  if (key === 'source') {
    pool = poolFor(all, settings.source);
    if (phase === 'idle') render(); // refresh the prompt count
  } else if (key === 'revealMode') {
    render();          // show/hide the reveal button
    maybeAutoReveal(); // auto-reveal if switched to "Show answer" while landed
  }
  // spinSpeed / confetti take effect on the next spin / next landing.
}

/* --- error surface ------------------------------------------------- */
function showLoadError(err) {
  const box = document.createElement('div');
  box.className = 'idle-card';
  const mark = document.createElement('div');
  mark.className = 'im im-q';
  mark.textContent = '!';
  const p = document.createElement('p');
  p.textContent = "Couldn't load the question bank.";
  const sub = document.createElement('span');
  sub.className = 'idle-sub';
  sub.textContent = 'Run it through a local server (./run.sh), not file://';
  box.append(mark, p, sub);
  mountContent(box);
  pull.disabled = true;
  console.error('[WILDCARD]', err);
}

/* --- boot ---------------------------------------------------------- */
async function boot() {
  initSettings({ settings, onChange: onSettingChange });
  pull.addEventListener('click', () => { pull.blur(); spin(); });
  window.addEventListener('keydown', onKey);

  try {
    all = await loadQuestions();
    pool = poolFor(all, settings.source);
    render();
  } catch (err) {
    showLoadError(err);
  }
}

boot();
