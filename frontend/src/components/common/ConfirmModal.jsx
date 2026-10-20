import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { LuTrash2, LuTriangleAlert, LuInfo, LuCircleCheck, LuRotateCcw } from 'react-icons/lu';

/**
 * Themed In-App Confirmation, Alert & Prompt Modal Card
 * Replaces native browser window.confirm(), window.alert(), and window.prompt()
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
  confirmVariant = 'danger', // 'danger' | 'warning' | 'info' | 'primary'
  loading = false,
  inputPlaceholder,
  defaultValue = '',
  inputValue,
  onInputChange,
  inputRequired = false
}) {
  const [internalInput, setInternalInput] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInternalInput(defaultValue || '');
    }
  }, [isOpen, defaultValue]);

  const currentVal = inputValue !== undefined ? inputValue : internalInput;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (inputPlaceholder !== undefined && inputRequired && !currentVal?.trim()) return;
    onConfirm?.(currentVal);
  };

  const isDanger = confirmVariant === 'danger';
  const isWarning = confirmVariant === 'warning';
  const isInfo = confirmVariant === 'info';

  const renderIcon = () => {
    if (isDanger) return <LuTrash2 className="w-6 h-6 stroke-[2.2]" />;
    if (isWarning) return <LuTriangleAlert className="w-6 h-6 stroke-[2.2]" />;
    if (isInfo) return <LuInfo className="w-6 h-6 stroke-[2.2]" />;
    return <LuCircleCheck className="w-6 h-6 stroke-[2.2]" />;
  };

  const getBadgeClass = () => {
    if (isDanger) return 'confirm-modal-badge confirm-modal-badge-danger';
    if (isWarning) return 'confirm-modal-badge confirm-modal-badge-warning';
    if (isInfo) return 'confirm-modal-badge confirm-modal-badge-info';
    return 'confirm-modal-badge confirm-modal-badge-primary';
  };

  const getActionBtnClass = () => {
    if (isDanger) return 'confirm-btn-action confirm-btn-danger';
    if (isWarning) return 'confirm-btn-action confirm-btn-warning';
    if (isInfo) return 'confirm-btn-action confirm-btn-info';
    return 'confirm-btn-action confirm-btn-primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      showClose={!loading}
    >
      <form onSubmit={handleSubmit} className="confirm-modal-container">
        <div className="confirm-modal-header">
          <div className={getBadgeClass()}>
            {renderIcon()}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="confirm-modal-title">
              {title}
            </h3>
            <p className="confirm-modal-message">
              {message}
            </p>
          </div>
        </div>

        {inputPlaceholder !== undefined && (
          <div className="pt-1">
            <input
              type="text"
              value={currentVal}
              onChange={(e) => {
                setInternalInput(e.target.value);
                onInputChange?.(e.target.value);
              }}
              placeholder={inputPlaceholder}
              required={inputRequired}
              className="confirm-modal-input"
              autoFocus
            />
          </div>
        )}

        <div className="confirm-modal-actions">
          {showCancel && (
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="confirm-btn-cancel"
            >
              {cancelText}
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (inputPlaceholder !== undefined && inputRequired && !currentVal?.trim())}
            className={getActionBtnClass()}
          >
            {loading ? (
              <>
                <LuRotateCcw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

