import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Phone,
  Plus,
  Trash2,
  Building,
  Mail,
  CheckCircle2,
  Star,
  Sparkles,
} from 'lucide-react';
import { userService } from '../../services/userService';

export const SafetySettingsCard = ({ currentUser, onUpdate }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(
    currentUser?.verificationStatus || { email: true, phone: false, organization: false, govtId: false }
  );

  // Form state for adding emergency contact
  const [showAddContact, setShowAddContact] = useState(false);
  const [name, setName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Rating breakdown stats from user
  const ratingsBreakdown = currentUser?.ratingsBreakdown || {
    punctuality: { average: 5.0, count: 0 },
    safety: { average: 5.0, count: 0 },
    behaviour: { average: 5.0, count: 0 },
    cleanliness: { average: 5.0, count: 0 },
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await userService.getEmergencyContacts();
      const list = res?.contacts || res?.data?.contacts || (Array.isArray(res) ? res : []);
      setContacts(list);
    } catch (err) {
      console.warn('Could not load contacts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phoneNum.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await userService.addEmergencyContact({
        name: name.trim(),
        phone: phoneNum.trim(),
        relationship,
      });
      const list = res?.contacts || res?.data?.contacts || (Array.isArray(res) ? res : []);
      setContacts(list);
      setName('');
      setPhoneNum('');
      setShowAddContact(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add emergency contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    try {
      const res = await userService.deleteEmergencyContact(contactId);
      const list = res?.contacts || res?.data?.contacts || (Array.isArray(res) ? res : []);
      setContacts(list);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Could not remove contact: ' + err.message);
    }
  };

  const handleToggleVerification = async (key) => {
    const updated = { ...verification, [key]: !verification[key] };
    setVerification(updated);
    try {
      await userService.updateVerification({ [key]: updated[key] });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.warn('Could not update verification:', err.message);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Safety, Trust & Verification
            </h3>
            <p className="text-xs text-slate-400">
              Community protection, emergency dispatch network & verified identity
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Verification Badges */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-brand-400" />
            Verification Status
          </h4>

          <div className="space-y-2.5">
            {/* Email Verification */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Email Verified</span>
                  <span className="text-[10px] text-slate-500">{currentUser?.email}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>

            {/* Organization / College Verification */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Campus / Workplace</span>
                  <span className="text-[10px] text-slate-500">
                    {currentUser?.organization || 'Registered Organization'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('organization')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${
                  verification.organization
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {verification.organization ? '✓ Verified' : 'Verify'}
              </button>
            </div>

            {/* Government ID Verification */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Government / Student ID</span>
                  <span className="text-[10px] text-slate-500">Official photo identity check</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('govtId')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 ${
                  verification.govtId
                    ? 'bg-brand-500/10 text-brand-300 border-brand-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {verification.govtId ? '✓ ID Verified' : 'Upload ID'}
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column: Emergency Contacts Network */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-red-400" />
              Emergency Contacts ({contacts.length}/5)
            </h4>
            {contacts.length < 5 && (
              <button
                type="button"
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>

          {/* Add Contact Inline Form */}
          {showAddContact && (
            <form onSubmit={handleAddContact} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-white">Add Trusted Contact</div>
              {errorMsg && <div className="text-[10px] text-red-400">{errorMsg}</div>}
              <input
                type="text"
                placeholder="Contact Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <input
                type="tel"
                placeholder="Phone Number (+91...)"
                value={phoneNum}
                onChange={(e) => setPhoneNum(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <div className="flex gap-2">
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Friend">Friend</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Contact List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <ShieldAlert className="w-5 h-5 mx-auto text-amber-400/60" />
                <p>No emergency contacts added yet.</p>
                <p className="text-[10px] text-slate-500">
                  Add a trusted friend or family member for SOS live location dispatch.
                </p>
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c._id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{c.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {c.phone} • <span className="text-slate-500">{c.relationship}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(c._id)}
                    title="Remove Contact"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Safety Rating & 5-Category Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" />
              Safety & Rating Breakdown
            </h4>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              ★ {currentUser?.rating?.average?.toFixed(1) || '5.0'}
              <span className="text-slate-500 text-[10px]">({currentUser?.rating?.count || 0})</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            {[
              { label: 'Punctuality', val: ratingsBreakdown.punctuality?.average || 5.0 },
              { label: 'Driving Safety', val: ratingsBreakdown.safety?.average || 5.0 },
              { label: 'Behaviour & Courtesy', val: ratingsBreakdown.behaviour?.average || 5.0 },
              { label: 'Cleanliness', val: ratingsBreakdown.cleanliness?.average || 5.0 },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{metric.label}</span>
                  <span className="text-amber-400 font-bold">{metric.val.toFixed(1)} / 5</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-1.5 rounded-full"
                    style={{ width: `${(metric.val / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
