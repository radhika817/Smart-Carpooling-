import React, { useState } from 'react';
import { Star, CheckCircle, X } from 'lucide-react';
import { reviewService } from '../../services/reviewService';

export const RateRideModal = ({
  isOpen,
  onClose,
  rideId,
  targetUser,
  passengers = [],
  onSuccess,
}) => {
  const [selectedPassengerId, setSelectedPassengerId] = useState(
    targetUser?._id || targetUser?.id || (passengers[0]?._id || passengers[0]?.id || '')
  );
  const [overall, setOverall] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [safety, setSafety] = useState(5);
  const [behaviour, setBehaviour] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Sync selected passenger if targetUser or passengers change
  React.useEffect(() => {
    if (targetUser?._id || targetUser?.id) {
      setSelectedPassengerId(targetUser._id || targetUser.id);
    } else if (passengers.length > 0) {
      setSelectedPassengerId(passengers[0]._id || passengers[0].id);
    }
  }, [targetUser, passengers]);

  if (!isOpen) return null;

  const effectiveTarget =
    passengers.find((p) => (p._id || p.id) === selectedPassengerId) ||
    targetUser ||
    passengers[0];

  const targetId = effectiveTarget?._id || effectiveTarget?.id;

  const categories = [
    { key: 'overall', label: 'Overall experience', value: overall, setter: setOverall, desc: 'Your general satisfaction with this trip' },
    { key: 'punctuality', label: 'Punctuality', value: punctuality, setter: setPunctuality, desc: 'On-time arrival at pickup / departure' },
    { key: 'safety', label: 'Safety & driving', value: safety, setter: setSafety, desc: 'Smooth, cautious, and secure commute' },
    { key: 'behaviour', label: 'Behaviour & courtesy', value: behaviour, setter: setBehaviour, desc: 'Politeness and pleasant interaction' },
    { key: 'cleanliness', label: 'Cleanliness', value: cleanliness, setter: setCleanliness, desc: 'Vehicle and commute tidiness' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) {
      setError('No target passenger/driver specified to review.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await reviewService.createReview({
        rideId,
        toUserId: targetId,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-elevated p-6 space-y-5 text-slate-900 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sunrise-50 border border-sunrise-200/80 flex items-center justify-center text-sunrise-600">
              <Star className="w-6 h-6 fill-sunrise-500 text-sunrise-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Rate your ride experience</h3>
              <p className="text-xs text-slate-500">
                Reviewing <strong>{effectiveTarget?.name || 'Ride Member'}</strong> ({effectiveTarget?.role || 'member'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Thank you for rating!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your feedback has updated the member's profile score and helps keep the campus community safe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {passengers && passengers.length > 1 && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Passenger to Review
                </label>
                <select
                  value={selectedPassengerId}
                  onChange={(e) => setSelectedPassengerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                >
                  {passengers.map((p) => {
                    const pId = p._id || p.id;
                    return (
                      <option key={pId} value={pId}>
                        {p.name} ({p.email || 'Passenger'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {!targetId && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No passenger or driver was found on this ride to review.
              </div>
            )}

            {/* 5 Categories Star Ratings */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {categories.map((cat) => (
                <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-slate-200/80 last:border-b-0 last:pb-0">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">{cat.label}</span>
                    <span className="text-[11px] text-slate-500">{cat.desc}</span>
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
                          className={`w-4 h-4 ${star <= cat.value
                              ? 'text-sunrise-500 fill-sunrise-500'
                              : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-1.5 text-xs font-bold text-sunrise-800 w-4 text-right">
                      {cat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Comment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Written feedback (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific details about this commute..."
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs transition resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Saving review...' : 'Submit rating'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
