import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <p className="text-6xl font-serif text-ink/20 mb-4">404</p>
      <h1 className="text-2xl font-serif text-ink/80 mb-2">Path Not Found</h1>
      <p className="text-ink/50 mb-8 max-w-sm">
        The way you seek does not exist. Return to the oracle and begin again.
      </p>
      <Link
        to="/"
        className="px-6 py-2 border border-ink/20 rounded text-sm tracking-wide text-ink/70 hover:text-ink hover:border-ink/40 transition-colors"
      >
        Return to the Dao
      </Link>
    </div>
  );
}
