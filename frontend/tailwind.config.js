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
        // Warm charcoal surface progression
        // WHY warm: Cold blue-gray = generic dashboard. Warm charcoal = editorial authority.
        // Each step is ~4% lightness increment with slight warm undertone.
        surface: {
          0: '#121110',   // canvas — warm near-black
          1: '#1a1816',   // primary background
          2: '#232120',   // card / container
          3: '#2e2c2a',   // elevated surface
          4: '#3a3836',   // hover / highest
        },

        // Border hierarchy — warm white at low opacity
        // WHY rgba: Blends with any surface below, no harsh edges
        border: {
          DEFAULT: 'rgba(255, 245, 230, 0.07)',
          emphasis: 'rgba(255, 245, 230, 0.13)',
          strong: 'rgba(255, 245, 230, 0.20)',
        },

        // Amber accent — urgency, highlights, "pay attention"
        // WHY amber: The color of wire tickers, flash alerts, candlelight on paper
        amber: {
          DEFAULT: '#d4922a',
          light: '#e8aa44',
          muted: 'rgba(212, 146, 42, 0.15)',
          subtle: 'rgba(212, 146, 42, 0.08)',
        },

        // Investment signal colors — the only "loud" color in the system
        // WHY slightly desaturated: Dark mode needs softer saturation to avoid eye strain
        signal: {
          up: '#4aad72',
          'up-muted': 'rgba(74, 173, 114, 0.12)',
          down: '#c85050',
          'down-muted': 'rgba(200, 80, 80, 0.12)',
          flat: '#88827c',
          'flat-muted': 'rgba(136, 130, 124, 0.10)',
        },

        // Text hierarchy — warm off-whites
        // WHY warm: Pure white (#fff) on dark bg feels clinical. Warm off-white feels editorial.
        txt: {
          primary: '#e6ded4',    // headings, important text
          secondary: '#9a928a',  // body text, descriptions
          muted: '#6a645e',      // metadata, labels
          faint: '#4a4642',      // disabled, decorative
        },

        // Legacy compat — keep glass refs for components not yet redesigned
        glass: {
          DEFAULT: 'rgba(255, 245, 230, 0.04)',
          hover: 'rgba(255, 245, 230, 0.07)',
          border: 'rgba(255, 245, 230, 0.07)',
        },

        // Keep accent for panel tabs and legacy components
        accent: {
          DEFAULT: '#d4922a',
          light: '#e8aa44',
        },

        // Keep sentiment scale for gauge (legacy)
        sentiment: {
          fear: '#c85050',
          caution: '#d48a3a',
          neutral: '#c8a830',
          positive: '#4aad72',
          greed: '#3a9a62',
        },
      },

      fontFamily: {
        // WHY Outfit: Geometric, modern, great for large editorial headlines (English)
        // WHY Pretendard: The best Korean UI font — clean, extensive weights, tabular figures
        display: ['"Outfit"', '"Pretendard Variable"', 'system-ui', 'sans-serif'],
        body: ['"Pretendard Variable"', '"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        // Editorial headline scale
        'hero': ['2.25rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'hero-sm': ['1.5rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],
        'card-title': ['1.0625rem', { lineHeight: '1.4', fontWeight: '600' }],
      },

      // Borders-only depth — no shadows anywhere
      // WHY: Shadows on dark backgrounds are nearly invisible. Borders are honest.
      boxShadow: {
        'none': 'none',
        'panel': '-1px 0 0 0 rgba(255, 245, 230, 0.07)',
      },

      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
      },

      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
