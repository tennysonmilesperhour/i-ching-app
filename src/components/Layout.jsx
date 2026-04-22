import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Clock, Compass, User, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import AdSlot from '@/components/ads/AdSlot';

const nav = [
  { path:'/', label:'Dao', icon:Compass },
  { path:'/journal', label:'Journal', icon:BookOpen },
  { path:'/timeline', label:'Timeline', icon:Clock },
];

export default function Layout() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="fixed top-0 inset-x-0 z-40 border-b border-stone/30 bg-parchment/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl tracking-widest text-ink/80 hover:text-ink transition-colors">
            易經
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ path, label, icon: Icon }) => {
              const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
              return (
                <Link key={path} to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm tracking-wide transition-colors
                    ${active ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
            {isAuthenticated ? (
              <Link
                to="/profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm tracking-wide transition-colors
                  ${pathname.startsWith('/profile') ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}
                title={user?.email}
              >
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">{user?.displayName || 'Profile'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm tracking-wide transition-colors
                  ${pathname.startsWith('/login') || pathname.startsWith('/signup') ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="pt-14 min-h-screen">
        <Outlet />
      </main>

      <AdSlot placement="site-footer" className="max-w-2xl mx-auto px-6 py-6" />

      <footer className="border-t border-stone/20 py-10 text-center">
        <p className="text-xs tracking-widest text-ink/25 uppercase">The Book of Changes · 周易</p>
      </footer>
    </div>
  );
}
