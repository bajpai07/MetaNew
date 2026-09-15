/** @type {import('tailwindcss').Config} */
// Mirrors the tokens in src/index.css. Colour and type live in one place;
// nothing in a component should invent its own hex value.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14110F',
          raised: '#1C1815',
          sunken: '#0E0C0B'
        },
        bone: {
          DEFAULT: '#EDE7DE',
          dim: 'rgba(237,231,222,0.62)'
        },
        ash: '#8F857A',
        oxblood: {
          DEFAULT: '#5E1A22',
          deep: '#4A1219'
        },
        paper: {
          DEFAULT: '#EDE7DE',
          raised: '#E3DCD1',
          ink: '#14110F',
          ash: '#6B6259'
        }
      },
      fontFamily: {
        display: ['Bodoni Moda', 'Didot', 'Times New Roman', 'serif'],
        body: ['Instrument Sans', '-apple-system', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif']
      },
      fontSize: {
        micro: ['11px', { lineHeight: '1.4', letterSpacing: '0.18em' }],
        s: ['13px', { lineHeight: '1.6' }],
        body: ['15px', { lineHeight: '1.65' }],
        m: ['17px', { lineHeight: '1.6' }]
      },
      letterSpacing: {
        wide: '0.18em',
        mark: '0.34em'
      },
      borderColor: {
        veil: 'rgba(237,231,222,0.10)',
        'veil-strong': 'rgba(237,231,222,0.22)'
      },
      transitionTimingFunction: {
        drape: 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      transitionDuration: {
        micro: '240ms',
        state: '600ms',
        reveal: '1100ms'
      },
      maxWidth: {
        measure: '34em',
        shell: '1440px'
      }
    }
  },
  plugins: []
}
