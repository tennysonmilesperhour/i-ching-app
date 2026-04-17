/**
 * I Ching hexagram data and utilities.
 *
 * Line values:
 *   6 = old yin    (broken, changing)
 *   7 = young yang (solid, stable)
 *   8 = young yin  (broken, stable)
 *   9 = old yang   (solid, changing)
 */

export function getLineType(value) {
  return {
    yin: value === 6 || value === 8,
    changing: value === 6 || value === 9,
  };
}

// Trigram index from three line values (bottom to top within the trigram)
function trigramIndex(a, b, c) {
  const bit = (v) => (v === 7 || v === 9 ? 1 : 0);
  return (bit(c) << 2) | (bit(b) << 1) | bit(a);
}

// King Wen sequence lookup [lower trigram index][upper trigram index]
// Trigram indices: 0=Kun 1=Zhen 2=Kan 3=Dui 4=Gen 5=Li 6=Xun 7=Qian
const KING_WEN = [
  [ 2, 24,  7, 19, 15, 36, 46, 11],
  [16, 51, 40, 54, 62, 55, 32, 34],
  [ 8,  3, 29, 60, 39, 63, 48,  5],
  [45, 17, 47, 58, 31, 49, 28, 43],
  [23, 27,  4, 41, 52, 22, 18, 26],
  [35, 21, 64, 38, 56, 30, 50, 14],
  [20, 42, 59, 61, 53, 37, 57,  9],
  [12, 25,  6, 10, 33, 13, 44,  1],
];

export function hexagramFromLines(lines) {
  const lower = trigramIndex(lines[0], lines[1], lines[2]);
  const upper = trigramIndex(lines[3], lines[4], lines[5]);
  return KING_WEN[lower][upper];
}

// Trigram metadata keyed by the same index used in KING_WEN
// 0=Kun 1=Zhen 2=Kan 3=Dui 4=Gen 5=Li 6=Xun 7=Qian
export const TRIGRAMS = [
  { name: 'Kun',  chinese: '坤', symbol: '☷', element: 'Earth',    attribute: 'the receptive, yielding' },
  { name: 'Zhen', chinese: '震', symbol: '☳', element: 'Thunder',  attribute: 'the arousing, movement' },
  { name: 'Kan',  chinese: '坎', symbol: '☵', element: 'Water',    attribute: 'the abysmal, danger' },
  { name: 'Dui',  chinese: '兌', symbol: '☱', element: 'Lake',     attribute: 'the joyous, open' },
  { name: 'Gen',  chinese: '艮', symbol: '☶', element: 'Mountain', attribute: 'keeping still' },
  { name: 'Li',   chinese: '離', symbol: '☲', element: 'Fire',     attribute: 'the clinging, clarity' },
  { name: 'Xun',  chinese: '巽', symbol: '☴', element: 'Wind',     attribute: 'the gentle, penetrating' },
  { name: 'Qian', chinese: '乾', symbol: '☰', element: 'Heaven',   attribute: 'the creative, strong' },
];

export function getTrigrams(lines) {
  if (!lines || lines.length !== 6) return null;
  return {
    lower: TRIGRAMS[trigramIndex(lines[0], lines[1], lines[2])],
    upper: TRIGRAMS[trigramIndex(lines[3], lines[4], lines[5])],
  };
}

export function getRelatingHexagram(lines) {
  const changed = lines.map((v) => {
    if (v === 6) return 7;
    if (v === 9) return 8;
    return v;
  });
  const hasChanging = lines.some((v) => v === 6 || v === 9);
  return hasChanging ? hexagramFromLines(changed) : null;
}

export function getChangingLineIndices(lines) {
  return lines.reduce((acc, v, i) => {
    if (v === 6 || v === 9) acc.push(i);
    return acc;
  }, []);
}

export const HEXAGRAM_NAMES = {
  1: "The Creative",
  2: "The Receptive",
  3: "Difficulty at the Beginning",
  4: "Youthful Folly",
  5: "Waiting",
  6: "Conflict",
  7: "The Army",
  8: "Holding Together",
  9: "Small Taming",
  10: "Treading",
  11: "Peace",
  12: "Standstill",
  13: "Fellowship",
  14: "Great Possession",
  15: "Modesty",
  16: "Enthusiasm",
  17: "Following",
  18: "Work on the Decayed",
  19: "Approach",
  20: "Contemplation",
  21: "Biting Through",
  22: "Grace",
  23: "Splitting Apart",
  24: "Return",
  25: "Innocence",
  26: "Great Taming",
  27: "Nourishment",
  28: "Great Preponderance",
  29: "The Abysmal",
  30: "The Clinging",
  31: "Influence",
  32: "Duration",
  33: "Retreat",
  34: "Great Power",
  35: "Progress",
  36: "Darkening of the Light",
  37: "The Family",
  38: "Opposition",
  39: "Obstruction",
  40: "Deliverance",
  41: "Decrease",
  42: "Increase",
  43: "Breakthrough",
  44: "Coming to Meet",
  45: "Gathering Together",
  46: "Pushing Upward",
  47: "Oppression",
  48: "The Well",
  49: "Revolution",
  50: "The Cauldron",
  51: "The Arousing",
  52: "Keeping Still",
  53: "Development",
  54: "The Marrying Maiden",
  55: "Abundance",
  56: "The Wanderer",
  57: "The Gentle",
  58: "The Joyous",
  59: "Dispersion",
  60: "Limitation",
  61: "Inner Truth",
  62: "Small Preponderance",
  63: "After Completion",
  64: "Before Completion",
};

export const HEXAGRAM_CHINESE = {
  1: "乾", 2: "坤", 3: "屯", 4: "蒙", 5: "需", 6: "訟", 7: "師", 8: "比",
  9: "小畜", 10: "履", 11: "泰", 12: "否", 13: "同人", 14: "大有", 15: "謙", 16: "豫",
  17: "隨", 18: "蠱", 19: "臨", 20: "觀", 21: "噬嗑", 22: "賁", 23: "剝", 24: "復",
  25: "無妄", 26: "大畜", 27: "頤", 28: "大過", 29: "坎", 30: "離", 31: "咸", 32: "恆",
  33: "遯", 34: "大壯", 35: "晉", 36: "明夷", 37: "家人", 38: "睽", 39: "蹇", 40: "解",
  41: "損", 42: "益", 43: "夬", 44: "姤", 45: "萃", 46: "升", 47: "困", 48: "井",
  49: "革", 50: "鼎", 51: "震", 52: "艮", 53: "漸", 54: "歸妹", 55: "豐", 56: "旅",
  57: "巽", 58: "兌", 59: "渙", 60: "節", 61: "中孚", 62: "小過", 63: "既濟", 64: "未濟",
};

// Simulate three-coin toss for a single line
export function tossCoinLine() {
  const coins = [0, 0, 0].map(() => (Math.random() < 0.5 ? 2 : 3));
  return coins[0] + coins[1] + coins[2]; // produces 6, 7, 8, or 9
}

// Generate a full six-line reading via coin method
export function castReading() {
  return Array.from({ length: 6 }, tossCoinLine);
}
