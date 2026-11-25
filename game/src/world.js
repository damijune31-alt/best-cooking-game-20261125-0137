// Ramen Rush — the kitchen simulation. The chef walks the counter, picks one ingredient
// at a time, drops it into the work bowl, and serves the finished bowl from the tray.
// Every order is a ticket: one noodle base, one broth, and two or three toppings. A
// ticket whose patience runs out storms off and costs a life; the shift ends after
// DAY_SECONDS, or at once when the last life is gone.

import {
  BOWL,
  BROTHS,
  CHEF,
  DAY_SECONDS,
  LEVEL_SECONDS,
  LIVES,
  ORDER_INTERVAL,
  PATIENCE,
  SCORE,
  STATIONS,
  TOPPINGS,
  TOPPING_COUNT,
  TRAY,
} from './config.js';

export const EVENT_PICK = 1;
export const EVENT_DROP = 2;
export const EVENT_REJECT = 4;
export const EVENT_SERVE = 8;
export const EVENT_EXPIRE = 16;
export const EVENT_OVER = 32;
export const EVENT_READY = 64;

/** The oldest ticket is the one the work bowl is being built for. */
function currentTicket(state) {
  return state.tickets[0] ?? null;
}

function makeTicket(random, level) {
  const count = TOPPING_COUNT[level] ?? 3;
  const toppings = random.shuffle(TOPPINGS).slice(0, count);
  return {
    id: random.int(1, 99999),
    broth: random.pick(BROTHS),
    toppings,
    patience: PATIENCE[level] ?? 34,
    patienceMax: PATIENCE[level] ?? 34,
  };
}

function emptyBowl() {
  return { noodle: false, broth: null, toppings: [], shake: 0 };
}

export function createWorld(random) {
  const state = {
    chef: { x: 640, carrying: null, facing: 1 },
    bowl: emptyBowl(),
    tray: null,
    tickets: [],
    orderTimer: 2,
    elapsed: 0,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    lives: LIVES,
    served: 0,
    expired: 0,
    over: false,
    dayDone: false,
    toast: '',
    toastTime: 0,
  };

  function level() {
    return Math.min(3, 1 + Math.floor(state.elapsed / LEVEL_SECONDS));
  }

  function reset() {
    state.chef = { x: 640, carrying: null, facing: 1 };
    state.bowl = emptyBowl();
    state.tray = null;
    state.tickets = [];
    state.orderTimer = 2;
    state.elapsed = 0;
    state.score = 0;
    state.coins = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.lives = LIVES;
    state.served = 0;
    state.expired = 0;
    state.over = false;
    state.dayDone = false;
    state.toast = '';
    state.toastTime = 0;
  }

  /** The title screen's dressed kitchen: tickets up, a bowl half built, chef mid-task. */
  function stageAttract() {
    reset();
    state.tickets = [makeTicket(random, 1), makeTicket(random, 1)];
    state.bowl = { noodle: true, broth: state.tickets[0].broth, toppings: [state.tickets[0].toppings[0]], shake: 0 };
    state.chef = { x: 700, carrying: state.tickets[0].toppings[1], facing: 1 };
  }

  function nearestStation() {
    let best = null;
    let bestDist = 78;
    for (const station of STATIONS) {
      const x = stationX(station);
      const dist = Math.abs(state.chef.x - x);
      if (dist < bestDist) {
        bestDist = dist;
        best = station;
      }
    }
    return best;
  }

  function stationX(station) {
    const index = STATIONS.indexOf(station);
    return 130 + index * 130;
  }

  function tryPick() {
    if (state.chef.carrying) return 0;
    const station = nearestStation();
    if (!station) return 0;
    state.chef.carrying = station.id;
    return EVENT_PICK;
  }

  function tryDrop() {
    const ticket = currentTicket(state);
    const held = state.chef.carrying;
    if (!held || !ticket) return 0;
    if (Math.abs(state.chef.x - BOWL.x) > 110) return 0;
    const bowl = state.bowl;
    let ok = false;
    if (held === 'noodle' && !bowl.noodle) {
      bowl.noodle = true;
      ok = true;
    } else if (BROTHS.includes(held) && bowl.noodle && !bowl.broth && held === ticket.broth) {
      bowl.broth = held;
      ok = true;
    } else if (
      TOPPINGS.includes(held) && bowl.noodle && bowl.broth &&
      ticket.toppings.includes(held) && !bowl.toppings.includes(held)
    ) {
      bowl.toppings.push(held);
      ok = true;
    }
    if (!ok) {
      bowl.shake = 0.45;
      return EVENT_REJECT;
    }
    // The bowl is done — but if a finished bowl is still waiting on the tray,
    // the chef must serve it first instead of piling up a second one.
    const done = bowl.noodle && bowl.broth && bowl.toppings.length === ticket.toppings.length;
    if (done && state.tray) {
      bowl.toppings.pop();
      bowl.shake = 0.45;
      state.toast = 'Serve the tray first!';
      state.toastTime = 1.4;
      return EVENT_REJECT;
    }
    state.chef.carrying = null;
    state.score += SCORE.ingredient;
    if (done) {
      state.tray = { ...bowl, ticketId: ticket.id, broth: bowl.broth, toppings: bowl.toppings.slice() };
      state.bowl = emptyBowl();
      return EVENT_DROP | EVENT_READY;
    }
    return EVENT_DROP;
  }

  function tryServe() {
    if (!state.tray) return 0;
    const index = state.tickets.findIndex((t) => t.id === state.tray.ticketId);
    const ticket = index === -1 ? null : state.tickets[index];
    const tip = ticket ? Math.round((SCORE.tipMax * ticket.patience) / ticket.patienceMax) : 0;
    state.score += SCORE.serve + tip + state.combo * SCORE.comboBonus;
    state.coins += 8 + state.combo;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    if (ticket) state.tickets.splice(index, 1);
    state.tray = null;
    state.toast = tip >= 35 ? `Served! +${SCORE.serve + tip}  Big tip!` : `Served! +${SCORE.serve + tip}`;
    state.toastTime = 1.6;
    return EVENT_SERVE;
  }

  function step(dt, input, attract) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    if (state.toastTime > 0) state.toastTime -= dt;
    if (state.bowl.shake > 0) state.bowl.shake -= dt;

    if (attract) return events;

    // The shift clock: day over at DAY_SECONDS, or the moment the last life is gone.
    if (state.elapsed >= DAY_SECONDS) {
      state.over = true;
      state.dayDone = true;
      return EVENT_OVER;
    }

    // New orders arrive while a slot is free.
    state.orderTimer -= dt;
    if (state.orderTimer <= 0 && state.tickets.length < 3) {
      state.tickets.push(makeTicket(random, level()));
      state.orderTimer = ORDER_INTERVAL;
    }

    // Patience runs out: the customer leaves, a life goes, the combo resets.
    for (let i = state.tickets.length - 1; i >= 0; i -= 1) {
      const ticket = state.tickets[i];
      ticket.patience -= dt;
      if (ticket.patience <= 0) {
        state.tickets.splice(i, 1);
        state.lives -= 1;
        state.combo = 0;
        state.expired += 1;
        state.toast = 'Order walked out!';
        state.toastTime = 1.6;
        events |= EVENT_EXPIRE;
        if (state.lives <= 0) {
          state.over = true;
          return events | EVENT_OVER;
        }
      }
    }

    // The chef walks the counter.
    if (input.move !== 0) {
      state.chef.facing = input.move;
      state.chef.x = Math.min(CHEF.maxX, Math.max(CHEF.minX, state.chef.x + input.move * CHEF.speed * dt));
    }
    // Space with empty hands picks up; with full hands it drops into the bowl when
    // the chef is by it, or puts the ingredient back in any bin when by the counter.
    // A drop that does nothing (no order on the board yet) falls through to put-back,
    // so the chef is never stuck holding an ingredient he cannot place.
    if (input.pick) {
      if (state.chef.carrying) {
        let done = 0;
        if (Math.abs(state.chef.x - BOWL.x) <= 110) done = tryDrop();
        if (done) events |= done;
        else if (nearestStation()) {
          state.chef.carrying = null;
          events |= EVENT_PICK;
        }
      } else {
        events |= tryPick();
      }
    }
    if (input.serve) events |= tryServe();
    return events;
  }

  return { state, reset, stageAttract, step, level, stationX, currentTicket: () => currentTicket(state) };
}
