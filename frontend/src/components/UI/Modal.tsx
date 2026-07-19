import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const modalRef = useRef<HTMLDivElement>(null);

  // 1. ESC close key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 2. Simple Focus Trapping
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modalElement = modalRef.current;
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element on open
    if (firstElement) {
      setTimeout(() => firstElement.focus(), 50);
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener('keydown', handleTabKey);
    return () => {
      modalElement.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay-wrapper">
          {/* Overlay Background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="modal-overlay" 
            onClick={onClose} 
          />

          {/* Modal Container */}
          <div className="modal-container-inner">
            <motion.div 
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="modal-content glass-effect" 
              onClick={e => e.stopPropagation()}
              style={{ maxWidth }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="modal-header flex flex-col items-start gap-1 p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center justify-between w-full">
                  <h3 id="modal-title" className="font-bold text-lg">{title}</h3>
                  <button 
                    className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
                {description && <p className="text-xs text-gray-400 font-medium">{description}</p>}
              </div>
              <div className="modal-body p-6 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
