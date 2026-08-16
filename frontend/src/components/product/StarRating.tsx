import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  className = '',
}: StarRatingProps) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            className={`transition-transform duration-200 ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
            aria-label={`${star}`}
          >
            <Star size={size} fill={filled ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </div>
  );
}
