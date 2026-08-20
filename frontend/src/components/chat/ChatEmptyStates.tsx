import { MessageSquare, MessagesSquare } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar.tsx';

type ChatSidebarEmptyProps = {
  title: string;
  hint: string;
};

export function ChatSidebarEmpty({ title, hint }: ChatSidebarEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="w-16 h-16 rounded-2xl bg-diyar-cream/50 border border-diyar-cream flex items-center justify-center mb-4">
        <MessagesSquare className="w-8 h-8 text-diyar-brown/70" />
      </div>
      <p className="font-bold text-diyar-dark text-sm">{title}</p>
      <p className="text-xs text-gray-500 mt-2 max-w-[16rem] leading-relaxed">{hint}</p>
    </div>
  );
}

type ChatSelectConversationProps = {
  title: string;
  hint: string;
};

export function ChatSelectConversation({ title, hint }: ChatSelectConversationProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-linear-to-b from-[#faf9f7] to-white">
      <div className="w-20 h-20 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
        <MessageSquare className="w-10 h-10 text-gray-300" />
      </div>
      <p className="font-bold text-diyar-dark">{title}</p>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">{hint}</p>
    </div>
  );
}

type ChatThreadEmptyProps = {
  name?: string | null;
  avatarUrl?: string | null;
  title: string;
  hint: string;
};

export function ChatThreadEmpty({ name, avatarUrl, title, hint }: ChatThreadEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <ChatAvatar name={name} avatarUrl={avatarUrl} size="md" online />
      <p className="font-bold text-diyar-dark mt-4">{title}</p>
      <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">{hint}</p>
    </div>
  );
}
