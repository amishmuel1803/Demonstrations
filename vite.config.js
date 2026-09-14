import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true },
  // מכינים מראש את הספריות הכבדות, כדי ש-Vite לא יעצור באמצע הטעינה הראשונה כדי "לגלות" אותן
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier', '@react-three/postprocessing', 'postprocessing', 'gsap', '@gsap/react'],
  },
})
