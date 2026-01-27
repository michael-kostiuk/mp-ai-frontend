import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiProvider } from './context/ApiContext';
import App from './App.tsx';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider>
      <App />
    </ApiProvider>
  </StrictMode>
);
