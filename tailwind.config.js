/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#f0f4ff',
            100: '#e0e9ff',
            500: '#667eea',
            600: '#5568d3',
            700: '#764ba2',
          },
          /** Brand teal — dashboard, playground, primary actions */
          brand: {
            teal: '#059A9F',
            'teal-hover': '#048489',
          },
          /** Auth pages */
          surface: {
            page: '#F8F9FA',
            input: '#F4F4F4',
          },
        },
        borderRadius: {
          auth: '24px',
        },
        boxShadow: {
          'auth-card': '0 4px 24px rgba(15, 23, 42, 0.06)',
        },
        fontFamily: {
          sans: [
            'Poppins',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'sans-serif',
          ],
          meichat: ["'Poppins'", 'sans-serif'],
        },
      },
    },
    plugins: [],
  };
