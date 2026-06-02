import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { routerBasename } from './utils/assetUrl.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename || undefined}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
