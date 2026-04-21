/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#F0EFEC',
          card: '#FAFAF8',
          sidebar: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E2E0DA',
          subtle: '#ECEAE5',
        },
        text: {
          primary: '#1A1916',
          secondary: '#6B6860',
          muted: '#9C9A93',
        },
        accent: {
          DEFAULT: '#5B4DCC',
          light: '#EEF0FF',
          hover: '#4A3DB8',
        },
        status: {
          green: '#15803D',
          greenBg: '#F0FDF4',
          amber: '#B45309',
          amberBg: '#FFFBEB',
          red: '#B91C1C',
          redBg: '#FEF2F2',
          blue: '#1D4ED8',
          blueBg: '#EFF6FF',
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
