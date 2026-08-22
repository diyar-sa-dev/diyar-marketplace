import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AboutModal } from '../components/layout/AboutModal.tsx';

type AboutModalContextValue = {
  openAboutModal: () => void;
  closeAboutModal: () => void;
};

const AboutModalContext = createContext<AboutModalContextValue | null>(null);

export function AboutModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAboutModal = useCallback(() => setIsOpen(true), []);
  const closeAboutModal = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ openAboutModal, closeAboutModal }),
    [openAboutModal, closeAboutModal],
  );

  return (
    <AboutModalContext.Provider value={value}>
      {children}
      <AboutModal isOpen={isOpen} onClose={closeAboutModal} />
    </AboutModalContext.Provider>
  );
}

export function useAboutModal(): AboutModalContextValue {
  const context = useContext(AboutModalContext);
  if (!context) {
    throw new Error('useAboutModal must be used within AboutModalProvider');
  }

  return context;
}
