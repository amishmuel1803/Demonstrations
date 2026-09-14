import { useEffect, useState } from 'react'
import { quality } from '../config'

/**
 * מזהה אם אנחנו בטלפון (מסך צר + מגע) ואם המשתמש ביקש "פחות תנועה" במערכת ההפעלה.
 * מחזיר את פרופיל האיכות המתאים מתוך config.js.
 *
 * זה המקום היחיד שבו מתקבלת ההחלטה "טלפון או מחשב".
 */
function detect() {
  if (typeof window === 'undefined') return { isMobile: false, reducedMotion: false }
  const narrow = window.matchMedia('(max-width: 768px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return { isMobile: narrow || coarse, reducedMotion }
}

export function useQuality() {
  const [state, setState] = useState(detect)
  useEffect(() => {
    const mqs = ['(max-width: 768px)', '(pointer: coarse)', '(prefers-reduced-motion: reduce)'].map((q) => window.matchMedia(q))
    const update = () => setState(detect())
    mqs.forEach((mq) => mq.addEventListener('change', update))
    return () => mqs.forEach((mq) => mq.removeEventListener('change', update))
  }, [])
  const tier = state.isMobile ? quality.mobile : quality.desktop
  return { ...state, tier, tierName: state.isMobile ? 'mobile' : 'desktop' }
}
