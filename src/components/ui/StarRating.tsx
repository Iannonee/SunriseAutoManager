import { IconStar } from '@tabler/icons-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className="transition-all"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: readonly ? 'default' : 'pointer',
              backgroundColor: active ? '#e8a02015' : 'transparent',
              border: `0.5px solid ${active ? '#e8a02066' : '#2a2a2a'}`,
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => {
              if (!readonly) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8a02044';
              }
            }}
            onMouseLeave={e => {
              if (!readonly) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = active ? '#e8a02066' : '#2a2a2a';
              }
            }}
          >
            <IconStar
              size={14}
              style={{ color: active ? '#e8a020' : '#444444' }}
              fill={active ? '#e8a020' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
}
