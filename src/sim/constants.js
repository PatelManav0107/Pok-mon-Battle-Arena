/**
 * Core Data Constants for Pokémon Battle Arena
 * Contains 22 Pokémon definitions, moves, cooldowns, ultimates,
 * the 18-type effectiveness matrix, and arena configurations.
 */

export const POKEMON_POOL = [
  {
    id: 6,
    name: "Charizard",
    types: ["Fire", "Flying"],
    hp: 160, atk: 85, def: 78, spd: 100,
    moves: [
      { name: "Flamethrower", type: "Fire", power: 90, cd: 2 },
      { name: "Air Slash", type: "Flying", power: 75, cd: 0 },
      { name: "Dragon Claw", type: "Dragon", power: 80, cd: 1 },
      { name: "Slash", type: "Normal", power: 70, cd: 0 }
    ],
    ult: {
      name: "Inferno Overdrive",
      subtitle: "Crimson Dragon Supernova",
      type: "Fire",
      power: 150,
      cd: 3,
      color1: "#ef4444",
      color2: "#fde047",
      visual: "charizard_inferno"
    }
  },
  {
    id: 9,
    name: "Blastoise",
    types: ["Water"],
    hp: 165, atk: 83, def: 100, spd: 78,
    moves: [
      { name: "Hydro Pump", type: "Water", power: 110, cd: 3 },
      { name: "Surf", type: "Water", power: 90, cd: 2 },
      { name: "Ice Beam", type: "Ice", power: 90, cd: 2 },
      { name: "Bite", type: "Dark", power: 60, cd: 0 }
    ],
    ult: {
      name: "Hydro Vortex",
      subtitle: "Twin Maelstrom Cannon",
      type: "Water",
      power: 150,
      cd: 3,
      color1: "#1d4ed8",
      color2: "#38bdf8",
      visual: "blastoise_vortex"
    }
  },
  {
    id: 3,
    name: "Venusaur",
    types: ["Grass", "Poison"],
    hp: 165, atk: 82, def: 83, spd: 80,
    moves: [
      { name: "Solar Beam", type: "Grass", power: 100, cd: 3 },
      { name: "Razor Leaf", type: "Grass", power: 55, cd: 0 },
      { name: "Sludge Bomb", type: "Poison", power: 90, cd: 2 },
      { name: "Body Slam", type: "Normal", power: 85, cd: 1 }
    ],
    ult: {
      name: "Bloom Doom",
      subtitle: "Gaia Solar Cataclysm",
      type: "Grass",
      power: 150,
      cd: 3,
      color1: "#15803d",
      color2: "#fde047",
      visual: "venusaur_bloom"
    }
  },
  {
    id: 25,
    name: "Pikachu",
    types: ["Electric"],
    hp: 120, atk: 70, def: 50, spd: 110,
    moves: [
      { name: "Thunderbolt", type: "Electric", power: 90, cd: 2 },
      { name: "Quick Attack", type: "Normal", power: 40, cd: 0 },
      { name: "Iron Tail", type: "Steel", power: 80, cd: 1 },
      { name: "Brick Break", type: "Fighting", power: 75, cd: 0 }
    ],
    ult: {
      name: "10,000,000 Volt Bolt",
      subtitle: "Rainbow Sky Thunder",
      type: "Electric",
      power: 155,
      cd: 3,
      color1: "#eab308",
      color2: "#38bdf8",
      visual: "pikachu_10m_volt"
    }
  },
  {
    id: 94,
    name: "Gengar",
    types: ["Ghost", "Poison"],
    hp: 135, atk: 130, def: 60, spd: 110,
    moves: [
      { name: "Shadow Ball", type: "Ghost", power: 80, cd: 0 },
      { name: "Sludge Bomb", type: "Poison", power: 90, cd: 2 },
      { name: "Thunderbolt", type: "Electric", power: 90, cd: 2 },
      { name: "Dark Pulse", type: "Dark", power: 80, cd: 1 }
    ],
    ult: {
      name: "Never-Ending Nightmare",
      subtitle: "Abyssal Phantom Void",
      type: "Ghost",
      power: 150,
      cd: 3,
      color1: "#581c87",
      color2: "#c084fc",
      visual: "gengar_nightmare"
    }
  },
  {
    id: 149,
    name: "Dragonite",
    types: ["Dragon", "Flying"],
    hp: 170, atk: 134, def: 95, spd: 80,
    moves: [
      { name: "Outrage", type: "Dragon", power: 120, cd: 3 },
      { name: "Wing Attack", type: "Flying", power: 60, cd: 0 },
      { name: "Fire Punch", type: "Fire", power: 75, cd: 0 },
      { name: "Dragon Claw", type: "Dragon", power: 80, cd: 1 }
    ],
    ult: {
      name: "Devastating Drake",
      subtitle: "Stratosphere Meteor Rush",
      type: "Dragon",
      power: 155,
      cd: 3,
      color1: "#4338ca",
      color2: "#f97316",
      visual: "dragonite_drake"
    }
  },
  {
    id: 448,
    name: "Lucario",
    types: ["Fighting", "Steel"],
    hp: 145, atk: 110, def: 70, spd: 90,
    moves: [
      { name: "Aura Sphere", type: "Fighting", power: 80, cd: 0 },
      { name: "Flash Cannon", type: "Steel", power: 80, cd: 1 },
      { name: "Dragon Pulse", type: "Dragon", power: 85, cd: 1 },
      { name: "Close Combat", type: "Fighting", power: 120, cd: 3 }
    ],
    ult: {
      name: "All-Out Pummeling",
      subtitle: "Maxima Aura Resonance",
      type: "Fighting",
      power: 150,
      cd: 3,
      color1: "#0284c7",
      color2: "#facc15",
      visual: "lucario_pummeling"
    }
  },
  {
    id: 130,
    name: "Gyarados",
    types: ["Water", "Flying"],
    hp: 160, atk: 125, def: 79, spd: 81,
    moves: [
      { name: "Waterfall", type: "Water", power: 80, cd: 1 },
      { name: "Crunch", type: "Dark", power: 80, cd: 1 },
      { name: "Ice Fang", type: "Ice", power: 65, cd: 0 },
      { name: "Thunder Fang", type: "Electric", power: 65, cd: 0 }
    ],
    ult: {
      name: "Hyper Leviathan",
      subtitle: "Apocalyptic Sea Typhoon",
      type: "Water",
      power: 150,
      cd: 3,
      color1: "#1e3a8a",
      color2: "#38bdf8",
      visual: "gyarados_leviathan"
    }
  },
  {
    id: 65,
    name: "Alakazam",
    types: ["Psychic"],
    hp: 120, atk: 135, def: 45, spd: 120,
    moves: [
      { name: "Psychic", type: "Psychic", power: 90, cd: 1 },
      { name: "Shadow Ball", type: "Ghost", power: 80, cd: 0 },
      { name: "Focus Blast", type: "Fighting", power: 120, cd: 3 },
      { name: "Energy Ball", type: "Grass", power: 90, cd: 2 }
    ],
    ult: {
      name: "Shattered Psyche",
      subtitle: "Singularity Mind Warp",
      type: "Psychic",
      power: 150,
      cd: 3,
      color1: "#be185d",
      color2: "#c084fc",
      visual: "alakazam_psyche"
    }
  },
  {
    id: 143,
    name: "Snorlax",
    types: ["Normal"],
    hp: 200, atk: 110, def: 65, spd: 30,
    moves: [
      { name: "Body Slam", type: "Normal", power: 85, cd: 0 },
      { name: "Hammer Arm", type: "Fighting", power: 100, cd: 2 },
      { name: "Crunch", type: "Dark", power: 80, cd: 1 },
      { name: "Earthquake", type: "Ground", power: 100, cd: 2 }
    ],
    ult: {
      name: "Pulverizing Pancake",
      subtitle: "Colossus Stadium Slam",
      type: "Normal",
      power: 160,
      cd: 3,
      color1: "#475569",
      color2: "#facc15",
      visual: "snorlax_pancake"
    }
  },
  {
    id: 445,
    name: "Garchomp",
    types: ["Dragon", "Ground"],
    hp: 170, atk: 130, def: 95, spd: 102,
    moves: [
      { name: "Earthquake", type: "Ground", power: 100, cd: 2 },
      { name: "Dragon Claw", type: "Dragon", power: 80, cd: 0 },
      { name: "Stone Edge", type: "Rock", power: 100, cd: 2 },
      { name: "Crunch", type: "Dark", power: 80, cd: 1 }
    ],
    ult: {
      name: "Tectonic Rage",
      subtitle: "Supersonic Land Splitter",
      type: "Ground",
      power: 155,
      cd: 3,
      color1: "#b45309",
      color2: "#ef4444",
      visual: "garchomp_tectonic"
    }
  },
  {
    id: 282,
    name: "Gardevoir",
    types: ["Psychic", "Fairy"],
    hp: 130, atk: 125, def: 65, spd: 80,
    moves: [
      { name: "Psychic", type: "Psychic", power: 90, cd: 1 },
      { name: "Moonblast", type: "Fairy", power: 95, cd: 2 },
      { name: "Shadow Ball", type: "Ghost", power: 80, cd: 0 },
      { name: "Thunderbolt", type: "Electric", power: 90, cd: 2 }
    ],
    ult: {
      name: "Twinkle Tackle",
      subtitle: "Celestial Starlight Hole",
      type: "Fairy",
      power: 150,
      cd: 3,
      color1: "#ec4899",
      color2: "#fdf2f8",
      visual: "gardevoir_twinkle"
    }
  },
  {
    id: 150,
    name: "Mewtwo",
    types: ["Psychic"],
    hp: 175, atk: 140, def: 90, spd: 130,
    moves: [
      { name: "Psystrike", type: "Psychic", power: 100, cd: 2 },
      { name: "Aura Sphere", type: "Fighting", power: 80, cd: 0 },
      { name: "Ice Beam", type: "Ice", power: 90, cd: 2 },
      { name: "Shadow Ball", type: "Ghost", power: 80, cd: 1 }
    ],
    ult: {
      name: "Psystrike Omega",
      subtitle: "Genesis Supernova",
      type: "Psychic",
      power: 165,
      cd: 3,
      color1: "#7e22ce",
      color2: "#f472b6",
      visual: "mewtwo_omega"
    }
  },
  {
    id: 384,
    name: "Rayquaza",
    types: ["Dragon", "Flying"],
    hp: 175, atk: 145, def: 90, spd: 95,
    moves: [
      { name: "Dragon Ascent", type: "Flying", power: 120, cd: 3 },
      { name: "Outrage", type: "Dragon", power: 120, cd: 3 },
      { name: "Flamethrower", type: "Fire", power: 90, cd: 2 },
      { name: "Extreme Speed", type: "Normal", power: 80, cd: 0 }
    ],
    ult: {
      name: "Ozone Dragon Ascent",
      subtitle: "Emerald Sky Piercer",
      type: "Flying",
      power: 165,
      cd: 3,
      color1: "#059669",
      color2: "#fde047",
      visual: "rayquaza_ozone"
    }
  },
  {
    id: 197,
    name: "Umbreon",
    types: ["Dark"],
    hp: 185, atk: 85, def: 115, spd: 65,
    moves: [
      { name: "Foul Play", type: "Dark", power: 95, cd: 2 },
      { name: "Dark Pulse", type: "Dark", power: 80, cd: 1 },
      { name: "Psychic", type: "Psychic", power: 90, cd: 2 },
      { name: "Quick Attack", type: "Normal", power: 40, cd: 0 }
    ],
    ult: {
      name: "Black Hole Eclipse",
      subtitle: "Eternal Midnight Judgment",
      type: "Dark",
      power: 145,
      cd: 3,
      color1: "#0f172a",
      color2: "#facc15",
      visual: "umbreon_eclipse"
    }
  },
  {
    id: 248,
    name: "Tyranitar",
    types: ["Rock", "Dark"],
    hp: 180, atk: 134, def: 110, spd: 61,
    moves: [
      { name: "Stone Edge", type: "Rock", power: 100, cd: 2 },
      { name: "Crunch", type: "Dark", power: 80, cd: 1 },
      { name: "Earthquake", type: "Ground", power: 100, cd: 2 },
      { name: "Fire Punch", type: "Fire", power: 75, cd: 0 }
    ],
    ult: {
      name: "Continental Crush",
      subtitle: "Kaiju Mountain Breaker",
      type: "Rock",
      power: 160,
      cd: 3,
      color1: "#78350f",
      color2: "#f59e0b",
      visual: "tyranitar_crush"
    }
  },
  {
    id: 257,
    name: "Blaziken",
    types: ["Fire", "Fighting"],
    hp: 150, atk: 125, def: 70, spd: 90,
    moves: [
      { name: "Blaze Kick", type: "Fire", power: 85, cd: 1 },
      { name: "Close Combat", type: "Fighting", power: 120, cd: 3 },
      { name: "Brave Bird", type: "Flying", power: 120, cd: 3 },
      { name: "Thunder Punch", type: "Electric", power: 75, cd: 0 }
    ],
    ult: {
      name: "Blazing Phoenix Kick",
      subtitle: "Solar Spiral Overdrive",
      type: "Fire",
      power: 155,
      cd: 3,
      color1: "#dc2626",
      color2: "#fde047",
      visual: "blaziken_phoenix"
    }
  },
  {
    id: 376,
    name: "Metagross",
    types: ["Steel", "Psychic"],
    hp: 165, atk: 135, def: 120, spd: 70,
    moves: [
      { name: "Meteor Mash", type: "Steel", power: 95, cd: 2 },
      { name: "Zen Headbutt", type: "Psychic", power: 80, cd: 1 },
      { name: "Earthquake", type: "Ground", power: 100, cd: 2 },
      { name: "Ice Punch", type: "Ice", power: 75, cd: 0 }
    ],
    ult: {
      name: "Corkscrew Crash",
      subtitle: "Titanium Meteor Lock-On",
      type: "Steel",
      power: 155,
      cd: 3,
      color1: "#334155",
      color2: "#38bdf8",
      visual: "metagross_corkscrew"
    }
  },
  {
    id: 212,
    name: "Scizor",
    types: ["Bug", "Steel"],
    hp: 150, atk: 130, def: 100, spd: 75,
    moves: [
      { name: "X-Scissor", type: "Bug", power: 80, cd: 1 },
      { name: "Bullet Punch", type: "Steel", power: 60, cd: 0 },
      { name: "Night Slash", type: "Dark", power: 70, cd: 0 },
      { name: "Close Combat", type: "Fighting", power: 120, cd: 3 }
    ],
    ult: {
      name: "Crimson Hyper Flash",
      subtitle: "Supersonic Steel X-Slash",
      type: "Steel",
      power: 150,
      cd: 3,
      color1: "#b91c1c",
      color2: "#e2e8f0",
      visual: "scizor_crimson"
    }
  },
  {
    id: 131,
    name: "Lapras",
    types: ["Water", "Ice"],
    hp: 190, atk: 95, def: 85, spd: 60,
    moves: [
      { name: "Blizzard", type: "Ice", power: 110, cd: 3 },
      { name: "Hydro Pump", type: "Water", power: 110, cd: 3 },
      { name: "Ice Beam", type: "Ice", power: 90, cd: 0 },
      { name: "Thunderbolt", type: "Electric", power: 90, cd: 2 }
    ],
    ult: {
      name: "Subzero Slammer",
      subtitle: "Aurora Glacial Age",
      type: "Ice",
      power: 150,
      cd: 3,
      color1: "#0284c7",
      color2: "#ecfeff",
      visual: "lapras_subzero"
    }
  },
  {
    id: 59,
    name: "Arcanine",
    types: ["Fire"],
    hp: 165, atk: 115, def: 80, spd: 95,
    moves: [
      { name: "Flare Blitz", type: "Fire", power: 120, cd: 3 },
      { name: "Extreme Speed", type: "Normal", power: 80, cd: 1 },
      { name: "Crunch", type: "Dark", power: 80, cd: 0 },
      { name: "Wild Charge", type: "Electric", power: 90, cd: 2 }
    ],
    ult: {
      name: "Sacred Sovereign Flare",
      subtitle: "Imperial Sun Blitz",
      type: "Fire",
      power: 155,
      cd: 3,
      color1: "#ea580c",
      color2: "#fde047",
      visual: "arcanine_sovereign"
    }
  },
  {
    id: 254,
    name: "Sceptile",
    types: ["Grass"],
    hp: 145, atk: 110, def: 65, spd: 120,
    moves: [
      { name: "Leaf Blade", type: "Grass", power: 90, cd: 1 },
      { name: "Energy Ball", type: "Grass", power: 90, cd: 2 },
      { name: "Dragon Pulse", type: "Dragon", power: 85, cd: 1 },
      { name: "X-Scissor", type: "Bug", power: 80, cd: 0 }
    ],
    ult: {
      name: "Jungle Frenzy Plant",
      subtitle: "Emerald Blade Storm",
      type: "Grass",
      power: 150,
      cd: 3,
      color1: "#16a34a",
      color2: "#a3e635",
      visual: "sceptile_frenzy"
    }
  }
];

export const TYPE_CHART = {
  Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice:      { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground:   { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying:   { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost:    { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon:   { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark:     { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy:    { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

export const TYPE_COLORS = {
  Normal:   { bg: "#9ca3af", border: "#d1d5db", shadow: "#4b5563", text: "#111827" },
  Fire:     { bg: "#f97316", border: "#fdba74", shadow: "#9a3412", text: "#ffffff" },
  Water:    { bg: "#3b82f6", border: "#93c5fd", shadow: "#1d4ed8", text: "#ffffff" },
  Electric: { bg: "#eab308", border: "#fef08a", shadow: "#a16207", text: "#111827" },
  Grass:    { bg: "#22c55e", border: "#86efac", shadow: "#15803d", text: "#ffffff" },
  Ice:      { bg: "#06b6d4", border: "#a5f3fc", shadow: "#0e7490", text: "#ffffff" },
  Fighting: { bg: "#dc2626", border: "#fca5a5", shadow: "#7f1d1d", text: "#ffffff" },
  Poison:   { bg: "#a855f7", border: "#d8b4fe", shadow: "#6b21a8", text: "#ffffff" },
  Ground:   { bg: "#d97706", border: "#fde68a", shadow: "#78350f", text: "#ffffff" },
  Flying:   { bg: "#6366f1", border: "#c7d2fe", shadow: "#3730a3", text: "#ffffff" },
  Psychic:  { bg: "#ec4899", border: "#fbcfe8", shadow: "#9d174d", text: "#ffffff" },
  Bug:      { bg: "#84cc16", border: "#d9f99d", shadow: "#3f6212", text: "#111827" },
  Rock:     { bg: "#b45309", border: "#fcd34d", shadow: "#78350f", text: "#ffffff" },
  Ghost:    { bg: "#7c3aed", border: "#ddd6fe", shadow: "#4c1d95", text: "#ffffff" },
  Dragon:   { bg: "#4f46e5", border: "#a5b4fc", shadow: "#312e81", text: "#ffffff" },
  Dark:     { bg: "#475569", border: "#94a3b8", shadow: "#0f172a", text: "#ffffff" },
  Steel:    { bg: "#64748b", border: "#cbd5e1", shadow: "#334155", text: "#ffffff" },
  Fairy:    { bg: "#f472b6", border: "#fbcfe8", shadow: "#be185d", text: "#ffffff" }
};

export const ARENAS = [
  {
    id: "stadium",
    name: "Classic Pokémon Stadium",
    theme: "grass",
    skyGradient: "linear-gradient(180deg, #38bdf8 0%, #7dd3fc 34%, #bae6fd 46%, #86efac 46.5%, #4ade80 68%, #22c55e 88%, #16a34a 100%)",
    platformEnemy: "radial-gradient(ellipse at center, #dcfce7 0%, #4ade80 48%, #16a34a 75%, #14532d 100%)",
    platformPlayer: "radial-gradient(ellipse at center, #dcfce7 0%, #4ade80 50%, #15803d 78%, #14532d 100%)"
  },
  {
    id: "volcano",
    name: "Volcanic Caldera",
    theme: "fire",
    skyGradient: "linear-gradient(180deg, #450a0a 0%, #7f1d1d 30%, #991b1b 46%, #f97316 47%, #ea580c 68%, #c2410c 88%, #7c2d12 100%)",
    platformEnemy: "radial-gradient(ellipse at center, #fef08a 0%, #f97316 48%, #c2410c 75%, #431407 100%)",
    platformPlayer: "radial-gradient(ellipse at center, #fef08a 0%, #f97316 50%, #ea580c 78%, #431407 100%)"
  },
  {
    id: "ocean",
    name: "Cerulean Water Gym",
    theme: "water",
    skyGradient: "linear-gradient(180deg, #082f49 0%, #0369a1 32%, #38bdf8 46%, #0284c7 47%, #0369a1 68%, #1e3a8a 88%, #0f172a 100%)",
    platformEnemy: "radial-gradient(ellipse at center, #e0f2fe 0%, #38bdf8 48%, #0284c7 75%, #1e3a8a 100%)",
    platformPlayer: "radial-gradient(ellipse at center, #e0f2fe 0%, #38bdf8 50%, #0284c7 78%, #1e3a8a 100%)"
  },
  {
    id: "cyber",
    name: "Cyber Distortion Void",
    theme: "cyber",
    skyGradient: "linear-gradient(180deg, #09090b 0%, #2e1065 34%, #581c87 46%, #7c3aed 47%, #6d28d9 68%, #4c1d95 88%, #1e1b4b 100%)",
    platformEnemy: "radial-gradient(ellipse at center, #f5d0fe 0%, #c084fc 48%, #7e22ce 75%, #3b0764 100%)",
    platformPlayer: "radial-gradient(ellipse at center, #f5d0fe 0%, #c084fc 50%, #7e22ce 78%, #3b0764 100%)"
  }
];

export function getTypeEffectiveness(moveType, defenderTypes) {
  let multiplier = 1;
  const chartRow = TYPE_CHART[moveType] || {};
  for (const defType of defenderTypes) {
    if (chartRow[defType] !== undefined) {
      multiplier *= chartRow[defType];
    }
  }
  return multiplier;
}

export function clonePokemonForBattle(template) {
  return {
    id: template.id,
    name: template.name,
    types: [...template.types],
    maxHp: template.hp,
    hp: template.hp,
    atk: template.atk,
    def: template.def,
    spd: template.spd,
    fainted: false,
    moves: template.moves.map(m => ({ ...m, cd: m.cd ?? 0 })),
    moveCooldowns: [0, 0, 0, 0],
    ult: { ...template.ult },
    ultCooldown: 0
  };
}

export function getFrontSpriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function getBackSpriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
}
