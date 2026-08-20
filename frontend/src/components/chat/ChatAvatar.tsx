import { UserAvatar } from '../profile/UserAvatar.tsx';

type ChatAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
  online?: boolean;
};

export function ChatAvatar({ name, avatarUrl, size = 'sm', online = false }: ChatAvatarProps) {
  const indicator = size === 'md' ? 'w-3 h-3 border-2' : 'w-2.5 h-2.5 border-[1.5px]';

  return (
    <div className="relative shrink-0 inline-flex">
      <UserAvatar name={name} avatarUrl={avatarUrl} size={size === 'md' ? 'md' : 'sm'} />
      {online ? (
        <span
          className={`absolute bottom-0 inset-e-0 rounded-full bg-emerald-500 border-white ${indicator}`}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
