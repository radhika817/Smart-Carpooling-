import React, { useState } from 'react';
import { Star, MessageSquare, Award, CheckCircle, X, Shield } from 'lucide-react';
import { reviewService } from '../../services/reviewService';

export const RateRideModal = ({
  isOpen,
  onClose,
  rideId,
  targetUser,
  onSuccess,
}) => {
  const [overall, setOverall] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [safety, setSafety] = useState(5);
  const [behaviour, setBehaviour] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { key: 'overall', label: 'Overall Experience', value: overall, setter: setOverall, desc: 'Your general satisfaction with this trip' },
    { key: 'punctuality', label: 'Punctuality', value: punctuality, setter: setPunctuality, desc: 'On-time arrival at pickup / departure' },
    { key: 'safety', label: 'Safety & Driving', value: safety, setter: setSafety, desc: 'Smooth, cautious, and secure commute' },
    { key: 'behaviour', label: 'Behaviour & Courtesy', value: behaviour, setter: setBehaviour, desc: 'Politeness and pleasant interaction' },
    { key: 'cleanliness', label: 'Cleanliness', value: cleanliness, setter: setCleanliness, desc: 'Vehicle and commute tidiness' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await reviewService.createReview({
        rideId,
        toUserId: targetUser?.id || targetUser?._id,
        overall,
        punctuality,
        safety,
        behaviour,
        cleanliness,
        comment,
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit rating and review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Rate Your Ride Experience</h3>
              <p className="text-xs text-slate-400">
                Reviewing <strong>{targetUser?.name || 'Ride Member'}</strong> ({targetUser?.role || 'member'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Thank you for rating!</h4>
            <p className="text-xs text-slate-400">
              Your feedback has updated the member's profile score and helps keep the campus community safe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* 5 Categories Star Ratings */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              {categories.map((cat) => (
                <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-slate-800/60 last:border-b-0 last:pb-0">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{cat.label}</span>
                    <span className="text-[10px] text-slate-500">{cat.desc}</span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 sm:mt-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => cat.setter(star)}
                        className="p-1 hover:scale-110 transition active:scale-95"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= cat.value
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-1.5 text-xs font-bold text-amber-400 w-4 text-right">
                      {cat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Written Feedback (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific details about this commute..."
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 hover:from-brand-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Saving Review...' : 'Submit Rating'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
