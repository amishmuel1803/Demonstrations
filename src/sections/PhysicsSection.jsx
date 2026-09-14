import { useCallback, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider, useRapier, useSphericalJoint } from '@react-three/rapier'
import Section, { DemoLayout } from '../components/ui/Section'
import LazyCanvas from '../components/LazyCanvas'
import Slider from '../components/ui/Slider'
import Btn from '../components/ui/Btn'
import { useQuality } from '../hooks/useQuality'
import { physics as cfg } from '../config'

const palette = ['#f43f5e', '#f59e0b', '#22d3ee', '#a78bfa', '#34d399', '#fb7185', '#facc15']
const rnd = (a, b) => a + Math.random() * (b - a)

/** מייצר רשימת גופים אקראיים (קוביות וכדורים) מעל הרצפה. */
function makeBodies(n, startId = 0) {
  return Array.from({ length: n }, (_, i) => ({
    id: startId + i,
    shape: Math.random() < 0.55 ? 'box' : 'ball',
    pos: [rnd(-1.5, 1.5), 4 + i * 0.9, rnd(-1.5, 1.5)],
    size: rnd(0.35, 0.6),
    color: palette[Math.floor(Math.random() * palette.length)],
  }))
}

/**
 * גוף שאפשר לגרור עם העכבר ולזרוק.
 * הטריק: בזמן גרירה הופכים את הגוף ל"קינמטי" (הפיזיקה לא מזיזה אותו — אנחנו כן),
 * מזיזים אותו למקום העכבר, וכשמשחררים מחזירים ל"דינמי" ונותנים לו את מהירות היד.
 */
function Draggable({ children, position, onDragChange, ...rbProps }) {
  const body = useRef(null)
  const { rapier } = useRapier()
  const { camera, raycaster } = useThree()
  const drag = useRef(null) // { plane, last: Vector3, vel: Vector3, t }

  const onDown = (e) => {
    e.stopPropagation()
    e.target.setPointerCapture(e.pointerId)
    const rb = body.current
    const p = rb.translation()
    const normal = new THREE.Vector3()
    camera.getWorldDirection(normal)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(p.x, p.y, p.z))
    drag.current = { plane, last: new THREE.Vector3(p.x, p.y, p.z), vel: new THREE.Vector3(), t: performance.now() }
    rb.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true)
    onDragChange?.(true)
  }
  const onMove = (e) => {
    if (!drag.current) return
    const hit = new THREE.Vector3()
    if (!raycaster.ray.intersectPlane(drag.current.plane, hit)) return
    const now = performance.now()
    const dt = Math.max((now - drag.current.t) / 1000, 1e-3)
    drag.current.vel.copy(hit).sub(drag.current.last).divideScalar(dt)
    drag.current.last.copy(hit)
    drag.current.t = now
    body.current.setNextKinematicTranslation({ x: hit.x, y: Math.max(hit.y, 0.3), z: hit.z })
  }
  const onUp = (e) => {
    if (!drag.current) return
    e.target.releasePointerCapture?.(e.pointerId)
    const v = drag.current.vel.clampLength(0, 25)
    body.current.setBodyType(rapier.RigidBodyType.Dynamic, true)
    body.current.setLinvel({ x: v.x, y: v.y, z: v.z }, true)
    drag.current = null
    onDragChange?.(false)
  }

  return (
    <RigidBody ref={body} position={position} restitution={cfg.restitution} friction={cfg.friction} {...rbProps}>
      <group onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {children}
      </group>
    </RigidBody>
  )
}

function Body({ b, onDragChange }) {
  return (
    <Draggable position={b.pos} colliders={b.shape === 'box' ? 'cuboid' : 'ball'} onDragChange={onDragChange} angularVelocity={[rnd(-2, 2), rnd(-2, 2), rnd(-2, 2)]}>
      <mesh castShadow receiveShadow>
        {b.shape === 'box' ? <boxGeometry args={[b.size, b.size, b.size]} /> : <sphereGeometry args={[b.size / 2, 32, 32]} />}
        <meshStandardMaterial color={b.color} roughness={0.5} />
      </mesh>
    </Draggable>
  )
}

/** רצפה + קירות שקופים כדי שכלום לא יברח מהמסך. */
function Floor() {
  return (
    <RigidBody type="fixed" friction={1}>
      <mesh receiveShadow position={[0, -0.25, 0]}>
        <boxGeometry args={[16, 0.5, 12]} />
        <meshStandardMaterial color="#27272a" />
      </mesh>
      <CuboidCollider args={[8, 4, 0.2]} position={[0, 4, -6]} />
      <CuboidCollider args={[8, 4, 0.2]} position={[0, 4, 6]} />
      <CuboidCollider args={[0.2, 4, 6]} position={[-8, 4, 0]} />
      <CuboidCollider args={[0.2, 4, 6]} position={[8, 4, 0]} />
    </RigidBody>
  )
}

/** שורת דומינו. הכפתור "הפל דומינו" דוחף את הראשונה. */
function Dominoes({ firstRef }) {
  const n = cfg.dominoCount
  return (
    <group position={[-7, 0, -4.8]}>
      {Array.from({ length: n }, (_, i) => (
        <RigidBody key={i} ref={i === 0 ? firstRef : undefined} position={[i * 0.75, 0.6, 0]} colliders="cuboid" restitution={0.1} friction={0.7}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.15, 1.2, 0.6]} />
            <meshStandardMaterial color={i % 2 ? '#e4e4e7' : '#22d3ee'} roughness={0.4} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  )
}

/** מטוטלת: עוגן קבוע + כדור, מחוברים במפרק כדורי (spherical joint). את הכדור אפשר לגרור. */
function Pendulum({ onDragChange }) {
  const anchor = useRef(null)
  const ball = useRef(null)
  const line = useRef(null)
  useSphericalJoint(anchor, ball, [[0, 0, 0], [0, 3, 0]])
  const positions = useMemo(() => new Float32Array(6), [])
  useFrame(() => {
    if (!anchor.current || !ball.current || !line.current) return
    const a = anchor.current.translation(), b = ball.current.translation()
    positions.set([a.x, a.y, a.z, b.x, b.y, b.z])
    line.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <group>
      <RigidBody ref={anchor} type="fixed" position={[5.5, 5.5, -3]}>
        <mesh><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#a1a1aa" /></mesh>
      </RigidBody>
      <Draggable position={[5.5, 2.5, -3]} colliders="ball" onDragChange={onDragChange} restitution={0.2} linearDamping={0.05}>
        <mesh castShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.25} />
        </mesh>
      </Draggable>
      <line ref={line}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#d4d4d8" />
      </line>
    </group>
  )
}

export default function PhysicsSection() {
  const { tier } = useQuality()
  const [gravity, setGravity] = useState(cfg.gravity)
  const [bodies, setBodies] = useState(() => makeBodies(tier.physicsBodies))
  const [round, setRound] = useState(0)
  const [dragging, setDragging] = useState(false)
  const nextId = useRef(1000)
  const firstDomino = useRef(null)

  const throwMore = () => setBodies((b) => { const add = makeBodies(cfg.throwBatch, nextId.current); nextId.current += cfg.throwBatch; return [...b, ...add] })
  const reset = () => { setBodies(makeBodies(tier.physicsBodies)); setRound((r) => r + 1) }
  const pushDomino = () => firstDomino.current?.applyImpulse({ x: 1.2, y: 0, z: 0 }, true)
  const onDragChange = useCallback((v) => setDragging(v), [])

  return (
    <Section
      id="physics"
      number={4}
      title="פיזיקה"
      what="ערימת קוביות וכדורים שנופלים, מתנגשים ונערמים; שורת דומינו; מטוטלת. אפשר לגרור כל גוף עם העכבר (או האצבע) ולזרוק אותו."
      enables="התנהגות 'אמיתית' בלי לכתוב אנימציה ידנית: המנוע מחשב כבידה, חיכוך, התנגשויות ומפרקים. מתאים למשחקים, לאלמנטים שמגיבים למשתמש, ולהדגמות מוצר."
      cost="Rapier רץ ב-WebAssembly (קוד מהיר בדפדפן). עשרות גופים — זול. מאות — עדיין בסדר במחשב. הבעיה בטלפון: כל התנגשות עולה חישוב, וערימות גדולות מתחילות לרעוד."
      costLabel="בינוני"
    >
      <DemoLayout
        demoClass="h-[420px] md:h-[500px]"
        demo={
          <LazyCanvas className="h-full" camera={{ position: [0, 7, 13], fov: 45 }} shadows>
            <color attach="background" args={['#0f0f12']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[6, 10, 4]} intensity={2} castShadow shadow-mapSize={[tier.shadowMapSize, tier.shadowMapSize]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
            <Physics key={round} gravity={[0, gravity, 0]}>
              <Floor />
              {bodies.map((b) => <Body key={b.id} b={b} onDragChange={onDragChange} />)}
              <Dominoes firstRef={firstDomino} />
              <Pendulum onDragChange={onDragChange} />
            </Physics>
            <OrbitControls enabled={!dragging} enablePan={false} minDistance={6} maxDistance={24} maxPolarAngle={Math.PI / 2.1} target={[0, 1, 0]} />
          </LazyCanvas>
        }
        controls={
          <>
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={throwMore}>זרוק עוד ({cfg.throwBatch})</Btn>
              <Btn onClick={reset}>אפס</Btn>
              <Btn onClick={pushDomino} className="col-span-2">הפל דומינו</Btn>
            </div>
            <div className="text-xs text-zinc-400">גופים על המסך: <b className="text-zinc-100">{bodies.length}</b></div>
            <Slider label="כבידה" hint="-9.81 = כדור הארץ. 0 = חלל (הכול צף). ערך חיובי = הכול עף למעלה." value={gravity} min={cfg.gravityMin} max={cfg.gravityMax} step={0.1} onChange={setGravity} />
            <div className="rounded-lg bg-zinc-800/60 p-3 text-[12px] leading-relaxed text-zinc-300">
              <b className="text-zinc-100">גרירה וזריקה:</b> לחצו על גוף וגררו. בזמן הגרירה הגוף הופך ל"קינמטי" (אנחנו מזיזים, לא הפיזיקה),
              ובשחרור הוא מקבל את מהירות היד וממשיך לעוף. הכדור הצהוב של המטוטלת קשור לעוגן במפרק — גררו אותו ושחררו.
            </div>
          </>
        }
      />
    </Section>
  )
}
