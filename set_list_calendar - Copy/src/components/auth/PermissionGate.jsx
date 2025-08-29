/**
 * Permission Gate Component - Role-Based Access Control
 * Controls feature access based on user permissions and subscription tiers
 */

import React from 'react';
import styled from '@emotion/styled';
import { useTenant } from '../../contexts/TenantContext';
import { trackComedyEvent } from '../../analytics/GoogleAnalytics';

const AccessDeniedContainer = styled.div`
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border: 2px dashed #444;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin: 1rem;
  color: #e0e0e0;

  .lock-icon {
    font-size: 3rem;
    color: #666;
    margin-bottom: 1rem;
  }

  h3 {
    color: #ffffff;
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  p {
    color: #b3b3b3;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .upgrade-button {
    background: linear-gradient(45deg, #1DB954, #45a3ff);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
    margin-right: 1rem;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .contact-button {
    background: transparent;
    color: #1DB954;
    border: 2px solid #1DB954;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #1DB954;
      color: white;
    }
  }
`;

const FeatureUpgradePrompt = styled.div`
  background: linear-gradient(45deg, rgba(29, 185, 84, 0.1), rgba(69, 163, 255, 0.1));
  border: 1px solid rgba(29, 185, 84, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;

  .feature-icon {
    background: linear-gradient(45deg, #1DB954, #45a3ff);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
  }

  .feature-info {
    flex: 1;
    
    h4 {
      color: #ffffff;
      margin-bottom: 0.25rem;
      font-size: 1rem;
    }
    
    p {
      color: #b3b3b3;
      font-size: 0.9rem;
      margin: 0;
    }
  }

  .upgrade-mini {
    background: linear-gradient(45deg, #1DB954, #45a3ff);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
`;

const UsageLimitWarning = styled.div`
  background: linear-gradient(45deg, rgba(255, 107, 53, 0.1), rgba(247, 147, 30, 0.1));
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;

  .warning-icon {
    background: linear-gradient(45deg, #ff6b35, #f7931e);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
  }

  .warning-info {
    flex: 1;
    
    h4 {
      color: #ffffff;
      margin-bottom: 0.25rem;
      font-size: 1rem;
    }
    
    p {
      color: #b3b3b3;
      font-size: 0.9rem;
      margin: 0;
    }
  }

  .upgrade-mini {
    background: linear-gradient(45deg, #ff6b35, #f7931e);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
`;

// Permission Gate Component
export const PermissionGate = ({ 
  children, 
  permission, 
  fallback, 
  showUpgrade = true,
  feature = null 
}) => {
  const { hasPermission, hasFeature, subscriptionTier, upgradeSubscription, currentTenant } = useTenant();

  // Check permissions first
  const hasRequiredPermission = permission ? hasPermission(permission) : true;
  
  // Check feature availability
  const hasRequiredFeature = feature ? hasFeature(feature) : true;

  // If user has both permission and feature access, render children
  if (hasRequiredPermission && hasRequiredFeature) {
    return children;
  }

  // Track access denial for analytics
  React.useEffect(() => {
    if (!hasRequiredPermission || !hasRequiredFeature) {
      trackComedyEvent('access_denied', {
        permission,
        feature,
        currentTier: subscriptionTier.id,
        tenantId: currentTenant?.id
      });
    }
  }, [permission, feature, hasRequiredPermission, hasRequiredFeature]);

  // Custom fallback component
  if (fallback) {
    return fallback;
  }

  // Default access denied UI
  const handleUpgrade = () => {
    trackComedyEvent('upgrade_from_permission_gate', {
      permission,
      feature,
      currentTier: subscriptionTier.id
    });
    
    upgradeSubscription(getRecommendedTier(feature, permission));
  };

  const handleContact = () => {
    trackComedyEvent('contact_from_permission_gate', {
      permission,
      feature,
      currentTier: subscriptionTier.id
    });
    
    window.open('mailto:support@setlistbuilder.com?subject=Feature Access Request', '_blank');
  };

  return (
    <AccessDeniedContainer>
      <div className="lock-icon">🔒</div>
      <h3>
        {!hasRequiredFeature ? 'Premium Feature' : 'Access Restricted'}
      </h3>
      <p>
        {!hasRequiredFeature 
          ? `This feature requires a ${getRequiredTier(feature)} subscription or higher.`
          : 'You don\'t have permission to access this feature. Contact your workspace administrator for access.'
        }
      </p>
      
      {showUpgrade && !hasRequiredFeature && (
        <div>
          <button className="upgrade-button" onClick={handleUpgrade}>
            Upgrade Now
          </button>
          <button className="contact-button" onClick={handleContact}>
            Contact Support
          </button>
        </div>
      )}
      
      {!hasRequiredPermission && hasRequiredFeature && (
        <button className="contact-button" onClick={handleContact}>
          Request Access
        </button>
      )}
    </AccessDeniedContainer>
  );
};

// Usage Limit Gate Component
export const UsageGate = ({ 
  children, 
  usageType, 
  showWarning = true, 
  warningThreshold = 80 
}) => {
  const { checkUsageLimit, subscriptionTier, upgradeSubscription } = useTenant();
  
  const usageCheck = checkUsageLimit(usageType);
  const showUpgradeWarning = usageCheck.percentage > warningThreshold;
  
  const handleUpgrade = () => {
    trackComedyEvent('upgrade_from_usage_gate', {
      usageType,
      currentUsage: usageCheck.percentage,
      currentTier: subscriptionTier.id
    });
    
    upgradeSubscription(getRecommendedTierForUsage(usageType));
  };

  // If at usage limit, block access
  if (!usageCheck.allowed) {
    return (
      <AccessDeniedContainer>
        <div className="lock-icon">📊</div>
        <h3>Usage Limit Reached</h3>
        <p>
          You've reached your {usageType} limit for the {subscriptionTier.name} plan. 
          Upgrade to continue adding more content.
        </p>
        <button className="upgrade-button" onClick={handleUpgrade}>
          Upgrade Plan
        </button>
      </AccessDeniedContainer>
    );
  }

  // Show warning if approaching limit
  const content = (
    <>
      {showWarning && showUpgradeWarning && (
        <UsageLimitWarning>
          <div className="warning-icon">⚠️</div>
          <div className="warning-info">
            <h4>Approaching Limit</h4>
            <p>
              You've used {Math.round(usageCheck.percentage)}% of your {usageType} limit. 
              {usageCheck.remaining > 0 && ` ${usageCheck.remaining} remaining.`}
            </p>
          </div>
          <button className="upgrade-mini" onClick={handleUpgrade}>
            Upgrade
          </button>
        </UsageLimitWarning>
      )}
      {children}
    </>
  );

  return content;
};

// Feature Promotion Component
export const FeaturePromotion = ({ 
  featureId, 
  title, 
  description, 
  icon = '✨' 
}) => {
  const { hasFeature, subscriptionTier, upgradeSubscription } = useTenant();
  
  if (hasFeature(featureId)) {
    return null; // Don't show if user already has the feature
  }

  const handleUpgrade = () => {
    trackComedyEvent('upgrade_from_feature_promotion', {
      featureId,
      currentTier: subscriptionTier.id
    });
    
    upgradeSubscription(getRequiredTier(featureId));
  };

  return (
    <FeatureUpgradePrompt>
      <div className="feature-icon">{icon}</div>
      <div className="feature-info">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <button className="upgrade-mini" onClick={handleUpgrade}>
        Upgrade
      </button>
    </FeatureUpgradePrompt>
  );
};

// Helper functions
const getRequiredTier = (featureId) => {
  const featureTiers = {
    'advanced_analytics': 'Pro',
    'performance_tracking': 'Pro', 
    'audio_notes': 'Pro',
    'team_management': 'Team',
    'custom_branding': 'Team',
    'venue_integration': 'Team',
    'api_access': 'Team',
    'sso': 'Enterprise',
    'white_label': 'Enterprise'
  };
  
  return featureTiers[featureId] || 'Pro';
};

const getRecommendedTier = (featureId, permission) => {
  if (featureId) {
    const tierName = getRequiredTier(featureId);
    return tierName.toLowerCase();
  }
  
  // Default recommendation based on permission
  const permissionTiers = {
    'manage_users': 'team',
    'manage_billing': 'team',
    'view_analytics': 'pro',
    'advanced_sharing': 'team'
  };
  
  return permissionTiers[permission] || 'pro';
};

const getRecommendedTierForUsage = (usageType) => {
  const usageRecommendations = {
    'jokes': 'pro',
    'setlists': 'pro', 
    'collaborators': 'team',
    'storage': 'team'
  };
  
  return usageRecommendations[usageType] || 'pro';
};