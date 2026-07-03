/* ------------------------------------------------------------------
 *  Reel geometry + spin animation.
 *
 *  The strip is: FILLERS_BEFORE random cards, the target, then
 *  FILLERS_AFTER random cards. We animate translateY from the card at
 *  START_IDX to the target at TARGET_IDX, measuring live geometry at
 *  run time so it always lands dead-centre regardless of responsive
 *  sizing.
 * ------------------------------------------------------------------ */

export const FILLERS_BEFORE = 24;   // cards spun past before landing
export const FILLERS_AFTER = 3;     // cards left below for the peek
export const TARGET_IDX = FILLERS_BEFORE;
export const START_IDX = 3;

// Fallback geometry (only used if a card hasn't measured yet).
const CARD_H = 320;
const PEEK = 92;
const WIN_H = CARD_H + PEEK * 2;

const rand = (n) => Math.floor(Math.random() * n);
export const pick = (arr) => arr[rand(arr.length)];

/** Build the reel strip array + the chosen target card. */
export function buildStrip(pool) {
  const target = pick(pool);
  const cards = [];
  for (let i = 0; i < FILLERS_BEFORE; i++) cards.push(pick(pool));
  cards.push(target);
  for (let i = 0; i < FILLERS_AFTER; i++) cards.push(pick(pool));
  return { cards, target };
}

/**
 * Run the spin animation on a freshly-mounted strip element.
 * Returns a cleanup function that cancels the pending timers.
 *
 * @param {HTMLElement} el       the .reel-strip element
 * @param {number} spinSpeed     seconds (default 2.6, range 1.2-4)
 * @param {() => void} onLanded  called when the reel locks in
 */
export function runSpin(el, spinSpeed, onLanded) {
  const durMs = Math.round(spinSpeed * 1000);

  // Measure live geometry so the strip ALWAYS lands dead-centre on a
  // card, regardless of any responsive change to card/window height.
  const winH = (el.parentElement && el.parentElement.clientHeight) || WIN_H;
  const cardH = (el.children[0] && el.children[0].offsetHeight) || CARD_H;
  const cY = (i) => winH / 2 - (i * cardH + cardH / 2);

  // Snap to the start, blur, force reflow.
  el.style.transition = 'none';
  el.style.filter = 'blur(7px)';
  el.style.transform = `translateY(${cY(START_IDX)}px)`;
  void el.offsetHeight; // reflow

  // Transition to the target.
  el.style.transition = `transform ${durMs}ms cubic-bezier(.13,.71,.18,1), filter 520ms ease-out`;
  el.style.transform = `translateY(${cY(TARGET_IDX)}px)`;

  // De-blur near the end (transform value unchanged, so it isn't restarted).
  const tBlur = setTimeout(() => { el.style.filter = 'blur(0px)'; }, Math.max(0, durMs - 560));

  // Timer-based completion is far more reliable than transitionend here.
  const tDone = setTimeout(() => {
    el.style.transition = 'none';
    el.style.transform = `translateY(${cY(TARGET_IDX)}px)`; // hard-snap, no sub-pixel drift
    el.style.filter = 'none';
    onLanded();
  }, durMs + 70);

  return () => { clearTimeout(tBlur); clearTimeout(tDone); };
}
