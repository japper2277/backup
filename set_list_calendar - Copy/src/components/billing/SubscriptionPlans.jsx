/**
 * Subscription Plans Component - SaaS Billing Interface
 * Beautiful, conversion-optimized pricing component
 */

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useTenant } from '../../contexts/TenantContext';
import { useBilling, SUBSCRIPTION_PLANS } from '../../services/BillingService';
import { trackComedyEvent } from '../../analytics/GoogleAnalytics';

const PlansContainer = styled.div`
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
    color: #b3b3b3;
    max-width: 600px;
    margin: 0 auto;
  }
`;

const BillingToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  
  span {
    color: #ffffff;
    font-weight: 500;
  }
  
  .toggle {
    position: relative;
    width: 60px;
    height: 30px;
    background: #3e3e3e;
    border-radius: 15px;
    cursor: pointer;
    transition: background 0.3s;
    
    &.active {
      background: #1DB954;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
    }
    
    &.active::after {
      transform: translateX(30px);
    }
  }
  
  .savings {
    background: linear-gradient(45deg, #1DB954, #45a3ff);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
  }
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const PlanCard = styled.div`
  background: ${props => props.popular ? 'linear-gradient(135deg, #1DB954 0%, #45a3ff 100%)' : '#2a2a2a'};
  border-radius: 16px;
  padding: ${props => props.popular ? '3px' : '2rem'};
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  
  ${props => props.popular && `
    &::before {
      content: 'Most Popular';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #1DB954, #45a3ff);
      color: white;
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 1;
    }
  `}
`;

const PlanContent = styled.div`
  background: #2a2a2a;
  border-radius: 13px;
  padding: 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PlanHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }
  
  .price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
    
    .currency {
      font-size: 1.2rem;
      color: #1DB954;
      font-weight: 600;
    }
    
    .amount {
      font-size: 3rem;
      font-weight: 800;
      color: #1DB954;
    }
    
    .period {
      font-size: 1rem;
      color: #b3b3b3;
    }
  }
  
  .savings {
    color: #1DB954;
    font-size: 0.9rem;
    font-weight: 600;
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
  flex: 1;
  
  li {
    padding: 0.75rem 0;
    color: #e0e0e0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.95rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    &:last-child {
      border-bottom: none;
    }
    
    &::before {
      content: '✓';
      color: #1DB954;
      font-weight: bold;
      font-size: 1.2rem;
    }
    
    &.unavailable {
      color: #666;
      text-decoration: line-through;
      
      &::before {
        content: '✗';
        color: #666;
      }
    }
  }
`;

const PlanButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  
  ${props => {
    if (props.current) {
      return `
        background: #3e3e3e;
        color: #b3b3b3;
        cursor: not-allowed;
      `;
    } else if (props.primary) {
      return `
        background: linear-gradient(45deg, #1DB954, #45a3ff);
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(29, 185, 84, 0.3);
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `;
    } else {
      return `
        background: transparent;
        color: #1DB954;
        border: 2px solid #1DB954;
        
        &:hover {
          background: #1DB954;
          color: white;
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `;
    }
  }}
`;

const UsageIndicator = styled.div`
  background: #1a1a1a;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #333;
  
  h4 {
    color: #ffffff;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
`;

const UsageBar = styled.div`
  margin-bottom: 1rem;
  
  .usage-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    
    span {
      color: #b3b3b3;
      font-size: 0.9rem;
    }
  }
  
  .usage-bar {
    width: 100%;
    height: 8px;
    background: #3e3e3e;
    border-radius: 4px;
    overflow: hidden;
    
    .usage-fill {
      height: 100%;
      background: ${props => props.warning ? 
        'linear-gradient(45deg, #ff6b35, #f7931e)' : 
        'linear-gradient(45deg, #1DB954, #45a3ff)'
      };
      transition: width 0.3s;
    }
  }
`;

export const SubscriptionPlans = ({ showUsage = true, onPlanSelect }) => {
  const { currentTenant, subscriptionTier, usage } = useTenant();
  const { subscribe } = useBilling();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlanSelect = async (planId) => {
    if (!currentTenant) return;
    
    setLoading(true);
    
    try {
      trackComedyEvent('subscription_plan_selected', {
        planId,
        currentTier: subscriptionTier.id,
        tenantId: currentTenant.id,
        billingInterval: isYearly ? 'yearly' : 'monthly'
      });
      
      if (onPlanSelect) {
        await onPlanSelect(planId);
      } else {
        await subscribe(planId, currentTenant.id, currentTenant.ownerId);
      }
    } catch (error) {
      console.error('Failed to select plan:', error);
      alert('Failed to start subscription process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateYearlyPrice = (monthlyPrice) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount
  };

  const getUsagePercentage = (type) => {
    const current = usage[type] || 0;
    const limit = subscriptionTier.limits?.[type] || 0;
    
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <PlansContainer>
      <Header>
        <h1>Choose Your Comedy Plan</h1>
        <p>
          Unlock your comedic potential with tools designed by comedians, for comedians. 
          Start free and upgrade as you grow your career.
        </p>
      </Header>

      <BillingToggle>
        <span>Monthly</span>
        <div 
          className={`toggle ${isYearly ? 'active' : ''}`}
          onClick={() => setIsYearly(!isYearly)}
        />
        <span>Yearly</span>
        {isYearly && <div className="savings">Save 20%</div>}
      </BillingToggle>

      {showUsage && subscriptionTier && (
        <UsageIndicator>
          <h4>Your Current Usage</h4>
          
          <UsageBar warning={getUsagePercentage('jokes') > 80}>
            <div className="usage-header">
              <span>Jokes</span>
              <span>
                {usage.jokes || 0}
                {subscriptionTier.limits?.jokes !== -1 && ` / ${subscriptionTier.limits?.jokes || 0}`}
              </span>
            </div>
            <div className="usage-bar">
              <div 
                className="usage-fill" 
                style={{ width: `${getUsagePercentage('jokes')}%` }}
              />
            </div>
          </UsageBar>

          <UsageBar warning={getUsagePercentage('setlists') > 80}>
            <div className="usage-header">
              <span>Setlists</span>
              <span>
                {usage.setlists || 0}
                {subscriptionTier.limits?.setlists !== -1 && ` / ${subscriptionTier.limits?.setlists || 0}`}
              </span>
            </div>
            <div className="usage-bar">
              <div 
                className="usage-fill" 
                style={{ width: `${getUsagePercentage('setlists')}%` }}
              />
            </div>
          </UsageBar>
        </UsageIndicator>
      )}

      <PlansGrid>
        {Object.values(SUBSCRIPTION_PLANS).map(plan => {
          const isCurrentPlan = subscriptionTier.id === plan.id;
          const displayPrice = isYearly && plan.price > 0 ? 
            calculateYearlyPrice(plan.price) : plan.price;
          const monthlyPrice = isYearly ? Math.round(displayPrice / 12) : displayPrice;

          return (
            <PlanCard key={plan.id} popular={plan.popular}>
              <PlanContent>
                <PlanHeader>
                  <h3>{plan.name}</h3>
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">
                      {isYearly && plan.price > 0 ? monthlyPrice : displayPrice}
                    </span>
                    {plan.price > 0 && (
                      <span className="period">
                        /{isYearly ? 'mo' : 'month'}
                      </span>
                    )}
                  </div>
                  {isYearly && plan.price > 0 && (
                    <div className="savings">
                      Billed ${displayPrice} yearly
                    </div>
                  )}
                </PlanHeader>

                <FeaturesList>
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </FeaturesList>

                <PlanButton
                  current={isCurrentPlan}
                  primary={plan.popular || plan.id === 'pro'}
                  disabled={loading}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {isCurrentPlan ? 'Current Plan' : 
                   plan.price === 0 ? 'Get Started Free' : 
                   `Upgrade to ${plan.name}`}
                </PlanButton>
              </PlanContent>
            </PlanCard>
          );
        })}
      </PlansGrid>
    </PlansContainer>
  );
};

export default SubscriptionPlans;