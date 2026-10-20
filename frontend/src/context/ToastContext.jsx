import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuCheck, LuCircleAlert, LuInfo, LuX } from 'react-icons/lu';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';

const ToastContext = createContext(null);

function ToastItem({ item, onDismiss }) {
  useEffect(() => {
    if (!item.duration || item.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border shadow-xl backdrop-blur-md"
      style={{
        backgroundColor: '#F4EFE6',
        borderColor: item.type === 'error' ? '#C2512D' : item.type === 'success' ? '#E9A23B' : '#E2D9C8',
        color: '#10231D'
      }}
    >
      <div className="flex items-center gap-3">
        {item.type === 'success' && (
          <span className="p-1 rounded-full bg-[#E9A23B]/20 text-[#D48E28] shrink-0">
            <LuCheck className="w-4 h-4" />
          </span>
        )}
        {item.type === 'error' && (
          <span className="p-1 rounded-full bg-[#F9ECE8] text-[#C2512D] shrink-0">
            <LuCircleAlert className="w-4 h-4" />
          </span>
        )}
        {item.type === 'info' && (
          <span className="p-1 rounded-full bg-[#DDEBE4] text-[#10231D] shrink-0">
            <LuInfo className="w-4 h-4" />
          </span>
        )}
        <p className="text-sm font-semibold leading-snug">{item.message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="text-[#6B8077] hover:text-[#10231D] transition-colors p-1"
        aria-label="Dismiss"
      >
        <LuX className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const recentToastsRef = React.useRef(new Map());

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;

    const now = Date.now();
    const lastTime = recentToastsRef.current.get(message);
    // Ignore identical message triggered within 1200ms
    if (lastTime && now - lastTime < 1200) {
      return;
    }
    recentToastsRef.current.set(message, now);

    // Prune stale entries from cache
    for (const [msg, time] of recentToastsRef.current.entries()) {
      if (now - time > 5000) {
        recentToastsRef.current.delete(msg);
      }
    }

    const id = `${now}-${Math.random().toString(36).substring(2, 7)}`;

    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      return [...prev, { id, message, type, duration }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  // Themed modal card confirmation dialog
  const confirm = useCallback(({
    title = 'Please Confirm',
    message,
    confirmText = 'Proceed',
    cancelText = 'Cancel',
    isDanger = false,
    confirmVariant,
    onConfirm
  }) => {
    setConfirmDialog({
      title,
      message,
      confirmText,
      cancelText,
      confirmVariant: confirmVariant || (isDanger ? 'danger' : 'primary'),
      showCancel: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        if (onConfirm) await onConfirm();
      },
      onCancel: () => setConfirmDialog(null)
    });
  }, []);

  // Themed modal card alert dialog (replaces browser window.alert)
  const alert = useCallback(({
    title = 'Alert Notice',
    message,
    confirmText = 'Understood',
    confirmVariant = 'info',
    onConfirm
  }) => {
    setConfirmDialog({
      title,
      message,
      confirmText,
      showCancel: false,
      confirmVariant,
      onConfirm: async () => {
        setConfirmDialog(null);
        if (onConfirm) await onConfirm();
      },
      onCancel: () => setConfirmDialog(null)
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast: { success, error, info }, confirm, alert }}>
      {children}

      {/* Toast Notification Container (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-md w-full px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} item={t} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Universal Theme-Based Confirmation & Alert Modal Card */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={true}
          onClose={confirmDialog.onCancel}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          showCancel={confirmDialog.showCancel}
          confirmVariant={confirmDialog.confirmVariant}
          onConfirm={confirmDialog.onConfirm}
        />
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
