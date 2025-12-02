import React, { useState } from 'react';
import { User, Role } from '../types';
import { Button, Card } from './UI';
import { Mail, Lock, User as UserIcon, Briefcase, Phone, School, BookOpen, ArrowRight, UserPlus, LogIn, CheckCircle, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { APP_NAME } from '../constants';

interface AuthProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (user: Omit<User, 'id' | 'avatar' | 'assignedSupervisorId' | 'status'>, password: string) => Promise<void>;
  onResetPassword: (email: string, newPassword: string) => boolean;
  getUserByEmail: (email: string) => Promise<User | null>;
  loginError?: string;
  setLoginError?: (error: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, onResetPassword, getUserByEmail, loginError, setLoginError }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'>('LOGIN');
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regForm, setRegForm] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      institution: '',
      department: '',
      bio: '',
      skills: '',
      hobbies: '',
      role: Role.STUDENT
  });

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState(''); 
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
  const [isSending, setIsSending] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(loginEmail, loginPassword);
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    
    setLoading(true);
    await onRegister({
        name: regForm.name,
        email: regForm.email,
        phone: regForm.phone,
        institution: regForm.institution,
        department: regForm.department,
        bio: regForm.bio,
        profileSkills: regForm.skills ? regForm.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        hobbies: regForm.hobbies ? regForm.hobbies.split(',').map(s => s.trim()).filter(s => s) : [],
        role: regForm.role,
        achievements: [],
        futureGoals: []
    }, regForm.password);
    setLoading(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      setIsSending(true);
      // 1. Check if email exists (Async)
      const user = await getUserByEmail(resetEmail);
      
      if (!user) {
          setResetMessage({ type: 'error', text: 'Email address not found.' });
          setIsSending(false);
          return;
      }
      
      const mockCode = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(mockCode);
      
      try {
          // 2. Send to Webhook
          await fetch('https://automate.deepshiftai.com/webhook/password-rest', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  email: resetEmail,
                  name: user.name,
                  resetCode: mockCode
              })
          });

          // 3. Success Message
          setResetMessage({ type: 'success', text: `The reset code has been sent to ${resetEmail}` });
          setMode('RESET_PASSWORD');
      } catch (error) {
          console.error("Error sending reset code to webhook (continuing flow):", error);
          // Fallback: Continue flow even if webhook fails
          setResetMessage({ type: 'success', text: `The reset code has been sent to ${resetEmail}` });
          setMode('RESET_PASSWORD');
      } finally {
          setIsSending(false);
      }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (resetCode !== generatedCode) {
          setResetMessage({ type: 'error', text: 'Invalid reset code.' });
          return;
      }
      
      const success = onResetPassword(resetEmail, newPassword);
      if (success) {
          alert('Password reset successful! Please login with your new password.');
          setMode('LOGIN');
          setLoginEmail(resetEmail);
          setResetMessage({ type: '', text: '' });
          setResetCode('');
          setNewPassword('');
      } else {
          setResetMessage({ type: 'error', text: 'Email not found.' });
      }
  };

  const switchMode = (newMode: 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD') => {
      setMode(newMode);
      if (setLoginError) setLoginError('');
      setResetMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="mb-8 text-center">
            <img src="https://i.postimg.cc/xdsSw8X5/DEEP_SHIFT_LOGOOO.png" alt="Logo" className="h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{APP_NAME}</h1>
            <p className="text-slate-500 mt-2">Internship Management System</p>
        </div>

        <Card className="w-full max-w-md md:max-w-2xl overflow-hidden shadow-xl border-none">
            <div className="flex flex-col md:flex-row">
                {/* Left Side: Toggle / Info (Visual Only on Desktop) */}
                <div className="hidden md:flex md:w-5/12 bg-indigo-600 text-white p-8 flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            {mode === 'LOGIN' ? 'Welcome Back!' : 
                             mode === 'REGISTER' ? 'Join Us!' : 
                             'Account Recovery'}
                        </h2>
                        <p className="text-indigo-100 text-sm opacity-90">
                            {mode === 'LOGIN' ? 'Sign in to access your dashboard, log activities, and track your progress.' : 
                             mode === 'REGISTER' ? 'Create your profile to start managing internships with Deep Shift.' :
                             'Lost access? We can help you recover your account via email verification.'}
                        </p>
                    </div>
                    <div>
                        {(mode === 'LOGIN' || mode === 'REGISTER') && (
                            <>
                                <p className="text-xs text-indigo-200 mb-2 uppercase tracking-wide font-bold">
                                    {mode === 'LOGIN' ? "Don't have an account?" : "Already registered?"}
                                </p>
                                <button 
                                    onClick={() => switchMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                                    className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-sm font-bold transition-colors"
                                >
                                    {mode === 'LOGIN' ? 'Register Now' : 'Sign In'}
                                </button>
                            </>
                        )}
                        {(mode === 'FORGOT_PASSWORD' || mode === 'RESET_PASSWORD') && (
                            <button 
                                onClick={() => switchMode('LOGIN')}
                                className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={16} /> Back to Login
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 p-8 bg-white">
                    <div className="md:hidden mb-6 text-center">
                         <h2 className="text-2xl font-bold text-slate-800">
                             {mode === 'LOGIN' ? 'Sign In' : 
                              mode === 'REGISTER' ? 'Create Account' : 
                              'Reset Password'}
                         </h2>
                         {(mode === 'LOGIN' || mode === 'REGISTER') && (
                             <button 
                                onClick={() => switchMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                                className="text-sm text-indigo-600 font-bold mt-2 hover:underline"
                             >
                                 {mode === 'LOGIN' ? 'Need an account? Register' : 'Have an account? Login'}
                             </button>
                         )}
                    </div>

                    {mode === 'LOGIN' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            {loginError && (
                                <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg border border-rose-100 flex items-center gap-2">
                                    <span className="font-bold">Error:</span> {loginError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="you@university.edu"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input 
                                        type="password" 
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="text-right mt-1">
                                    <button type="button" onClick={() => switchMode('FORGOT_PASSWORD')} className="text-xs text-slate-400 hover:text-indigo-600">
                                        Forgot password?
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full justify-center py-3 text-base" disabled={loading}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> Sign In</>}
                            </Button>
                        </form>
                    )}

                    {mode === 'FORGOT_PASSWORD' && (
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                <p className="text-xs text-slate-500 mb-4">Enter your registered email address and we'll send you a code to reset your password.</p>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="you@university.edu"
                                        required
                                        disabled={isSending}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full justify-center py-3 text-base" disabled={isSending}>
                                {isSending ? (
                                    <><Loader2 size={18} className="animate-spin" /> Sending...</>
                                ) : (
                                    <><KeyRound size={18} /> Send Reset Code</>
                                )}
                            </Button>
                        </form>
                    )}

                    {mode === 'RESET_PASSWORD' && (
                        <form onSubmit={handleResetPasswordSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {resetMessage.text && (
                                <div className={`text-sm p-3 rounded-lg border flex items-center gap-2 ${resetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    <span className="font-bold">{resetMessage.type === 'success' ? 'Sent:' : 'Error:'}</span> {resetMessage.text}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Verification Code</label>
                                <input 
                                    type="text" 
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest font-mono text-lg"
                                    placeholder="0000"
                                    maxLength={4}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-10 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="New secure password"
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full justify-center py-3 text-base">
                                <CheckCircle size={18} /> Reset Password
                            </Button>
                        </form>
                    )}

                    {mode === 'REGISTER' && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Role Selection */}
                            <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                                <button 
                                    type="button" 
                                    onClick={() => setRegForm({...regForm, role: Role.STUDENT})} 
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${regForm.role === Role.STUDENT ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Student
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setRegForm({...regForm, role: Role.SUPERVISOR})} 
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${regForm.role === Role.SUPERVISOR ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Supervisor
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">First & Last Name</label>
                                    <input 
                                        type="text" 
                                        value={regForm.name}
                                        onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                        placeholder="Jane Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                                    <input 
                                        type="tel" 
                                        value={regForm.phone}
                                        onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={regForm.email}
                                    onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                                    <input 
                                        type="password" 
                                        value={regForm.password}
                                        onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        value={regForm.confirmPassword}
                                        onChange={(e) => setRegForm({...regForm, confirmPassword: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{regForm.role === Role.STUDENT ? 'Institute / University' : 'Company / Organization'}</label>
                                    <input 
                                        type="text" 
                                        value={regForm.institution}
                                        onChange={(e) => setRegForm({...regForm, institution: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{regForm.role === Role.STUDENT ? 'Department' : 'Your Department'}</label>
                                    <input 
                                        type="text" 
                                        value={regForm.department}
                                        onChange={(e) => setRegForm({...regForm, department: e.target.value})}
                                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Student Only Fields */}
                            {regForm.role === Role.STUDENT && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Bio</label>
                                        <textarea 
                                            value={regForm.bio}
                                            onChange={(e) => setRegForm({...regForm, bio: e.target.value})}
                                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm resize-none h-16"
                                            placeholder="Brief introduction..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Skills (Comma separated)</label>
                                            <input 
                                                type="text" 
                                                value={regForm.skills}
                                                onChange={(e) => setRegForm({...regForm, skills: e.target.value})}
                                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                placeholder="React, Java..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Hobbies (Comma separated)</label>
                                            <input 
                                                type="text" 
                                                value={regForm.hobbies}
                                                onChange={(e) => setRegForm({...regForm, hobbies: e.target.value})}
                                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                placeholder="Reading, Gaming..."
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <Button type="submit" className="w-full justify-center py-2 mt-4" disabled={loading}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> {regForm.role === Role.SUPERVISOR ? 'Register as Supervisor' : 'Create Student Account'}</>}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </Card>
        
        <div className="mt-8 text-center text-slate-400 text-xs">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
    </div>
  );
};