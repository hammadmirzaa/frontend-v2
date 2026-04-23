# src

Top-level entry point for the meichat React frontend, wiring up routing, providers, global styles, and runtime configuration.

## Files

| File | Description |
|------|-------------|
| `App.css` | Global gradient background and gradient-text utility classes used across the app. |
| `App.jsx` | Root React component that sets up React Query, AuthProvider, BrowserRouter, and routes for login, signup, dashboard, embed, and subscription pages with a ProtectedRoute guard. |
| `config.js` | Loads frontend runtime configuration from Vite environment variables and exposes the backend `API_URL`. |
| `index.css` | Tailwind CSS entry file with base font styles, box-sizing reset, and the toast slide-in animation. |
| `main.jsx` | React 18 bootstrap that mounts the `App` component into the `#root` element using `createRoot` inside `StrictMode`. |
