import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Building2,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Briefcase,
  Users,
  CalendarClock,
  Send,
  X,
  BadgeCheck,
  Factory,
  Clock,
  Quote,
} from 'lucide-react';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useB2bCompany } from '../hooks/b2b/useB2bCompany.ts';
import { useSubmitB2bLead } from '../hooks/b2b/useSubmitB2bLead.ts';
import { useToast } from '../hooks/useToast.ts';
import { parseApiError } from '../utils/errors.ts';
import type { B2bLeadBudgetRange } from '../types/b2b.ts';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';

const BUDGET_OPTIONS: { value: B2bLeadBudgetRange | ''; label: string }[] = [
  { value: '', label: 'غير محدد' },
  { value: 'under_10k', label: 'أقل من 10,000 ريال' },
  { value: '10k_50k', label: '10,000 - 50,000 ريال' },
  { value: '50k_200k', label: '50,000 - 200,000 ريال' },
  { value: 'over_200k', label: 'أكثر من 200,000 ريال' },
];

export default function B2BCompanyPage() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data, isPending, isError, error, refetch } = useB2bCompany(slug);
  const submitLead = useSubmitB2bLead(slug ?? '');

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [details, setDetails] = useState('');
  const [budgetRange, setBudgetRange] = useState<B2bLeadBudgetRange | ''>('');

  const company = data?.company;

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = FALLBACK_IMG;
  };

  const openQuoteModal = () => {
    if (!isAuthenticated) {
      toast.warning('يرجى تسجيل الدخول لإرسال طلب عرض سعر');
      navigate('/login', { state: { from: `/b2b/${slug}` } });
      return;
    }
    setIsQuoteModalOpen(true);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    try {
      await submitLead.mutateAsync({
        project_type: projectType,
        estimated_quantity: estimatedQuantity || undefined,
        details,
        budget_range: budgetRange || 'unspecified',
      });
      setQuoteSent(true);
      setProjectType('');
      setEstimatedQuantity('');
      setDetails('');
      setBudgetRange('');
      setTimeout(() => {
        setIsQuoteModalOpen(false);
        setQuoteSent(false);
      }, 3000);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'تعذر إرسال الطلب');
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 animate-pulse" dir="rtl">
        <div className="h-56 md:h-72 bg-gray-200" />
        <div className="max-w-6xl mx-auto px-4 -mt-20">
          <div className="bg-white rounded-3xl h-48 border border-gray-100" />
        </div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 px-4" dir="rtl">
        <div className="max-w-3xl mx-auto pt-20">
          <ErrorState error={error} onRetry={() => refetch()} />
          <div className="text-center mt-6">
            <Link to="/b2b" className="text-diyar-brown font-bold hover:underline cursor-pointer">
              العودة إلى دليل B2B
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const logo =
    company.logo ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=F3ECDB&color=947961&size=200&bold=true`;

  const stats = [
    {
      icon: CalendarClock,
      label: 'سنوات الخبرة',
      value: company.stats.years_experience ? `+${company.stats.years_experience}` : '—',
    },
    {
      icon: Briefcase,
      label: 'مشروع منجز',
      value: `+${company.stats.completed_projects}`,
    },
    {
      icon: Users,
      label: 'حجم الفريق',
      value: company.stats.team_size_label ?? (company.stats.team_size ? String(company.stats.team_size) : '—'),
    },
  ];

  const portfolio =
    company.portfolio?.map((p) => p.cover_image ?? FALLBACK_IMG) ??
    [];

  const contact = {
    phone: company.phone ?? '',
    email: company.email ?? '',
    website: company.website ?? '',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <div className="h-56 md:h-72 w-full relative overflow-hidden bg-diyar-dark">
        <img
          src={company.cover_image ?? FALLBACK_IMG}
          alt={company.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={onImgError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-diyar-dark/90 via-diyar-dark/40 to-diyar-dark/30" />
        <Link
          to="/b2b"
          className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-diyar-dark transition z-10 cursor-pointer"
        >
          <ArrowRight size={20} />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20 z-10">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden shrink-0 -mt-16 md:-mt-20 relative z-20">
              <img src={logo} alt={company.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {company.category?.name ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-diyar-brown bg-diyar-cream/50 px-2.5 py-1 rounded-md">
                    <Building2 size={13} /> {company.category.name}
                  </span>
                ) : null}
                {company.verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                    <BadgeCheck size={13} /> موثّقة
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-2 leading-snug">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                {company.location ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-diyar-brown" /> {company.location}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-diyar-dark">{company.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({company.reviews_count} تقييم)</span>
                </span>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={openQuoteModal}
                data-testid="b2b-rfq-open"
                className="w-full md:w-auto bg-diyar-brown text-white px-8 py-3 rounded-xl font-bold hover:bg-diyar-dark transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={18} /> طلب عرض سعر
              </button>
              <div className="flex justify-center gap-2">
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone}`}
                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-diyar-brown transition cursor-pointer"
                  >
                    <Phone size={18} />
                  </a>
                ) : null}
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-diyar-brown transition cursor-pointer"
                  >
                    <Mail size={18} />
                  </a>
                ) : null}
                {contact.website ? (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-diyar-brown transition cursor-pointer"
                  >
                    <Globe size={18} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 pt-6 border-t border-gray-100">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 bg-gray-50/70 rounded-2xl p-3 md:p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-diyar-cream text-diyar-brown flex items-center justify-center shrink-0">
                  <s.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-diyar-dark text-base md:text-lg leading-none">{s.value}</p>
                  <p className="text-[11px] md:text-xs text-gray-500 mt-1 truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                <Factory size={20} className="text-diyar-brown" /> عن الشركة
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {company.about ?? company.description ?? '—'}
              </p>
              {company.tags && company.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-6">
                  {company.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-gray-50 text-gray-600 text-sm px-3 py-1.5 rounded-lg border border-gray-100"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {portfolio.length > 0 ? (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-diyar-dark mb-5 flex items-center gap-2">
                  <Briefcase size={20} className="text-diyar-brown" /> معرض الأعمال
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {portfolio.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-2xl overflow-hidden group relative bg-gray-100 cursor-pointer"
                    >
                      <img
                        src={img}
                        alt={`عمل ${i + 1}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={onImgError}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {company.testimonials && company.testimonials.length > 0 ? (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-diyar-dark mb-5 flex items-center gap-2">
                  <Star size={20} className="text-amber-400 fill-amber-400" /> آراء شركاء الأعمال
                </h2>
                <div className="flex flex-col gap-4">
                  {company.testimonials.map((r) => (
                    <div key={r.id} className="bg-gray-50/70 rounded-2xl p-4 md:p-5 relative">
                      <Quote size={28} className="absolute top-4 left-4 text-gray-200" />
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold text-sm shrink-0 border border-diyar-brown/20">
                            {r.author_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-diyar-dark text-sm truncate">{r.author_name}</h4>
                            {r.author_role ? (
                              <span className="text-[11px] text-gray-500">{r.author_role}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={
                                s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-diyar-dark text-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-1.5">هل لديك مشروع؟</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-5">
                احصل على عرض سعر مخصص من {company.name} خلال 24 ساعة.
              </p>
              <button
                type="button"
                onClick={openQuoteModal}
                className="w-full bg-diyar-cream text-diyar-dark py-3 rounded-xl font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={18} /> طلب عرض سعر
              </button>
            </div>

            {company.services && company.services.length > 0 ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-diyar-dark mb-4">الخدمات المقدمة</h3>
                <ul className="flex flex-col gap-3">
                  {company.services.map((service) => (
                    <li key={service.id} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={18} className="text-diyar-brown shrink-0 mt-0.5" />
                      <span>{service.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-diyar-dark mb-4">معلومات التواصل</h3>
              <div className="flex flex-col gap-3 text-sm">
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 text-gray-600 hover:text-diyar-brown transition cursor-pointer"
                  >
                    <Phone size={16} className="text-diyar-brown shrink-0" />
                    <span dir="ltr">{contact.phone}</span>
                  </a>
                ) : null}
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-3 text-gray-600 hover:text-diyar-brown transition cursor-pointer"
                  >
                    <Mail size={16} className="text-diyar-brown shrink-0" />
                    <span dir="ltr" className="truncate">
                      {contact.email}
                    </span>
                  </a>
                ) : null}
                {contact.website ? (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-diyar-brown transition cursor-pointer"
                  >
                    <Globe size={16} className="text-diyar-brown shrink-0" />
                    <span dir="ltr" className="truncate">{contact.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                ) : null}
                <div className="flex items-center gap-3 text-gray-600 pt-3 mt-1 border-t border-gray-50">
                  <Clock size={16} className="text-diyar-brown shrink-0" /> الأحد - الخميس، 8ص - 5م
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isQuoteModalOpen ? (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="b2b-rfq-title"
        >
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            {quoteSent ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={30} />
                </div>
                <h2 className="text-2xl font-bold text-diyar-dark mb-2" data-testid="b2b-rfq-success">
                  تم الإرسال بنجاح!
                </h2>
                <p className="text-gray-500">سيتم التواصل معك من قبل الشركة في أقرب وقت ممكن.</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center border border-diyar-brown/15">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h2 id="b2b-rfq-title" className="text-lg font-bold text-diyar-dark leading-tight">
                        طلب عرض سعر
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">{company.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(false)}
                    className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-diyar-dark hover:bg-gray-100 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleQuoteSubmit} className="flex flex-col gap-4 p-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      نوع المشروع / الطلب <span className="text-diyar-brown">*</span>
                    </label>
                    <input
                      data-testid="b2b-rfq-project-type"
                      type="text"
                      required
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      placeholder="مثال: تأثيث فندق، شراء جملة..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">الكمية المقدّرة</label>
                    <input
                      type="text"
                      value={estimatedQuantity}
                      onChange={(e) => setEstimatedQuantity(e.target.value)}
                      placeholder="مثال: 50 طقم كنب"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      التفاصيل الكاملة <span className="text-diyar-brown">*</span>
                    </label>
                    <textarea
                      data-testid="b2b-rfq-details"
                      rows={4}
                      required
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="اشرح احتياجاتك بالتفصيل ليتمكن المورد من تقديم عرض دقيق..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      الميزانية التقديرية (اختياري)
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value as B2bLeadBudgetRange | '')}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition"
                    >
                      {BUDGET_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={submitLead.isPending}
                      data-testid="b2b-rfq-submit"
                      className="flex-1 bg-diyar-brown text-white py-3 rounded-xl font-bold hover:bg-diyar-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Send size={16} /> {submitLead.isPending ? 'جاري الإرسال…' : 'إرسال الطلب'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(false)}
                      className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
