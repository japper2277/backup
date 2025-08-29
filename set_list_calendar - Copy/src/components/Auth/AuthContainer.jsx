import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { useAuth } from '../../contexts/AuthContext';

const AuthStyles = {
  Container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-main)',
    padding: '1rem'
  },
  LoadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    color: 'var(--text-primary)'
  },
  LoadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--border-color)',
    borderTop: '3px solid var(--accent-green)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  ForgotPasswordModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  ForgotPasswordContent: {
    background: 'var(--bg-surface-2)',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  },
  ForgotPasswordTitle: {
    margin: '0 0 1rem 0',
    color: 'var(--text-primary)',
    fontSize: '1.3rem',
    textAlign: 'center'
  },
  ForgotPasswordText: {
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontSize: '0.9rem'
  },
  Input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    marginBottom: '1rem'
  },
  ButtonGroup: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end'
  },
  Button: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--accent-green)',
    color: 'white',
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  SecondaryButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  Success: {
    color: 'var(--accent-green)',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '0.5rem',
    background: 'rgba(29, 185, 84, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(29, 185, 84, 0.3)',
    marginBottom: '1rem'
  },
  Error: {
    color: 'var(--accent-red)',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '0.5rem',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    marginBottom: '1rem'
  }
};

export function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  
  const { loading, resetPassword } = useAuth();

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetMessage('');
    setResetError('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }

    try {
      setResetError('');
      setResetLoading(true);
      await resetPassword(resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      setResetError(getResetErrorMessage(error.code));
    } finally {
      setResetLoading(false);
    }
  };

  const getResetErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later';
      default:
        return 'Failed to send reset email. Please try again';
    }
  };

  if (loading) {
    return (
      <div style={AuthStyles.Container}>
        <div style={AuthStyles.LoadingContainer}>
          <div style={AuthStyles.LoadingSpinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={AuthStyles.Container}>
      {/* Add CSS keyframes for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {isLogin ? (
        <LoginForm 
          onToggleForm={handleToggleForm}
          onForgotPassword={handleForgotPassword}
        />
      ) : (
        <SignupForm 
          onToggleForm={handleToggleForm}
        />
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div 
          style={AuthStyles.ForgotPasswordModal}
          onClick={() => setShowForgotPassword(false)}
        >
          <div 
            style={AuthStyles.ForgotPasswordContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={AuthStyles.ForgotPasswordTitle}>Reset Password</h3>
            <p style={AuthStyles.ForgotPasswordText}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {resetMessage && <div style={AuthStyles.Success}>{resetMessage}</div>}
            {resetError && <div style={AuthStyles.Error}>{resetError}</div>}
            
            <form onSubmit={handleResetPassword}>
              <input
                style={AuthStyles.Input}
                type="email"
                placeholder="Email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetLoading}
                required
              />
              
              <div style={AuthStyles.ButtonGroup}>
                <button
                  type="button"
                  style={AuthStyles.SecondaryButton}
                  onClick={() => setShowForgotPassword(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={AuthStyles.Button}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}