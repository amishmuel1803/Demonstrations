import * as THREE from 'three'

/**
 * מייצר בקוד ארבע "מפות" (טקסטורות) של קיר לבנים — בלי קבצי תמונה.
 * כל מפה היא תמונה שמספרת למנוע משהו אחר על כל נקודה במשטח:
 *  - color (מפת צבע): איזה צבע יש שם.
 *  - normal (מפת נורמלים): לאיזה כיוון "פונה" המשטח — מדמה בליטות ושקעים בלי לשנות גאומטריה.
 *  - roughness (מפת חספוס): כמה מבריק/מט כל אזור (לבנים חלקות יותר, מלט גס).
 *  - displacement (מפת תבליט): כמה באמת להזיז את הנקודה החוצה — משנה את הצורה עצמה.
 */

function noise2(x, y) {
  // רעש פשוט ודטרמיניסטי (לא Perlin, מספיק ל"לכלוך")
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}

/** מפת גובה: 1 = לבנה בולטת, 0 = מלט שקוע. */
function heightAt(u, v, bricksX = 6, bricksY = 12) {
  const row = Math.floor(v * bricksY)
  const offset = row % 2 ? 0.5 : 0
  const bx = (u * bricksX + offset) % 1
  const by = (v * bricksY) % 1
  const mortar = 0.08
  const edgeX = Math.min(bx, 1 - bx), edgeY = Math.min(by, 1 - by)
  const e = Math.min(edgeX / mortar, edgeY / mortar, 1) // 0 במלט, 1 בתוך הלבנה
  const smooth = e * e * (3 - 2 * e)
  return smooth
}

export function generateBrickMaps(size = 512) {
  const H = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size
      const h = heightAt(u, v)
      const grain = (noise2(x * 0.7, y * 0.7) - 0.5) * 0.12
      H[y * size + x] = Math.min(1, Math.max(0, h * 0.85 + 0.1 + grain * h))
    }
  }

  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c }
  const colorC = mk(), normalC = mk(), roughC = mk(), dispC = mk()
  const color = colorC.getContext('2d').createImageData(size, size)
  const normal = normalC.getContext('2d').createImageData(size, size)
  const rough = roughC.getContext('2d').createImageData(size, size)
  const disp = dispC.getContext('2d').createImageData(size, size)

  const at = (x, y) => H[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const h = at(x, y)
      const isBrick = h > 0.5
      const row = Math.floor((y / size) * 12), col = Math.floor(((x / size) * 6 + (row % 2 ? 0.5 : 0)))
      const tint = noise2(col * 3.1, row * 7.7) // כל לבנה בגוון קצת אחר
      // צבע
      let r, g, b
      if (isBrick) { r = 150 + tint * 60; g = 60 + tint * 30; b = 45 + tint * 20 } else { r = g = b = 120 }
      const n = (noise2(x, y) - 0.5) * 22
      color.data[i] = r + n; color.data[i + 1] = g + n; color.data[i + 2] = b + n; color.data[i + 3] = 255
      // נורמל: הפרש גבהים בין שכנים (Sobel פשוט) → כיוון המשטח
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.5
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.5
      const nx = -dx, ny = -dy, nz = 1
      const len = Math.hypot(nx, ny, nz)
      normal.data[i] = ((nx / len) * 0.5 + 0.5) * 255
      normal.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
      normal.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255
      normal.data[i + 3] = 255
      // חספוס: מלט = לבן (מחוספס), לבנה = אפור בינוני + רעש
      const rg = isBrick ? 120 + (noise2(x * 0.3, y * 0.3) - 0.5) * 60 : 235
      rough.data[i] = rough.data[i + 1] = rough.data[i + 2] = rg; rough.data[i + 3] = 255
      // תבליט = מפת הגובה עצמה
      const d = h * 255
      disp.data[i] = disp.data[i + 1] = disp.data[i + 2] = d; disp.data[i + 3] = 255
    }
  }
  colorC.getContext('2d').putImageData(color, 0, 0)
  normalC.getContext('2d').putImageData(normal, 0, 0)
  roughC.getContext('2d').putImageData(rough, 0, 0)
  dispC.getContext('2d').putImageData(disp, 0, 0)

  const tex = (canvas, srgb = false) => {
    const t = new THREE.CanvasTexture(canvas)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  return {
    map: tex(colorC, true),
    normalMap: tex(normalC),
    roughnessMap: tex(roughC),
    displacementMap: tex(dispC),
    previews: { map: colorC.toDataURL(), normalMap: normalC.toDataURL(), roughnessMap: roughC.toDataURL(), displacementMap: dispC.toDataURL() },
  }
}
