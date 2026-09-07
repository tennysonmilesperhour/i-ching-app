import { Toaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// Add page imports here
import Layout from './components/Layout';
import Oracle from './pages/Oracle';
import Reading from './pages/Reading';
import Journal from './pages/Journal';
import Timeline from './pages/Timeline';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Library from './pages/Library';
import HexagramGuide from './pages/HexagramGuide';
import Privacy from './pages/Privacy';
import Support from './pages/Support';
import SupportThanks from './pages/SupportThanks';
import Supporter from './pages/Supporter';
import { SupporterProvider } from '@/lib/SupporterContext';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Oracle />} />
        <Route path="/reading/:id" element={<Reading />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/:number" element={<HexagramGuide />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/thanks" element={<SupportThanks />} />
        <Route path="/supporter" element={<Supporter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <SupporterProvider>
        <AuthProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </AuthProvider>
      </SupporterProvider>
    </QueryClientProvider>
  )
}

export default App
