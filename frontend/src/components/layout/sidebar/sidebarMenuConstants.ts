export const CATEGORIES = {
  bedroom: {
    name: 'غرف النوم',
    subcategories: ['أسرة', 'خزائن ملابس', 'تسريحات', 'طاولات جانبية', 'مراتب'],
  },
  'living-room': {
    name: 'الصالونات',
    subcategories: ['أطقم كنب', 'كراسي استرخاء', 'طاولات قهوة', 'طاولات تلفزيون', 'مكتبات'],
  },
  kitchen: {
    name: 'المطابخ',
    subcategories: ['خزائن مطابخ', 'طاولات طعام', 'كراسي طعام', 'عربات تقديم'],
  },
  office: {
    name: 'المكاتب',
    subcategories: ['مكاتب إدارية', 'كراسي مكتبية', 'وحدات أدراج', 'مكتبات مكتبية'],
  },
  decor: {
    name: 'ديكورات',
    subcategories: ['إضاءة', 'سجاد', 'لوحات جدارية', 'مرايا', 'نباتات زينة'],
  },
  'interior-design': {
    name: 'تصميم داخلي',
    subcategories: ['تصميم سكني', 'تصميم تجاري', 'استشارات', 'مخططات معمارية'],
  },
  maintenance: {
    name: 'تركيب وصيانة',
    subcategories: ['تركيب أثاث', 'صيانة خشبية', 'تنجيد', 'دهانات'],
  },
};

export const ROOM_BACKGROUNDS = [
  {
    id: 'majlis',
    name: 'المجلس التراثي الأصيل',
    img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'salon',
    name: 'صالون مودرن دافئ',
    img: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'bedroom',
    name: 'جناح النوم الفاخر',
    img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',
  },
];

export const STICKERS = [
  {
    id: 'sofa1',
    name: 'كنبة ملكية كرزية',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 160,
  },
  {
    id: 'table',
    name: 'طاولة قهوة رخامية',
    img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 110,
  },
  {
    id: 'chair',
    name: 'كرسي استرخاء مخمل',
    img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 100,
  },
  {
    id: 'plant',
    name: 'نبات زينة داخلي',
    img: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 80,
  },
];

export type StickerDefinition = (typeof STICKERS)[number];

export type ActiveStickerItem = {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  img: string;
  name: string;
};
