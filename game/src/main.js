// Warung Kilat — entry point: the game loop, input wiring, screenshot staging
// (?shot=start|play|serve|end&seed=N) and the small window.__game handle the
// playtest uses to read state and drive the real controls.
import { LAYOUT, STEP, VIEW } from './config.js';
import { unlockAudio, sound, syncSizzle } from './audio.js';
import { handleClick, handleKey } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { World, EVENT_BURNT, EVENT_DAY_WIN, EVENT_FAILED, EVENT_NEW_CUSTOMER, EVENT_OVER, EVENT_SERVED, EVENT_STATION_DONE } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam !== 0 ? seedParam : (Date.now() % 2147483647);
const world = new World(seed);
const shotName = params.get('shot');

// A small handle for playtests and screenshots: read the state, drive the real
// controls, and see the same layout the renderer draws and input hit-tests.
window.__game = {
  world,
  get state() {
    return {
      screen: world.screen,
      day: world.day,
      coins: world.coins,
      dayCoins: world.dayCoins,
      targetCoins: world.targetCoins,
      score: world.score,
      strikes: world.strikes,
      dayTimeLeft: world.dayTimeLeft,
      customers: world.customers.map((c) => ({ recipeId: c.recipeId, patience: c.patience })),
      plate: world.plate.slice(),
      stations: world.stations.map((s) => ({ kind: s.kind, status: s.status, item: s.item })),
      servedCount: world.servedCount,
      failedCount: world.failedCount,
    };
  },
  layout: LAYOUT,
  start: () => world.startGame(),
  addIngredient: (id) => world.addIngredient(id),
  collectStation: (i) => world.collectStation(i),
  serve: () => world.servePlate(),
  clearPlate: () => world.clearPlate(),
  pause: () => world.togglePause(),
  restart: () => world.startGame(),
  nextDay: () => world.nextDay(),
  version: 'warung-kilat-1',
};

function playSoundsFor(events) {
  if (events & EVENT_SERVED) sound.serve();
  if (events & EVENT_FAILED) sound.fail();
  if (events & EVENT_DAY_WIN) sound.dayWin();
  if (events & EVENT_OVER) sound.gameOver();
  if (events & EVENT_NEW_CUSTOMER) sound.newCustomer();
  if (events & EVENT_STATION_DONE) sound.stationDone();
  if (events & EVENT_BURNT) sound.burn();
  syncSizzle(world.anyCooking());
}

function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (VIEW.width / rect.width),
    y: (event.clientY - rect.top) * (VIEW.height / rect.height),
  };
}

canvas.addEventListener('pointerdown', (event) => {
  unlockAudio();
  const { x, y } = toLogical(event);
  if (handleClick(world, x, y)) sound.click();
  drawNow();
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  unlockAudio();
  if (handleKey(world, event.key)) {
    event.preventDefault();
    drawNow();
  }
});

let lastNow = performance.now();
let accumulator = 0;
function drawNow() {
  render(ctx, world, performance.now() / 1000);
}

function frame(now) {
  const elapsed = Math.min(0.25, (now - lastNow) / 1000);
  lastNow = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    const events = world.step(STEP);
    if (events) playSoundsFor(events);
    accumulator -= STEP;
  }
  drawNow();
  requestAnimationFrame(frame);
}

if (shotName) {
  // Screenshot mode: stage the scene, draw it, then tell the capturer it is ready.
  stageShot(shotName, world);
  drawNow();
  requestAnimationFrame(() => {
    drawNow();
    window.__shotReady = true;
  });
} else {
  drawNow();
  requestAnimationFrame(frame);
}
