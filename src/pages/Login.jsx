import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const next = params.get('next') || '/profile';
  const claimReading = params.get('claimReading');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password });

      if (claimReading) {
        const attached = await base44.entities.Reading.claim(claimReading, user.id);
        if (attached) {
          toast.success('Reading saved to your journal.');
          navigate(`/reading/${attached.id}`, { replace: true });
          return;
        }
      }

      toast.success('Welcome back.');
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-serif tracking-wide text-ink/90">Sign In</h1>
        <p className="text-xs text-ink/35 tracking-widest uppercase mt-1">Continue your journal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink/40 mb-2">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink placeholder:text-ink/25 focus:outline-none focus:border-ink/40"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase text-ink/40 mb-2">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border border-stone/30 rounded px-4 py-3 text-ink focus:outline-none focus:border-ink/40"
          />
        </div>

        {error && <p className="text-sm text-red-700/80">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-ink text-parchment rounded text-sm tracking-wide hover:bg-ink/85 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/50">
        New here?{' '}
        <Link
          to={`/signup${params.toString() ? `?${params.toString()}` : ''}`}
          className="text-ink underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
