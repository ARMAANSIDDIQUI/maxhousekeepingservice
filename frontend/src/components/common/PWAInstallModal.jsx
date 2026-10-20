import React, { useState } from 'react';
import { LuX, LuShare, LuSquarePlus, LuDownload, LuCheck, LuSmartphone, LuMonitor, LuSparkles } from 'react-icons/lu';
import { usePWA } from '../../context/PWAContext';

export default function PWAInstallModal() {
  const { isInstallModalOpen, setIsInstallModalOpen, isIOS, deferredPrompt, promptInstall } = usePWA();
  const [activeTab, setActiveTab] = useState(isIOS ? 'ios' : 'android');

  if (!isInstallModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#10231D] text-[#F4EFE6] border border-[#3D524A] rounded-2xl p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#E9A23B]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#DDEBE4]/70 hover:text-[#F4EFE6] hover:bg-[#3D524A]/50 transition-colors"
          aria-label="Close modal"
        >
          <LuX className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-5">
          <img
            src="/icon-192.png"
            alt="Max Housekeeping App Icon"
            className="w-16 h-16 rounded-2xl border-2 border-[#E9A23B] shadow-lg object-cover bg-[#0A1713]"
          />
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#E9A23B]">
              <LuSparkles className="w-3.5 h-3.5" />
              <span>Official Web App</span>
            </div>
            <h3 className="font-display font-bold text-xl text-[#F4EFE6] leading-tight">
              Max Housekeeping
            </h3>
            <p className="text-xs text-[#DDEBE4]/70">
              Install to home screen for instant booking
            </p>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#1A332B] rounded-xl mb-5 border border-[#3D524A]/60">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
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
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
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
          <div className="space-y-4">
            {deferredPrompt ? (
              <div className="bg-[#1A332B]/80 border border-[#3D524A] rounded-xl p-4 text-center">
                <p className="text-sm text-[#DDEBE4] mb-3">
                  Click below to quickly install the app on your device:
                </p>
                <button
                  type="button"
                  onClick={promptInstall}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#E9A23B] text-[#10231D] font-bold text-sm shadow-md hover:bg-[#d89330] transition-colors"
                >
                  <LuDownload className="w-4 h-4" />
                  Install App Now
                </button>
              </div>
            ) : (
              <div className="space-y-3 bg-[#1A332B]/50 border border-[#3D524A]/60 rounded-xl p-4 text-xs text-[#DDEBE4]">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">1</span>
                  <span>Open your browser's menu by tapping the <strong>three dots (⋮)</strong> at the top right.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">2</span>
                  <span>Select <strong>'Install App'</strong> or <strong>'Add to Home screen'</strong>.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">3</span>
                  <span>Confirm by clicking <strong>'Install'</strong>. Enjoy instant app access!</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: iOS Safari */}
        {activeTab === 'ios' && (
          <div className="space-y-3 bg-[#1A332B]/50 border border-[#3D524A]/60 rounded-xl p-4 text-xs text-[#DDEBE4]">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">1</span>
              <span>
                Tap the <strong>Share</strong> button <LuShare className="inline w-3.5 h-3.5 text-[#E9A23B] mx-0.5" /> at the bottom or top of Safari.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">2</span>
              <span>
                Scroll down and select <strong>'Add to Home Screen'</strong> <LuSquarePlus className="inline w-3.5 h-3.5 text-[#E9A23B] mx-0.5" />.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9A23B] text-[#10231D] font-bold text-[11px] shrink-0">3</span>
              <span>
                Tap <strong>'Add'</strong> in the top right corner. The Max logo icon will appear on your iPhone home screen!
              </span>
            </div>
          </div>
        )}

        {/* Value Highlights */}
        <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-[#DDEBE4]/80">
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Fast booking & reordering</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Real-time cleaner tracking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Zero storage overhead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuCheck className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Works offline & fast launch</span>
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="mt-6 pt-4 border-t border-[#3D524A]/60 flex justify-end">
          <button
            type="button"
            onClick={() => setIsInstallModalOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#DDEBE4]/80 hover:text-[#F4EFE6] hover:bg-[#3D524A]/40 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
