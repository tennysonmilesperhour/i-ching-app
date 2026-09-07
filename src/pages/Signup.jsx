import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const claimReading = params.get('claimReading');
  const next = params.get('next');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await signup({ email, password, displayName });

      if (claimReading) {
        const attached = await base44.entities.Reading.claim(claimReading, user.id);
        if (attached) {
          toast.success('Account created. This reading is now saved to your journal.');
          navigate(`/reading/${attached.id}`, { replace: true });
          return;
        }
      }

      toast.success('Account created.');
      navigate(next || '/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-serif tracking-wide text-ink/90">Create an Account</h1>
        <p className="text-xs text-ink/55 tracking-widest uppercase mt-1">
          {claimReading ? 'Save this reading to your journal' : 'Begin your journal'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink/55 mb-2">
            Display Name <span className="normal-case tracking-normal text-ink/50">(optional)</span>
          </label>
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink placeholder:text-ink/45 focus:outline-none focus:border-ink/50"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink/55 mb-2">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink focus:outline-none focus:border-ink/40"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink/55 mb-2">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink focus:outline-none focus:border-ink/40"
          />
          <p className="mt-1 text-xs text-ink/55">At least 6 characters.</p>
        </div>

        {error && <p className="text-sm text-red-700/80">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-ink text-parchment rounded text-sm tracking-wide hover:bg-ink/85 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/50">
        Already have an account?{' '}
        <Link
          to={`/login${params.toString() ? `?${params.toString()}` : ''}`}
          className="text-ink underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
