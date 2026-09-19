import { Navigate, Route, Routes } from 'react-router-dom';
import DiyarComingSoonPage from './DiyarComingSoonPage.tsx';

export default function LandingApp() {
  return (
    <Routes>
      <Route path="/" element={<DiyarComingSoonPage />} />
      <Route path="/en" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
