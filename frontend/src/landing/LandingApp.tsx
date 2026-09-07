import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import LandingPage from './LandingPage.tsx';
import { isLandingLocale } from './i18n/types.ts';

function LandingLocaleGate() {
  const { locale } = useParams();

  if (locale === 'fr') {
    return <Navigate to="/" replace />;
  }

  if (locale && !isLandingLocale(locale)) {
    return <Navigate to="/" replace />;
  }

  return <LandingPage />;
}

export default function LandingApp() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/:locale" element={<LandingLocaleGate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
