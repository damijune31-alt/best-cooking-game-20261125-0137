// Ramen Rush — keyboard and mouse. Arrows or A/D walk the chef, Space picks an
// ingredient up or drops it in the bowl, S serves a finished bowl from the tray,
// P pauses, Enter starts. Clicking the counter walks the chef there; clicking a
// station, the bowl or the tray walks over and does the job on arrival.

import { BOWL, STATIONS, TRAY } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let targetX = null;
  let pendingAction = null;

  function keyDown(event) {
    if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Enter' || event.code === 'Space') actions |= ACTION_CONFIRM;
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    if (event.code === 'KeyS') pendingAction = 'serve';
    if (event.code === 'Space') pendingAction = 'pick';
    for (const station of STATIONS) {
      if (event.code === `Digit${station.key}`) {
        targetX = stationX(station);
        pendingAction = 'pick';
      }
    }
  }

  function keyUp(event) {
    keys.delete(event.code);
  }

  function stationX(station) {
    return 130 + STATIONS.indexOf(station) * 130;
  }

  /** Which counter zone a click falls in: a station, the bowl, the tray, or plain floor. */
  function zoneAt(x, y) {
    for (const station of STATIONS) {
      if (Math.abs(x - stationX(station)) < 60 && y > 440 && y < 600) return { type: 'station', x: stationX(station) };
    }
    if (Math.hypot(x - BOWL.x, y - BOWL.y) < 80) return { type: 'bowl', x: BOWL.x };
    if (Math.hypot(x - TRAY.x, y - TRAY.y) < 80) return { type: 'tray', x: TRAY.x };
    return { type: 'move', x };
  }

  function click(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const zone = zoneAt(x, y);
    targetX = zone.x;
    pendingAction = zone.type === 'station' || zone.type === 'bowl' ? 'pick' : zone.type === 'tray' ? 'serve' : null;
    if (zone.type === 'move') actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', click);

  function direction(chefX) {
    if (keys.has('ArrowLeft') || keys.has('KeyA')) {
      targetX = null;
      pendingAction = null;
      return -1;
    }
    if (keys.has('ArrowRight') || keys.has('KeyD')) {
      targetX = null;
      pendingAction = null;
      return 1;
    }
    if (targetX !== null) {
      if (chefX < targetX - 14) return 1;
      if (chefX > targetX + 14) return -1;
      targetX = null;
      return 0;
    }
    return 0;
  }

  /** Edge-triggered actions for this frame: pick/drop, serve, plus confirm/pause flags. */
  function takeActions(chefX) {
    const out = { pick: false, serve: false, flags: actions };
    actions = 0;
    if (pendingAction === 'pick' && targetX === null) {
      out.pick = true;
      pendingAction = null;
    } else if (pendingAction === 'serve' && targetX === null) {
      out.serve = true;
      pendingAction = null;
    }
    return out;
  }

  return { direction, takeActions };
}
