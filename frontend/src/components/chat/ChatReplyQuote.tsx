type ChatReplyQuoteProps = {
  senderName: string;
  preview: string;
  isMine: boolean;
};

export function ChatReplyQuote({ senderName, preview, isMine }: ChatReplyQuoteProps) {
  return (
    <div
      className={`mb-2 rounded-xl border-s-[3px] ps-2.5 pe-2 py-1.5 ${
        isMine ? 'border-white/60 bg-white/10' : 'border-diyar-brown/60 bg-diyar-cream/40'
      }`}
    >
      <p
        className={`text-[11px] font-bold truncate ${
          isMine ? 'text-white/95' : 'text-diyar-brown'
        }`}
      >
        {senderName}
      </p>
      <p
        className={`text-[11px] leading-snug truncate ${
          isMine ? 'text-white/75' : 'text-gray-500'
        }`}
      >
        {preview}
      </p>
    </div>
  );
}
