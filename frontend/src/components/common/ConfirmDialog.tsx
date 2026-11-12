import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  requireKeyword?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  confirmVariant = 'danger',
  requireKeyword,
  isLoading = false,
}) => {
  const [keywordInput, setKeywordInput] = useState('');

  const isKeywordValid = !requireKeyword || keywordInput.trim() === requireKeyword;

  const handleConfirm = () => {
    if (isKeywordValid && !isLoading) {
      onConfirm();
      setKeywordInput('');
    }
  };

  const handleClose = () => {
    setKeywordInput('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <div className="space-y-4 font-mono-tech">
        <div className="flex items-start space-x-3 p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl">
          <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="text-xs text-[#991B1B] leading-relaxed font-sans">{message}</div>
        </div>

        {requireKeyword && (
          <div className="space-y-1.5">
            <label className="text-xs text-[#101410] font-semibold">
              Type <span className="font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded border border-[#FCA5A5]">{requireKeyword}</span> to confirm overwrite authorization:
            </label>
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder={`Type ${requireKeyword}`}
              className="w-full px-3 py-2 bg-[#FAFCF6] border border-[#DC2626]/40 rounded-xl text-sm text-[#101410] font-bold placeholder-[#A3A3A3] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
            />
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#08482D]/10">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#08482D]/20 text-[#5E5E61] hover:bg-[#F5F8EF] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isKeywordValid || isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              confirmVariant === 'danger'
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
                : 'bg-[#08482D] hover:bg-[#063722] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
            }`}
          >
            {isLoading ? 'Executing Operation...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
