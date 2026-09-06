import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, MessageSquareHeart, X, MessageSquareText, Sparkles } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { fetchWebsiteFeedbackStatus } from '../../api/websiteFeedback.ts';
import {
  getOrCreateWebsiteFeedbackGuestKey,
  hasSubmittedWebsiteFeedback,
} from '../../lib/websiteFeedbackStorage.ts';
import { WebsiteFeedbackModal } from '../feedback/WebsiteFeedbackModal.tsx';
import { PlatformContactModal } from './PlatformContactModal.tsx';

function ContactActionButton({
  onClick,
  title,
  hint,
  children,
}: {
  onClick: () => void;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 group relative bg-white border border-gray-100 shadow-lg text-diyar-dark p-3 rounded-full hover:bg-gray-50 transition-all font-bold text-sm cursor-pointer"
      aria-label={title}
      title={title}
    >
      <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
        {hint}
      </span>
      {children}
    </button>
  );
}

export function FloatingContactBar() {
  const { t } = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const [localSubmitted, setLocalSubmitted] = useState(false);

  useEffect(() => {
    setLocalSubmitted(false);
  }, [user?.id]);

  const guestKey = useMemo(
    () => (user ? undefined : getOrCreateWebsiteFeedbackGuestKey()),
    [user],
  );

  const { data: apiSubmitted } = useQuery({
    queryKey: ['website-feedback-status', user?.id ?? null, guestKey ?? null],
    queryFn: () => fetchWebsiteFeedbackStatus(guestKey),
    staleTime: 120_000,
  });

  const feedbackSubmitted =
    localSubmitted || apiSubmitted === true || hasSubmittedWebsiteFeedback(user?.id);

  const handleFeedbackSubmitted = () => {
    setLocalSubmitted(true);
    void queryClient.invalidateQueries({ queryKey: ['website-feedback-status'] });
  };

  const openContact = () => {
    setIsOpen(false);
    setContactOpen(true);
  };

  const actionButtons = (
    <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <Link
        to="/ai-designer"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-2 group relative bg-diyar-brown text-white shadow-lg shadow-diyar-brown/20 p-3 rounded-full hover:bg-diyar-dark transition-all font-bold text-sm cursor-pointer"
        title={t('layout.contactBar.expertConsultation')}
      >
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
          {t('layout.contactBar.expertConsultation')}
        </span>
        <Sparkles size={22} />
      </Link>

      {!feedbackSubmitted && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setFeedbackOpen(true);
          }}
          className="flex items-center gap-2 group relative bg-white border border-gray-100 shadow-lg text-diyar-dark p-3 rounded-full hover:bg-gray-50 transition-all font-bold text-sm cursor-pointer"
          title={t('layout.contactBar.websiteFeedback')}
        >
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs whitespace-nowrap rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
            {t('layout.contactBar.websiteFeedback')}
          </span>
          <MessageSquareHeart size={22} className="text-diyar-dark" />
        </button>
      )}

      <ContactActionButton
        onClick={openContact}
        title={t('layout.sidebar.contact')}
        hint={t('layout.contactBar.callUsHint')}
      >
        <Phone size={22} className="text-diyar-brown" />
      </ContactActionButton>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-center gap-3">
        {isOpen && actionButtons}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-diyar-dark text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none ring-4 ring-diyar-dark/10 cursor-pointer"
          aria-label={isOpen ? t('layout.contactBar.closeMenu') : t('layout.contactBar.openMenu')}
        >
          {isOpen ? <X size={26} /> : <MessageSquareText size={26} />}
        </button>
      </div>

      <WebsiteFeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmitted={handleFeedbackSubmitted}
      />
      <PlatformContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
