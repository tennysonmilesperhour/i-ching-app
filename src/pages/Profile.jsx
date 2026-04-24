import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';

export default function Profile() {
  useSEO({
    title: 'Profile',
    description: 'Your I Ching profile and saved readings.',
    path: '/profile',
    noindex: true,
  });

  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth, logout, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  // Editing buffer. Seeded fresh from the user each time the edit form opens
  // so it survives auth loading (user is null on first render) and resets on
  // cancel without clearing what was displayed.
  const [displayName, setDisplayName] = useState('');

  const { data: readings, isLoading } = useQuery({
    queryKey: ['readings'],
    queryFn: () => base44.entities.Reading.list('-created_date'),
    enabled: isAuthenticated,
  });

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?next=/profile" replace />;
  }

  const handleSaveName = () => {
    try {
      updateProfile({ displayName: displayName.trim() || user.email.split('@')[0] });
      toast.success('Profile updated.');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Could not update profile.');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out.');
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-serif tracking-wide text-ink/90">Profile</h1>
        <p className="text-xs text-ink/35 tracking-widest uppercase mt-1">{user.email}</p>
      </div>

      <div className="border border-stone/20 rounded p-5 mb-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-widest uppercase text-ink/40">Display Name</span>
          {!editing && (
            <button
              onClick={() => {
                setDisplayName(user.displayName || '');
                setEditing(true);
              }}
              className="text-xs text-ink/50 underline underline-offset-4 hover:text-ink"
            >
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-transparent border border-stone/30 rounded px-4 py-2 text-ink focus:outline-none focus:border-ink/40"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveName}
                className="px-4 py-1.5 bg-ink text-parchment rounded text-sm hover:bg-ink/85 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-1.5 border border-stone/30 text-ink/60 rounded text-sm hover:text-ink hover:border-ink/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="font-serif text-lg text-ink/85">{user.displayName}</p>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-xs tracking-widest uppercase text-ink/40 mb-4">Saved Readings</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-stone/30 border-t-ink/60 rounded-full animate-spin" />
          </div>
        ) : !readings?.length ? (
          <p className="text-sm text-ink/40">
            You have no saved readings yet.{' '}
            <Link to="/" className="underline underline-offset-4 text-ink">
              Consult the Oracle
            </Link>
            .
          </p>
        ) : (
          <p className="text-sm text-ink/50">
            {readings.length} reading{readings.length === 1 ? '' : 's'} saved ·{' '}
            <Link to="/journal" className="underline underline-offset-4 text-ink">
              View journal
            </Link>
          </p>
        )}
      </div>

      <div className="border-t border-stone/20 pt-6">
        <button
          onClick={handleLogout}
          className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
