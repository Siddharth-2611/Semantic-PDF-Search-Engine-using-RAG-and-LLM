import React, { useState, useRef } from 'react';
import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || '') + '/api';

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  const startTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const submitCredentials = async () => {
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        if (!form.name) { setError('Name is required'); setLoading(false); return; }
        const res = await axios.post(`${BASE}/auth/register`, {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify({
          name: res.data.name,
          email: res.data.email,
        }));
        onLogin(res.data);
      } else {
        // Login — sends OTP to email
        const res = await axios.post(`${BASE}/auth/login`, {
          email: form.email,
          password: form.password,
        });
        // OTP sent successfully — show OTP screen
        if (res.data.otpSent) {
          setPendingEmail(form.email);
          setStep(2);
          startTimer();
          setOtp(['', '', '', '', '', '']);
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BASE}/auth/verify-otp`, {
        email: pendingEmail,
        otp: otpCode,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({
        name: res.data.name,
        email: res.data.email,
      }));
      onLogin(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid or expired OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BASE}/auth/login`, {
        email: pendingEmail,
        password: form.password,
      });
      setOtp(['', '', '', '', '', '']);
      startTimer();
    } catch (e) {
      setError('Failed to resend OTP. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setError('');
    setOtp(['', '', '', '', '', '']);
    setPendingEmail('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    }}>
      <div style={{
        width: 420,
        padding: '40px 36px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22,
          }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            AI Document Search Engine
          </h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
            AI Document Search Engine
          </p>
        </div>

        {/* ── STEP 1: Credentials ── */}
        {step === 1 && (
          <>
            {/* Toggle login / register */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 10, padding: 4, marginBottom: 24,
            }}>
              {['login', 'register'].map(m => (
                <button key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    border: 'none',
                    background: mode === m ? '#6366f1' : 'transparent',
                    color: mode === m ? '#fff' : '#64748b',
                    fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}>
                  {m === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'register' && (
                <input
                  placeholder="Full name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              )}
              <input
                placeholder="Email address"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && submitCredentials()}
                style={inputStyle}
              />
            </div>

            {mode === 'login' && (
              <p style={{ fontSize: 12, color: '#475569', marginTop: 10 }}>
                A 6-digit OTP will be sent to your Gmail after verifying credentials.
              </p>
            )}

            {error && <p style={errorStyle}>{error}</p>}

            <button
              onClick={submitCredentials}
              disabled={loading}
              style={btnStyle(loading)}>
              {loading
                ? 'Please wait...'
                : mode === 'login' ? 'Send OTP →' : 'Create Account'}
            </button>
          </>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
                Check your Gmail
              </p>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                We sent a 6-digit OTP to
              </p>
              <p style={{ fontSize: 14, color: '#a5b4fc', fontWeight: 600, marginTop: 4 }}>
                {pendingEmail}
              </p>
            </div>

            {/* 6 OTP input boxes */}
            <div style={{
              display: 'flex', gap: 10,
              justifyContent: 'center', marginBottom: 24,
            }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  maxLength={1}
                  inputMode="numeric"
                  style={{
                    width: 48, height: 58,
                    textAlign: 'center',
                    fontSize: 24, fontWeight: 700,
                    background: digit
                      ? 'rgba(99,102,241,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: digit
                      ? '2px solid #6366f1'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#e2e8f0',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

            {error && <p style={errorStyle}>{error}</p>}

            <button
              onClick={submitOtp}
              disabled={loading || otp.join('').length !== 6}
              style={btnStyle(loading || otp.join('').length !== 6)}>
              {loading ? 'Verifying...' : 'Verify OTP & Login'}
            </button>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={resendOtp}
                disabled={resendTimer > 0 || loading}
                style={{
                  background: 'none', border: 'none',
                  fontFamily: 'inherit', fontSize: 13,
                  color: resendTimer > 0 ? '#475569' : '#6366f1',
                  cursor: resendTimer > 0 ? 'default' : 'pointer',
                }}>
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : 'Resend OTP'}
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={goBack}
              style={{
                width: '100%', marginTop: 10,
                padding: '10px 0', borderRadius: 10,
                background: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748b', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              ← Back to login
            </button>
          </>
        )}

      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 10,
  width: '100%',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const errorStyle = {
  color: '#fca5a5',
  fontSize: 13,
  marginTop: 12,
  padding: '8px 12px',
  background: 'rgba(239,68,68,0.08)',
  borderRadius: 8,
  border: '1px solid rgba(239,68,68,0.2)',
};

const btnStyle = (disabled) => ({
  width: '100%',
  marginTop: 20,
  padding: '13px 0',
  borderRadius: 12,
  border: 'none',
  background: disabled ? 'rgba(99,102,241,0.3)' : '#6366f1',
  color: '#fff',
  fontWeight: 700,
  fontSize: 15,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.2s',
});