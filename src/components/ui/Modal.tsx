import { IconX, IconEdit } from '@tabler/icons-react';
import { ReactNode, ComponentType } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  icon?: ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
}

export default function Modal({ title, onClose, children, wide, icon: Icon = IconEdit }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${wide ? 'max-w-[560px]' : 'max-w-[480px]'} max-h-[90vh] overflow-y-auto`}
        style={{
          backgroundColor: '#0f0f0f',
          border: '0.5px solid #e8a02044',
          borderRadius: '12px',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{
            backgroundColor: '#0f0f0f',
            borderBottom: '0.5px solid #1e1e1e',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Icon size={18} style={{ color: '#e8a020' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#888888' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#cccccc')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
          >
            <IconX size={16} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}
