'use strict';
// Shared look and elements of the chemistry book (natural resources): colours with a meaning, seeded scatter,
// rocks, icons and labels. Load right after engine.js. Everything is deterministic (seeded) so that seeking
// to any beat time shows the same picture.

/* what each colour means in this book */
const NAT = {
  steen: '#cdb99a', steenD: '#8f7d62',      // gesteente(fragmenten)
  water: '#6ab7f0', waterD: '#2f7fc0',       // water
  bio: '#8fd68a', bioD: '#4f9a52',           // organisch materiaal, planten
  lucht: '#dbe8ef',                          // lucht
  fossiel: '#e0955a', fossielD: '#8a4f25',   // fossiel organisch materiaal, brandstoffen
  magma: '#f2683c',                          // gesmolten gesteente
  aarde: '#7a5a3f', aardeD: '#4b3626',       // bodem
  zwart: '#2b2623', erts: '#d9b24c', zon: '#f3d35c',
};

const nrng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

/* n circles with radii in [r0, r1] inside rect {x,y,w,h}, none overlapping the ones already in `placed` */
function nscatter(rect, n, r0, r1, seed, placed = [], gap = 4) {
  const rnd = nrng(seed), got = [];
  for (let tries = 0; got.length < n && tries < n * 60; tries++) {
    const r = r0 + (r1 - r0) * rnd();
    const x = rect.x + r + rnd() * (rect.w - 2 * r), y = rect.y + r + rnd() * (rect.h - 2 * r);
    if (placed.every(c => Math.hypot(c.x - x, c.y - y) > c.r + r + gap)) { const c = { x, y, r }; placed.push(c); got.push(c); }
  }
  return got;
}

/* a rounded irregular blob, as a path around (0,0): rx, ry radii, jitter 0..1 */
function nblob(rx, ry, seed, jitter = .22, pts = 9) {
  const rnd = nrng(seed), v = [];
  for (let i = 0; i < pts; i++) {
    const a = i / pts * Math.PI * 2, k = 1 - jitter + jitter * rnd();
    v.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = n => n.toFixed(1);
  let d = `M${f(mid(v[pts - 1], v[0])[0])} ${f(mid(v[pts - 1], v[0])[1])}`;
  for (let i = 0; i < pts; i++) { const m = mid(v[i], v[(i + 1) % pts]); d += `Q${f(v[i][0])} ${f(v[i][1])} ${f(m[0])} ${f(m[1])}`; }
  return d + 'Z';
}

/* a label pill centred on (x, y) */
function npill(p, str, { x = 0, y = 0, size = 30, color = COL.chalk, fill = COL.board, o = 1, weight = 600 } = {}) {
  const g = G(p, { x, y, o });
  const w = uiW(str, size) + 38, hh = size * 1.7;
  mk('rect', { x: -w / 2, y: -hh / 2, width: w, height: hh, rx: hh / 2, fill, stroke: color, 'stroke-width': 2.5 }, g);
  T(g, str, { x: 0, y: size * .36, size, fill: color, weight, anchor: 'middle' });
  g._w = w;
  return g;
}

/* a square bracket from y0 to y1 at x; dir -1 opens to the left, 1 to the right */
const nbracket = (p, x, y0, y1, dir, color, o = {}) =>
  path(p, `M${x - dir * 14} ${y0}H${x}V${y1}H${x - dir * 14}`, { stroke: color, 'stroke-width': 5 }, { d: 0, ...o });

/* a teardrop centred at (0,0) of height ~size */
const ndropPath = s => `M0 ${-s * .62}C${s * .3} ${-s * .2} ${s * .42} ${s * .06} ${s * .42} ${s * .2}A${s * .42} ${s * .42} 0 0 1 ${-s * .42} ${s * .2}C${-s * .42} ${s * .06} ${-s * .3} ${-s * .2} 0 ${-s * .62}Z`;
function ndrop(p, s, o = {}) {
  const g = G(p, o);
  mk('path', { d: ndropPath(s), fill: NAT.water, stroke: NAT.waterD, 'stroke-width': 2 }, g);
  mk('path', { d: `M${-s * .17} ${s * .12}Q${-s * .2} ${s * .26} ${-s * .06} ${s * .32}`, fill: 'none', stroke: '#e8f5ff', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, g);
  return g;
}

/* a tree about h px tall, base at (0,0) */
function ntree(p, h, o = {}) {
  const g = G(p, o);
  mk('rect', { x: -h * .05, y: -h * .45, width: h * .1, height: h * .45, fill: '#7a5a3f' }, g);
  mk('circle', { cx: 0, cy: -h * .62, r: h * .3, fill: NAT.bioD }, g);
  mk('circle', { cx: -h * .16, cy: -h * .5, r: h * .2, fill: '#5fae60' }, g);
  mk('circle', { cx: h * .14, cy: -h * .72, r: h * .19, fill: '#5fae60' }, g);
  return g;
}

/* grass tufts along y from x0 to x1 */
function ngrass(p, x0, x1, y, seed, color = NAT.bio) {
  const rnd = nrng(seed), g = G(p);
  for (let x = x0 + 10; x < x1 - 6; x += 22 + rnd() * 22) {
    const h = 12 + rnd() * 12;
    mk('path', { d: `M${x - 6} ${y}Q${x - 4} ${y - h * .6} ${x - 9} ${y - h}M${x} ${y}Q${x} ${y - h * .7} ${x} ${y - h * 1.1}M${x + 6} ${y}Q${x + 4} ${y - h * .6} ${x + 9} ${y - h}`, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  }
  return g;
}

/* the six rocks of the chapter, drawn around (0,0), about 2r wide */
const ROCKS = {
  basalt:    { fill: '#4a4d52', edge: '#2d2f33', tex: 'holes' },
  graniet:   { fill: '#c9c4bd', edge: '#8c867e', tex: 'speckle' },
  zandsteen: { fill: '#c99a5e', edge: '#8f6a38', tex: 'strata' },
  kalksteen: { fill: '#e6dcc4', edge: '#b3a687', tex: 'pores' },
  marmer:    { fill: '#eeeeea', edge: '#a9a9a2', tex: 'veins' },
  leisteen:  { fill: '#3b4047', edge: '#22262b', tex: 'slate' },
};
function nrock(p, kind, r, o = {}) {
  const R = ROCKS[kind], g = G(p, o), rnd = nrng(kind.length * 977 + kind.charCodeAt(0));
  mk('path', { d: nblob(r, r * .72, kind.length * 31 + kind.charCodeAt(1), .2, 9), fill: R.fill, stroke: R.edge, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  const pt = () => { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * .62; return [Math.cos(a) * r * d, Math.sin(a) * r * .72 * d]; };
  const t = R.tex;
  if (t === 'speckle') for (let i = 0; i < 34; i++) { const [x, y] = pt(); mk('rect', { x, y, width: 4 + rnd() * 5, height: 4 + rnd() * 4, fill: ['#5b5651', '#d7a3a0', '#fff', '#3d3a37'][i % 4] }, g); }
  if (t === 'holes') for (let i = 0; i < 9; i++) { const [x, y] = pt(); mk('circle', { cx: x, cy: y, r: 2 + rnd() * 3, fill: '#2a2c2f' }, g); }
  if (t === 'strata') for (let i = -2; i <= 2; i++) mk('path', { d: `M${-r * .6} ${i * r * .17}Q0 ${i * r * .17 + 8} ${r * .6} ${i * r * .17 - 3}`, fill: 'none', stroke: R.edge, 'stroke-width': 3, opacity: .7 }, g);
  if (t === 'pores') for (let i = 0; i < 16; i++) { const [x, y] = pt(); mk('circle', { cx: x, cy: y, r: 2 + rnd() * 4, fill: '#bfb293' }, g); }
  if (t === 'veins') { mk('path', { d: `M${-r * .55} ${-r * .2}C${-r * .2} ${-r * .05} ${r * .1} ${-r * .4} ${r * .5} ${-r * .1}`, fill: 'none', stroke: '#8d8d88', 'stroke-width': 3 }, g); mk('path', { d: `M${-r * .4} ${r * .3}C${-r * .1} ${r * .15} ${r * .2} ${r * .4} ${r * .55} ${r * .22}`, fill: 'none', stroke: '#b4b4ae', 'stroke-width': 2.5 }, g); }
  if (t === 'slate') for (let i = -3; i <= 3; i++) mk('path', { d: `M${-r * .62} ${i * r * .13 + 6}L${r * .62} ${i * r * .13 - 10}`, fill: 'none', stroke: '#575d66', 'stroke-width': 2.5 }, g);
  return g;
}

/* icons, drawn around (0,0) inside about ±58 px */
const ICONS = {
  water(g) { mk('path', { d: ndropPath(110), fill: NAT.water, stroke: NAT.waterD, 'stroke-width': 3 }, g); mk('path', { d: 'M-20 14Q-22 30 -8 36', fill: 'none', stroke: '#e8f5ff', 'stroke-width': 5, 'stroke-linecap': 'round' }, g); },
  gesteenten(g) {
    [[-34, 20], [4, 20], [-14, -8], [24, -8], [-34, -36], [4, -36]].forEach(([x, y], i) => mk('rect', { x: x - 22, y: y - 12, width: 44, height: 24, rx: 3, fill: i % 2 ? NAT.steen : '#b8a380', stroke: NAT.steenD, 'stroke-width': 2.5 }, g));
  },
  ertsen(g) {
    mk('path', { d: nblob(54, 42, 7, .18, 8), fill: '#7d7a76', stroke: '#4b4946', 'stroke-width': 3 }, g);
    [[-20, -8, 14], [12, -16, 11], [18, 14, 15], [-10, 16, 10]].forEach(([x, y, s]) => mk('rect', { x, y, width: s, height: s * .8, rx: 2, fill: NAT.erts, stroke: '#a07f20', 'stroke-width': 1.5, transform: `rotate(${x * 3} ${x} ${y})` }, g));
  },
  steenkool(g) {
    [[-22, 14, 30], [20, 16, 27], [0, -12, 30], [-30, -16, 20], [30, -14, 20]].forEach(([x, y, r], i) => {
      const e = G(g, { x, y }); mk('path', { d: nblob(r, r * .8, 40 + i, .3, 7), fill: '#2f2c2b', stroke: '#6b6562', 'stroke-width': 2.5 }, e);
      mk('path', { d: `M${-r * .4} ${-r * .3}L${-r * .1} ${-r * .5}`, stroke: '#9a948f', 'stroke-width': 3, 'stroke-linecap': 'round' }, e);
    });
  },
  aardolie(g) {
    mk('path', { d: ndropPath(110), fill: '#2e2118', stroke: NAT.fossiel, 'stroke-width': 3.5 }, g);
    mk('path', { d: 'M-20 14Q-22 30 -8 36', fill: 'none', stroke: '#b9855a', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  },
  aardgas(g) {
    mk('path', { d: 'M0 -56C14 -32 40 -20 40 10C40 36 22 50 0 50C-22 50 -40 36 -40 12C-40 -6 -28 -16 -22 -30C-14 -18 -8 -14 -6 -6C4 -22 0 -40 0 -56Z', fill: '#f2683c', stroke: '#f5b942', 'stroke-width': 3 }, g);
    mk('path', { d: 'M0 -6C10 6 22 14 22 28C22 40 12 46 0 46C-12 46 -22 40 -22 28C-22 16 -8 10 0 -6Z', fill: '#f9d65c' }, g);
  },
  hout(g) {
    mk('ellipse', { cx: 0, cy: 0, rx: 52, ry: 52, fill: '#a9784a', stroke: '#6b4a2b', 'stroke-width': 4 }, g);
    [38, 26, 14, 4].forEach(r => mk('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: '#6b4a2b', 'stroke-width': 2.5, opacity: .8 }, g));
  },
  bodem(g) {
    mk('path', { d: 'M-56 34C-40 6 40 6 56 34Z', fill: NAT.aarde, stroke: NAT.aardeD, 'stroke-width': 3 }, g);
    mk('path', { d: 'M0 14V-30', stroke: NAT.bioD, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    mk('path', { d: 'M0 -14C-24 -14 -34 -30 -34 -44C-12 -44 0 -32 0 -14Z', fill: NAT.bio, stroke: NAT.bioD, 'stroke-width': 3 }, g);
    mk('path', { d: 'M0 -26C24 -26 34 -42 34 -56C12 -56 0 -44 0 -26Z', fill: NAT.bio, stroke: NAT.bioD, 'stroke-width': 3 }, g);
  },
  energie(g) {
    mk('circle', { cx: -26, cy: -24, r: 17, fill: NAT.zon }, g);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; mk('path', { d: `M${-26 + Math.cos(a) * 24} ${-24 + Math.sin(a) * 24}L${-26 + Math.cos(a) * 34} ${-24 + Math.sin(a) * 34}`, stroke: NAT.zon, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g); }
    mk('path', { d: 'M17 58L23 -2H29L35 58Z', fill: '#e8eef0' }, g);
    const bl = G(g, { x: 26, y: -4 }); g._rot = bl;
    [0, 120, 240].forEach(a => mk('path', { d: 'M0 0L-6 -38Q0 -44 6 -38Z', fill: '#f2f6f8', stroke: '#9fb0b8', 'stroke-width': 1.5, transform: `rotate(${a + 20})` }, bl));
    mk('circle', { cx: 26, cy: -4, r: 6, fill: '#cbd7db', stroke: '#9fb0b8', 'stroke-width': 1.5 }, g);
  },
  ondergrond(g) {
    [[-26, '#9a8466'], [-6, NAT.waterD], [14, NAT.fossielD]].forEach(([y, c]) => mk('rect', { x: -52, y, width: 104, height: 20, fill: c }, g));
    mk('rect', { x: -52, y: -46, width: 104, height: 20, fill: NAT.aarde }, g);
    mk('path', { d: 'M-52 -46H52', stroke: NAT.bio, 'stroke-width': 5 }, g);
  },
  lucht(g) {
    [-24, 0, 24].forEach((y, i) => mk('path', { d: `M${-44 + i * 6} ${y}H${14 + i * 8}C${34 + i * 8} ${y} ${34 + i * 8} ${y - 18} ${18 + i * 8} ${y - 18}`, fill: 'none', stroke: NAT.lucht, 'stroke-width': 6, 'stroke-linecap': 'round' }, g));
  },
  organismen(g) {
    mk('path', { d: 'M0 50C-50 30 -52 -26 0 -52C52 -26 50 30 0 50Z', fill: NAT.bio, stroke: NAT.bioD, 'stroke-width': 4 }, g);
    mk('path', { d: 'M0 50V-30M0 8L-22 -10M0 -8L22 -26', fill: 'none', stroke: NAT.bioD, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
  },
};
function nicon(p, name, o = {}) { const g = G(p, o); ICONS[name](g); return g; }
