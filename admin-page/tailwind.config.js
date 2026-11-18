/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--tw-${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Every shade is a CSS variable (index.css), redefined per theme, so legacy Tailwind classes such as
      // bg-admin-50 or text-danger-600 follow light/dark mode like the token-styled pages do.
      colors: {
        admin: {
          50: v('admin-50'),
          100: v('admin-100'),
          200: v('admin-200'),
          300: v('admin-300'),
          400: v('admin-400'),
          500: v('admin-500'),
          600: v('admin-600'),
          700: v('admin-700'),
          800: v('admin-800'),
          900: v('admin-900'),
          950: v('admin-950'),
        },
        primary: {
          50: v('primary-50'),
          100: v('primary-100'),
          200: v('primary-200'),
          300: v('primary-300'),
          400: v('primary-400'),
          500: v('primary-500'),
          600: v('primary-600'),
          700: v('primary-700'),
          800: v('primary-800'),
          900: v('primary-900'),
          950: v('primary-950'),
        },
        success: {
          50: v('success-50'),
          100: v('success-100'),
          200: v('success-200'),
          300: v('success-300'),
          500: v('success-500'),
          600: v('success-600'),
          700: v('success-700'),
          800: v('success-800'),
          900: v('success-900'),
        },
        warning: {
          50: v('warning-50'),
          100: v('warning-100'),
          200: v('warning-200'),
          300: v('warning-300'),
          500: v('warning-500'),
          600: v('warning-600'),
          700: v('warning-700'),
          800: v('warning-800'),
          900: v('warning-900'),
        },
        danger: {
          50: v('danger-50'),
          100: v('danger-100'),
          200: v('danger-200'),
          300: v('danger-300'),
          500: v('danger-500'),
          600: v('danger-600'),
          700: v('danger-700'),
          800: v('danger-800'),
          900: v('danger-900'),
        },
        info: {
          50: v('info-50'),
          100: v('info-100'),
          200: v('info-200'),
          300: v('info-300'),
          500: v('info-500'),
          600: v('info-600'),
          700: v('info-700'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}