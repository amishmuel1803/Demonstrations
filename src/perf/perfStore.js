/**
 * מאגר קטן וגלובלי לנתוני ביצועים.
 * לכל Canvas בדף יש רינדור (מנוע ציור) משלו; כל אחד מדווח לכאן כמה משולשים צייר בפריים האחרון.
 * מד הביצועים (PerfMeter) סוכם את כולם.
 */
const triangles = new Map()   // canvasId -> מספר משולשים
const drawCalls = new Map()   // canvasId -> מספר פקודות ציור
let activeCanvases = 0

export const perfStore = {
  report(id, tri, calls) {
    triangles.set(id, tri)
    drawCalls.set(id, calls)
  },
  remove(id) {
    triangles.delete(id)
    drawCalls.delete(id)
  },
  setActive(delta) { activeCanvases += delta },
  totals() {
    let t = 0, c = 0
    for (const v of triangles.values()) t += v
    for (const v of drawCalls.values()) c += v
    return { triangles: t, drawCalls: c, canvases: activeCanvases }
  },
}
