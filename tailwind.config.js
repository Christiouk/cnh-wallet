/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/providers/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F3F3F0',
          100: '#E8ECE7',
          200: '#D4DED5',
          300: '#B5C3B9',
          400: '#C9B08A',
          500: '#A4B5AA',
          600: '#8A9A90',
          700: '#6D7C73',
          800: '#53635A',
          900: '#394B41',
          950: '#27362E',
        },
        surface: {
          DEFAULT: '#0B0D0F',
          50: '#F3F3F0',
          100: '#E8ECE7',
          200: '#D5DBD6',
          300: '#BAC2BC',
          400: '#A2ACA5',
          500: '#929C95',
          600: '#7E8781',
          700: '#565B5E',
          800: '#2E3238',
          900: '#191D20',
          950: '#0B0D0F',
        },
        card: {
          DEFAULT: '#191D20',
          border: '#2E3238',
          hover: '#252A2E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 0, 0, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 0, 0, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
