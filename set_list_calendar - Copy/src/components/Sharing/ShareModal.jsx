import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const ShareStyles = {
  Container: {
    maxWidth: '500px',
    width: '90%'
  },
  Header: {
    margin: '0 0 1.5rem 0',
    color: 'var(--text-primary)',
    fontSize: '1.3rem',
    textAlign: 'center'
  },
  Section: {
    marginBottom: '1.5rem'
  },
  SectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem'
  },
  SearchInput: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    marginBottom: '0.5rem'
  },
  UserList: {
    maxHeight: '150px',
    overflowY: 'auto',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    background: 'var(--bg-surface)'
  },
  UserItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  UserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  UserAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--accent-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 600
  },
  UserDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  UserName: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontWeight: 500
  },
  UserEmail: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  PermissionSelect: {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    padding: '0.25rem'
  },
  SharedUsersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  SharedUser: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem',
    background: 'var(--bg-surface)',
    borderRadius: '6px',
    border: '1px solid var(--border-color)'
  },
  LinkContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  LinkInput: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    fontFamily: 'monospace'
  },
  Button: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    background: 'var(--accent-green)',
    color: 'white',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: 500
  },
  SecondaryButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  RemoveButton: {
    background: 'var(--accent-red)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    cursor: 'pointer'
  },
  Actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-color)'
  },
  EmptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem'
  },
  Loading: {
    textAlign: 'center',
    padding: '1rem',
    color: 'var(--text-secondary)'
  },
  Error: {
    color: 'var(--accent-red)',
    fontSize: '0.8rem',
    marginTop: '0.5rem'
  }
};

export function ShareModal({ setlist, onClose, onShare, onUnshare }) {
  const { currentUser } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Early return for demo mode - show demo message
  if (isDemoMode) {
    return (
      <div style={ShareStyles.Container}>
        <h3 style={ShareStyles.Header}>
          <i className="fas fa-share" style={{marginRight: '0.5rem'}}></i>
          Share Setlist - Demo Mode
        </h3>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <i className="fas fa-rocket" style={{fontSize: '2rem', color: 'var(--accent-orange)', marginBottom: '1rem', display: 'block'}}></i>
          <h4 style={{color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Demo Mode Active</h4>
          <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>
            Sharing features require Firebase authentication. In production, users can collaborate in real-time on setlists.
          </p>
          <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>
            <strong>Production Features:</strong><br/>
            • Real-time collaborative editing<br/>
            • User search and permissions<br/>
            • Shareable links with access control<br/>
            • Live presence indicators
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '1.5rem'}}>
          <button 
            style={{
              background: 'var(--accent-blue)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            <i className="fas fa-check" style={{marginRight: '0.5rem'}}></i>
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Generate share link
  useEffect(() => {
    if (setlist) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/setlist/${setlist.id}?token=${generateShareToken()}`;
      setShareLink(link);
    }
  }, [setlist]);

  const generateShareToken = () => {
    return Math.random().toString(36).substr(2, 16);
  };

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || searchTerm.length < 3) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      setError('');

      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('email', '>=', searchTerm.toLowerCase()),
          where('email', '<=', searchTerm.toLowerCase() + '\uf8ff'),
          limit(5)
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== currentUser?.uid); // Exclude current user

        setSearchResults(users);
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to search users');
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, currentUser?.uid]);

  const handleShareWithUser = async (user, permission = 'read') => {
    try {
      await onShare(user.id, permission);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      setError('Failed to share setlist');
    }
  };

  const handleUnshare = async (userId) => {
    try {
      await onUnshare(userId);
    } catch (err) {
      setError('Failed to remove user');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getSharedUsers = () => {
    if (!setlist?.sharedWith) return [];
    return setlist.sharedWith;
  };

  const getUserInitials = (user) => {
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  return (
    <div style={ShareStyles.Container}>
      <h3 style={ShareStyles.Header}>Share "{setlist?.title}"</h3>

      {/* Search and Add Users */}
      <div style={ShareStyles.Section}>
        <div style={ShareStyles.SectionTitle}>Add Collaborators</div>
        <input
          style={ShareStyles.SearchInput}
          type="email"
          placeholder="Search by email address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {error && <div style={ShareStyles.Error}>{error}</div>}
        
        {searchLoading && <div style={ShareStyles.Loading}>Searching...</div>}
        
        {searchResults.length > 0 && (
          <div style={ShareStyles.UserList}>
            {searchResults.map(user => (
              <div 
                key={user.id} 
                style={ShareStyles.UserItem}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-surface-2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={ShareStyles.UserInfo}>
                  <div style={ShareStyles.UserAvatar}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" style={{width: '100%', height: '100%', borderRadius: '50%'}} />
                    ) : (
                      getUserInitials(user)
                    )}
                  </div>
                  <div style={ShareStyles.UserDetails}>
                    <div style={ShareStyles.UserName}>{user.displayName || 'User'}</div>
                    <div style={ShareStyles.UserEmail}>{user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    style={ShareStyles.PermissionSelect}
                    defaultValue="read"
                    onChange={(e) => handleShareWithUser(user, e.target.value)}
                  >
                    <option value="read">View Only</option>
                    <option value="comment">Can Comment</option>
                    <option value="edit">Can Edit</option>
                  </select>
                  <button 
                    style={ShareStyles.Button}
                    onClick={() => handleShareWithUser(user, 'read')}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Collaborators */}
      <div style={ShareStyles.Section}>
        <div style={ShareStyles.SectionTitle}>Current Collaborators</div>
        {getSharedUsers().length > 0 ? (
          <div style={ShareStyles.SharedUsersList}>
            {getSharedUsers().map(share => (
              <div key={share.userId} style={ShareStyles.SharedUser}>
                <div style={ShareStyles.UserInfo}>
                  <div style={ShareStyles.UserAvatar}>U</div>
                  <div style={ShareStyles.UserDetails}>
                    <div style={ShareStyles.UserName}>User</div>
                    <div style={ShareStyles.UserEmail}>{share.permission}</div>
                  </div>
                </div>
                <button 
                  style={ShareStyles.RemoveButton}
                  onClick={() => handleUnshare(share.userId)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={ShareStyles.EmptyState}>
            No collaborators yet. Search for users above to add them.
          </div>
        )}
      </div>

      {/* Share Link */}
      <div style={ShareStyles.Section}>
        <div style={ShareStyles.SectionTitle}>Share Link</div>
        <div style={ShareStyles.LinkContainer}>
          <input
            style={ShareStyles.LinkInput}
            type="text"
            value={shareLink}
            readOnly
          />
          <button 
            style={ShareStyles.Button}
            onClick={handleCopyLink}
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Anyone with this link can view the setlist
        </div>
      </div>

      {/* Actions */}
      <div style={ShareStyles.Actions}>
        <button style={ShareStyles.SecondaryButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}