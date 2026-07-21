import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { loginWithEmail, signupWithEmail, loginWithGoogle, sendResetPasswordEmail } from '../services/firebase';

export default function Auth() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');

    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, displayName);
      }
      // Auth state change is handled by AppContext's onAuthChange listener
      navigate('/dashboard');
    } catch (err) {
      console.error("Auth error:", err);
      // Map Firebase error codes to user-friendly messages
      const errorMap = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(errorMap[err.code] || err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await sendResetPasswordEmail(email);
      alert(`A password reset link has been sent to ${email}. Please check your inbox.`);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 overflow-x-hidden relative">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-surface">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Split Layout Container */}
      <main className="w-full max-w-[1280px] min-h-[700px] flex overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* Left Section: Authentication Form */}
        <section className="w-full lg:w-1/2 flex flex-col p-8 md:p-16 lg:p-20 justify-center">
          {/* Logo & Brand Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-bold">DermaScreen</h1>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">AI-Powered Clinical Dermatology Assistant</p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex gap-8 mb-10 border-b border-outline-variant">
            <button 
              type="button"
              onClick={() => { setIsLoginMode(true); setError(''); }}
              className={`pb-4 font-label-md text-label-md transition-all ${
                isLoginMode 
                  ? 'text-primary border-b-2 border-primary font-semibold' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsLoginMode(false); setError(''); }}
              className={`pb-4 font-label-md text-label-md transition-all ${
                !isLoginMode 
                  ? 'text-primary border-b-2 border-primary font-semibold' 
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-error text-[20px]">error</span>
              <p className="text-error text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Display Name Field (signup only) */}
            {!isLoginMode && (
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="displayName">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all font-body-md text-body-md" 
                    id="displayName" 
                    placeholder="Dr. John Smith"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input 
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all font-body-md text-body-md" 
                  id="email" 
                  placeholder={isLoginMode ? "practitioner@clinic.com" : "you@example.com"}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                {isLoginMode && <a className="text-label-sm font-label-sm text-primary hover:underline" href="#" onClick={handleForgotPassword}>Forgot password?</a>}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  required
                  className="w-full pl-11 pr-12 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary outline-none transition-all font-body-md text-body-md" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors" 
                  onClick={() => setShowPassword(!showPassword)} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            {isLoginMode && (
              <div className="flex items-center gap-3">
                <input 
                  id="remember" 
                  type="checkbox"
                  className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary"
                />
                <label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Remember me on this device</label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 space-y-4">
              <button 
                disabled={loading}
                className="w-full h-12 bg-primary text-white font-label-md text-label-md rounded-xl hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
                type="submit"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  isLoginMode ? "Access Dashboard" : "Create New Account"
                )}
              </button>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-on-surface-variant font-label-sm">Or continue with</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-3 border border-outline-variant text-on-surface font-label-md text-label-md rounded-xl hover:bg-surface-container-low transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                </svg>
                Sign in with Google
              </button>
            </div>
          </form>

          {/* Footer Legal */}
          <div className="mt-auto pt-10 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Authorized personnel only. By accessing this system, you agree to our 
              <a className="text-primary hover:underline ml-1" href="#">Privacy Policy</a> and <a className="text-primary hover:underline ml-1" href="#">Terms of Service</a>.
            </p>
          </div>
        </section>

        {/* Right Section: Illustration & Branding */}
        <section className="hidden lg:flex w-1/2 relative bg-surface-container overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-primary-container blur-[120px]"></div>
            <div className="absolute bottom-[-5%] left-[-5%] w-[60%] h-[60%] rounded-full bg-secondary-container blur-[100px]"></div>
          </div>
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-16 text-center">
            <div className="relative w-full max-w-[480px] aspect-square mb-12 transform hover:scale-[1.02] transition-all duration-700">
              <div className="absolute inset-0 rounded-[40px] bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl"></div>
              <div className="absolute inset-4 rounded-[32px] overflow-hidden bg-gradient-to-br from-primary-fixed/30 to-secondary-container/40 flex items-center justify-center">
                <svg viewBox="0 0 400 400" className="w-[85%] h-[85%]" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circles */}
                  <circle cx="200" cy="200" r="160" fill="#caead6" opacity="0.3"/>
                  <circle cx="200" cy="200" r="120" fill="#caead6" opacity="0.4"/>
                  <circle cx="200" cy="200" r="80" fill="#caead6" opacity="0.5"/>
                  
                  {/* Magnifying glass body */}
                  <circle cx="175" cy="170" r="75" stroke="#006b2c" strokeWidth="6" fill="white" opacity="0.9"/>
                  <line x1="232" y1="228" x2="300" y2="296" stroke="#006b2c" strokeWidth="8" strokeLinecap="round"/>
                  
                  {/* Skin pattern inside magnifier */}
                  <circle cx="160" cy="155" r="12" fill="#e8c4a0" opacity="0.7"/>
                  <circle cx="185" cy="145" r="8" fill="#d4a574" opacity="0.6"/>
                  <circle cx="170" cy="180" r="10" fill="#e0b088" opacity="0.65"/>
                  <circle cx="195" cy="175" r="6" fill="#c89060" opacity="0.5"/>
                  
                  {/* AI scan lines */}
                  <line x1="115" y1="140" x2="235" y2="140" stroke="#006b2c" strokeWidth="1.5" opacity="0.3" strokeDasharray="4 4">
                    <animate attributeName="y1" values="110;230;110" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="y2" values="110;230;110" dur="3s" repeatCount="indefinite"/>
                  </line>
                  <line x1="115" y1="145" x2="235" y2="145" stroke="#00873a" strokeWidth="1" opacity="0.2" strokeDasharray="3 5">
                    <animate attributeName="y1" values="115;235;115" dur="3s" begin="0.15s" repeatCount="indefinite"/>
                    <animate attributeName="y2" values="115;235;115" dur="3s" begin="0.15s" repeatCount="indefinite"/>
                  </line>
                  
                  {/* Neural network nodes */}
                  <circle cx="90" cy="290" r="8" fill="#006b2c" opacity="0.7"/>
                  <circle cx="130" cy="310" r="6" fill="#006b2c" opacity="0.5"/>
                  <circle cx="110" cy="270" r="5" fill="#00873a" opacity="0.6"/>
                  <circle cx="70" cy="310" r="4" fill="#006b2c" opacity="0.4"/>
                  <line x1="90" y1="290" x2="130" y2="310" stroke="#006b2c" strokeWidth="1" opacity="0.3"/>
                  <line x1="90" y1="290" x2="110" y2="270" stroke="#006b2c" strokeWidth="1" opacity="0.3"/>
                  <line x1="90" y1="290" x2="70" y2="310" stroke="#006b2c" strokeWidth="1" opacity="0.3"/>
                  
                  {/* Check mark */}
                  <circle cx="310" cy="110" r="22" fill="#006b2c"/>
                  <path d="M298 110 L306 118 L322 102" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  {/* Pulse/heartbeat line */}
                  <polyline points="50,330 80,330 95,310 110,350 125,320 140,330 170,330" stroke="#006b2c" strokeWidth="2" fill="none" opacity="0.4"/>
                </svg>
              </div>
              <div className="absolute -top-6 -right-6 glass-card p-4 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3 animate-bounce">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div className="text-left">
                  <p className="font-label-sm text-on-surface leading-tight font-semibold">99.8% Accuracy</p>
                  <p className="text-[10px] text-on-surface-variant">Validated clinical AI</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-8 glass-card p-4 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                </div>
                <div className="text-left">
                  <p className="font-label-sm text-on-surface leading-tight font-semibold">HIPAA Compliant</p>
                  <p className="text-[10px] text-on-surface-variant">Encrypted patient data</p>
                </div>
              </div>
            </div>
            <div className="max-w-md space-y-4">
              <h2 className="font-headline-lg text-headline-lg text-on-background font-bold">Advanced Diagnostic Intelligence</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Empowering practitioners with state-of-the-art vision models for rapid, accurate skin analysis and longitudinal tracking.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
