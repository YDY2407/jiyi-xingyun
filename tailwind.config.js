/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#06080b',
        ink: '#101419',
        mist: '#d8e7e7',
        ion: '#79e1d0',
        ember: '#ffbd6e',
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
        sans: ['Inter', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-up': 'fade-up 900ms cubic-bezier(.2,.8,.2,1) both',
        'slow-pulse': 'slow-pulse 4s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slow-pulse': {
          '0%, 100%': { opacity: '.45' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
