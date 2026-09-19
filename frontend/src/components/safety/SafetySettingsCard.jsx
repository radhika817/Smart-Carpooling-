import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  FileText,
  Lock,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

export const SafetySettingsCard = ({ currentUser, onUpdate }) => {
  const { refreshUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState({
    email: Boolean(currentUser?.verificationStatus?.email),
    phone: Boolean(currentUser?.verificationStatus?.phone),
    organization: Boolean(currentUser?.verificationStatus?.organization),
    govtId: Boolean(currentUser?.verificationStatus?.govtId),
  });

  // Form state for adding emergency contact
  const [showAddContact, setShowAddContact] = useState(false);
  const [name, setName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ID Verification Upload Flow State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Private Document Viewer State
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewingBlobUrl, setViewingBlobUrl] = useState('');
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [viewerError, setViewerError] = useState('');

  // Rating breakdown stats from user
  const ratingsBreakdown = currentUser?.ratingsBreakdown || {
    punctuality: { average: 5.0, count: 0 },
    safety: { average: 5.0, count: 0 },
    behaviour: { average: 5.0, count: 0 },
    cleanliness: { average: 5.0, count: 0 },
  };

  useEffect(() => {
    loadLiveProfile();
    loadContacts();
  }, []);

  useEffect(() => {
    if (currentUser?.verificationStatus) {
      setVerification({
        email: Boolean(currentUser.verificationStatus.email),
        phone: Boolean(currentUser.verificationStatus.phone),
        organization: Boolean(currentUser.verificationStatus.organization),
        govtId: Boolean(currentUser.verificationStatus.govtId),
      });
    }
  }, [currentUser]);

  const loadLiveProfile = async () => {
    try {
      const res = await userService.getProfile();
      const liveUser = res?.user || res?.data?.user || res;
      if (liveUser?.verificationStatus) {
        setVerification({
          email: Boolean(liveUser.verificationStatus.email),
          phone: Boolean(liveUser.verificationStatus.phone),
          organization: Boolean(liveUser.verificationStatus.organization),
          govtId: Boolean(liveUser.verificationStatus.govtId),
        });
      }
    } catch (err) {
      console.warn('Could not load live user verification profile:', err.message);
    }
  };

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
    const nextVal = !verification[key];
    try {
      const res = await userService.updateVerification({ [key]: nextVal });
      const freshStatus = res?.data?.verificationStatus || res?.verificationStatus;
      if (freshStatus) {
        setVerification({
          email: Boolean(freshStatus.email),
          phone: Boolean(freshStatus.phone),
          organization: Boolean(freshStatus.organization),
          govtId: Boolean(freshStatus.govtId),
        });
      } else {
        setVerification((prev) => ({ ...prev, [key]: nextVal }));
      }
      if (refreshUser) refreshUser();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.warn('Could not update verification:', err.message);
      loadLiveProfile();
    }
  };

  // Handle File Selection for ID Upload
  const handleFileSelect = (file) => {
    setUploadError('');
    setUploadSuccess('');
    if (!file) return;

    // Validate type: images or pdf
    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isValidType) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP) or PDF document.');
      return;
    }

    // Validate size: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(''); // PDF
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUploadIdDocument = async () => {
    if (!selectedFile) {
      setUploadError('Please choose or drop an identity document first');
      return;
    }

    setUploadingId(true);
    setUploadError('');
    setUploadProgress(10);

    try {
      const res = await userService.uploadIdDocument(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadProgress(100);
      setUploadSuccess('ID document uploaded and verified successfully!');

      const freshStatus = res?.data?.verificationStatus || res?.verificationStatus;
      if (freshStatus) {
        setVerification({
          email: Boolean(freshStatus.email),
          phone: Boolean(freshStatus.phone),
          organization: Boolean(freshStatus.organization),
          govtId: Boolean(freshStatus.govtId),
        });
      } else {
        setVerification((prev) => ({ ...prev, govtId: true }));
      }

      if (refreshUser) refreshUser();

      // Clean up after 1.5 seconds
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadProgress(0);
        setUploadSuccess('');
        if (onUpdate) onUpdate();
      }, 1500);
    } catch (err) {
      console.error('ID upload failed:', err);
      setUploadError(err.message || 'Failed to upload identity document');
    } finally {
      setUploadingId(false);
    }
  };

  const handleOpenViewer = async () => {
    setShowViewerModal(true);
    setLoadingViewer(true);
    setViewerError('');
    try {
      const blob = await userService.getIdDocumentBlob();
      const url = URL.createObjectURL(blob);
      setViewingBlobUrl(url);
    } catch (err) {
      console.error('Failed to retrieve private document:', err);
      setViewerError(err.message || 'Could not retrieve private document');
    } finally {
      setLoadingViewer(false);
    }
  };

  const handleCloseViewer = () => {
    setShowViewerModal(false);
    if (viewingBlobUrl) {
      URL.revokeObjectURL(viewingBlobUrl);
      setViewingBlobUrl('');
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

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Safety Network Active</span>
          </span>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Verification Badges */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-brand-400" />
            Verification Credentials
          </h4>

          <div className="space-y-2.5">
            {/* Email Verification */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block">Email Address</span>
                  <span className="text-[10px] text-slate-500 block truncate">{currentUser?.email || 'Not provided'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('email')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  verification.email
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {verification.email ? '✓ Verified' : 'Verify'}
              </button>
            </div>

            {/* Phone Verification */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block">Phone Number</span>
                  <span className="text-[10px] text-slate-500 block truncate">{currentUser?.phone || 'Not provided'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('phone')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  verification.phone
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {verification.phone ? '✓ Verified' : 'Verify'}
              </button>
            </div>

            {/* Workplace / College Verification */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block">Campus / Workplace</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {currentUser?.organization || 'Registered Organization'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('organization')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  verification.organization
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {verification.organization ? '✓ Verified' : 'Verify'}
              </button>
            </div>

            {/* Real Government / Student ID Upload Item */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className={`w-4 h-4 shrink-0 ${verification.govtId ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block">Government / Student ID</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {verification.govtId
                      ? 'Encrypted in private vault'
                      : 'Upload photo identity document'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {verification.govtId ? (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenViewer}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1"
                      title="View private document"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>View</span>
                    </button>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      ✓ Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1"
                      title="Replace existing ID"
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-slate-400" />
                      <span>Replace</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 shadow transition flex items-center gap-1 shrink-0"
                  >
                    <UploadCloud className="w-3 h-3 stroke-[2.5]" />
                    <span>Upload ID</span>
                  </button>
                )}
              </div>
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
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-brand-500 text-slate-950 hover:bg-brand-400 transition"
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          )}

          {/* Contact List */}
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                <Phone className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-400">No emergency contacts saved</p>
                <p className="text-[10px] text-slate-500">
                  Add family or friends who will receive automated SOS alerts with live coordinates.
                </p>
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c._id || c.phone}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                        {c.relationship}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{c.phone}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(c._id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Remove contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Mutual Trust & Category Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Mutual Trust Rating
            </h4>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              ★ {currentUser?.rating?.average?.toFixed(1) || '5.0'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            {[
              { label: 'Punctuality', val: ratingsBreakdown.punctuality?.average || 5.0 },
              { label: 'Safety', val: ratingsBreakdown.safety?.average || 5.0 },
              { label: 'Behaviour', val: ratingsBreakdown.behaviour?.average || 5.0 },
              { label: 'Cleanliness', val: ratingsBreakdown.cleanliness?.average || 5.0 },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{metric.label}</span>
                  <span className="text-amber-400 font-bold">{metric.val.toFixed(1)} / 5</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(metric.val / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ID Upload Modal with File Picker & Drag-and-Drop */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload Government / Student ID</h3>
                  <p className="text-xs text-slate-400">Official photo identity verification</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl('');
                  setUploadError('');
                }}
                disabled={uploadingId}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Dropzone Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging
                  ? 'border-brand-400 bg-brand-500/10'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="ID Preview"
                    className="max-h-48 rounded-xl object-contain border border-slate-700 mx-auto shadow-md"
                  />
                  <div className="text-xs font-semibold text-slate-200">{selectedFile?.name}</div>
                  <span className="text-[10px] text-slate-400">
                    {(selectedFile?.size / 1024).toFixed(1)} KB · Click or drag another file to change
                  </span>
                </div>
              ) : selectedFile ? (
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 text-brand-400 flex items-center justify-center mx-auto border border-slate-700">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-semibold text-white">{selectedFile.name}</div>
                  <span className="text-[10px] text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB · PDF Document
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Drop your ID document here, or <span className="text-brand-400 underline">browse</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Supports Passport, Driver's License, Aadhaar, or College Student ID (PNG, JPG, WEBP, PDF up to 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploadingId && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Uploading to private vault...</span>
                  <span className="font-bold text-brand-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Security & Privacy Guarantee */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Private & Authenticated Storage</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Your identity document is stored securely in an encrypted vault. Only you and authorized admins
                  can access it; it is never publicly exposed or shared with other co-riders.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
                disabled={uploadingId}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadIdDocument}
                disabled={!selectedFile || uploadingId}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-brand-500 hover:bg-brand-400 transition shadow disabled:opacity-50 flex items-center gap-1.5"
              >
                {uploadingId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Confirm & Verify ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Document Secure Viewer Modal */}
      {showViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Private Identity Document</h3>
                  <span className="text-xs text-slate-400">Authenticated viewer · Protected</span>
                </div>
              </div>
              <button
                onClick={handleCloseViewer}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingViewer ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
                <span className="text-xs font-semibold">Retrieving encrypted document...</span>
              </div>
            ) : viewerError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {viewerError}
              </div>
            ) : viewingBlobUrl ? (
              <div className="p-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[60vh] overflow-auto">
                <img
                  src={viewingBlobUrl}
                  alt="Verified ID Document"
                  className="max-h-[55vh] rounded-xl object-contain shadow-lg"
                />
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">Document ready to download</div>
            )}

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <span>Verified Identity · Private Delivery</span>
              <button
                type="button"
                onClick={handleCloseViewer}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
