import { useEffect, useRef, useState } from 'react'

/** מחזיר ref ודגל: האם האלמנט נמצא כרגע על המסך (או קרוב אליו). */
export function useInView(margin = '200px') {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [margin])
  return [ref, inView]
}
