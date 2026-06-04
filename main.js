const STORAGE_KEY = "lane-shooter-best-score";
const LANE_COUNT = 2;
const SOUND_PREF_KEY = "lane-shooter-sound-on";
const SMALL_BOSS_WAVE_INTERVAL = 5;
const BIG_BOSS_WAVE_INTERVAL = 10;
const THREAT_BASE_HP = 5;
const PLAYER_Y_RATIO = 0.86;
const GRENADE_THROW_INTERVAL = 15;
const GRENADE_BASE_DAMAGE = 200;
const GRENADE_PICKUP_BONUS = 50;
const GRENADE_MAX_HP_RATIO = 0.2;
const ICE_SLOW_STEP = 0.1;
const ICE_SLOW_MAX = 0.5;
const ICE_SLOW_DURATION = 2.4;
const ENEMY_SIZE_SCALE = 0.75;
const ENEMY_SPEED_SCALE = 0.75;
const THREAT_PRESSURE_MULTIPLIER = 1.22;
const THREAT_HP_BLEND = 0.62;
const BOSS_HP_BLEND = 0.56;
const ENEMY_SPAWN_MARGIN = 0.08;
const BULLET_SPEED = 920;
const PLAYER_BULLET_COLOR = "#66e6ff";
const ALLY_BULLET_COLOR = "#9bffb3";
const ENEMY_TYPES = [
  { type: "grunt", hp: 2, speed: 100, color: "#7ee3b0", score: 14, label: "怪" },
  { type: "runner", hp: 1, speed: 146, color: "#ffd76a", score: 18, label: "快" },
  { type: "brute", hp: 4, speed: 76, color: "#ff7780", score: 28, label: "厚" },
];

const BOOST_TYPES = [
  { type: "gun", hp: 3, speed: 82, color: "#8efbb0", label: "枪", score: 36, weight: 4 },
  { type: "ally", hp: 4, speed: 74, color: "#ffc96d", label: "伴", score: 42, weight: 4 },
  { type: "grenade", hp: 4, speed: 70, color: "#ff8b4d", label: "雷", score: 48, weight: 2 },
];

const els = {
  canvas: document.getElementById("gameCanvas"),
  overlay: document.getElementById("gameOverlay"),
  overlayKicker: document.getElementById("overlayKicker"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayDesc: document.getElementById("overlayDesc"),
  reviveBtn: document.getElementById("reviveBtn"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  soundBtn: document.getElementById("soundBtn"),
  restartBtn: document.getElementById("restartBtn"),
  scoreValue: document.getElementById("scoreValue"),
  bestValue: document.getElementById("bestValue"),
  weaponValue: document.getElementById("weaponValue"),
  allyValue: document.getElementById("allyValue"),
  reviveValue: document.getElementById("reviveValue"),
  relicValue: document.getElementById("relicValue"),
  grenadeValue: document.getElementById("grenadeValue"),
  vineGrenadeValue: document.getElementById("vineGrenadeValue"),
  vineUseBtn: document.getElementById("vineUseBtn"),
  vineAdBtn: document.getElementById("vineAdBtn"),
  waveValue: document.getElementById("waveValue"),
  deathPanel: document.getElementById("deathPanel"),
  relicPanel: document.getElementById("relicPanel"),
  relicKicker: document.getElementById("relicKicker"),
  relicTitle: document.getElementById("relicTitle"),
  relicDesc: document.getElementById("relicDesc"),
  relicChoices: document.getElementById("relicChoices"),
  laneButtons: [...document.querySelectorAll(".lane-btn")],
};

const ctx = els.canvas.getContext("2d");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function weightedChoice(list) {
  const total = list.reduce((sum, item) => sum + Math.max(0, item.weight ?? 1), 0);
  if (total <= 0) return choice(list);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= Math.max(0, item.weight ?? 1);
    if (roll < 0) return item;
  }
  return list[list.length - 1];
}

function isBossWave(wave) {
  return getBossWaveTier(wave) !== null;
}

function getBossWaveTier(wave) {
  if (wave > 0 && wave % BIG_BOSS_WAVE_INTERVAL === 0) return "big";
  if (wave > 0 && wave % SMALL_BOSS_WAVE_INTERVAL === 0) return "small";
  return null;
}

const RARITY_META = {
  common: {
    label: "普通",
    accent: "#6ce08a",
    border: "rgba(108, 224, 138, 0.26)",
    glow: "rgba(108, 224, 138, 0.16)",
    text: "#215937",
  },
  uncommon: {
    label: "稀有",
    accent: "#b186ff",
    border: "rgba(177, 134, 255, 0.28)",
    glow: "rgba(177, 134, 255, 0.16)",
    text: "#59308a",
  },
  rare: {
    label: "史诗",
    accent: "#f0c34f",
    border: "rgba(240, 195, 79, 0.28)",
    glow: "rgba(240, 195, 79, 0.18)",
    text: "#8b5f00",
  },
  legendary: {
    label: "传说",
    accent: "#ff9b52",
    border: "rgba(255, 155, 82, 0.3)",
    glow: "rgba(255, 155, 82, 0.18)",
    text: "#974400",
  },
};

function getRarityMeta(rarity) {
  return RARITY_META[rarity] || RARITY_META.common;
}

const FAMILY_META = {
  player: {
    label: "主角流",
    accent: "#74bfff",
    text: "#275a8f",
  },
  speed: {
    label: "攻速流",
    accent: "#6ce08a",
    text: "#1f6d39",
  },
  ally: {
    label: "伙伴流",
    accent: "#ffc96d",
    text: "#8a5a00",
  },
  boom: {
    label: "爆破流",
    accent: "#ff9b52",
    text: "#9a4700",
  },
  economy: {
    label: "经济流",
    accent: "#b186ff",
    text: "#5d35a1",
  },
  pierce: {
    label: "穿透流",
    accent: "#7fd8ff",
    text: "#1c6d8e",
  },
  ice: {
    label: "控制流",
    accent: "#7bd6ff",
    text: "#1b6c8f",
  },
  generic: {
    label: "通用",
    accent: "#8ea6d7",
    text: "#42506d",
  },
};

function getFamilyMeta(family) {
  return FAMILY_META[family] || FAMILY_META.generic;
}

const RELIC_FAMILY_BONUSES = {
  player: [
    {
      count: 2,
      label: "主角流 2 件",
      apply() {
        state.damageBase += 1;
        syncCompanionDamage();
      },
    },
    {
      count: 4,
      label: "主角流 4 件",
      apply() {
        state.weaponDamageMult += 1;
      },
    },
  ],
  speed: [
    {
      count: 2,
      label: "攻速流 2 件",
      apply() {
        state.weaponInterval = Math.max(0.1, state.weaponInterval * 0.9);
      },
    },
    {
      count: 4,
      label: "攻速流 4 件",
      apply() {
        state.weaponInterval = Math.max(0.08, state.weaponInterval * 0.88);
      },
    },
  ],
  ally: [
    {
      count: 2,
      label: "伙伴流 2 件",
      apply() {
        state.allyDamageBase += 1;
        syncCompanionDamage();
      },
    },
    {
      count: 4,
      label: "伙伴流 4 件",
      apply() {
        state.allyDamageMult += 1;
        syncCompanionDamage();
      },
    },
  ],
  boom: [
    {
      count: 2,
      label: "爆破流 2 件",
      apply() {
        state.grenadeDamageBonus += 60;
      },
    },
    {
      count: 4,
      label: "爆破流 4 件",
      apply() {
        state.grenadeDamageBonus += 120;
      },
    },
  ],
  economy: [
    {
      count: 2,
      label: "经济流 2 件",
      apply() {
        state.scoreMult *= 1.1;
      },
    },
    {
      count: 4,
      label: "经济流 4 件",
      apply() {
        state.scoreMult *= 1.15;
      },
    },
  ],
  pierce: [
    {
      count: 2,
      label: "穿透流 2 件",
      apply() {
        state.bulletPierce += 1;
      },
    },
    {
      count: 4,
      label: "穿透流 4 件",
      apply() {
        state.bulletPierce += 1;
        state.damageBase += 1;
        syncCompanionDamage();
      },
    },
  ],
  ice: [],
};

function applyRelicFamilyBonus(family) {
  if (!family) return;
  const current = (state.relicFamilyCounts[family] || 0) + 1;
  state.relicFamilyCounts[family] = current;
  const milestones = RELIC_FAMILY_BONUSES[family] || [];
  for (const milestone of milestones) {
    if (milestone.count !== current) continue;
    milestone.apply();
    const meta = getFamilyMeta(family);
    toast(`${meta.label}激活：${milestone.label}`);
    floatingText(state.viewW * 0.5, state.viewH * 0.24, milestone.label, meta.accent);
  }
}

function buildRelicIconSvg(relicId, accent) {
  const uid = `${relicId}-${Math.random().toString(36).slice(2, 8)}`;
  const bgId = `bg-${uid}`;
  const haloId = `halo-${uid}`;
  const base = `
    <defs>
      <linearGradient id="${bgId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.98)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0.72)"/>
      </linearGradient>
      <radialGradient id="${haloId}" cx="35%" cy="28%" r="72%">
        <stop offset="0%" stop-color="${accent}"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
    </defs>
    <rect x="10" y="10" width="100" height="100" rx="28" fill="url(#${bgId})"/>
    <circle cx="60" cy="56" r="30" fill="url(#${haloId})" opacity="0.45"/>
    <path d="M28 82 C37 97, 83 97, 92 82" fill="none" stroke="rgba(255,255,255,0.78)" stroke-width="5" stroke-linecap="round"/>
  `;

  if (relicId === "power") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <path d="M60 19 L77 49 L60 46 L71 74 L43 58 L58 58 Z" fill="${accent}"/>
        <rect x="55" y="26" width="10" height="68" rx="5" fill="rgba(255,255,255,0.38)"/>
        <rect x="26" y="55" width="68" height="10" rx="5" fill="rgba(255,255,255,0.38)"/>
        <circle cx="60" cy="60" r="41" fill="none" stroke="${accent}" stroke-width="3.5" opacity="0.2"/>
      </svg>
    `;
  }

  if (relicId === "rapid") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <path d="M49 18 L30 61 H54 L43 101 L88 47 H64 L76 18 Z" fill="${accent}"/>
        <path d="M24 47 C16 42, 14 36, 16 30" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M20 63 C12 63, 8 59, 6 53" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M90 48 C99 48, 104 52, 108 58" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="78" cy="82" r="11" fill="rgba(255,255,255,0.6)" stroke="${accent}" stroke-width="4"/>
      </svg>
    `;
  }

  if (relicId === "stabilize") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <path d="M35 77 C35 58, 48 43, 60 43 C72 43, 85 58, 85 77" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
        <rect x="44" y="56" width="32" height="32" rx="12" fill="${accent}"/>
        <rect x="50" y="30" width="20" height="20" rx="8" fill="rgba(255,255,255,0.82)"/>
        <path d="M46 82 L38 95" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
        <path d="M74 82 L82 95" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "warmup") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="60" cy="62" r="24" fill="${accent}"/>
        <path d="M60 44 V64 L73 73" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M42 30 C48 23, 55 20, 60 20" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M78 30 C72 23, 65 20, 60 20" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "supply" || relicId === "supplyplus") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <rect x="34" y="32" width="52" height="54" rx="16" fill="${accent}"/>
        <path d="M42 45 H78" stroke="rgba(255,255,255,0.86)" stroke-width="6" stroke-linecap="round"/>
        <path d="M60 38 V76" stroke="rgba(255,255,255,0.9)" stroke-width="6" stroke-linecap="round"/>
        <rect x="47" y="16" width="26" height="20" rx="8" fill="rgba(255,255,255,0.86)"/>
        <path d="M50 56 H70" stroke="rgba(255,255,255,0.72)" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "bulwark") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <path d="M60 20 L87 30 V56 C87 75, 75 88, 60 98 C45 88, 33 75, 33 56 V30 Z" fill="${accent}"/>
        <path d="M60 34 V82" stroke="rgba(255,255,255,0.9)" stroke-width="7" stroke-linecap="round"/>
        <path d="M44 48 H76" stroke="rgba(255,255,255,0.9)" stroke-width="7" stroke-linecap="round"/>
        <path d="M46 72 C52 66, 68 66, 74 72" fill="none" stroke="rgba(255,255,255,0.76)" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "pierce") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="83" cy="39" r="12" fill="none" stroke="${accent}" stroke-width="5"/>
        <circle cx="45" cy="78" r="15" fill="none" stroke="${accent}" stroke-width="5" opacity="0.58"/>
        <path d="M24 92 L89 27" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
        <path d="M79 22 L95 38 L85 41 Z" fill="${accent}"/>
        <path d="M28 88 L38 98" stroke="rgba(255,255,255,0.72)" stroke-width="5" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "ice") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="60" cy="60" r="24" fill="rgba(123, 214, 255, 0.16)" stroke="${accent}" stroke-width="4"/>
        <path d="M60 22 V98 M22 60 H98 M35 35 L85 85 M85 35 L35 85" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="60" cy="60" r="8" fill="${accent}"/>
        <circle cx="60" cy="60" r="33" fill="none" stroke="rgba(255,255,255,0.58)" stroke-width="4"/>
      </svg>
    `;
  }

  if (relicId === "scope") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="60" cy="60" r="28" fill="none" stroke="${accent}" stroke-width="7"/>
        <circle cx="60" cy="60" r="10" fill="${accent}"/>
        <path d="M60 20 V36 M60 84 V100 M20 60 H36 M84 60 H100" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,0.52)" stroke-width="4"/>
      </svg>
    `;
  }

  if (relicId === "burst") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="60" cy="60" r="16" fill="${accent}"/>
        <path d="M60 22 L68 48 L94 60 L68 72 L60 98 L52 72 L26 60 L52 48 Z" fill="rgba(255,255,255,0.9)"/>
        <path d="M32 34 L44 46" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
        <path d="M88 34 L76 46" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
        <path d="M32 86 L44 74" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
        <path d="M88 86 L76 74" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "synergy") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="42" cy="54" r="14" fill="${accent}" opacity="0.95"/>
        <circle cx="78" cy="54" r="14" fill="${accent}" opacity="0.72"/>
        <circle cx="60" cy="78" r="14" fill="${accent}" opacity="0.86"/>
        <path d="M42 68 L60 78 L78 68" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M42 40 L60 28 L78 40" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  if (relicId === "ally") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="45" cy="45" r="14" fill="${accent}"/>
        <circle cx="76" cy="50" r="14" fill="${accent}" opacity="0.84"/>
        <path d="M24 92 C28 71, 62 71, 66 92" fill="rgba(255,255,255,0.76)"/>
        <path d="M54 92 C58 74, 94 74, 98 92" fill="rgba(255,255,255,0.76)"/>
        <circle cx="60" cy="68" r="7" fill="rgba(255,255,255,0.88)" stroke="${accent}" stroke-width="3"/>
        <path d="M33 31 C43 22, 50 22, 60 30" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M71 36 C80 29, 87 29, 95 36" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "firecontrol") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <rect x="38" y="26" width="44" height="68" rx="16" fill="${accent}"/>
        <path d="M48 37 H72 M48 51 H72 M48 65 H72" stroke="rgba(255,255,255,0.86)" stroke-width="6" stroke-linecap="round"/>
        <path d="M60 19 L68 31 H52 Z" fill="rgba(255,255,255,0.9)"/>
        <path d="M44 94 C50 84, 70 84, 76 94" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
      </svg>
    `;
  }

  if (relicId === "commander") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <path d="M42 28 L60 16 L78 28 L72 46 H48 Z" fill="${accent}"/>
        <circle cx="45" cy="67" r="13" fill="${accent}" opacity="0.9"/>
        <circle cx="75" cy="67" r="13" fill="${accent}" opacity="0.7"/>
        <path d="M30 90 C35 74, 50 69, 60 69 C70 69, 85 74, 90 90" fill="rgba(255,255,255,0.76)"/>
        <path d="M51 54 C56 49, 64 49, 69 54" fill="none" stroke="rgba(255,255,255,0.88)" stroke-width="5" stroke-linecap="round"/>
        <circle cx="60" cy="72" r="8" fill="rgba(255,255,255,0.88)" stroke="${accent}" stroke-width="3"/>
      </svg>
    `;
  }

  if (relicId === "boom") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <circle cx="60" cy="68" r="20" fill="${accent}"/>
        <rect x="55" y="33" width="10" height="12" rx="4" fill="${accent}"/>
        <path d="M61 31 L72 23" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M28 53 L17 46" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M92 53 L103 46" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M43 74 L31 90" stroke="rgba(255,255,255,0.75)" stroke-width="5" stroke-linecap="round"/>
        <path d="M77 74 L89 90" stroke="rgba(255,255,255,0.75)" stroke-width="5" stroke-linecap="round"/>
        <circle cx="53" cy="61" r="3.5" fill="rgba(255,255,255,0.95)"/>
        <circle cx="67" cy="60" r="3.5" fill="rgba(255,255,255,0.95)"/>
      </svg>
    `;
  }

  if (relicId === "fuel") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        ${base}
        <path d="M60 18 C72 34, 84 46, 84 64 C84 79, 72 90, 60 90 C48 90, 36 79, 36 64 C36 46, 48 34, 60 18 Z" fill="${accent}"/>
        <path d="M60 34 C66 44, 74 50, 74 61 C74 69, 68 76, 60 76 C52 76, 46 69, 46 61 C46 50, 54 44, 60 34 Z" fill="rgba(255,255,255,0.88)"/>
        <path d="M42 94 L78 94" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
      </svg>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      ${base}
      <circle cx="60" cy="60" r="24" fill="${accent}"/>
      <path d="M60 30 L66 52 L90 60 L66 68 L60 90 L54 68 L30 60 L54 52 Z" fill="rgba(255,255,255,0.9)"/>
    </svg>
  `;
}

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createSprite(svg) {
  const img = new Image();
  img.decoding = "async";
  img.src = svgDataUri(svg);
  return img;
}

function buildHumanSprite(body, accent, skin, gun, shadow) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150">
      <defs>
        <linearGradient id="stickBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="${body}"/>
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="132" rx="20" ry="6" fill="rgba(120, 143, 190, 0.16)"/>
      <circle cx="60" cy="42" r="15" fill="#ffffff" stroke="${accent}" stroke-width="3"/>
      <path d="M60 57 L60 98" fill="none" stroke="${body}" stroke-width="8" stroke-linecap="round"/>
      <path d="M60 69 L34 84" fill="none" stroke="${body}" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 69 L86 84" fill="none" stroke="${body}" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 98 L42 126" fill="none" stroke="${body}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M60 98 L78 126" fill="none" stroke="${body}" stroke-width="6.5" stroke-linecap="round"/>
      <circle cx="60" cy="42" r="6" fill="rgba(255,255,255,0.62)"/>
      <path d="M90 86 L106 92" fill="none" stroke="${gun}" stroke-width="6" stroke-linecap="round"/>
      <path d="M36 84 L22 88" fill="none" stroke="${gun}" stroke-width="5" stroke-linecap="round"/>
      <rect x="60" y="64" width="22" height="7" rx="3.5" fill="url(#stickBody)" transform="rotate(-8 60 64)"/>
      <rect x="84" y="83" width="16" height="6" rx="3" fill="${gun}"/>
      <path d="M35 84 L23 80" fill="none" stroke="${shadow}" stroke-width="2.4" stroke-linecap="round" opacity="0.18"/>
    </svg>
  `;
}

function buildRobotSprite() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150">
      <defs>
        <radialGradient id="body" cx="35%" cy="22%" r="82%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="20%" stop-color="#f5fcff"/>
          <stop offset="54%" stop-color="#cfeaff"/>
          <stop offset="100%" stop-color="#8bc2ff"/>
        </radialGradient>
        <radialGradient id="faceGlow" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
        <linearGradient id="arm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff8fd"/>
          <stop offset="100%" stop-color="#d7e8ff"/>
        </linearGradient>
        <linearGradient id="shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.28)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="124" rx="36" ry="12" fill="rgba(98, 129, 187, 0.14)"/>
      <ellipse cx="60" cy="72" rx="39" ry="43" fill="url(#body)"/>
      <ellipse cx="60" cy="70" rx="32" ry="35" fill="url(#faceGlow)"/>
      <rect x="52" y="17" width="16" height="22" rx="8" fill="#f4fbff"/>
      <circle cx="60" cy="18" r="9" fill="#fff3a8"/>
      <circle cx="60" cy="18" r="4" fill="#ffffff"/>
      <rect x="26" y="55" width="14" height="26" rx="7" fill="url(#arm)" transform="rotate(-14 26 55)"/>
      <rect x="80" y="55" width="14" height="26" rx="7" fill="url(#arm)" transform="rotate(14 80 55)"/>
      <rect x="29" y="80" width="14" height="10" rx="5" fill="#ffffff" opacity="0.7"/>
      <rect x="77" y="80" width="14" height="10" rx="5" fill="#ffffff" opacity="0.7"/>
      <circle cx="42" cy="66" r="11" fill="#3f4f72"/>
      <circle cx="78" cy="66" r="11" fill="#3f4f72"/>
      <circle cx="39" cy="61" r="4" fill="#ffffff"/>
      <circle cx="75" cy="61" r="4" fill="#ffffff"/>
      <circle cx="46" cy="71" r="2" fill="#76c7ff"/>
      <circle cx="82" cy="71" r="2" fill="#76c7ff"/>
      <path d="M47 83 C52 78, 68 78, 73 83" fill="none" stroke="#b94f67" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M35 56 C39 53, 43 51, 48 51" fill="none" stroke="#5d719c" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M72 51 C77 51, 81 53, 85 56" fill="none" stroke="#5d719c" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M36 63 C40 61, 44 61, 48 63" fill="none" stroke="#2c3756" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M72 63 C76 61, 80 61, 84 63" fill="none" stroke="#2c3756" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M42 87 C47 95, 53 100, 60 100 C67 100, 73 95, 78 87" fill="none" stroke="#fdfcff" stroke-width="8" stroke-linecap="round" opacity="0.78"/>
      <ellipse cx="60" cy="97" rx="20" ry="12" fill="rgba(255,255,255,0.22)"/>
      <circle cx="28" cy="40" r="3" fill="#ffffff" opacity="0.78"/>
      <circle cx="93" cy="44" r="3" fill="#ffffff" opacity="0.78"/>
      <circle cx="35" cy="96" r="2.5" fill="#ffffff" opacity="0.62"/>
      <circle cx="85" cy="98" r="2.5" fill="#ffffff" opacity="0.62"/>
    </svg>
  `;
}

function buildBossSprite() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 180">
      <defs>
        <radialGradient id="bossBody" cx="38%" cy="24%" r="78%">
          <stop offset="0%" stop-color="#fffef5"/>
          <stop offset="22%" stop-color="#fff0b6"/>
          <stop offset="64%" stop-color="#ffcb67"/>
          <stop offset="100%" stop-color="#e38d1f"/>
        </radialGradient>
        <radialGradient id="bossGlow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
        <linearGradient id="bossArm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff7d8"/>
          <stop offset="100%" stop-color="#f5b84d"/>
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="150" rx="42" ry="14" fill="rgba(98, 129, 187, 0.18)"/>
      <ellipse cx="70" cy="82" rx="47" ry="54" fill="url(#bossBody)"/>
      <ellipse cx="70" cy="78" rx="38" ry="42" fill="url(#bossGlow)"/>
      <path d="M34 33 L49 17 L62 34 L70 13 L79 34 L91 17 L106 33 L93 38 L47 38 Z" fill="#ffd55f" stroke="#fff7c3" stroke-width="4"/>
      <circle cx="34" cy="33" r="4.5" fill="#fff7c3"/>
      <circle cx="70" cy="13" r="4.5" fill="#fff7c3"/>
      <circle cx="106" cy="33" r="4.5" fill="#fff7c3"/>
      <rect x="58" y="20" width="24" height="16" rx="8" fill="#fff8df"/>
      <rect x="30" y="58" width="16" height="32" rx="8" fill="url(#bossArm)" transform="rotate(-15 30 58)"/>
      <rect x="94" y="58" width="16" height="32" rx="8" fill="url(#bossArm)" transform="rotate(15 94 58)"/>
      <rect x="35" y="92" width="16" height="12" rx="6" fill="#fff8df" opacity="0.8"/>
      <rect x="89" y="92" width="16" height="12" rx="6" fill="#fff8df" opacity="0.8"/>
      <circle cx="50" cy="72" r="13" fill="#28344f"/>
      <circle cx="90" cy="72" r="13" fill="#28344f"/>
      <circle cx="46" cy="67" r="4.2" fill="#ffffff"/>
      <circle cx="86" cy="67" r="4.2" fill="#ffffff"/>
      <circle cx="54" cy="77" r="2.4" fill="#84d5ff"/>
      <circle cx="94" cy="77" r="2.4" fill="#84d5ff"/>
      <path d="M47 90 C54 84, 76 84, 83 90" fill="none" stroke="#7b4250" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M41 56 C45 52, 50 49, 56 49" fill="none" stroke="#8a5c13" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M84 49 C90 49, 95 52, 99 56" fill="none" stroke="#8a5c13" stroke-width="4.5" stroke-linecap="round"/>
      <rect x="43" y="100" width="54" height="18" rx="9" fill="rgba(255,255,255,0.4)"/>
      <circle cx="29" cy="48" r="3" fill="#ffffff" opacity="0.75"/>
      <circle cx="111" cy="50" r="3" fill="#ffffff" opacity="0.75"/>
    </svg>
  `;
}

function buildBoostSprite(type, color) {
  const icon = type === "gun"
    ? `
      <rect x="32" y="79" width="52" height="14" rx="7" fill="#2f3f60"/>
      <rect x="74" y="71" width="24" height="10" rx="5" fill="#2f3f60"/>
      <rect x="49" y="90" width="14" height="22" rx="6" fill="#2f3f60"/>
      <rect x="40" y="84" width="46" height="5" rx="2.5" fill="rgba(255,255,255,0.36)"/>
      <circle cx="43" cy="85" r="3" fill="#ffd7e8"/>
      <circle cx="82" cy="76" r="2.5" fill="#ffffff"/>
      <path d="M39 84 C42 81, 48 80, 53 83" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2.2" stroke-linecap="round"/>
    `
    : type === "grenade"
      ? `
        <circle cx="60" cy="86" r="18" fill="#2f3f60"/>
        <circle cx="60" cy="84" r="12" fill="#ffcf71"/>
        <rect x="55" y="49" width="10" height="11" rx="4" fill="#ffcf71"/>
        <path d="M60 48 L69 41" fill="none" stroke="#ffd989" stroke-width="3.2" stroke-linecap="round"/>
        <circle cx="55" cy="81" r="2.2" fill="#ffffff"/>
        <circle cx="66" cy="80" r="2.2" fill="#ffffff"/>
        <path d="M53 90 C57 94, 63 94, 67 90" fill="none" stroke="#d87a4d" stroke-width="3" stroke-linecap="round"/>
      `
      : `
        <ellipse cx="60" cy="77" rx="17" ry="15" fill="#2f3f60"/>
        <rect x="48" y="82" width="24" height="19" rx="9.5" fill="#2f3f60"/>
        <rect x="51" y="92" width="8" height="17" rx="4" fill="#2f3f60"/>
        <rect x="61" y="92" width="8" height="17" rx="4" fill="#2f3f60"/>
        <path d="M44 79 C39 75, 38 70, 40 66" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        <path d="M76 79 C81 75, 82 70, 80 66" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
        <circle cx="52" cy="73" r="2.2" fill="#ffffff"/>
        <circle cx="68" cy="73" r="2.2" fill="#ffffff"/>
        <path d="M51 82 C55 80, 65 80, 69 82" fill="none" stroke="#4d5b84" stroke-width="3" stroke-linecap="round"/>
      `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180">
      <defs>
        <linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.96)"/>
          <stop offset="22%" stop-color="${color}"/>
          <stop offset="58%" stop-color="rgba(255,255,255,0.9)"/>
          <stop offset="100%" stop-color="${color}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="24%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.62)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect x="14" y="16" width="92" height="148" rx="30" fill="rgba(255,255,255,0.16)"/>
      <rect x="19" y="22" width="82" height="136" rx="26" fill="url(#frame)"/>
      <rect x="27" y="31" width="12" height="118" rx="6" fill="rgba(255,255,255,0.22)"/>
      <rect x="55" y="31" width="10" height="118" rx="5" fill="rgba(255,255,255,0.14)"/>
      <rect x="81" y="31" width="12" height="118" rx="6" fill="rgba(255,255,255,0.22)"/>
      <rect x="28" y="50" width="64" height="74" rx="22" fill="rgba(255,255,255,0.34)"/>
      <ellipse cx="60" cy="67" rx="28" ry="20" fill="url(#glow)"/>
      ${icon}
    </svg>
  `;
}

const SPRITES = {
  player: createSprite(buildHumanSprite("#ffd0dc", "#ff9fc1", "#fff0f4", "#8fc6ff", "#c58ea8")),
  ally: createSprite(buildHumanSprite("#d8ecff", "#a9c8ff", "#f4fbff", "#93d6ff", "#8ca6d8")),
  enemy: createSprite(buildRobotSprite()),
  boss: createSprite(buildBossSprite()),
  bullet: createSprite(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 48">
      <defs>
        <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#66e6ff"/>
          <stop offset="100%" stop-color="#1e6c8b"/>
        </linearGradient>
      </defs>
      <rect x="7" y="2" width="10" height="36" rx="5" fill="url(#b)"/>
      <rect x="9" y="7" width="6" height="20" rx="3" fill="rgba(255,255,255,0.46)"/>
    </svg>
  `),
  boost: {
    gun: createSprite(buildBoostSprite("gun", "#8efbb0")),
    ally: createSprite(buildBoostSprite("ally", "#ffc96d")),
    grenade: createSprite(buildBoostSprite("grenade", "#ff8b4d")),
  },
};

function waitForSprite(img) {
  if (!img) return Promise.resolve();
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

function loadSprites() {
  const images = [
    SPRITES.player,
    SPRITES.ally,
    SPRITES.enemy,
    SPRITES.boss,
    SPRITES.bullet,
    SPRITES.boost.gun,
    SPRITES.boost.ally,
    SPRITES.boost.grenade,
  ];
  return Promise.all(images.map(waitForSprite));
}

function drawSpriteImage(img, x, y, width, height, facing = 1) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
}

function laneCenter(lane, width) {
  const laneWidth = width / LANE_COUNT;
  return laneWidth * (lane + 0.5);
}

function laneFromX(x, width) {
  const laneWidth = width / LANE_COUNT;
  return clamp(Math.floor(x / laneWidth), 0, LANE_COUNT - 1);
}

function formatScore(value) {
  return String(Math.max(0, Math.floor(value)));
}

function saveBestScore(score) {
  if (score > state.bestScore) {
    state.bestScore = score;
    localStorage.setItem(STORAGE_KEY, String(score));
  }
}

function nowMs() {
  return performance.now();
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const BGM_PATTERNS = {
  normal: [
    { bass: 36, chord: [60, 64, 67, 71, 74], lead: 76, drum: "kick" },
    { bass: 43, chord: [59, 62, 67, 71, 74], lead: 79, drum: "hat" },
    { bass: 45, chord: [57, 60, 64, 67, 72], lead: 81, drum: "hat" },
    { bass: 41, chord: [53, 57, 60, 64, 69], lead: 79, drum: "snare" },
    { bass: 36, chord: [60, 64, 67, 71, 74], lead: 81, drum: "kick" },
    { bass: 43, chord: [59, 62, 67, 71, 74], lead: 84, drum: "hat" },
    { bass: 45, chord: [57, 60, 64, 67, 72], lead: 81, drum: "hat" },
    { bass: 41, chord: [53, 57, 60, 64, 69], lead: 79, drum: "snare" },
    { bass: 38, chord: [60, 64, 67, 71, 74], lead: 83, drum: "kick" },
    { bass: 43, chord: [59, 62, 67, 71, 74], lead: 81, drum: "hat" },
    { bass: 45, chord: [57, 60, 64, 67, 72], lead: 79, drum: "hat" },
    { bass: 41, chord: [53, 57, 60, 64, 69], lead: 76, drum: "snare" },
    { bass: 36, chord: [60, 64, 67, 71, 74], lead: 79, drum: "kick" },
    { bass: 43, chord: [59, 62, 67, 71, 74], lead: 81, drum: "hat" },
    { bass: 45, chord: [57, 60, 64, 67, 72], lead: 83, drum: "hat" },
    { bass: 38, chord: [53, 57, 60, 64, 69], lead: 81, drum: "snare" },
  ],
  boss: [
    { bass: 34, chord: [58, 62, 65, 69, 74], lead: 74, drum: "kick" },
    { bass: 41, chord: [57, 60, 64, 67, 71], lead: 77, drum: "hat" },
    { bass: 36, chord: [55, 59, 62, 67, 71], lead: 79, drum: "hat" },
    { bass: 38, chord: [53, 57, 60, 64, 69], lead: 81, drum: "snare" },
    { bass: 34, chord: [58, 62, 65, 69, 74], lead: 79, drum: "kick" },
    { bass: 41, chord: [57, 60, 64, 67, 71], lead: 84, drum: "hat" },
    { bass: 36, chord: [55, 59, 62, 67, 71], lead: 86, drum: "hat" },
    { bass: 38, chord: [53, 57, 60, 64, 69], lead: 84, drum: "snare" },
    { bass: 34, chord: [58, 62, 65, 69, 74], lead: 81, drum: "kick" },
    { bass: 41, chord: [57, 60, 64, 67, 71], lead: 79, drum: "hat" },
    { bass: 36, chord: [55, 59, 62, 67, 71], lead: 84, drum: "hat" },
    { bass: 38, chord: [53, 57, 60, 64, 69], lead: 86, drum: "snare" },
    { bass: 34, chord: [58, 62, 65, 69, 74], lead: 88, drum: "kick" },
    { bass: 41, chord: [57, 60, 64, 67, 71], lead: 86, drum: "hat" },
    { bass: 36, chord: [55, 59, 62, 67, 71], lead: 84, drum: "hat" },
    { bass: 38, chord: [53, 57, 60, 64, 69], lead: 81, drum: "snare" },
  ],
};

const BGM_STEP_INTERVAL = {
  normal: 198,
  boss: 198,
};

class AudioEngine {
  constructor() {
    this.enabled = true;
    this.effectsEnabled = false;
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.noiseBuffer = null;
    this.timer = null;
    this.step = 0;
    this.started = false;
  }

  ensureContext() {
    if (this.ctx) return true;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return false;
    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.12;
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 1.4;
    this.musicBus.connect(this.master);
    return true;
  }

  ensureNoiseBuffer() {
    if (!this.ensureContext()) return null;
    if (!this.noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  async resume() {
    if (!this.enabled) return;
    if (!this.ensureContext()) return;
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        return;
      }
    }
    if (!this.started) {
      this.started = true;
      this.playLoop();
    }
  }

  playTone(freq, duration, type = "sine", gainValue = 0.12, output = null) {
    if (!this.enabled || !this.ensureContext()) return;
    if (!output && !this.effectsEnabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(output || this.master);

    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  playPiano(freq, duration = 0.24, output = null, gainValue = 0.08) {
    if (!this.enabled || !this.ensureContext()) return;
    if (!output && !this.effectsEnabled) return;

    const body = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    body.type = "triangle";
    body.frequency.value = freq;

    overtone.type = "sine";
    overtone.frequency.value = freq * 2;
    overtone.detune.value = -4;

    filter.type = "lowpass";
    filter.frequency.value = 4800;
    filter.Q.value = 0.65;

    body.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(output || this.master);

    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(gainValue * 0.5, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    body.start(t);
    overtone.start(t);
    body.stop(t + duration + 0.03);
    overtone.stop(t + duration + 0.03);
  }

  playNoiseHit(duration, gainValue, cutoff, output = null) {
    const buffer = this.ensureNoiseBuffer();
    if (!buffer || !this.enabled) return;
    if (!output && !this.effectsEnabled) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    gain.gain.value = gainValue;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output || this.master);

    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.start(t);
    source.stop(t + duration + 0.02);
  }

  playKick(output = null) {
    if (!this.enabled || !this.ensureContext()) return;
    if (!output && !this.effectsEnabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(52, this.ctx.currentTime + 0.09);
    gain.gain.value = 0.18;
    osc.connect(gain);
    gain.connect(output || this.master);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playSnare(output = null) {
    this.playNoiseHit(0.12, 0.09, 1200, output);
    this.playTone(220, 0.045, "triangle", 0.035, output || this.master);
  }

  playHat(output = null) {
    this.playNoiseHit(0.04, 0.03, 7000, output);
  }

  playBossDrums() {
    const beat = this.step % 4;

    this.playHat(this.musicBus);

    if (beat === 0) {
      this.playKick(this.musicBus);
      setTimeout(() => this.playSnare(this.musicBus), 58);
    } else if (beat === 1) {
      this.playSnare(this.musicBus);
    } else if (beat === 2) {
      this.playKick(this.musicBus);
      setTimeout(() => this.playHat(this.musicBus), 42);
    } else {
      this.playSnare(this.musicBus);
      setTimeout(() => this.playKick(this.musicBus), 64);
    }
  }

  playLoop() {
    if (!this.enabled || !this.ensureContext()) return;
    const pattern = state.bossWave ? BGM_PATTERNS.boss : BGM_PATTERNS.normal;
    const cell = pattern[this.step % pattern.length];
    const isDownbeat = this.step % 4 === 0;

    if (cell.bass != null) {
      this.playTone(midiToFreq(cell.bass), isDownbeat ? 0.2 : 0.16, "sine", 0.08, this.musicBus);
    }

    if (cell.chord) {
      cell.chord.forEach((note, index) => {
        setTimeout(() => {
          this.playPiano(midiToFreq(note), 0.26 + index * 0.01, this.musicBus, index === 0 ? 0.075 : 0.055);
        }, index * 34);
      });
    }

    if (cell.lead != null) {
      this.playPiano(midiToFreq(cell.lead), 0.18, this.musicBus, 0.045);
      setTimeout(() => this.playPiano(midiToFreq(cell.lead + 12), 0.12, this.musicBus, 0.03), 20);
    }

    if (state.bossWave) {
      this.playBossDrums();
    } else {
      if (cell.drum === "kick") {
        this.playKick(this.musicBus);
      } else if (cell.drum === "snare") {
        this.playSnare(this.musicBus);
      } else if (cell.drum === "hat") {
        this.playHat(this.musicBus);
      }

      if (this.step % 2 === 1) {
        this.playHat(this.musicBus);
      }
      if (this.step % 4 === 0) {
        this.playKick(this.musicBus);
      }
      if (this.step % 4 === 2) {
        this.playSnare(this.musicBus);
      }
    }

    this.step += 1;
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => this.playLoop(),
      state.bossWave ? BGM_STEP_INTERVAL.boss : BGM_STEP_INTERVAL.normal,
    );
  }

  stop() {
    clearTimeout(this.timer);
    this.timer = null;
    this.started = false;
    this.step = 0;
  }

  stopBgm() {
    this.stop();
  }

  hit() {
    if (!this.enabled || !this.effectsEnabled) return;
    this.playTone(180, 0.06, "square", 0.04);
    this.playTone(380, 0.08, "triangle", 0.05);
  }

  shoot() {
    if (!this.enabled || !this.effectsEnabled) return;
    this.playTone(880, 0.05, "triangle", 0.06);
  }

  boost() {
    if (!this.enabled || !this.effectsEnabled) return;
    this.playTone(660, 0.1, "sine", 0.08);
    setTimeout(() => this.playTone(990, 0.11, "triangle", 0.08), 70);
  }

  blast() {
    if (!this.enabled || !this.effectsEnabled) return;
    this.playTone(132, 0.12, "sawtooth", 0.08);
    setTimeout(() => this.playTone(88, 0.18, "triangle", 0.07), 65);
  }

  ally() {
    if (!this.enabled || !this.effectsEnabled) return;
    this.playTone(500, 0.09, "sawtooth", 0.06);
    setTimeout(() => this.playTone(740, 0.1, "triangle", 0.06), 60);
  }

  revive() {
    if (!this.enabled || !this.effectsEnabled) return;
    this.playTone(294, 0.08, "sine", 0.06);
    setTimeout(() => this.playTone(440, 0.1, "sine", 0.06), 90);
    setTimeout(() => this.playTone(587, 0.12, "triangle", 0.06), 170);
  }

  death() {
    if (!this.enabled || !this.effectsEnabled) return;
    this.playTone(144, 0.16, "sawtooth", 0.08);
    setTimeout(() => this.playTone(110, 0.18, "sawtooth", 0.08), 120);
  }
}

const state = {
  bestScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
  score: 0,
  wave: 1,
  totalKills: 0,
  weaponLevel: 1,
  damageBase: 1,
  weaponDamageMult: 1,
  weaponInterval: 0.28,
  allyCount: 0,
  allyDamageBase: 1,
  reviveCount: 3,
  reviveUsed: false,
  relics: [],
  relicChoiceActive: false,
  relicChoices: [],
  pendingWave: 1,
  waveTimer: 16,
  waveDuration: 16,
  allyDamageMult: 1,
  bulletPierce: 0,
  bulletSlowReduction: 0,
  scoreMult: 1,
  grenadeUnlocked: false,
  grenadeBaseDamage: 0,
  grenadeDamageBonus: 0,
  grenadeTimer: GRENADE_THROW_INTERVAL,
  grenadeInterval: GRENADE_THROW_INTERVAL,
  vineGrenadeCharges: 1,
  vineGrenadeMax: 3,
  vineAdBusy: false,
  vineFreezeUntil: 0,
  vineAdSeq: 0,
  gameOver: false,
  gameStarted: false,
  bossWave: false,
  bossTier: null,
  bossSpawned: false,
  bossAlive: false,
  enemyCap: 2,
  threatHpMultiplier: 1,
  relicBossTier: null,
  relicFamilyCounts: {},
  soundOn: true,
  viewW: 0,
  viewH: 0,
  fieldTop: 0,
  fieldBottom: 0,
  fieldLeft: 0,
  fieldRight: 0,
  playerLane: 1,
  focusLane: 1,
  manualLane: 1,
  playerX: 0,
  playerY: 0,
  fireCooldown: 0,
  spawnPause: 0,
  enemyTimers: [0.2, 0.55, 0.35],
  boostTimer: 1.8,
  entities: [],
  bullets: [],
  particles: [],
  texts: [],
  allies: [],
  cameraJolt: 0,
  flash: 0,
  flashColor: "rgba(255,255,255,1)",
  time: 0,
  lastFrame: nowMs(),
  audio: new AudioEngine(),
};

function getPlayerDamage() {
  return Math.max(1, Math.round(state.damageBase * state.weaponDamageMult));
}

function getCompanionDamage() {
  return Math.max(1, Math.round(state.allyDamageBase * state.allyDamageMult));
}

function getBulletSlowReduction() {
  return clamp(state.bulletSlowReduction, 0, ICE_SLOW_MAX);
}

function getGrenadeBaseDamage() {
  if (!state.grenadeUnlocked) return 0;
  return Math.max(1, Math.round(state.grenadeBaseDamage + state.grenadeDamageBonus));
}

function getGrenadeBonusDamage(entity) {
  if (!state.grenadeUnlocked || !entity || entity.kind !== "enemy") return 0;
  return Math.max(1, Math.round(entity.maxHp * GRENADE_MAX_HP_RATIO));
}

function getGrenadeDamage(entity) {
  if (!state.grenadeUnlocked) return 0;
  return getGrenadeBaseDamage() + getGrenadeBonusDamage(entity);
}

function syncCompanionDamage() {
  const damage = getCompanionDamage();
  for (const ally of state.allies) {
    ally.damage = damage;
  }
}

function setOverlay(hidden) {
  els.overlay.hidden = hidden;
  if (hidden) {
    if (els.deathPanel) els.deathPanel.hidden = true;
    if (els.relicPanel) els.relicPanel.hidden = true;
  }
}

function getWaveDuration(wave) {
  const base = Math.max(11, 16 - (wave - 1) * 0.45);
  const bossTier = getBossWaveTier(wave);
  if (bossTier === "big") return base + 6;
  if (bossTier === "small") return base + 4;
  return base;
}

const RELIC_POOL = [
  {
    id: "power",
    name: "火力强化",
    desc: "子弹伤害永久 +1。",
    rarity: "common",
    family: "player",
    accent: getRarityMeta("common").accent,
    apply() {
      state.damageBase += 1;
      syncCompanionDamage();
    },
  },
  {
    id: "rapid",
    name: "迅捷扳机",
    desc: "射击间隔减少 15%。",
    rarity: "common",
    family: "speed",
    accent: getRarityMeta("common").accent,
    apply() {
      state.weaponInterval = Math.max(0.12, state.weaponInterval * 0.85);
    },
  },
  {
    id: "stabilize",
    name: "稳定握把",
    desc: "射击间隔永久 -8%。",
    rarity: "common",
    family: "speed",
    accent: getRarityMeta("common").accent,
    apply() {
      state.weaponInterval = Math.max(0.12, state.weaponInterval * 0.92);
    },
  },
  {
    id: "warmup",
    name: "热膛预热",
    desc: "射击间隔永久 -6%。",
    rarity: "common",
    family: "speed",
    accent: getRarityMeta("common").accent,
    apply() {
      state.weaponInterval = Math.max(0.12, state.weaponInterval * 0.94);
    },
  },
  {
    id: "supply",
    name: "补给袋",
    desc: "基础伤害永久 +1。",
    rarity: "uncommon",
    family: "player",
    accent: getRarityMeta("uncommon").accent,
    apply() {
      state.damageBase += 1;
      syncCompanionDamage();
    },
  },
  {
    id: "bulwark",
    name: "战地护板",
    desc: "所有得分永久提升 10%。",
    rarity: "uncommon",
    family: "economy",
    accent: getRarityMeta("uncommon").accent,
    apply() {
      state.scoreMult *= 1.1;
    },
  },
  {
    id: "pierce",
    name: "穿透弹",
    desc: "子弹可穿透 1 个目标。",
    rarity: "rare",
    family: "pierce",
    accent: getRarityMeta("rare").accent,
    apply() {
      state.bulletPierce += 1;
    },
  },
  {
    id: "ice",
    name: "寒冰子弹",
    desc: "子弹命中后初始附带 20% 减速，最多叠到 50%。",
    rarity: "rare",
    family: "ice",
    accent: getRarityMeta("rare").accent,
    apply() {
      state.bulletSlowReduction =
        state.bulletSlowReduction <= 0
          ? 0.2
          : Math.min(ICE_SLOW_MAX, state.bulletSlowReduction + ICE_SLOW_STEP);
    },
  },
  {
    id: "ally",
    name: "同伴训练",
    desc: "同伴伤害永久 +1。",
    rarity: "rare",
    family: "ally",
    accent: getRarityMeta("rare").accent,
    apply() {
      state.allyDamageBase += 1;
      syncCompanionDamage();
    },
  },
  {
    id: "scope",
    name: "狙击镜",
    desc: "主角倍率永久 +1。",
    rarity: "rare",
    family: "player",
    accent: getRarityMeta("rare").accent,
    apply() {
      state.weaponDamageMult += 1;
    },
  },
  {
    id: "burst",
    name: "爆破穿甲",
    desc: "基础伤害 +1，子弹可再穿透 1 个目标。",
    rarity: "rare",
    family: "pierce",
    accent: getRarityMeta("rare").accent,
    apply() {
      state.damageBase += 1;
      state.bulletPierce += 1;
      syncCompanionDamage();
    },
  },
  {
    id: "synergy",
    name: "军团协同",
    desc: "同伴基础伤害 +1，伙伴倍率 +1。",
    rarity: "rare",
    family: "ally",
    accent: getRarityMeta("rare").accent,
    apply() {
      state.allyDamageBase += 1;
      state.allyDamageMult += 1;
      syncCompanionDamage();
    },
  },
  {
    id: "boom",
    name: "爆裂药盒",
    desc: "手雷伤害永久 +60。",
    rarity: "legendary",
    family: "boom",
    accent: getRarityMeta("legendary").accent,
    apply() {
      state.grenadeDamageBonus += 60;
    },
  },
  {
    id: "firecontrol",
    name: "终端火控",
    desc: "主角基础伤害 +1，主角倍率 +1。",
    rarity: "legendary",
    family: "player",
    accent: getRarityMeta("legendary").accent,
    apply() {
      state.damageBase += 1;
      state.weaponDamageMult += 1;
      syncCompanionDamage();
    },
  },
  {
    id: "commander",
    name: "战场指挥",
    desc: "基础伤害 +1，伙伴伤害 +1。",
    rarity: "legendary",
    family: "ally",
    accent: getRarityMeta("legendary").accent,
    apply() {
      state.damageBase += 1;
      state.allyDamageBase += 1;
      syncCompanionDamage();
    },
  },
  {
    id: "fuel",
    name: "爆燃弹链",
    desc: "手雷伤害永久 +120。",
    rarity: "legendary",
    family: "boom",
    accent: getRarityMeta("legendary").accent,
    apply() {
      state.grenadeDamageBonus += 120;
    },
  },
  {
    id: "fortune",
    name: "战利品加成",
    desc: "所有得分永久提升 20%。",
    rarity: "uncommon",
    family: "economy",
    accent: getRarityMeta("uncommon").accent,
    apply() {
      state.scoreMult *= 1.2;
    },
  },
];

function getRelicWeight(relic, bossWave = false) {
  const rarityWeights = {
    common: 6.5,
    uncommon: 3.2,
    rare: 1.1,
    legendary: 0.3,
  };
  const bossWeights = {
    common: 0.55,
    uncommon: 1,
    rare: 2.8,
    legendary: 6.5,
  };
  const rarity = relic.rarity || "common";
  const base = rarityWeights[rarity] ?? 1;
  const bossBoost = bossWave ? (bossWeights[rarity] ?? 1) : 1;
  return Math.max(0.1, base * bossBoost);
}

function pickWeightedRelic(pool, bossWave = false) {
  const total = pool.reduce((sum, relic) => sum + getRelicWeight(relic, bossWave), 0);
  if (total <= 0) return choice(pool);
  let roll = Math.random() * total;
  for (let index = 0; index < pool.length; index += 1) {
    roll -= getRelicWeight(pool[index], bossWave);
    if (roll < 0) {
      return pool.splice(index, 1)[0];
    }
  }
  return pool.pop();
}

function sampleRelicChoices(count = 3, bossWave = false) {
  const pool = [...RELIC_POOL];
  const result = [];

  if (bossWave) {
    const premiumPool = pool.filter((relic) => relic.rarity === "legendary" || relic.rarity === "rare");
    if (premiumPool.length) {
      const premiumPick = choice(premiumPool);
      result.push(premiumPick);
      const premiumIndex = pool.indexOf(premiumPick);
      if (premiumIndex >= 0) {
        pool.splice(premiumIndex, 1);
      }
    }
  }

  while (pool.length && result.length < count) {
    result.push(pickWeightedRelic(pool, bossWave));
  }

  while (result.length < count) {
    result.push(choice(RELIC_POOL));
  }

  return result;
}

function renderRelicChoices() {
  els.relicChoices.innerHTML = "";
  state.relicChoices.forEach((relic, index) => {
    const rarity = getRarityMeta(relic.rarity);
    const family = getFamilyMeta(relic.family);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "relic-card";
    button.dataset.relicIndex = String(index);
    button.dataset.rarity = relic.rarity || "common";
    button.dataset.family = relic.family || "generic";
    button.style.setProperty("--relic-accent", rarity.accent);
    button.style.setProperty("--relic-border", rarity.border);
    button.style.setProperty("--relic-glow", rarity.glow);
    button.style.setProperty("--relic-rarity-text", rarity.text);
    button.style.setProperty("--relic-family-accent", family.accent);
    button.style.setProperty("--relic-family-text", family.text);
    button.innerHTML = `
      <span class="relic-icon">${buildRelicIconSvg(relic.id, rarity.accent)}</span>
      <span class="relic-meta">
        <span class="relic-index">遗物 ${index + 1}</span>
        <span class="relic-badges">
          <span class="relic-rarity">${rarity.label}</span>
          <span class="relic-family">${family.label}</span>
        </span>
      </span>
      <strong class="relic-name">${relic.name}</strong>
      <span class="relic-desc">${relic.desc}</span>
    `;
    button.addEventListener("click", () => selectRelic(index));
    els.relicChoices.appendChild(button);
  });
}

function showDeathOverlay(reason) {
  setOverlay(false);
  els.deathPanel.hidden = false;
  els.relicPanel.hidden = true;
  els.overlayKicker.textContent = "本局结束";
  els.overlayTitle.textContent = "防线被突破了";
  els.overlayDesc.textContent = reason;
  els.reviveBtn.hidden = state.reviveCount <= 0;
  els.playAgainBtn.textContent = "再来一局";
}

function showRelicOverlay() {
  setOverlay(false);
  els.deathPanel.hidden = true;
  els.relicPanel.hidden = false;
  const bossTier = state.relicBossTier;
  const bossLabel = bossTier === "big" ? "大 Boss" : bossTier === "small" ? "小 Boss" : "";
  els.relicKicker.textContent = bossTier ? `${bossLabel} 奖励` : "遗物选择";
  els.relicTitle.textContent = bossTier
    ? `第 ${state.wave} 波${bossLabel}结束，抽取更稀有的遗物`
    : `第 ${state.wave} 波结束，选择一个遗物`;
  els.relicDesc.textContent = bossTier
    ? `${bossLabel} 波的掉落更偏向稀有遗物，选一个永久生效，下一波继续增强。`
    : "每波结束后会抽取 3 个遗物，选择其中 1 个永久生效，下一波难度会继续提升。";
  renderRelicChoices();
}

function startRelicChoice() {
  state.relicChoiceActive = true;
  state.relicBossTier = getBossWaveTier(state.wave);
  state.pendingWave = state.wave + 1;
  state.relicChoices = sampleRelicChoices(3, state.relicBossTier !== null);
  showRelicOverlay();
  if (state.relicBossTier === "big") {
    toast("大 Boss 波结束，掉落更稀有的遗物。");
  } else if (state.relicBossTier === "small") {
    toast("小 Boss 波结束，掉落更稀有的遗物。");
  } else {
    toast(`第 ${state.wave} 波结束，选一个遗物。`);
  }
  updateHud();
}

function selectRelic(index) {
  if (!state.relicChoiceActive) return;
  const relic = state.relicChoices[index];
  if (!relic) return;
  relic.apply();
  state.relics.push(relic.id);
  applyRelicFamilyBonus(relic.family);
  state.relicChoiceActive = false;
  state.relicBossTier = null;
  state.wave = state.pendingWave;
  state.waveTimer = getWaveDuration(state.wave);
  state.waveDuration = state.waveTimer;
  configureWaveState();
  state.spawnPause = 0.7;
  setOverlay(true);
  state.audio.boost();
  floatingText(state.viewW * 0.5, state.viewH * 0.28, relic.name, relic.accent);
  toast(`获得遗物：${relic.name}`);
  updateHud();
}

function setButtonsActive() {
  els.laneButtons.forEach((btn) => {
    const lane = Number(btn.dataset.lane);
    btn.classList.toggle("active", lane === state.focusLane);
  });
}

function updateHud() {
  els.scoreValue.textContent = formatScore(state.score);
  els.bestValue.textContent = formatScore(state.bestScore);
  els.weaponValue.textContent = `Lv.${state.weaponLevel}`;
  els.allyValue.textContent = formatScore(state.allyCount);
  els.reviveValue.textContent = formatScore(state.reviveCount);
  els.relicValue.textContent = formatScore(state.relics.length);
  els.grenadeValue.textContent = state.grenadeUnlocked
    ? `${formatScore(getGrenadeBaseDamage())} / ${Math.max(0, state.grenadeTimer).toFixed(1)}s`
    : "未解锁";
  updateVineHudState();
  els.waveValue.textContent = state.bossTier === "big"
    ? `${state.wave}·大`
    : state.bossTier === "small"
      ? `${state.wave}·小`
      : `${state.wave}`;
  setButtonsActive();
}

function toast(message) {
  state.texts.push({
    text: message,
    x: state.viewW * 0.5,
    y: state.viewH * 0.18,
    life: 1.4,
    color: "#ffffff",
    scale: 1,
  });
}

function resizeCanvas() {
  const rect = els.canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  els.canvas.width = Math.round(rect.width * dpr);
  els.canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  state.viewW = rect.width;
  state.viewH = rect.height;
  state.fieldTop = state.viewH * 0.07;
  state.fieldBottom = state.viewH * 0.92;
  state.fieldLeft = state.viewW * 0.06;
  state.fieldRight = state.viewW * 0.94;
  state.playerY = state.viewH * PLAYER_Y_RATIO;
  state.playerX = laneCenter(state.focusLane, state.viewW);
}

function spawnEnemy(lane) {
  const spec = choice(ENEMY_TYPES);
  const hpScale = 1 + (Math.max(1, state.threatHpMultiplier) - 1) * THREAT_HP_BLEND;
  const hp = Math.max(THREAT_BASE_HP, Math.round(THREAT_BASE_HP * hpScale));
  state.entities.push({
    kind: "enemy",
    lane,
    type: spec.type,
    label: spec.label,
    y: getEnemySpawnY({ boss: false }),
    hp,
    maxHp: hp,
    speed: (spec.speed + state.wave * 5 + rand(-8, 10)) * ENEMY_SPEED_SCALE,
    color: spec.color,
    score: spec.score,
    radius: Math.round(38 * ENEMY_SIZE_SCALE),
    width: Math.round(92 * ENEMY_SIZE_SCALE),
    height: Math.round(124 * ENEMY_SIZE_SCALE),
    slowTimer: 0,
    slowMult: 1,
    animSeed: rand(0, Math.PI * 2),
    animSpeed: rand(5.5, 7.8),
  });
}

function spawnBoss(lane, bossTier = "small") {
  const hpBlend = bossTier === "big" ? 0.74 : BOSS_HP_BLEND;
  const hpScale = 1 + (Math.max(1, state.threatHpMultiplier) - 1) * hpBlend;
  const hpBase = bossTier === "big" ? 7.2 : 4.9;
  const hpFloor = bossTier === "big" ? THREAT_BASE_HP * 12 : THREAT_BASE_HP * 8;
  const speedBase = bossTier === "big" ? 42 : 48;
  const speedWaveScale = bossTier === "big" ? 1.55 : 1.8;
  const scoreBase = bossTier === "big" ? 360 : 220;
  const scoreWaveScale = bossTier === "big" ? 38 : 24;
  const hp = Math.max(
    hpFloor,
    Math.round(THREAT_BASE_HP * hpScale * hpBase + state.wave * (bossTier === "big" ? 4.6 : 3.5)),
  );
  state.entities.push({
    kind: "enemy",
    boss: true,
    bossTier,
    lane,
    type: "boss",
    label: bossTier === "big" ? "大" : "B",
    y: getEnemySpawnY({ boss: true }),
    hp,
    maxHp: hp,
    speed: (speedBase + state.wave * speedWaveScale + rand(-5, 6)) * ENEMY_SPEED_SCALE,
    color: bossTier === "big" ? "#ff8f6b" : "#ffd55f",
    score: scoreBase + state.wave * scoreWaveScale,
    radius: Math.round((bossTier === "big" ? 68 : 56) * ENEMY_SIZE_SCALE),
    width: Math.round((bossTier === "big" ? 168 : 138) * ENEMY_SIZE_SCALE),
    height: Math.round((bossTier === "big" ? 220 : 178) * ENEMY_SIZE_SCALE),
    slowTimer: 0,
    slowMult: 1,
    animSeed: rand(0, Math.PI * 2),
    animSpeed: bossTier === "big" ? rand(2.2, 3.1) : rand(2.8, 3.8),
  });
  state.bossAlive = true;
  state.enemyCap = 1;
  state.cameraJolt = Math.max(state.cameraJolt, 0.32);
  toast(`${bossTier === "big" ? "大 Boss" : "小 Boss"} 出现了，第 ${state.wave} 波进入首领战。`);
}

function getEnemySpawnY(entity) {
  return state.fieldTop - (entity.boss ? 34 : 28);
}

function applyEnemySlow(entity, reduction) {
  if (!entity || entity.kind !== "enemy") return;
  const slowReduction = clamp(reduction, 0, ICE_SLOW_MAX);
  const slowMult = clamp(1 - slowReduction, 0.5, 1);
  entity.slowTimer = Math.max(entity.slowTimer || 0, ICE_SLOW_DURATION);
  entity.slowMult = Math.min(entity.slowMult ?? 1, slowMult);
}

function updateEnemySlow(entity, dt) {
  if (!entity || entity.kind !== "enemy") return;
  if ((entity.slowTimer || 0) > 0) {
    entity.slowTimer = Math.max(0, entity.slowTimer - dt);
    if (entity.slowTimer <= 0) {
      entity.slowMult = 1;
    }
  }
}

function configureWaveState() {
  state.bossTier = getBossWaveTier(state.wave);
  state.bossWave = state.bossTier !== null;
  state.bossSpawned = false;
  state.bossAlive = false;
  state.enemyCap = state.bossWave ? 1 : Math.min(4, 2 + Math.floor((state.wave - 1) / 3));
}

function applyThreatPressure(multiplier = THREAT_PRESSURE_MULTIPLIER) {
  state.threatHpMultiplier *= multiplier;
}

function spawnBoost(lane) {
  const spec = weightedChoice(BOOST_TYPES);
  applyThreatPressure(THREAT_PRESSURE_MULTIPLIER);
  const hpScale = 1 + (Math.max(1, state.threatHpMultiplier) - 1) * THREAT_HP_BLEND;
  const hp = Math.max(THREAT_BASE_HP, Math.round(THREAT_BASE_HP * hpScale));
  state.entities.push({
    kind: "boost",
    lane,
    type: spec.type,
    label: spec.label,
    y: state.fieldTop - 38,
    hp,
    maxHp: hp,
    speed: spec.speed + state.wave * 3,
    color: spec.color,
    score: spec.score,
    radius: 30,
    width: 68,
    height: 104,
  });
}

function collectGrenadeBoost() {
  const hadGrenade = state.grenadeUnlocked;
  state.grenadeUnlocked = true;
  state.grenadeBaseDamage = hadGrenade ? state.grenadeBaseDamage + GRENADE_PICKUP_BONUS : GRENADE_BASE_DAMAGE;
  if (!hadGrenade) {
    state.grenadeTimer = GRENADE_THROW_INTERVAL;
  }

  const text = hadGrenade
    ? `手雷基础伤害 +${GRENADE_PICKUP_BONUS}`
    : "手雷已解锁";
  floatingText(state.viewW * 0.5, state.viewH * 0.26, text, "#ffb347");
  toast(
    hadGrenade
      ? `手雷基础伤害提升到 ${getGrenadeBaseDamage()}，并保持对怪物最大血量的 20% 额外伤害。`
      : `手雷已装填，基础伤害 ${GRENADE_BASE_DAMAGE}，并附带怪物最大血量 20% 的额外伤害。`,
  );
  state.audio.boost();
}

function triggerGrenadeThrow() {
  if (!state.grenadeUnlocked) return;

  const originX = state.playerX;
  const originY = state.playerY - 42;
  const destroyed = new Set();

  for (const entity of [...state.entities]) {
    if (entity.kind !== "enemy") continue;
    const grenadeDamage = getGrenadeDamage(entity);
    const dead = resolveEntityHit(entity, grenadeDamage, "#ffb347", { silent: true });
    if (dead) destroyed.add(entity);
  }

  if (destroyed.size) {
    state.entities = state.entities.filter((entity) => !destroyed.has(entity));
  }

  state.cameraJolt = Math.max(state.cameraJolt, 0.24);
  state.flash = Math.max(state.flash, 0.28);
  state.flashColor = "rgba(255,255,255,1)";
  state.audio.blast();
  makeParticle(originX, originY, "#ffb347", 18, 1.22);
  floatingText(originX, originY - 20, `手雷 +20%`, "#ffb347");
  toast(`手雷自动投出，基础伤害 +怪物最大血量 20% 额外伤害。`);
}

function isVineFreezeActive() {
  return state.time < state.vineFreezeUntil;
}

function updateVineHudState() {
  if (els.vineGrenadeValue) {
    els.vineGrenadeValue.textContent = `${state.vineGrenadeCharges} / ${state.vineGrenadeMax}`;
  }
  if (els.vineUseBtn) {
    els.vineUseBtn.disabled = state.vineAdBusy || state.vineGrenadeCharges <= 0;
    els.vineUseBtn.textContent = state.vineGrenadeCharges > 0 ? "投出藤蔓手雷" : "藤蔓手雷已空";
  }
  if (els.vineAdBtn) {
    els.vineAdBtn.disabled = state.vineAdBusy || state.vineGrenadeCharges >= state.vineGrenadeMax;
    els.vineAdBtn.textContent = state.vineAdBusy
      ? "广告观看中..."
      : state.vineGrenadeCharges >= state.vineGrenadeMax
        ? "已经满了"
        : "看广告 +1";
  }
}

function useVineGrenade() {
  if (state.vineAdBusy) return;
  if (state.vineGrenadeCharges <= 0) {
    toast("藤蔓手雷已经用完了，先看广告补一个。");
    updateHud();
    return;
  }

  const enemies = state.entities.filter((entity) => entity.kind === "enemy");
  if (!enemies.length) {
    toast("场上还没有怪物，藤蔓手雷先留着。");
    return;
  }

  state.vineGrenadeCharges -= 1;
  state.vineFreezeUntil = Math.max(state.vineFreezeUntil, state.time + 5);
  state.cameraJolt = Math.max(state.cameraJolt, 0.16);
  state.flash = Math.max(state.flash, 0.2);
  state.flashColor = "rgba(104, 240, 143, 1)";
  state.audio.boost();
  makeParticle(state.playerX, state.playerY - 44, "#63e88c", 24, 1.1);
  floatingText(state.playerX, state.playerY - 68, "藤蔓缠住全场 5 秒", "#63e88c");
  toast("藤蔓手雷已释放，全场怪物被树藤缠住 5 秒。");
  updateHud();
}

function watchVineAd() {
  if (state.vineAdBusy) return;
  if (state.vineGrenadeCharges >= state.vineGrenadeMax) {
    toast("藤蔓手雷已经满 3 个了。");
    updateHud();
    return;
  }

  state.vineAdBusy = true;
  updateHud();
  toast("正在观看广告，稍后补充 1 个藤蔓手雷。");
  const adSeq = state.vineAdSeq;
  window.setTimeout(() => {
    if (state.vineAdSeq !== adSeq) return;
    state.vineGrenadeCharges = Math.min(state.vineGrenadeMax, state.vineGrenadeCharges + 1);
    state.vineAdBusy = false;
    state.audio.boost();
    toast("广告看完了，藤蔓手雷 +1。");
    updateHud();
  }, 1200);
}

function makeParticle(x, y, color, count = 6, power = 1) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + rand(-0.25, 0.25);
    const speed = rand(52, 180) * power;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.34, 0.62),
      color,
      radius: rand(1.8, 3.8),
    });
  }
}

function floatingText(x, y, text, color = "#fff") {
  state.texts.push({
    x,
    y,
    text,
    color,
    life: 1.1,
    scale: 1,
  });
}

function pushBackWorld(distance) {
  for (const entity of state.entities) {
    if (entity.kind === "enemy") {
      entity.y = getEnemySpawnY(entity);
      entity.animSeed = rand(0, Math.PI * 2);
      entity.slowTimer = 0;
      entity.slowMult = 1;
    } else {
      entity.y = Math.max(state.fieldTop - 60, entity.y - distance);
    }
  }
  for (const bullet of state.bullets) {
    bullet.y = Math.max(0, bullet.y - distance * 0.32);
  }
  state.spawnPause = Math.max(state.spawnPause, 1.25);
  state.cameraJolt = Math.max(state.cameraJolt, 0.28);
  state.flash = Math.max(state.flash, 0.18);
  state.flashColor = "rgba(255,255,255,1)";
  toast("复活成功，怪物已经被推回出生点。");
}

function addCompanion() {
  if (state.allies.length < 2) {
    const slot = state.allies.length;
    const lane = slot;
    state.allies.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`,
      slot,
      lane,
      fireCooldown: rand(0.05, 0.22),
      fireInterval: Math.max(0.18, 0.42 - state.weaponLevel * 0.02),
      damage: getCompanionDamage(),
      sway: rand(0, Math.PI * 2),
      side: slot === 0 ? -1 : 1,
    });
    state.allyCount = state.allies.length;
    floatingText(laneCenter(lane, state.viewW), state.playerY - 54, "+同伴", "#ffc96d");
    state.audio.ally();
    return;
  }

  state.allyDamageMult += 1;
  syncCompanionDamage();
  floatingText(state.playerX, state.playerY - 58, `同伴倍率 x${state.allyDamageMult.toFixed(2)}`, "#ffc96d");
  state.audio.ally();
}

function upgradeWeapon() {
  state.weaponLevel += 1;
  state.weaponDamageMult += 1;
  floatingText(state.playerX, state.playerY - 58, `武器倍率 x${state.weaponDamageMult.toFixed(2)}`, "#8efbb0");
  toast("武器升级，倍率增加了。");
  state.audio.boost();
}

function resolveEntityHit(entity, damage, sourceColor, options = {}) {
  entity.hp -= damage;
  makeParticle(laneCenter(entity.lane, state.viewW), entity.y, sourceColor, 8, 1);
  floatingText(laneCenter(entity.lane, state.viewW), entity.y - 16, `-${damage}`, sourceColor);
  if (!options.silent) {
    state.audio.hit();
  }
  if (entity.hp > 0) return false;

  const laneX = laneCenter(entity.lane, state.viewW);
  if (entity.kind === "enemy") {
    const rewardBase = entity.boss
      ? entity.score + Math.floor(state.wave * 16)
      : entity.score + Math.floor(state.wave * 2);
    const reward = Math.round(rewardBase * state.scoreMult);
    state.score += reward;
    state.totalKills += 1;
    state.cameraJolt = Math.max(state.cameraJolt, 0.12);
    makeParticle(laneX, entity.y, entity.color, entity.boss ? 22 : 14, entity.boss ? 1.35 : 1.15);
    floatingText(laneX, entity.y - 16, `+${reward}`, entity.boss ? "#fff1a8" : entity.color);
    if (entity.boss) {
      state.bossAlive = false;
      state.enemyCap = Math.min(4, 2 + Math.floor((state.wave - 1) / 3));
      const bossLabel = entity.bossTier === "big" ? "大 Boss" : "小 Boss";
      toast(`${bossLabel} 被击破了，遗物会更偏向稀有掉落。`);
      floatingText(laneX, entity.y - 42, `${bossLabel} 击破`, entity.bossTier === "big" ? "#ff9f7a" : "#ffcf58");
    }
    saveBestScore(state.score);
  } else if (entity.kind === "boost") {
    const reward = Math.round(entity.score * state.scoreMult);
    state.score += reward;
    state.cameraJolt = Math.max(state.cameraJolt, 0.08);
    makeParticle(laneX, entity.y, entity.color, 12, 1.12);
    if (entity.type === "gun") {
      upgradeWeapon();
    } else if (entity.type === "grenade") {
      collectGrenadeBoost();
    } else {
      addCompanion();
    }
    floatingText(
      laneX,
      entity.y - 16,
      entity.type === "gun" ? "枪到手" : entity.type === "grenade" ? "手雷到手" : "伙伴到手",
      entity.color,
    );
    saveBestScore(state.score);
  }
  return true;
}

function shootFromLane(lane, damage, color, source = "player", xOffset = 0) {
  state.bullets.push({
    lane,
    x: laneCenter(lane, state.viewW) + xOffset,
    y: state.playerY - 28,
    speed: BULLET_SPEED + (source === "ally" ? 36 : 0),
    damage,
    color,
    source,
    radius: 4,
    pierce: source === "player" ? state.bulletPierce : 0,
  });
  state.audio.shoot();
}

function die(reason) {
  if (state.gameOver) return;
  state.gameOver = true;
  saveBestScore(state.score);
  state.audio.death();
  showDeathOverlay(reason);
  els.overlayKicker.textContent = "本局结束";
  els.overlayTitle.textContent = "你被怪物撞到了";
  els.overlayDesc.textContent = reason;
  els.reviveBtn.hidden = state.reviveCount <= 0;
  els.playAgainBtn.textContent = "再来一局";
  updateHud();
}

function revive() {
  if (!state.gameOver || state.reviveCount <= 0) return;
  state.reviveCount = Math.max(0, state.reviveCount - 1);
  state.gameOver = false;
  state.spawnPause = 1.25;
  state.fireCooldown = 0.08;
  pushBackWorld(state.viewH * 0.17);
  state.audio.revive();
  setOverlay(true);
  updateHud();
}

function restartGame() {
  state.score = 0;
  state.wave = 1;
  state.totalKills = 0;
  state.weaponLevel = 1;
  state.weaponInterval = 0.28;
  state.allyCount = 0;
  state.reviveCount = 3;
  state.reviveUsed = false;
  state.relics = [];
  state.relicChoiceActive = false;
  state.relicChoices = [];
  state.relicBossTier = null;
  state.relicFamilyCounts = {};
  state.pendingWave = 1;
  state.waveTimer = getWaveDuration(1);
  state.waveDuration = getWaveDuration(1);
  state.damageBase = 1;
  state.weaponDamageMult = 1;
  state.allyDamageBase = 1;
  state.allyDamageMult = 1;
  state.bulletPierce = 0;
  state.bulletSlowReduction = 0;
  state.scoreMult = 1;
  state.grenadeUnlocked = false;
  state.grenadeBaseDamage = 0;
  state.grenadeDamageBonus = 0;
  state.grenadeTimer = GRENADE_THROW_INTERVAL;
  state.grenadeInterval = GRENADE_THROW_INTERVAL;
  state.vineGrenadeCharges = 1;
  state.vineAdBusy = false;
  state.vineFreezeUntil = 0;
  state.vineAdSeq += 1;
  state.gameOver = false;
  state.gameStarted = true;
  state.focusLane = 0;
  state.manualLane = 0;
  state.fireCooldown = 0;
  state.spawnPause = 0.6;
  state.enemyTimers = [1.35, 1.8];
  state.boostTimer = 1.55;
  state.threatHpMultiplier = 1;
  state.entities = [];
  state.bullets = [];
  state.particles = [];
  state.texts = [];
  state.allies = [];
  state.cameraJolt = 0;
  state.flash = 0;
  state.flashColor = "rgba(255,255,255,1)";
  state.time = 0;
  state.playerX = laneCenter(0, state.viewW);
  configureWaveState();
  setOverlay(true);
  toast("新一局开始，两路怪物会不断压上来。");
  updateHud();
}

function updateSpawnTimers(dt) {
  if (state.spawnPause > 0) {
    state.spawnPause -= dt;
    return;
  }

  if (state.bossWave && !state.bossSpawned) {
    const bossLane = Math.floor(Math.random() * LANE_COUNT);
    spawnBoss(bossLane, state.bossTier || "small");
    state.bossSpawned = true;
    return;
  }

  if (state.bossWave) {
    const bossAlive = state.entities.some((entity) => entity.kind === "enemy" && entity.boss);
    state.bossAlive = bossAlive;
    state.enemyCap = bossAlive ? 1 : Math.min(4, 2 + Math.floor((state.wave - 1) / 3));
    if (bossAlive) {
      return;
    }
  }

  const activeEnemies = state.entities.filter((entity) => entity.kind === "enemy").length;
  if (activeEnemies >= state.enemyCap) {
    for (let lane = 0; lane < LANE_COUNT; lane += 1) {
      state.enemyTimers[lane] = Math.max(state.enemyTimers[lane], 0.4);
    }
    return;
  }

  const waveFactor = Math.max(0, state.wave - 1);
  const enemyBase = Math.max(1.55, 3.05 - waveFactor * 0.12);
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    state.enemyTimers[lane] -= dt;
    if (state.enemyTimers[lane] <= 0) {
      spawnEnemy(lane);
      state.enemyTimers[lane] += rand(enemyBase * 0.9, enemyBase * 1.35);
    }
  }

  state.boostTimer -= dt;
  if (state.boostTimer <= 0) {
    spawnBoost(Math.floor(Math.random() * LANE_COUNT));
    state.boostTimer += rand(4.5, Math.max(5.5, 7.5 - waveFactor * 0.15));
  }
}

function updateEntities(dt) {
  const playerY = state.playerY;
  const deadEntities = [];
  const vineFrozen = isVineFreezeActive();

  for (const entity of state.entities) {
    if (entity.kind === "enemy") {
      updateEnemySlow(entity, dt);
    }
    const slowMult = entity.kind === "enemy" ? (entity.slowMult ?? 1) : 1;
    const freezeMult = entity.kind === "enemy" && vineFrozen ? 0 : 1;
    entity.y += entity.speed * dt * slowMult * freezeMult;

    if (entity.kind === "enemy") {
      if (entity.lane === state.focusLane && entity.y >= playerY - 36) {
        const destroyed = resolveEntityHit(entity, entity.hp, entity.color, { silent: true });
        if (destroyed) {
          deadEntities.push(entity);
        }
      }
    }

    if (entity.y > state.viewH + 90) {
      deadEntities.push(entity);
    }
  }

  if (deadEntities.length) {
    state.entities = state.entities.filter((entity) => !deadEntities.includes(entity));
  }
}

function updateBullets(dt) {
  const removed = new Set();
  const deadEntities = new Set();

  for (let i = 0; i < state.bullets.length; i += 1) {
    const bullet = state.bullets[i];
    bullet.y -= bullet.speed * dt;
    if (bullet.y < state.fieldTop - 40) {
      removed.add(i);
    }
  }

  for (let i = 0; i < state.bullets.length; i += 1) {
    if (removed.has(i)) continue;
    const bullet = state.bullets[i];
    for (const entity of state.entities) {
      if (entity.lane !== bullet.lane) continue;
      const collisionDistance = entity.radius + bullet.radius + 5;
      if (Math.abs(entity.y - bullet.y) <= collisionDistance) {
        const destroyed = resolveEntityHit(entity, bullet.damage, bullet.color);
        const bulletSlowReduction = getBulletSlowReduction();
        if (!destroyed && entity.kind === "enemy" && bulletSlowReduction > 0) {
          applyEnemySlow(entity, bulletSlowReduction);
        }
        if (bullet.pierce > 0) {
          bullet.y = entity.y - collisionDistance - 1;
          bullet.pierce -= 1;
        } else {
          removed.add(i);
        }
        if (destroyed) deadEntities.add(entity);
        break;
      }
    }
  }

  if (removed.size) {
    state.bullets = state.bullets.filter((_, index) => !removed.has(index));
  }

  if (deadEntities.size) {
    state.entities = state.entities.filter((entity) => !deadEntities.has(entity));
  }
}

function updateAllies(dt) {
  const allyDamage = getCompanionDamage();
  for (const ally of state.allies) {
    ally.fireCooldown -= dt;
    if (ally.fireCooldown <= 0) {
      shootFromLane(state.focusLane, allyDamage, ALLY_BULLET_COLOR, "ally", (ally.side ?? 1) * 18);
      ally.fireCooldown += ally.fireInterval;
    }
  }
}

function updatePlayer(dt) {
  const desiredLane = state.focusLane;
  const desiredX = laneCenter(desiredLane, state.viewW);
  state.playerX += (desiredX - state.playerX) * Math.min(1, dt * 10);

  state.fireCooldown -= dt;
  if (!state.gameOver && state.fireCooldown <= 0) {
    shootFromLane(desiredLane, getPlayerDamage(), PLAYER_BULLET_COLOR, "player");
    state.fireCooldown += state.weaponInterval;
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 120 * dt;
    return particle.life > 0;
  });

  state.texts = state.texts.filter((item) => {
    item.life -= dt;
    item.y -= 26 * dt;
    return item.life > 0;
  });
}

function updateWave(dt) {
  state.time += dt;
  state.waveTimer -= dt;
  if (state.waveTimer <= 0 && !state.relicChoiceActive) {
    startRelicChoice();
  }
}

function updateGrenadeTimer(dt) {
  if (!state.grenadeUnlocked) return;

  state.grenadeTimer -= dt;
  while (state.grenadeTimer <= 0) {
    triggerGrenadeThrow();
    state.grenadeTimer += state.grenadeInterval;
  }
}

function update(dt) {
  if (state.gameOver) {
    updateParticles(dt);
    return;
  }
  if (state.relicChoiceActive) {
    updateParticles(dt);
    updateHud();
    return;
  }

  updateWave(dt);
  if (state.relicChoiceActive) {
    updateParticles(dt);
    updateHud();
    return;
  }
  updateGrenadeTimer(dt);
  updateSpawnTimers(dt);
  updatePlayer(dt);
  updateAllies(dt);
  updateBullets(dt);
  updateEntities(dt);
  updateParticles(dt);

  if (state.cameraJolt > 0) {
    state.cameraJolt = Math.max(0, state.cameraJolt - dt * 1.8);
  }
  if (state.flash > 0) {
    state.flash = Math.max(0, state.flash - dt * 2.2);
  }

  updateHud();
}

function drawBackground() {
  const { viewW: w, viewH: h } = state;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#f3f7fc");
  bg.addColorStop(0.5, "#e8eef7");
  bg.addColorStop(1, "#dce6f2");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const blush = ctx.createRadialGradient(w * 0.2, h * 0.13, 0, w * 0.2, h * 0.13, w * 0.48);
  blush.addColorStop(0, "rgba(255, 176, 214, 0.2)");
  blush.addColorStop(1, "rgba(255, 179, 214, 0)");
  ctx.fillStyle = blush;
  ctx.fillRect(0, 0, w, h);

  const sky = ctx.createRadialGradient(w * 0.84, h * 0.24, 0, w * 0.84, h * 0.24, w * 0.52);
  sky.addColorStop(0, "rgba(111, 184, 245, 0.18)");
  sky.addColorStop(1, "rgba(129, 208, 255, 0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const laneWidth = w / LANE_COUNT;
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const x = lane * laneWidth;
    const laneBg = ctx.createLinearGradient(0, state.fieldTop, 0, state.fieldBottom);
    laneBg.addColorStop(0, lane === 0 ? "rgba(255, 190, 220, 0.18)" : "rgba(129, 208, 255, 0.18)");
    laneBg.addColorStop(1, lane === 0 ? "rgba(255, 190, 220, 0.06)" : "rgba(129, 208, 255, 0.06)");
    ctx.fillStyle = laneBg;
    ctx.fillRect(x, state.fieldTop, laneWidth, state.fieldBottom - state.fieldTop);
  }

  ctx.strokeStyle = "rgba(95, 122, 163, 0.18)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let lane = 1; lane < LANE_COUNT; lane += 1) {
    const x = lane * laneWidth;
    ctx.moveTo(x, state.fieldTop);
    ctx.lineTo(x, state.fieldBottom);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(95, 122, 163, 0.1)";
  for (let y = state.fieldTop; y < state.fieldBottom; y += 42) {
    const offset = ((state.time * 140) % 42) - 42;
    ctx.beginPath();
    ctx.moveTo(state.fieldLeft, y + offset);
    ctx.lineTo(state.fieldRight, y + offset);
    ctx.stroke();
  }

  const glow = ctx.createLinearGradient(0, state.fieldTop, 0, state.fieldBottom);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.24)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(state.fieldLeft, state.fieldTop, state.fieldRight - state.fieldLeft, state.fieldBottom - state.fieldTop);
}

function drawValueBadge(x, y, value, options = {}) {
  const {
    width = 34,
    height = 20,
    fill = "rgba(255, 255, 255, 0.92)",
    textColor = "#1f2740",
    shadow = "rgba(61, 84, 120, 0.18)",
    fontSize = 16,
  } = options;

  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, 999);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = textColor;
  ctx.font = `900 ${fontSize}px "Figtree", "Inter", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value), 0, 1);
  ctx.restore();
}

function drawHumanModel(x, y, options = {}) {
  const {
    scale = 1,
    facing = 1,
    variant = "player",
  } = options;
  const sprite = variant === "ally" ? SPRITES.ally : SPRITES.player;
  drawSpriteImage(sprite, x, y, 100 * scale, 140 * scale, facing);
}

function drawZombieModel(x, y, options = {}) {
  const {
    scale = 1,
    facing = 1,
  } = options;
  drawSpriteImage(SPRITES.enemy, x, y, 120 * scale, 140 * scale, facing);
}

function drawIceSlowEffect(x, y, enemyW, enemyH, boss = false, slowMult = 1, seed = 0) {
  const slowReduction = clamp(1 - slowMult, 0, ICE_SLOW_MAX);
  if (slowReduction <= 0) return;

  const pulse = 0.55 + Math.sin(state.time * 12 + seed) * 0.18;
  const glowAlpha = clamp(0.12 + slowReduction * 0.35 * pulse, 0.12, 0.42);
  const footY = y + enemyH * 0.44;
  const footSize = Math.max(10, enemyW * (boss ? 0.14 : 0.12));

  ctx.save();
  ctx.shadowColor = "rgba(122, 218, 255, 0.72)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = `rgba(110, 212, 255, ${glowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y - enemyH * 0.04, enemyW * 0.44, enemyH * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(189, 240, 255, ${0.22 + slowReduction * 0.28})`;
  ctx.beginPath();
  ctx.arc(x, footY, footSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(222, 248, 255, ${0.5 + slowReduction * 0.35})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6 + seed * 0.3;
    const inner = footSize * 0.24;
    const outer = footSize * 0.78;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, footY + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, footY + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVineFreezeEffect(x, y, enemyW, enemyH, boss = false, seed = 0) {
  const pulse = 0.54 + Math.sin(state.time * 8.4 + seed) * 0.16;
  const sway = Math.sin(state.time * 2.1 + seed) * 0.22;
  const leafAlpha = clamp(0.4 + pulse * 0.35, 0.4, 0.92);

  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(88, 255, 138, 0.75)";
  ctx.shadowBlur = 18;

  ctx.fillStyle = `rgba(105, 255, 143, ${0.12 + pulse * 0.08})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, enemyW * 0.48, enemyH * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const strandColor = `rgba(63, 183, 88, ${0.52 + pulse * 0.22})`;
  const strandWidth = boss ? 4.6 : 3.4;
  for (let i = 0; i < 3; i += 1) {
    const offset = (i - 1) * enemyW * 0.15;
    ctx.strokeStyle = strandColor;
    ctx.lineWidth = strandWidth;
    ctx.beginPath();
    ctx.moveTo(-enemyW * 0.34, -enemyH * 0.18 + offset * 0.08);
    ctx.bezierCurveTo(
      -enemyW * 0.12,
      -enemyH * 0.36 + offset * 0.18,
      enemyW * 0.1,
      enemyH * 0.18 - offset * 0.08,
      enemyW * 0.34,
      enemyH * 0.14 + offset * 0.12,
    );
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(70, 196, 104, ${0.7 + pulse * 0.12})`;
  ctx.lineWidth = boss ? 5 : 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, enemyW * 0.37, enemyH * 0.3, sway, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI * 2 * i) / 4 + seed * 0.24 + state.time * 0.9;
    const leafX = Math.cos(angle) * enemyW * 0.25;
    const leafY = Math.sin(angle) * enemyH * 0.18;
    const leafRot = angle + Math.PI / 2;

    ctx.save();
    ctx.translate(leafX, leafY);
    ctx.rotate(leafRot);
    ctx.fillStyle = `rgba(131, 255, 163, ${leafAlpha})`;
    ctx.beginPath();
    ctx.ellipse(-4, 0, enemyW * 0.06, enemyH * 0.03, 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, 0, enemyW * 0.06, enemyH * 0.03, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawGunGlyph(x, y, scale = 1, color = "#07111f") {
  drawSpriteImage(SPRITES.boost.gun, x, y, 70 * scale, 110 * scale, 1);
}

function drawGrenadeGlyph(x, y, scale = 1) {
  drawSpriteImage(SPRITES.boost.grenade, x, y, 70 * scale, 110 * scale, 1);
}

function drawBoostWall(entity) {
  const laneWidth = state.viewW / LANE_COUNT;
  const wallW = laneWidth * 0.56;
  const wallH = 98;
  const x = laneCenter(entity.lane, state.viewW);
  const y = entity.y;

  const sprite = SPRITES.boost[entity.type] || SPRITES.boost.gun;
  drawSpriteImage(sprite, x, y, wallW, wallH, 1);
}

function drawPlayer() {
  const lane = state.focusLane;
  const laneWidth = state.viewW / LANE_COUNT;
  const facing = lane === 0 ? 1 : -1;
  const pulse = 1 + Math.sin(state.time * 8) * 0.015;

  ctx.save();
  const laneGlow = ctx.createLinearGradient(0, state.fieldTop, 0, state.fieldBottom);
  laneGlow.addColorStop(0, "rgba(255, 214, 231, 0.18)");
  laneGlow.addColorStop(1, "rgba(128, 208, 255, 0.12)");
  ctx.fillStyle = laneGlow;
  ctx.beginPath();
  ctx.roundRect(lane * laneWidth + 10, state.fieldTop + 2, laneWidth - 20, state.fieldBottom - state.fieldTop - 4, 18);
  ctx.fill();
  ctx.restore();

  drawHumanModel(state.playerX, state.playerY, {
    scale: 1.05 * pulse,
    facing,
    variant: "player",
  });
}

function drawEntity(entity) {
  const x = laneCenter(entity.lane, state.viewW);
  const scale = clamp(0.62 + (entity.y / state.viewH) * 0.5, 0.62, 1.08);
  const bodyW = entity.width * scale;
  const bodyH = entity.height * scale;

  if (entity.kind === "enemy") {
    const cycle = state.time * (entity.animSpeed || 6) + (entity.animSeed || 0);
    const boss = Boolean(entity.boss);
    const hop = boss ? (Math.sin(cycle) + 1) * 0.5 : (Math.sin(cycle) + 1) * 0.5;
    const lift = Math.max(0, Math.sin(cycle)) * (boss ? 15 : 11);
    const squashX = 1 + hop * (boss ? 0.02 : 0.04);
    const squashY = 1 - hop * (boss ? 0.03 : 0.06);
    const enemyW = bodyW * (boss ? 2.0 : 1.65) * squashX;
    const enemyH = bodyH * (boss ? 1.72 : 1.48) * squashY;
    const sprite = boss ? SPRITES.boss : SPRITES.enemy;
    const slowMult = entity.slowTimer > 0 ? (entity.slowMult ?? 1) : 1;
    const slowSeed = entity.animSeed || 0;

    drawIceSlowEffect(x, entity.y - lift, enemyW, enemyH, boss, slowMult, slowSeed);

    if (!boss && entity.type === "grunt") {
      ctx.save();
      ctx.shadowColor = entity.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(126, 227, 176, 0.16)";
      ctx.beginPath();
      ctx.ellipse(x, entity.y - lift + 4, enemyW * 0.48, enemyH * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (boss) {
      ctx.save();
      ctx.shadowColor = "rgba(255, 208, 95, 0.45)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(255, 232, 153, 0.18)";
      ctx.beginPath();
      ctx.ellipse(x, entity.y - lift + 6, enemyW * 0.52, enemyH * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawSpriteImage(
      sprite,
      x,
      entity.y - lift,
      enemyW,
      enemyH,
      entity.lane === 0 ? 1 : -1,
    );

    if (isVineFreezeActive()) {
      drawVineFreezeEffect(x, entity.y - lift, enemyW, enemyH, boss, slowSeed);
    }

    if (entity.slowTimer > 0) {
      ctx.save();
      const flicker = 0.18 + (0.14 * (0.5 + Math.sin(state.time * 18 + slowSeed) * 0.5));
      ctx.globalAlpha = flicker;
      ctx.fillStyle = "rgba(124, 220, 255, 1)";
      ctx.shadowColor = "rgba(124, 220, 255, 0.8)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(
        x - enemyW * 0.34,
        entity.y - lift - enemyH * 0.34,
        enemyW * 0.68,
        enemyH * 0.62,
        Math.max(10, enemyW * 0.12),
      );
      ctx.fill();
      ctx.restore();
    }

    drawValueBadge(x, entity.y - lift - enemyH * 0.55, entity.hp, {
      width: boss ? Math.max(54, bodyW * 0.58) : Math.max(34, bodyW * 0.4),
      height: boss ? 28 : 22,
      fill: boss ? "rgba(255, 239, 173, 0.96)" : "rgba(255, 255, 255, 0.94)",
      textColor: boss ? "#6f3f00" : "#1f2740",
      shadow: boss ? "rgba(255, 184, 46, 0.24)" : "rgba(61, 84, 120, 0.18)",
      fontSize: Math.max(14, Math.round((boss ? 20 : 18) * scale)),
    });
    return;
  }

  drawBoostWall(entity);
  drawValueBadge(x, entity.y - 78, entity.hp, {
    width: 36,
    height: 22,
    fill: "rgba(255, 255, 255, 0.95)",
    textColor: "#1f2740",
    shadow: "rgba(61, 84, 120, 0.18)",
    fontSize: 16,
  });
}

function drawCompanions() {
  for (const ally of state.allies) {
    const side = ally.side ?? (ally.slot === 0 ? -1 : 1);
    const x = state.playerX + side * 52;
    const y = state.playerY + 22 + Math.sin(state.time * 5 + ally.sway) * 4;
    const facing = side === -1 ? 1 : -1;

    drawHumanModel(x, y, {
      scale: 0.82,
      facing,
      variant: "ally",
    });
  }
}

function drawBullet(bullet) {
  const width = 10;
  const height = 28;
  const facing = bullet.source === "ally" ? 1 : 1;
  if (!drawSpriteImage(SPRITES.bullet, bullet.x, bullet.y, width, height, facing)) {
    const x = bullet.x;
    const y = bullet.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.roundRect(-3, -10, 6, 18, 999);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.beginPath();
    ctx.roundRect(-1.5, -8, 3, 12, 999);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(particle.life / 0.62, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTexts() {
  for (const text of state.texts) {
    const alpha = clamp(text.life / 1.1, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = text.color;
    ctx.shadowColor = "rgba(18, 24, 38, 0.42)";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(18, 24, 38, 0.42)";
    ctx.font = `900 ${Math.round(20 * text.scale)}px "Figtree", "Inter", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }
}

function drawVfx() {
  if (state.flash > 0) {
    ctx.save();
    ctx.globalAlpha = state.flash;
    ctx.fillStyle = state.flashColor || "rgba(255,255,255,1)";
    ctx.fillRect(0, 0, state.viewW, state.viewH);
    ctx.restore();
  }
}

function drawTargetHints() {
  const laneWidth = state.viewW / LANE_COUNT;
  const y = state.playerY - 92;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
  ctx.strokeStyle = "rgba(61, 84, 120, 0.22)";
  ctx.lineWidth = 1.2;
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    const x = lane * laneWidth + 8;
    const width = laneWidth - 16;
    ctx.beginPath();
    ctx.roundRect(x, y, width, 36, 12);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  if (!state.viewW || !state.viewH) return;

  ctx.save();
  const jx = state.cameraJolt > 0 ? rand(-6, 6) * state.cameraJolt : 0;
  const jy = state.cameraJolt > 0 ? rand(-4, 4) * state.cameraJolt : 0;
  ctx.translate(jx, jy);

  drawBackground();
  drawTargetHints();
  drawCompanions();

  for (const entity of state.entities) drawEntity(entity);
  for (const bullet of state.bullets) drawBullet(bullet);
  drawPlayer();
  drawParticles();
  drawTexts();
  drawVfx();

  ctx.restore();
}

function loop() {
  const t = nowMs();
  const dt = clamp((t - state.lastFrame) / 1000, 0, 0.033);
  state.lastFrame = t;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function setManualLane(lane) {
  state.manualLane = lane;
  state.focusLane = lane;
  state.playerLane = lane;
  toast(`切换到 ${["左路", "右路"][lane]}`);
  updateHud();
}

function handleCanvasPointer(event) {
  const rect = els.canvas.getBoundingClientRect();
  const x = clamp(event.clientX - rect.left, 0, rect.width - 1);
  const lane = laneFromX(x, rect.width);
  setManualLane(lane);
  state.audio.resume();
}

function handleLaneButtonClick(event) {
  const btn = event.currentTarget;
  setManualLane(Number(btn.dataset.lane));
  state.audio.resume();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  state.audio.enabled = state.soundOn;
  localStorage.setItem(SOUND_PREF_KEY, state.soundOn ? "1" : "0");
  els.soundBtn.textContent = state.soundOn ? "关声" : "开声";
  if (state.soundOn) {
    state.audio.resume();
  } else {
    state.audio.stopBgm();
  }
}

function bindEvents() {
  window.addEventListener("resize", resizeCanvas);
  els.canvas.addEventListener("pointerdown", handleCanvasPointer);
  els.laneButtons.forEach((btn) => btn.addEventListener("click", handleLaneButtonClick));

  els.restartBtn.addEventListener("click", () => {
    state.audio.resume();
    restartGame();
  });
  els.playAgainBtn.addEventListener("click", () => {
    state.audio.resume();
    restartGame();
  });
  els.reviveBtn.addEventListener("click", () => {
    state.audio.resume();
    revive();
  });
  els.vineUseBtn.addEventListener("click", () => {
    state.audio.resume();
    useVineGrenade();
  });
  els.vineAdBtn.addEventListener("click", () => {
    state.audio.resume();
    watchVineAd();
  });
  els.soundBtn.addEventListener("click", toggleSound);

  window.addEventListener("keydown", async (event) => {
    const key = event.key.toLowerCase();
    if (key === "r") {
      await state.audio.resume();
      restartGame();
      return;
    }
    if (key === "m") {
      toggleSound();
      return;
    }
    if (state.relicChoiceActive) {
      if (key === "1") selectRelic(0);
      if (key === "2") selectRelic(1);
      if (key === "3") selectRelic(2);
      return;
    }
    if (key === "1") setManualLane(0);
    if (key === "2") setManualLane(1);
    if (key === "a" || event.key === "ArrowLeft") setManualLane(Math.max(0, state.focusLane - 1));
    if (key === "d" || event.key === "ArrowRight") setManualLane(Math.min(LANE_COUNT - 1, state.focusLane + 1));
    if (event.key === " ") {
      event.preventDefault();
      await state.audio.resume();
      toast("当前位置已保持。");
    }
  });

  window.addEventListener(
    "pointerdown",
    () => {
      state.audio.resume();
    },
    { passive: true }
  );
}

async function init() {
  state.soundOn = false;
  state.audio.enabled = state.soundOn;
  localStorage.setItem(SOUND_PREF_KEY, "0");
  resizeCanvas();
  await loadSprites();
  restartGame();
  updateHud();
  els.soundBtn.textContent = state.soundOn ? "关声" : "开声";
  setOverlay(true);
  bindEvents();
  requestAnimationFrame(loop);
}

window.__LANE_SHOOTER__ = {
  state,
  restartGame,
  revive,
  setManualLane,
};

init();

