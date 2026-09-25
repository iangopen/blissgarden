// Everything the game exports, flattened into one object. DebugPanel publishes it as window.__bliss
// while debug mode is on (for the browser console and scripts/smoke). Nothing else puts game code on window.
import * as data from './data.js';
import * as state from './state.js';
import * as bus from './core/bus.js';
import * as save from './save.js';
import * as upgrades from './upgrades.js';
import * as daynight from './daynight.js';
import * as crafting from './crafting.js';
import * as artifacts from './artifacts.js';
import * as engine from './engine.js';
import * as achievements from './achievements.js';
import * as log from './render/log.js';
import * as sellTick from './events/sellTick.js';
import * as crowHawk from './events/crowHawk.js';
import * as mole from './events/mole.js';
import * as blight from './events/blight.js';
import * as fungal from './events/fungal.js';
import * as weeds from './events/weeds.js';
import * as stage4 from './events/stage4.js';
import * as stage5 from './events/stage5.js';
import * as events from './events/index.js';
import * as drag from './drag.js';
import * as audio from './audio.js';
import * as particles from './particles.js';
import * as hud from './render/hud.js';
import * as farm from './render/farm.js';
import * as seeds from './render/seeds.js';
import * as renderCrafting from './render/crafting.js';
import * as inventory from './render/inventory.js';
import * as items from './render/items.js';
import * as renderUpgrades from './render/upgrades.js';
import * as panel from './render/panel.js';
import * as renderArtifacts from './render/artifacts.js';
import * as sellbox from './render/sellbox.js';
import * as environment from './render/environment.js';
import * as prestige from './prestige.js';
import * as debug from './debug.js';
import * as seasons from './seasons.js';
import * as tooltip from './tooltip.js';
import * as minigames from './minigames.js';
import * as tradingPost from './tradingPost.js';
import * as tutorial from './tutorial.js';

export function buildConsoleApi() {
  return Object.assign({},
    data, state, bus, save, upgrades, daynight, crafting, artifacts, engine, achievements, log,
    sellTick, crowHawk, mole, blight, fungal, weeds, stage4, stage5, events, drag, audio, particles,
    hud, farm, seeds, renderCrafting, inventory, items, renderUpgrades, panel, renderArtifacts, sellbox, environment,
    prestige, debug, seasons, tooltip, minigames, tradingPost, tutorial);
}
