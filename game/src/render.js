// Warung Kilat — everything the player sees, drawn on one canvas: the kitchen,
// the order board, the cooking stations, the ingredient counter, the plate, the
// HUD and the title / pause / day-win / game-over screens. No images are loaded;
// every dish and customer is drawn from shapes.
import {
  INGREDIENTS, LAYOUT, MAX_STRIKES, RECIPES, VIEW,
} from './config.js';
import {
  SCREEN_DAY_WIN, SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE,
} from './world.js';

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function patienceColor(frac) {
  if (frac > 0.5) return '#4caf50';
  if (frac > 0.25) return '#ff9800';
  return '#e53935';
}

function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** One ingredient drawn as a little picture, centred at (cx, cy) with radius r. */
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  switch (id) {
    case 'nasi': {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 0.95, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.25, r * 0.55, r * 0.45, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(r * 0.2, -r * 0.1, r * 0.45, r * 0.4, 0.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ayam-mentah':
    case 'ayam-goreng': {
      const golden = id === 'ayam-goreng';
      ctx.fillStyle = golden ? '#c97b1e' : '#f2b8a0';
      ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.1, r * 0.62, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = golden ? '#e8a83e' : '#f8cdb8';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fdf6ec';
      ctx.lineWidth = r * 0.22;
      ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.3); ctx.lineTo(r * 0.85, r * 0.75); ctx.stroke();
      ctx.fillStyle = '#fdf6ec';
      ctx.beginPath(); ctx.arc(r * 0.88, r * 0.78, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.7, r * 0.9, r * 0.16, 0, Math.PI * 2); ctx.fill();
      if (golden) {
        ctx.strokeStyle = '#8a4d0f';
        ctx.lineWidth = r * 0.07;
        ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.1, r * 0.35, 0.3, 2.4); ctx.stroke();
      }
      break;
    }
    case 'telur-mentah': {
      ctx.fillStyle = '#fdf3d8';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f6c453';
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'telur-goreng': {
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.75, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f6a609';
      ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd54a';
      ctx.beginPath(); ctx.arc(r * 0.02, -r * 0.08, r * 0.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'mie-mentah':
    case 'mie-rebus': {
      ctx.strokeStyle = '#e9b949';
      ctx.lineWidth = r * 0.2;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.arc(0, i * r * 0.35, r * 0.55, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      if (id === 'mie-rebus') {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = r * 0.08;
        ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.9); ctx.quadraticCurveTo(-r * 0.15, -r * 1.2, -r * 0.3, -r * 1.45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(r * 0.25, -r * 0.9); ctx.quadraticCurveTo(r * 0.4, -r * 1.2, r * 0.25, -r * 1.45); ctx.stroke();
      }
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#4e9e44';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.ellipse(i * r * 0.45, -i * i * r * 0.1, r * 0.42, r * 0.62, i * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#2f6b28';
      ctx.lineWidth = r * 0.08;
      ctx.beginPath(); ctx.moveTo(0, r * 0.6); ctx.lineTo(0, -r * 0.5); ctx.stroke();
      break;
    }
    case 'sambal': {
      ctx.fillStyle = '#b8322a';
      ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.9, r * 0.5, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#e5484d';
      ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.85, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6b5e';
      ctx.beginPath(); ctx.arc(-r * 0.25, r * 0.1, r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.3, r * 0.25, r * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7bc96f';
      ctx.beginPath(); ctx.ellipse(r * 0.45, -r * 0.35, r * 0.3, r * 0.14, 0.6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#cccccc';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawCustomer(ctx, slot, customer) {
  const { x, y, w, h } = slot;
  const cx = x + 58;
  const cy = y + 78;
  const look = customer.look;
  // Body.
  ctx.fillStyle = look.shirt;
  rr(ctx, cx - 34, cy - 6, 68, 62, 14);
  ctx.fill();
  // Head.
  ctx.fillStyle = look.skin;
  ctx.beginPath(); ctx.arc(cx, cy - 34, 30, 0, Math.PI * 2); ctx.fill();
  // Hair / hat / hijab.
  if (look.hat === 'cap') {
    ctx.fillStyle = look.shirt;
    ctx.beginPath(); ctx.arc(cx, cy - 38, 30, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 30, cy - 40, 60, 8);
    ctx.fillRect(cx - 8, cy - 46, 44, 8);
  } else if (look.hat === 'hijab') {
    ctx.fillStyle = '#d96a8b';
    ctx.beginPath(); ctx.arc(cx, cy - 32, 33, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = look.skin;
    ctx.beginPath(); ctx.arc(cx, cy - 30, 24, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = look.hair;
    ctx.beginPath(); ctx.arc(cx, cy - 40, 28, Math.PI, 0); ctx.fill();
  }
  // Face: eyes and a mouth that turns with patience.
  const frac = customer.patience / customer.maxPatience;
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx - 11, cy - 34, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 11, cy - 34, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (frac > 0.5) ctx.arc(cx, cy - 22, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (frac > 0.25) { ctx.moveTo(cx - 8, cy - 16); ctx.lineTo(cx + 8, cy - 16); }
  else ctx.arc(cx, cy - 8, 9, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();

  // Order ticket.
  const tx = x + 104;
  const tw = w - 116;
  ctx.fillStyle = '#fffdf4';
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  rr(ctx, tx, y + 8, tw, 96, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6d3b';
  ctx.fillRect(tx, y + 8, tw, 4);
  const recipe = RECIPES[customer.recipeId];
  // Shrink a long dish name until it leaves room for the price on the right.
  let nameSize = 16;
  ctx.font = `bold ${nameSize}px ${FONT}`;
  while (ctx.measureText(recipe.name).width > tw - 78 && nameSize > 11) {
    nameSize -= 1;
    ctx.font = `bold ${nameSize}px ${FONT}`;
  }
  text(ctx, recipe.name, tx + 12, y + 30, nameSize, '#5b3a1a');
  text(ctx, `Rp${recipe.price}k`, tx + tw - 12, y + 30, 15, '#2e7d32', 'bold', 'right');
  recipe.items.forEach((item, i) => {
    drawIngredientIcon(ctx, item, tx + 26 + i * 40, y + 62, 15);
  });
  // Patience bar.
  ctx.fillStyle = '#e0d6c0';
  rr(ctx, tx + 10, y + 86, tw - 20, 10, 5);
  ctx.fill();
  ctx.fillStyle = patienceColor(frac);
  rr(ctx, tx + 10, y + 86, Math.max(8, (tw - 20) * frac), 10, 5);
  ctx.fill();
  // Impatience wiggle when nearly out of time.
  if (frac < 0.25) {
    text(ctx, '!', tx + tw - 16, y + 62, 26, '#e53935', 'bold', 'center');
  }
}

function drawStation(ctx, rect, station, now) {
  const { x, y, w, h } = rect;
  // Stove body.
  ctx.fillStyle = '#5d4037';
  rr(ctx, x, y + 30, w, h - 30, 10);
  ctx.fill();
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x + 10, y + 30, w - 20, 8);
  // Burner glow while cooking.
  if (station.status === 'cooking') {
    const flicker = 0.5 + 0.4 * Math.sin(now * 9 + x);
    ctx.fillStyle = `rgba(255,${Math.floor(120 + 80 * flicker)},40,${0.35 + 0.3 * flicker})`;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 92, 86, 16, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Wok or pot.
  if (station.kind === 'wajan') {
    ctx.fillStyle = '#37474f';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 78, 92, 34, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#263238';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 78, 80, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + w - 92, y + 66); ctx.lineTo(x + w - 20, y + 40); ctx.stroke();
  } else {
    ctx.fillStyle = '#607d8b';
    rr(ctx, x + w / 2 - 88, y + 44, 176, 62, 10);
    ctx.fill();
    ctx.fillStyle = '#455a64';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 48, 88, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#78909c';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 48, 74, 11, 0, 0, Math.PI * 2); ctx.fill();
  }
  // The food inside.
  if (station.item) {
    const cookedId = INGREDIENTS[station.item].cooked;
    drawIngredientIcon(ctx, station.status === 'done' || station.status === 'burnt' ? cookedId : station.item, x + w / 2, y + 66, 30);
    if (station.status === 'burnt') {
      ctx.fillStyle = 'rgba(40,20,10,0.55)';
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + 66, 34, 22, 0, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'GOSONG!', x + w / 2, y + 118, 20, '#ffccbc', 'bold', 'center');
      text(ctx, 'klik untuk buang', x + w / 2, y + 140, 13, '#ffccbc', 'normal', 'center');
    }
  }
  // Progress ring while cooking, countdown while it waits to be collected.
  if (station.status === 'cooking') {
    const frac = Math.min(1, station.t / station.cookTime);
    ctx.strokeStyle = '#e0d6c0';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(x + w / 2, y + 66, 46, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffb300';
    ctx.beginPath(); ctx.arc(x + w / 2, y + 66, 46, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    text(ctx, `${Math.ceil(station.cookTime - station.t)} dtk`, x + w / 2, y + 124, 16, '#ffe0b2', 'bold', 'center');
  } else if (station.status === 'done') {
    const frac = 1 - station.t / 5;
    ctx.fillStyle = '#2e7d32';
    rr(ctx, x + w / 2 - 52, y + 112, 104, 26, 13);
    ctx.fill();
    text(ctx, 'SIAP! · klik', x + w / 2, y + 125, 15, '#ffffff', 'bold', 'center');
    ctx.fillStyle = '#e0d6c0';
    rr(ctx, x + 20, y + 144, w - 40, 6, 3);
    ctx.fill();
    ctx.fillStyle = patienceColor(frac);
    rr(ctx, x + 20, y + 144, Math.max(4, (w - 40) * frac), 6, 3);
    ctx.fill();
  } else {
    text(ctx, station.label, x + w / 2, y + 124, 16, '#d7ccc8', 'bold', 'center');
  }
}

function drawBin(ctx, rect, keyNumber) {
  const { x, y, w, h, id } = rect;
  const ing = INGREDIENTS[id];
  ctx.fillStyle = '#fffdf4';
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  drawIngredientIcon(ctx, id, x + w / 2, y + 44, 30);
  text(ctx, ing.name, x + w / 2, y + 88, 15, '#5b3a1a', 'bold', 'center');
  ctx.fillStyle = '#8a6d3b';
  ctx.beginPath(); ctx.arc(x + 16, y + 16, 11, 0, Math.PI * 2); ctx.fill();
  text(ctx, String(keyNumber), x + 16, y + 17, 13, '#ffffff', 'bold', 'center');
  if (ing.station) text(ctx, `→ ${ing.station === 'wajan' ? 'wajan' : 'panci'}`, x + w / 2, y + 106, 11, '#8a6d3b', 'normal', 'center');
}

function drawPlateArea(ctx, world) {
  const p = LAYOUT.plate;
  const shake = world.flash > 0 ? Math.sin(world.flash * 40) * 6 * world.flash : 0;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = '#fffdf4';
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  rr(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.stroke();
  // Top row: the label on the left, the dish name on the right — both clear of
  // the plate ellipse below, so no text ever sits on a graphic.
  text(ctx, 'PIRING', p.x + 14, p.y + 15, 13, '#8a6d3b', 'bold');
  if (world.plate.length > 0) {
    const names = world.plate.map((item) => INGREDIENTS[item].short).join(' + ');
    // Shrink a long dish name until it fits between the label and the edge.
    let nameSize = 14;
    ctx.font = `bold ${nameSize}px ${FONT}`;
    const maxNameW = p.w - 14 - 62 - 12;
    while (ctx.measureText(names).width > maxNameW && nameSize > 10) {
      nameSize -= 1;
      ctx.font = `bold ${nameSize}px ${FONT}`;
    }
    text(ctx, names, p.x + p.w - 12, p.y + 15, nameSize, '#5b3a1a', 'bold', 'right');
  }
  // The plate itself, centred under the top row.
  const pcx = p.x + p.w / 2;
  const pcy = p.y + 66;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#b0bec5';
  ctx.beginPath(); ctx.ellipse(pcx, pcy, 78, 32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#cfd8dc';
  ctx.beginPath(); ctx.ellipse(pcx, pcy, 58, 22, 0, 0, Math.PI * 2); ctx.stroke();
  world.plate.forEach((item, i) => {
    const angle = -0.5 + i * 0.45;
    drawIngredientIcon(ctx, item, pcx + Math.cos(angle) * 30, pcy + Math.sin(angle) * 12, 19);
  });
  // One hint line under the plate, centred on clean panel space.
  const hint = world.plate.length === 0
    ? 'Piring kosong — klik bahan di bawah'
    : 'klik bahan di piring untuk mengambilnya';
  text(ctx, hint, p.x + p.w / 2, p.y + 107, 12, '#a1887f', 'normal', 'center');
  ctx.restore();
}

function drawHud(ctx, world) {
  const { x, y, w, h } = LAYOUT.hud;
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(x, y, w, h);
  text(ctx, 'WARUNG KILAT', 20, y + 30, 26, '#ffca28');
  text(ctx, `Hari ${world.day}`, 248, y + 30, 20, '#ffffff');
  text(ctx, `Skor ${world.score}`, 348, y + 30, 18, '#ffe0b2');
  // Coins vs target.
  text(ctx, `Koin ${world.dayCoins}/${world.targetCoins}`, 448, y + 16, 15, '#ffe0b2');
  ctx.fillStyle = '#5d4037';
  rr(ctx, 448, y + 28, 170, 12, 6);
  ctx.fill();
  ctx.fillStyle = world.dayCoins >= world.targetCoins ? '#66bb6a' : '#ffca28';
  rr(ctx, 448, y + 28, Math.min(170, 170 * (world.dayCoins / world.targetCoins)), 12, 6);
  ctx.fill();
  // Day clock.
  text(ctx, formatClock(world.dayTimeLeft), 760, y + 30, 20, '#ffffff', 'bold', 'center');
  ctx.fillStyle = '#5d4037';
  rr(ctx, 660, y + 44, 200, 8, 4);
  ctx.fill();
  ctx.fillStyle = world.dayTimeLeft < 15 ? '#e53935' : '#4fc3f7';
  rr(ctx, 660, y + 44, 200 * (world.dayTimeLeft / world.daySeconds), 8, 4);
  ctx.fill();
  // Strikes as cracked plates.
  text(ctx, 'Marah:', 900, y + 30, 14, '#ffe0b2', 'normal', 'left');
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    const cx = 970 + i * 34;
    ctx.fillStyle = i < world.strikes ? '#e53935' : '#ffffff';
    ctx.beginPath(); ctx.arc(cx, y + 30, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (i < world.strikes) {
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(cx - 6, y + 24); ctx.lineTo(cx + 6, y + 36); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 6, y + 24); ctx.lineTo(cx - 6, y + 36); ctx.stroke();
    }
  }
  // Pause button.
  const pb = LAYOUT.pauseButton;
  ctx.fillStyle = '#5d4037';
  rr(ctx, pb.x, pb.y, pb.w, pb.h, 8);
  ctx.fill();
  text(ctx, 'II', pb.x + pb.w / 2, pb.y + pb.h / 2 + 1, 18, '#ffffff', 'bold', 'center');
}

function drawKitchen(ctx, world, now) {
  // Warm wall with a tile strip and a wooden back counter.
  ctx.fillStyle = '#f6ead3';
  ctx.fillRect(0, 60, VIEW.width, 160);
  ctx.fillStyle = '#e8d5ae';
  for (let x = 0; x < VIEW.width; x += 64) ctx.fillRect(x, 60, 2, 160);
  ctx.fillStyle = '#fff3d6';
  ctx.fillRect(0, 60, VIEW.width, 10);
  // Back counter.
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 220, VIEW.width, 190);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(0, 220, VIEW.width, 10);
  // Order board slots.
  LAYOUT.customerSlots.forEach((slot, i) => {
    const customer = world.customers[i];
    ctx.fillStyle = 'rgba(62,39,35,0.12)';
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 12);
    ctx.fill();
    if (customer) drawCustomer(ctx, slot, customer);
    else {
      ctx.strokeStyle = '#bcaaa4';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, slot.x + 8, slot.y + 8, slot.w - 16, slot.h - 16, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'kursi kosong', slot.x + slot.w / 2, slot.y + slot.h / 2, 15, '#a1887f', 'normal', 'center');
    }
  });
  // Stations.
  LAYOUT.stations.forEach((rect, i) => drawStation(ctx, rect, world.stations[i], now));
  // Front counter.
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(0, 420, VIEW.width, 150);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 420, VIEW.width, 12);
  LAYOUT.bins.forEach((bin, i) => drawBin(ctx, bin, i + 1));
  drawPlateArea(ctx, world);
  // Bottom bar.
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 620, VIEW.width, 100);
  const trash = LAYOUT.trashButton;
  ctx.fillStyle = '#795548';
  rr(ctx, trash.x, trash.y, trash.w, trash.h, 10);
  ctx.fill();
  text(ctx, 'BUANG (Del)', trash.x + trash.w / 2, trash.y + trash.h / 2, 16, '#ffffff', 'bold', 'center');
  const serve = LAYOUT.serveButton;
  const canServe = world.plate.length > 0;
  ctx.fillStyle = canServe ? '#43a047' : '#616161';
  rr(ctx, serve.x, serve.y, serve.w, serve.h, 12);
  ctx.fill();
  text(ctx, 'SAJIKAN', serve.x + serve.w / 2, serve.y + 26, 24, '#ffffff', 'bold', 'center');
  text(ctx, '(Spasi)', serve.x + serve.w / 2, serve.y + 50, 13, '#e8f5e9', 'normal', 'center');
  text(ctx, '1-6 bahan · klik wajan/panci saat SIAP · Spasi sajikan · P jeda · R ulang', 210, 668, 15, '#ffe0b2', 'normal', 'left');
}

function dimScreen(ctx, alpha = 0.72) {
  ctx.fillStyle = `rgba(30,16,8,${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = '#fffdf4';
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 3;
  rr(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.stroke();
}

function drawTitle(ctx, world) {
  // A stronger dim than the other screens: the title panel sits over a busy
  // kitchen, so the backdrop is pushed further back for clean reading.
  dimScreen(ctx, 0.84);
  panel(ctx, 340, 110, 600, 470);
  text(ctx, '🍜', 640, 190, 64, '#5b3a1a', 'bold', 'center');
  text(ctx, 'WARUNG KILAT', 640, 258, 52, '#c62828', 'bold', 'center');
  text(ctx, 'Masak cepat, sajikan tepat waktu!', 640, 300, 20, '#5b3a1a', 'normal', 'center');
  text(ctx, 'Pelanggan datang dengan pesanan. Rakit hidangan', 640, 346, 17, '#6d4c41', 'normal', 'center');
  text(ctx, 'dari bahan di counter, goreng di wajan sebelum', 640, 370, 17, '#6d4c41', 'normal', 'center');
  text(ctx, 'gosong, lalu sajikan sebelum kesabaran habis.', 640, 394, 17, '#6d4c41', 'normal', 'center');
  text(ctx, 'Capai target koin sebelum waktu hari berakhir.', 640, 418, 17, '#6d4c41', 'normal', 'center');
  const b = LAYOUT.titleStartButton;
  ctx.fillStyle = '#43a047';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, 'MULAI MASAK (Enter)', b.x + b.w / 2, b.y + b.h / 2, 22, '#ffffff', 'bold', 'center');
  if (world.best > 0) text(ctx, `Skor terbaik: ${world.best}`, 640, 606, 16, '#8a6d3b', 'normal', 'center');
}

function drawPause(ctx) {
  dimScreen(ctx);
  panel(ctx, 440, 250, 400, 220);
  text(ctx, 'JEDA', 640, 310, 40, '#5b3a1a', 'bold', 'center');
  text(ctx, 'P atau klik untuk lanjut', 640, 360, 18, '#6d4c41', 'normal', 'center');
  text(ctx, 'R — mulai dari awal', 640, 392, 18, '#6d4c41', 'normal', 'center');
}

function drawDayWin(ctx, world) {
  dimScreen(ctx);
  panel(ctx, 380, 170, 520, 360);
  text(ctx, '🎉', 640, 240, 56, '#5b3a1a', 'bold', 'center');
  text(ctx, `Hari ${world.day} selesai!`, 640, 300, 36, '#2e7d32', 'bold', 'center');
  text(ctx, `Koin hari ini: ${world.dayCoins} / target ${world.targetCoins}`, 640, 350, 20, '#5b3a1a', 'normal', 'center');
  if (world.strikes === 0) text(ctx, `Bonus hari bersih: +${10} koin`, 640, 380, 18, '#2e7d32', 'normal', 'center');
  text(ctx, `Total koin: ${world.coins} · Skor: ${world.score}`, 640, 412, 18, '#5b3a1a', 'normal', 'center');
  text(ctx, `Hari ${world.day + 1}: pelanggan lebih cepat, pesanan lebih sulit!`, 640, 444, 16, '#6d4c41', 'normal', 'center');
  const b = LAYOUT.dayNextButton;
  ctx.fillStyle = '#43a047';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, `LANJUT HARI ${world.day + 1} (Enter)`, b.x + b.w / 2, b.y + b.h / 2, 20, '#ffffff', 'bold', 'center');
}

function drawOver(ctx, world) {
  dimScreen(ctx);
  panel(ctx, 340, 150, 600, 400);
  text(ctx, '😞', 640, 220, 56, '#5b3a1a', 'bold', 'center');
  text(ctx, 'WARUNG TUTUP', 640, 284, 44, '#c62828', 'bold', 'center');
  text(ctx, world.overReason, 640, 330, 18, '#5b3a1a', 'normal', 'center');
  text(ctx, `Hari terakhir: ${world.day} · Koin: ${world.coins} · Skor: ${world.score}`, 640, 366, 18, '#6d4c41', 'normal', 'center');
  text(ctx, `Hidangan tersaji: ${world.servedCount} · Pesanan gagal: ${world.failedCount}`, 640, 394, 18, '#6d4c41', 'normal', 'center');
  const b = LAYOUT.overRestartButton;
  ctx.fillStyle = '#c62828';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  text(ctx, 'MAIN LAGI (R)', b.x + b.w / 2, b.y + b.h / 2, 22, '#ffffff', 'bold', 'center');
}

/** Draw the whole game for the current state. `now` is seconds, for animation. */
export function render(ctx, world, now) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawKitchen(ctx, world, now);
  drawHud(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (world.screen === SCREEN_PAUSE) drawPause(ctx);
  else if (world.screen === SCREEN_DAY_WIN) drawDayWin(ctx, world);
  else if (world.screen === SCREEN_OVER) drawOver(ctx, world);
}

export { SCREEN_PLAY };
