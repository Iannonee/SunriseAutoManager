import { useState } from 'react';

function parsePrice(s: string): number {
  // Accept both Italian (1.234,56) and plain (1234.56) formats
  const cleaned = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function formatPrice(s: string): string {
  const n = parsePrice(s);
  if (!s.trim()) return '';
  return n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export default function PriceInput({ value, onChange, placeholder = '0', className, style, onFocus, onBlur }: PriceInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={focused ? value : formatPrice(value)}
      onChange={e => onChange(e.target.value)}
      onFocus={e => { setFocused(true); onFocus?.(e); }}
      onBlur={e => {
        setFocused(false);
        const n = parsePrice(value);
        onChange(n ? String(n) : '');
        onBlur?.(e);
      }}
      placeholder={placeholder}
      className={className}
      style={style}
    />
  );
}

export { parsePrice };
