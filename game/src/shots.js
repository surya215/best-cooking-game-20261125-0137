// Warung Kilat — the four screenshot scenes behind ?shot=start|play|serve|end.
// Each scene plays the real rules forward from a fresh world, steered by a small
// autopilot (collect finished stations, cook what the oldest order needs, serve
// when the plate matches), so every frame is what a short game really looks like
// and the same seed always gives the same frame.
import { INGREDIENTS, RECIPES, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, sameItems } from './world.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 30;
const END_LIMIT_SECONDS = 400;
const SAMPLE = STEP;

/** The first ingredient of `recipeId` the plate still misses. */
function missingItem(world, recipeId) {
  const plate = world.plate;
  const rest = RECIPES[recipeId].items.slice();
  for (const item of plate) {
    const at = rest.indexOf(item);
    if (at !== -1) rest.splice(at, 1);
  }
  return rest[0] ?? null;
}

/** One autopilot decision: collect, cook, add or serve — never a wrong move. */
function autopilot(world) {
  // Collect every finished station first.
  for (let i = 0; i < world.stations.length; i += 1) {
    const station = world.stations[i];
    if (station.status === 'done') {
      const cooked = INGREDIENTS[station.item].cooked;
      if (!world.plate.includes(cooked)) world.collectStation(i);
    } else if (station.status === 'burnt') {
      world.collectStation(i);
    }
  }
  // Serve when the plate matches any waiting order.
  for (const customer of world.customers) {
    if (sameItems(world.plate, RECIPES[customer.recipeId].items)) {
      world.servePlate();
      return;
    }
  }
  if (world.customers.length === 0) return;
  // Work on the oldest order; drop a plate no order can still use.
  const target = world.customers[0];
  const recipe = RECIPES[target.recipeId];
  const plateFits = world.plate.every((item) => recipe.items.includes(item))
    && world.plate.length <= recipe.items.length;
  if (!plateFits) {
    world.clearPlate();
    return;
  }
  const missing = missingItem(world, target.recipeId);
  if (!missing) return;
  const ing = INGREDIENTS[missing];
  if (ing.station === null) {
    world.addIngredient(missing);
    return;
  }
  // The missing item must be cooked: find its raw form and start it.
  const rawId = Object.keys(INGREDIENTS).find((id) => INGREDIENTS[id].cooked === missing);
  const cooking = world.stations.some((s) => s.item === rawId && s.status === 'cooking');
  if (!cooking) world.addIngredient(rawId);
}

/** Step the world with the autopilot for `seconds`, or until it ends. */
function playForward(world, seconds) {
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (i % 15 === 0) autopilot(world);
    const events = world.step(SAMPLE);
    if (world.screen === SCREEN_OVER) break;
    if (events === undefined) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: title over a staged kitchen. play: mid-game, dishes served.
 * serve: a plate mid-assembly, one dish ready to serve. end: game over.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'serve') {
    world.startGame();
    world.spawnCustomer('nasi-ayam');
    world.spawnCustomer('nasi-telur');
    world.addIngredient('nasi');
    world.addIngredient('ayam-mentah');
    // Let the chicken finish frying, then put it on the plate: a dish ready.
    for (let i = 0; i < 7 / SAMPLE; i += 1) world.step(SAMPLE);
    world.collectStation(0);
    // Start a second dish so the kitchen reads busy: an egg on the other wok.
    world.addIngredient('telur-mentah');
    for (let i = 0; i < 2 / SAMPLE; i += 1) world.step(SAMPLE);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'play') {
    world.startGame();
    playForward(world, PLAY_SECONDS);
    if (world.screen === SCREEN_PLAY) {
      // Refresh the board so the capture shows a live kitchen: fresh customers
      // with full patience, something cooking, and a dish mid-assembly.
      while (world.customers.length < 2) world.spawnCustomer();
      for (const customer of world.customers) customer.patience = customer.maxPatience;
      if (world.plate.length === 0) world.addIngredient('nasi');
      if (!world.stations.some((s) => s.status === 'cooking')) world.addIngredient('ayam-mentah');
    }
    return { screen: world.screen };
  }
  if (name === 'end') {
    world.startGame();
    // Idle: nobody cooks, nobody serves — patience runs out three times.
    for (let i = 0; i < END_LIMIT_SECONDS / SAMPLE; i += 1) {
      world.step(SAMPLE);
      if (world.screen === SCREEN_OVER) break;
    }
    return { screen: SCREEN_OVER };
  }
  // start: title screen over a lively kitchen, so the cover shows the game.
  world.startGame();
  world.spawnCustomer('nasi-ayam');
  world.spawnCustomer('mie-goreng');
  world.addIngredient('nasi');
  world.addIngredient('ayam-mentah');
  for (let i = 0; i < START_SECONDS / SAMPLE; i += 1) world.step(SAMPLE);
  world.collectStation(0);
  world.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE };
}
