/*
 * The travelling drop. One glass drop in a fixed layer follows the page from
 * resting place to resting place:
 *
 * - Resting places are elements marked [data-drop-slot="on"] inside sections
 *   marked [data-drop-zone]. A zone holds the drop while it fills most of the
 *   screen; between two zones the target glides from one slot to the next on
 *   a gentle arc. Slots are read live, so a slot that moves (a chosen bubble,
 *   the waterline, a hovered house, a tab) carries the drop with it.
 * - The drop follows its target on a spring: it lags a little, stretches
 *   into a teardrop along its path, wobbles as it settles, and casts a soft
 *   shadow only when resting. A zone marked data-drop-merge takes the drop in:
 *   it sinks, and the zone's ripples play.
 * - Jumps (menu links, Home/End) snap instead of flying across the page.
 *
 * Per frame it writes transform, opacity, a path and a clip-path, each only
 * on the drop's own small layer; it runs only while something is moving.
 */

type Zone = { el: HTMLElement; top: number; height: number; dark: boolean; merge: boolean };

export type DropParts = {
  root: HTMLElement;
  glass: HTMLElement;
  body: SVGPathElement;
  lights: SVGGElement;
  shadow: SVGEllipseElement;
};

/** The drop's layer is a fixed square; the drop is drawn about its centre. */
export const BOX = 360;
const HALF = BOX / 2;
const POINTS = 40;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A closed, smooth path through the points (Catmull-Rom as cubic Béziers). */
function closedPath(xs: number[], ys: number[]) {
  const n = xs.length;
  let d = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = (i - 1 + n) % n;
    const p2 = (i + 1) % n;
    const p3 = (i + 2) % n;
    const c1x = xs[i] + (xs[p2] - xs[p0]) / 6;
    const c1y = ys[i] + (ys[p2] - ys[p0]) / 6;
    const c2x = xs[p2] - (xs[p3] - xs[i]) / 6;
    const c2y = ys[p2] - (ys[p3] - ys[i]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${xs[p2].toFixed(1)} ${ys[p2].toFixed(1)}`;
  }
  return `${d}Z`;
}

export function startDrop(parts: DropParts) {
  const { root, glass, body, lights, shadow } = parts;
  const html = document.documentElement;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let zones: Zone[] = [];
  let raf = 0;
  let lastTs = 0;
  let ready = false;
  let visible = false;

  // Spring state: position, velocity, diameter, stretch and its rate, tail, direction, merge.
  let px = 0;
  let py = 0;
  let vx = 0;
  let vy = 0;
  let size = 0;
  let sizeV = 0;
  let stretch = 1;
  let stretchV = 0;
  let tail = 0;
  let dir = Math.PI / 2;
  let merge = 0;
  let lastTx = Number.NaN;
  let lastTy = Number.NaN;
  let lastScroll = window.scrollY;
  let lastTone = "";
  let mergedZone: HTMLElement | null = null;
  // Entrance animations move slots by transform, which no observer sees: stay awake while they run.
  let awakeUntil = performance.now() + 2600;
  // While the page settles (fonts swap, the headline rises), the drop rides its slot rather than flying to it.
  let bootUntil = performance.now() + 1600;

  // Touch already carries momentum: a slightly firmer spring there.
  const K = coarse ? 190 : 150;
  const C = 2 * 0.74 * Math.sqrt(K);
  const KD = 320;
  const CD = 2 * 0.24 * Math.sqrt(KD);

  const measure = () => {
    const scrollY = window.scrollY;
    zones = Array.from(document.querySelectorAll<HTMLElement>("[data-drop-zone]"))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          top: rect.top + scrollY,
          height: rect.height,
          dark: el.dataset.dropZone === "dark",
          merge: el.hasAttribute("data-drop-merge"),
        };
      })
      .filter((zone) => zone.height > 0)
      .sort((a, b) => a.top - b.top);
  };

  const slotOf = (zone: Zone) => {
    const slot = zone.el.querySelector<HTMLElement>('[data-drop-slot="on"]');
    if (!slot) return null;
    const rect = slot.getBoundingClientRect();
    if (!rect.width) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, d: rect.width };
  };

  /** Where the drop should be now: a slot, or a point on the arc between two. */
  const target = () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const last = zones.length - 1;
    for (let i = 0; i <= last; i++) {
      const zone = zones[i];
      const holdStart = i === 0 ? -Infinity : zone.top - vh * 0.3;
      const holdEnd = i === last ? Infinity : Math.max(holdStart, zone.top + zone.height - vh * 0.7);
      if (scrollY < holdStart) {
        // Between the previous zone and this one.
        const prev = zones[i - 1];
        const prevEnd = Math.max(prev.top - vh * 0.3, prev.top + prev.height - vh * 0.7);
        const a = slotOf(prev);
        const b = slotOf(zone);
        if (!a || !b) return a ?? b ? { ...(a ?? b)!, zone: a ? prev : zone, t: a ? 0 : 1 } : null;
        const t = smooth((scrollY - prevEnd) / Math.max(1, holdStart - prevEnd));
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy) || 1;
        // A gentle arc, alternating sides, so the drop flows rather than slides.
        const arc = Math.sin(Math.PI * t) * Math.min(140, length * 0.18) * (i % 2 ? 1 : -1);
        return {
          x: mix(a.x, b.x, t) + (-dy / length) * arc,
          y: mix(a.y, b.y, t) + (dx / length) * arc,
          d: mix(a.d, b.d, t),
          zone: t < 0.5 ? prev : zone,
          t,
        };
      }
      if (scrollY <= holdEnd) {
        const slot = slotOf(zone);
        return slot ? { ...slot, zone, t: 1 } : null;
      }
    }
    return null;
  };

  const render = (zoneDark: boolean, rest: number) => {
    const radius = (size / 2) * (1 - merge * 0.92);
    const s = Math.max(0.6, stretch);
    const across = 1 / Math.sqrt(s);
    const cos = Math.cos(dir);
    const sin = Math.sin(dir);
    const flatten = 1 - merge * 0.6;
    const widen = 1 + merge * 0.5;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < POINTS; i++) {
      const phi = (i / POINTS) * Math.PI * 2;
      const back = Math.max(0, -Math.cos(phi));
      const front = Math.max(0, Math.cos(phi));
      // Pointed behind, a little flatter in front: a teardrop, as much as the speed allows.
      const r = radius * (1 + tail * back ** 3 * 1.15) * (1 - tail * 0.07 * front ** 2);
      const lx = r * Math.cos(phi) * s;
      const ly = r * Math.sin(phi) * across;
      xs.push(HALF + (lx * cos - ly * sin) * widen);
      ys.push(HALF + (lx * sin + ly * cos) * flatten);
    }
    const d = closedPath(xs, ys);
    body.setAttribute("d", d);
    glass.style.clipPath = `path("${d}")`;
    const scale = (radius / 50).toFixed(4);
    lights.setAttribute("transform", `translate(${HALF} ${HALF}) scale(${scale})`);
    lights.style.opacity = (1 - merge).toFixed(3);
    shadow.setAttribute("transform", `translate(${HALF} ${(HALF + radius * 1.02).toFixed(1)}) scale(${scale})`);
    shadow.style.opacity = (rest * (zoneDark ? 0.35 : 0.85)).toFixed(3);
    root.style.transform = `translate3d(${(px - HALF).toFixed(1)}px, ${(py - HALF).toFixed(1)}px, 0)`;
  };

  const tick = (ts: number) => {
    raf = 0;
    const dt = lastTs ? Math.min(1 / 30, (ts - lastTs) / 1000) : 1 / 60;
    lastTs = ts;

    const hidden = "nhOverlay" in html.dataset;
    const goal = ready && !hidden ? target() : null;
    if (!goal) {
      if (visible) {
        visible = false;
        root.dataset.visible = "off";
      }
      lastTs = 0;
      return;
    }

    // A jump (anchor link, Home/End) moves the target a long way at once: arrive there.
    const jumped = Number.isNaN(lastTx) || Math.hypot(goal.x - lastTx, goal.y - lastTy) > window.innerHeight * 0.6;
    lastTx = goal.x;
    lastTy = goal.y;
    if (jumped || !visible || ts < bootUntil) {
      px = goal.x;
      py = goal.y;
      vx = 0;
      vy = 0;
      size = goal.d;
      sizeV = 0;
      stretch = 1;
      stretchV = 0;
    } else {
      const ax = K * (goal.x - px) - C * vx;
      const ay = K * (goal.y - py) - C * vy;
      vx += ax * dt;
      vy += ay * dt;
      px += vx * dt;
      py += vy * dt;
      const as = 140 * (goal.d - size) - 2 * 0.9 * Math.sqrt(140) * sizeV;
      sizeV += as * dt;
      size += sizeV * dt;
    }
    if (!visible) {
      visible = true;
      root.dataset.visible = "on";
    }

    const speed = Math.hypot(vx, vy);
    if (speed > 40) {
      const heading = Math.atan2(vy, vx);
      let delta = heading - dir;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      dir += delta * Math.min(1, dt * 12);
    }
    const stretchGoal = 1 + Math.min(speed / 2600, 0.45);
    const as2 = KD * (stretchGoal - stretch) - CD * stretchV;
    stretchV += as2 * dt;
    stretch += stretchV * dt;
    tail += (clamp((speed - 260) / 2400, 0, 0.6) - tail) * Math.min(1, dt * 10);

    // The last zone takes the drop in once it has come to rest there.
    const zone = goal.zone;
    const settled = Math.hypot(goal.x - px, goal.y - py) < 4 && speed < 60 && goal.t === 1;
    const mergeGoal = zone.merge && settled ? 1 : zone.merge && merge > 0 && goal.t === 1 ? merge : 0;
    merge += (mergeGoal - merge) * Math.min(1, dt * 3.2);
    if (mergeGoal === 0 && merge < 0.01) merge = 0;
    const rippling = zone.merge && merge > 0.35 ? zone.el : null;
    if (rippling !== mergedZone) {
      mergedZone?.removeAttribute("data-drop-ripple");
      rippling?.setAttribute("data-drop-ripple", "");
      mergedZone = rippling;
    }

    const tone = zone.dark ? "dark" : "light";
    if (tone !== lastTone) {
      lastTone = tone;
      root.dataset.tone = tone;
    }

    const rest = clamp(1 - speed / 260) * (1 - merge);
    render(zone.dark, rest);

    const moving = speed > 1.5
      || Math.abs(goal.x - px) > 0.3
      || Math.abs(goal.y - py) > 0.3
      || Math.abs(goal.d - size) > 0.2
      || Math.abs(stretch - stretchGoal) > 0.002
      || Math.abs(stretchV) > 0.01
      || Math.abs(merge - mergeGoal) > 0.004
      || window.scrollY !== lastScroll
      || ts < awakeUntil;
    lastScroll = window.scrollY;
    if (moving) schedule();
    else lastTs = 0;
  };

  function schedule() {
    if (!raf) raf = window.requestAnimationFrame(tick);
  }

  const onLayout = () => {
    measure();
    schedule();
  };
  const onAnimation = () => {
    awakeUntil = Math.max(awakeUntil, performance.now() + 1600);
    schedule();
  };

  const resize = new ResizeObserver(onLayout);
  resize.observe(document.body);
  // A chosen bubble, a hovered house or a new tab moves the slot: follow it.
  const mutations = new MutationObserver(onLayout);
  mutations.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-drop-slot", "data-nh-overlay"] });
  const overlay = new MutationObserver(schedule);
  overlay.observe(html, { attributes: true, attributeFilter: ["data-nh-overlay"] });

  // Captured, so sideways rails (the bubbles, the tabs on phones) carry the drop too.
  document.addEventListener("scroll", schedule, { capture: true, passive: true });
  document.addEventListener("animationstart", onAnimation, true);
  document.addEventListener("transitionstart", onAnimation, true);
  window.addEventListener("resize", onLayout);
  window.addEventListener("load", onLayout);
  void document.fonts?.ready.then(() => {
    bootUntil = Math.max(bootUntil, performance.now() + 400);
    onLayout();
  });

  measure();
  ready = true;
  html.dataset.nhDrop = "live";
  schedule();

  return () => {
    window.cancelAnimationFrame(raf);
    resize.disconnect();
    mutations.disconnect();
    overlay.disconnect();
    document.removeEventListener("scroll", schedule, { capture: true });
    document.removeEventListener("animationstart", onAnimation, true);
    document.removeEventListener("transitionstart", onAnimation, true);
    window.removeEventListener("resize", onLayout);
    window.removeEventListener("load", onLayout);
    mergedZone?.removeAttribute("data-drop-ripple");
    delete html.dataset.nhDrop;
  };
}
