import { useState } from 'react'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import Section, { DemoLayout } from '../components/ui/Section'
import LazyCanvas from '../components/LazyCanvas'
import Slider from '../components/ui/Slider'
import Toggle from '../components/ui/Toggle'
import Btn from '../components/ui/Btn'
import ProceduralEnvironment, { environmentPresets } from '../three/environments'
import { lighting as cfg } from '../config'

/** אותו אובייקט בכל הסביבות: קשר מתכתי + כדור זכוכית + קוביה מט — כדי לראות איך כל סוג חומר מגיב. */
function Subject() {
  return (
    <group position={[0, 0.2, 0]}>
      <mesh position={[-1.6, 0, 0]} castShadow>
        <torusKnotGeometry args={[0.55, 0.2, 160, 24]} />
        <meshPhysicalMaterial color="#e5e7eb" metalness={1} roughness={0.12} />
      </mesh>
      <mesh position={[0.4, 0, 0]} castShadow>
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshPhysicalMaterial color="#ffffff" transmission={1} roughness={0.03} thickness={0.8} ior={1.5} />
      </mesh>
      <mesh position={[2.2, 0, 0]} rotation={[0.3, 0.6, 0]} castShadow>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshStandardMaterial color="#f97316" roughness={0.9} />
      </mesh>
    </group>
  )
}

export default function LightingSection() {
  const [env, setEnv] = useState(cfg.defaultEnvironment)
  const [rot, setRot] = useState(0)
  const [bg, setBg] = useState(true)
  const [blur, setBlur] = useState(0.15)
  const preset = environmentPresets[env]

  return (
    <Section
      id="lighting"
      number={3}
      title="תאורה והשתקפויות"
      what="אותם שלושה אובייקטים (מתכת, זכוכית, פלסטיק מט) בארבע סביבות תאורה. הסביבה היא 'מפת סביבה' — תמונת 360° שעוטפת את הסצנה."
      enables="להחליף את כל האווירה בלחיצה אחת, בלי לגעת באובייקטים. מתכת וזכוכית 'חיות' רק כשיש להן מה לשקף."
      cost="מפת סביבה נבנית פעם אחת (זול). לסובב אותה — חינם. מה שכן עולה: זכוכית עם שבירת אור, שרואה את הסביבה דרכה."
      costLabel="קל"
    >
      <DemoLayout
        demoClass="h-[380px] md:h-[460px]"
        demo={
          <LazyCanvas className="h-full" camera={{ position: [0, 1.5, 7], fov: 45 }} shadows>
            <color attach="background" args={['#111114']} />
            <ProceduralEnvironment name={env} rotation={rot} background={bg} blur={blur} />
            <Subject />
            <ContactShadows position={[0, -0.75, 0]} opacity={0.5} scale={12} blur={2} far={3} />
            <OrbitControls enablePan={false} minDistance={3} maxDistance={15} target={[0.3, 0.2, 0]} />
          </LazyCanvas>
        }
        controls={
          <>
            <div>
              <div className="text-sm font-semibold mb-2">סביבה</div>
              <div className="grid grid-cols-2 gap-2">
                {cfg.environments.map((name) => (
                  <Btn key={name} active={env === name} onClick={() => setEnv(name)}>{environmentPresets[name].label}</Btn>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-snug">{preset.desc}</p>
            </div>
            <Slider label="סיבוב הסביבה" hint="מסובב את כל התאורה סביב האובייקטים. שימו לב איך ההשתקפות על המתכת זזה." value={rot} min={0} max={Math.PI * 2} step={0.01} format={(v) => `${Math.round((v * 180) / Math.PI)}°`} onChange={setRot} />
            <Toggle label="הצג סביבה כרקע" hint="אותה תמונה שמאירה את האובייקטים, מוצגת גם מאחוריהם." checked={bg} onChange={setBg} />
            <Slider label="טשטוש רקע" hint="מטשטש את הרקע בלבד — התאורה נשארת חדה." value={blur} min={0} max={1} onChange={setBlur} />
            <div className="rounded-lg bg-zinc-800/60 p-3 text-[12px] leading-relaxed text-zinc-300">
              <b className="text-zinc-100">מה זה מפת סביבה?</b> תמונה פנורמית שעוטפת את הסצנה מכל הכיוונים. חומרים מבריקים משקפים אותה,
              וחומרים מטים מקבלים ממנה אור רך. בלי מפה כזו, מתכת נראית שחורה. כאן, במקום צילום HDR אמיתי, ציירנו "חדר" קטן
              ממנורות מלבניות וכיפת שמיים, וצילמנו אותו פעם אחת. הקוד ב-<code>src/three/environments.jsx</code>.
            </div>
          </>
        }
      />
    </Section>
  )
}
