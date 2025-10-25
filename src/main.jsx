console.log('VITE env snapshot:', {
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  ALGOLIA_APP_ID: import.meta.env.VITE_ALGOLIA_APP_ID,
  ALGOLIA_KEY: import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
