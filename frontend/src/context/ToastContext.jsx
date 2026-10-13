import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCheck, LuCircleAlert, LuInfo, LuX } from 'react-icons/lu';
import Modal from '../components/common/Modal';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  // Replaces window.confirm with a beautiful theme modal
  const confirm = useCallback(({
    title = 'Please Confirm',
    message,
    confirmText = 'Proceed',
    cancelText = 'Cancel',
    isDanger = false,
    onConfirm
  }) => {
    setConfirmDialog({
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      onConfirm: async () => {
        setConfirmDialog(null);
        if (onConfirm) await onConfirm();
      },
      onCancel: () => setConfirmDialog(null)
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast: { success, error, info }, confirm }}>
      {children}

      {/* Toast Notification Container (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-md w-full px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border shadow-xl backdrop-blur-md"
              style={{
                backgroundColor: 'var(--color-paper)',
                borderColor: t.type === 'error' ? 'var(--color-rust)' : t.type === 'success' ? 'var(--color-brass)' : 'var(--color-paper-deep)',
                color: 'var(--color-ink)'
              }}
            >
              <div className="flex items-center gap-3">
                {t.type === 'success' && (
                  <span className="p-1 rounded-full bg-brass/20 text-brass shrink-0">
                    <LuCheck className="w-4 h-4" />
                  </span>
                )}
                {t.type === 'error' && (
                  <span className="p-1 rounded-full bg-rust-faint text-rust shrink-0">
                    <LuCircleAlert className="w-4 h-4" />
                  </span>
                )}
                {t.type === 'info' && (
                  <span className="p-1 rounded-full bg-lather text-ink shrink-0">
                    <LuInfo className="w-4 h-4" />
                  </span>
                )}
                <p className="text-sm font-medium leading-snug">{t.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-ink-faint hover:text-ink transition-colors p-1"
                aria-label="Dismiss"
              >
                <LuX className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirmation Theme Modal */}
      {confirmDialog && (
        <Modal
          isOpen={true}
          onClose={confirmDialog.onCancel}
          title={confirmDialog.title}
          maxWidth="max-w-md"
        >
          <p className="text-sm text-ink-muted mb-6 leading-relaxed">
            {confirmDialog.message}
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={confirmDialog.onCancel}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-paper-deep text-ink hover:bg-paper-deep/50 transition-colors"
            >
              {confirmDialog.cancelText}
            </button>
            <button
              type="button"
              onClick={confirmDialog.onConfirm}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                confirmDialog.isDanger
                  ? 'bg-rust text-white hover:bg-rust/90'
                  : 'bg-brass text-ink hover:bg-brass-hover'
              }`}
            >
              {confirmDialog.confirmText}
            </button>
          </div>
        </Modal>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
