import { useState, useEffect } from 'react';
import { RetailerAuthForm } from './components/RetailerAuthForm';
import { CustomerAuthForm } from './components/CustomerAuthForm';
import { CustomerPortal } from './components/CustomerPortal';
import { RetailerPortal } from './components/RetailerPortal';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { supabase } from './utils/supabase-client';
import { signup, getProfile, retailerLogin, verifySession, changeRetailerPassword } from './utils/api';
import type { UserProfile } from './types';
import { toast } from 'sonner@2.0.3';

type PortalType = 'customer' | 'retailer' | null;

export default function App() {
  const [portalSelection, setPortalSelection] = useState<PortalType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check for retailer session first
      const storedRetailerSession = localStorage.getItem('retailer_session');
      if (storedRetailerSession) {
        try {
          const session = await verifySession(storedRetailerSession);
          if (session.userType === 'retailer') {
            setSessionToken(storedRetailerSession);
            setPortalSelection('retailer');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          localStorage.removeItem('retailer_session');
        }
      }

      // Check for customer session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        setAccessToken(session.access_token);
        const userProfile = await getProfile(session.access_token);
        setProfile(userProfile);
        setPortalSelection('customer');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Retailer handlers
  const handleRetailerLogin = async (email: string, password: string) => {
    const data = await retailerLogin(email, password);
    setSessionToken(data.sessionToken);
    localStorage.setItem('retailer_session', data.sessionToken);
    setPortalSelection('retailer');
  };

  const handleRetailerPasswordChange = async (currentPassword: string, newPassword: string) => {
    if (!sessionToken) throw new Error('No active session');
    await changeRetailerPassword(sessionToken, currentPassword, newPassword);
  };

  const handleRetailerLogout = () => {
    localStorage.removeItem('retailer_session');
    setSessionToken(null);
    setPortalSelection(null);
  };

  // Customer handlers
  const handleCustomerLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      setAccessToken(data.session.access_token);
      const userProfile = await getProfile(data.session.access_token);
      setProfile(userProfile);
      setPortalSelection('customer');
    }
  };

  const handleCustomerSignup = async (email: string, password: string, name: string, phone?: string) => {
    await signup(email, password, name, phone);
    // After signup, login automatically
    await handleCustomerLogin(email, password);
  };

  const handlePhoneLogin = async (phone: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });

      if (error) throw error;

      toast.success('OTP sent to your phone!');
      toast.info('Please enter the OTP to complete login (Feature requires Supabase auth configuration)');
    } catch (error: any) {
      throw new Error(error.message || 'Phone login requires Supabase SMS configuration. Please use email login for this prototype.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
      });

      if (error) throw error;

      toast.info(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login initiated. Please complete setup at https://supabase.com/docs/guides/auth/social-login/auth-${provider}`);
    } catch (error: any) {
      throw new Error(error.message || `${provider} login requires OAuth configuration in Supabase. Please use email login for this prototype.`);
    }
  };

  const handleCustomerLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setProfile(null);
    setPortalSelection(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Vastralaya...</p>
        </div>
      </div>
    );
  }

  // Portal selection screen
  if (!portalSelection) {
    return (
      <>
        <AnimatedBackground variant="portal-select">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-8 max-w-2xl">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl text-white drop-shadow-lg">
                  Vastralaya
                </h1>
                <p className="text-xl text-orange-100">
                  Traditional Indian Fashion at Your Fingertips
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-12">
                <div
                  className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => setPortalSelection('customer')}
                >
                  <div className="text-6xl mb-4">🛍️</div>
                  <h2 className="text-2xl mb-2 text-gray-800">Shop Now</h2>
                  <p className="text-gray-600">
                    Browse our exclusive collection of sarees, kurtis, and traditional dresses
                  </p>
                  <Button className="mt-6 w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700">Customer Portal</Button>
                </div>

                <div
                  className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => setPortalSelection('retailer')}
                >
                  <div className="text-6xl mb-4">🏪</div>
                  <h2 className="text-2xl mb-2 text-gray-800">Retailer Login</h2>
                  <p className="text-gray-600">
                    Manage your products and orders
                  </p>
                  <Button className="mt-6 w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                    Retailer Portal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AnimatedBackground>
        <Toaster />
      </>
    );
  }

  // Retailer Portal
  if (portalSelection === 'retailer') {
    if (!sessionToken) {
      return (
        <>
          <div className="relative">
            <Button
              variant="ghost"
              className="absolute top-4 left-4 z-10"
              onClick={() => setPortalSelection(null)}
            >
              ← Back
            </Button>
            <RetailerAuthForm onLogin={handleRetailerLogin} />
          </div>
          <Toaster />
        </>
      );
    }

    return (
      <>
        <RetailerPortal
          sessionToken={sessionToken}
          onLogout={handleRetailerLogout}
          onChangePassword={handleRetailerPasswordChange}
        />
        <Toaster />
      </>
    );
  }

  // Customer Portal
  if (portalSelection === 'customer') {
    if (!accessToken || !profile) {
      return (
        <>
          <div className="relative">
            <Button
              variant="ghost"
              className="absolute top-4 left-4 z-10 text-white"
              onClick={() => setPortalSelection(null)}
            >
              ← Back
            </Button>
            <CustomerAuthForm
              onLogin={handleCustomerLogin}
              onSignup={handleCustomerSignup}
              onSocialLogin={handleSocialLogin}
              onPhoneLogin={handlePhoneLogin}
            />
          </div>
          <Toaster />
        </>
      );
    }

    return (
      <>
        <CustomerPortal
          accessToken={accessToken}
          profile={profile}
          onLogout={handleCustomerLogout}
        />
        <Toaster />
      </>
    );
  }

  return null;
}
