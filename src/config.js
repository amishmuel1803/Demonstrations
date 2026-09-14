/**
 * קובץ ההגדרות המרכזי של כל ההדגמות.
 * כל ערך ברירת מחדל שרואים בדף מגיע מכאן — אפשר לשנות ולראות מיד.
 *
 * quality: שני "פרופילים" — מחשב וטלפון. הבחירה ביניהם קורית ב-src/hooks/useQuality.js
 * (בודק רוחב מסך + האם יש מסך מגע). בטלפון מורידים רזולוציה, חלקיקים וצללים.
 */
export const quality = {
  desktop: {
    dpr: [1, 2],          // device pixel ratio: כמה פיקסלים אמיתיים לכל פיקסל CSS (2 = רטינה, חד אבל כבד)
    shadowMapSize: 2048,  // רזולוציית הצללים
    particles: 6000,      // ברירת מחדל לכמות חלקיקים בהדגמה 8
    particlesMax: 60000,
    postprocessing: true, // זוהר (bloom) ואפקטים על התמונה הסופית
    clothCols: 24,        // רזולוציית הבד (הדגמה 7)
    waterSegments: 96,    // רזולוציית המים
    physicsBodies: 40,    // כמה גופים בערימה הראשונית (הדגמה 4)
  },
  mobile: {
    dpr: [1, 1.5],
    shadowMapSize: 1024,
    particles: 2000,
    particlesMax: 20000,
    postprocessing: true,
    clothCols: 16,
    waterSegments: 48,
    physicsBodies: 20,
  },
}

export const buttons = {
  magneticStrength: 0.35, // כמה הכפתור המגנטי "נמשך" לעכבר (0 = לא זז, 1 = נדבק)
  magneticRadius: 120,    // מרחק בפיקסלים שבו המגנט מתחיל לפעול
}

export const materials = {
  // רשימת הכדורים. כל אחד הוא MeshPhysicalMaterial עם ערכים אחרים.
  presets: [
    { name: 'פלסטיק מט',       color: '#e11d48', roughness: 0.85, metalness: 0,   transmission: 0,    clearcoat: 0,   envMapIntensity: 1 },
    { name: 'פלסטיק חלבי',      color: '#f8fafc', roughness: 0.3,  metalness: 0,   transmission: 0.8,  clearcoat: 0,   envMapIntensity: 1, thickness: 1.5, ior: 1.4 },
    { name: 'זכוכית',           color: '#ffffff', roughness: 0.02, metalness: 0,   transmission: 1,    clearcoat: 0,   envMapIntensity: 1, thickness: 0.6, ior: 1.5 },
    { name: 'מתכת מלוטשת',      color: '#d4d4d8', roughness: 0.08, metalness: 1,   transmission: 0,    clearcoat: 0,   envMapIntensity: 1.2 },
    { name: 'מתכת מוברשת',      color: '#a1a1aa', roughness: 0.45, metalness: 1,   transmission: 0,    clearcoat: 0,   envMapIntensity: 1, anisotropy: 1 },
    { name: 'בד',               color: '#1d4ed8', roughness: 1,    metalness: 0,   transmission: 0,    clearcoat: 0,   envMapIntensity: 0.4, sheen: 1, sheenColor: '#93c5fd', sheenRoughness: 0.6 },
    { name: 'עור',              color: '#f5c6a5', roughness: 0.55, metalness: 0,   transmission: 0,    clearcoat: 0,   envMapIntensity: 0.6, sheen: 0.4, sheenColor: '#ffd6c2' },
    { name: 'קרמיקה',           color: '#f1f5f9', roughness: 0.15, metalness: 0,   transmission: 0,    clearcoat: 1,   envMapIntensity: 1, clearcoatRoughness: 0.05 },
    { name: 'עץ',               color: '#7c4a1e', roughness: 0.7,  metalness: 0,   transmission: 0,    clearcoat: 0.3, envMapIntensity: 0.5, clearcoatRoughness: 0.4 },
  ],
}

export const lighting = {
  // שמות הסביבות בהדגמה 3 — כל אחת בנויה מ"מנורות" (Lightformer) ומסך רקע, בלי קבצים חיצוניים
  environments: ['studio', 'daylight', 'sunset', 'room'],
  defaultEnvironment: 'studio',
}

export const physics = {
  gravity: -9.81,        // כבידה בציר Y (כדור הארץ ≈ -9.81)
  gravityMin: -30,
  gravityMax: 5,
  throwBatch: 8,         // כמה גופים נוספים על "זרוק עוד"
  dominoCount: 10,
  restitution: 0.3,      // "קפיציות" של התנגשות (0 = בלי קפיצה, 1 = קפיצה מלאה)
  friction: 0.6,
}

export const game = {
  towerRows: 6,          // גובה המגדל בשורות
  towerCols: 3,          // רוחב המגדל
  ballMass: 4,
  launchPower: 22,       // כמה חזק הכדור יוצא כשמושכים "עד הסוף"
  ballsPerRound: 5,
}

export const textures = {
  size: 512,             // רזולוציית הטקסטורות שנבנות בקוד (בריבוע)
  displacementScale: 0.12,
  normalScale: 1.0,
}

export const soft = {
  windStrength: 0.6,
  waveHeight: 0.25,
  waveSpeed: 1.0,
}

export const particles = {
  mode: 'snow',          // snow | sparks | smoke
  bloomIntensity: 1.2,
  bloomThreshold: 0.6,
}

export const scroll = {
  sectionHeightVh: 300,  // גובה המקטע הנגלל (300 = פי שלושה מגובה המסך)
  turns: 2,              // כמה סיבובים שלמים האובייקט עושה לאורך הגלילה
}
