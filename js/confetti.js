/* ------------------------------------------------------------------
 *  Confetti burst - appended to the spark host on landing.
 *  26 sparks, random angle/distance/colour/shape, removed after 900ms.
 * ------------------------------------------------------------------ */

const ACCENT_VARS = ['--a1', '--a2', '--a3', '--a4'];

/** Fire the confetti burst into `host` (a positioned .spark-host node). */
export function fireSparks(host) {
  if (!host) return;
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    const ang = (Math.PI * 2 * i) / 26 + Math.random();
    const dist = 120 + Math.random() * 180; // 120-300px
    s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
    s.style.background = `var(${ACCENT_VARS[i % ACCENT_VARS.length]})`;
    s.style.width = s.style.height = 8 + Math.random() * 8 + 'px'; // 8-16px
    s.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    host.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}
