import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { InquiryItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item?: InquiryItem | null;
  inquiryNumber?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  inquiryNumber,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = onCancel || onClose || (() => {});
  const displayNum = item?.inquiryNumber || inquiryNumber || 'this inquiry';
  const customerInfo = item ? `${item.customerName}${item.product ? ` • ${item.product}` : ''}` : '';

  return (
    <div
      id="delete-confirm-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="delete-confirm-modal-card"
        className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Delete Sourcing Inquiry?</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Are you sure you want to permanently delete inquiry{' '}
              <strong className="text-rose-600 font-mono font-semibold">{displayNum}</strong>
              {customerInfo ? ` (${customerInfo})` : ''}?
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              This action cannot be undone. All quotes, supplier records, and pricing details for this inquiry will be permanently deleted.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            id="delete-modal-cancel-btn"
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="delete-modal-confirm-btn"
            onClick={onConfirm}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
