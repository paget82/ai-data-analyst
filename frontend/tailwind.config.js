/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0B0E14',
        },
        surface: {
          DEFAULT: '#151923',
        },
        bubble: {
          ai: '#151923',
          user: '#2E3440',
          input: '#1F2433',
        },
        border: {
          subtle: '#2E3A59',
        },
        teal: {
          start: '#00E0C6',
          end: '#00BFA5',
        },
        danger: {
          DEFAULT: '#FF4757',
          alt: '#FF3E6C',
        },
        aiPurple: {
          DEFAULT: '#8854D0',
          alt: '#7D5FFF',
        },
        success: {
          DEFAULT: '#2ECC71',
        },
      },
      fontFamily: {
        display: ['"Manrope"', 'Inter', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        pill: '999px',
      },
      boxShadow: {
        card: '0px 10px 40px rgba(0,0,0,0.2)',
      },
      keyframes: {
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        fadeSlideIn: 'fadeSlideIn 0.35s ease-out both',
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
        glow: 'glow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
