import React from 'react';
import { X, ExternalLink, Sliders, AlertTriangle } from 'lucide-react';

interface HostGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
}

export const HostGuideModal: React.FC<HostGuideModalProps> = ({ isOpen, onClose, onOpenAdmin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#120f24] border border-purple-500/30 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Music Assistant Host Setup Guide
            </h2>
            <p className="text-xs sm:text-sm text-purple-300/80">
              How to configure the Party Plugin for 1 Boost & 2 Song Requests
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 my-6 text-sm text-slate-300">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex gap-3.5">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h3 className="font-bold text-white mb-1">Open Music Assistant Settings</h3>
              <p className="text-xs text-slate-300">
                In your Home Assistant instance at <strong className="text-purple-300">home.raverendo.com</strong>, open Music Assistant and go to:
                <br />
                <code className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded text-xs mt-1 inline-block border border-purple-800/40">
                  Settings → Plugins → Party
                </code>
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex gap-3.5">
            <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <h3 className="font-bold text-white mb-1">Configure Rate Limiting (1 Boost, 2 Requests)</h3>
              <p className="text-xs text-slate-300 mb-2">
                Under the <strong>Rate Limiting (Advanced)</strong> section of the Party Plugin:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                  <span className="text-purple-300 font-bold block">Add to Queue:</span>
                  <span className="text-slate-300">Token Limit: </span>
                  <strong className="text-white bg-purple-600/40 px-1.5 py-0.5 rounded">2</strong>
                  <span className="text-slate-400 block text-[11px] mt-0.5">Refill Rate: 10–20 min (or desired)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/30">
                  <span className="text-orange-300 font-bold block">Boost:</span>
                  <span className="text-slate-300">Token Limit: </span>
                  <strong className="text-white bg-orange-600/40 px-1.5 py-0.5 rounded">1</strong>
                  <span className="text-slate-400 block text-[11px] mt-0.5">Refill Rate: 20–30 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex gap-3.5">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              3
            </span>
            <div>
              <h3 className="font-bold text-white mb-1">Copy the Party Join Link</h3>
              <p className="text-xs text-slate-300">
                In Music Assistant, open the Party Dashboard or click the QR code to copy the party link (e.g. <code className="text-emerald-300 font-mono text-[11px]">https://home.raverendo.com/#/party?join=...</code>).
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex gap-3.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              4
            </span>
            <div>
              <h3 className="font-bold text-white mb-1">Enter Join Link in Gatekeeper Admin</h3>
              <p className="text-xs text-slate-300">
                Click the gear icon in the top right of this page and paste your link under <strong>Music Assistant Party URL</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Caution Notice */}
        <div className="p-3.5 rounded-2xl bg-yellow-950/40 border border-yellow-500/30 text-yellow-200/90 text-xs flex gap-2.5 mb-6">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Host Tip:</strong> Do not open the guest party link in the same browser profile where you administer Music Assistant, as the guest session will overwrite your admin login in localStorage. Always test in an Incognito window or on your mobile device.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="flex-1 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Open Admin Settings</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
