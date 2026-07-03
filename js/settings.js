/* ------------------------------------------------------------------
 *  Settings, the real, user-facing settings recommended by the
 *  handoff. Vibe is chosen via the always-visible vibe bar (app.js);
 *  this popover exposes Source, Answer mode, Spin time, and Confetti.
 *  Cosmetic options (theme/font/housing/idle mark) are fixed to their
 *  chosen defaults (Carnival / Bricolage / Console / Question mark) and
 *  are not exposed here. Persisted to localStorage.
 * ------------------------------------------------------------------ */

import { SOURCES } from './data.js';

const KEY = 'wildcard.settings';

export const DEFAULTS = {
  vibes: [],                 // array of VIBES; empty = All (multiselect via vibe bar)
  sources: [],               // array of SOURCES; empty = All (multiselect via settings panel)
  revealMode: 'Guess first', // 'Guess first' | 'Show answer'
  spinSpeed: 2.6,            // seconds, 1.2-4
  confetti: true,
};

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    // Legacy migration MUST run against the RAW saved payload (before merging
    // with DEFAULTS), because DEFAULTS.vibes = [] would mask the missing key.
    // If the raw payload has an old string 'vibe'/'source' but no new array
    // 'vibes'/'sources', carry the legacy selection over.
    if (!Array.isArray(saved.vibes) && typeof saved.vibe === 'string') {
      saved.vibes = (saved.vibe && saved.vibe !== 'Everything') ? [saved.vibe] : [];
    }
    if (!Array.isArray(saved.sources) && typeof saved.source === 'string') {
      saved.sources = (saved.source && saved.source !== 'Everything') ? [saved.source] : [];
    }
    const s = { ...DEFAULTS, ...saved };
    delete s.vibe; delete s.source;
    return s;
  } catch {
    return { ...DEFAULTS };
  }
}

/** Persist settings to localStorage (also used by the vibe bar in app.js). */
export function saveSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

/**
 * Wire up the settings popover.
 * @param {object} opts
 * @param {object} opts.settings   current settings (mutated in place + persisted)
 * @param {(changed: string) => void} opts.onChange  called with the changed key
 * @param {string[]} [opts.sources]  source options to show (defaults to all SOURCES);
 *   pass only the sources present in the data so empty ones aren't offered.
 * @returns {{ refreshSourceSeg: () => void }}  handles for app.js to refresh the UI
 *   after external state changes (Home button resets filters, etc.).
 */
export function initSettings({ settings, onChange, sources = SOURCES }) {
  const root = document.getElementById('settings');
  const toggle = document.getElementById('settingsToggle');
  const panel = document.getElementById('settingsPanel');

  const apply = (key, value) => {
    settings[key] = value;
    saveSettings(settings);
    onChange(key);
  };

  // --- build the panel ------------------------------------------------
  panel.innerHTML = '';
  panel.appendChild(heading('Settings'));

  // Source: multi-select. Click a source to toggle it; click All to clear
  // the whole selection (all sources are then in play).
  const sourceRow = multiSelectRow('Source', 'sources', sources);
  panel.appendChild(sourceRow.row);

  const answerRow = segRow('Answer', 'revealMode', ['Guess first', 'Show answer']);
  panel.appendChild(answerRow.row);

  panel.appendChild(rangeRow('Spin time', 'spinSpeed', 1.2, 4, 0.1));
  panel.appendChild(segRow('Confetti', 'confetti', [['On', true], ['Off', false]]).row);
  panel.appendChild(footer());

  // refresh pressed-states for a single-select segmented row
  function refreshSeg(row, key) {
    row.querySelectorAll('button[data-val]').forEach((b) => {
      const val = parseVal(b.dataset.val);
      b.setAttribute('aria-pressed', String(val === settings[key]));
    });
  }

  // refresh pressed-states for a multi-select array row
  function refreshMulti(seg, key, allBtn) {
    const active = settings[key] || [];
    const allActive = active.length === 0;
    if (allBtn) allBtn.setAttribute('aria-pressed', String(allActive));
    seg.querySelectorAll('button[data-mval]').forEach((b) => {
      b.setAttribute('aria-pressed', String(active.includes(b.dataset.mval)));
    });
  }

  function heading(text) {
    const h = document.createElement('h2');
    h.textContent = text;
    return h;
  }

  function segRow(label, key, options) {
    const row = document.createElement('div');
    row.className = 'set-row';
    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const seg = document.createElement('div');
    seg.className = 'seg';
    options.forEach((opt) => {
      const [text, value] = Array.isArray(opt) ? opt : [opt, opt];
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.dataset.val = encodeVal(value);
      b.addEventListener('click', () => {
        apply(key, value);
        refreshSeg(seg, key);
      });
      seg.appendChild(b);
    });
    row.appendChild(seg);
    queueMicrotask(() => refreshSeg(seg, key));
    return { row, seg };
  }

  /* Multi-select segmented row. `values` is an array of string options.
   * Renders an "All" button that clears the selection, plus one button per
   * option that toggles that option in the settings[key] array. */
  function multiSelectRow(label, key, values) {
    const row = document.createElement('div');
    row.className = 'set-row';
    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const seg = document.createElement('div');
    seg.className = 'seg';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'All';
    allBtn.dataset.mall = '1';
    allBtn.addEventListener('click', () => {
      apply(key, []);
      refreshMulti(seg, key, allBtn);
    });
    seg.appendChild(allBtn);

    values.forEach((v) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = v;
      b.dataset.mval = v;
      b.addEventListener('click', () => {
        const current = Array.isArray(settings[key]) ? settings[key] : [];
        const has = current.includes(v);
        const next = has ? current.filter((x) => x !== v) : [...current, v];
        apply(key, next);
        refreshMulti(seg, key, allBtn);
      });
      seg.appendChild(b);
    });

    row.appendChild(seg);
    queueMicrotask(() => refreshMulti(seg, key, allBtn));
    return { row, seg, refresh: () => refreshMulti(seg, key, allBtn) };
  }

  function rangeRow(label, key, min, max, step) {
    const row = document.createElement('div');
    row.className = 'set-row range';
    const lab = document.createElement('label');
    lab.textContent = label;
    const out = document.createElement('output');
    out.textContent = settings[key].toFixed(1) + 's';
    lab.appendChild(out);
    row.appendChild(lab);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min); input.max = String(max); input.step = String(step);
    input.value = String(settings[key]);
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      out.textContent = v.toFixed(1) + 's';
      apply(key, v);
    });
    row.appendChild(input);
    return row;
  }

  function footer() {
    const f = document.createElement('div');
    f.className = 'set-foot';
    f.textContent = 'Space spin · R reveal · Esc home';
    return f;
  }

  // --- open / close ---------------------------------------------------
  const open = () => {
    panel.hidden = false;
    root.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    panel.hidden = true;
    root.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden ? open() : close();
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !root.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) close();
  });

  return { refreshSourceSeg: sourceRow.refresh };
}

// segmented buttons may carry non-string values (booleans), round-trip safely.
function encodeVal(v) { return typeof v === 'boolean' ? `b:${v}` : `s:${v}`; }
function parseVal(s) {
  if (s.startsWith('b:')) return s === 'b:true';
  return s.slice(2);
}
