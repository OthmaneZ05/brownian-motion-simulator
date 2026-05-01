const canvas = document.getElementById("brownian-canvas");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random) {
  let u = 0;
  let v = 0;

  while (u === 0) {
    u = random();
  }

  while (v === 0) {
    v = random();
  }

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildPaths() {
  const random = mulberry32(42);
  const steps = 170;
  const pathCount = 11;
  const paths = [];

  for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
    const points = [0];
    const drift = pathIndex % 5 === 0 ? 0.002 : 0;

    for (let step = 1; step < steps; step += 1) {
      const next = points[step - 1] + gaussian(random) * 0.055 + drift;
      points.push(next);
    }

    paths.push(points);
  }

  return paths;
}

const colors = [
  "#0f766e",
  "#2563a5",
  "#a84743",
  "#7b5ea7",
  "#8a6f2a",
  "#257a43",
  "#b65c8a",
  "#53615d",
  "#c2642c",
  "#1797a0",
  "#252a28",
];

let paths = buildPaths();
let animationFrame = 0;
let progress = prefersReducedMotion ? 1 : 0.24;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawGrid(width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e6ebe7";
  ctx.lineWidth = 1;

  for (let x = 32; x < width; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height - 44);
    ctx.stroke();
  }

  for (let y = 32; y < height - 44; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#aeb8b1";
  ctx.beginPath();
  ctx.moveTo(24, (height - 44) / 2);
  ctx.lineTo(width - 24, (height - 44) / 2);
  ctx.stroke();
}

function drawPaths() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const plotHeight = height - 44;
  const left = 24;
  const right = width - 24;
  const top = 26;
  const bottom = plotHeight - 26;
  const visibleSteps = Math.max(2, Math.floor(paths[0].length * progress));
  const flat = paths.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const range = max - min || 1;

  drawGrid(width, height);

  paths.forEach((path, pathIndex) => {
    ctx.beginPath();
    ctx.strokeStyle = colors[pathIndex % colors.length];
    ctx.globalAlpha = pathIndex === 0 ? 0.95 : 0.72;
    ctx.lineWidth = pathIndex === 0 ? 2.4 : 1.7;

    for (let step = 0; step < visibleSteps; step += 1) {
      const x = left + (step / (path.length - 1)) * (right - left);
      const y = bottom - ((path[step] - min) / range) * (bottom - top);

      if (step === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  });

  ctx.globalAlpha = 1;
}

function tick() {
  progress = Math.min(progress + 0.02, 1);
  drawPaths();

  if (progress < 1) {
    animationFrame = requestAnimationFrame(tick);
  }
}

function restartCanvas() {
  cancelAnimationFrame(animationFrame);
  resizeCanvas();
  paths = buildPaths();
  progress = prefersReducedMotion ? 1 : 0.24;
  drawPaths();

  if (!prefersReducedMotion) {
    animationFrame = requestAnimationFrame(tick);
  }
}

restartCanvas();

window.addEventListener("resize", restartCanvas);
