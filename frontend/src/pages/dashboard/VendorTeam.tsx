import React, { useState } from 'react';
import { Plus, UserCog, Shield, MoreHorizontal, Edit, Trash2, X } from 'lucide-react';

export default function VendorTeam() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const MOCK_TEAM = [
    { id: 1, name: 'خالد عبدالله', email: 'khalid@example.com', role: 'owner', status: 'active' },
    { id: 2, name: 'سارة محمد', email: 'sara@example.com', role: 'manager', status: 'active' },
    { id: 3, name: 'أحمد علي', email: 'ahmed@example.com', role: 'support', status: 'invited' },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Shield size={12}/> مالك المتجر</span>;
      case 'manager': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">مدير المتجر</span>;
      case 'support': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold">خدمة العملاء</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">فريق العمل</h2>
          <p className="text-gray-500 text-sm mt-1">إدارة دعوات الفريق وصلاحياتهم داخل المتجر.</p>
        </div>
        
        <button onClick={() => setIsInviteModalOpen(true)} className="bg-diyar-brown text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition">
          <Plus size={18} />
          دعوة عضو جديد
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MOCK_TEAM.map((member) => (
          <div key={member.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400">
                 {member.name.charAt(0)}
               </div>
               <div>
                  <h3 className="font-bold text-diyar-dark text-lg flex items-center gap-2">
                    {member.name}
                    {member.status === 'invited' && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 font-normal">دعوة معلقة</span>
                    )}
                  </h3>
                  <p className="text-gray-500 text-sm">{member.email}</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 border-t border-gray-100 md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
               <div>
                 <p className="text-xs text-gray-400 mb-1">الصلاحية</p>
                 {getRoleBadge(member.role)}
               </div>
               
               <div className="flex gap-2">
                 {member.role !== 'owner' && (
                   <>
                     <button className="p-2 text-gray-400 hover:text-blue-500 transition bg-gray-50 rounded-lg hover:bg-blue-50" title="تعديل الصلاحية">
                       <Edit size={18} />
                     </button>
                     <button className="p-2 text-gray-400 hover:text-red-500 transition bg-gray-50 rounded-lg hover:bg-red-50" title="حذف">
                       <Trash2 size={18} />
                     </button>
                   </>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-diyar-dark">دعوة عضو جديد</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                 <input type="email" placeholder="email@example.com" className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown" dir="ltr" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">الصلاحية</label>
                 <select className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown appearance-none">
                   <option>مدير المتجر</option>
                   <option>خدمة العملاء</option>
                 </select>
               </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 mt-4 shrink-0">
               <button onClick={() => setIsInviteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">إلغاء</button>
               <button onClick={() => setIsInviteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-diyar-brown text-white hover:bg-[#A67B5B]/90 transition">إرسال الدعوة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
