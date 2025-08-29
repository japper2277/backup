import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackSignup } from '../../services/analytics';

const AuthStyles = {
  Container: { 
    maxWidth: '400px', 
    margin: '2rem auto', 
    padding: '2rem', 
    background: 'var(--bg-surface-2)', 
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  },
  Title: { 
    textAlign: 'center', 
    marginBottom: '2rem', 
    color: 'var(--text-primary)',
    fontSize: '1.5rem',
    fontWeight: 600
  },
  Form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  Input: { 
    padding: '0.75rem', 
    borderRadius: '6px', 
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '1rem'
  },
  Button: { 
    padding: '0.75rem', 
    borderRadius: '6px', 
    border: 'none',
    background: 'var(--accent-green)',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  SecondaryButton: {
    padding: '0.75rem', 
    borderRadius: '6px', 
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  Divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '1rem 0',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)'
  },
  DividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
    margin: '0 1rem'
  },
  Error: { 
    color: 'var(--accent-red)', 
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '0.5rem',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  Link: {
    color: 'var(--accent-blue)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginTop: '1rem',
    cursor: 'pointer'
  },
  Loading: {
    opacity: 0.6,
    pointerEvents: 'none'
  }
};

export function SignupForm({ onToggleForm }) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup, signInWithGoogle } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.displayName || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await signup(formData.email, formData.password, formData.displayName);
      
      // Track successful signup
      if (result?.user?.uid) {
        trackSignup('email', result.user.uid);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await signInWithGoogle();
      
      // Track successful Google signup
      if (result?.user?.uid) {
        trackSignup('google', result.user.uid);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed';
      default:
        return 'Failed to create account. Please try again';
    }
  };

  return (
    <div style={AuthStyles.Container}>
      <h2 style={AuthStyles.Title}>Create Account</h2>
      
      {error && <div style={AuthStyles.Error}>{error}</div>}
      
      <form style={AuthStyles.Form} onSubmit={handleSubmit}>
        <input
          style={AuthStyles.Input}
          type="text"
          name="displayName"
          placeholder="Full name"
          value={formData.displayName}
          onChange={handleChange}
          disabled={loading}
          required
        />
        
        <input
          style={AuthStyles.Input}
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
        
        <input
          style={AuthStyles.Input}
          type="password"
          name="password"
          placeholder="Password (min. 6 characters)"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
        />
        
        <input
          style={AuthStyles.Input}
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          required
        />
        
        <button 
          style={{
            ...AuthStyles.Button,
            ...(loading ? AuthStyles.Loading : {})
          }}
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div style={AuthStyles.Divider}>
        <div style={AuthStyles.DividerLine}></div>
        <span>or</span>
        <div style={AuthStyles.DividerLine}></div>
      </div>

      <button
        style={{
          ...AuthStyles.SecondaryButton,
          ...(loading ? AuthStyles.Loading : {})
        }}
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <i className="fab fa-google" style={{ marginRight: '0.5rem' }}></i>
        Continue with Google
      </button>

      <div style={AuthStyles.Link} onClick={onToggleForm}>
        Already have an account? Sign in
      </div>
    </div>
  );
}