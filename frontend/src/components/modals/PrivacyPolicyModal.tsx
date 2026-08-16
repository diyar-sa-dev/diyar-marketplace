import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        aria-label="إغلاق سياسة الخصوصية"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-title"
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <h2 id="privacy-policy-title" className="text-lg font-bold text-diyar-dark">
            سياسة الخصوصية
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-diyar-dark cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 text-sm leading-relaxed text-gray-600 space-y-4">
          <p>
            نحن في منصة ديار نلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع بياناتك واستخدامها
            وحمايتها عند استخدامك لخدماتنا.
          </p>
          <section>
            <h3 className="font-bold text-diyar-dark mb-1">البيانات التي نجمعها</h3>
            <p>
              قد نجمع معلومات الحساب مثل الاسم ورقم الجوال والبريد الإلكتروني، بالإضافة إلى بيانات
              الاستخدام اللازمة لتقديم الخدمة وتحسين تجربتك.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-diyar-dark mb-1">كيف نستخدم بياناتك</h3>
            <p>
              نستخدم بياناتك لإنشاء حسابك، التحقق من هويتك، معالجة الطلبات، تقديم الدعم، وإرسال
              إشعارات مهمة متعلقة بالخدمة.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-diyar-dark mb-1">حماية البيانات</h3>
            <p>
              نطبق إجراءات أمنية مناسبة لحماية بياناتك من الوصول أو الاستخدام غير المصرح به، بما في
              ذلك التشفير وضوابط الوصول.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-diyar-dark mb-1">حقوقك</h3>
            <p>
              يمكنك طلب تحديث بياناتك أو حذف حسابك وفقاً للأنظمة المعمول بها. للاستفسارات، تواصل
              مع فريق دعم ديار.
            </p>
          </section>
          <p className="text-xs text-gray-400">آخر تحديث: أغسطس 2026</p>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-diyar-dark py-3 font-bold text-white transition-colors hover:bg-black cursor-pointer"
          >
            فهمت
          </button>
        </div>
      </div>
    </div>
  );
}
