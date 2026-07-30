import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ScanLine, FileEdit } from 'lucide-react';

interface ExpandableActionMenuProps {
  onAdd: () => void;
  onScan?: () => void;
  addText?: string;
  scanText?: string;
}

export default function ExpandableActionMenu({ 
  onAdd, 
  onScan,
  addText = "Add Manual",
  scanText = "Scan Receipt"
}: ExpandableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center" 
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <motion.div
        layout
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        className={`relative flex items-center shadow-[0_4px_16px_rgba(16,185,129,0.3)] border ${
          isOpen 
            ? 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-800 shadow-xl' 
            : 'bg-[#10B981] border-[#10B981] hover:bg-[#059669]'
        }`}
        style={{ borderRadius: 100, overflow: 'hidden' }}
      >
        <AnimatePresence mode="popLayout">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
              animate={{ opacity: 1, width: 'auto', paddingLeft: 8, paddingRight: 4 }}
              exit={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
              className="flex items-center gap-1 py-1"
            >
              {onScan && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onScan(); setIsOpen(false); }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-full text-[13.5px] font-bold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ScanLine className="w-4 h-4" />
                  {scanText}
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onAdd(); setIsOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-3 rounded-full text-[13.5px] font-bold text-[#10B981] hover:text-[#059669] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileEdit className="w-4 h-4" />
                {addText}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`flex items-center justify-center rounded-full transition-colors shrink-0 z-10 m-1 cursor-pointer ${
            isOpen 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 w-11 h-11 hover:bg-gray-200 dark:hover:bg-gray-700' 
              : 'bg-transparent text-white w-14 h-14'
          }`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
          >
            <Plus className={isOpen ? "w-5 h-5" : "w-6 h-6"} strokeWidth={isOpen ? 2.5 : 2.5} />
          </motion.div>
        </motion.button>
      </motion.div>
    </div>
  );
}
