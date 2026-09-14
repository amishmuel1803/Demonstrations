import { useCallback, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider, BallCollider } from '@react-three/rapier'
import Section, { DemoLayout } from '../components/ui/Section'
import LazyCanvas from '../components/LazyCanvas'
import Btn from '../components/ui/Btn'
import { useQuality } from '../hooks/useQuality'
import { game as cfg } from '../config'

const BLOCK = [0.9, 0.5, 0.9]
const PLATFORM_Y = 0.5

/** המגדל: rows שורות של cols בלוקים. כל בלוק גוף פיזיקלי. */
function Tower({ registerBlock }) {
  const blocks = []
  for (let r = 0; r < cfg.towerRows; r++) {
    for (let c = 0; c < cfg.towerCols; c++) {
      const i = r * cfg.towerCols + c
      blocks.push(
        <RigidBody
          key={i}
          ref={(el) => registerBlock(i, el)}
          position={[(c - (cfg.towerCols - 1) / 2) * BLOCK[0] * 1.02, PLATFORM_Y + BLOCK[1] / 2 + r * BLOCK[1] * 1.01, -4]}
          colliders="cuboid"
          restitution={0.05}
          friction={0.8}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={BLOCK} />
            <meshStandardMaterial color={r % 2 ? '#fb923c' : '#f59e0b'} roughness={0.6} />
          </mesh>
        </RigidBody>,
      )
    }
  }
  return <>{blocks}</>
}

/** רץ כל פריים: בודק אילו בלוקים נפלו מתחת לבמה ומעדכן ניקוד. */
function ScoreWatcher({ blocksRef, onScore }) {
  const counted = useRef(new Set())
  useFrame(() => {
    let changed = false
    blocksRef.current.forEach((rb, i) => {
      if (!rb || counted.current.has(i)) return
      if (rb.translation().y < PLATFORM_Y - 1) { counted.current.add(i); changed = true }
    })
    if (changed) onScore(counted.current.size)
  })
  return null
}

function Ball({ b }) {
  return (
    // המסה יושבת על ה-collider (הצורה הפיזיקלית), לא על הגוף — לכן מגדירים אותו ידנית
    <RigidBody position={b.pos} linearVelocity={b.vel} colliders={false} restitution={0.3} ccd>
      <BallCollider args={[0.35]} mass={cfg.ballMass} />
      <mesh castShadow>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#e4e4e7" metalness={0.9} roughness={0.2} />
      </mesh>
    </RigidBody>
  )
}

export default function GameSection() {
  const { tier } = useQuality()
  const [round, setRound] = useState(0)
  const [balls, setBalls] = useState([])
  const [score, setScore] = useState(0)
  const [aim, setAim] = useState(null) // { x0,y0,x1,y1 } בפיקסלים, לציור החץ
  const blocksRef = useRef([])
  const wrap = useRef(null)
  const ballsLeft = cfg.ballsPerRound - balls.length
  const total = cfg.towerRows * cfg.towerCols

  const registerBlock = useCallback((i, el) => { blocksRef.current[i] = el }, [])
  const newRound = () => { blocksRef.current = []; setBalls([]); setScore(0); setRound((r) => r + 1) }

  // כיוון וירי: גוררים אחורה (כמו רוגטקה) ומשחררים. עובד עם עכבר ועם אצבע — פוינטר אחד לשניהם.
  const onDown = (e) => {
    if (ballsLeft <= 0) return
    wrap.current.setPointerCapture(e.pointerId)
    const r = wrap.current.getBoundingClientRect()
    setAim({ x0: e.clientX - r.left, y0: e.clientY - r.top, x1: e.clientX - r.left, y1: e.clientY - r.top })
  }
  const onMove = (e) => {
    if (!aim) return
    const r = wrap.current.getBoundingClientRect()
    setAim((a) => ({ ...a, x1: e.clientX - r.left, y1: e.clientY - r.top }))
  }
  const onUp = () => {
    if (!aim) return
    const dx = aim.x0 - aim.x1, dy = aim.y0 - aim.y1
    const len = Math.hypot(dx, dy)
    setAim(null)
    if (len < 15) return // לחיצה בלי גרירה — לא יורים
    const p = Math.min(len / 220, 1) * cfg.launchPower
    // רוגטקה: גוררים למטה → הכדור עף למעלה (לכן המינוס ב-dy); קדימה (ציר -z) לפי אורך הגרירה
    setBalls((b) => [...b, { id: Date.now(), pos: [0, 1.2, 6], vel: [(dx / len) * p * 0.35, (-dy / len) * p * 0.22 + 1, -p] }])
  }

  return (
    <Section
      id="game"
      number={5}
      title="משחק: הפל את המגדל"
      what="מגדל בלוקים על במה, וכדור שיורים בו. גוררים אחורה ומשחררים — כמו רוגטקה. כל בלוק שנופל מהבמה = נקודה. חמישה כדורים לסיבוב."
      enables="משחק פיזיקלי שלם ב-150 שורות: המנוע עושה את ההתנגשויות, אנחנו רק סופרים מי נפל. עובד גם במגע בטלפון (אותם אירועי pointer)."
      cost="כמו הדגמת הפיזיקה — 18 בלוקים + כמה כדורים זה זול. ה-ccd על הכדור (בדיקה רציפה שלא יעבור דרך בלוקים במהירות) מוסיף קצת."
      costLabel="בינוני"
    >
      <DemoLayout
        demoClass="h-[420px] md:h-[500px] select-none"
        demo={
          <div ref={wrap} className="relative h-full touch-none cursor-crosshair" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <LazyCanvas className="h-full pointer-events-none" camera={{ position: [0, 4.5, 11], fov: 42 }} shadows>
              <color attach="background" args={['#0c1220']} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 10, 6]} intensity={2.2} castShadow shadow-mapSize={[tier.shadowMapSize, tier.shadowMapSize]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
              <Physics key={round} gravity={[0, -9.81, 0]}>
                <RigidBody type="fixed">
                  <mesh receiveShadow position={[0, PLATFORM_Y / 2, -3]}>
                    <boxGeometry args={[6, PLATFORM_Y, 6]} />
                    <meshStandardMaterial color="#334155" />
                  </mesh>
                  <mesh receiveShadow position={[0, -1.5, 0]}>
                    <boxGeometry args={[40, 0.2, 40]} />
                    <meshStandardMaterial color="#0f172a" />
                  </mesh>
                  <CuboidCollider args={[20, 0.1, 20]} position={[0, -1.5, 0]} />
                </RigidBody>
                <Tower registerBlock={registerBlock} />
                {balls.map((b) => <Ball key={b.id} b={b} />)}
                <ScoreWatcher blocksRef={blocksRef} onScore={setScore} />
              </Physics>
              {/* מיקום היציאה של הכדור — כדי שיהיה ברור מאיפה יורים */}
              <mesh position={[0, 1.2, 6]}>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshBasicMaterial color="#22d3ee" wireframe />
              </mesh>
            </LazyCanvas>
            {aim && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1={aim.x0} y1={aim.y0} x2={aim.x1} y2={aim.y1} stroke="#22d3ee" strokeWidth="3" strokeDasharray="6 4" />
                <circle cx={aim.x0} cy={aim.y0} r="6" fill="#22d3ee" />
              </svg>
            )}
            <div className="absolute top-3 right-3 rounded-lg bg-zinc-900/80 px-3 py-2 text-sm">
              <div>ניקוד: <b className="text-amber-300 text-lg">{score}</b> / {total}</div>
              <div className="text-zinc-400 text-xs">כדורים: {'●'.repeat(ballsLeft)}{'○'.repeat(cfg.ballsPerRound - ballsLeft)}</div>
            </div>
            {ballsLeft <= 0 && (
              <div className="absolute inset-x-0 bottom-4 text-center text-sm text-zinc-200">נגמרו הכדורים — לחצו "סיבוב חדש"</div>
            )}
          </div>
        }
        controls={
          <>
            <Btn onClick={newRound}>סיבוב חדש</Btn>
            <div className="rounded-lg bg-zinc-800/60 p-3 text-[12px] leading-relaxed text-zinc-300">
              <b className="text-zinc-100">איך משחקים:</b> לחצו על אזור המשחק, גררו אחורה (למטה/הצידה) ושחררו. ככל שגוררים יותר — הכדור חזק יותר.
              הכדור יוצא מהעיגול התכלת. הניקוד עולה כשבלוק נופל מהבמה.
            </div>
            <div className="rounded-lg bg-zinc-800/60 p-3 text-[12px] leading-relaxed text-zinc-300">
              <b className="text-zinc-100">מה קורה בקוד:</b> כל פריים עוברים על הבלוקים ובודקים אם הגובה שלהם ירד מתחת לבמה.
              זה כל ה"לוגיקה" של המשחק. ההגדרות (גובה מגדל, כוח ירי, מספר כדורים) ב-<code>config.js › game</code>.
            </div>
          </>
        }
      />
    </Section>
  )
}
