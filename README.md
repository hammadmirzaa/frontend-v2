# Frontend

React frontend for the Knowledge Chatbot Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:8001
```

3. Run development server:
```bash
npm run dev
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── components/      # Reusable components
│   ├── Sidebar.jsx
│   ├── ChatbotTab.jsx
│   ├── DocumentsTab.jsx
│   └── EmbedPluginTab.jsx
├── pages/          # Page components
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   └── EmbedPage.jsx
├── contexts/       # React contexts
│   └── AuthContext.jsx
├── App.jsx         # Main app component
└── main.jsx        # Entry point
```

## Technologies

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- React Query

