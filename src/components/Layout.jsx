import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookMarked, BookOpen, Clock, Compass, User, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import AdSlot from '@/components/ads/AdSlot';
import { isNativePlatform } from '@/lib/platform';
import { useSupporter } from '@/lib/SupporterContext';

const nav = [
  { path:'/', label:'Dao', icon:Compass },
  { path:'/journal', label:'Journal', icon:BookOpen },
  { path:'/timeline', label:'Timeline', icon:Clock },
  { path:'/library', label:'Library', icon:BookMarked },
];

export default function Layout() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const native = isNativePlatform();
  const { entitled, activeBackground } = useSupporter();
  const navigation = native
    ? [...nav, { path: '/supporter', label: entitled ? 'Supporter' : 'Upgrade', icon: Sparkles }]
    : nav;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className={`min-h-screen text-ink ${activeBackground === 'water' ? 'supporter-water-shell' : 'bg-parchment'}`}>
      {activeBackground === 'water' && (
        <div className="supporter-water-background" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      <header className="safe-area-header fixed top-0 inset-x-0 z-40 border-b border-stone/30 bg-parchment/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" aria-label="The Free I Ching home" className="font-serif text-xl tracking-widest text-ink/80 hover:text-ink transition-colors">
            易經
          </Link>
          <nav className="flex items-center gap-1">
            {navigation.map(({ path, label, icon: Icon }) => {
              const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
              return (
                <Link key={path} to={path}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm tracking-wide transition-colors
                    ${active ? 'text-ink' : 'text-ink/55 hover:text-ink/80'}`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
            {!native && (isAuthenticated ? (
              <Link
                to="/profile"
                aria-label="Profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm tracking-wide transition-colors
                  ${pathname.startsWith('/profile') ? 'text-ink' : 'text-ink/55 hover:text-ink/80'}`}
                title={user?.email}
              >
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">{user?.displayName || 'Profile'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                aria-label="Sign in"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm tracking-wide transition-colors
                  ${pathname.startsWith('/login') || pathname.startsWith('/signup') ? 'text-ink' : 'text-ink/55 hover:text-ink/80'}`}
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="safe-area-main min-h-screen">
        <Outlet />
      </main>

      <AdSlot placement="site-footer" className="max-w-2xl mx-auto px-6 py-6" />

      <footer className="safe-area-footer border-t border-stone/20 px-6 py-10 text-center">
        <p className="text-xs tracking-widest text-ink/50 uppercase">The Book of Changes · 周易</p>
        <div className="mt-3 flex justify-center gap-5 text-xs text-ink/55">
          <Link to="/support" className="underline underline-offset-4 hover:text-ink">Support</Link>
          <Link to="/privacy" className="underline underline-offset-4 hover:text-ink">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
