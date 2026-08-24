import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import 'katex/dist/katex.min.css';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      {/* Vercel Web Analytics & Core Web Vitals Speed Monitoring */}
      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  </StrictMode>,
);
