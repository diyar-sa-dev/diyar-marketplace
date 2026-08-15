import React from 'react';
import { ChevronLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, Bookmark } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const MOCK_ARTICLE = {
  id: '1',
  title: 'أحدث اتجاهات التصميم الداخلي لعام 2024: العودة إلى الطبيعة',
  excerpt: 'اكتشف كيف يغير التصميم المستدام والألوان الترابية والمواد الطبيعية شكل منازلنا في العام الجديد.',
  content: `
    <p>يشهد عام 2024 تحولاً جذرياً في مفاهيم التصميم الداخلي، حيث نتجه بخطوات متسارعة نحو دمج الطبيعة في مساحاتنا المعيشية. لم يعد التصميم مجرد تنسيق للأثاث، بل أصبح خلق بيئة متوازنة تعزز الراحة النفسية والهدوء.</p>
    
    <h2>1. لوحة الألوان الترابية الدافئة</h2>
    <p>وداعاً للألوان الباردة والمحايدة جداً. ترحب تصاميم هذا العام بالدرجات الدافئة المستوحاة من الطبيعة. درجات التراكوتا (الآجر القديم)، الأخضر الزيتوني، البني الداكن، والبيج الدافئ تتصدر المشهد، مما يضفي شعوراً بالدفء والاحتواء.</p>
    
    <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200" alt="تصميم يسوده الألوان الترابية" />

    <h2>2. المواد الطبيعية والمستدامة</h2>
    <p>الاستدامة لم تعد خياراً، بل أسلوب حياة. نرى توجهاً كبيراً نحو الأثاث المصنوع من الخشب المعاد تدويره، الخيزران (البامبو)، الروطان، والمنسوجات العضوية مثل الكتان والقطن الصافي. بالإضافة إلى دمج الحجر الطبيعي غير المعالج في الطاولات وأسطح المطابخ.</p>
    
    <h2>3. الأشكال العضوية والمنحنيات</h2>
    <p>الحواف الحادة والخطوط المستقيمة تفسح المجال تدريجياً للتصاميم ذات الأشكال العضوية. الكنب المنحني، الطاولات الدائرية أو البيضاوية، والمرايا غير منتظمة الشكل تعكس انسيابية الطبيعة وتخفف من حدة الزوايا في الغرفة.</p>
    
    <h2>4. جلب الخارج إلى الداخل (التصميم البيوفيلي)</h2>
    <p>لا يقتصر هذا الاتجاه على وضع بعض النباتات في الزوايا. إنه دمج متكامل للعناصر الطبيعية؛ من خلال النوافذ الواسعة لإدخال أكبر قدر من الإضاءة الطبيعية، استخدام الجدران النباتية الحية (Green walls)، وتوظيف النوافير الداخلية الصغيرة.</p>

    <blockquote>
      "التصميم الناجح في 2024 هو الذي يجعلك تشعر وكأنك في ملاذ آمن، متصل بالطبيعة حتى وأنت في قلب المدينة." - خبير التصميم الداخلي في ديار
    </blockquote>

    <h2>نصيحة ديار لك:</h2>
    <p>لا تحتاج إلى تغيير أثاث منزلك بالكامل لمواكبة هذه الاتجاهات. يمكنك البدء بإضافة بعض الوسائد بألوان ترابية، وضع سجادة من الجوت، أو تزيين طاولة القهوة بقطع من الفخار والنباتات الطبيعية لتجديد طاقة المكان.</p>
  `,
  coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1600',
  date: '15 مايو 2024',
  readTime: '4 دقائق قراءة',
  author: {
    name: 'فريق ديار',
    avatar: 'https://ui-avatars.com/api/?name=Diyar&background=F3F4F6&color=4B5563',
    role: 'خبراء التصميم والمفروشات'
  },
  tags: ['تصميم داخلي', 'ديكور 2024', 'مستدامة', 'أثاث منزلي']
};

const RELATED_ARTICLES = [
  {
    id: '2',
    title: 'كيف تختار الإضاءة المناسبة لكل غرفة في منزلك؟',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
    date: '10 مايو 2024',
    category: 'إضاءة'
  },
  {
    id: '3',
    title: 'دليلك الشامل لاختيار السجاد المناسب لمساحتك',
    image: 'https://images.unsplash.com/photo-1579600161222-4f9c9b0b4a49?auto=format&fit=crop&q=80&w=600',
    date: '3 مايو 2024',
    category: 'أثاث ومفروشات'
  },
  {
    id: '4',
    title: '5 أخطاء شائعة في تأثيث الصالات الصغيرة وكيفية تجنبها',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600',
    date: '28 أبريل 2024',
    category: 'نصائح ديكور'
  }
];

export default function BlogArticlePage() {
  const { id } = useParams();
  
  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12 font-sans">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">الرئيسية</Link>
            <ChevronLeft size={16} />
            <Link to="/blog" className="hover:text-diyar-dark transition">مدونة ديار</Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark line-clamp-1 truncate max-w-xs">{MOCK_ARTICLE.title}</span>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Article Header */}
        <header className="mb-8 md:mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {MOCK_ARTICLE.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="bg-diyar-brown/10 text-diyar-brown text-xs font-bold px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-diyar-dark leading-snug md:leading-snug mb-6">
            {MOCK_ARTICLE.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-between gap-6 border-y border-gray-200 py-4">
            <div className="flex items-center gap-4">
               <img src={MOCK_ARTICLE.author.avatar} alt={MOCK_ARTICLE.author.name} className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200" />
               <div>
                  <h3 className="font-bold text-gray-900">{MOCK_ARTICLE.author.name}</h3>
                  <p className="text-xs text-gray-500">{MOCK_ARTICLE.author.role}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} /> <span>{MOCK_ARTICLE.date}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <div className="flex items-center gap-1.5">
                <Clock size={16} /> <span>{MOCK_ARTICLE.readTime}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="rounded-3xl overflow-hidden mb-10 shadow-sm border border-gray-100 flex justify-center bg-gray-100">
          <img
            src={MOCK_ARTICLE.coverImage}
            alt={MOCK_ARTICLE.title}
            referrerPolicy="no-referrer"
            className="w-full max-h-[500px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1600"; }}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: MOCK_ARTICLE.content }}
            />
            
            {/* Tags Bottom */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap gap-2">
              <span className="text-gray-500 text-sm py-1.5 font-medium ml-2">الإشارات:</span>
              {MOCK_ARTICLE.tags.map((tag, idx) => (
                <Link key={idx} to={`/blog/tag/${tag}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-full transition-colors">
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-8">
            {/* Share & Actions */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
               <h3 className="font-bold text-diyar-dark mb-4 text-lg">شارك المقال</h3>
               <div className="flex gap-2 mb-6">
                 <button className="flex-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-500 h-10 rounded-xl flex items-center justify-center transition-colors">
                   <Facebook size={18} />
                 </button>
                 <button className="flex-1 bg-gray-50 hover:bg-sky-50 hover:text-sky-500 text-gray-500 h-10 rounded-xl flex items-center justify-center transition-colors">
                   <Twitter size={18} />
                 </button>
                 <button className="flex-1 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 h-10 rounded-xl flex items-center justify-center transition-colors">
                   <Linkedin size={18} />
                 </button>
                 <button className="flex-1 bg-gray-50 hover:bg-gray-200 text-gray-800 h-10 rounded-xl flex items-center justify-center transition-colors">
                   <LinkIcon size={18} />
                 </button>
               </div>
               
               <h3 className="font-bold text-diyar-dark mb-4 text-lg border-t border-gray-100 pt-6">تفاعلات</h3>
               <button className="w-full border-2 border-gray-100 text-gray-600 hover:border-diyar-brown hover:text-diyar-brown font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                 <Bookmark size={20} /> حفظ المقال
               </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <div className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-diyar-dark">مقالات ذات صلة</h2>
            <Link to="/blog" className="text-diyar-brown font-bold hover:text-diyar-dark transition-colors text-sm">عرض المدونة</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RELATED_ARTICLES.map((article) => (
              <Link key={article.id} to={`/blog/${article.id}`} className="group bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative">
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-diyar-dark text-xs font-bold px-3 py-1.5 rounded-full z-10">
                    {article.category}
                  </span>
                  <img src={article.image} alt={article.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600"; }} />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                    <Calendar size={14} /> <span>{article.date}</span>
                  </div>
                  <h3 className="font-bold text-lg text-diyar-dark group-hover:text-diyar-brown transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
