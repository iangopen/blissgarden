// ══════════════════════════════
// SEEDS
// ══════════════════════════════
window.SEEDS = {
  // Basic shop seeds
  potato:     { name:'Potato',        icon:'🥔', seedIcon:'🌰', cost:5,    grow:15,     sell:12      },
  carrot:     { name:'Carrot',        icon:'🥕', seedIcon:'🌱', cost:15,   grow:45,     sell:40      },
  wheat:      { name:'Wheat',         icon:'🌾', seedIcon:'🌾', cost:40,   grow:90,     sell:110     },
  sunflower:  { name:'Sunflower',     icon:'🌻', seedIcon:'🌻', cost:120,  grow:180,    sell:380     },
  // Bag-only seeds
  pumpkin:    { name:'Pumpkin',       icon:'🎃', seedIcon:'🎃', grow:480,    sell:1400    },
  chard:      { name:'Rainbow Chard', icon:'🌈', seedIcon:'🌿', grow:1200,   sell:5000    },
  moonbloom:  { name:'Moonbloom',     icon:'🌕', seedIcon:'🌑', grow:2700,   sell:18000   },
  starfruit:  { name:'Starfruit',     icon:'⭐', seedIcon:'💫', grow:7200,   sell:65000   },
  thornvine:  { name:'Thornvine',     icon:'🌿', seedIcon:'🌱', grow:14400,  sell:200000  },
  glowshroom: { name:'Glowshroom',    icon:'🍄', seedIcon:'🍄', grow:28800,  sell:580000  },
  voidbloom:  { name:'Voidbloom',     icon:'🌑', seedIcon:'🔮', grow:57600,  sell:1800000 },
  aetherfern: { name:'Aetherfern',    icon:'🌀', seedIcon:'🌀', grow:115200, sell:5500000 },
  solarspike:   { name:'Solarspike',    icon:'☀️', seedIcon:'✨', grow:230400, sell:16000000 },
  // Abyssal bag seeds
  netherfruit:   { name:'Netherfruit',    icon:'🖤', seedIcon:'🖤', grow:28800,   sell:180000,   bag:'abyssal' },
  duskpetal:     { name:'Duskpetal',      icon:'🌸', seedIcon:'🌸', grow:64800,   sell:480000,   bag:'abyssal' },
  ashbloom:      { name:'Ashbloom',       icon:'🌋', seedIcon:'🌋', grow:129600,  sell:1200000,  bag:'abyssal' },
  voidcoral:     { name:'Voidcoral',      icon:'🪸', seedIcon:'🪸', grow:259200,  sell:3500000,  bag:'abyssal' },
  eclipseLotus:  { name:'Eclipse Lotus',  icon:'🌑', seedIcon:'🌑', grow:432000,  sell:12000000, bag:'abyssal' },
  // Divine bag seeds
  stardustFern:  { name:'Stardust Fern',  icon:'🌿', seedIcon:'🌿', grow:172800,  sell:1800000,  bag:'divine'  },
  celestialPod:  { name:'Celestial Pod',  icon:'🫧', seedIcon:'🫧', grow:345600,  sell:6000000,  bag:'divine'  },
  auricBloom:    { name:'Auric Bloom',    icon:'🌟', seedIcon:'🌟', grow:691200,  sell:22000000, bag:'divine'  },
  prismaticRoot: { name:'Prismatic Root', icon:'🌈', seedIcon:'🌈', grow:1382400, sell:90000000, bag:'divine'  },
  genesisSeed:   { name:'Genesis Seed',   icon:'✨', seedIcon:'✨', grow:2592000, sell:400000000,bag:'divine'  },
  // Ascension seeds — bought with prestige points at Stage 5
  ascendedWheat:  { name:'Ascended Wheat',  icon:'🌾', seedIcon:'🌾', grow:3600,   sell:2500000,   ascension:true, ppCost:5  },
  cosmicPumpkin:  { name:'Cosmic Pumpkin',  icon:'🎃', seedIcon:'🎃', grow:21600,  sell:25000000,  ascension:true, ppCost:15 },
  voidLotus:      { name:'Void Lotus',      icon:'🪷', seedIcon:'🪷', grow:86400,  sell:250000000, ascension:true, ppCost:50 },
};

window.BASIC_SEEDS = ['potato','carrot','wheat','sunflower'];

window.SEED_SELL_PRICES = {
  potato:2, carrot:7, wheat:20, sunflower:60,
  pumpkin:133, chard:133, moonbloom:133,
  starfruit:1333, thornvine:1333, glowshroom:1333,
  voidbloom:13333, aetherfern:13333, solarspike:13333,
  netherfruit:83333, duskpetal:83333, ashbloom:83333, voidcoral:83333, eclipseLotus:83333,
  stardustFern:833333, celestialPod:833333, auricBloom:833333, prismaticRoot:833333, genesisSeed:833333,
};

// ══════════════════════════════
// SEED BAGS
// ══════════════════════════════
window.BAGS = [
  { id:'fieldBag',     name:'Field Bag',     icon:'🎒', cost:800,     seedsPerOpen:3,
    seeds:['pumpkin','chard','moonbloom','starfruit','thornvine'],
    odds:[0.65,0.15,0.10,0.05,0.05] },
  { id:'forestBag',    name:'Forest Bag',    icon:'🌲', cost:8000,    seedsPerOpen:3,
    seeds:['starfruit','thornvine','glowshroom','voidbloom','aetherfern'],
    odds:[0.60,0.18,0.12,0.06,0.04] },
  { id:'celestialBag', name:'Celestial Bag', icon:'✨', cost:80000,   seedsPerOpen:3,
    seeds:['voidbloom','aetherfern','solarspike','netherfruit','duskpetal'],
    odds:[0.60,0.18,0.12,0.06,0.04] },
  { id:'abyssalBag',   name:'Abyssal Bag',   icon:'🌑', cost:500000,  seedsPerOpen:3,
    seeds:['netherfruit','duskpetal','ashbloom','voidcoral','eclipseLotus'],
    odds:[0.70,0.15,0.09,0.04,0.02] },
  { id:'divineBag',    name:'Divine Bag',    icon:'✨', cost:5000000, seedsPerOpen:3,
    seeds:['stardustFern','celestialPod','auricBloom','prismaticRoot','genesisSeed'],
    odds:[0.68,0.15,0.10,0.04,0.03] },
];

// ══════════════════════════════
// ITEMS
// ══════════════════════════════
window.ITEMS = {
  wateringCan: {
    id:'wateringCan', name:'Watering Can', icon:'💧', cost:100,
    desc:'Click can in inventory to fill. Drag charged can onto growing crop. +25% speed & value.',
  },
  copperSpout: {
    id:'copperSpout', name:'Copper Spout', icon:'🪙', cost:800,
    desc:'Upgrade the can: fill time reduced to 8s, capacity increases to 2 charges.',
    requires:'wateringCan',
  },
  cage: {
    id:'cage', name:'Cage', icon:'🔒', cost:250,
    desc:'Drag from inventory onto a tile for 75% crow resistance. Stays until removed.',
    stackable:true,
  },
  fertilizer: {
    id:'fertilizer', name:'Common Fertilizer', icon:'🌿', cost:500,
    desc:'Drag from inventory onto any tile. Crops grown there are 25% faster permanently.',
    stackable:true,
  },
  uncommonFert: {
    id:'uncommonFert', name:'Uncommon Fertilizer', icon:'⚗️', cost:2000,
    desc:'Drag from inventory onto any tile. Crops grown there are 40% faster permanently.',
    stackable:true, requires:'fertilizer',
  },
  hiredHand: {
    id:'hiredHand', name:'Hired Hand', icon:'👨‍🌾', repCost:5, maxOwned:3,
    desc:'Drag from inventory to assign to a plot. Auto-harvests when ready. Max 3 total.',
  },
};

// ══════════════════════════════
// BALANCE — EVENTS
// ══════════════════════════════
// Keys match STATE.modifiers.eventResistance.
// interval: ms between rolls. chance: probability per roll.
//   Either may be a { stage: value } map; the entry for the highest stage reached applies.
// season:   STATE.modifiers key multiplied into the chance.
// resist:   { upgradeId: reduction } from mitigation upgrades.
// stack:    'multiply' — reductions compound, resistance = 1 − Π(1 − r);  'add' — reductions sum.
// Thick Skin (prestige) adds its total to every event. Effective resistance is capped at eventResistanceCap.
window.BALANCE = {
  eventResistanceCap: 0.95,
  events: {
    crow:         { interval:10000,                chance:{ 0:0.05, 2:0.08 }, season:'seasonCrowMult', stack:'multiply', resist:{ scarecrowCoat:0.30, ironGreenhouse:0.20 } },
    weed:         { interval:8000,                 chance:{ 0:0.12, 3:0.18 }, season:'seasonWeedMult', stack:'multiply', resist:{ ironGreenhouse:0.20 } },
    thornedWeed:  {                                chance:0.30,               /* share of stage-2 weed spawns */ stack:'multiply', resist:{ herbicideI:0.25 } },
    hawk:         { interval:{ 0:15000, 3:10000 }, chance:{ 0:0.05, 3:0.06 }, season:'seasonCrowMult', stack:'multiply', resist:{ ironGreenhouse:0.20 } },
    mole:         { interval:45000,                chance:0.08,               stack:'multiply', resist:{ groundMesh:0.40, ironGreenhouse:0.20 } },
    rot:          { interval:180000,               chance:0.10,               stack:'multiply', resist:{ soilTreatment:0.40, ironGreenhouse:0.20 } },
    locust:       { interval:30000,                chance:0.03,               stack:'multiply', resist:{ locustWard:0.50, ironGreenhouse:0.20 } },
    blight:       { interval:300000,               chance:0.15,               stack:'multiply', resist:{ weathervane:0.40, ironGreenhouse:0.20 } },
    fungal:       { interval:240000,               chance:0.08,               stack:'multiply', resist:{ antifungalSpray:0.50, ironGreenhouse:0.20 } },
    developer:    { interval:180000,               chance:0.15,               stack:'add',      resist:{ developerBribe:0.50, ironGreenhouse:0.20 } },
    plagueRat:    { interval:40000,                chance:0.10,               stack:'add',      resist:{ ratPoison:0.50, ironGreenhouse:0.20 } },
    acidRain:     { interval:300000,               chance:0.15,               stack:'multiply', resist:{ weathervane:0.40, ironGreenhouse:0.20 } },
    voidRift:     { interval:240000,               chance:0.08,               stack:'add',      resist:{} },
    cosmicCrow:   { interval:12000,                chance:0.06,               stack:'add',      resist:{ cosmicRepellent:0.35, scarecrowCoat:0.20 } },
    realityStorm: { interval:360000,               chance:0.10,               stack:'multiply', resist:{ weathervane:0.30 } },
  },
};

// ══════════════════════════════
// UPGRADES
// ══════════════════════════════
// ── SPRITE SHEET MAPPING ──────────────────────────────────────────────────
const ROW_MAP = {
  potato:0, carrot:1, wheat:2, sunflower:3, pumpkin:4, chard:5, moonbloom:6,
  starfruit:7, thornvine:8, glowshroom:9, voidbloom:10, aetherfern:11, solarspike:12,
  netherfruit:13, duskpetal:14, ashbloom:15, voidcoral:16, eclipseLotus:17,
  stardustFern:18, celestialPod:19, auricBloom:20, prismaticRoot:21, genesisSeed:22,
  ascendedWheat:2, cosmicPumpkin:4, voidLotus:6,
};
const COL_MAP = { seed:0, sprout:1, grown:2 };

const ITEM_ICONS = { water:'💧', cage:'🔒', fertilizer:'🌿', uncommonFert:'⚗️', hiredHand:'👨‍🌾' };

const MILESTONE_VALS = [100, 1000, 10000, 100000, 1000000];
const STAGES = [
  { stage:0, name:'Birth',         threshold:0,          log:null },
  { stage:1, name:'Awakening',     threshold:50000,       log:'🌱 The farm stirs with new life.' },
  { stage:2, name:'Flourishing',   threshold:500000,      log:'🌿 The land is truly alive.' },
  { stage:3, name:'Abundance',     threshold:5000000,     log:'🌾 Harvests overflow the barn.' },
  { stage:4, name:'Legacy',        threshold:50000000,    log:'🏡 This farm will be remembered.' },
  { stage:5, name:'Transcendence', threshold:500000000,   log:'✨ The farm has become something beyond nature.' },
];
const WEED_CLICKS = 20;
const THORNED_WEED_CLICKS = 50;

// ══════════════════════════════
// UPGRADES
// ══════════════════════════════
window.UPGRADES = [
  // ── SPEED CHAIN ──
  { id:'quickRoots',     name:'Quick Roots',            desc:'Crops grow 15% faster',                              cost:20,        type:'speed',          mult:0.87,  chain:null              },
  { id:'fertilizerI',    name:'Fertilizer I',            desc:'Crops grow 30% faster',                              cost:150,       type:'speed',          mult:0.77,  chain:'quickRoots'      },
  { id:'fertilizerII',   name:'Fertilizer II',           desc:'Crops grow 50% faster',                              cost:800,       type:'speed',          mult:0.67,  chain:'fertilizerI'     },
  { id:'fertilizerIII',  name:'Fertilizer III',          desc:'Crops grow 75% faster',                              cost:4000,      type:'speed',          mult:0.57,  chain:'fertilizerII'    },
  { id:'fertilizerIV',   name:'Fertilizer IV',           desc:'Crops grow 2× faster',                               cost:25000,     type:'speed',          mult:0.48,  chain:'fertilizerIII'   },
  { id:'fertilizerV',    name:'Fertilizer V',            desc:'Crops grow 2.6× faster',                             cost:150000,    type:'speed',          mult:0.38,  chain:'fertilizerIV'    },
  { id:'fertilizerVI',   name:'Fertilizer VI',           desc:'Crops grow 3.2× faster',                             cost:600000,    type:'speed',          mult:0.31,  chain:'fertilizerV'     },
  { id:'fertilizerVII',  name:'Fertilizer VII',          desc:'Crops grow 4× faster',                               cost:2500000,   type:'speed',          mult:0.25,  chain:'fertilizerVI'    },
  { id:'fertilizerVIII', name:'Fertilizer VIII',         desc:'Crops grow 5× faster',                               cost:10000000,  type:'speed',          mult:0.20,  chain:'fertilizerVII'   },
  { id:'fertilizerIX',   name:'Fertilizer IX',           desc:'Crops grow 6.5× faster',                             cost:40000000,  type:'speed',          mult:0.15,  chain:'fertilizerVIII'  },
  { id:'fertilizerX',    name:'Fertilizer X',            desc:'Crops grow 8.5× faster',                             cost:150000000, type:'speed',          mult:0.12,  chain:'fertilizerIX'    },
  // ── VALUE CHAIN ──
  { id:'goldenHarvest',  name:'Golden Harvest',          desc:'Crops sell for 30% more',                            cost:50,        type:'value',          mult:1.30,  chain:null              },
  { id:'marketEye',      name:'Market Eye',              desc:'Crops sell for 70% more',                            cost:300,       type:'value',          mult:1.70,  chain:'goldenHarvest'   },
  { id:'merchantTouch',  name:"Merchant's Touch",        desc:'Crops sell for 2.2× more',                           cost:1500,      type:'value',          mult:2.20,  chain:'marketEye'       },
  { id:'marketMastery',  name:'Market Mastery',          desc:'Crops sell for 3× more',                             cost:8000,      type:'value',          mult:3.00,  chain:'merchantTouch'   },
  { id:'marketPinnacle', name:'Market Pinnacle',         desc:'Crops sell for 4× more',                             cost:50000,     type:'value',          mult:4.00,  chain:'marketMastery'   },
  { id:'goldenEmpire',   name:'Golden Empire',           desc:'Crops sell for 5.5× more',                           cost:250000,    type:'value',          mult:5.50,  chain:'marketPinnacle'  },
  { id:'diamondTrade',   name:'Diamond Trade',           desc:'Crops sell for 7.5× more',                           cost:900000,    type:'value',          mult:7.50,  chain:'goldenEmpire'    },
  { id:'platinumExchange',name:'Platinum Exchange',      desc:'Crops sell for 10× more',                            cost:4000000,   type:'value',          mult:10.00, chain:'diamondTrade'    },
  { id:'celestialMarket',name:'Celestial Market',        desc:'Crops sell for 14× more',                            cost:15000000,  type:'value',          mult:14.00, chain:'platinumExchange'},
  { id:'infiniteHarvest',name:'Infinite Harvest',        desc:'Crops sell for 20× more',                            cost:60000000,  type:'value',          mult:20.00, chain:'celestialMarket' },
  { id:'godlyYield',     name:'Godly Yield',             desc:'Crops sell for 30× more',                            cost:250000000, type:'value',          mult:30.00, chain:'infiniteHarvest' },
  // ── SELL SPEED CHAIN ──
  { id:'swiftMarketI',   name:'Swift Market I',          desc:'Sell interval 20% faster',                           cost:80,        type:'sellSpeed',      mult:0.80,  chain:null              },
  { id:'swiftMarketII',  name:'Swift Market II',         desc:'Sell interval 35% faster',                           cost:500,       type:'sellSpeed',      mult:0.65,  chain:'swiftMarketI'    },
  { id:'swiftMarketIII', name:'Swift Market III',        desc:'Sell interval 48% faster',                           cost:2500,      type:'sellSpeed',      mult:0.52,  chain:'swiftMarketII'   },
  { id:'swiftMarketIV',  name:'Swift Market IV',         desc:'Sell interval 58% faster',                           cost:15000,     type:'sellSpeed',      mult:0.42,  chain:'swiftMarketIII'  },
  { id:'swiftMarketV',   name:'Swift Market V',          desc:'Sell interval 67% faster',                           cost:80000,     type:'sellSpeed',      mult:0.33,  chain:'swiftMarketIV'   },
  { id:'swiftMarketVI',  name:'Swift Market VI',         desc:'Sell interval 74% faster',                           cost:400000,    type:'sellSpeed',      mult:0.26,  chain:'swiftMarketV'    },
  { id:'swiftMarketVII', name:'Swift Market VII',        desc:'Sell interval 80% faster',                           cost:1500000,   type:'sellSpeed',      mult:0.20,  chain:'swiftMarketVI'   },
  { id:'swiftMarketVIII',name:'Swift Market VIII',       desc:'Sell interval 85% faster',                           cost:6000000,   type:'sellSpeed',      mult:0.15,  chain:'swiftMarketVII'  },
  { id:'swiftMarketIX',  name:'Swift Market IX',         desc:'Sell interval 89% faster',                           cost:25000000,  type:'sellSpeed',      mult:0.11,  chain:'swiftMarketVIII' },
  { id:'swiftMarketX',   name:'Swift Market X',          desc:'Sell interval 92% faster',                           cost:100000000, type:'sellSpeed',      mult:0.08,  chain:'swiftMarketIX'   },
  // ── PLOT EXPANSIONS ──
  { id:'expandPlot',     name:'Expand Plot',             desc:'Adds a column of 3 tiles (→ 4×3)',                   cost:400,     type:'expand',                     chain:null              },
  { id:'expandBottom',   name:'Bottom Row Expansion',    desc:'Adds a bottom row (→ 4×4)',                          cost:1500,    type:'expandBottom',               chain:'expandPlot'      },
  { id:'expand2ndCol',   name:'Second Column Expansion', desc:'Adds a column (→ 5×4)',                              cost:8000,    type:'expand2ndCol',               chain:'expandBottom'    },
  { id:'expand2ndRow',   name:'Second Row Expansion',    desc:'Adds a row (→ 5×5)',                                 cost:25000,   type:'expand2ndRow',               chain:'expand2ndCol'    },
  { id:'expand3rdCol',   name:'Third Column Expansion',  desc:'Adds a column (→ 6×5)',                              cost:100000,  type:'expand3rdCol',               chain:'expand2ndRow'    },
  { id:'expand3rdRow',   name:'Third Row Expansion',     desc:'Adds a row (→ 6×6)',                                 cost:400000,  type:'expand3rdRow',               chain:'expand3rdCol'    },
  // ── CRANK CHAIN ──
  { id:'windUpCrank',    name:'Wind-Up Crank',           desc:'Click crank to boost sell speed. 1.015× per click.', cost:300,    type:'crank',                      chain:null              },
  { id:'ironCrank',      name:'Iron Crank',              desc:'Iron reinforcement. 1.025× per click.',              cost:750,     type:'crankUp',                    chain:'windUpCrank'     },
  { id:'steelCrank',     name:'Steel Crank',             desc:'Darker steel body. 1.040× per click.',              cost:5000,    type:'crankUp',                    chain:'ironCrank'       },
  { id:'titaniumCrank',  name:'Titanium Crank',          desc:'Blue-grey shimmer. 1.060× per click.',              cost:30000,   type:'crankUp',                    chain:'steelCrank'      },
  { id:'diamondCrank',   name:'Diamond Crank',           desc:'Blue sparkle. 1.085× per click.',                   cost:150000,  type:'crankUp',                    chain:'titaniumCrank'   },
  // ── SELL BOX CHAIN ──
  { id:'ironSellBox',    name:'Iron Sell Box',           desc:'Sells 2 items per interval. Iron crate.',            cost:5000,    type:'ironSellBox',                chain:null              },
  { id:'steelSellBox',   name:'Steel Sell Box',          desc:'Sells 3 items per interval. Reinforced steel.',      cost:20000,   type:'steelSellBox',               chain:'ironSellBox'     },
  { id:'titaniumSellBox',name:'Titanium Sell Box',       desc:'Sells 5 items per interval. Titanium alloy.',        cost:100000,  type:'titaniumSellBox',            chain:'steelSellBox'    },
  { id:'diamondSellBox', name:'Diamond Sell Box',        desc:'Sells 8 items per interval. Diamond-lined.',         cost:500000,  type:'diamondSellBox',             chain:'titaniumSellBox' },
  // ── STAGE 2 MITIGATION ──
  { id:'scarecrowCoat',  name:'Scarecrow Coat 🧥',       desc:'Crows deterred 30% more often (additive with cage bonus).',  cost:8000,   type:'mitigation', stage2:true, chain:null             },
  { id:'hawkNet',        name:'Hawk Net 🕸️',              desc:'Hawks steal 1 crop instead of 2.',                           cost:25000,  type:'mitigation', stage2:true, chain:null             },
  { id:'groundMesh',     name:'Ground Mesh 🪤',           desc:'Mole spawn chance reduced 40%.',                             cost:12000,  type:'mitigation', stage2:true, chain:null             },
  { id:'quickSoil',      name:'Quick Soil 🪨',            desc:'Mound recovery time permanently 5s instead of 20s.',         cost:30000,  type:'mitigation', stage2:true, chain:null             },
  { id:'herbicideI',     name:'Herbicide I 🧴',           desc:'Thorned weed spawn chance reduced 25%.',                     cost:15000,  type:'mitigation', stage2:true, chain:null             },
  { id:'herbicideII',    name:'Herbicide II 🧴🧴',        desc:'Thorned weeds never spread.',                                cost:60000,  type:'mitigation', stage2:true, chain:'herbicideI'     },
  // ── STAGE 3 MITIGATION ──
  { id:'soilTreatment',  name:'Soil Treatment 💉',        desc:'Root rot chance reduced 40%.',                               cost:150000,  type:'mitigation', stage3:true, chain:null               },
  { id:'fastCure',       name:'Fast Cure ⚕️',             desc:'Root rot cure cost -60%, cures instantly on click.',         cost:400000,  type:'mitigation', stage3:true, chain:'soilTreatment'    },
  { id:'locustWard',     name:'Locust Ward 🔔',           desc:'Locust swarm chance -50% (stacks with scarecrow).',          cost:200000,  type:'mitigation', stage3:true, chain:null               },
  { id:'cropShield',     name:'Crop Shield 🛡️',           desc:'Locust swarm sets crops back 15% instead of 30%.',           cost:600000,  type:'mitigation', stage3:true, chain:'locustWard'       },
  { id:'weathervane',    name:'Weathervane 🌬️',           desc:'Blight storm chance reduced 40%.',                           cost:250000,  type:'mitigation', stage3:true, chain:null               },
  { id:'soilAnchor',     name:'Soil Anchor ⚓',           desc:'Fertilizer tiles immune to blight storms.',                  cost:700000,  type:'mitigation', stage3:true, chain:'weathervane'      },
  { id:'antifungalSpray',name:'Antifungal Spray 🧪',      desc:'Fungal bloom chance reduced 50%.',                           cost:350000,  type:'mitigation', stage3:true, chain:null               },
  { id:'containment',    name:'Containment 🚧',           desc:'Fungal bloom cannot spread past its origin tile.',           cost:900000,  type:'mitigation', stage3:true, chain:'antifungalSpray'  },
  { id:'ironGreenhouse', name:'Iron Greenhouse 🏠',        desc:'All Stage 2 & 3 event chances reduced 20% globally.',        cost:2000000, type:'mitigation', stage3:true, chain:null               },
  { id:'masterFarmer',   name:'Master Farmer 👨‍🌾',         desc:'Weeds and thorned weeds auto-clear after 10s.',              cost:5000000,   type:'mitigation', stage3:true, chain:null               },
  // ── STAGE 4 MITIGATION ──
  { id:'developerBribe', name:'Developer Bribe 💰',        desc:'Land developers 50% less likely to claim tiles.',           cost:5000000,   type:'mitigation', stage4:true, chain:null           },
  { id:'ratPoison',      name:'Rat Poison ☠️',              desc:'Plague rat spawn chance reduced 50%.',                      cost:8000000,   type:'mitigation', stage4:true, chain:null           },
  { id:'acidShield',     name:'Acid Shield 🛡️',             desc:'Acid rain sets crops back 5% instead of 20%.',             cost:12000000,  type:'mitigation', stage4:true, chain:null           },
  { id:'acidProofSoil',  name:'Acid-Proof Soil 🧪',         desc:'Fertilizer tiles immune to acid rain.',                    cost:25000000,  type:'mitigation', stage4:true, chain:'acidShield'   },
  // ── STAGE 5 MITIGATION ──
  { id:'timeDilation',   name:'Time Dilation ⏱️',           desc:'Void rift drain reduced from 10% to 5% per tick.',         cost:80000000,  type:'mitigation', stage5:true, chain:null           },
  { id:'riftStabilizer', name:'Rift Stabilizer 🔧',         desc:'Void rift drain reduced by an additional 30%.',            cost:80000000,  type:'mitigation', stage5:true, chain:'timeDilation' },
  { id:'cosmicWell',     name:'Cosmic Well 💫',             desc:'Watering can fills instantly and waters 3 tiles.',          cost:150000000, type:'mitigation', stage5:true, chain:null           },
  { id:'cosmicRepellent',name:'Cosmic Repellent 🧴',        desc:'Cosmic crow deterrence +35%.',                             cost:150000000, type:'mitigation', stage5:true, chain:null           },
  { id:'realityAnchor',  name:'Reality Anchor ⚓',          desc:'Reality storms cannot strip cages.',                       cost:300000000, type:'mitigation', stage5:true, chain:null           },
  { id:'stormShelter',   name:'Storm Shelter 🏠',           desc:'Reality storms cannot cause root rot.',                    cost:300000000, type:'mitigation', stage5:true, chain:null           },
  { id:'voidSeal',       name:'Void Seal 🔒',               desc:'Maximum of 1 void rift can exist at a time.',              cost:600000000, type:'mitigation', stage5:true, chain:'riftStabilizer'},
  { id:'quantumCage',    name:'Quantum Cage 🔒',            desc:'Cages immune to reality storm stripping.',                 cost:600000000, type:'mitigation', stage5:true, chain:'realityAnchor'},
  // ── SPECIAL ──
  { id:'workshop',         name:'Workshop Area 🔨',     desc:'Unlocks the crafting and artifact system',      cost:5000,     type:'special',       chain:null             },
  // ── WORKSHOP SPEED CHAIN ──
  { id:'apprenticeBench',  name:'Apprentice Bench 🪑',  desc:'Craft time -25%.',                              cost:50000,    type:'workshopSpeed', chain:'workshop'       },
  { id:'journeymanForge',  name:'Journeyman Forge 🔥',  desc:'Craft time -40%.',                              cost:200000,   type:'workshopSpeed', chain:'apprenticeBench'},
  { id:'masterWorkshop',   name:'Master Workshop ⚒️',   desc:'Craft time -60%.',                              cost:800000,   type:'workshopSpeed', chain:'journeymanForge'},
  { id:'dualCraftSlot',    name:'Dual Craft Slot ⊕',    desc:'Craft up to 2 items simultaneously.',           cost:2000000,  type:'craftSlot',     chain:'masterWorkshop' },
  { id:'tripleCraftSlot',  name:'Triple Craft Slot ⊕⊕', desc:'Craft up to 3 items simultaneously.',           cost:10000000, type:'craftSlot',     chain:'dualCraftSlot'  },
];

window.SEED_BAGS = window.BAGS;

// ══════════════════════════════
// ARTIFACTS
// ══════════════════════════════
window.ARTIFACTS = [
  { id:'breadTotem',   name:'Bread Totem',   emoji:'🍞', desc:'+25% grow speed permanently',         ingredients:{ bread:30 },                                     effect:{ type:'growSpeed',          value:0.25 } },
  { id:'stewCauldron', name:'Stew Cauldron',  emoji:'🍲', desc:'+20% sell value permanently',         ingredients:{ carrotStew:20 },                                 effect:{ type:'sellValue',          value:0.20 } },
  { id:'sunObelisk',   name:'Sun Obelisk',    emoji:'🌻', desc:'Day bonus increased to +25%',         ingredients:{ sunflowerOil:25, bread:10 },                     effect:{ type:'dayBonus',           value:0.25 } },
  { id:'moonShrine',   name:'Moon Shrine',    emoji:'🌙', desc:'Night crops grow 30% faster',         ingredients:{ sunflowerOil:15, carrotStew:15 },                effect:{ type:'nightCropSpeed',     value:0.30 } },
  { id:'harvestIdol',  name:'Harvest Idol',   emoji:'🏺', desc:'Auto-sell interval -20% permanently', ingredients:{ bread:20, carrotStew:20 },                       effect:{ type:'sellInterval',       value:0.20 } },
  { id:'goldSigil',    name:'Gold Sigil',     emoji:'✴️', desc:'+35% sell value permanently',         ingredients:{ bread:50, sunflowerOil:40 },                     effect:{ type:'sellValue',          value:0.35 } },
  { id:'voidRelic',    name:'Void Relic',     emoji:'🌑', desc:'Night penalty removed entirely',      ingredients:{ carrotStew:50, sunflowerOil:30 },                effect:{ type:'removeNightPenalty', value:1 } },
  { id:'cosmicAnvil',  name:'Cosmic Anvil',   emoji:'⚒️', desc:'+50% grow speed permanently',         ingredients:{ bread:100, carrotStew:80, sunflowerOil:60 },    effect:{ type:'growSpeed',          value:0.50 } },
];

// ══════════════════════════════
// RECIPES
// ══════════════════════════════
// ══════════════════════════════
// ACHIEVEMENTS
// ══════════════════════════════
window.ACHIEVEMENTS = [
  // FARMING
  { id:'firstPlant',      name:'First Seed',          desc:'Plant your first crop',                          category:'farming',     stars:1 },
  { id:'firstHarvest',    name:'First Harvest',        desc:'Harvest your first crop',                        category:'farming',     stars:1 },
  { id:'harvest100',      name:'Busy Hands',           desc:'Harvest 100 crops',                              category:'farming',     stars:2 },
  { id:'harvest1000',     name:'Seasoned Farmer',      desc:'Harvest 1,000 crops',                            category:'farming',     stars:3 },
  { id:'harvest10000',    name:'Master of the Land',   desc:'Harvest 10,000 crops',                           category:'farming',     stars:4 },
  { id:'allBasicSeeds',   name:'Basic Botanist',       desc:'Plant every basic seed type',                    category:'farming',     stars:2 },
  { id:'allSeeds',        name:'Full Bloom',           desc:'Plant every seed type in the game',              category:'farming',     stars:4 },
  { id:'fertilizeAll',    name:'Rich Soil',            desc:'Fertilize every plot simultaneously',            category:'farming',     stars:3 },
  // TRADING
  { id:'first100',        name:'Pocket Change',        desc:'Earn 100 coins',                                 category:'trading',     stars:1 },
  { id:'first1k',         name:'Small Fortune',        desc:'Earn 1,000 coins total',                         category:'trading',     stars:1 },
  { id:'first10k',        name:'Growing Wealth',       desc:'Earn 10,000 coins total',                        category:'trading',     stars:2 },
  { id:'first100k',       name:'Prosperous',           desc:'Earn 100,000 coins total',                       category:'trading',     stars:2 },
  { id:'first1m',         name:'Gold Baron',           desc:'Earn 1,000,000 coins total',                     category:'trading',     stars:3 },
  { id:'first10m',        name:'Tycoon',               desc:'Earn 10,000,000 coins total',                    category:'trading',     stars:4 },
  { id:'first1b',         name:'Legendary Merchant',   desc:'Earn 1,000,000,000 coins total',                 category:'trading',     stars:5 },
  { id:'sellCrafted10',   name:'Value Added',          desc:'Sell 10 crafted items',                          category:'trading',     stars:2 },
  // SURVIVAL
  { id:'firstCrow',       name:'Bird Watch',           desc:'Survive your first crow attack',                 category:'survival',    stars:1 },
  { id:'survive10Crows',  name:'Scarecrow',            desc:'Survive 10 crow or hawk attacks',                category:'survival',    stars:2 },
  { id:'clearWeed',       name:'Weed Puller',          desc:'Clear your first weed',                          category:'survival',    stars:1 },
  { id:'clear50Weeds',    name:'Garden Keeper',        desc:'Clear 50 weeds total',                           category:'survival',    stars:3 },
  { id:'surviveLocust',   name:'Against the Swarm',    desc:'Survive a locust swarm',                         category:'survival',    stars:3 },
  { id:'cureRot',         name:'Plant Doctor',         desc:'Cure root rot on a crop',                        category:'survival',    stars:2 },
  { id:'surviveStage3',   name:"Nature's Wrath",       desc:'Reach Stage 3 and survive a blight storm',       category:'survival',    stars:4 },
  // CRAFTING
  { id:'firstCraft',      name:'Home Cook',            desc:'Craft your first item',                          category:'crafting',    stars:1 },
  { id:'craft10',         name:'Regular Chef',         desc:'Craft 10 items',                                 category:'crafting',    stars:2 },
  { id:'craft100',        name:'Master Crafter',       desc:'Craft 100 items',                                category:'crafting',    stars:3 },
  { id:'craftAll',        name:'Full Menu',            desc:'Craft every available recipe at least once',     category:'crafting',    stars:3 },
  { id:'firstArtifact',  name:'Relic Hunter',          desc:'Craft your first artifact',                      category:'crafting',    stars:3 },
  { id:'allArtifacts',   name:'The Collector',         desc:'Craft every artifact',                           category:'crafting',    stars:5 },
  // PRESTIGE
  { id:'firstPrestige',   name:'Reborn',               desc:'Prestige for the first time',                    category:'prestige',    stars:3 },
  { id:'prestige5',       name:'Cycle of Life',        desc:'Prestige 5 times',                               category:'prestige',    stars:4 },
  { id:'prestige10',      name:'Eternal Farmer',       desc:'Prestige 10 times',                              category:'prestige',    stars:5 },
  // EXPLORATION
  { id:'stage1',          name:'Awakening',            desc:'Reach Stage 1',                                  category:'exploration', stars:1 },
  { id:'stage2',          name:'Flourishing',          desc:'Reach Stage 2',                                  category:'exploration', stars:2 },
  { id:'stage3',          name:'Abundance',            desc:'Reach Stage 3',                                  category:'exploration', stars:3 },
  { id:'stage4',          name:'Legacy',               desc:'Reach Stage 4',                                  category:'exploration', stars:4 },
  { id:'stage5',          name:'Transcendence',        desc:'Reach Stage 5',                                  category:'exploration', stars:5 },
  { id:'expandPlot',      name:'More Room',            desc:'Expand your farm for the first time',            category:'exploration', stars:2 },
  { id:'buyBag',          name:'Mystery Box',          desc:'Purchase your first seed bag',                   category:'exploration', stars:1 },
  // MINIGAMES
  { id:'soilMixerEasy10',   name:'Muddy Hands',      desc:'Play Soil Mixer on Easy 10 times',   category:'exploration', stars:1 },
  { id:'soilMixerMedium10', name:'Soil Sculptor',    desc:'Play Soil Mixer on Medium 10 times', category:'exploration', stars:2 },
  { id:'waterFlowEasy10',   name:'Pipe Dreamer',     desc:'Play Water Flow on Easy 10 times',   category:'exploration', stars:1 },
  { id:'waterFlowMedium10', name:'Master Plumber',   desc:'Play Water Flow on Medium 10 times', category:'exploration', stars:2 },
  { id:'minigame50',        name:'Taking a Break',   desc:'Play any minigame 50 times total',   category:'exploration', stars:2 },
  { id:'minigame200',       name:'Procrastinator',   desc:'Play any minigame 200 times total',  category:'exploration', stars:3 },
];

// ══════════════════════════════
// SEASONS
// ══════════════════════════════
window.SEASONS = [
  { id:'spring', name:'Spring', emoji:'🌸', duration:300, skyTint:'#c8f0a0',
    effects:{ growSpeed:1.10, weedChance:1.30, sellValue:1.0,  crowChance:1.0  },
    dayNightMult:{ day:1.15, night:0.85 } },
  { id:'summer', name:'Summer', emoji:'☀️', duration:300, skyTint:'#87CEEB',
    effects:{ growSpeed:1.0,  weedChance:1.0,  sellValue:1.0,  crowChance:1.0  },
    dayNightMult:{ day:1.25, night:0.85 }, specialEvent:'drought' },
  { id:'autumn', name:'Autumn', emoji:'🍂', duration:300, skyTint:'#e8a870',
    effects:{ growSpeed:0.95, weedChance:0.80, sellValue:1.15, crowChance:1.25 },
    dayNightMult:{ day:1.10, night:0.90 } },
  { id:'winter', name:'Winter', emoji:'❄️', duration:300, skyTint:'#d0e8f8',
    effects:{ growSpeed:0.80, weedChance:0.50, sellValue:1.0,  crowChance:0.80 },
    dayNightMult:{ day:1.0,  night:0.95 } },
];

window.RECIPES = [
  // ── TIER 1 — Common, free unlocks ─────────────────────────────────────────
  { id:'bread',          name:'Bread',           emoji:'🍞', tier:1, ingredients:{ wheat:3 },               craftTime:30,   sellValue:80,    unlockType:'free' },
  { id:'carrotStew',     name:'Carrot Stew',     emoji:'🍲', tier:1, ingredients:{ carrot:4, potato:1 },    craftTime:45,   sellValue:120,   unlockType:'free' },
  { id:'sunflowerOil',   name:'Sunflower Oil',   emoji:'🫙', tier:1, ingredients:{ sunflower:3 },           craftTime:60,   sellValue:200,   unlockType:'free' },
  { id:'wheatFlour',     name:'Wheat Flour',     emoji:'🌾', tier:1, ingredients:{ wheat:5 },               craftTime:20,   sellValue:60,    unlockType:'free' },
  { id:'potatoMash',     name:'Potato Mash',     emoji:'🥔', tier:1, ingredients:{ potato:6 },              craftTime:25,   sellValue:90,    unlockType:'free' },
  { id:'carrotJuice',    name:'Carrot Juice',    emoji:'🥕', tier:1, ingredients:{ carrot:5 },              craftTime:30,   sellValue:100,   unlockType:'free' },
  // ── TIER 2 — Uncommon, purchased unlocks ──────────────────────────────────
  { id:'harvestLoaf',    name:'Harvest Loaf',    emoji:'🍠', tier:2, ingredients:{ bread:2, wheatFlour:3 },              craftTime:120,  sellValue:800,   unlockType:'purchase', unlockCost:5000 },
  { id:'farmersStew',    name:"Farmer's Stew",   emoji:'🫕', tier:2, ingredients:{ carrotStew:2, potatoMash:2 },         craftTime:150,  sellValue:1200,  unlockType:'purchase', unlockCost:8000 },
  { id:'sunwickOil',     name:'Sunwick Oil',     emoji:'🕯️', tier:2, ingredients:{ sunflowerOil:3, carrotJuice:2 },      craftTime:180,  sellValue:2000,  unlockType:'purchase', unlockCost:12000 },
  { id:'pumpkinPie',     name:'Pumpkin Pie',     emoji:'🥧', tier:2, ingredients:{ pumpkin:4, wheatFlour:3 },            craftTime:200,  sellValue:3500,  unlockType:'purchase', unlockCost:20000 },
  { id:'moonwineElixir', name:'Moonwine Elixir', emoji:'🍷', tier:2, ingredients:{ moonbloom:3, carrotJuice:4 },         craftTime:300,  sellValue:8000,  unlockType:'purchase', unlockCost:35000 },
  // ── TIER 3 — Rare, prestige / achievement unlocks ─────────────────────────
  { id:'celestialBread', name:'Celestial Bread', emoji:'🌟', tier:3, ingredients:{ harvestLoaf:3, starfruit:2 },         craftTime:600,  sellValue:50000, unlockType:'prestige',     unlockPrestige:1 },
  { id:'voidEssence',    name:'Void Essence',    emoji:'🌑', tier:3, ingredients:{ moonwineElixir:2, voidbloom:3 },      craftTime:900,  sellValue:120000,unlockType:'prestige',     unlockPrestige:1 },
  { id:'thornExtract',   name:'Thorn Extract',   emoji:'🌿', tier:3, ingredients:{ thornvine:5, sunwickOil:3 },          craftTime:800,  sellValue:90000, unlockType:'achievement',  unlockAchievementId:'survive10Crows' },
  { id:'glowPotion',     name:'Glow Potion',     emoji:'🍄', tier:3, ingredients:{ glowshroom:6, moonwineElixir:2 },     craftTime:1200, sellValue:200000,unlockType:'purchase',     unlockCost:500000 },
  { id:'aetherDraught',  name:'Aether Draught',  emoji:'🌀', tier:3, ingredients:{ aetherfern:4, voidEssence:2 },        craftTime:1800, sellValue:500000,unlockType:'prestige',     unlockPrestige:2 },
  // ── TIER 4 — Epic, high prestige / achievement ─────────────────────────────
  { id:'solarAmbrosia',  name:'Solar Ambrosia',  emoji:'☀️', tier:4, ingredients:{ solarspike:3, celestialBread:3 },     craftTime:3600, sellValue:3000000,  unlockType:'prestige',    unlockPrestige:3 },
  { id:'cosmicElixir',   name:'Cosmic Elixir',   emoji:'🌌', tier:4, ingredients:{ aetherDraught:2, glowPotion:3 },      craftTime:5400, sellValue:8000000,  unlockType:'prestige',    unlockPrestige:4 },
  { id:'netharbrew',     name:'Nethar Brew',      emoji:'🖤', tier:4, ingredients:{ netherfruit:8, voidEssence:4 },       craftTime:4800, sellValue:5000000,  unlockType:'achievement', unlockAchievementId:'stage3' },
  { id:'eclipseWine',    name:'Eclipse Wine',     emoji:'🌘', tier:4, ingredients:{ eclipseLotus:4, cosmicElixir:1 },    craftTime:7200, sellValue:20000000, unlockType:'prestige',    unlockPrestige:5 },
  // ── TIER 5 — Legendary, deep prestige ─────────────────────────────────────
  { id:'divineCraft',    name:'Divine Crafting',  emoji:'✨', tier:5, ingredients:{ eclipseWine:2, solarAmbrosia:2, cosmicElixir:2 }, craftTime:14400, sellValue:150000000, unlockType:'prestige', unlockPrestige:7 },
  { id:'genesisElixir',  name:'Genesis Elixir',   emoji:'🌱', tier:5, ingredients:{ genesisSeed:1, divineCraft:1 },                  craftTime:28800, sellValue:800000000, unlockType:'prestige', unlockPrestige:10 },
];

// ══════════════════════════════
// PRESTIGE PERKS
// ══════════════════════════════
// ══════════════════════════════
// BLUEPRINTS
// ══════════════════════════════
window.BLUEPRINTS = [
  { id:'bp_breadTotem',   name:'Bread Totem Blueprint',   artifactId:'breadTotem',   cost:2000,   source:'shop' },
  { id:'bp_stewCauldron', name:'Stew Cauldron Blueprint', artifactId:'stewCauldron', cost:5000,   source:'shop' },
  { id:'bp_sunObelisk',   name:'Sun Obelisk Blueprint',   artifactId:'sunObelisk',   cost:15000,  source:'shop' },
  { id:'bp_moonShrine',   name:'Moon Shrine Blueprint',   artifactId:'moonShrine',   cost:25000,  source:'achievement', achievementId:'harvest1000' },
  { id:'bp_harvestIdol',  name:'Harvest Idol Blueprint',  artifactId:'harvestIdol',  cost:50000,  source:'shop' },
  { id:'bp_goldSigil',    name:'Gold Sigil Blueprint',    artifactId:'goldSigil',    cost:150000, source:'achievement', achievementId:'first1m' },
  { id:'bp_voidRelic',    name:'Void Relic Blueprint',    artifactId:'voidRelic',    cost:500000, source:'shop' },
  { id:'bp_cosmicAnvil',  name:'Cosmic Anvil Blueprint',  artifactId:'cosmicAnvil',  cost:0,      source:'achievement', achievementId:'allArtifacts' },
];

window.PRESTIGE_PERKS = [
  { id:'fertileLegacy',  name:'Fertile Legacy',   desc:'Crops grow 25% faster per stack',        cost:1, maxStack:10, type:'growSpeed',      valuePerStack:0.25 },
  { id:'goldenMemory',   name:'Golden Memory',     desc:'Crops sell for 30% more per stack',      cost:1, maxStack:10, type:'sellValue',       valuePerStack:0.30 },
  { id:'swiftReturn',    name:'Swift Return',      desc:'Sell interval -15% per stack',           cost:2, maxStack:5,  type:'sellInterval',    valuePerStack:0.15 },
  { id:'headStart',      name:'Head Start',        desc:'Start with 2,000 extra coins per stack', cost:1, maxStack:10, type:'startGold',       valuePerStack:2000 },
  { id:'thickSkin',      name:'Thick Skin',        desc:'All event chances -8% per stack',        cost:2, maxStack:6,  type:'eventResistance', valuePerStack:0.08 },
  { id:'extraPlot',      name:'Extra Plot',        desc:'Start with 1 extra unlocked plot',       cost:3, maxStack:6,  type:'plotCount',       valuePerStack:1    },
];
