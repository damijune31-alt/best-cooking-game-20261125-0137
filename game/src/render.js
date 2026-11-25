// Ramen Rush — everything the player sees, painted on one canvas in a fixed 1280x720
// logical space and scaled to the window. The kitchen has to read at a glance: the
// order board with its tickets, the ingredient bins along the counter, the work bowl
// filling up, the day timer, and the tray with a finished bowl ready to serve.

import { BOWL, CHEF, COUNTER, DAY_SECONDS, FIELD, FONT, PALETTE, STATIONS, TRAY } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

const TICKET_W = 168;
const TICKET_H = 168;

/** Station bin centres, left to right across the counter. */
export function stationX(index) {
  return 130 + index * 130;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient drawn as a flat icon at (x, y) with radius r. */
export function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  const s = r / 20;
  ctx.lineWidth = 2 * s;
  ctx.strokeStyle = 'rgba(43,33,24,0.35)';
  if (id === 'noodle') {
    ctx.strokeStyle = '#e8a91c';
    ctx.lineWidth = 3.4 * s;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-13 * s, i * 7 * s);
      ctx.bezierCurveTo(-6 * s, i * 7 * s - 6 * s, 6 * s, i * 7 * s + 6 * s, 13 * s, i * 7 * s);
      ctx.stroke();
    }
  } else if (id === 'shoyu' || id === 'miso' || id === 'tonkotsu') {
    ctx.fillStyle = id === 'shoyu' ? '#6b3f17' : id === 'miso' ? '#c98a3d' : '#efe3c8';
    ctx.beginPath();
    ctx.arc(0, 0, 15 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.arc(0, 0, 9 * s, Math.PI * 0.9, Math.PI * 1.7);
    ctx.stroke();
    ctx.fillStyle = id === 'tonkotsu' ? '#c9a86a' : 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(5 * s, 5 * s, 3.4 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a81c';
    ctx.beginPath();
    ctx.arc(2 * s, 1 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.arc(0, -1 * s, 2.6 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'chashu') {
    ctx.fillStyle = '#e58aa0';
    ctx.beginPath();
    ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c65a78';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.arc(0, 0, 8 * s, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3.4 * s, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'nori') {
    ctx.fillStyle = '#2f6b3a';
    roundRect(ctx, -13 * s, -11 * s, 26 * s, 22 * s, 3 * s);
    ctx.fill();
    ctx.strokeStyle = '#57a05e';
    ctx.lineWidth = 1.8 * s;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-9 * s, i * 6 * s);
      ctx.lineTo(9 * s, i * 6 * s);
      ctx.stroke();
    }
  } else if (id === 'corn') {
    ctx.fillStyle = '#ffd23f';
    const spots = [[-7, -4], [6, -6], [0, 3], [-2, 8], [8, 5]];
    for (const [dx, dy] of spots) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-8 * s, -5 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'scallion') {
    ctx.strokeStyle = '#2f8f3e';
    ctx.lineWidth = 4.4 * s;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 8 * s, -10 * s);
      ctx.lineTo(i * 8 * s + 3 * s, 10 * s);
      ctx.stroke();
    }
    ctx.strokeStyle = '#bfe8b0';
    ctx.lineWidth = 2 * s;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 8 * s, -10 * s);
      ctx.lineTo(i * 8 * s + 3 * s, 10 * s);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = filled ? '#e53935' : 'rgba(43,33,24,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -5);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.fill();
  ctx.restore();
}

function drawTicket(ctx, ticket, x, y, current, world) {
  ctx.save();
  ctx.fillStyle = PALETTE.ticket;
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, TICKET_W, TICKET_H, 10);
  ctx.fill();
  ctx.stroke();
  // Perforated top edge.
  ctx.fillStyle = PALETTE.ticketEdge;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 14 + i * 20, y + 8, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, `ORDER #${ticket.id % 100}`, x + TICKET_W / 2, y + 28, 15, PALETTE.text);
  // Recipe icons: noodle, broth, then the toppings — with a tick once each is in the bowl.
  // The chip size shrinks with the slot count so five slots still fit inside the ticket.
  const slots = ['noodle', ticket.broth, ...ticket.toppings];
  const chip = Math.floor((TICKET_W - 28 - (slots.length - 1) * 6) / slots.length);
  const iconR = Math.max(9, Math.round(chip * 0.38));
  const checkR = Math.max(6, Math.round(chip * 0.24));
  const total = slots.length * (chip + 6) - 6;
  let cx = x + (TICKET_W - total) / 2 + chip / 2;
  const cy = y + 72;
  slots.forEach((slot) => {
    ctx.fillStyle = '#f3e8cf';
    roundRect(ctx, cx - chip / 2, cy - chip / 2, chip, chip, 8);
    ctx.fill();
    drawIngredient(ctx, slot, cx, cy, iconR);
    let done = false;
    if (current && world) {
      if (slot === 'noodle') done = world.bowl.noodle;
      else if (slot === ticket.broth) done = world.bowl.broth === slot;
      else done = world.bowl.toppings.includes(slot);
    }
    if (done) {
      ctx.fillStyle = PALETTE.green;
      ctx.beginPath();
      ctx.arc(cx + chip / 2 - 2, cy - chip / 2 + 2, checkR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx + chip / 2 - 2 - checkR * 0.45, cy - chip / 2 + 2);
      ctx.lineTo(cx + chip / 2 - 2, cy - chip / 2 + 2 + checkR * 0.45);
      ctx.lineTo(cx + chip / 2 - 2 + checkR * 0.55, cy - chip / 2 + 2 - checkR * 0.5);
      ctx.stroke();
    }
    cx += chip + 6;
  });
  // Patience bar.
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  const barColor = frac > 0.5 ? PALETTE.green : frac > 0.25 ? '#e8a91c' : PALETTE.red;
  ctx.fillStyle = '#e3d5b8';
  roundRect(ctx, x + 14, y + TICKET_H - 34, TICKET_W - 28, 12, 6);
  ctx.fill();
  ctx.fillStyle = barColor;
  roundRect(ctx, x + 14, y + TICKET_H - 34, (TICKET_W - 28) * frac, 12, 6);
  ctx.fill();
  text(ctx, `${Math.ceil(ticket.patience)}s`, x + TICKET_W / 2, y + TICKET_H - 14, 13, frac > 0.25 ? PALETTE.muted : PALETTE.red);
  ctx.restore();
}

function drawBowl(ctx, bowl, x, y, radius, ready) {
  const shake = bowl.shake > 0 ? Math.sin(bowl.shake * 40) * 3 : 0;
  ctx.save();
  ctx.translate(x + shake, y);
  // Steam.
  if (bowl.noodle || ready) {
    ctx.strokeStyle = PALETTE.steam;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 16, -radius - 4);
      ctx.bezierCurveTo(i * 16 - 8, -radius - 22, i * 16 + 8, -radius - 34, i * 16, -radius - 48);
      ctx.stroke();
    }
  }
  // Bowl body.
  ctx.fillStyle = PALETTE.bowl;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.bowlRim;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Contents.
  if (bowl.noodle) {
    ctx.strokeStyle = '#e8a91c';
    ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.6, i * 5 - 2);
      ctx.bezierCurveTo(-radius * 0.3, i * 5 - 8, radius * 0.3, i * 5 + 4, radius * 0.6, i * 5 - 2);
      ctx.stroke();
    }
  }
  if (bowl.broth) {
    ctx.fillStyle = bowl.broth === 'shoyu' ? '#6b3f17' : bowl.broth === 'miso' ? '#c98a3d' : '#efe3c8';
    ctx.beginPath();
    ctx.ellipse(0, -2, radius * 0.78, radius * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  bowl.toppings.forEach((top, i) => {
    const angle = -Math.PI / 2 + (i - (bowl.toppings.length - 1) / 2) * 0.7;
    drawIngredient(ctx, top, Math.cos(angle) * radius * 0.45, -6 + Math.sin(angle) * radius * 0.14, 12);
  });
  // Chopsticks.
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(radius * 0.55, -radius * 0.5);
  ctx.lineTo(radius * 1.05, -radius * 1.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(radius * 0.35, -radius * 0.45);
  ctx.lineTo(radius * 0.85, -radius * 1.0);
  ctx.stroke();
  ctx.restore();
}

function drawChef(ctx, chef, carrying) {
  const { x } = chef;
  const groundY = 664;
  ctx.save();
  ctx.translate(x, groundY);
  if (chef.facing < 0) ctx.scale(-1, 1);
  // Legs and shoes.
  ctx.fillStyle = '#3a3f4a';
  roundRect(ctx, -22, -26, 18, 26, 6);
  ctx.fill();
  roundRect(ctx, 4, -26, 18, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#22242c';
  roundRect(ctx, -26, -8, 24, 10, 4);
  ctx.fill();
  roundRect(ctx, 2, -8, 24, 10, 4);
  ctx.fill();
  // Coat.
  ctx.fillStyle = PALETTE.chefCoat;
  roundRect(ctx, -30, -66, 60, 46, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(-30, -66, 60, 6);
  // Arms.
  ctx.fillStyle = PALETTE.chefCoat;
  roundRect(ctx, -38, -62, 12, 30, 6);
  ctx.fill();
  roundRect(ctx, 26, -62, 12, 30, 6);
  ctx.fill();
  // Head.
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(0, -78, 20, 0, Math.PI * 2);
  ctx.fill();
  // Eyes and smile.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(-7, -80, 2.4, 0, Math.PI * 2);
  ctx.arc(7, -80, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -74, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Tall chef hat.
  ctx.fillStyle = PALETTE.chefHat;
  ctx.beginPath();
  ctx.moveTo(-20, -92);
  ctx.quadraticCurveTo(-24, -116, 0, -114);
  ctx.quadraticCurveTo(24, -116, 20, -92);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(-21, -96, 42, 6);
  // Carried ingredient above the hat.
  if (carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(0, -138, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, carrying, 0, -138, 13);
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - FIELD.width * scale) / 2, (canvas.height - FIELD.height * scale) / 2);
  }

  function drawKitchen(state, screen) {
    // Wall and floor.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, 470);
    ctx.fillStyle = PALETTE.wallTile;
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        if ((row + col) % 2 === 0) ctx.fillRect(col * 80 + 4, 84 + row * 96, 72, 88);
      }
    }
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 588, FIELD.width, 132);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 8; i += 1) ctx.fillRect(0, 600 + i * 16, FIELD.width, 2);

    // Window with evening sky and city.
    ctx.fillStyle = '#2c4a6b';
    roundRect(ctx, 600, 84, 300, 150, 10);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(850, 120, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d2f45';
    const city = [[610, 190, 40, 44], [660, 170, 34, 64], [700, 200, 44, 34], [750, 180, 30, 54], [790, 195, 46, 39], [840, 175, 36, 59]];
    for (const [cx, cy, cw, ch] of city) ctx.fillRect(cx, cy, cw, ch);
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 14; i += 1) ctx.fillRect(616 + ((i * 53) % 260), 178 + ((i * 29) % 44), 4, 5);
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = 6;
    roundRect(ctx, 600, 84, 300, 150, 10);
    ctx.stroke();

    // Hanging paper lanterns.
    for (const [lx, color] of [[950, '#e53935'], [1060, '#f2c94c'], [1170, '#e53935']]) {
      ctx.strokeStyle = '#5d3a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, 96);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(lx, 122, 26, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.ellipse(lx, 122 + i * 12, 22, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Shelf with stacked bowls and jars.
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(940, 250, 320, 10);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = ['#274b8f', '#3f9e4d', '#d94f30'][i];
      ctx.beginPath();
      ctx.arc(980 + i * 90, 238, 22, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#e8dcc8';
    roundRect(ctx, 1206, 210, 34, 40, 6);
    ctx.fill();

    // Order board.
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, 16, 76, 556, 196, 12);
    ctx.fill();
    ctx.fillStyle = '#3d2712';
    roundRect(ctx, 16, 76, 556, 34, 12);
    ctx.fill();
    text(ctx, 'ORDER BOARD', 294, 93, 17, '#f2c94c', 'center', 800);
    const tickets = state.tickets;
    for (let i = 0; i < 3; i += 1) {
      const tx = 28 + i * (TICKET_W + 12);
      if (tickets[i]) drawTicket(ctx, tickets[i], tx, 116, i === 0, state);
      else {
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        roundRect(ctx, tx, 116, TICKET_W, TICKET_H, 10);
        ctx.fill();
        text(ctx, 'WAITING…', tx + TICKET_W / 2, 200, 15, 'rgba(255,255,255,0.45)');
      }
    }

    // Counter.
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(0, COUNTER.y, FIELD.width, COUNTER.height);
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(0, COUNTER.y, FIELD.width, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 10; i += 1) ctx.fillRect(i * 128 + 64, COUNTER.y + 16, 3, COUNTER.height - 16);

    // Ingredient bins.
    STATIONS.forEach((station, i) => {
      const x = stationX(i);
      const near = Math.abs(state.chef.x - x) < 70 && screen === SCREEN_PLAY;
      ctx.fillStyle = near ? '#fff3d6' : '#f6ead2';
      ctx.strokeStyle = near ? PALETTE.accent : '#c9b183';
      ctx.lineWidth = near ? 4 : 2;
      roundRect(ctx, x - 56, COUNTER.y + 8, 112, 92, 10);
      ctx.fill();
      ctx.stroke();
      drawIngredient(ctx, station.id, x, COUNTER.y + 40, 22);
      text(ctx, station.label, x, COUNTER.y + 76, 14, PALETTE.text);
      text(ctx, station.key, x + 44, COUNTER.y + 20, 12, PALETTE.muted, 'center', 800);
    });

    // The chef walks in front of the counter but behind the bowls, so the dish
    // itself is never hidden behind him.
    drawChef(ctx, state.chef, state.chef.carrying);

    // Work bowl on its bamboo mat, then the serve tray: both sit in front of the
    // chef, so the dish itself is never hidden behind him.
    ctx.fillStyle = '#c9a86a';
    roundRect(ctx, BOWL.x - 84, BOWL.y + 34, 168, 16, 8);
    ctx.fill();
    drawBowl(ctx, state.bowl, BOWL.x, BOWL.y, BOWL.radius, false);
    text(ctx, 'WORK BOWL', BOWL.x, BOWL.y + 66, 13, '#fff8e7', 'center', 800);

    // Serve tray with bell and the finished bowl.
    ctx.fillStyle = '#d8c49a';
    roundRect(ctx, TRAY.x - 78, TRAY.y + 30, 156, 16, 8);
    ctx.fill();
    if (state.tray) {
      drawBowl(ctx, state.tray, TRAY.x, TRAY.y, TRAY.radius, true);
      const pulse = 1 + Math.sin(state.elapsed * 6) * 0.08;
      ctx.save();
      ctx.translate(TRAY.x, TRAY.y + 66);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = PALETTE.accent;
      roundRect(ctx, -52, -15, 104, 30, 15);
      ctx.fill();
      text(ctx, 'READY!', 0, 1, 17, '#fff', 'center', 800);
      ctx.restore();
      ctx.fillStyle = '#f2c94c';
      for (const [sx, sy] of [[-64, -18], [64, -26], [72, 14]]) {
        ctx.save();
        ctx.translate(TRAY.x + sx, TRAY.y + sy);
        ctx.rotate(0.6);
        ctx.fillRect(-2, -8, 4, 16);
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(TRAY.x, TRAY.y, 30, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'SERVE', TRAY.x, TRAY.y + 66, 13, '#fff8e7', 'center', 800);
    }
    // Service bell.
    ctx.fillStyle = '#c9a86a';
    ctx.beginPath();
    ctx.arc(TRAY.x - 62, TRAY.y + 22, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(TRAY.x - 64, TRAY.y + 20, 4, 8);

    // Toast.
    if (state.toastTime > 0 && state.toast) {
      ctx.globalAlpha = Math.min(1, state.toastTime);
      ctx.fillStyle = 'rgba(43,33,24,0.88)';
      const w = ctx.measureText(state.toast).width + 44;
      roundRect(ctx, FIELD.width / 2 - w / 2, 300, w, 44, 22);
      ctx.fill();
      text(ctx, state.toast, FIELD.width / 2, 323, 20, '#fff8e7');
      ctx.globalAlpha = 1;
    }
  }

  function drawHud(state, screen, best) {
    // Top bar.
    ctx.fillStyle = 'rgba(43,33,24,0.92)';
    ctx.fillRect(0, 0, FIELD.width, 64);
    text(ctx, 'RAMEN RUSH', 24, 33, 26, '#f2c94c', 'left', 800);
    // Day timer: a small clock face plus the remaining time.
    const left = Math.max(0, DAY_SECONDS - state.elapsed);
    const mm = Math.floor(left / 60);
    const ss = Math.floor(left % 60).toString().padStart(2, '0');
    const low = left < 30;
    ctx.strokeStyle = low ? '#ff6b5e' : '#fff8e7';
    ctx.fillStyle = low ? '#ff6b5e' : '#fff8e7';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(560, 24, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(560, 24);
    ctx.lineTo(560, 15);
    ctx.moveTo(560, 24);
    ctx.lineTo(567, 24);
    ctx.stroke();
    text(ctx, `${mm}:${ss}`, 640, 26, 24, low ? '#ff6b5e' : '#fff8e7', 'center', 800);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, 520, 46, 240, 8, 4);
    ctx.fill();
    ctx.fillStyle = low ? '#ff6b5e' : PALETTE.green;
    roundRect(ctx, 520, 46, 240 * (left / DAY_SECONDS), 8, 4);
    ctx.fill();
    // Score, coins, level, lives.
    text(ctx, `SCORE ${state.score}`, 1010, 26, 20, '#fff8e7', 'right', 800);
    text(ctx, `COINS ${state.coins}`, 1010, 50, 15, '#f2c94c', 'right', 800);
    text(ctx, `LV ${Math.min(3, 1 + Math.floor(state.elapsed / 45))}`, 1140, 26, 20, '#fff8e7', 'right', 800);
    for (let i = 0; i < 3; i += 1) drawHeart(ctx, 1160 + i * 26, 48, 1.1, i < state.lives);
    if (state.combo >= 2) text(ctx, `COMBO x${state.combo}`, 1140, 50, 15, '#ff9d5c', 'right', 800);
    if (screen === SCREEN_TITLE) {
      text(ctx, `BEST ${best}`, 640, 56, 13, '#f2c94c', 'center', 800);
    }
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(20,14,8,0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 360, 130, 560, 300, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.board;
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, title, 640, 182, 44, accent, 'center', 800);
    let y = 236;
    for (const line of lines) {
      text(ctx, line, 640, y, 19, PALETTE.text, 'center', 600);
      y += 32;
    }
  }

  function draw(state, screen, best) {
    fit();
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawKitchen(state, screen);
    drawHud(state, screen, best);
    if (screen === SCREEN_TITLE) {
      overlay('RAMEN RUSH', [
        'Orders fly in — build every bowl before the clock runs out.',
        'Walk with ← → or A / D, or click the counter.',
        'Space picks an ingredient and drops it in the bowl.',
        'S serves a finished bowl from the tray. P pauses.',
        '',
        'Press Enter or click to start the shift!',
      ], PALETTE.accent);
    } else if (screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['The kitchen waits.', 'Press P to get back to the rush.'], PALETTE.text);
    } else if (screen === SCREEN_OVER) {
      const dayDone = state.dayDone;
      overlay(dayDone ? 'DAY COMPLETE!' : 'OUT OF LIVES!', [
        `Score ${state.score}   •   Coins ${state.coins}`,
        `Orders served ${state.served}   •   Best combo x${state.bestCombo}`,
        `Best score ${best}`,
        '',
        'Press Enter to work another shift!',
      ], dayDone ? PALETTE.green : PALETTE.accent);
    }
  }

  return { draw };
}
