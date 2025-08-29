/**
 * Tenant Context - Multi-Tenant SaaS Architecture
 * Handles organization-level data isolation and permissions
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db as firestore } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { trackComedyEvent } from '../analytics/GoogleAnalytics';

const TenantContext = createContext();

// Subscription tiers with feature limits
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxJokes: 25,
    maxSetlists: 3,
    maxCollaborators: 1,
    maxStorageMB: 10,
    features: ['basic_setlist', 'joke_bank', 'mobile_app'],
    limits: {
      collaborators: 1,
      performances: 10,
      exports: 5,
      backups: 1
    }
  },
  PRO: {
    id: 'pro',
    name: 'Pro Comedian',
    price: 15,
    maxJokes: 500,
    maxSetlists: 50,
    maxCollaborators: 5,
    maxStorageMB: 100,
    features: ['advanced_analytics', 'performance_tracking', 'audio_notes', 'priority_support'],
    limits: {
      collaborators: 5,
      performances: 100,
      exports: 50,
      backups: 10
    }
  },
  TEAM: {
    id: 'team',
    name: 'Comedy Team',
    price: 45,
    maxJokes: -1, // Unlimited
    maxSetlists: -1, // Unlimited
    maxCollaborators: 25,
    maxStorageMB: 500,
    features: ['team_management', 'advanced_sharing', 'custom_branding', 'venue_integration', 'api_access'],
    limits: {
      collaborators: 25,
      performances: -1,
      exports: -1,
      backups: -1
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Comedy Enterprise',
    price: 99,
    maxJokes: -1,
    maxSetlists: -1,
    maxCollaborators: -1,
    maxStorageMB: -1,
    features: ['sso', 'advanced_security', 'custom_integrations', 'dedicated_support', 'white_label'],
    limits: {
      collaborators: -1,
      performances: -1,
      exports: -1,
      backups: -1
    }
  }
};

// User roles within organizations
export const USER_ROLES = {
  OWNER: {
    id: 'owner',
    name: 'Owner',
    permissions: ['*'] // All permissions
  },
  ADMIN: {
    id: 'admin', 
    name: 'Administrator',
    permissions: [
      'manage_users',
      'manage_billing',
      'manage_settings',
      'view_analytics',
      'create_setlists',
      'edit_setlists',
      'delete_setlists',
      'manage_jokes',
      'export_data'
    ]
  },
  MEMBER: {
    id: 'member',
    name: 'Team Member',
    permissions: [
      'view_setlists',
      'create_setlists',
      'edit_own_setlists',
      'manage_own_jokes',
      'comment_setlists',
      'export_own_data'
    ]
  },
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    permissions: [
      'view_setlists',
      'comment_setlists'
    ]
  }
};

export const TenantProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState(SUBSCRIPTION_TIERS.FREE);
  const [usage, setUsage] = useState({
    jokes: 0,
    setlists: 0,
    collaborators: 0,
    storageMB: 0,
    performances: 0
  });
  const [loading, setLoading] = useState(true);

  // Initialize tenant data when user changes
  useEffect(() => {
    if (user) {
      initializeTenant();
    } else {
      setCurrentTenant(null);
      setUserRole(null);
      setSubscriptionTier(SUBSCRIPTION_TIERS.FREE);
      setLoading(false);
    }
  }, [user]);

  const initializeTenant = async () => {
    try {
      setLoading(true);
      
      // Check if user has existing tenant association
      const userTenantQuery = query(
        collection(firestore, 'user_tenants'),
        where('userId', '==', user.uid)
      );
      
      const userTenantSnapshot = await getDocs(userTenantQuery);
      
      if (userTenantSnapshot.empty) {
        // Create personal tenant for new user
        await createPersonalTenant();
      } else {
        // Load existing tenant
        const tenantData = userTenantSnapshot.docs[0].data();
        await loadTenant(tenantData.tenantId);
      }
      
    } catch (error) {
      console.error('Failed to initialize tenant:', error);
      trackComedyEvent('tenant_initialization_failed', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createPersonalTenant = async () => {
    const tenantId = `personal_${user.uid}`;
    
    const tenant = {
      id: tenantId,
      name: `${user.displayName || user.email}'s Comedy Workspace`,
      type: 'personal',
      ownerId: user.uid,
      subscriptionTier: 'free',
      createdAt: new Date(),
      settings: {
        allowPublicSetlists: false,
        requireApprovalForJoining: true,
        defaultJokeVisibility: 'private',
        customBranding: null
      },
      billing: {
        customerId: null,
        subscriptionId: null,
        currentPeriodEnd: null,
        status: 'active'
      }
    };

    // Create tenant document
    await setDoc(doc(firestore, 'tenants', tenantId), tenant);
    
    // Create user-tenant association
    await setDoc(doc(firestore, 'user_tenants', user.uid), {
      userId: user.uid,
      tenantId: tenantId,
      role: 'owner',
      joinedAt: new Date()
    });

    setCurrentTenant(tenant);
    setUserRole(USER_ROLES.OWNER);
    setSubscriptionTier(SUBSCRIPTION_TIERS.FREE);

    trackComedyEvent('tenant_created', { 
      tenantType: 'personal',
      subscriptionTier: 'free' 
    });
  };

  const loadTenant = async (tenantId) => {
    // Load tenant data
    const tenantDoc = await getDoc(doc(firestore, 'tenants', tenantId));
    const tenantData = tenantDoc.data();
    
    // Load user role in this tenant
    const userTenantDoc = await getDoc(doc(firestore, 'user_tenants', user.uid));
    const userTenantData = userTenantDoc.data();
    
    // Load subscription tier
    const tier = SUBSCRIPTION_TIERS[tenantData.subscriptionTier.toUpperCase()] || SUBSCRIPTION_TIERS.FREE;
    
    // Load usage statistics
    const currentUsage = await loadUsageStats(tenantId);
    
    setCurrentTenant(tenantData);
    setUserRole(USER_ROLES[userTenantData.role.toUpperCase()]);
    setSubscriptionTier(tier);
    setUsage(currentUsage);

    trackComedyEvent('tenant_loaded', {
      tenantType: tenantData.type,
      subscriptionTier: tenantData.subscriptionTier,
      userRole: userTenantData.role
    });
  };

  const loadUsageStats = async (tenantId) => {
    try {
      // This would typically be cached or pre-computed
      const [jokesSnapshot, setlistsSnapshot] = await Promise.all([
        getDocs(query(collection(firestore, 'jokes'), where('tenantId', '==', tenantId))),
        getDocs(query(collection(firestore, 'setlists'), where('tenantId', '==', tenantId)))
      ]);

      return {
        jokes: jokesSnapshot.size,
        setlists: setlistsSnapshot.size,
        collaborators: 1, // This would be calculated from user_tenants
        storageMB: 5, // This would be calculated from file sizes
        performances: 0 // This would be from performance tracking
      };
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      return { jokes: 0, setlists: 0, collaborators: 0, storageMB: 0, performances: 0 };
    }
  };

  // Permission checking
  const hasPermission = (permission) => {
    if (!userRole) return false;
    
    // Owner has all permissions
    if (userRole.id === 'owner') return true;
    
    // Check specific permissions
    return userRole.permissions.includes(permission) || userRole.permissions.includes('*');
  };

  // Feature checking based on subscription
  const hasFeature = (featureId) => {
    return subscriptionTier.features.includes(featureId);
  };

  // Usage limit checking
  const checkUsageLimit = (type) => {
    const limit = subscriptionTier.limits[type];
    const current = usage[type];
    
    if (limit === -1) return { allowed: true, remaining: -1 }; // Unlimited
    
    return {
      allowed: current < limit,
      remaining: Math.max(0, limit - current),
      percentage: limit > 0 ? (current / limit) * 100 : 0
    };
  };

  // Upgrade subscription
  const upgradeSubscription = async (newTier) => {
    try {
      // This would integrate with Stripe
      console.log(`Upgrading to ${newTier}`);
      
      trackComedyEvent('subscription_upgrade_initiated', {
        fromTier: subscriptionTier.id,
        toTier: newTier,
        tenantId: currentTenant.id
      });
      
      // Redirect to billing or handle upgrade flow
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
    }
  };

  const contextValue = {
    // Tenant info
    currentTenant,
    loading,
    
    // User permissions
    userRole,
    hasPermission,
    
    // Subscription
    subscriptionTier,
    hasFeature,
    upgradeSubscription,
    
    // Usage tracking
    usage,
    checkUsageLimit,
    
    // Actions
    loadTenant,
    
    // Constants
    SUBSCRIPTION_TIERS,
    USER_ROLES
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};

// HOC for permission-based rendering
export const withPermission = (Component, requiredPermission) => {
  return React.forwardRef((props, ref) => {
    const { hasPermission } = useTenant();
    
    if (!hasPermission(requiredPermission)) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h3>Access Restricted</h3>
          <p>You don't have permission to access this feature.</p>
          <p>Contact your workspace administrator for access.</p>
        </div>
      );
    }
    
    return <Component {...props} ref={ref} />;
  });
};

// Hook for usage-based restrictions
export const useUsageGate = (usageType, showUpgradePrompt = true) => {
  const { checkUsageLimit, subscriptionTier, upgradeSubscription } = useTenant();
  
  const usageCheck = checkUsageLimit(usageType);
  
  const requestUpgrade = () => {
    if (showUpgradePrompt && !usageCheck.allowed) {
      const nextTier = getRecommendedUpgrade(subscriptionTier.id);
      if (confirm(`You've reached your ${usageType} limit. Upgrade to ${nextTier.name} for more?`)) {
        upgradeSubscription(nextTier.id);
      }
    }
  };
  
  return {
    ...usageCheck,
    requestUpgrade,
    isAtLimit: !usageCheck.allowed,
    warningThreshold: usageCheck.percentage > 80
  };
};

// Helper function for upgrade recommendations
const getRecommendedUpgrade = (currentTier) => {
  const upgradePath = {
    'free': SUBSCRIPTION_TIERS.PRO,
    'pro': SUBSCRIPTION_TIERS.TEAM,
    'team': SUBSCRIPTION_TIERS.ENTERPRISE
  };
  
  return upgradePath[currentTier] || SUBSCRIPTION_TIERS.PRO;
};