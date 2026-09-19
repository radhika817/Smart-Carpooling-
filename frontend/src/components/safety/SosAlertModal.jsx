import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, X, CheckCircle, Radio } from 'lucide-react';
import { safetyService } from '../../services/safetyService';

export const SosAlertModal = ({ rideId, socket, isRideActive = false, userRole = 'passenger' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [incomingAlert, setIncomingAlert] = useState(null);

  // Listen for real-time SOS broadcast from other members on this ride
  useEffect(() => {
    if (!socket) return;

    const handleSosAlert = (data) => {
      setIncomingAlert(data);
      setIsOpen(true);
    };

    socket.on('sos:alert', handleSosAlert);
    return () => {
      socket.off('sos:alert', handleSosAlert);
    };
  }, [socket]);

  const handleTriggerSos = async () => {
    if (!isRideActive) {
      setErrorMessage('SOS can only be activated while the ride is active.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Get device geolocation if available
      let coordinates = [0, 0];
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          coordinates = [pos.coords.longitude, pos.coords.latitude];
        } catch {
          // Fallback to default coordinates if denied or timed out
        }
      }

      const res = await safetyService.triggerSos(rideId, {
        coordinates,
        address: 'Live In-Ride Tracking Location',
      });

      setSosSuccess(res?.data || res);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to activate SOS emergency alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Red SOS Button with Pulse */}
      <button
        type="button"
        id="sos-emergency-trigger-btn"
        onClick={() => setIsOpen(true)}
        className="relative group px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95 border border-red-400/30"
        title="Emergency SOS Alert"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <ShieldAlert className="w-4 h-4 text-white" />
        <span>SOS Alert</span>
      </button>

      {/* SOS Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-red-500/50 shadow-2xl p-6 space-y-5 text-slate-100 overflow-hidden">
            {/* Ambient Red Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
                  <ShieldAlert className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                    Emergency Safety SOS
                  </h3>
                  <p className="text-xs text-red-300/80 font-medium">
                    Immediate emergency dispatch & alert system
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setErrorMessage('');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If there is an incoming alert from another ride member */}
            {incomingAlert && (
              <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-100 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  EMERGENCY ALERT TRIGGERED
                </div>
                <p>
                  <strong>{incomingAlert.triggeredBy?.name}</strong> ({incomingAlert.triggeredBy?.role}) has activated the SOS button on this ride.
                </p>
                <p className="text-[11px] text-red-300">
                  Time: {new Date(incomingAlert.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* SOS Trigger Confirmation & Status */}
            {sosSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-200 text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  SOS Alert Broadcasted!
                </div>
                <p>
                  Live GPS telemetry has been flagged as high-priority emergency. Notifications have been dispatched to your saved emergency contacts.
                </p>
                <div className="text-[11px] text-slate-300 font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  Notified Contacts: {sosSuccess.notifiedContacts?.length || 0}
                </div>
              </div>
            ) : (
              !incomingAlert && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                      What happens when you trigger SOS:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      <li>Broadcasts emergency alert to all ride members via WebSocket.</li>
                      <li>Sends SMS alerts with your live location to your emergency contacts.</li>
                      <li>Provides direct 1-tap phone dials to local emergency authorities.</li>
                    </ul>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isSubmitting || !isRideActive}
                    onClick={handleTriggerSos}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-red-600/40 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-5 h-5" />
                    {isSubmitting ? 'Dispatching Emergency Alert...' : 'Confirm & Activate SOS Now'}
                  </button>
                  {!isRideActive && (
                    <p className="text-[11px] text-center text-amber-400/80">
                      Note: SOS can only be activated while the ride is in progress.
                    </p>
                  )}
                </div>
              )
            )}

            {/* Quick Emergency Dial Links (Always accessible) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Direct Emergency Call Helplines (India):
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <a
                  href="tel:112"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex flex-col items-center gap-1 group"
                >
                  <PhoneCall className="w-4 h-4 text-red-400 group-hover:scale-110 transition" />
                  <span className="font-extrabold text-white text-sm">112</span>
                  <span className="text-[9px] text-slate-400">Police / All</span>
                </a>
                <a
                  href="tel:108"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex flex-col items-center gap-1 group"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="font-extrabold text-white text-sm">108</span>
                  <span className="text-[9px] text-slate-400">Ambulance</span>
                </a>
                <a
                  href="tel:1091"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex flex-col items-center gap-1 group"
                >
                  <PhoneCall className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                  <span className="font-extrabold text-white text-sm">1091</span>
                  <span className="text-[9px] text-slate-400">Women Safety</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
