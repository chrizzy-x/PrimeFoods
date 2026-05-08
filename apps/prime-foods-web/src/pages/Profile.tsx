import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '../lib/queries';
import { supabase } from '../lib/supabase';

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold">
      {initials || '?'}
    </div>
  );
}

export function Profile() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const startEdit = () => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    setEditing(true);
    setError('');
  };

  const handleSave = async () => {
    try {
      await updateProfile({ full_name: fullName, phone });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save changes');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 pt-10 pb-8">
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">Profile</h1>

      <div className="flex flex-col items-center mb-6">
        <Avatar name={profile?.full_name ?? ''} />
        <h2 className="font-display font-semibold text-xl text-text-primary mt-3">
          {profile?.full_name || 'Anonymous'}
        </h2>
        <span className="mt-1 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-accent/15 text-accent border border-accent/30">
          {profile?.role ?? 'customer'}
        </span>
      </div>

      {/* Info / Edit */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-medium block mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {isPending ? 'Saving…' : saved ? '✓ Saved!' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-xs font-medium">Name</p>
                <p className="text-text-primary text-sm mt-0.5">{profile?.full_name || '—'}</p>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-text-secondary text-xs font-medium">Phone</p>
              <p className="text-text-primary text-sm mt-0.5">{profile?.phone || '—'}</p>
            </div>
            <button
              onClick={startEdit}
              className="w-full mt-1 py-3 rounded-xl border border-border text-text-primary text-sm font-medium hover:border-accent/50 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full py-3.5 rounded-2xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
