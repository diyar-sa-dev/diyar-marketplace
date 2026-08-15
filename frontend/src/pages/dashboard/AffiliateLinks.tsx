import React, { useState } from 'react';
import { LinkIcon, Copy, ExternalLink, Trash2 } from 'lucide-react';

export default function AffiliateLinks() {
  const MOCK_LINKS = [
    { id: 1, name: 'رابط التسويق لـ أريكة مخملية', url: 'https://diyar.sa/p/sofa-velvet?ref=ahm123', clicks: 145, conversions: 12, earn: 1500, date: '2024-05-10', isActive: true },
    { id: 2, name: 'رابط كرسي مكتب (عرض خاص)', url: 'https://diyar.sa/p/office-chair?ref=ahm123', clicks: 89, conversions: 5, earn: 337.5, date: '2024-05-12', isActive: true },
    { id: 3, name: 'حملة رمضان لغرف الطعام', url: 'https://diyar.sa/p/dining-table?ref=ahm123', clicks: 320, conversions: 0, earn: 0, date: '2024-03-01', isActive: false },
  ];

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">روابطي</h2>
          <p className="text-gray-500 text-sm mt-1">تتبع الروابط الخاصة بك وانسخها لمشاركتها مع الجمهور.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">اسم الرابط / المنتج</th>
                <th className="px-6 py-4 font-bold">الرابط</th>
                <th className="px-6 py-4 font-bold">النقرات</th>
                <th className="px-6 py-4 font-bold">التحويلات</th>
                <th className="px-6 py-4 font-bold">الأرباح</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_LINKS.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{link.name}</div>
                    <div className="text-xs text-gray-400 mt-1">تم الإنشاء: {link.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 max-w-[200px] overflow-hidden">
                      <span className="truncate text-gray-500" dir="ltr">{link.url}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{link.clicks}</td>
                  <td className="px-6 py-4 font-medium">{link.conversions}</td>
                  <td className="px-6 py-4 font-bold text-green-600">{link.earn} ر.س</td>
                  <td className="px-6 py-4">
                    {link.isActive ? (
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">نشط</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">متوقف</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                       <button onClick={() => handleCopy(link.url)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition" title="نسخ الرابط">
                         <Copy size={16} />
                       </button>
                       <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded-lg transition" title="فتح الرابط">
                         <ExternalLink size={16} />
                       </a>
                       <button className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition" title="حذف">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
