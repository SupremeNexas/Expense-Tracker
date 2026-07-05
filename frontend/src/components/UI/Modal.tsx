import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  description?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '500px', description }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-effect animate-scale-in" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth }}
      >
        <div className="modal-header flex flex-col items-start gap-1 p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-bold text-lg">{title}</h3>
            <button className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 cursor-pointer" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          {description && <p className="text-xs text-gray-400 font-medium">{description}</p>}
        </div>
        <div className="modal-body p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
export default Modal;
