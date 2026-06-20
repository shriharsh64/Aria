/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html'
  ],
  theme: {
    extend: {
      colors: {
        aria: {
          bg: '#0d0f14',
          surface: '#13161e',
          card: '#1a1e2a',
          border: '#252a38',
          accent: '#6c63ff',
          'accent-hover': '#5a52e0',
          muted: '#8892a4',
          text: '#e2e8f0',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: []
}
