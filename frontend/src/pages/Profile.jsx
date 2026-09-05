import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatDate } from '../utils/helpers';

export const Profile = () => {
  const { user, loading, error, updateProfile, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    password: '',
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        password: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (successMsg) setSuccessMsg('');
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');

    const payload = {
      name: formData.name,
      email: formData.email,
      avatar: formData.avatar,
    };
    if (formData.password) {
      payload.password = formData.password;
    }

    const result = await updateProfile(payload);
    if (!result.error) {
      setSuccessMsg('Profile updated successfully!');
      setFormData((prev) => ({ ...prev, password: '' }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Account Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal account information and credentials.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 text-center flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/40 bg-slate-800 shadow-xl mb-4">
            <img
              src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-base font-bold text-slate-100">{user?.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          <span className="mt-3 text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono uppercase tracking-wider font-semibold">
            {user?.role || 'DevOps User'}
          </span>
          {user?.createdAt && (
            <p className="text-[11px] text-slate-500 font-mono mt-4 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(user.createdAt)}
            </p>
          )}
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2" title="Edit Profile Details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Avatar Image URL</label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Password <span className="text-slate-500">(Leave blank to keep unchanged)</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button type="submit" variant="primary" isLoading={loading}>
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
