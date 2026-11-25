// Warung Kilat — mouse and keyboard controls. Hit-testing reads the same LAYOUT
// rectangles render.js draws, so a click lands exactly where the picture says.
import { BIN_ORDER, INGREDIENTS, LAYOUT } from './config.js';
import { sound } from './audio.js';
import {
  SCREEN_DAY_WIN, SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE,
} from './world.js';

function inside(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

/**
 * Handle a click at logical canvas coordinates. Returns true when the click did
 * something, so main.js knows whether to play the click sound.
 */
export function handleClick(world, x, y) {
  const screen = world.screen;
  if (screen === SCREEN_TITLE) {
    if (inside(x, y, LAYOUT.titleStartButton)) { world.startGame(); return true; }
    return false;
  }
  if (screen === SCREEN_DAY_WIN) {
    if (inside(x, y, LAYOUT.dayNextButton)) { world.nextDay(); return true; }
    return false;
  }
  if (screen === SCREEN_OVER) {
    if (inside(x, y, LAYOUT.overRestartButton)) { world.startGame(); return true; }
    return false;
  }
  if (screen === SCREEN_PAUSE) {
    world.togglePause();
    return true;
  }
  if (screen !== SCREEN_PLAY) return false;

  if (inside(x, y, LAYOUT.pauseButton)) { world.togglePause(); return true; }
  if (inside(x, y, LAYOUT.serveButton)) {
    const result = world.servePlate();
    if (result === 'served') sound.serve();
    else if (result === 'nomatch') sound.wrong();
    return true;
  }
  if (inside(x, y, LAYOUT.trashButton)) {
    if (world.clearPlate()) sound.trash();
    return true;
  }
  // Cooking stations: collect a finished dish, throw burnt food away.
  for (let i = 0; i < LAYOUT.stations.length; i += 1) {
    if (inside(x, y, LAYOUT.stations[i])) {
      const result = world.collectStation(i);
      if (result === 'collected') sound.add();
      else if (result === 'trashed') sound.trash();
      return true;
    }
  }
  // Ingredient bins: ready food goes on the plate, raw food starts cooking.
  for (let i = 0; i < LAYOUT.bins.length; i += 1) {
    if (inside(x, y, LAYOUT.bins[i])) {
      const id = LAYOUT.bins[i].id;
      const added = world.addIngredient(id);
      if (added) {
        if (INGREDIENTS[id].station) sound.cookStart();
        else sound.add();
      } else sound.wrong();
      return true;
    }
  }
  // Click an item on the plate to take it off again. The icon positions match
  // the centred plate render.js draws (plate centre, same angles and offsets).
  const plate = LAYOUT.plate;
  if (inside(x, y, plate) && world.plate.length > 0) {
    const px = plate.x + plate.w / 2;
    const py = plate.y + 66;
    let bestIndex = -1;
    let bestDist = 40;
    world.plate.forEach((item, i) => {
      const angle = -0.5 + i * 0.45;
      const ix = px + Math.cos(angle) * 30;
      const iy = py + Math.sin(angle) * 12;
      const dist = Math.hypot(x - ix, y - iy);
      if (dist < bestDist) { bestDist = dist; bestIndex = i; }
    });
    if (bestIndex >= 0) {
      world.removePlateItem(bestIndex);
      sound.click();
      return true;
    }
  }
  return false;
}

/** Handle a key press. Returns true when the key did something. */
export function handleKey(world, key) {
  const k = key.toLowerCase();
  if (k === 'r') {
    if (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSE
      || world.screen === SCREEN_OVER || world.screen === SCREEN_DAY_WIN) {
      world.startGame();
      return true;
    }
    return false;
  }
  if (k === 'enter' || k === ' ') {
    if (world.screen === SCREEN_TITLE) { world.startGame(); return true; }
    if (world.screen === SCREEN_DAY_WIN) { world.nextDay(); return true; }
    if (world.screen === SCREEN_OVER) { world.startGame(); return true; }
    if (world.screen === SCREEN_PAUSE) { world.togglePause(); return true; }
    if (k === ' ') {
      const result = world.servePlate();
      if (result === 'served') sound.serve();
      else if (result === 'nomatch') sound.wrong();
      return true;
    }
    return false;
  }
  if ((k === 'p' || k === 'escape')
    && (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSE)) {
    world.togglePause();
    return true;
  }
  if (world.screen !== SCREEN_PLAY) return false;
  if (k === 'delete' || k === 'backspace') {
    if (world.clearPlate()) sound.trash();
    return true;
  }
  // Keys 1-6: add the matching bin ingredient (raw ones start cooking).
  const binIndex = ['1', '2', '3', '4', '5', '6'].indexOf(k);
  if (binIndex >= 0) {
    const id = BIN_ORDER[binIndex];
    const added = world.addIngredient(id);
    if (added) {
      if (INGREDIENTS[id].station) sound.cookStart();
      else sound.add();
    } else sound.wrong();
    return true;
  }
  // Q, W, E: collect station 1, 2, 3.
  const stationIndex = ['q', 'w', 'e'].indexOf(k);
  if (stationIndex >= 0) {
    const result = world.collectStation(stationIndex);
    if (result === 'collected') sound.add();
    else if (result === 'trashed') sound.trash();
    return true;
  }
  return false;
}
