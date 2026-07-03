/* ==================================================================
 *  WILDCARD, main controller.
 *
 *  State machine:  idle → spinning → landed → revealed  (and back to
 *  landed, or a new spinning). All state is local; the active strip
 *  cell is the source of truth for the landed card.
 *
 *  Filters: both vibes and sources are ARRAYS (multi-select). An empty
 *  array on a dimension means "no filter" (i.e. All) on that dimension.
 *  Home button + Esc reset both filters back to All.
 * ================================================================== */

import { loadQuestions, poolFor, VIBES, SOURCES, vibeAccent } from './data.js';
import { buildStrip, runSpin } from './reel.js';
import { buildStripEl, buildIdle, setRevealed } from './cards.js';
import { fireSparks } from './confetti.js';
import { loadSettings, saveSettings, initSettings } from './settings.js';

/* --- DOM refs ------------------------------------------------------ */
const reelWindow = document.getElementById('reelWindow');
const sparkHost  = document.getElementById('sparkHost');
const controls   = document.getElementById('controls');
const pull       = document.getElementById('pull');
const pullFace   = pull.querySelector('.pull-face');
const vibeBar    = document.getElementById('vibeBar');
const homeBtn    = document.getElementById('homeBtn');

/* --- state --------------------------------------------------------- */
let all = [];
let pool = [];
let phase = 'idle';            // idle | spinning | landed | revealed
let stripEl = null;            // the mounted .reel-strip
let contentEl = null;          // idle-card or reel-strip currently in the window
let cancelSpin = null;         // teardown for the running spin
let autoRevealTimer = 0;
let drawn = 0;
let settingsHandles = null;    // { refreshSourceSeg } returned from initSettings

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

function recomputePool() {
  pool = poolFor(all, { vibes: settings.vibes, sources: settings.sources });
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

/* Reset to the idle home screen (Home button + Esc). Also clears the
 * vibe and source filters, so "Home" is a true fresh start. */
function goHome() {
  clearTimeout(autoRevealTimer);
  if (cancelSpin) { cancelSpin(); cancelSpin = null; }
  stripEl = null;

  const hadFilters = (settings.vibes && settings.vibes.length) || (settings.sources && settings.sources.length);
  settings.vibes = [];
  settings.sources = [];
  if (hadFilters) {
    saveSettings(settings);
    recomputePool();
    refreshVibeBar();
    if (settingsHandles && settingsHandles.refreshSourceSeg) settingsHandles.refreshSourceSeg();
  }
  setPhase('idle');
}

/* --- vibe picker (always-visible category chooser) ----------------- */
/* Multi-select. Clicking "All vibes" clears the whole selection (so all
 * vibes are in play). Clicking a specific vibe toggles it in and out of
 * the settings.vibes array. When settings.vibes is empty, "All vibes"
 * appears active and every specific vibe reads as inactive. */
function buildVibeBar(vibes = VIBES) {
  vibeBar.innerHTML = '';
  ['Everything', ...vibes].forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'vchip';
    b.textContent = name === 'Everything' ? 'All vibes' : name;
    // 'All vibes' uses yellow (--a2); each vibe uses its festive accent.
    b.style.setProperty('--chip', name === 'Everything' ? 'var(--a2)' : vibeAccent(name));
    b.dataset.vibe = name;
    b.addEventListener('click', () => { b.blur(); onVibeClick(name); });
    vibeBar.appendChild(b);
  });
  refreshVibeBar();
}

function refreshVibeBar() {
  const active = settings.vibes || [];
  const allActive = active.length === 0;
  vibeBar.querySelectorAll('.vchip').forEach((b) => {
    const vibe = b.dataset.vibe;
    const on = vibe === 'Everything' ? allActive : active.includes(vibe);
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

function onVibeClick(name) {
  const current = Array.isArray(settings.vibes) ? settings.vibes : [];
  if (name === 'Everything') {
    if (current.length === 0) return;   // already at "All"
    settings.vibes = [];
  } else {
    settings.vibes = current.includes(name) ? current.filter((v) => v !== name) : [...current, name];
  }
  saveSettings(settings);
  recomputePool();
  refreshVibeBar();
  if (phase === 'idle') render(); // refresh the "{N} prompts loaded" count
}

/* --- render -------------------------------------------------------- */
function render() {
  // Window contents (idle screen only ever shows before the first spin).
  if (phase === 'idle') mountContent(buildIdle(pool.length));

  // Lock-in flash while a card is showing.
  reelWindow.classList.toggle('locked', phase === 'landed' || phase === 'revealed');

  // Home button: hidden on the idle screen (you're already home).
  homeBtn.classList.toggle('hidden', phase === 'idle');

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
  if (phase === 'landed' && settings.revealMode === 'Guess first') label = 'Reveal';
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
  // Esc → home. Works globally, but let an open settings panel close first.
  if (e.key === 'Escape') {
    const panel = document.getElementById('settingsPanel');
    if (panel && !panel.hidden) return; // settings.js handles closing it
    e.preventDefault();
    goHome();
    return;
  }
  // Ignore the rest when focus is in a form control or the settings panel.
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
  if (key === 'sources') {
    recomputePool();
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
  pull.addEventListener('click', () => { pull.blur(); spin(); });
  homeBtn.addEventListener('click', () => { homeBtn.blur(); goHome(); });
  window.addEventListener('keydown', onKey);

  try {
    all = await loadQuestions();

    // Only surface categories that actually have cards (canonical order),
    // so a category with zero cards is never offered.
    const presentVibes = VIBES.filter((v) => all.some((r) => r.vibe === v));
    const presentSources = SOURCES.filter((s) => all.some((r) => r.source === s));

    // Drop any persisted filter that no longer exists in the current data.
    const cleanVibes = (settings.vibes || []).filter((v) => presentVibes.includes(v));
    const cleanSources = (settings.sources || []).filter((s) => presentSources.includes(s));
    if (cleanVibes.length !== (settings.vibes || []).length || cleanSources.length !== (settings.sources || []).length) {
      settings.vibes = cleanVibes;
      settings.sources = cleanSources;
      saveSettings(settings);
    }

    settingsHandles = initSettings({ settings, onChange: onSettingChange, sources: presentSources });
    buildVibeBar(presentVibes);

    recomputePool();
    render();
  } catch (err) {
    settingsHandles = initSettings({ settings, onChange: onSettingChange }); // still wire the gear
    showLoadError(err);
  }
}

boot();
