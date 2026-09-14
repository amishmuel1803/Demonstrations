import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Section, { DemoLayout } from '../components/ui/Section'
import LazyCanvas from '../components/LazyCanvas'
import Slider from '../components/ui/Slider'
import Toggle from '../components/ui/Toggle'
import ProceduralEnvironment from '../three/environments'
import { generateBrickMaps } from '../three/proceduralTextures'
import { useQuality } from '../hooks/useQuality'
import { textures as cfg } from '../config'

function Subject({ maps, on, normalScale, dispScale, repeat, spin }) {
  const mesh = useRef(null)
  useFrame((_, dt) => { if (spin && mesh.current) mesh.current.rotation.y += dt * 0.25 })
  useEffect(() => {
    Object.values(maps).forEach((t) => { if (t?.isTexture) { t.repeat.set(repeat, repeat / 2); t.needsUpdate = true } })
  }, [maps, repeat])
  return (
    <mesh ref={mesh} castShadow>
      {/* הרבה משולשים בכוונה: מפת תבליט (displacement) מזיזה קודקודים — בלי קודקודים אין מה להזיז */}
      <sphereGeometry args={[1.4, 256, 256]} />
      <meshStandardMaterial
        color={on.map ? '#ffffff' : '#a86a4a'}
        map={on.map ? maps.map : null}
        normalMap={on.normalMap ? maps.normalMap : null}
        normalScale={[normalScale, normalScale]}
        roughnessMap={on.roughnessMap ? maps.roughnessMap : null}
        roughness={on.roughnessMap ? 1 : 0.5}
        displacementMap={on.displacementMap ? maps.displacementMap : null}
        displacementScale={dispScale}
        displacementBias={on.displacementMap ? -dispScale * 0.5 : 0}
      />
    </mesh>
  )
}

const layers = [
  ['map', 'צבע (color map)', 'התמונה עצמה — איזה צבע יש בכל נקודה. בלעדיה החומר בצבע אחיד.'],
  ['normalMap', 'נורמלים (normal map)', 'מדמה בליטות ושקעים דרך התאורה בלבד. הצורה לא משתנה — קו המתאר נשאר עגול.'],
  ['roughnessMap', 'חספוס (roughness map)', 'איפה מבריק ואיפה מט: הלבנות חלקות יחסית, המלט גס. שימו לב להשתקפות.'],
  ['displacementMap', 'תבליט (displacement map)', 'באמת מזיז את הקודקודים החוצה. רואים את זה בקו המתאר. יקר — צריך גאומטריה צפופה.'],
]

export default function TexturesSection() {
  const { reducedMotion } = useQuality()
  const maps = useMemo(() => generateBrickMaps(cfg.size), [])
  const [on, setOn] = useState({ map: true, normalMap: true, roughnessMap: true, displacementMap: true })
  const [normalScale, setNormalScale] = useState(cfg.normalScale)
  const [dispScale, setDispScale] = useState(cfg.displacementScale)
  const [repeat, setRepeat] = useState(2)

  return (
    <Section
      id="textures"
      number={6}
      title="טקסטורות ומפות"
      what="כדור אחד עם ארבע שכבות טקסטורה של קיר לבנים, שאפשר להדליק ולכבות. התמונות עצמן נוצרו בקוד (בלי קבצים) — רואים אותן קטנות בצד."
      enables="לקבל פרטים עשירים בלי מיליוני משולשים. רוב ה'ריאליזם' בתלת-מימד הוא מפות: נורמלים וחספוס עושים 90% מהעבודה."
      cost="מפות צבע/נורמלים/חספוס — זולות (זיכרון בלבד). תבליט (displacement) דורש גאומטריה צפופה: הכדור כאן הוא 131 אלף משולשים רק בשביל זה."
      costLabel="בינוני"
    >
      <DemoLayout
        demoClass="h-[400px] md:h-[480px]"
        demo={
          <LazyCanvas className="h-full" camera={{ position: [0, 0.6, 4.6], fov: 40 }} shadows>
            <color attach="background" args={['#111114']} />
            <ProceduralEnvironment name="room" />
            <directionalLight position={[3, 4, 3]} intensity={1.5} />
            <Subject maps={maps} on={on} normalScale={normalScale} dispScale={dispScale} repeat={repeat} spin={!reducedMotion} />
            <OrbitControls enablePan={false} minDistance={2.5} maxDistance={9} />
          </LazyCanvas>
        }
        controls={
          <>
            {layers.map(([key, label, hint]) => (
              <div key={key} className="flex items-start gap-3">
                <img src={maps.previews[key]} alt={label} className="w-14 h-14 rounded border border-zinc-700 shrink-0 object-cover" />
                <Toggle label={label} hint={hint} checked={on[key]} onChange={(v) => setOn((o) => ({ ...o, [key]: v }))} />
              </div>
            ))}
            <Slider label="עוצמת נורמלים" hint="כמה 'עמוקות' הבליטות המדומות." value={normalScale} min={0} max={3} onChange={setNormalScale} />
            <Slider label="גובה תבליט" hint="כמה באמת להזיז את המשטח החוצה." value={dispScale} min={0} max={0.4} onChange={setDispScale} />
            <Slider label="חזרות" hint="כמה פעמים הטקסטורה חוזרת סביב הכדור." value={repeat} min={1} max={6} step={1} onChange={setRepeat} />
          </>
        }
      />
    </Section>
  )
}
