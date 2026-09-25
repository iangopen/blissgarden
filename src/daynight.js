import { STATE } from './state.js';

// Day/night growth multiplier per crop. Growth depends on it, so it is game logic, not render
// (it used to live in render/environment.js). STATE.session.timeOfDay is still set by RenderEnv.updateSky().
const DAY_SEEDS   = new Set(['potato','carrot','wheat','sunflower','pumpkin']);
const NIGHT_SEEDS = new Set(['moonbloom','voidbloom','eclipseLotus','netherfruit','genesisSeed']);

export function getDayNightMult(seedId) {
  const tod    = STATE.session.timeOfDay || 'day';
  const sess   = STATE.session;
  const dayMult   = sess.seasonDayMult   || 1.15;
  const nightMult = sess.seasonNightMult || 0.85;
  let global = 1.0;
  if (tod === 'day')   global = sess.artifactDayBonus   ? (1 + sess.artifactDayBonus) : dayMult;
  if (tod === 'night') global = sess.artifactNoNightPen ? 1.0                         : nightMult;
  let crop = 1.0;
  if (DAY_SEEDS.has(seedId)) {
    if (tod === 'day')   crop = 1.20;
    if (tod === 'night') crop = 0.80;
  } else if (NIGHT_SEEDS.has(seedId)) {
    if (tod === 'night') crop = 1.20 * (1 + (sess.artifactNightSpeed || 0));
    if (tod === 'day')   crop = 0.80;
  }
  return global * crop;
}
