import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Phone,
  Plus,
  Trash2,
  Building,
  Mail,
  CheckCircle2,
  Star,
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
    setLoading(true);
    try {
      const data = await userService.getEmergencyContacts();
      const list = Array.isArray(data) ? data : data?.contacts || [];
      setContacts(list);
    } catch (err) {
      console.error('Failed to load emergency contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (key) => {
    const updated = !verification[key];
    setVerification((prev) => ({ ...prev, [key]: updated }));

    try {
      await userService.updateVerification({ [key]: updated });
      await refreshUser();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update verification status:', err);
      setVerification((prev) => ({ ...prev, [key]: !updated }));
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!name || !phoneNum) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await userService.addEmergencyContact({
        name: name.trim(),
        phone: phoneNum.trim(),
        relationship,
      });
      const list = Array.isArray(res) ? res : res?.contacts || [];
      setContacts(list);
      setName('');
      setPhoneNum('');
      setShowAddContact(false);
      await refreshUser();
      if (onUpdate) onUpdate();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      const res = await userService.deleteEmergencyContact(contactId);
      const list = Array.isArray(res) ? res : res?.contacts || [];
      setContacts(list);
      await refreshUser();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    setUploadError('');
    setUploadSuccess('');

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid image (PNG, JPG, WEBP) or PDF document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB maximum upload limit.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl('');
    }
  };

  const handleUploadIdDocument = async () => {
    if (!selectedFile) return;

    setUploadingId(true);
    setUploadError('');
    setUploadSuccess('');
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      setUploadProgress(50);
      const res = await userService.uploadIdDocument(formData);
      setUploadProgress(100);

      setUploadSuccess('Document uploaded securely and verified!');
      setVerification((prev) => ({ ...prev, govtId: true }));

      await refreshUser();
      await loadLiveProfile();
      if (onUpdate) onUpdate();

      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadSuccess('');
      }, 1200);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document.');
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
      setViewerError(err.message || 'Failed to load document');
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Safety, trust & verification
            </h3>
            <p className="text-xs text-slate-500">
              Community protection, emergency dispatch network & verified identity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Safety network active</span>
          </span>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Verification Badges */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Verification credentials
          </h4>

          <div className="space-y-2.5">
            {/* Email Verification */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block">Email address</span>
                  <span className="text-[11px] text-slate-500 block truncate">{currentUser?.email || 'Not provided'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('email')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  verification.email
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {verification.email ? '✓ Verified' : 'Verify'}
              </button>
            </div>

            {/* Phone Verification */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block">Phone number</span>
                  <span className="text-[11px] text-slate-500 block truncate">{currentUser?.phone || 'Not provided'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('phone')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  verification.phone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {verification.phone ? '✓ Verified' : 'Verify'}
              </button>
            </div>

            {/* Workplace / College Verification */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <Building className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block">Campus / workplace</span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {currentUser?.organization || 'Registered Organization'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleVerification('organization')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition flex items-center gap-1 shrink-0 ${
                  verification.organization
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {verification.organization ? '✓ Verified' : 'Verify'}
              </button>
            </div>

            {/* Real Government / Student ID Upload Item */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className={`w-4 h-4 shrink-0 ${verification.govtId ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block">Government / Student ID</span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {verification.govtId
                      ? 'Encrypted in private vault'
                      : 'Upload photo identity document'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {verification.govtId ? (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenViewer}
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1 shadow-xs"
                      title="View private document"
                    >
                      <Eye className="w-3 h-3 text-slate-500" />
                      <span>View</span>
                    </button>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      ✓ Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1 shadow-xs"
                      title="Replace existing ID"
                    >
                      <RefreshCw className="w-2.5 h-2.5 text-slate-500" />
                      <span>Replace</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-xs transition flex items-center gap-1 shrink-0"
                  >
                    <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
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
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-rose-600" />
              Emergency contacts ({contacts.length}/5)
            </h4>
            {contacts.length < 5 && (
              <button
                type="button"
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add contact
              </button>
            )}
          </div>

          {/* Add Contact Inline Form */}
          {showAddContact && (
            <form onSubmit={handleAddContact} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-xs">
              <div className="text-xs font-bold text-slate-900">Add trusted contact</div>
              {errorMsg && <div className="text-[11px] text-rose-600">{errorMsg}</div>}
              <input
                type="text"
                placeholder="Contact Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                required
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  required
                />
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
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
                  className="px-2.5 py-1 rounded-lg text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 transition shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save contact'}
                </button>
              </div>
            </form>
          )}

          {/* Contact List */}
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Phone className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-700 font-medium">No emergency contacts saved</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add family or friends who will receive automated SOS alerts with live coordinates.
                </p>
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c._id || c.phone}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                        {c.relationship}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{c.phone}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(c._id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
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
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-sunrise-500 fill-sunrise-500" />
              Mutual trust rating
            </h4>
            <span className="text-xs font-bold text-sunrise-800 flex items-center gap-1">
              ★ {currentUser?.rating?.average?.toFixed(1) || '5.0'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            {[
              { label: 'Punctuality', val: ratingsBreakdown.punctuality?.average || 5.0 },
              { label: 'Safety', val: ratingsBreakdown.safety?.average || 5.0 },
              { label: 'Behaviour', val: ratingsBreakdown.behaviour?.average || 5.0 },
              { label: 'Cleanliness', val: ratingsBreakdown.cleanliness?.average || 5.0 },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">{metric.label}</span>
                  <span className="text-sunrise-800 font-bold">{metric.val.toFixed(1)} / 5</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sunrise-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(metric.val / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ID Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-elevated p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload Government / Student ID</h3>
                  <p className="text-xs text-slate-500">Official photo identity verification</p>
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
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
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
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50'
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
                    className="max-h-48 rounded-xl object-contain border border-slate-200 mx-auto shadow-md"
                  />
                  <div className="text-xs font-semibold text-slate-800">{selectedFile?.name}</div>
                  <span className="text-[11px] text-slate-500">
                    {(selectedFile?.size / 1024).toFixed(1)} KB · Click or drag another file to change
                  </span>
                </div>
              ) : selectedFile ? (
                <div className="space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-semibold text-slate-900">{selectedFile.name}</div>
                  <span className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB · PDF Document
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    Drop your ID document here, or <span className="text-emerald-700 underline">browse</span>
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
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Uploading to private vault...</span>
                  <span className="font-bold text-emerald-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Security Guarantee */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Private & authenticated storage</span>
                <span className="text-slate-600 text-[11px] leading-relaxed">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadIdDocument}
                disabled={!selectedFile || uploadingId}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {uploadingId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Confirm & verify ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Document Secure Viewer Modal */}
      {showViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Private identity document</h3>
                  <span className="text-xs text-slate-500">Authenticated viewer · Protected</span>
                </div>
              </div>
              <button
                onClick={handleCloseViewer}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingViewer ? (
              <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold">Retrieving encrypted document...</span>
              </div>
            ) : viewerError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {viewerError}
              </div>
            ) : viewingBlobUrl ? (
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center max-h-[60vh] overflow-auto">
                <img
                  src={viewingBlobUrl}
                  alt="Verified ID Document"
                  className="max-h-[55vh] rounded-lg object-contain shadow-sm"
                />
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">Document ready to download</div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>Verified Identity · Private Delivery</span>
              <button
                type="button"
                onClick={handleCloseViewer}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
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
