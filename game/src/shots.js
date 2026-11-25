// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a greedy pilot
// (walk to the next ingredient the oldest ticket needs, pick it up, drop it in the
// bowl, serve the finished bowl from the tray), so the frame is what a real game
// looks like and the same seed always gives the same frame.

import { BOWL, STATIONS, STEP, TRAY } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;

function stationXOf(id) {
  const index = STATIONS.findIndex((s) => s.id === id);
  return 130 + index * 130;
}

/** What the work bowl still needs for the oldest ticket, in build order. */
function needed(state) {
  const ticket = state.tickets[0];
  if (!ticket) return null;
  if (!state.bowl.noodle) return 'noodle';
  if (!state.bowl.broth) return ticket.broth;
  const missing = ticket.toppings.find((t) => !state.bowl.toppings.includes(t));
  return missing ?? null;
}

/** One pilot step: walk, pick, drop or serve. `serve` false makes a build-only pilot. */
function pilot(state, allowServe) {
  const chef = state.chef;
  if (allowServe && state.tray) {
    if (Math.abs(chef.x - TRAY.x) > 30) return { move: chef.x < TRAY.x ? 1 : -1, pick: false, serve: false };
    return { move: 0, pick: false, serve: true };
  }
  const need = needed(state);
  if (!need) return { move: 0, pick: false, serve: false };
  if (chef.carrying === need) {
    if (Math.abs(chef.x - BOWL.x) > 40) return { move: chef.x < BOWL.x ? 1 : -1, pick: false, serve: false };
    return { move: 0, pick: true, serve: false };
  }
  if (chef.carrying) {
    const home = stationXOf(chef.carrying);
    if (Math.abs(chef.x - home) > 40) return { move: chef.x < home ? 1 : -1, pick: false, serve: false };
    return { move: 0, pick: true, serve: false };
  }
  const target = stationXOf(need);
  if (Math.abs(chef.x - target) > 40) return { move: chef.x < target ? 1 : -1, pick: false, serve: false };
  return { move: 0, pick: true, serve: false };
}

function runFor(world, seconds, allowServe, idle = false) {
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const input = idle ? { move: 0, pick: false, serve: false } : pilot(world.state, allowServe);
    const events = world.step(SAMPLE, input, false);
    if (events & EVENT_OVER) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the score.
 * start: the dressed title kitchen. play: a finished bowl waiting on the tray while
 * the next bowl is already half built. rush: a busy mid-shift frame, three tickets up.
 * end: the shift played out to its close.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    world.reset();
    // Phase one: build a bowl without serving, until a finished bowl sits on the tray.
    for (let i = 0; i < 90 / SAMPLE; i += 1) {
      world.step(SAMPLE, pilot(world.state, false), false);
      if (world.state.tray) break;
    }
    // Phase two: start the next bowl and stop once it is half built, so the frame
    // shows a ready plate AND a dish mid-assembly at once.
    for (let i = 0; i < 30 / SAMPLE; i += 1) {
      world.step(SAMPLE, pilot(world.state, false), false);
      const bowl = world.state.bowl;
      if (bowl.noodle && bowl.broth && bowl.toppings.length >= 1) break;
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'rush') {
    world.reset();
    // Work in bursts with idle gaps: orders keep arriving while the chef dawdles,
    // so the board fills up and a patience bar runs low.
    let t = 0;
    while (t < 90) {
      runFor(world, 6, true);
      t += 6;
      runFor(world, 2, true, true);
      t += 2;
    }
    // Freeze mid-build so the work bowl is visibly half full, not freshly emptied.
    for (let i = 0; i < 20 / SAMPLE; i += 1) {
      world.step(SAMPLE, pilot(world.state, false), false);
      const bowl = world.state.bowl;
      if (bowl.noodle && bowl.broth) break;
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    world.reset();
    runFor(world, 400, true);
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  world.stageAttract();
  return { screen: SCREEN_TITLE, best: 0 };
}
