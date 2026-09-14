import { useState } from 'react'
import { ContactShadows, Html, OrbitControls } from '@react-three/drei'
import Section, { DemoLayout } from '../components/ui/Section'
import LazyCanvas from '../components/LazyCanvas'
import Slider from '../components/ui/Slider'
import Btn from '../components/ui/Btn'
import ProceduralEnvironment from '../three/environments'
import { useQuality } from '../hooks/useQuality'
import { materials as cfg } from '../config'

/**
 * כדור אחד עם MeshPhysicalMaterial — החומר ה"פיזיקלי" של Three.js:
 * מדמה איך אור באמת מתנהג על משטח (השתקפות, שבירה, לכה, ברק בד).
 */
function Ball({ p, x, selected, onClick, labelY = -1.35 }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick() }} castShadow>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshPhysicalMaterial
          color={p.color}
          roughness={p.roughness}
          metalness={p.metalness}
          transmission={p.transmission}
          thickness={p.thickness ?? 0}
          ior={p.ior ?? 1.5}
          clearcoat={p.clearcoat}
          clearcoatRoughness={p.clearcoatRoughness ?? 0.1}
          envMapIntensity={p.envMapIntensity}
          sheen={p.sheen ?? 0}
          sheenColor={p.sheenColor ?? '#ffffff'}
          sheenRoughness={p.sheenRoughness ?? 1}
          anisotropy={p.anisotropy ?? 0}
        />
      </mesh>
      {selected && (
        <mesh position={[0, -1.05, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.85, 0.95, 48]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      )}
      <Html position={[0, labelY, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`text-[11px] whitespace-nowrap px-1.5 py-0.5 rounded ${selected ? 'bg-cyan-500 text-zinc-950 font-bold' : 'bg-zinc-900/80 text-zinc-200'}`}>{p.name}</div>
      </Html>
    </group>
  )
}

export default function MaterialsSection() {
  const { isMobile } = useQuality()
  const [items, setItems] = useState(cfg.presets)
  const [sel, setSel] = useState(3)
  const p = items[sel]
  const set = (key) => (v) => setItems((arr) => arr.map((it, i) => (i === sel ? { ...it, [key]: v } : it)))
  const reset = () => setItems((arr) => arr.map((it, i) => (i === sel ? cfg.presets[i] : it)))
  const n = items.length
  const spacing = 2.1

  return (
    <Section
      id="materials"
      number={2}
      title="חומרים"
      what="תשעה כדורים באותה תאורה בדיוק, כל אחד מחומר אחר. לחצו על כדור כדי לבחור אותו, ואז שחקו בסליידרים."
      enables="לשלוט באיך משהו נראה בלי לשנות את הצורה: אותו כדור נהיה זכוכית, מתכת או בד רק דרך מספרים."
      cost="חומר רגיל זול. 'שבירת אור' (transmission) יקרה — המנוע מצייר את כל הסצנה פעם נוספת לטקסטורה כדי שתיראה דרך הזכוכית."
      costLabel="בינוני"
    >
      <DemoLayout
        demoClass="h-[380px] md:h-[460px]"
        demo={
          <LazyCanvas className="h-full" camera={{ position: [0, 2, isMobile ? 24 : 13.5], fov: 45 }} shadows>
            <color attach="background" args={['#111114']} />
            <ProceduralEnvironment name="studio" />
            <group position={[-((n - 1) * spacing) / 2, 0.3, 0]}>
              {items.map((it, i) => (
                <Ball key={i} p={it} x={i * spacing} selected={i === sel} onClick={() => setSel(i)} labelY={i % 2 ? -1.7 : -1.35} />
              ))}
            </group>
            <ContactShadows position={[0, -0.75, 0]} opacity={0.6} scale={25} blur={2.2} far={3} />
            <OrbitControls enablePan={false} minDistance={4} maxDistance={30} target={[0, 0.3, 0]} />
          </LazyCanvas>
        }
        controls={
          <>
            <div className="flex items-center justify-between">
              <div className="font-bold">נבחר: <span className="text-cyan-300">{p.name}</span></div>
              <Btn onClick={reset}>אפס</Btn>
            </div>
            <label className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">צבע</span>
              <input type="color" value={p.color} onChange={(e) => set('color')(e.target.value)} className="h-8 w-14 rounded cursor-pointer bg-transparent" />
            </label>
            <Slider label="חספוס (roughness)" hint="0 = מראה חלק ומבריק, 1 = מט לגמרי. משנה כמה ההשתקפות מטושטשת." value={p.roughness} onChange={set('roughness')} />
            <Slider label="מתכתיות (metalness)" hint="0 = לא-מתכת (פלסטיק/בד), 1 = מתכת. מתכת משקפת את הסביבה בצבע שלה עצמה." value={p.metalness} onChange={set('metalness')} />
            <Slider label="שבירת אור (transmission)" hint="כמה אור עובר דרך החומר. 1 = זכוכית. יקר בביצועים!" value={p.transmission} onChange={set('transmission')} />
            <Slider label="עובי (thickness)" hint="פועל רק עם שבירת אור: כמה 'עמוק' האור מתעקם בפנים." value={p.thickness ?? 0} min={0} max={3} onChange={set('thickness')} />
            <Slider label="ציפוי לכה (clearcoat)" hint="שכבת לכה שקופה ומבריקה מעל החומר — כמו צבע של מכונית או קרמיקה מזוגגת." value={p.clearcoat} onChange={set('clearcoat')} />
            <Slider label="השתקפויות סביבה (envMapIntensity)" hint="כמה חזק מפת הסביבה מאירה את החומר. 0 = החומר נראה כמעט שחור." value={p.envMapIntensity} min={0} max={3} onChange={set('envMapIntensity')} />
            <Slider label="ברק בד (sheen)" hint="ברק רך בקצוות — נותן מראה של קטיפה או בד." value={p.sheen ?? 0} onChange={set('sheen')} />
          </>
        }
      />
    </Section>
  )
}
