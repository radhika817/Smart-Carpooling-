import React, { useState } from 'react';
import { Share2, Copy, Check, Clock, ShieldCheck, X } from 'lucide-react';
import { safetyService } from '../../services/safetyService';

export const ShareTrackingModal = ({ rideId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [durationHours, setDurationHours] = useState(4);
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateLink = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await safetyService.generateShareLink(rideId, durationHours);
      setShareData(res?.data || res);
    } catch (err) {
      setError(err.message || 'Could not generate shareable tracking link');
    } finally {
      setLoading(false);
    }
  };

  const getFullShareUrl = () => {
    if (!shareData?.shareToken) return '';
    return `${window.location.origin}/track/${shareData.shareToken}`;
  };

  const handleCopy = async () => {
    const url = getFullShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <button
        type="button"
        id="share-live-tracking-btn"
        onClick={() => {
          setIsOpen(true);
          if (!shareData) handleGenerateLink();
        }}
        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 shadow-xs flex items-center gap-1.5 transition active:scale-95"
      >
        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Share ride</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-elevated p-6 space-y-5 text-slate-900">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Share live ride tracking</h3>
                  <p className="text-xs text-slate-500">Allow family or friends to follow your commute live</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Generating secure, time-boxed token...
              </div>
            ) : shareData ? (
              <div className="space-y-4">
                {/* Generated URL Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Shareable tracking link
                  </label>
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="text"
                      readOnly
                      value={getFullShareUrl()}
                      className="flex-1 px-2.5 py-1 text-xs bg-transparent text-slate-800 border-none focus:outline-none truncate selection:bg-emerald-200"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Expiration and Privacy Banner */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Time-boxed expiration</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Valid until {new Date(shareData.shareExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                  </p>
                  <div className="flex items-start gap-2 pt-2 border-t border-amber-200/60 text-[11px] text-emerald-800">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <span>
                      <strong>Privacy protected:</strong> This link automatically and permanently expires as soon as the ride concludes.
                    </span>
                  </div>
                </div>

                {/* Share Options */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Follow my commute live on SmartRide: ${getFullShareUrl()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  Share via WhatsApp
                </a>
              </div>
            ) : (
              error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
};
