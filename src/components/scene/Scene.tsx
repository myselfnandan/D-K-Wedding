import { motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { useMemo } from 'react';

/**
 * Layered, scroll-scrubbable landscape: night sky → dawn → morning over a Hoysala temple
 * on its platform, with Western Ghats ridges and drifting mist. Pure SVG, no video.
 * `progress` 0..1 drives the time of day; `px`/`py` (−1..1) add pointer parallax.
 */
interface Props {
  progress: MotionValue<number>;
  px?: MotionValue<number>;
  py?: MotionValue<number>;
  dolly?: boolean;
  className?: string;
}

const W = 1600;
const H = 1000;

/** Stepped, star-notched vimana — a stylised Hoysala shrine tower. */
function vimanaPath(cx: number, base: number, width: number, tiers: number, tierH: number) {
  const pts: [number, number][] = [];
  const left: [number, number][] = [];
  let y = base;
  for (let i = 0; i < tiers; i++) {
    const w = width * (1 - i / (tiers + 1.2));
    const notch = Math.max(4, w * 0.06);
    const half = w / 2;
    // left edge of tier with a star notch midway
    left.push([cx - half, y], [cx - half, y - tierH * 0.45], [cx - half + notch, y - tierH * 0.5], [cx - half, y - tierH * 0.55], [cx - half, y - tierH]);
    y -= tierH;
  }
  const topW = width * 0.16;
  left.push([cx - topW / 2, y], [cx - topW * 0.35, y - tierH * 0.9]);
  // kalasha
  const k = y - tierH * 0.9;
  pts.push(...left);
  pts.push([cx - 6, k], [cx - 9, k - 10], [cx, k - 26], [cx + 9, k - 10], [cx + 6, k]);
  const right = left.map(([x, yy]) => [2 * cx - x, yy] as [number, number]).reverse();
  pts.push(...right);
  return 'M' + pts.map(([x, yy]) => `${x.toFixed(1)} ${yy.toFixed(1)}`).join(' L') + ' Z';
}

function ridge(seed: number, baseY: number, amp: number, steps = 9) {
  let d = `M0 ${H} L0 ${baseY}`;
  const step = W / steps;
  for (let i = 1; i <= steps; i++) {
    const x = i * step;
    const y = baseY - amp * (0.5 + 0.5 * Math.sin(seed + i * 1.7) * Math.cos(seed * 0.7 + i * 0.9));
    const cx = x - step / 2;
    const cy = baseY - amp * (0.6 + 0.4 * Math.sin(seed * 1.3 + i * 2.1));
    d += ` Q${cx.toFixed(0)} ${cy.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  return d + ` L${W} ${H} Z`;
}

export function Scene({ progress, px, py, dolly = false, className }: Props) {
  const stars = useMemo(() => {
    let s = 7;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * H * 0.55, r: 0.6 + rnd() * 1.4, o: 0.35 + rnd() * 0.6 }));
  }, []);

  const skyTop = useTransform(progress, [0, 0.35, 0.6, 0.8, 1], ['#0d1030', '#1b2152', '#5c63c4', '#8fb6d8', '#a6c8e2']);
  const skyBottom = useTransform(progress, [0, 0.35, 0.6, 0.8, 1], ['#252b62', '#4b4f9e', '#b5baff', '#dbe6f6', '#f5f7fd']);
  const starOpacity = useTransform(progress, [0, 0.45, 0.58], [1, 0.6, 0]);
  const orbX = useTransform(progress, [0, 0.3, 1], [W * 0.62, W * 0.8, W * 0.3]);
  const orbY = useTransform(progress, [0, 0.3, 0.5, 0.7, 1], [110, 150, 560, 300, 170]);
  const orbFill = useTransform(progress, [0, 0.45, 0.55, 1], ['#e9ecff', '#e9ecff', '#fff4dc', '#ffffff']);
  const orbGlow = useTransform(progress, [0, 0.5, 0.65, 1], [0.25, 0.1, 0.55, 0.35]);
  const far = useTransform(progress, [0, 0.6, 1], ['#2a3170', '#7d86d8', '#9cbedb']);
  const mid = useTransform(progress, [0, 0.6, 1], ['#20265a', '#565fb5', '#7c9fc6']);
  const near = useTransform(progress, [0, 0.6, 1], ['#161a35', '#2b3170', '#3c4b86']);
  const temple = useTransform(progress, [0, 0.6, 1], ['#0f1229', '#1d2252', '#262c62']);
  const carve = useTransform(progress, [0, 0.6, 1], [0.35, 0.5, 0.65]);
  const mistOpacity = useTransform(progress, [0, 0.4, 0.7, 1], [0.08, 0.2, 0.55, 0.35]);
  const mistX = useTransform(progress, [0, 1], [-120, 120]);

  const farY = useTransform(progress, [0, 1], [0, dolly ? -30 : 0]);
  const midY = useTransform(progress, [0, 1], [0, dolly ? -60 : 0]);
  const nearY = useTransform(progress, [0, 1], [0, dolly ? -90 : 0]);
  const templeScale = useTransform(progress, [0, 1], dolly ? [0.82, 1.18] : [1, 1]);

  // Pointer parallax (hero only)
  const zeroX = useMotionValue(0);
  const zeroY = useMotionValue(0);
  const pX = px ?? zeroX;
  const pY = py ?? zeroY;
  const mistX2 = useTransform(mistX, (v) => -v * 0.7);
  const farPX = useTransform(pX, (v) => v * -8);
  const midPX = useTransform(pX, (v) => v * -16);
  const nearPX = useTransform(pX, (v) => v * -28);
  const orbPX = useTransform(pX, (v) => v * 10);
  const tiltY = useTransform(pY, (v) => v * -6);

  const vimana = useMemo(() => vimanaPath(800, 820, 300, 7, 52), []);
  const sideShrine = useMemo(() => vimanaPath(560, 838, 150, 5, 34), []);
  const sideShrine2 = useMemo(() => vimanaPath(1040, 838, 150, 5, 34), []);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <motion.stop offset="0%" style={{ stopColor: skyTop }} />
          <motion.stop offset="100%" style={{ stopColor: skyBottom }} />
        </linearGradient>
        <radialGradient id="orbGlow">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="blur18" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <pattern id="frieze" width="22" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 9 Q5.5 1 11 9 Q16.5 1 22 9" fill="none" stroke="#b5baff" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width={W} height={H} fill="url(#sky)" />

      <motion.g style={{ opacity: starOpacity, y: tiltY }}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#eef1ff" opacity={s.o} />
        ))}
      </motion.g>

      <motion.g style={{ x: orbPX }}>
        <motion.circle cx={orbX} cy={orbY} r={150} fill="url(#orbGlow)" style={{ opacity: orbGlow }} />
        <motion.circle cx={orbX} cy={orbY} r={46} style={{ fill: orbFill }} />
      </motion.g>

      <motion.path d={ridge(1.2, 640, 150)} style={{ fill: far, y: farY, x: farPX }} />
      <motion.rect
        x={-200}
        y={650}
        width={W + 400}
        height={60}
        fill="#ffffff"
        filter="url(#blur18)"
        style={{ opacity: mistOpacity, x: mistX }}
      />
      <motion.path d={ridge(3.4, 720, 110, 7)} style={{ fill: mid, y: midY, x: midPX }} />
      <motion.rect
        x={-200}
        y={740}
        width={W + 400}
        height={46}
        fill="#ffffff"
        filter="url(#blur18)"
        style={{ opacity: mistOpacity, x: mistX2 }}
      />

      <motion.g style={{ scale: templeScale, originX: '50%', originY: '100%', x: nearPX }}>
        <motion.path d={sideShrine} style={{ fill: temple }} />
        <motion.path d={sideShrine2} style={{ fill: temple }} />
        <motion.path d={vimana} style={{ fill: temple }} />
        {/* mantapa platform (jagati) with carved friezes */}
        <motion.path d="M380 880 L420 838 L1180 838 L1220 880 Z" style={{ fill: temple }} />
        <motion.rect x={340} y={880} width={920} height={34} style={{ fill: temple }} />
        <motion.rect x={430} y={846} width={740} height={10} fill="url(#frieze)" style={{ opacity: carve }} />
        <motion.rect x={360} y={890} width={880} height={10} fill="url(#frieze)" style={{ opacity: carve }} />
        <motion.g style={{ opacity: carve }} stroke="#b5baff" strokeWidth={1}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={680 + i * 30} y1={838} x2={680 + i * 30} y2={808 - (i % 2) * 6} />
          ))}
        </motion.g>
      </motion.g>

      <motion.path d={ridge(5.1, 900, 40, 6)} style={{ fill: near, y: nearY }} />
      <motion.rect x={0} y={930} width={W} height={H - 930} style={{ fill: near }} />
    </svg>
  );
}
