/* Vernier caliper · volume and density of a rectangular block — lesson app (no dependencies) */
(function () {
  'use strict';

  /* =====================================================================
     1. CONSTANTS + HELPERS
     ===================================================================== */
  const MSD = 0.1, NV = 10, LC = 0.01, RANGE = 15;          // cm, divisions, cm, cm
  /* Example: aluminium block, zero error nil */
  const EX = { l: { msr: 6.2, vsr: 4 }, b: { msr: 3.5, vsr: 2 }, h: { msr: 2.1, vsr: 8 }, m: 129.30 };
  ['l', 'b', 'h'].forEach(k => { EX[k].tot = +(EX[k].msr + EX[k].vsr * LC).toFixed(2); });
  EX.V = EX.l.tot * EX.b.tot * EX.h.tot;                     // 47.883…
  const DIMS = ['l', 'b', 'h'];
  const DIM_NAME = { l: 'Length (l)', b: 'Breadth (b)', h: 'Height (h)' };
  const DIM_WORD = { l: 'length', b: 'breadth', h: 'height' };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs) { const t = el('text', Object.assign({ x, y }, attrs || {}), parent); t.textContent = s; return t; }
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const r3 = v => Math.round(v * 1000) / 1000;
  function svgPoint(svg, e) {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function parseNum(s) { if (s == null) return NaN; s = String(s).trim().replace(',', '.').replace(/\s/g, ''); if (!s) return NaN; return Number(s); }
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  const near = (a, b, tol) => isFinite(a) && isFinite(b) && b !== 0 && rel(a, b) <= tol;
  function trueReading(x) {
    const xr = Math.round(x / LC) * LC;
    const msr = Math.floor(xr * 10 + 1e-6) / 10;
    const vsr = Math.round((xr - msr) / LC);
    return { msr: +msr.toFixed(1), vsr, tot: +(msr + vsr * LC).toFixed(2) };
  }
  const F_HEAD = 'Schibsted Grotesk, system-ui, sans-serif', F_MONO = 'DM Mono, ui-monospace, monospace', F_BODY = 'Plus Jakarta Sans, system-ui, sans-serif';
  const C = { ink: '#17202a', ink2: '#344150', muted: '#63707d', sig: '#2a4fd6', sig2: '#1c3aa8', lime: '#b4d235', lime2: '#5f7a0b', bad: '#b4412f' };

  /* shared gradients for the instrument, blocks and balance */
  function defsFor(svg, id) {
    const d = svg.querySelector('defs') || el('defs', null, svg);
    function lin(name, stops, x2, y2) {
      const g = el('linearGradient', { id: `${id}-${name}`, x1: 0, y1: 0, x2: x2 || 0, y2: y2 == null ? 1 : y2 }, d);
      stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));
    }
    lin('beam', [[0, '#f7f9fa'], [.18, '#dfe5ea'], [.55, '#eef2f5'], [.85, '#c9d2da'], [1, '#aeb9c3']]);
    lin('jaw', [[0, '#d9e0e6'], [.5, '#c3ccd4'], [1, '#a5b0bb']], 1, 0);
    lin('slide', [[0, '#e9eef2'], [.3, '#cdd5dc'], [.7, '#b9c3cc'], [1, '#98a4b0']]);
    lin('plate', [[0, '#fdfefe'], [.25, '#eef2f5'], [1, '#d4dbe1']]);
    lin('rod', [[0, '#eef2f5'], [.5, '#b8c2cb'], [1, '#8c98a4']]);
    lin('cap', [[0, '#3b4756'], [.5, '#6a7787'], [1, '#2a3440']], 1, 0);
    lin('wheel', [[0, '#5d6a79'], [.45, '#9aa7b4'], [1, '#3f4a57']], 1, 0);
    lin('bal', [[0, '#f5f7f9'], [1, '#ccd4db']]);
    lin('lcd', [[0, '#1f2b36'], [1, '#121a22']]);
    lin('tray', [[0, '#e3e9ed'], [1, '#c4cdd5']]);
    const p = el('pattern', { id: `${id}-knurl`, width: 3, height: 3, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 3, stroke: 'rgba(20,28,38,.35)', 'stroke-width': .9 }, p);
    el('line', { x1: 0, y1: 0, x2: 3, y2: 0, stroke: 'rgba(20,28,38,.22)', 'stroke-width': .9 }, p);
    const g1 = el('pattern', { id: `${id}-grain`, width: 60, height: 14, patternUnits: 'userSpaceOnUse' }, d);
    el('path', { d: 'M0 4 Q15 1 30 4 T60 4 M0 10 Q18 13 34 10 T60 10', fill: 'none', stroke: 'rgba(110,64,20,.22)', 'stroke-width': 1.1 }, g1);
    const g2 = el('pattern', { id: `${id}-brush`, width: 40, height: 4, patternUnits: 'userSpaceOnUse' }, d);
    el('line', { x1: 0, y1: 1, x2: 40, y2: 1, stroke: 'rgba(255,255,255,.35)', 'stroke-width': .8 }, g2);
    el('line', { x1: 6, y1: 3, x2: 30, y2: 3, stroke: 'rgba(60,72,86,.12)', 'stroke-width': .7 }, g2);
    const sh = el('filter', { id: `${id}-sh`, x: '-20%', y: '-20%', width: '140%', height: '160%' }, d);
    el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 3, 'flood-color': '#17202a', 'flood-opacity': .2 }, sh);
    return d;
  }

  /* =====================================================================
     2. THE INSTRUMENT — front view; opening x (cm) moves the sliding jaw
     ===================================================================== */
  function drawCaliper(root, o) {
    const id = o.id, S = o.S, AX = o.AX, BT = o.BT, range = o.range || RANGE;
    const bh = 1.25 * S, BB = BT + bh, X0 = AX + .82 * S;
    const beamL = AX - 1.4 * S, beamR = X0 + (range + .4) * S;
    const jl = o.jawLen || 4.6 * S;
    const sw = v => Math.max(.6, v);
    const g = el('g', { class: 'cal' }, root);
    // depth rod (comes out of the end of the beam)
    const rod = el('rect', { x: beamR - 2, y: BB - .2 * S, height: .09 * S, width: 2, fill: `url(#${id}-rod)`, stroke: '#6f7b87', 'stroke-width': .6 }, g);
    // fixed jaws
    el('path', { d: `M${beamL + .3 * S} ${BT} C${AX - .95 * S} ${BT - .5 * S} ${AX - .4 * S} ${BT - .85 * S} ${AX - .28 * S} ${BT - 1.15 * S} L${AX} ${BT - 1.15 * S} L${AX} ${BT}Z`, fill: `url(#${id}-jaw)`, stroke: '#6b7682', 'stroke-width': .8 }, g);
    el('path', { d: `M${beamL} ${BB - 2} H${AX} V${BB + jl - .22 * S} L${AX - .34 * S} ${BB + jl} C${AX - .95 * S} ${BB + jl * .62} ${beamL + .25 * S} ${BB + jl * .3} ${beamL} ${BB + .3 * S}Z`, fill: `url(#${id}-jaw)`, stroke: '#6b7682', 'stroke-width': .8, filter: o.shadow === false ? null : `url(#${id}-sh)` }, g);
    el('line', { x1: AX - .5, y1: BB + 2, x2: AX - .5, y2: BB + jl - .22 * S, stroke: 'rgba(255,255,255,.7)', 'stroke-width': 1 }, g);
    // beam with the main scale
    el('rect', { x: beamL, y: BT, width: beamR - beamL, height: bh, rx: .08 * S, fill: `url(#${id}-beam)`, stroke: '#7c8894', 'stroke-width': .9 }, g);
    el('line', { x1: beamL + 4, y1: BT + .55 * S, x2: beamR - 4, y2: BT + .55 * S, stroke: 'rgba(60,72,86,.18)', 'stroke-width': 1 }, g);
    const sc = el('g', { 'pointer-events': 'none' }, g);
    for (let j = 0; j <= range * 10; j++) {
      const X = X0 + j * MSD * S, len = (j % 10 === 0 ? .42 : j % 5 === 0 ? .3 : .2) * S;
      el('line', { x1: X, y1: BB, x2: X, y2: BB - len, stroke: C.ink, 'stroke-width': sw(.028 * S) }, sc);
      if (j % 10 === 0 && o.nums !== false) txt(sc, X, BB - .5 * S, String(j / 10), { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 600, 'font-size': .26 * S, fill: C.ink });
    }
    if (o.nums !== false) txt(sc, beamR - .3 * S, BT + .34 * S, 'cm', { 'text-anchor': 'end', 'font-family': F_HEAD, 'font-size': .22 * S, fill: C.muted });
    if (o.label !== false) {
      txt(sc, beamL + .25 * S, BT + .36 * S, '0–15 cm', { 'font-family': F_HEAD, 'font-weight': 700, 'font-size': .2 * S, fill: C.ink2 });
      txt(sc, beamL + .25 * S, BT + .62 * S, '0.01 cm', { 'font-family': F_MONO, 'font-size': .18 * S, fill: C.sig2 });
    }
    // sliding jaw assembly (drawn at x = 0, then translated)
    const sl = el('g', { class: 'slider' }, g);
    const jawUp = el('path', { d: `M${AX + 1.1 * S} ${BT} C${AX + .95 * S} ${BT - .5 * S} ${AX + .4 * S} ${BT - .85 * S} ${AX + .28 * S} ${BT - 1.15 * S} L${AX} ${BT - 1.15 * S} L${AX} ${BT}Z`, fill: `url(#${id}-jaw)`, stroke: '#6b7682', 'stroke-width': .8 }, sl);
    const jawLo = el('path', { d: `M${AX} ${BB - 2} H${AX + 1.5 * S} V${BB + .3 * S} C${AX + 1.3 * S} ${BB + jl * .3} ${AX + .95 * S} ${BB + jl * .62} ${AX + .34 * S} ${BB + jl} L${AX} ${BB + jl - .22 * S}Z`, fill: `url(#${id}-jaw)`, stroke: '#6b7682', 'stroke-width': .8, filter: o.shadow === false ? null : `url(#${id}-sh)` }, sl);
    el('line', { x1: AX + .5, y1: BB + 2, x2: AX + .5, y2: BB + jl - .22 * S, stroke: 'rgba(40,52,64,.35)', 'stroke-width': 1 }, sl);
    const body = el('g', { class: 'slider-body' }, sl);
    el('rect', { x: AX - .1 * S, y: BT - .24 * S, width: 3.1 * S, height: .34 * S, rx: .06 * S, fill: `url(#${id}-slide)`, stroke: '#6b7682', 'stroke-width': .8 }, body);
    el('rect', { x: AX - .1 * S, y: BT - .24 * S, width: .6 * S, height: bh + .96 * S, rx: .06 * S, fill: `url(#${id}-slide)`, stroke: '#6b7682', 'stroke-width': .8 }, body);
    el('rect', { x: AX + 2.5 * S, y: BT - .24 * S, width: .5 * S, height: bh + .34 * S, rx: .06 * S, fill: `url(#${id}-slide)`, stroke: '#6b7682', 'stroke-width': .8 }, body);
    // the window over the beam still belongs to the slider for grabbing
    el('rect', { x: AX + .5 * S, y: BT, width: 2.0 * S, height: bh, fill: 'transparent', 'pointer-events': 'all' }, body);
    // vernier plate: its top edge sits on the main scale
    el('rect', { x: AX + .5 * S, y: BB - .05 * S, width: 2.0 * S, height: .77 * S, fill: `url(#${id}-plate)`, stroke: '#7c8894', 'stroke-width': .8 }, body);
    el('line', { x1: AX + .5 * S, y1: BB - .05 * S, x2: AX + 2.5 * S, y2: BB - .05 * S, stroke: '#fff', 'stroke-width': 1.2 }, body);
    for (let k = 0; k <= NV; k++) {
      const X = X0 + k * .09 * S, len = (k % 5 === 0 ? .32 : .21) * S;
      el('line', { x1: X, y1: BB - .03 * S, x2: X, y2: BB + len, stroke: C.ink, 'stroke-width': sw(.026 * S) }, body);
      if (o.nums !== false && k % 5 === 0) txt(body, X, BB + .56 * S, String(k), { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 600, 'font-size': .2 * S, fill: C.ink });
    }
    // locking screw on the top rail
    const lx = AX + 1.45 * S;
    const lockG = el('g', { class: 'lock-g' }, sl);
    const lockMove = el('g', null, lockG);
    el('rect', { x: lx - .07 * S, y: BT - .55 * S, width: .14 * S, height: .32 * S, fill: '#8a96a2' }, lockMove);
    el('rect', { x: lx - .3 * S, y: BT - .86 * S, width: .6 * S, height: .34 * S, rx: .07 * S, fill: `url(#${id}-cap)`, stroke: '#1e2731', 'stroke-width': .7 }, lockMove);
    el('rect', { x: lx - .3 * S, y: BT - .86 * S, width: .6 * S, height: .34 * S, rx: .07 * S, fill: `url(#${id}-knurl)` }, lockMove);
    const lockDot = el('circle', { cx: lx, cy: BT - .98 * S, r: .07 * S, fill: '#c9d1d8' }, lockG);
    // thumb wheel under the right end of the slider, rolling on the beam
    const wx = AX + 2.78 * S, wy = BB + .36 * S, wr = .32 * S;
    const wheelG = el('g', { class: 'wheel-g' }, sl);
    el('rect', { x: wx - .1 * S, y: BB - .02 * S, width: .2 * S, height: .4 * S, fill: '#7d8994' }, wheelG);
    el('circle', { cx: wx, cy: wy, r: wr, fill: `url(#${id}-wheel)`, stroke: '#26303a', 'stroke-width': .8 }, wheelG);
    const wTeeth = el('g', null, wheelG);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; el('line', { x1: wx + Math.cos(a) * wr * .62, y1: wy + Math.sin(a) * wr * .62, x2: wx + Math.cos(a) * wr * .97, y2: wy + Math.sin(a) * wr * .97, stroke: 'rgba(15,20,26,.55)', 'stroke-width': sw(.03 * S) }, wTeeth); }
    el('circle', { cx: wx, cy: wy, r: wr * .22, fill: '#c9d1d8', stroke: '#26303a', 'stroke-width': .6 }, wheelG);
    function set(x) {
      sl.setAttribute('transform', `translate(${(x * S).toFixed(2)} 0)`);
      rod.setAttribute('width', Math.max(2, x * S + 2));
      wTeeth.setAttribute('transform', `rotate(${(-x * S / wr * 180 / Math.PI).toFixed(1)} ${wx} ${wy})`);
    }
    function setLock(on) { lockMove.setAttribute('transform', on ? `translate(0 ${.07 * S})` : ''); lockDot.setAttribute('fill', on ? C.lime : '#c9d1d8'); }
    set(o.x || 0);
    return { g, sl, body, jawLo, jawUp, lockG, wheelG, set, setLock, geom: { S, AX, BT, BB, bh, X0, beamL, beamR, jl, lx, wx, wy, wr } };
  }

  /* close-up of the reading area: main scale above, vernier below, centred on the vernier */
  function drawScale(svg, o) {
    const W = 1000, H = 300, Sm = o.Sm || 600, VZ = o.vz == null ? 380 : o.vz, cy = 150;
    const id = o.id;
    const d = defsFor(svg, id);
    const cp = el('clipPath', { id: `${id}-clip` }, d); el('rect', { x: 0, y: 0, width: W, height: H, rx: 12 }, cp);
    const root = el('g', { 'clip-path': `url(#${id}-clip)` }, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#eef2f4' }, root);
    el('rect', { x: 0, y: 22, width: W, height: cy - 22, fill: `url(#${id}-beam)` }, root);
    const main = el('g', null, root);
    const vg = el('g', { class: 'mag-drag' }, root);
    el('rect', { x: VZ - 150, y: cy - 4, width: 0.9 * Sm + 300, height: 124, fill: `url(#${id}-plate)`, stroke: '#8a96a2', 'stroke-width': 1.2 }, vg);
    el('line', { x1: VZ - 150, y1: cy - 4, x2: VZ + .9 * Sm + 150, y2: cy - 4, stroke: '#fff', 'stroke-width': 2 }, vg);
    for (let k = 0; k <= NV; k++) {
      const X = VZ + k * .09 * Sm, big = k % 5 === 0;
      el('line', { x1: X, y1: cy - 3, x2: X, y2: cy + (big ? 52 : 36), stroke: C.ink, 'stroke-width': 2.4 }, vg);
      txt(vg, X, cy + 84, String(k), { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-size': big ? 25 : 20, 'font-weight': big ? 700 : 500, fill: big ? C.ink : C.ink2 });
    }
    const hiG = el('g', { 'pointer-events': 'none' }, root);
    let lastX = 0, hiKind = null;
    function set(x) {
      lastX = x; main.innerHTML = '';
      const pmin = x - VZ / Sm - .2, pmax = x + (W - VZ) / Sm + .2;
      for (let j = Math.max(0, Math.ceil(pmin * 10)); j / 10 <= Math.min(pmax, RANGE + .5); j++) {
        const X = VZ + (j / 10 - x) * Sm, len = j % 10 === 0 ? 70 : j % 5 === 0 ? 52 : 36;
        el('line', { x1: X, y1: cy - 4, x2: X, y2: cy - 4 - len, stroke: C.ink, 'stroke-width': 2.4 }, main);
        if (j % 10 === 0) txt(main, X, cy - 86, String(j / 10), { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-size': 30, 'font-weight': 700, fill: C.ink });
      }
      if (hiKind) hi(hiKind);
    }
    function pill(x, y, s) {
      const w = Math.max(150, s.length * 11.5 + 30);
      el('rect', { x: x - w / 2, y: y - 22, width: w, height: 36, rx: 9, fill: C.ink }, hiG);
      txt(hiG, x, y + 3, s, { 'text-anchor': 'middle', 'font-family': F_MONO, 'font-size': 18, fill: '#e4ff8a' });
    }
    function hi(kind) {
      hiKind = kind; hiG.innerHTML = '';
      if (!kind) return;
      const x = lastX, tr = trueReading(Math.max(0, x));
      if (kind === 'msr') {
        const X = VZ + (tr.msr - x) * Sm;
        el('rect', { x: X - 16, y: cy - 82, width: VZ - X + 30, height: 150, rx: 10, fill: 'rgba(42,79,214,.08)', stroke: C.sig, 'stroke-width': 2.5 }, hiG);
        el('line', { x1: X, y1: cy - 82, x2: X, y2: cy - 4, stroke: C.sig, 'stroke-width': 4 }, hiG);
        pill(clamp(X + 40, 100, W - 120), H - 18, `MSR = ${tr.msr.toFixed(1)} cm`);
      } else if (kind === 'vsr' || kind === 'zero') {
        const k = kind === 'zero' ? 0 : tr.vsr, X = VZ + k * .09 * Sm;
        el('rect', { x: X - 15, y: cy - 60, width: 30, height: 120, rx: 9, fill: 'rgba(180,210,53,.28)', stroke: C.lime2, 'stroke-width': 2.5 }, hiG);
        pill(clamp(X, 100, W - 120), H - 18, kind === 'zero' ? 'vernier 0 on main 0 · nil' : `VSR = ${tr.vsr} div`);
      }
    }
    set(o.x || 0);
    return { set, hi, vg, root, geom: { VZ, Sm, cy, W, H } };
  }

  /* rectangular block, oblique view; anchor = bottom-left corner of the front face */
  const MAT = {
    al: { name: 'aluminium', rho: 2.70, f: '#c7d0d8', t: '#e5eaee', s: '#a4afba', st: '#6f7b87', tex: 'brush' },
    oak: { name: 'oak', rho: 0.75, f: '#c99a5f', t: '#dcb27a', s: '#a57743', st: '#7b5329', tex: 'grain' },
    brass: { name: 'brass', rho: 8.50, f: '#d3ae4e', t: '#ead07f', s: '#a8862e', st: '#7a5f17', tex: 'brush' },
    acr: { name: 'acrylic', rho: 1.18, f: 'rgba(160,205,236,.62)', t: 'rgba(205,232,250,.72)', s: 'rgba(120,175,214,.62)', st: '#5c8db3', tex: null }
  };
  function drawBlock(parent, id, mat, n) {
    const g = el('g', { class: 'blk' }, parent);
    const inner = el('g', null, g);
    const M = MAT[mat];
    const top = el('path', { fill: M.t, stroke: M.st, 'stroke-width': 1, 'stroke-linejoin': 'round' }, inner);
    const side = el('path', { fill: M.s, stroke: M.st, 'stroke-width': 1, 'stroke-linejoin': 'round' }, inner);
    const front = el('rect', { fill: M.f, stroke: M.st, 'stroke-width': 1.1 }, inner);
    const tex = M.tex ? el('rect', { fill: `url(#${id}-${M.tex})`, 'pointer-events': 'none' }, inner) : null;
    const hl = el('path', { fill: 'none', stroke: 'rgba(255,255,255,.65)', 'stroke-width': 1.2 }, inner);
    const tag = el('g', null, inner);
    const tagC = el('circle', { r: 11, fill: C.ink }, tag);
    const tagT = txt(tag, 0, 4.5, n == null ? '' : String(n), { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 700, 'font-size': 13, fill: '#fff' });
    if (n == null) tag.style.display = 'none';
    function shape(w, h, dpt, k) {
      const dx = dpt * .3, dy = dpt * .22;
      top.setAttribute('d', `M0 ${-h} L${dx} ${-h - dy} H${w + dx} L${w} ${-h}Z`);
      side.setAttribute('d', `M${w} ${-h} L${w + dx} ${-h - dy} V${-dy} L${w} 0Z`);
      front.setAttribute('x', 0); front.setAttribute('y', -h); front.setAttribute('width', Math.max(0, w)); front.setAttribute('height', h);
      if (tex) { tex.setAttribute('x', 0); tex.setAttribute('y', -h); tex.setAttribute('width', Math.max(0, w)); tex.setAttribute('height', h); }
      hl.setAttribute('d', `M1 ${-1} V${-h + 1} H${Math.max(1, w - 1)}`);
      const ks = 1 / (k || 1);
      tag.setAttribute('transform', `translate(${w / 2} ${-h / 2}) scale(${ks.toFixed(3)})`);
      tag.style.opacity = w > 26 ? 1 : 0;
    }
    return { g, inner, shape, tagC, tagT };
  }

  /* =====================================================================
     3. BACKGROUND — faint vernier scales sliding into alignment
     ===================================================================== */
  (function background() {
    const cv = $('bg'), ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const bands = [];
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bands.length = 0;
      const spec = [[.13, -.05, 15, 6], [.34, .03, 22, -4], [.56, -.02, 12, 5], [.74, .045, 18, -7], [.92, -.03, 26, 3]];
      spec.forEach(([fy, ang, p, drift], i) => bands.push({ fy, ang, p, drift, pos: 8 + i * 9.3, from: 8 + i * 9.3, to: 8 + i * 9.3, t0: -10 - i * 1.7, dur: 2.6 + i * .3, hold: 3.2 + i * .45, cx: .2 + ((i * .37) % .6) }));
    }
    function retarget(B, t) {
      B.from = B.pos; B.t0 = t;
      const span = Math.max(20, W / B.p);
      let to = B.from + (Math.random() < .5 ? -1 : 1) * (3 + Math.random() * 9);
      to = clamp(to, 2, span * .75);
      B.to = Math.round(to * 10) / 10;
    }
    function drawBand(B, t) {
      const len = Math.hypot(W, H) * 1.3, p = B.p;
      let k = (t - B.t0) / B.dur;
      if (k >= 1 + B.hold / B.dur) { retarget(B, t); k = 0; }
      const e = k >= 1 ? 1 : (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
      B.pos = B.from + (B.to - B.from) * e;
      const settle = k >= 1 ? Math.min(1, (k - 1) * B.dur / .5) * Math.max(0, 1 - Math.max(0, (k - 1) * B.dur - B.hold + .8) / .8) : 0;
      ctx.save(); ctx.translate(W * B.cx, B.fy * H); ctx.rotate(B.ang);
      const shift = ((B.drift * t) % p + p) % p;
      const x0 = -len / 2 - ((-len / 2) % p) + shift - p;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0); ctx.strokeStyle = 'rgba(52,65,80,.08)'; ctx.stroke();
      ctx.beginPath();
      for (let x = x0, j = Math.round(x0 / p); x < len / 2; x += p, j++) {
        const L = j % 10 === 0 ? 13 : j % 5 === 0 ? 9 : 6;
        ctx.moveTo(x, 0); ctx.lineTo(x, -L);
      }
      ctx.strokeStyle = 'rgba(52,65,80,.13)'; ctx.stroke();
      // vernier: 10 divisions spanning 9 main divisions
      const base = -W * B.cx + B.pos * p + shift;
      ctx.fillStyle = 'rgba(42,79,214,.035)';
      ctx.fillRect(base - p * .8, 1, p * 10.6, 17);
      ctx.beginPath();
      for (let kk = 0; kk <= 10; kk++) { const X = base + kk * .9 * p; ctx.moveTo(X, 1); ctx.lineTo(X, kk % 5 === 0 ? 13 : 9); }
      ctx.strokeStyle = 'rgba(42,79,214,.17)'; ctx.stroke();
      const frac = B.pos - Math.floor(B.pos), kc = Math.round(frac * 10) % 10;
      if (settle > .01) {
        const X = base + kc * .9 * p;
        ctx.beginPath(); ctx.moveTo(X, -14); ctx.lineTo(X, 15);
        ctx.strokeStyle = `rgba(150,180,30,${(.55 * settle).toFixed(3)})`; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(X, -18, 2.6, 0, 6.2832); ctx.fillStyle = `rgba(150,180,30,${(.5 * settle).toFixed(3)})`; ctx.fill();
      }
      ctx.restore();
    }
    const t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      bands.forEach(B => drawBand(B, t));
      if (!reduced) requestAnimationFrame(frame);
    }
    window.addEventListener('resize', () => { size(); if (reduced) frame(performance.now()); });
    size(); requestAnimationFrame(frame);
  })();

  /* =====================================================================
     4. NAVIGATION + CALIPER RAIL
     ===================================================================== */
  const views = Array.from(document.querySelectorAll('.view'));
  const ids = views.map(v => v.id.replace('view-', ''));
  const nav = $('rail-nav'), railFill = $('rail-fill'), railSl = $('rail-slider'), btnPrev = $('btn-prev');
  const items = views.map((v, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rail-item';
    b.innerHTML = `<span>${v.dataset.title}</span>`;
    b.addEventListener('click', () => goTo(i, true));
    nav.appendChild(b);
    return b;
  });
  let current = -1;
  const onEnter = {}, onLeave = {};
  function fillRail() {
    const it = items[current]; if (!it) return;
    const mobile = window.matchMedia('(max-width:980px)').matches;
    const beam = railFill.parentElement;
    if (mobile) {
      beam.style.setProperty('--fillw', ((current + .5) / items.length * 100) + '%');
      railFill.style.height = ''; railSl.style.top = '';
    } else {
      const tb = beam.getBoundingClientRect(), ib = it.getBoundingClientRect();
      const y = clamp(ib.top + ib.height / 2 - tb.top, 0, 2000);
      railFill.style.height = y + 'px'; railSl.style.top = y + 'px';
    }
  }
  function goTo(i, push) {
    i = clamp(i, 0, views.length - 1);
    if (i === current) return;
    if (current >= 0 && onLeave[ids[current]]) onLeave[ids[current]]();
    current = i;
    views.forEach((v, k) => v.classList.toggle('active', k === i));
    items.forEach((b, k) => {
      b.classList.toggle('current', k === i); b.classList.toggle('done', k < i);
      if (k === i) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    btnPrev.hidden = i === 0;
    document.querySelector('.stage-top').style.maxWidth = views[i].querySelector('.sheet.wide') ? '1280px' : '';
    requestAnimationFrame(() => {
      fillRail();
      if (window.matchMedia('(max-width:980px)').matches) items[i].scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    if (push && location.hash !== '#' + ids[i]) history.pushState(null, '', '#' + ids[i]);
    window.scrollTo({ top: 0 });
    document.title = views[i].dataset.title.replace('&amp;', '&') + ' · Vernier caliper';
    if (onEnter[ids[i]]) onEnter[ids[i]]();
  }
  window.addEventListener('resize', () => requestAnimationFrame(fillRail));
  btnPrev.addEventListener('click', () => goTo(current - 1, true));
  document.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => goTo(current + 1, true)));
  function fromHash() { const k = ids.indexOf(location.hash.replace('#', '')); return k < 0 ? 0 : k; }
  window.addEventListener('popstate', () => goTo(fromHash(), false));
  window.addEventListener('hashchange', () => goTo(fromHash(), false));

  /* =====================================================================
     5. CUSTOM CURSOR — tiny caliper jaws; the gap is the hotspot
     ===================================================================== */
  const cur = $('cursor');
  if (window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('mousemove', e => {
      if (!document.body.classList.contains('has-cursor')) document.body.classList.add('has-cursor');
      cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      cur.classList.remove('hidden');
      const t = e.target && e.target.closest ? e.target : null;
      const grab = t && t.closest('.grab-t, .blk.free, .mag-drag');
      const hot = t && t.closest('button:not(:disabled), a, select, label, input[type=range], .live, .knob-t');
      cur.classList.toggle('grab', !!grab);
      cur.classList.toggle('hot', !!hot && !grab);
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.add('hidden'));
    window.addEventListener('blur', () => cur.classList.add('hidden'));
  }

  /* shared bench pieces */
  function drawBalance(parent, id, cx, by) {
    const g = el('g', { class: 'balance' }, parent);
    el('path', { d: `M${cx - 150} ${by} L${cx - 134} ${by - 84} H${cx + 134} L${cx + 150} ${by} Z`, fill: `url(#${id}-bal)`, stroke: '#8b97a3', 'stroke-width': 1.2, filter: `url(#${id}-sh)` }, g);
    el('rect', { x: cx - 154, y: by - 4, width: 308, height: 8, rx: 3, fill: '#a9b4be' }, g);
    el('rect', { x: cx - 56, y: by - 66, width: 150, height: 44, rx: 6, fill: `url(#${id}-lcd)`, stroke: '#0c1117' }, g);
    const disp = txt(g, cx + 70, by - 34, '0.00', { 'text-anchor': 'end', 'font-family': F_MONO, 'font-size': 27, 'font-weight': 500, fill: '#c9ec5a' });
    txt(g, cx + 84, by - 34, 'g', { 'text-anchor': 'middle', 'font-family': F_MONO, 'font-size': 15, fill: '#9fb36a' });
    const tare = el('g', { class: 'tare-g' }, g);
    el('rect', { x: cx - 128, y: by - 60, width: 56, height: 30, rx: 6, fill: C.sig, stroke: C.sig2 }, tare);
    txt(tare, cx - 100, by - 40, 'TARE', { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 700, 'font-size': 12.5, fill: '#fff', 'letter-spacing': '.06em' });
    el('rect', { x: cx - 8, y: by - 100, width: 16, height: 17, fill: '#97a3ae' }, g);
    el('rect', { x: cx - 104, y: by - 110, width: 208, height: 12, rx: 3, fill: '#d3dae0', stroke: '#8b97a3' }, g);
    el('rect', { x: cx - 100, y: by - 110, width: 200, height: 4, rx: 2, fill: '#eef2f5' }, g);
    return { g, disp, tare, panY: by - 110 };
  }

  /* =====================================================================
     6. AIM HERO + MEDICAL ICONS
     ===================================================================== */
  const AL = { l: 6.24, b: 3.52, h: 2.18 };
  function orient(dims, dim) {   // [width (measured), vertical, depth]
    if (dim === 'b') return [dims.b, dims.h, dims.l];
    if (dim === 'h') return [dims.h, dims.b, dims.l];
    return [dims.l, dims.h, dims.b];
  }
  (function aimHero() {
    const svg = $('aim-hero'); defsFor(svg, 'ah');
    const S = 44, AX = 120, BT = 64;
    el('ellipse', { cx: 430, cy: 372, rx: 360, ry: 10, fill: 'rgba(23,32,42,.07)' }, svg);
    const back = el('g', null, svg);
    const M = drawCaliper(svg, { id: 'ah', S, AX, BT, x: AL.l, jawLen: 4.9 * S });
    const G = M.geom;
    const B = drawBlock(back, 'ah', 'al', null);
    const lab = txt(svg, 0, 0, '', { 'font-family': F_MONO, 'font-size': 20, fill: C.sig2, 'text-anchor': 'start' });
    const t0 = performance.now(), seq = ['l', 'b', 'h'];
    function f(now) {
      const T = (Math.max(0, now - t0) / 1000) % 15, i = Math.floor(T / 5), t = T % 5;
      const dim = seq[i], prev = seq[(i + 2) % 3];
      const D = AL[dim], Dp = AL[prev];
      let x, flip = 1, showD = dim;
      if (t < 1.1) { const k = t / 1.1, e = k * k * (3 - 2 * k); x = Dp + (Math.max(D, Dp) + .7 - Dp) * e; showD = prev; }
      else if (t < 2.1) { x = Math.max(D, Dp) + .7; const k = (t - 1.1) / 1; flip = Math.abs(Math.cos(k * Math.PI)); showD = k < .5 ? prev : dim; }
      else if (t < 3.3) { const k = (t - 2.1) / 1.2, e = k * k * (3 - 2 * k); x = Math.max(D, Dp) + .7 + (D - Math.max(D, Dp) - .7) * e; }
      else x = D;
      const [w, v, d] = orient(AL, showD);
      B.shape(w * S * flip, v * S, d * S, 1);
      B.g.setAttribute('transform', `translate(${AX + (1 - flip) * w * S / 2} ${G.BB + 34 + v * S})`);
      M.set(x);
      lab.setAttribute('x', AX + D * S + 1.7 * S); lab.setAttribute('y', G.BB + 3 * S);
      lab.textContent = t > 3.3 ? `${dim} = ${D.toFixed(2)} cm` : '';
      if (!reduced) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  })();
  (function medIcons() {
    const ink = '#344150', o = C.sig, l = C.lime2;
    let s = $('med-ic-1');
    el('circle', { cx: 40, cy: 40, r: 38, fill: '#e8edfc' }, s);
    el('path', { d: 'M22 58 L50 22', stroke: ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
    for (let i = 0; i < 6; i++) el('line', { x1: 27 + i * 4, y1: 49 - i * 5.2, x2: 33 + i * 4, y2: 54 - i * 5.2, stroke: '#fff', 'stroke-width': 1.3 }, s);
    el('rect', { x: 46, y: 14, width: 12, height: 8, rx: 2, transform: 'rotate(38 52 18)', fill: ink }, s);
    const cal = el('g', null, s);
    el('rect', { x: 14, y: 62, width: 52, height: 5, rx: 1, fill: o }, cal);
    el('rect', { x: 14, y: 66, width: 4, height: 8, fill: o }, cal);
    const jw = el('rect', { x: 60, y: 66, width: 4, height: 8, fill: o }, cal);
    if (!reduced) el('animate', { attributeName: 'x', values: '60;40;60', dur: '3.2s', repeatCount: 'indefinite' }, jw);
    s = $('med-ic-2');
    el('circle', { cx: 40, cy: 40, r: 38, fill: '#f1f7d6' }, s);
    el('path', { d: 'M20 22 q-6 -8 2 -10 q6 -2 8 6 h20 q2 -8 8 -6 q8 2 2 10 q-4 4 -10 2 v32 q6 -2 10 2 q6 8 -2 10 q-6 2 -8 -6 h-20 q-2 8 -8 6 q-8 -2 -2 -10 q4 -4 10 -2 v-32 q-6 2 -10 -2z', fill: '#fff', stroke: ink, 'stroke-width': 2, transform: 'rotate(-35 40 40) translate(0 4)' }, s);
    const tk = el('g', null, s);
    el('path', { d: 'M28 62 V70 M52 62 V70 M28 66 H52', stroke: l, 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, tk);
    s = $('med-ic-3');
    el('circle', { cx: 40, cy: 40, r: 38, fill: '#e5ebf0' }, s);
    el('path', { d: 'M30 10 V34 Q30 42 38 46 L44 49 Q50 52 50 60 V72', fill: 'none', stroke: ink, 'stroke-width': 7, 'stroke-linecap': 'round' }, s);
    el('circle', { cx: 41, cy: 47, r: 7, fill: '#fff', stroke: o, 'stroke-width': 2.4 }, s);
    const dash = el('path', { d: 'M18 47 H64', stroke: o, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, s);
    if (!reduced) el('animate', { attributeName: 'stroke-dashoffset', values: '0;14', dur: '1.6s', repeatCount: 'indefinite' }, dash);
  })();

  /* =====================================================================
     7. THEORY — labelled parts, MSD/VSD, reading trainer, zero error
     ===================================================================== */
  (function parts() {
    const svg = $('parts-svg'); defsFor(svg, 'pt');
    const S = 50, AX = 150, BT = 130, x = 3.0;
    const M = drawCaliper(svg, { id: 'pt', S, AX, BT, x, range: 10, jawLen: 4.2 * S, label: false });
    const G = M.geom, jx = AX + x * S;
    const lab = el('g', null, svg);
    function call(px, py, tx, ty, s, anchor) {
      el('line', { x1: px, y1: py, x2: tx, y2: ty + (ty < py ? 6 : -18), stroke: C.sig, 'stroke-width': 1.4 }, lab);
      el('circle', { cx: px, cy: py, r: 3.4, fill: C.sig }, lab);
      txt(lab, tx, ty, s, { 'text-anchor': anchor || 'middle', 'font-family': F_HEAD, 'font-weight': 650, 'font-size': 17, fill: C.ink });
    }
    call(AX - .2 * S, BT - .9 * S, 70, 34, 'Inside jaws', 'start');
    call(jx + .2 * S, BT - .9 * S, 70, 34, '', 'start');
    call(G.X0 + 8.5 * S, G.BB - .25 * S, G.X0 + 9.5 * S, 44, 'Main scale (beam)', 'start');
    call(G.X0 + x * S + .45 * S, G.BB + .2 * S, 470, 400, 'Vernier scale', 'start');
    call(G.lx + x * S, BT - .86 * S, G.lx + x * S + 40, 34, 'Locking screw', 'start');
    call(G.wx + x * S + .2 * S, G.wy + .2 * S, 640, 352, 'Thumb wheel', 'start');
    call(G.beamR + x * S - 20, G.BB - .16 * S, 870, 300, 'Depth rod');
    call(AX - .4 * S, G.BB + 2.6 * S, 40, 440, 'Fixed jaw', 'start');
    call(jx + .5 * S, G.BB + 2.6 * S, 300, 440, 'Sliding jaw · outside jaws', 'start');
  })();
  (function msdFig() {
    const svg = $('msd-svg'), V = drawScale(svg, { id: 'ms', x: 0, Sm: 860, vz: 70 });
    const g = el('g', { 'pointer-events': 'none' }, svg);
    const X9 = 70 + .9 * 860;
    el('path', { d: `M70 22 V12 H${X9} V22`, fill: 'none', stroke: C.sig, 'stroke-width': 2 }, g);
    txt(g, (70 + X9) / 2, 40, '9 MSD = 0.9 cm', { 'text-anchor': 'middle', 'font-family': F_MONO, 'font-size': 19, fill: C.sig2 });
    el('path', { d: `M70 270 V286 H${X9} V270`, fill: 'none', stroke: C.lime2, 'stroke-width': 2 }, g);
    txt(g, (70 + X9) / 2 + 220, 280, '10 VSD = 0.9 cm', { 'text-anchor': 'middle', 'font-family': F_MONO, 'font-size': 19, fill: C.lime2 });
    const X1m = 70 + .1 * 860, X1v = 70 + .09 * 860;
    el('rect', { x: X1v - 6, y: 104, width: X1m - X1v + 12, height: 70, rx: 6, fill: 'rgba(180,210,53,.25)', stroke: C.lime2, 'stroke-width': 1.6 }, g);
    txt(g, X1m + 14, 128, '0.01 cm', { 'font-family': F_MONO, 'font-size': 17, fill: C.lime2 });
    return V;
  })();
  (function reader() {
    const svg = $('read-svg'), V = drawScale(svg, { id: 'rd', x: 2.47 });
    const sl = $('read-sl'), out = $('read-out');
    let quiz = null;
    function show(x) {
      const tr = trueReading(x);
      out.innerHTML = `Main scale mark just before the vernier zero: <b>${tr.msr.toFixed(1)} cm</b><br>Vernier mark lined up with a main mark: <b>${tr.vsr}</b><br>VSR × L.C = ${tr.vsr} × 0.01 = <b>${(tr.vsr * LC).toFixed(2)} cm</b><br><span class="tot">Total = ${tr.msr.toFixed(1)} + ${(tr.vsr * LC).toFixed(2)} = ${tr.tot.toFixed(2)} cm</span>`;
    }
    function setX(x, fromQuiz) {
      x = +clamp(x, 0, RANGE).toFixed(2);
      sl.value = x; V.set(x);
      if (!fromQuiz) { quiz = null; show(x); }
    }
    sl.addEventListener('input', () => setX(+sl.value));
    document.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => setX(+sl.value + +b.dataset.move)));
    $('read-quiz').addEventListener('click', () => {
      quiz = +(.5 + Math.random() * 12).toFixed(2);
      setX(quiz, true);
      out.innerHTML = `What does the caliper read?<br><label>Total = <input type="text" inputmode="decimal" id="rq-in" autocomplete="off"> cm</label> <button type="button" class="btn-quiet sm" id="rq-go">Check</button><div id="rq-fb"></div>`;
      const inp = $('rq-in'), fb = $('rq-fb');
      function go() {
        const v = parseNum(inp.value);
        if (!isFinite(v)) { fb.textContent = 'Type the reading in cm, for example 2.47.'; return; }
        const tr = trueReading(quiz);
        if (Math.abs(v - tr.tot) < .0005) fb.innerHTML = `<b>Correct:</b> ${tr.msr.toFixed(1)} + ${tr.vsr} × 0.01 = ${tr.tot.toFixed(2)} cm.`;
        else if (Math.abs(v - (tr.msr + tr.vsr)) < .0005) fb.textContent = 'The VSR is a number of divisions; multiply it by 0.01 cm before adding.';
        else if (Math.abs(Math.abs(v - tr.tot) - .1) < .0005) fb.textContent = 'Off by 1 mm: the MSR is the main scale mark just before the vernier zero.';
        else if (Math.abs(Math.floor(v * 10 + 1e-6) / 10 - tr.msr) < 1e-6) fb.textContent = 'The MSR looks right; look again for the vernier mark that lines up exactly.';
        else fb.textContent = 'Not quite. Read the main scale mark before the vernier zero first, then the coinciding vernier mark.';
      }
      $('rq-go').addEventListener('click', go);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    });
    $('read-show').addEventListener('click', () => { show(+sl.value); quiz = null; });
    let drag = null;
    V.vg.addEventListener('pointerdown', e => { drag = { x: e.clientX }; V.vg.setPointerCapture(e.pointerId); });
    V.vg.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; drag.x = e.clientX; const r = svg.getBoundingClientRect(); setX(+sl.value + dx * (1000 / r.width) / 600); });
    V.vg.addEventListener('pointerup', () => { drag = null; });
    V.vg.addEventListener('pointercancel', () => { drag = null; });
    show(2.47);
  })();
  (function zeroPanels() {
    drawScale($('zero-a'), { id: 'za', x: 0, vz: 300 });
    drawScale($('zero-b'), { id: 'zb', x: .03, vz: 300 });
    drawScale($('zero-c'), { id: 'zc', x: -.04, vz: 300 });
  })();

  /* =====================================================================
     8. METHOD — apparatus + step figures
     ===================================================================== */
  function blockAt(svg, id, mat, dims, dim, x, y, k, n) {
    const B = drawBlock(svg, id, mat, n);
    const [w, v, d] = orient(dims, dim || 'l');
    B.shape(w * k, v * k, d * k, 1);
    B.g.setAttribute('transform', `translate(${x} ${y})`);
    return B;
  }
  (function apparatus() {
    const grid = $('app-grid');
    const list = [
      ['Vernier caliper (L.C 0.01 cm)', svg => { defsFor(svg, 'ap1'); svg.setAttribute('viewBox', '0 0 330 160'); const M = drawCaliper(svg, { id: 'ap1', S: 17.5, AX: 40, BT: 30, x: 4.2, shadow: false, nums: false, label: false }); M.set(4.2); }],
      ['Rectangular blocks', svg => { defsFor(svg, 'ap2'); svg.setAttribute('viewBox', '0 0 330 160'); blockAt(svg, 'ap2', 'al', AL, 'l', 20, 140, 18); blockAt(svg, 'ap2', 'oak', { l: 5.86, b: 3.94, h: 2.47 }, 'l', 150, 112, 16); blockAt(svg, 'ap2', 'brass', { l: 4.08, b: 2.56, h: 1.64 }, 'l', 175, 148, 16); blockAt(svg, 'ap2', 'acr', { l: 5.12, b: 3.06, h: 1.92 }, 'l', 30, 64, 14); }],
      ['Digital balance', svg => { defsFor(svg, 'ap3'); svg.setAttribute('viewBox', '0 0 330 160'); const g = el('g', { transform: 'translate(165 150) scale(.92) translate(-165 0)' }, svg); drawBalance(g, 'ap3', 165, 0); }]
    ];
    list.forEach(([name, fn]) => {
      const d = document.createElement('div'); d.className = 'app-item';
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true');
      d.appendChild(svg); fn(svg);
      const s = document.createElement('span'); s.textContent = name; d.appendChild(s);
      grid.appendChild(d);
    });
  })();
  (function methodSteps() {
    const fig = $('step-fig'), cap = $('step-cap');
    const btns = Array.from(document.querySelectorAll('#steps .step'));
    function newSvg(vb) { fig.innerHTML = ''; const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb || '0 0 640 340'); s.setAttribute('role', 'img'); fig.appendChild(s); return s; }
    function inst(s, id, x, dim) {
      defsFor(s, id);
      const back = el('g', null, s);
      const S = 38, AX = 70, BT = 40;
      const M = drawCaliper(s, { id, S, AX, BT, x, jawLen: 5.2 * S });
      if (dim) { const [w, v, d] = orient(AL, dim); const B = drawBlock(back, id, 'al', null); B.shape(w * S, v * S, d * S, 1); B.g.setAttribute('transform', `translate(${AX} ${M.geom.BB + 26 + v * S})`); }
      return M;
    }
    function lines(s, arr, size) { arr.forEach(([t, y, c]) => txt(s, 320, y, t, { 'text-anchor': 'middle', 'font-family': F_MONO, 'font-size': size || 28, fill: c })); }
    const figs = [
      () => { const s = newSvg('0 -40 1000 340'); drawScale(s, { id: 'm1', x: 0, Sm: 860, vz: 70 }); txt(s, 500, -12, '10 vernier divisions = 9 main scale divisions', { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 650, 'font-size': 26, fill: C.ink }); return 'L.C = 1 MSD − 1 VSD = 0.1 cm − 0.09 cm = 0.01 cm.'; },
      () => { const s = newSvg('0 0 1000 340'); const V = drawScale(s, { id: 'm2', x: 0 }); V.hi('zero'); txt(s, 500, 330, 'jaws closed: zero error nil', { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 650, 'font-size': 24, fill: C.ink }); return 'With nothing between the jaws, the vernier zero lines up with the main zero.'; },
      () => { const s = newSvg('0 0 640 330'); inst(s, 'm3', AL.l, 'l'); return 'The block sits flat against the fixed jaw; the sliding jaw is closed gently onto the far face.'; },
      () => { const s = newSvg('0 0 1000 300'); const V = drawScale(s, { id: 'm4', x: AL.l }); V.hi('msr'); return 'The vernier zero is just past 6.2 on the main scale, so MSR = 6.2 cm.'; },
      () => { const s = newSvg('0 0 1000 300'); const V = drawScale(s, { id: 'm5', x: AL.l }); V.hi('vsr'); return 'Vernier mark 4 lines up with a main scale mark, so VSR = 4.'; },
      () => { const s = newSvg('0 0 640 230'); lines(s, [['l = MSR + (VSR × L.C)', 60, C.ink], ['= 6.2 + (4 × 0.01)', 120, C.ink2], ['= 6.24 cm', 180, C.sig2]]); return 'Add the two parts. With zero error nil, no correction is needed.'; },
      () => { const s = newSvg('0 0 640 330'); inst(s, 'm7', AL.b, 'b'); txt(s, 600, 320, 'b = 3.52 cm', { 'text-anchor': 'end', 'font-family': F_MONO, 'font-size': 20, fill: C.sig2 }); return 'Turn the block to present each dimension in turn: length, breadth, height.'; },
      () => { const s = newSvg('0 0 640 280'); defsFor(s, 'm8'); const B = drawBalance(s, 'm8', 320, 250); B.disp.textContent = EX.m.toFixed(2); blockAt(s, 'm8', 'al', AL, 'l', 320 - AL.l * 14, B.panY, 28); return 'Place the block on the tared balance and read its mass in grams.'; },
      () => { const s = newSvg('0 0 640 230'); lines(s, [['V = l × b × h', 70, C.ink], ['ρ = m ÷ V', 140, C.sig2]], 34); txt(s, 320, 196, 'l, b, h in cm · V in cm³ · ρ in g/cm³', { 'text-anchor': 'middle', 'font-family': F_BODY, 'font-size': 18, fill: C.muted }); return 'Multiply the three totals for the volume, then divide the mass by it.'; }
    ];
    function pick(i) {
      btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false'));
      cap.textContent = figs[i]();
    }
    btns.forEach((b, i) => b.addEventListener('click', () => pick(i)));
    pick(0);
  })();

  /* =====================================================================
     9. RESULTS — example table, block figure, calculation
     ===================================================================== */
  (function results() {
    const tb = document.querySelector('#res-table tbody');
    DIMS.forEach(k => {
      const r = EX[k], tr = document.createElement('tr');
      tr.innerHTML = `<td>${DIM_NAME[k]}</td><td>${r.msr.toFixed(1)}</td><td>${r.vsr}</td><td>${(r.vsr * LC).toFixed(2)}</td><td>${k} = ${r.tot.toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
    const svg = $('ex-block'); defsFor(svg, 'eb');
    const k = 52, x0 = 160, y0 = 250;
    blockAt(svg, 'eb', 'al', AL, 'l', x0, y0, k);
    const w = AL.l * k, h = AL.h * k, dx = AL.b * k * .3, dy = AL.b * k * .22;
    const a = (x1, y1, x2, y2, s, tx, ty, anchor) => {
      el('line', { x1, y1, x2, y2, stroke: C.sig, 'stroke-width': 1.8 }, svg);
      [[x1, y1], [x2, y2]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 3, fill: C.sig }, svg));
      txt(svg, tx, ty, s, { 'text-anchor': anchor || 'middle', 'font-family': F_MONO, 'font-size': 19, fill: C.sig2 });
    };
    a(x0, y0 + 18, x0 + w, y0 + 18, 'l = 6.24 cm', x0 + w / 2, y0 + 42);
    a(x0 - 18, y0, x0 - 18, y0 - h, 'h = 2.18 cm', x0 - 26, y0 - h / 2 + 6, 'end');
    a(x0 + w + 14, y0 - h, x0 + w + dx + 14, y0 - h - dy, 'b = 3.52 cm', x0 + w + dx + 22, y0 - h - dy + 22, 'start');
    const V = EX.V, rho = EX.m / +V.toFixed(2);
    const steps = [
      ['1', 'Volume', [`V = l × b × h = 6.24 × 3.52 × 2.18`, `= 21.9648 × 2.18 = <b>${V.toFixed(2)} cm³</b>`], 'hi'],
      ['2', 'Mass, from the balance', [`m = <b>${EX.m.toFixed(2)} g</b>`]],
      ['3', 'Density', [`ρ = m ÷ V = ${EX.m.toFixed(2)} ÷ ${V.toFixed(2)} = <b>${rho.toFixed(2)} g/cm³</b>`]],
      ['✓', 'Result', [`Volume of the block V ≈ <b>${V.toFixed(2)} cm³</b>`, `Density of the block ρ ≈ <b>${rho.toFixed(2)} g/cm³</b>`], 'result', 'close to the density of aluminium, about 2.70 g/cm³']
    ];
    const box = $('ex-calc');
    steps.forEach(([n, t, ls, cls, sub]) => {
      const d = document.createElement('div'); d.className = 'calc-step' + (cls ? ' ' + cls : '');
      d.innerHTML = `<span class="cs-n">${n}</span><div><strong>${t}</strong>${ls.map(x => `<span class="eq-line">${x}</span>`).join('')}${sub ? `<span class="sub">${sub}</span>` : ''}</div>`;
      box.appendChild(d);
    });
  })();

  /* =====================================================================
     10. MCQs — one list, numbered, choices shuffled
     ===================================================================== */
  const MCQ = [
    { q: 'What is the aim of this practical?', a: 'To measure the length, breadth and height of a block, then find its volume and density', o: ['To measure the diameter of a sphere', 'To find the zero error of a balance', 'To measure the depth of a hole only'],
      hint: 'Three dimensions and a mass feed the final result.', ex: 'l, b and h give the volume; with the mass from the balance, they give the density.' },
    { q: 'On the main scale of this vernier caliper, one main scale division (MSD) is…', a: '1 mm = 0.1 cm', o: ['1 cm', '0.01 cm', '0.9 mm'],
      hint: 'The smallest marks on the beam.', ex: 'The beam is marked in millimetres: 1 MSD = 1 mm = 0.1 cm.' },
    { q: 'Ten vernier divisions span nine main scale divisions. One vernier division (VSD) is…', a: '0.09 cm', o: ['0.1 cm', '0.01 cm', '0.9 cm'],
      hint: '9 MSD ÷ 10.', ex: '9 × 0.1 cm = 0.9 cm, shared by 10 divisions: 0.09 cm each.' },
    { q: 'The least count of a vernier caliper is…', a: '1 MSD − 1 VSD', o: ['1 MSD + 1 VSD', '1 MSD × number of vernier divisions', '1 VSD ÷ 1 MSD'],
      hint: 'It is the difference between the two kinds of division.', ex: 'L.C = 1 MSD − 1 VSD = 0.1 − 0.09 = 0.01 cm.' },
    { q: 'With 1 MSD = 0.1 cm and 10 vernier divisions, the least count is…', a: '0.01 cm', o: ['0.1 cm', '0.001 cm', '1 cm'],
      hint: 'L.C = 1 MSD ÷ number of vernier divisions.', ex: '0.1 cm ÷ 10 = 0.01 cm.' },
    { q: 'The main scale reading (MSR) is…', a: 'the main scale mark just before the vernier zero', o: ['the main scale mark just after the vernier zero', 'the vernier mark that lines up with a main mark', 'the reading at the end of the depth rod'],
      hint: 'Look at where the vernier zero sits on the beam.', ex: 'MSR is the last main scale mark that the vernier zero has passed.' },
    { q: 'The vernier scale reading (VSR) is…', a: 'the number of the vernier mark that coincides with a main scale mark', o: ['the main scale mark before the vernier zero', 'the number of millimetres between the jaws', 'always 0 when the jaws are closed'],
      hint: 'Look along the vernier for the line that matches up.', ex: 'VSR is counted in divisions, from 0 to 10.' },
    { q: 'The total reading of a vernier caliper is…', a: 'MSR + (VSR × L.C)', o: ['MSR + VSR', '(MSR + VSR) × L.C', 'MSR × VSR × L.C'],
      hint: 'Only the vernier part needs the least count.', ex: 'Total = MSR + (VSR × L.C).' },
    { q: 'MSR = 6.2 cm and VSR = 4, with L.C = 0.01 cm. The reading is…', a: '6.24 cm', o: ['10.2 cm', '6.204 cm', '6.6 cm'],
      hint: 'VSR × L.C = 4 × 0.01.', ex: '6.2 + 0.04 = 6.24 cm.' },
    { q: 'The vernier zero lies between 3.5 and 3.6 cm, and vernier mark 7 lines up. The reading is…', a: '3.57 cm', o: ['3.67 cm', '3.507 cm', '10.5 cm'],
      hint: 'MSR is 3.5 cm.', ex: '3.5 + 7 × 0.01 = 3.57 cm.' },
    { q: 'Which part of the caliper measures the depth of a hole?', a: 'The depth rod', o: ['The inside jaws', 'The thumb wheel', 'The locking screw'],
      hint: 'It slides out of the end of the beam.', ex: 'The depth rod moves out with the sliding jaw; the reading gives the depth.' },
    { q: 'The inside (upper) jaws are used to measure…', a: 'the width of a hole or slot', o: ['the length of a block', 'the mass of a block', 'the depth of a beaker'],
      hint: 'They open outwards inside a gap.', ex: 'Inside jaws measure internal sizes such as the diameter of a hole.' },
    { q: 'What is the locking screw for?', a: 'It holds the sliding jaw still while the scales are read', o: ['It removes the zero error', 'It moves the jaw by 0.01 cm per turn', 'It tares the caliper'],
      hint: 'Think about moving the caliper to read it.', ex: 'Locking stops the jaw slipping, so the reading does not change.' },
    { q: 'With the jaws closed, the vernier zero is to the right of the main zero and mark 3 coincides. The zero error is…', a: '+0.03 cm', o: ['−0.03 cm', '+0.3 cm', '−0.07 cm'],
      hint: 'To the right means the caliper reads a little more than zero.', ex: 'Zero error = +3 × 0.01 = +0.03 cm.' },
    { q: 'An observed reading is 4.56 cm and the zero error is +0.03 cm. The corrected reading is…', a: '4.53 cm', o: ['4.59 cm', '4.56 cm', '1.56 cm'],
      hint: 'Corrected = observed − zero error.', ex: '4.56 − 0.03 = 4.53 cm.' },
    { q: 'Squeezing the jaws hard on a block usually…', a: 'tilts the jaw and changes the reading, and can dent the block', o: ['makes the reading more accurate', 'removes the zero error', 'has no effect on the reading'],
      hint: 'Light contact is the rule.', ex: 'Close the jaw gently until it just touches, lock, then read.' },
    { q: 'The volume of a rectangular block is…', a: 'V = l × b × h', o: ['V = l + b + h', 'V = 2(lb + bh + lh)', 'V = l × b'],
      hint: 'Three lengths multiplied give cm³.', ex: 'V = l × b × h, in cm³ when l, b and h are in cm.' },
    { q: 'l = 6.24 cm, b = 3.52 cm and h = 2.18 cm. The volume is about…', a: '47.88 cm³', o: ['11.94 cm³', '21.96 cm³', '45.57 cm³'],
      hint: 'Multiply all three totals.', ex: '6.24 × 3.52 × 2.18 ≈ 47.88 cm³.' },
    { q: 'A block has m = 129.30 g and V = 47.88 cm³. Its density is about…', a: '2.70 g/cm³', o: ['0.370 g/cm³', '6191 g/cm³', '27.0 g/cm³'],
      hint: 'ρ = m ÷ V.', ex: '129.30 ÷ 47.88 ≈ 2.70 g/cm³, close to aluminium.' },
    { q: 'Before a block is placed on a digital balance, the balance should be…', a: 'tared to read 0.00 g with the pan empty', o: ['tared with the block already on the pan', 'set to read the volume', 'tilted towards the reader'],
      hint: 'The display should start from zero.', ex: 'Taring the empty pan makes the display show only the mass of the block.' }
  ];
  (function mcq() {
    const list = $('mcq-list'), score = $('mcq-score');
    let solved = 0;
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function updScore() { score.textContent = `${solved} of ${MCQ.length} correct`; }
    function render() {
      solved = 0; list.innerHTML = '';
      MCQ.forEach((m, qi) => {
        const li = document.createElement('li'); li.className = 'mcq';
        const opts = shuffle([m.a].concat(m.o));
        li.innerHTML = `<p class="mcq-q"><span class="mcq-n">${qi + 1}.</span><span></span></p><div class="mcq-opts"></div><div class="mcq-fb" aria-live="polite"></div>`;
        li.querySelector('.mcq-q span:last-child').textContent = m.q;
        const box = li.querySelector('.mcq-opts'), fb = li.querySelector('.mcq-fb');
        opts.forEach(o => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = o;
          b.addEventListener('click', () => {
            if (li.classList.contains('solved')) return;
            if (o === m.a) {
              b.classList.remove('wrong'); b.classList.add('right'); li.classList.add('solved');
              box.querySelectorAll('.opt').forEach(x => { x.disabled = true; x.classList.remove('wrong'); });
              fb.className = 'mcq-fb show explain'; fb.textContent = m.ex;
              solved++; updScore();
            } else {
              b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
              fb.className = 'mcq-fb show hint'; fb.textContent = 'Not quite. ' + m.hint;
            }
          });
          box.appendChild(b);
        });
        list.appendChild(li);
      });
      updScore();
    }
    $('mcq-reset').addEventListener('click', render);
    render();
  })();

  /* =====================================================================
     11. PRACTICAL — caliper, block tray, balance, magnifier, table, calculation
     ===================================================================== */
  (function practical() {
    const svg = $('rig'); defsFor(svg, 'rg');
    const S = 56, AX = 170, BT = 72, VBW = 1240, FALL = 1.2;
    const TX = [150, 360, 570, 780], TY = 620, TK = .45, PAN_X = 1065;
    // bench, tray, balance
    el('rect', { x: 0, y: 670, width: VBW, height: 30, fill: '#dbe3e8' }, svg);
    el('line', { x1: 0, y1: 670, x2: VBW, y2: 670, stroke: '#bcc8d1' }, svg);
    el('rect', { x: 40, y: TY, width: 850, height: 30, rx: 6, fill: 'url(#rg-tray)', stroke: '#93a0ac' }, svg);
    TX.forEach((x, i) => {
      el('rect', { x: x - 92, y: TY - 3, width: 184, height: 6, rx: 3, fill: 'rgba(52,65,80,.12)' }, svg);
      el('circle', { cx: x, cy: TY + 15, r: 10, fill: C.ink }, svg);
      txt(svg, x, TY + 19.5, String(i + 1), { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 700, 'font-size': 13, fill: '#fff' });
    });
    txt(svg, 465, 690, 'tray · each block has its own numbered spot', { 'text-anchor': 'middle', 'font-family': F_BODY, 'font-size': 14, fill: C.muted });
    const BAL = drawBalance(svg, 'rg', PAN_X, 670);
    BAL.tare.classList.add('live');
    BAL.tare.setAttribute('role', 'button'); BAL.tare.setAttribute('tabindex', '0'); BAL.tare.setAttribute('aria-label', 'Tare the balance');
    const blkBack = el('g', null, svg);
    const M = drawCaliper(svg, { id: 'rg', S, AX, BT, x: 3, jawLen: 4.8 * S });
    const G = M.geom, BTOP = G.BB + 38;
    const loupe = el('rect', { y: G.BB - .62 * S, width: 1.6 * S, height: 1.4 * S, rx: 10, fill: 'none', stroke: C.lime2, 'stroke-width': 1.6, 'stroke-dasharray': '5 4', opacity: .8, 'pointer-events': 'none' }, svg);
    const fx = el('g', { 'pointer-events': 'none' }, svg);
    const sqMark = el('g', { opacity: 0 }, fx);
    const sqRect = el('rect', { width: 26, rx: 6, fill: 'rgba(180,65,47,.14)', stroke: C.bad, 'stroke-width': 2 }, sqMark);
    const sqTxt = txt(sqMark, 0, 0, 'pressing too hard', { 'text-anchor': 'middle', 'font-family': F_HEAD, 'font-weight': 700, 'font-size': 15, fill: C.bad });
    const hiRing = el('rect', { rx: 12, fill: 'none', stroke: C.sig, 'stroke-width': 3, opacity: 0 }, fx);
    const blkFront = el('g', null, svg);
    const MG = drawScale($('mag'), { id: 'mg', x: 3 });
    // controls on the instrument
    const body = M.body; body.classList.add('grab-t', 'knob-t');
    body.setAttribute('tabindex', '0'); body.setAttribute('role', 'slider'); body.setAttribute('aria-label', 'Sliding jaw: drag, scroll or use the arrow keys');
    body.setAttribute('aria-valuemin', '0'); body.setAttribute('aria-valuemax', String(RANGE));
    el('rect', { class: 'focus-ring', x: AX - .1 * S - 5, y: BT - .24 * S - 5, width: 3.1 * S + 10, height: G.bh + 1.0 * S + 10, rx: 8, fill: 'none', stroke: C.sig, 'stroke-width': 2.5 }, body);
    M.jawLo.classList.add('grab-t'); M.jawUp.classList.add('grab-t');
    const wheel = M.wheelG; wheel.classList.add('grab-t', 'knob-t');
    wheel.setAttribute('tabindex', '0'); wheel.setAttribute('role', 'slider'); wheel.setAttribute('aria-label', 'Thumb wheel: fine movement');
    const lockG = M.lockG; lockG.classList.add('live', 'knob-t');
    lockG.setAttribute('tabindex', '0'); lockG.setAttribute('role', 'button'); lockG.setAttribute('aria-label', 'Locking screw');
    el('rect', { x: G.lx - .45 * S, y: BT - 1.15 * S, width: .9 * S, height: .95 * S, fill: 'transparent' }, lockG);

    /* ---------- blocks ---------- */
    const BLOCKS = [
      { n: 1, mat: 'al', l: 6.24, b: 3.52, h: 2.18, m: 129.30 },
      { n: 2, mat: 'oak', l: 5.86, b: 3.94, h: 2.47, m: 42.77 },
      { n: 3, mat: 'brass', l: 4.08, b: 2.56, h: 1.64, m: 145.60 },
      { n: 4, mat: 'acr', l: 5.12, b: 3.06, h: 1.92, m: 35.50 }
    ];
    const dimOf = (b, d) => b[d];
    function render(b) {
      const [w, v, d] = orient(b, b.ori);
      const W = w * S * b.k;
      b.D.shape(W * b.flip, v * S * b.k, d * S * b.k, 1);
      b.g.setAttribute('transform', `translate(${(b.x + (1 - b.flip) * W / 2).toFixed(1)} ${b.y.toFixed(1)})`);
    }
    function homePos(b) { return { x: TX[b.n - 1] - b.l * S * TK / 2, y: TY }; }
    BLOCKS.forEach(b => {
      b.D = drawBlock(blkFront, 'rg', b.mat, b.n); b.g = b.D.g;
      b.g.setAttribute('role', 'img'); b.g.setAttribute('aria-label', `Block ${b.n}, ${MAT[b.mat].name}`);
      b.ori = 'l'; b.k = TK; b.flip = 1; b.loc = 'tray'; b.weighed = false;
      Object.assign(b, homePos(b));
      b.g.addEventListener('pointerdown', e => grabBlock(b, e));
      render(b);
    });
    function freeState() {
      BLOCKS.forEach(b => b.g.classList.toggle('free', b.loc === 'tray' || b.loc === 'pan' || (b.loc === 'jaws' && st.x > dimOf(b, b.ori) + .0005)));
    }

    /* ---------- state ---------- */
    const st = { v: 3, x: 3, sq: false, sqMsg: false, locked: false, jaw: null, pan: null, dim: 'l', zero: 'unchecked', tare: 0, shown: 0, gest: false };
    const rows = { l: null, b: null, h: null };
    let tableBlock = null;
    const msgEl = $('rig-msg');
    const DEFAULT_MSG = 'Drag the sliding jaw (or turn the thumb wheel) to open and close it. Choose a dimension, then drag a block from its spot into the outside jaws, or onto the balance pan.';
    function say(t, cls) { msgEl.textContent = t; msgEl.className = 'rig-msg' + (cls ? ' ' + cls : ''); }
    const contact = () => st.jaw ? dimOf(st.jaw, st.jaw.ori) : 0;
    const holdY = b => BTOP + orient(b, b.ori)[1] * S;

    function apply() {
      const c = contact();
      st.x = r3(Math.max(st.v, c)); st.sq = st.v < c - .03;
      M.set(st.x); MG.set(st.x);
      body.setAttribute('aria-valuenow', st.x.toFixed(2));
      loupe.setAttribute('x', G.X0 + st.x * S - .35 * S);
      const jx = AX + st.x * S;
      if (st.jaw && st.jaw.loc === 'jaws') { const b = st.jaw; b.x = AX; b.y = holdY(b); render(b); }
      if (st.sq) {
        sqMark.setAttribute('opacity', 1);
        const y0 = st.jaw ? BTOP : G.BB + 20, h = st.jaw ? holdY(st.jaw) - BTOP : 200;
        sqRect.setAttribute('x', jx - 13); sqRect.setAttribute('y', y0); sqRect.setAttribute('height', h);
        sqTxt.setAttribute('x', jx + 80); sqTxt.setAttribute('y', G.BB + G.jl + 26);
      } else sqMark.setAttribute('opacity', 0);
      freeState();
    }
    function lockedMsg() { say('The locking screw is tight, so the sliding jaw cannot move. Loosen the lock first.', 'warn'); }
    function moveTo(v) {
      if (st.locked) { lockedMsg(); return false; }
      const c = contact(), px = st.x;
      st.v = r3(clamp(v, c - .15, RANGE)); apply();
      if (st.sq) {
        if (!st.sqMsg) say(st.jaw ? `Pressing too hard: the jaw is already against block ${st.jaw.n}, so it cannot close further. Squeezing tilts the jaw and can dent the block. Ease the jaw back to light contact.` : 'Pressing too hard: the jaws are already closed. Ease off to light contact.', 'bad');
        st.sqMsg = true;
      } else if (st.sqMsg) { st.sqMsg = false; say('Pressure eased: the jaw now rests lightly in contact.'); }
      else if (st.jaw && st.x <= c + 1e-6 && px > c + 1e-6) say(`The sliding jaw touches block ${st.jaw.n}. Lock it, then read the MSR and the VSR in the magnifier.`, 'ok');
      if (!st.jaw && st.x <= .0005 && px > .0005) {
        if (st.zero !== 'nil') { st.zero = 'nil'; updZero(); }
        if (!st.sq) say('Jaws closed with nothing between them: the vernier zero lines up with the main scale zero. Zero error nil.', 'ok');
      }
      if (st.jaw && st.jaw.loc === 'jaws' && st.x > px && st.x > c + FALL) fall(st.jaw);
      return true;
    }
    function setLock(on) {
      st.locked = on; M.setLock(on);
      $('c-lock').setAttribute('aria-pressed', on ? 'true' : 'false');
      lockG.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    function toggleLock() {
      setLock(!st.locked);
      say(st.locked ? 'Locked: the sliding jaw is held still while the scales are read.' : 'Lock loosened: the sliding jaw moves freely again.');
    }
    lockG.addEventListener('click', toggleLock);
    lockG.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLock(); } });
    $('c-lock').addEventListener('click', toggleLock);

    // sliding jaw: drag (rig and magnifier), thumb wheel, mouse wheel, keys, buttons
    const tutOn = () => document.body.classList.contains('tut-on');
    function svgScale(s) { const r = s.getBoundingClientRect(); return s.viewBox.baseVal.width / r.width; }
    function dragMove(target, svgEl, perUnit, axis) {
      let d = null;
      target.addEventListener('pointerdown', e => {
        if (tutOn() || e.button > 0) return;
        e.preventDefault(); e.stopPropagation();
        try { target.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        d = { x: e.clientX, y: e.clientY };
        if (st.locked) lockedMsg();
      });
      target.addEventListener('pointermove', e => {
        if (!d) return;
        const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
        const u = (axis === 'y' ? -dy : dx) * svgScale(svgEl);
        if (u && !st.locked) moveTo(st.v + u * perUnit);
      });
      const end = () => { d = null; };
      target.addEventListener('pointerup', end); target.addEventListener('pointercancel', end);
    }
    dragMove(body, svg, 1 / S, 'x');
    dragMove(M.jawLo, svg, 1 / S, 'x');
    dragMove(M.jawUp, svg, 1 / S, 'x');
    dragMove(wheel, svg, .004, 'y');
    dragMove(MG.vg, $('mag'), 1 / 600, 'x');
    function wheelMove(e) {
      if (tutOn()) return;
      e.preventDefault();
      moveTo(st.v - Math.sign(e.deltaY) * LC * (e.shiftKey ? 10 : 1));
    }
    [body, wheel, MG.vg, M.jawLo].forEach(t => t.addEventListener('wheel', wheelMove, { passive: false }));
    [body, wheel].forEach(t => t.addEventListener('keydown', e => {
      const up = ['ArrowUp', 'ArrowRight', 'PageUp'].includes(e.key), dn = ['ArrowDown', 'ArrowLeft', 'PageDown'].includes(e.key);
      if (!up && !dn) return;
      e.preventDefault();
      const step = (e.shiftKey || e.key.startsWith('Page')) ? MSD : LC;
      moveTo(st.v + (up ? step : -step));
    }));
    document.querySelectorAll('[data-nudge]').forEach(b => b.addEventListener('click', () => moveTo(st.v + +b.dataset.nudge)));

    /* ---------- moving blocks ---------- */
    function tween(b, to, ms, ease) {
      return new Promise(res => {
        const from = { x: b.x, y: b.y, k: b.k, flip: b.flip }, t0 = performance.now();
        const f = now => {
          let k = Math.min(1, (now - t0) / ms); if (tut.on && tut.skip) k = 1;
          const e = ease ? ease(k) : (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
          for (const key in to) b[key] = from[key] + (to[key] - from[key]) * e;
          render(b);
          if (k < 1) requestAnimationFrame(f); else res();
        };
        requestAnimationFrame(f);
      });
    }
    async function home(b, msg, cls) {
      b.loc = 'anim'; freeState(); blkFront.appendChild(b.g);
      if (msg) say(msg, cls);
      b.ori = 'l'; b.flip = 1;
      await tween(b, Object.assign(homePos(b), { k: TK }), 560);
      b.loc = 'tray'; freeState();
    }
    async function fall(b, msg) {
      if (st.jaw === b) st.jaw = null;
      b.loc = 'anim'; blkFront.appendChild(b.g); apply();
      say(msg || `The jaws opened far wider than block ${b.n}, so it slipped out and dropped. It goes back to spot ${b.n}.`, 'warn');
      await tween(b, { y: 670, x: b.x + 10 }, 430, k => k * k);
      await tween(b, { y: 652, x: b.x + 18 }, 160, k => 1 - (1 - k) * (1 - k));
      await tween(b, { y: 670, x: b.x + 22 }, 160, k => k * k);
      b.ori = 'l';
      await tween(b, Object.assign(homePos(b), { k: TK }), 650);
      b.loc = 'tray'; freeState();
    }
    function putInJaws(b) {
      st.jaw = b; b.loc = 'jaws'; b.k = 1; b.flip = 1; b.ori = st.dim;
      blkBack.appendChild(b.g);
      st.v = Math.max(st.v, dimOf(b, b.ori));
      apply();
    }
    function weighDisplay() {
      const target = (st.pan ? st.pan.m : 0) - st.tare;
      const start = st.shown, t0 = performance.now(), ms = 800;
      const tok = (weighDisplay.tok = (weighDisplay.tok || 0) + 1);
      const f = now => {
        if (tok !== weighDisplay.tok) return;
        const k = Math.min(1, (now - t0) / ms);
        const jit = k < 1 ? (Math.random() - .5) * .08 * (1 - k) : 0;
        st.shown = start + (target - start) * (1 - Math.pow(1 - k, 3)) + jit;
        BAL.disp.textContent = (Math.abs(st.shown) < .005 ? 0 : st.shown).toFixed(2);
        if (k < 1) requestAnimationFrame(f);
        else { st.shown = target; BAL.disp.textContent = (Math.abs(target) < .005 ? 0 : target).toFixed(2); if (st.pan && Math.abs(st.tare) < 1e-9) st.pan.weighed = true; }
      };
      requestAnimationFrame(f);
    }
    function putOnPan(b) {
      st.pan = b; b.loc = 'pan'; b.ori = 'l'; b.k = TK; b.flip = 1;
      b.x = PAN_X - b.l * S * TK / 2; b.y = BAL.panY; render(b); freeState();
      weighDisplay();
      const clean = Math.abs(st.tare) < 1e-9;
      say(clean ? `Block ${b.n} is on the pan. Wait for the display to settle, then read the mass in grams.` : 'The balance was tared with a load on it, so this is not the mass of the block. Take the block off, tare the empty pan and weigh again.', clean ? '' : 'warn');
    }
    BAL.tare.addEventListener('click', () => {
      st.tare = st.pan ? st.pan.m : 0;
      if (st.pan) st.pan.weighed = false;
      st.shown = 0; weighDisplay.tok = (weighDisplay.tok || 0) + 1; BAL.disp.textContent = '0.00';
      say(st.pan ? 'Tared with a block on the pan: the display now ignores that block. Tare with the pan empty before weighing.' : 'Balance tared: the empty pan reads 0.00 g.', st.pan ? 'warn' : '');
    });
    BAL.tare.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); BAL.tare.dispatchEvent(new Event('click')); } });

    let drag = null;
    function grabBlock(b, e) {
      if (tutOn() || drag || b.loc === 'anim') return;
      if (b.loc === 'jaws' && st.x <= dimOf(b, b.ori) + .0005) {
        say(`Block ${b.n} is held between the jaws. Open the sliding jaw a little before taking it out.`, 'warn');
        return;
      }
      e.preventDefault();
      if (b.loc === 'jaws') { st.jaw = null; apply(); }
      if (b.loc === 'pan') { st.pan = null; weighDisplay(); }
      b.loc = 'drag'; b.k = .8; b.flip = 1; freeState();
      blkFront.appendChild(b.g);
      const p = svgPoint(svg, e), [w, v] = orient(b, b.ori);
      drag = { b, dx: -w * S * b.k / 2, dy: v * S * b.k / 2, id: e.pointerId };
      b.x = p.x + drag.dx; b.y = p.y + drag.dy; render(b);
      svg.setPointerCapture(e.pointerId);
    }
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = svgPoint(svg, e);
      drag.b.x = clamp(p.x + drag.dx, -40, VBW - 60); drag.b.y = clamp(p.y + drag.dy, 60, 700);
      drag.p = p; render(drag.b);
    });
    async function endDrag(e) {
      if (!drag) return;
      const b = drag.b, p = drag.p || svgPoint(svg, e); drag = null;
      const reach = AX + Math.max(st.x, 1.5) * S + 70;
      if (p.x > AX - 50 && p.x < reach && p.y > G.BB - 20 && p.y < G.BB + G.jl + 20) {
        if (st.jaw) return home(b, `The jaws already hold block ${st.jaw.n}. Block ${b.n} goes back to spot ${b.n}.`, 'warn');
        const D = dimOf(b, st.dim), w = DIM_WORD[st.dim];
        if (st.x < D - .0005) return home(b, `The jaws are too narrow for the ${w} of block ${b.n}. Open the sliding jaw wider than the block first.`, 'warn');
        if (st.x > D + FALL) {
          b.loc = 'anim'; b.ori = st.dim;
          await tween(b, { x: AX, y: holdY(b), k: 1 }, 300);
          return fall(b, `The jaws are open far wider than the ${w} of block ${b.n}, so nothing holds it: it fell out. Close the jaws to a little more than the block, then place it again.`);
        }
        putInJaws(b);
        say(`Block ${b.n} sits between the outside jaws, presenting its ${w}. Close the sliding jaw gently until it touches.`);
        return;
      }
      if (Math.abs(p.x - PAN_X) < 150 && p.y > 400 && p.y < 700) {
        if (st.pan) return home(b, `The pan already holds block ${st.pan.n}. Block ${b.n} goes back to spot ${b.n}.`, 'warn');
        return putOnPan(b);
      }
      const j = TX.findIndex(x => Math.abs(p.x - x) < 105 && p.y > 490);
      if (j >= 0 && j !== b.n - 1) return home(b, `Each block has its own spot: block ${b.n} goes back to spot ${b.n}.`, 'warn');
      return home(b, j === b.n - 1 ? `Block ${b.n} is back in spot ${b.n}.` : `Block ${b.n} returns to spot ${b.n}.`);
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    /* ---------- choosing the dimension (turns the block) ---------- */
    const seg = Array.from(document.querySelectorAll('#dim-seg [data-dim]'));
    function updSeg() {
      seg.forEach(s => s.setAttribute('aria-checked', s.dataset.dim === st.dim ? 'true' : 'false'));
      $('rec-dim').textContent = DIM_NAME[st.dim];
      document.querySelectorAll('#p-tbody tr').forEach(tr => tr.classList.toggle('cur', tr.dataset.dim === st.dim));
    }
    async function setDim(d) {
      const w = DIM_WORD[d];
      if (!st.jaw) { st.dim = d; updSeg(); say(`Measuring the ${w}. Drag a block from its spot into the outside jaws.`); return true; }
      const b = st.jaw;
      if (b.loc !== 'jaws') return false;
      if (d === b.ori) { st.dim = d; updSeg(); return true; }
      if (st.x <= dimOf(b, b.ori) + .0005) { say(`The jaw is closed on block ${b.n}. Open it slightly so the block can be turned.`, 'warn'); return false; }
      if (st.x < dimOf(b, d) - .0005) { say(`Open the jaws wider than the ${w} of block ${b.n} before turning it.`, 'warn'); return false; }
      b.loc = 'anim'; st.dim = d; updSeg();
      await tween(b, { flip: 0 }, 260, k => k * k);
      b.ori = d; b.x = AX; b.y = holdY(b);
      await tween(b, { flip: 1 }, 300, k => 1 - (1 - k) * (1 - k));
      b.loc = 'jaws'; apply();
      say(`Block ${b.n} turned to present its ${w}. Close the sliding jaw onto it.`);
      return true;
    }
    seg.forEach(s => s.addEventListener('click', () => { if (!tutOn()) setDim(s.dataset.dim); }));

    function updZero() {
      const z = $('zero-stat');
      z.innerHTML = st.zero === 'nil' ? 'Zero error: <b>nil</b> (closed jaws read 0.00 cm)' : 'Zero error: <b>not checked</b>';
      z.classList.toggle('ok', st.zero === 'nil');
    }
    $('c-zero').addEventListener('click', () => {
      if (st.jaw) { say('Take the block out of the jaws first: the zero is checked with nothing between them.', 'warn'); return; }
      say('Zero check: close the sliding jaw all the way onto the fixed jaw, with nothing between them, and look at the two zeros in the magnifier.');
    });

    /* ---------- observation table ---------- */
    const tbody = $('p-tbody'), inMsr = $('in-msr'), inVsr = $('in-vsr'), recMsg = $('rec-msg'), tblNote = $('tbl-note');
    function rsay(t, cls) { recMsg.textContent = t; recMsg.className = 'rec-msg' + (cls ? ' ' + cls : ''); }
    function renderTable(fresh) {
      tbody.innerHTML = '';
      DIMS.forEach(d => {
        const r = rows[d], tr = document.createElement('tr');
        tr.dataset.dim = d;
        if (d === fresh) tr.className = 'fresh';
        if (d === st.dim) tr.classList.add('cur');
        tr.innerHTML = r ? `<td>${DIM_NAME[d]}</td><td>${r.msr.toFixed(1)}</td><td>${r.vsr}</td><td>${(r.vsr * LC).toFixed(2)}</td><td>${d} = ${r.tot.toFixed(2)}</td>`
          : `<td>${DIM_NAME[d]}</td><td class="blank">—</td><td class="blank">—</td><td class="blank">—</td><td class="blank">${d} = —</td>`;
        tbody.appendChild(tr);
        $('fx-' + d).textContent = r ? r.tot.toFixed(2) : '—';
      });
      tblNote.textContent = tableBlock ? `Readings for block ${tableBlock.n} (${MAT[tableBlock.mat].name}).` : '';
    }
    function flag(inp, on) { inp.classList.toggle('flag', !!on); }
    function record() {
      flag(inMsr, false); flag(inVsr, false);
      const P = parseNum(inMsr.value), H = parseNum(inVsr.value);
      if (!isFinite(P) || !isFinite(H)) { flag(inMsr, !isFinite(P)); flag(inVsr, !isFinite(H)); return rsay('Enter both the MSR (cm) and the VSR (divisions).', 'warn'); }
      const b = st.jaw;
      if (!b || b.loc !== 'jaws') return rsay('Place a block between the outside jaws and close the sliding jaw onto it first.', 'warn');
      const d = b.ori, c = dimOf(b, d);
      if (tableBlock && b !== tableBlock) return rsay(`The table holds readings for block ${tableBlock.n}. Measure the same block for all three dimensions, or Start over.`, 'warn');
      if (st.x > c + .0005) return rsay('The sliding jaw is not touching the block yet. Close it gently until it touches, then read the scales.', 'warn');
      if (st.sq) return rsay('The jaw is being pressed too hard against the block. Ease it back to light contact before reading.', 'warn');
      const tr = trueReading(st.x);
      if (H !== Math.round(H) || H < 0 || H > NV) {
        flag(inVsr, true);
        if (H > 0 && H < 1) return rsay('VSR is counted in vernier divisions (for example 4), not in cm. The table multiplies it by L.C.', 'warn');
        return rsay('VSR is a whole number of vernier divisions, from 0 to 10.', 'warn');
      }
      if (P > RANGE && Math.abs(P / 10 - tr.msr) < 1e-6) { flag(inMsr, true); return rsay(`The MSR goes in cm here: ${P} mm = ${(P / 10).toFixed(1)} cm.`, 'warn'); }
      if (P < 0 || P > RANGE) { flag(inMsr, true); return rsay('The MSR is a main scale mark between 0 and 15 cm.', 'warn'); }
      if (Math.abs(P * 10 - Math.round(P * 10)) > 1e-6) {
        flag(inMsr, true);
        if (Math.abs(P - tr.tot) < 1e-6) return rsay('That is the whole reading. The MSR is only the main scale mark just before the vernier zero; the vernier part goes in VSR.', 'warn');
        return rsay('The MSR is a main scale mark, so it goes up in steps of 0.1 cm (1 mm).', 'warn');
      }
      if (Math.abs(P + H * LC - tr.tot) > 1e-6) {
        if (Math.abs(P - tr.msr) < 1e-6) { flag(inVsr, true); return rsay('The MSR is right. Look along the vernier for the one mark that lines up exactly with a main scale mark; the magnifier shows it clearly.', 'warn'); }
        if (Math.abs(P - (tr.msr + MSD)) < 1e-6) { flag(inMsr, true); return rsay('That main scale mark is past the vernier zero. The MSR is the mark just before it.', 'warn'); }
        if (Math.abs(P - (tr.msr - MSD)) < 1e-6) { flag(inMsr, true); return rsay('There is a main scale mark closer to the vernier zero. The MSR is the last mark before the zero.', 'warn'); }
        if (Math.abs(Math.abs(P - tr.msr) - 1) < 1e-6) { flag(inMsr, true); return rsay('Count the whole centimetres again: the numbers on the beam mark each cm.', 'warn'); }
        if (H === tr.vsr) { flag(inMsr, true); return rsay('The VSR is right. Read the main scale mark just before the vernier zero again.', 'warn'); }
        flag(inMsr, true); flag(inVsr, true);
        return rsay('That does not match the scales. Read the main scale mark before the vernier zero, then the vernier mark that lines up.', 'warn');
      }
      const had = !!rows[d];
      rows[d] = { msr: P, vsr: H, tot: +(P + H * LC).toFixed(2) };
      tableBlock = b;
      inMsr.value = ''; inVsr.value = '';
      renderTable(d);
      const left = DIMS.filter(k => !rows[k]).map(k => DIM_WORD[k]);
      let m = `${DIM_NAME[d].split(' ')[0]} recorded${had ? ' again' : ''}: ${d} = ${P.toFixed(1)} + ${H} × 0.01 = ${rows[d].tot.toFixed(2)} cm.`;
      m += left.length ? ` Still to measure: ${left.join(' and ')}.` : ' All three dimensions are in: weigh the block, then work out V and ρ.';
      if (st.zero !== 'nil' && Object.values(rows).filter(Boolean).length === 1) m += ' The zero has not been checked yet (close the empty jaws).';
      rsay(m, 'ok');
      return true;
    }
    $('btn-rec').addEventListener('click', record);
    [inMsr, inVsr].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') record(); }));

    /* ---------- calculation + check ---------- */
    const inV = $('in-v'), inM = $('in-m'), inRho = $('in-rho'), chk = $('check-msg');
    const calcIns = [inV, inM, inRho];
    function check() {
      calcIns.forEach(i => i.classList.remove('flag', 'okf'));
      if (!rows.l || !rows.b || !rows.h) { chk.className = 'check-msg nudge'; chk.textContent = 'Record the length, breadth and height first: the calculation starts from those totals.'; return false; }
      const b = tableBlock, probs = [];
      const l = rows.l.tot, bb = rows.b.tot, h = rows.h.tot;
      const v = { V: parseNum(inV.value), m: parseNum(inM.value), rho: parseNum(inRho.value) };
      const res = (inp, ok, msg) => { inp.classList.add(ok ? 'okf' : 'flag'); if (!ok) probs.push(msg); return ok; };
      const VE = l * bb * h;
      let ok = isFinite(v.V) && near(v.V, VE, .004);
      if (!isFinite(v.V)) res(inV, false, 'Fill in the volume V.');
      else if (ok) res(inV, true);
      else if (near(v.V, rows.l.msr * rows.b.msr * rows.h.msr, .004)) res(inV, false, 'This multiplies the MSRs only. Use the total readings, which include VSR × L.C.');
      else if (near(v.V, l + bb + h, .004)) res(inV, false, 'This adds the three lengths. The volume multiplies them: V = l × b × h.');
      else if (near(v.V, l * bb, .004) || near(v.V, bb * h, .004) || near(v.V, l * h, .004)) res(inV, false, 'Only two dimensions are multiplied. V = l × b × h uses all three.');
      else if (near(v.V, VE * 1000, .004)) res(inV, false, 'This volume is in mm³. With l, b and h in cm, V comes out in cm³.');
      else res(inV, false, 'V = l × b × h with the three totals; check the multiplication.');
      const VU = ok ? v.V : VE;
      ok = isFinite(v.m) && Math.abs(v.m - b.m) < .006;
      if (!isFinite(v.m)) res(inM, false, b.weighed ? 'Fill in the mass from the balance.' : `Weigh block ${b.n} on the tared balance; m is its display reading.`);
      else if (ok) res(inM, true);
      else res(inM, false, b.weighed ? `This differs from the balance reading for block ${b.n}.` : `Weigh block ${b.n} on the balance, with the empty pan tared first; m is its display reading.`);
      const mU = ok ? v.m : b.m, rhoE = mU / VU;
      ok = isFinite(v.rho) && near(v.rho, rhoE, .01);
      if (!isFinite(v.rho)) res(inRho, false, 'Fill in the density ρ.');
      else if (ok) res(inRho, true);
      else if (near(v.rho, VU / mU, .01)) res(inRho, false, 'This is V ÷ m, volume per gram. Density is mass per volume: ρ = m ÷ V.');
      else if (near(v.rho, VU * mU, .01)) res(inRho, false, 'This multiplies m and V. Density divides them: ρ = m ÷ V.');
      else res(inRho, false, 'ρ = m ÷ V; check the division.');
      if (!probs.length) {
        const Mt = MAT[b.mat];
        chk.className = 'check-msg ok';
        chk.textContent = `All correct. ρ ≈ ${v.rho.toFixed(2)} g/cm³, close to ${Mt.name} (about ${Mt.rho.toFixed(2)} g/cm³).`;
        return true;
      }
      chk.className = 'check-msg nudge';
      chk.innerHTML = 'Some values need another look:<ul>' + probs.map(p => `<li>${p}</li>`).join('') + '</ul>';
      return false;
    }
    $('btn-check').addEventListener('click', check);
    calcIns.forEach(i => i.addEventListener('input', () => i.classList.remove('flag', 'okf')));

    /* ---------- start over ---------- */
    function resetAll() {
      DIMS.forEach(d => { rows[d] = null; }); tableBlock = null;
      st.jaw = null; st.pan = null; st.tare = 0; st.shown = 0; st.zero = 'unchecked'; st.sqMsg = false; st.dim = 'l';
      weighDisplay.tok = (weighDisplay.tok || 0) + 1; BAL.disp.textContent = '0.00';
      BLOCKS.forEach(b => { b.loc = 'tray'; b.ori = 'l'; b.k = TK; b.flip = 1; b.weighed = false; Object.assign(b, homePos(b)); blkFront.appendChild(b.g); render(b); });
      setLock(false); st.v = 3; apply(); updZero(); updSeg();
      inMsr.value = inVsr.value = ''; flag(inMsr, false); flag(inVsr, false); rsay('');
      calcIns.forEach(i => { i.value = ''; i.classList.remove('flag', 'okf'); });
      ['w-v', 'w-m', 'w-rho'].forEach(k => { $(k).textContent = ''; });
      chk.className = 'check-msg'; chk.textContent = '';
      MG.hi(null); hiSvg(null);
      renderTable();
      say(DEFAULT_MSG);
    }
    $('btn-reset').addEventListener('click', () => { if (!tutOn()) resetAll(); });

    /* ---------- tutorial ---------- */
    function hiSvg(kind) {
      if (!kind) { hiRing.setAttribute('opacity', 0); return; }
      const jx = AX + st.x * S;
      const box = kind === 'wheel' ? [G.wx + st.x * S - G.wr - 8, G.wy - G.wr - 8, 2 * G.wr + 16, 2 * G.wr + 16]
        : kind === 'lock' ? [G.lx + st.x * S - .5 * S, BT - 1.15 * S, S, .98 * S]
        : kind === 'slider' ? [jx - .2 * S, BT - .4 * S, 3.4 * S, G.bh + 1.3 * S]
        : kind === 'pan' ? [PAN_X - 130, 450, 260, 210]
        : kind === 'scales' ? [G.X0 + st.x * S - .4 * S, G.BB - .7 * S, 1.7 * S, 1.5 * S]
        : [AX - 1.5 * S, BT - 1.3 * S, 10 * S, 7 * S];
      hiRing.setAttribute('x', box[0]); hiRing.setAttribute('y', box[1]); hiRing.setAttribute('width', box[2]); hiRing.setAttribute('height', box[3]);
      hiRing.setAttribute('opacity', 1);
    }
    const tut = { on: false, cancel: false, skip: false };
    const bar = $('tut-bar'), tTitle = $('tut-title'), tText = $('tut-text'), tF = $('tut-f'), tForm = $('tut-formula'), btnTut = $('tut-start');
    const STOP = new Error('tutorial-stop');
    function wait(ms) {
      return new Promise((res, rej) => {
        const t0 = performance.now();
        (function w() { if (tut.cancel) return rej(STOP); if (tut.skip || performance.now() - t0 >= ms) return res(); setTimeout(w, 25); })();
      });
    }
    function step(title, text, f) { tut.skip = false; tTitle.textContent = title; tText.textContent = text; tF.textContent = f || ''; }
    let hiEls = [];
    function hi(...els) { hiEls.forEach(e => e.classList.remove('tut-hi')); hiEls = els.filter(Boolean); hiEls.forEach(e => e.classList.add('tut-hi')); }
    async function scrollToEl(elm) {
      const r = elm.getBoundingClientRect();
      const y = window.scrollY + r.top - Math.max(60, (window.innerHeight - Math.min(r.height, window.innerHeight - 200)) / 2 - 70);
      window.scrollTo({ top: Math.max(0, y), behavior: tut.skip ? 'auto' : 'smooth' });
      await wait(800);
    }
    async function typeInto(inp, value, perChar) {
      inp.focus({ preventScroll: true });
      inp.value = '';
      for (const ch of String(value)) { inp.value += ch; inp.dispatchEvent(new Event('input', { bubbles: true })); await wait(perChar || 110); }
      inp.blur();
    }
    async function slideTo(target, ms, mark) {
      const v0 = st.v, t0 = performance.now();
      for (;;) {
        if (tut.cancel) throw STOP;
        let k = Math.min(1, (performance.now() - t0) / ms); if (tut.skip) k = 1;
        const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        moveTo(v0 + (target - v0) * e); hiSvg(mark || 'slider');
        if (k >= 1) break;
        await sleep(16);
      }
    }
    async function wheelIn() {
      const c = contact();
      while (st.v > c + 1e-9) {
        if (tut.cancel) throw STOP;
        moveTo(Math.max(c, st.v - (tut.skip ? 5 : .004))); hiSvg('wheel');
        await sleep(16);
      }
    }
    async function tutorial() {
      tut.on = true; tut.cancel = false; document.body.classList.add('tut-on'); bar.hidden = false; btnTut.disabled = true;
      try {
        resetAll();
        const rig = $('rig-frame'), mag = $('mag-panel'), tbl = $('tbl-panel'), calc = $('calc-panel');
        const b = BLOCKS[0];
        await scrollToEl(rig); hi(rig);
        step('Check the zero', 'With nothing between the jaws, slide the jaw all the way onto the fixed jaw.', '');
        await wait(900);
        await slideTo(.4, 1700);
        step('Close gently', 'The thumb wheel brings the sliding jaw onto the fixed jaw without forcing it.', '');
        await wheelIn(); hiSvg(null); await wait(600);
        await scrollToEl(mag); hi(mag); MG.hi('zero');
        step('Zero error nil', 'The vernier zero lines up exactly with the main scale zero.', 'zero error = nil');
        await wait(2600); MG.hi(null);
        await scrollToEl(rig); hi(rig);
        step('Open the jaws', 'Slide the jaw open, wider than the block.', '');
        await slideTo(6.9, 1800);
        for (let i = 0; i < 3; i++) {
          const d = DIMS[i], w = DIM_WORD[d], D = dimOf(b, d);
          if (i === 0) {
            step('Place block 1', 'Block 1, an aluminium block, goes between the outside jaws to present its length.', '');
            await setDim('l');
            b.loc = 'anim'; blkFront.appendChild(b.g);
            await tween(b, { y: 470, k: .8 }, 500); await tween(b, { x: AX, y: holdY(b), k: 1 }, 800);
            putInJaws(b); await wait(700);
          } else {
            await scrollToEl(rig); hi(rig);
            step(`Turn the block: ${w}`, `Loosen the lock, open the jaw a little and turn the block to present its ${w}.`, '');
            hiSvg('lock'); setLock(false); await wait(800);
            await slideTo(st.v + .3, 700);
            await setDim(d); await wait(700);
          }
          step('Close the jaw', i === 0 ? 'Slide the jaw close to the block without touching it.' : `Bring the jaw close to the ${w}.`, '');
          await slideTo(D + .25, i === 0 ? 1200 : 800);
          step('Thumb wheel', 'Finish with the thumb wheel until the jaw just touches the block: light contact, no squeezing.', '');
          await wheelIn(); await wait(400);
          step('Lock', 'The locking screw holds the jaw still while the scales are read.', '');
          hiSvg('lock'); setLock(true); await wait(i === 0 ? 1200 : 700); hiSvg(null);
          const tr = trueReading(st.x);
          await scrollToEl(mag); hi(mag);
          step('Read the MSR', i === 0 ? 'The main scale mark just before the vernier zero.' : 'Again, the main scale mark just before the vernier zero.', `MSR = ${tr.msr.toFixed(1)} cm`);
          MG.hi('msr'); await wait(i === 0 ? 3400 : 2200);
          step('Read the VSR', i === 0 ? 'Look along the vernier: one mark lines up exactly with a main scale mark.' : 'The vernier mark that lines up with a main scale mark.', `VSR = ${tr.vsr} div`);
          MG.hi('vsr'); await wait(i === 0 ? 3200 : 2200);
          MG.hi(null);
          await scrollToEl(tbl); hi($('rec-row'));
          step(`Record the ${w}`, 'Type MSR and VSR, then Record. The table works out VSR × L.C and the total.', `${d} = ${tr.msr.toFixed(1)} + ${tr.vsr} × 0.01 = ${tr.tot.toFixed(2)} cm`);
          tForm.hidden = false; tForm.innerHTML = `MSR = <b>${tr.msr.toFixed(1)} cm</b> · VSR = <b>${tr.vsr}</b>`;
          await typeInto(inMsr, tr.msr.toFixed(1)); await wait(250);
          await typeInto(inVsr, String(tr.vsr)); await wait(400);
          hi($('btn-rec')); await wait(500); record(); hi(tbl); await wait(i === 0 ? 1600 : 1100);
        }
        tForm.hidden = true;
        await scrollToEl(rig); hi(rig);
        step('Weigh the block', 'Tare the empty balance, loosen the lock, open the jaw and move block 1 onto the pan.', '');
        hiSvg('pan'); BAL.tare.dispatchEvent(new Event('click')); await wait(900);
        hiSvg('lock'); setLock(false); await wait(600);
        await slideTo(st.v + .5, 700);
        st.jaw = null; b.loc = 'anim'; blkFront.appendChild(b.g); apply();
        hiSvg('pan'); b.ori = 'l';
        await tween(b, { x: b.x + 60, y: 420, k: .7 }, 600); await tween(b, { x: PAN_X - b.l * S * TK / 2, y: BAL.panY, k: TK }, 900);
        putOnPan(b); await wait(1400);
        step('Read the balance', 'The display settles on the mass in grams.', `m = ${b.m.toFixed(2)} g`);
        await wait(2000); hiSvg(null);
        await scrollToEl(calc);
        const l = rows.l.tot, bb = rows.b.tot, h = rows.h.tot;
        step('Dimensions', 'The three totals carry over from the table.', `l = ${l.toFixed(2)} cm · b = ${bb.toFixed(2)} cm · h = ${h.toFixed(2)} cm`);
        hi($('cr-dims')); await wait(2000);
        const V = +(l * bb * h).toFixed(2), rho = +(b.m / V).toFixed(2);
        step('Volume', 'Multiply the length, breadth and height.', `V = ${l.toFixed(2)} × ${bb.toFixed(2)} × ${h.toFixed(2)} = ${V.toFixed(2)} cm³`);
        hi($('cr-v')); $('w-v').textContent = `= ${l.toFixed(2)} × ${bb.toFixed(2)} × ${h.toFixed(2)} = ${(l * bb).toFixed(4)} × ${h.toFixed(2)} = ${V.toFixed(2)}`;
        await typeInto(inV, V.toFixed(2)); await wait(900);
        step('Mass', 'The balance reading for block 1.', `m = ${b.m.toFixed(2)} g`);
        hi($('cr-m')); $('w-m').textContent = `balance: ${b.m.toFixed(2)} g`;
        await typeInto(inM, b.m.toFixed(2)); await wait(800);
        step('Density', 'Mass divided by volume.', `ρ = ${b.m.toFixed(2)} ÷ ${V.toFixed(2)} = ${rho.toFixed(2)} g/cm³`);
        hi($('cr-rho')); $('w-rho').textContent = `= ${b.m.toFixed(2)} ÷ ${V.toFixed(2)} = ${rho.toFixed(2)}`;
        await typeInto(inRho, rho.toFixed(2)); await wait(900);
        hi($('btn-check')); await wait(700); check(); hi(chk);
        step('Done', `ρ ≈ ${rho.toFixed(2)} g/cm³, close to aluminium. Start over to take the readings by hand.`, '');
        await wait(4500);
      } catch (e) {
        if (e !== STOP) throw e;
      } finally {
        tut.on = false; tut.skip = false; hi(); hiSvg(null); MG.hi(null); tForm.hidden = true;
        BLOCKS.forEach(bb => { if (bb.loc === 'anim') { bb.loc = 'tray'; bb.ori = 'l'; bb.k = TK; bb.flip = 1; Object.assign(bb, homePos(bb)); render(bb); } });
        freeState();
        document.body.classList.remove('tut-on'); bar.hidden = true; btnTut.disabled = false;
      }
    }
    btnTut.addEventListener('click', () => { if (!tut.on) tutorial(); });
    $('tut-stop').addEventListener('click', () => { tut.cancel = true; });
    $('tut-skip').addEventListener('click', () => { tut.skip = true; });

    apply(); updZero(); updSeg(); renderTable(); say(DEFAULT_MSG);
    window.__vc = { st, rows, BLOCKS, moveTo, setDim, setLock, record, check, resetAll, putInJaws, putOnPan, home, trueReading, MG, G, S, AX, get tableBlock() { return tableBlock; } };
  })();

  /* =====================================================================
     12. OPTIONAL EXTRAS — opens upward, closes ~500 ms after the pointer leaves
     ===================================================================== */
  (function extras() {
    const box = $('extras'), btn = $('extras-toggle');
    let t = null, openedAt = 0;
    const open = () => { clearTimeout(t); if (!box.classList.contains('open')) openedAt = Date.now(); box.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); };
    const close = () => { clearTimeout(t); box.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    const later = () => { clearTimeout(t); t = setTimeout(close, 500); };
    box.addEventListener('mouseenter', open);
    box.addEventListener('mouseleave', later);
    btn.addEventListener('click', () => {
      if (!box.classList.contains('open')) open();
      else if (Date.now() - openedAt > 350) close();
    });
    box.addEventListener('focusin', open);
    box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) later(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  })();

  goTo(fromHash(), false);
})();
