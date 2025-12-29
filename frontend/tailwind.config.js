/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          apple: {
            // Light mode
            bg: '#ffffff',
            bgSecondary: '#f5f5f7',
            bgTertiary: '#e8e8ed',
            separator: 'rgba(60, 60, 67, 0.12)',
            label: '#1d1d1f',
            labelSecondary: '#86868b',
            labelTertiary: '#aeaeb2',
            // Dark mode
            darkBg: '#000000',
            darkBgSecondary: '#1c1c1e',
            darkBgTertiary: '#2c2c2e',
            darkBgElevated: '#3a3a3c',
            darkSeparator: 'rgba(84, 84, 88, 0.65)',
            darkLabel: '#f5f5f7',
            darkLabelSecondary: '#98989d',
            // Accent
            blue: '#007AFF',
            blueHover: '#0071e3',
            green: '#34c759',
            gray: '#8e8e93',
          }
        },
        fontFamily: {
          sf: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        },
        borderRadius: {
          'apple': '12px',
          'apple-lg': '18px',
          'apple-xl': '22px',
        },
        boxShadow: {
          'apple': '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.08)',
          'apple-lg': '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.12)',
          'apple-dark': '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 24px rgba(0, 0, 0, 0.4)',
        },
        animation: {
          'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        keyframes: {
          fadeUp: {
            '0%': { opacity: '0', transform: 'translateY(12px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          scaleIn: {
            '0%': { opacity: '0', transform: 'scale(0.95)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
          },
          slideInRight: {
            '0%': { opacity: '0', transform: 'translateX(-12px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
          },
        },
      },
    },
    plugins: [],
  }
  