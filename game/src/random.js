// Warung Kilat — a tiny seeded random generator (mulberry32) so a screenshot seed
// always stages the same kitchen, and gameplay can roll fresh orders.
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `list` with the seeded random. */
export function pickRandom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** Fisher-Yates shuffle of a copy of `list`, with the seeded random. */
export function shuffleRandom(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
