import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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

export function LoginForm({ onToggleForm, onForgotPassword }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signin, signInWithGoogle } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signin(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed';
      default:
        return 'Failed to sign in. Please try again';
    }
  };

  return (
    <div style={AuthStyles.Container}>
      <h2 style={AuthStyles.Title}>Welcome Back</h2>
      
      {error && <div style={AuthStyles.Error}>{error}</div>}
      
      <form style={AuthStyles.Form} onSubmit={handleSubmit}>
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
          placeholder="Password"
          value={formData.password}
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
          {loading ? 'Signing In...' : 'Sign In'}
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

      <div style={AuthStyles.Link} onClick={onForgotPassword}>
        Forgot your password?
      </div>

      <div style={AuthStyles.Link} onClick={onToggleForm}>
        Don't have an account? Sign up
      </div>
    </div>
  );
}