import { useMemo } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'

/**
 * סביבות תאורה שנבנות בקוד — בלי קבצי HDR חיצוניים.
 *
 * מה זה "מפת סביבה" (environment map)?
 * תמונה פנורמית של 360° שעוטפת את הסצנה. חומרים מבריקים "משקפים" אותה,
 * וחומרים מטים מקבלים ממנה תאורה רכה מכל הכיוונים. בלי מפת סביבה, מתכת וזכוכית
 * נראות שחורות ומתות — אין להן מה לשקף.
 *
 * כאן במקום צילום אמיתי, אנחנו מציירים סצנה קטנה (כיפת שמיים + "מנורות" מלבניות)
 * ו-drei מצלם אותה פעם אחת לתוך מפת סביבה.
 */

/** כיפת שמיים עם גרדיאנט: צבע למעלה, באופק, ולמטה. */
function GradientDome({ top, horizon, bottom, exponent = 0.6 }) {
  const args = useMemo(() => ({
    uniforms: {
      top: { value: new THREE.Color(top) },
      horizon: { value: new THREE.Color(horizon) },
      bottom: { value: new THREE.Color(bottom) },
      exponent: { value: exponent },
    },
    vertexShader: `varying vec3 vWorld; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform float exponent;
      varying vec3 vWorld;
      void main(){
        float h = normalize(vWorld).y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(h, exponent)) : mix(horizon, bottom, pow(-h, exponent));
        gl_FragColor = vec4(c, 1.0);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
  }), [top, horizon, bottom, exponent])
  return (
    <mesh scale={100}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial args={[args]} />
    </mesh>
  )
}

const presets = {
  // סטודיו רך: רקע אפור, "סופטבוקס" גדול מלמעלה, אור מפתח מימין ואור מילוי משמאל
  studio: {
    label: 'סטודיו רך',
    desc: 'שלוש מנורות מלבניות רכות על רקע אפור. השתקפויות מלבניות ונקיות — ככה מצלמים מוצרים.',
    scene: (
      <>
        <GradientDome top="#3a3a3f" horizon="#2a2a2e" bottom="#151517" />
        <Lightformer form="rect" intensity={4} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[6, 2, 2]} rotation-y={-Math.PI / 2.5} scale={[3, 4, 1]} color="#fff3e0" />
        <Lightformer form="rect" intensity={1.5} position={[-6, 1, 1]} rotation-y={Math.PI / 2.5} scale={[3, 3, 1]} color="#e0f2ff" />
      </>
    ),
  },
  daylight: {
    label: 'אור יום',
    desc: 'שמיים כחולים, שמש קטנה וחזקה, קרקע חומה. צללים חדים והבהובים (highlights) נקודתיים.',
    scene: (
      <>
        <GradientDome top="#4a90e2" horizon="#cfe6ff" bottom="#7a6a55" exponent={0.5} />
        <Lightformer form="circle" intensity={40} position={[4, 8, 3]} scale={1.2} color="#fff8e7" target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} color="#a08a6a" />
      </>
    ),
  },
  sunset: {
    label: 'שקיעה',
    desc: 'שמש כתומה נמוכה באופק, שמיים סגולים למעלה. כל ההשתקפויות נצבעות בחום-כתום.',
    scene: (
      <>
        <GradientDome top="#2b1b4d" horizon="#ff8c42" bottom="#3a2a25" exponent={0.8} />
        <Lightformer form="circle" intensity={25} position={[8, 1.2, -3]} scale={2.5} color="#ffb060" target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 3, 2]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} color="#c084fc" />
      </>
    ),
  },
  room: {
    label: 'חדר עם חלונות',
    desc: 'קירות כהים ושלושה חלונות בהירים. ההשתקפויות הן מלבנים — רואים "חלון" על כל משטח מבריק.',
    scene: (
      <>
        <GradientDome top="#2a2622" horizon="#1e1b18" bottom="#141210" exponent={1} />
        <Lightformer form="rect" intensity={6} position={[-7, 2, 0]} rotation-y={Math.PI / 2} scale={[2.5, 3.5, 1]} color="#dbeafe" />
        <Lightformer form="rect" intensity={6} position={[7, 2, 0]} rotation-y={-Math.PI / 2} scale={[2.5, 3.5, 1]} color="#dbeafe" />
        <Lightformer form="rect" intensity={4} position={[0, 2, -7]} scale={[3, 3.5, 1]} color="#e0f2fe" />
        <Lightformer form="circle" intensity={2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={1.2} color="#ffd9a0" />
      </>
    ),
  },
}

export const environmentPresets = presets

export default function ProceduralEnvironment({ name = 'studio', rotation = 0, background = false, blur = 0 }) {
  const p = presets[name] || presets.studio
  return (
    <Environment
      resolution={256}
      background={background}
      backgroundBlurriness={blur}
      environmentRotation={[0, rotation, 0]}
      backgroundRotation={[0, rotation, 0]}
    >
      {p.scene}
    </Environment>
  )
}
