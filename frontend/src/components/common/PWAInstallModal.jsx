import React, { useState, useEffect } from 'react';
import { LuX, LuShare, LuSquarePlus, LuDownload, LuCheck, LuSmartphone, LuSparkles } from 'react-icons/lu';
import { usePWA } from '../../context/PWAContext';

export default function PWAInstallModal() {
  const {
    isInstallModalOpen,
    closeInstallModal,
    isIOS,
    deferredPrompt,
    promptInstall
  } = usePWA();

  const [activeTab, setActiveTab] = useState(isIOS ? 'ios' : 'android');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isInstallModalOpen) {
        closeInstallModal();
      }
    };
    if (isInstallModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInstallModalOpen, closeInstallModal]);

  if (!isInstallModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={closeInstallModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div 
        className="relative w-full max-w-md bg-white text-[#10231D] border border-[#E2D9C8] rounded-3xl p-6 shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative gold ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#E9A23B]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeInstallModal}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[#6B8077] hover:text-[#10231D] hover:bg-[#F5F1E8] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <LuX className="w-5 h-5" />
        </button>

        {/* Header with App Logo Icon */}
        <div className="flex items-center gap-4 mb-5">
          <img
            src="/icon-192.png"
            alt="Max Housekeeping Logo"
            className="w-16 h-16 rounded-2xl border-2 border-[#E9A23B] shadow-md object-cover bg-white shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E9A23B]/15 text-[11px] font-mono uppercase tracking-wider text-[#A0630D] border border-[#E9A23B]/30 mb-1 font-semibold">
              <LuSparkles className="w-3 h-3 text-[#E9A23B]" />
              <span>Faster Access</span>
            </div>
            <h3 id="pwa-install-title" className="font-display font-bold text-xl text-[#10231D] leading-tight">
              Download Max App
            </h3>
            <p className="text-xs text-[#5C7065] mt-0.5">
              1-tap booking & live cleaner tracking
            </p>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#F5F1E8] rounded-2xl mb-4 border border-[#E2D9C8]">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-[#E9A23B] text-[#181511] shadow-sm'
                : 'text-[#5C7065] hover:text-[#10231D]'
            }`}
          >
            <LuSmartphone className="w-3.5 h-3.5" />
            Android / Desktop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-[#E9A23B] text-[#181511] shadow-sm'
                : 'text-[#5C7065] hover:text-[#10231D]'
            }`}
          >
            <LuSmartphone className="w-3.5 h-3.5" />
            iPhone / iPad (iOS)
          </button>
        </div>

        {/* Tab Content: Android & Desktop */}
        {activeTab === 'android' && (
          <div className="space-y-3">
            {deferredPrompt ? (
              <div className="bg-[#FAF7F2] border border-[#E2D9C8] rounded-2xl p-4 text-center">
                <p className="text-xs text-[#3D524A] mb-3 font-medium">
                  Install the official Max Housekeeping app directly to your home screen or desktop:
                </p>
                <button
                  type="button"
                  onClick={promptInstall}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#E9A23B] text-[#181511] font-bold text-sm shadow-md hover:bg-[#D48E28] transition-all cursor-pointer active:scale-95"
                >
                  <LuDownload className="w-4 h-4" />
                  Install App Now
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 bg-[#FAF7F2] border border-[#E2D9C8] rounded-2xl p-4 text-xs text-[#3D524A]">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#181511] font-bold text-[11px] shrink-0 shadow-sm">1</span>
                  <span>Tap your browser's menu <strong>three dots (⋮)</strong> at the top right.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#181511] font-bold text-[11px] shrink-0 shadow-sm">2</span>
                  <span>Select <strong>'Install App'</strong> or <strong>'Add to Home screen'</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#181511] font-bold text-[11px] shrink-0 shadow-sm">3</span>
                  <span>Tap <strong>'Install'</strong> to complete setup.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: iOS Safari */}
        {activeTab === 'ios' && (
          <div className="space-y-2.5 bg-[#FAF7F2] border border-[#E2D9C8] rounded-2xl p-4 text-xs text-[#3D524A]">
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#181511] font-bold text-[11px] shrink-0 shadow-sm">1</span>
              <span>
                Tap the <strong>Share</strong> button <LuShare className="inline w-3.5 h-3.5 text-[#D48E28] mx-0.5" /> at the bottom of Safari.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#181511] font-bold text-[11px] shrink-0 shadow-sm">2</span>
              <span>
                Scroll down and tap <strong>'Add to Home Screen'</strong> <LuSquarePlus className="inline w-3.5 h-3.5 text-[#D48E28] mx-0.5" />.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#181511] font-bold text-[11px] shrink-0 shadow-sm">3</span>
              <span>
                Tap <strong>'Add'</strong> in the top-right corner. The Max logo icon will appear on your home screen!
              </span>
            </div>
          </div>
        )}

        {/* Value Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 text-[11px] text-[#5C7065] font-medium">
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-4 h-4 text-[#0F6F50] shrink-0" />
            <span>Fast 1-tap bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-4 h-4 text-[#0F6F50] shrink-0" />
            <span>Live order tracking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-4 h-4 text-[#0F6F50] shrink-0" />
            <span>Instant launch & offline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-4 h-4 text-[#0F6F50] shrink-0" />
            <span>Zero phone storage waste</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-[#E2D9C8] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeInstallModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5C7065] hover:text-[#10231D] hover:bg-[#F5F1E8] transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
          
          {deferredPrompt && activeTab === 'android' ? (
            <button
              type="button"
              onClick={promptInstall}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E9A23B] text-[#181511] hover:bg-[#D48E28] transition-colors cursor-pointer shadow-sm"
            >
              Install App
            </button>
          ) : (
            <button
              type="button"
              onClick={closeInstallModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#10231D] text-white hover:bg-[#1A332B] transition-colors cursor-pointer shadow-sm"
            >
              Got It
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
