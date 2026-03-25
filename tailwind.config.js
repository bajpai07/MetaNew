/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        rose: '#E8395A',
        black: '#0a0a0a',
        white: '#fafaf8',
        beige: '#f2ede6',
        muted: '#888888',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        slow_zoom: {
          '0%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1.15)' }
        },
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' }
        },
        shimmer_slide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        pulse_soft: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(0.98)' }
        },
        progress_bar: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '92%' }
        }
      },
      animation: {
        'slow-zoom': 'slow_zoom 20s ease-in-out infinite alternate',
        'shimmer-slide': 'shimmer_slide 2s infinite linear',
        'pulse-soft': 'pulse_soft 3s ease-in-out infinite',
        'progress-bar': 'progress_bar 6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
        'scan': 'scan 3s ease-in-out infinite alternate'
      }
    },
  },
  plugins: [],
}
