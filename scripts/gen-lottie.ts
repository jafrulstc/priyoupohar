/**
 * Generates a lightweight hand-crafted Lottie "sparkle burst" celebration
 * animation at src/lib/lottie/celebration.json (no external CDN dependency).
 */
import { writeFileSync } from "fs";

const fr = 60;
const op = 150; // 2.5s loop
const W = 240;
const H = 240;

type Layer = Record<string, unknown>;

const ease = {
  i: { x: [0.4], y: [1] },
  o: { x: [0.6], y: [0] },
};

function sparkle(index: number, total: number, color: [number, number, number, number], radius: number, size: number): Layer {
  const angle = (index / total) * Math.PI * 2;
  const x = W / 2 + Math.cos(angle) * radius;
  const y = H / 2 + Math.sin(angle) * radius;
  const start = Math.round((index / total) * 30);
  return {
    ddd: 0,
    ind: index + 1,
    ty: 4,
    nm: `sparkle-${index}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { ...ease, t: start, s: [0] },
          { ...ease, t: start + 14, s: [100] },
          { ...ease, t: start + 70, s: [0] },
        ],
      },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [x, y, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { ...ease, t: start, s: [0, 0, 100] },
          { ...ease, t: start + 18, s: [120, 120, 100] },
          { ...ease, t: start + 70, s: [30, 30, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [size, size] } },
          {
            ty: "fl",
            c: { a: 0, k: color },
            o: { a: 0, k: 100 },
            r: 1,
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: 0,
    op,
    st: 0,
    bm: 0,
  };
}

function star(index: number, total: number, radius: number, size: number): Layer {
  const angle = (index / total) * Math.PI * 2 + Math.PI / total;
  const x = W / 2 + Math.cos(angle) * radius;
  const y = H / 2 + Math.sin(angle) * radius;
  const start = Math.round((index / total) * 30) + 10;
  return {
    ddd: 0,
    ind: 100 + index,
    ty: 4,
    nm: `star-${index}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { ...ease, t: start, s: [0] },
          { ...ease, t: start + 16, s: [100] },
          { ...ease, t: start + 80, s: [0] },
        ],
      },
      r: {
        a: 1,
        k: [
          { ...ease, t: start, s: [0] },
          { ...ease, t: start + 80, s: [90] },
        ],
      },
      p: { a: 0, k: [x, y, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { ...ease, t: start, s: [0, 0, 100] },
          { ...ease, t: start + 20, s: [110, 110, 100] },
          { ...ease, t: start + 80, s: [40, 40, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [size, size * 0.34] },
            r: { a: 0, k: 4 },
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.96, 0.62, 0.04, 1] },
            o: { a: 0, k: 100 },
            r: 1,
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
      {
        ty: "gr",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [size * 0.34, size] },
            r: { a: 0, k: 4 },
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.96, 0.62, 0.04, 1] },
            o: { a: 0, k: 100 },
            r: 1,
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: 0,
    op,
    st: 0,
    bm: 0,
  };
}

const rose: [number, number, number, number] = [0.882, 0.114, 0.282, 1];
const amber: [number, number, number, number] = [0.961, 0.62, 0.043, 1];
const blush: [number, number, number, number] = [0.984, 0.447, 0.522, 1];
const cream: [number, number, number, number] = [1, 0.98, 0.941, 1];

const layers: Layer[] = [
  ...Array.from({ length: 10 }, (_, i) =>
    sparkle(i, 10, i % 3 === 0 ? amber : i % 3 === 1 ? rose : blush, 78, i % 2 ? 18 : 12)
  ),
  ...Array.from({ length: 4 }, (_, i) => star(i, 4, 46, 26)),
  // center heart-dot
  sparkle(0, 1, cream, 0, 34),
];

const animation = {
  v: "5.7.4",
  fr,
  ip: 0,
  op,
  w: W,
  h: H,
  nm: "celebration-burst",
  ddd: 0,
  assets: [],
  layers,
  markers: [],
};

const out = "/home/z/my-project/src/lib/lottie/celebration.json";
writeFileSync(out, JSON.stringify(animation));
console.log(`Wrote ${out} (${layers.length} layers)`);
