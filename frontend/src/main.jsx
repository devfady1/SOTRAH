import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import MedicalAuthPage from './pages/MedicalAuthPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Main Sotrah Showcase Landing Page */}
        <Route path="/" element={<App />} />

        {/* Dedicated Standalone Medical Auth & Clinical Telemetry Pages */}
        <Route path="/login" element={<MedicalAuthPage initialTab="login" />} />
        <Route path="/register" element={<MedicalAuthPage initialTab="register" />} />
        <Route path="/portal" element={<MedicalAuthPage initialTab="login" />} />
        <Route path="/medical" element={<MedicalAuthPage initialTab="login" />} />

        {/* Fallback to Home */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
