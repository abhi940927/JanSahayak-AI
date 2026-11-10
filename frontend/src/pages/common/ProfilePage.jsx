import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
  Save,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile, changePassword, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    dob: '',
    avatar_url: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [photoDirty, setPhotoDirty] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // UI state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        dob: user.dob ? user.dob.split('T')[0] : '',
        avatar_url: user.avatar_url || ''
      });
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  // Handle local photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Profile photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setFormData(prev => ({ ...prev, avatar_url: reader.result }));
      setPhotoDirty(true);
      setProfileError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    setPhotoDirty(true);
  };

  // Save Personal Info & Photo
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || formData.full_name.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters long');
      return;
    }

    if (formData.dob) {
      const bDate = new Date(formData.dob);
      if (isNaN(bDate.getTime()) || bDate > new Date()) {
        setProfileError('Date of birth cannot be in the future');
        return;
      }
    }

    try {
      setSavingProfile(true);
      setProfileError('');
      setProfileSuccess('');

      await updateProfile({
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim() || null,
        dob: formData.dob || null,
        avatar_url: formData.avatar_url || null
      });

      setPhotoDirty(false);
      setProfileSuccess('Your profile details and avatar have been successfully updated.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.new_password || passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError('');
      setPasswordSuccess('');

      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      });

      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordSuccess('Password successfully updated and recorded in the secure auth store.');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout title="User Profile" subtitle="Manage your identity, personal details and security credentials">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="User Profile & Account Settings"
      subtitle="Manage your personal details, government credentials, profile photo and account security."
    >
      <div className="max-w-4xl space-y-6">
        {/* Profile Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.full_name || 'Profile Avatar'}
                className="w-24 h-24 rounded-full object-cover border-4 border-gov-teal-500 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gov-navy-900 text-white flex items-center justify-center font-black text-3xl uppercase shadow-md border-4 border-slate-200">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
            )}

            <label
              className="absolute bottom-0 right-0 p-2 bg-gov-teal-600 hover:bg-gov-teal-700 text-white rounded-full cursor-pointer shadow-md transition-all hover:scale-105"
              title="Upload new profile picture"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-black text-gov-navy-900">
                {user?.full_name || 'Authenticated Citizen'}
              </h2>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gov-teal-50 text-gov-teal-800 border border-gov-teal-200 capitalize">
                <ShieldCheck className="w-3.5 h-3.5 text-gov-teal-600" />
                <span>{user?.role?.replace('_', ' ') || 'Citizen'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {user?.designation || 'Verified Public Service Redressal Participant'}
            </p>

            <div className="pt-2 flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{user?.email}</span>
              </span>
              {user?.phone_number && (
                <span className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.phone_number}</span>
                </span>
              )}
              {user?.dob && (
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>DOB: {new Date(user.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
              )}
            </div>

            {photoDirty && (
              <div className="pt-2 flex items-center justify-center sm:justify-start space-x-2">
                <span className="text-[11px] text-amber-700 font-medium">New photo selected — save changes below to persist.</span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] text-rose-600 hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Edit Personal Details Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-gov-navy-900">Personal Information</h3>
              <p className="text-xs text-slate-500">Update your public identity details and contact information.</p>
            </div>
            <User className="w-5 h-5 text-gov-teal-600" />
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Verified)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Contact system admin to request an official email modification</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Read-Only Role & Clearance Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Assigned Clearance:</span>
                <span className="font-bold text-gov-navy-900 capitalize">{user?.role?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Designation:</span>
                <span className="font-bold text-slate-700">{user?.designation || 'Citizen Redressal User'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Account Status:</span>
                <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Active & Verified</span>
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center space-x-2 bg-gov-teal-600 hover:bg-gov-teal-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Security & Password Update */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-gov-navy-900">Security Credentials</h3>
              <p className="text-xs text-slate-500">Change your account password securely using cryptographic authentication.</p>
            </div>
            <KeyRound className="w-5 h-5 text-gov-teal-600" />
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gov-teal-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center space-x-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
