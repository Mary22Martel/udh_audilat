import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Fuentes empaquetadas localmente: funcionan sin internet y no hay "salto" de texto.
import '@fontsource-variable/manrope';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/jetbrains-mono';
import App from './App';
import './index.css';
import { SesionProvider } from './lib/sesion';
import { aplicarTema } from './lib/tema';

aplicarTema();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>
);
