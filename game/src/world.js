// Warung Kilat — the game rules: customers and their patience, cooking stations
// that can burn, the assembly plate, serving, day targets and strikes. No drawing
// here; render.js reads this state and draws it.
import {
  BURN_SECONDS, CLEAN_DAY_BONUS, CUSTOMER_LOOKS, INGREDIENTS, LAYOUT,
  MAX_CUSTOMERS, MAX_PLATE_ITEMS, MAX_STRIKES, RECIPES, RECIPE_IDS, dayTuning,
} from './config.js';
import { makeRandom, pickRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_DAY_WIN = 'daywin';
export const SCREEN_OVER = 'over';

// Events the step function reports so main.js can play the right sound.
export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_FAILED = 2;
export const EVENT_DAY_WIN = 4;
export const EVENT_OVER = 8;
export const EVENT_NEW_CUSTOMER = 16;
export const EVENT_STATION_DONE = 32;
export const EVENT_BURNT = 64;

/** True when two item lists hold the same items, order aside. */
export function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const rest = b.slice();
  for (const item of a) {
    const at = rest.indexOf(item);
    if (at === -1) return false;
    rest.splice(at, 1);
  }
  return true;
}

/** The dishes this day may order (harder dishes unlock from day 2). */
export function menuForDay(day) {
  return RECIPE_IDS.filter((id) => RECIPES[id].minDay <= day);
}

export class World {
  constructor(seed) {
    this.rng = makeRandom(seed >>> 0 || 1);
    this.reset();
  }

  reset() {
    const tuning = dayTuning(1);
    this.screen = SCREEN_TITLE;
    this.day = 1;
    this.coins = 0;
    this.dayCoins = 0;
    this.score = 0;
    this.strikes = 0;
    this.dayTimeLeft = tuning.daySeconds;
    this.daySeconds = tuning.daySeconds;
    this.targetCoins = tuning.targetCoins;
    this.spawnTimer = tuning.firstSpawnSeconds;
    this.customers = [];
    this.stations = LAYOUT.stations.map((s) => ({
      kind: s.kind, label: s.label, status: 'idle', item: null, t: 0, cookTime: 0,
    }));
    this.plate = [];
    this.servedCount = 0;
    this.failedCount = 0;
    this.nextCustomerId = 1;
    this.overReason = '';
    this.best = 0;
    this.flash = 0; // plate shake timer after a wrong serve
    this.events = EVENT_NONE;
  }

  /** Start day 1 from the title screen. */
  startGame() {
    this.reset();
    this.screen = SCREEN_PLAY;
  }

  /** Begin the next day after a day win: fresh timer, target and customers. */
  nextDay() {
    const tuning = dayTuning(this.day + 1);
    this.day += 1;
    this.dayCoins = 0;
    this.dayTimeLeft = tuning.daySeconds;
    this.daySeconds = tuning.daySeconds;
    this.targetCoins = tuning.targetCoins;
    this.spawnTimer = tuning.firstSpawnSeconds;
    this.customers = [];
    this.plate = [];
    this.stations.forEach((s) => { s.status = 'idle'; s.item = null; s.t = 0; });
    this.screen = SCREEN_PLAY;
  }

  togglePause() {
    if (this.screen === SCREEN_PLAY) this.screen = SCREEN_PAUSE;
    else if (this.screen === SCREEN_PAUSE) this.screen = SCREEN_PLAY;
  }

  restart() {
    this.reset();
  }

  // --- customers ---------------------------------------------------------
  spawnCustomer(forcedRecipeId = null) {
    if (this.customers.length >= MAX_CUSTOMERS) return null;
    const tuning = dayTuning(this.day);
    const menu = menuForDay(this.day);
    const recipeId = forcedRecipeId || pickRandom(this.rng, menu);
    const look = pickRandom(this.rng, CUSTOMER_LOOKS);
    const customer = {
      id: this.nextCustomerId,
      recipeId,
      patience: tuning.patienceSeconds,
      maxPatience: tuning.patienceSeconds,
      look,
      bornAt: this.daySeconds - this.dayTimeLeft,
    };
    this.nextCustomerId += 1;
    this.customers.push(customer);
    this.events |= EVENT_NEW_CUSTOMER;
    return customer;
  }

  // --- ingredients and cooking -------------------------------------------
  /** Add a bin ingredient: ready ones land on the plate, raw ones start cooking. */
  addIngredient(id) {
    const ing = INGREDIENTS[id];
    if (!ing || this.screen !== SCREEN_PLAY) return false;
    if (ing.station === null) {
      if (this.plate.length >= MAX_PLATE_ITEMS) return false;
      if (this.plate.includes(id)) return false;
      this.plate.push(id);
      return true;
    }
    const station = this.stations.find((s) => s.kind === ing.station && s.status === 'idle');
    if (!station) return false;
    station.status = 'cooking';
    station.item = id;
    station.t = 0;
    station.cookTime = ing.cookTime;
    return true;
  }

  /** Collect a finished station onto the plate, or throw burnt food away. */
  collectStation(index) {
    const station = this.stations[index];
    if (!station || this.screen !== SCREEN_PLAY) return 'none';
    if (station.status === 'done') {
      if (this.plate.length >= MAX_PLATE_ITEMS) return 'full';
      const cooked = INGREDIENTS[station.item].cooked;
      if (this.plate.includes(cooked)) return 'dup';
      this.plate.push(cooked);
      station.status = 'idle';
      station.item = null;
      station.t = 0;
      return 'collected';
    }
    if (station.status === 'burnt') {
      station.status = 'idle';
      station.item = null;
      station.t = 0;
      return 'trashed';
    }
    return 'none';
  }

  /** Take one item off the plate (click it). */
  removePlateItem(index) {
    if (index < 0 || index >= this.plate.length) return false;
    this.plate.splice(index, 1);
    return true;
  }

  clearPlate() {
    if (this.plate.length === 0) return false;
    this.plate = [];
    return true;
  }

  /** Serve the plate to the oldest customer whose order matches it exactly. */
  servePlate() {
    if (this.screen !== SCREEN_PLAY) return 'none';
    if (this.plate.length === 0) return 'empty';
    for (let i = 0; i < this.customers.length; i += 1) {
      const customer = this.customers[i];
      if (sameItems(this.plate, RECIPES[customer.recipeId].items)) {
        const price = RECIPES[customer.recipeId].price;
        this.coins += price;
        this.dayCoins += price;
        this.score += price * 10;
        this.servedCount += 1;
        this.customers.splice(i, 1);
        this.plate = [];
        this.events |= EVENT_SERVED;
        return 'served';
      }
    }
    this.flash = 0.45;
    return 'nomatch';
  }

  // --- simulation ----------------------------------------------------------
  step(dt) {
    this.events = EVENT_NONE;
    if (this.screen !== SCREEN_PLAY) return this.events;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);

    // Day clock.
    this.dayTimeLeft -= dt;
    if (this.dayTimeLeft <= 0) {
      this.dayTimeLeft = 0;
      if (this.dayCoins >= this.targetCoins) return this.finishDay();
      return this.finishOver('Waktu habis — target koin hari ini tidak tercapai.');
    }

    // New customers walk in.
    const tuning = dayTuning(this.day);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnCustomer();
      this.spawnTimer = tuning.spawnSeconds * (0.85 + this.rng() * 0.3);
    }

    // Patience runs out: the customer storms off and earns a strike.
    for (let i = this.customers.length - 1; i >= 0; i -= 1) {
      const customer = this.customers[i];
      customer.patience -= dt;
      if (customer.patience <= 0) {
        this.customers.splice(i, 1);
        this.strikes += 1;
        this.failedCount += 1;
        this.events |= EVENT_FAILED;
        if (this.strikes >= MAX_STRIKES) {
          return this.finishOver('Tiga pelanggan pergi dengan marah. Warung tutup!');
        }
      }
    }

    // Stations cook, finish, then burn if nobody collects them.
    for (const station of this.stations) {
      if (station.status === 'cooking') {
        station.t += dt;
        if (station.t >= station.cookTime) {
          station.status = 'done';
          station.t = 0;
          this.events |= EVENT_STATION_DONE;
        }
      } else if (station.status === 'done') {
        station.t += dt;
        if (station.t >= BURN_SECONDS) {
          station.status = 'burnt';
          station.t = 0;
          this.events |= EVENT_BURNT;
        }
      }
    }
    return this.events;
  }

  finishDay() {
    if (this.strikes === 0) {
      this.coins += CLEAN_DAY_BONUS;
      this.score += CLEAN_DAY_BONUS * 10;
    }
    this.best = Math.max(this.best, this.score);
    this.screen = SCREEN_DAY_WIN;
    this.events |= EVENT_DAY_WIN;
    return this.events;
  }

  finishOver(reason) {
    this.overReason = reason;
    this.best = Math.max(this.best, this.score);
    this.screen = SCREEN_OVER;
    this.events |= EVENT_OVER;
    return this.events;
  }

  /** Any station currently frying or boiling (for the sizzle sound). */
  anyCooking() {
    return this.stations.some((s) => s.status === 'cooking');
  }

  /** The oldest waiting customer, or null. */
  oldestCustomer() {
    return this.customers.length ? this.customers[0] : null;
  }
}
