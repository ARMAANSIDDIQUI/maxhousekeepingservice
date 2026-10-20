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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={closeInstallModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div 
        className="relative w-full max-w-md bg-[#10231D] text-[#F4EFE6] border border-[#3D524A] rounded-2xl p-6 shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative gold ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#E9A23B]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeInstallModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#DDEBE4]/70 hover:text-[#F4EFE6] hover:bg-[#3D524A]/50 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <LuX className="w-5 h-5" />
        </button>

        {/* Header with App Logo Icon */}
        <div className="flex items-center gap-4 mb-5">
          <img
            src="/icon-192.png"
            alt="Max Housekeeping Logo"
            className="w-16 h-16 rounded-2xl border-2 border-[#E9A23B] shadow-lg object-cover bg-[#0A1713] shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E9A23B]/15 text-[10px] font-mono uppercase tracking-wider text-[#E9A23B] border border-[#E9A23B]/30 mb-1">
              <LuSparkles className="w-3 h-3" />
              <span>Faster Access</span>
            </div>
            <h3 id="pwa-install-title" className="font-display font-bold text-xl text-[#F4EFE6] leading-tight">
              Download Max App
            </h3>
            <p className="text-xs text-[#DDEBE4]/75 mt-0.5">
              1-tap booking & live cleaner tracking
            </p>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#1A332B] rounded-xl mb-4 border border-[#3D524A]/60">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-[#E9A23B] text-[#10231D] shadow-sm'
                : 'text-[#DDEBE4]/80 hover:text-[#F4EFE6]'
            }`}
          >
            <LuSmartphone className="w-3.5 h-3.5" />
            Android / Desktop
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-[#E9A23B] text-[#10231D] shadow-sm'
                : 'text-[#DDEBE4]/80 hover:text-[#F4EFE6]'
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
              <div className="bg-[#1A332B]/80 border border-[#3D524A] rounded-xl p-4 text-center">
                <p className="text-xs text-[#DDEBE4] mb-3">
                  Install the official Max Housekeeping app directly to your home screen or desktop:
                </p>
                <button
                  type="button"
                  onClick={promptInstall}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#E9A23B] text-[#10231D] font-bold text-sm shadow-md hover:bg-[#d89330] transition-all cursor-pointer active:scale-95"
                >
                  <LuDownload className="w-4 h-4" />
                  Install App Now
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 bg-[#1A332B]/50 border border-[#3D524A]/60 rounded-xl p-3.5 text-xs text-[#DDEBE4]">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">1</span>
                  <span>Tap your browser's menu <strong>three dots (⋮)</strong> at the top right.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">2</span>
                  <span>Select <strong>'Install App'</strong> or <strong>'Add to Home screen'</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">3</span>
                  <span>Tap <strong>'Install'</strong> to complete setup.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: iOS Safari */}
        {activeTab === 'ios' && (
          <div className="space-y-2.5 bg-[#1A332B]/50 border border-[#3D524A]/60 rounded-xl p-3.5 text-xs text-[#DDEBE4]">
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">1</span>
              <span>
                Tap the <strong>Share</strong> button <LuShare className="inline w-3.5 h-3.5 text-[#E9A23B] mx-0.5" /> at the bottom of Safari.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">2</span>
              <span>
                Scroll down and tap <strong>'Add to Home Screen'</strong> <LuSquarePlus className="inline w-3.5 h-3.5 text-[#E9A23B] mx-0.5" />.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">3</span>
              <span>
                Tap <strong>'Add'</strong> in the top-right corner. The Max logo icon will appear on your home screen!
              </span>
            </div>
          </div>
        )}

        {/* Value Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-[#DDEBE4]/80">
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
            <span>Fast 1-tap bookings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
            <span>Live order tracking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
            <span>Instant launch & offline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B] shrink-0" />
            <span>Zero phone storage waste</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-[#3D524A]/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeInstallModal}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#DDEBE4]/70 hover:text-[#F4EFE6] hover:bg-[#3D524A]/40 transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
          
          {deferredPrompt && activeTab === 'android' ? (
            <button
              type="button"
              onClick={promptInstall}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#E9A23B] text-[#10231D] hover:bg-[#d89330] transition-colors cursor-pointer shadow-sm"
            >
              Install App
            </button>
          ) : (
            <button
              type="button"
              onClick={closeInstallModal}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#3D524A]/60 text-[#F4EFE6] hover:bg-[#3D524A] transition-colors cursor-pointer"
            >
              Got It
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
