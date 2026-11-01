import React, { useState } from 'react';
import { Smartphone, Download, Share2, Check, X, Chrome, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isAndroid } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      // fallback
    }
  };

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0">
              <img src="/pwa-192x192.png" alt="BEMS Logo" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">Install BEMS on Android</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  PWA APP
                </span>
              </div>
              <p className="text-xs text-slate-300">The Residency Towers • Banquet Management Command Center</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700">
          {/* Direct Install Button (If browser triggered beforeinstallprompt) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-teal-950">One-Tap Direct Installation</h4>
                  <p className="text-xs text-teal-700">Chrome is ready to install BEMS right onto your phone.</p>
                </div>
              </div>
              <button
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            </div>
          )}

          {installSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>BEMS has been successfully installed on your device! Check your home screen.</span>
            </div>
          )}

          {/* Step-by-Step Android Chrome Instructions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Chrome className="w-5 h-5 text-amber-600" />
              <h4 className="text-sm font-bold text-slate-900">How to Install in Mobile Chrome (3 Steps)</h4>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-800">Open in Chrome & Tap the Menu</p>
                  <p className="text-slate-600">
                    Open this URL in Google Chrome on your Android phone. Tap the <strong>three dots (⋮)</strong> menu icon at the top-right corner of Chrome.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-800">Select "Install app" or "Add to Home screen"</p>
                  <p className="text-slate-600">
                    In the dropdown menu, locate and tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-slate-800">Tap "Install" on the Confirmation Prompt</p>
                  <p className="text-slate-600">
                    Chrome will prompt <em>"Install app: Banquet Enquiry Management System (BEMS)"</em>. Tap <strong>Install</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting Section for Mobile Links */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️</span>
              Why a Link Might Not Open on Mobile & How to Fix
            </h5>
            <div className="text-xs text-amber-800 space-y-2">
              <div>
                <p className="font-semibold text-amber-950">1. Avoid In-App Browsers (WhatsApp / Email):</p>
                <p>
                  When you tap a link in WhatsApp or Gmail on Android, it opens inside the app's internal viewer instead of real Chrome.
                  Tap the <strong>three dots (⋮)</strong> in the top-right corner of that screen and choose <strong>"Open in Chrome"</strong>, or copy the link and paste it directly into Chrome's address bar.
                </p>
              </div>
              <div>
                <p className="font-semibold text-amber-950">2. Sign into your Google Account on Mobile Chrome:</p>
                <p>
                  Because this development environment is secured by Google AI Studio, your mobile Chrome browser must be logged into the same Google account ({'eventsmanager.chennai@theresidency.com'}). If prompted with a Google sign-in screen, sign in with this account.
                </p>
              </div>
              <div>
                <p className="font-semibold text-amber-950">3. Using the Public "Share" Link:</p>
                <p>
                  In Google AI Studio on your desktop, click the <strong>"Share"</strong> button at the top right to generate a shareable preview link that team members can open without developer credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits of Installing on Phone */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Key Mobile App Advantages
            </h5>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li><strong className="text-slate-700">Full-Screen Standalone Experience:</strong> Launches without browser URL bars, giving you maximum screen space for the hall matrix and enquiries.</li>
              <li><strong className="text-slate-700">Instant Home Screen Access:</strong> Launches instantly with one tap from your Android app drawer or home screen.</li>
              <li><strong className="text-slate-700">Fast Local Caching:</strong> All UI assets, stylesheets, and fonts are cached locally for fast on-the-go loading.</li>
              <li><strong className="text-slate-700">Quick PIN Security:</strong> Quick 4-digit PIN authentication keeps access fast and secure during client walkthroughs.</li>
            </ul>
          </div>

          {/* Share / Copy URL Section */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Current Environment Link:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full text-xs font-mono bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 select-all"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Paste this link directly into the Google Chrome address bar on your phone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
