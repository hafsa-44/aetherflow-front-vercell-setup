/**@type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

/*@type {import('tailwindcss').Config} 
module.exports = {
  content: [
    "./src/**.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AetherFlow Custom Palette
        background: '#F8FAFC', // Ultra-soft gray-blue (App background)
        surface: '#FFFFFF',    // Pure white (Cards/Panels)
        primary: '#0F172A',    // Deep Slate (Sidebar/Heavy Headers)
        accent: {
          DEFAULT: '#4F46E5',  // Indigo-600 (Primary Actions)
          hover: '#4338CA',    // Indigo-700
          light: '#EEF2FF',    // Indigo-50 (Soft backgrounds)
        },
        muted: '#64748B',      // Slate-500 (Secondary text)
        border: '#E2E8F0',     // Slate-200 (Subtle dividers)
        danger: {
          DEFAULT: '#EF4444',  // Red-500
          soft: '#FEF2F2',     // Red-50
        }
      },
      boxShadow: {
        'saaS': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'saaS-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'saaS': '12px',
      },
      spacing: {
        'nav': '72px',      // Fixed TopNav height
        'sidebar': '260px', // Expanded Sidebar width
        'sidebar-sm': '80px' // Collapsed Sidebar width
      }
    },
  },
  plugins: [],
}*/