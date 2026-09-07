import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { InquiryItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: InquiryItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">Delete Inquiry from Google Sheets?</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Are you sure you want to permanently remove inquiry{' '}
              <strong className="text-rose-600 font-mono font-semibold">{item.inquiryNumber}</strong> (
              {item.customerName} - {item.product})?
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              This action will update your connected Google Spreadsheet and cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            id="delete-modal-cancel-btn"
            onClick={onCancel}
            className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            id="delete-modal-confirm-btn"
            onClick={onConfirm}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
