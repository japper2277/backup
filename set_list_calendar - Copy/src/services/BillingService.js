/**
 * Billing Service - Stripe Integration for SaaS Subscriptions
 * Handles subscription management, billing, and usage tracking
 */

import { loadStripe } from '@stripe/stripe-js';
import { trackComedyEvent } from '../analytics/GoogleAnalytics';
import { reportError } from '../config/sentry';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.setlistbuilder.com';

// Initialize Stripe
let stripePromise;
if (STRIPE_PUBLIC_KEY) {
  stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
}

// Subscription plans with Stripe price IDs
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    interval: 'month',
    features: [
      '25 jokes',
      '3 setlists', 
      '1 collaborator',
      'Basic analytics',
      'Mobile app'
    ],
    limits: {
      jokes: 25,
      setlists: 3,
      collaborators: 1,
      storage: 10, // MB
      exports: 5
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro Comedian',
    price: 15,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,
    interval: 'month',
    popular: true,
    features: [
      '500 jokes',
      '50 setlists',
      '5 collaborators',
      'Advanced analytics',
      'Performance tracking',
      'Audio notes',
      'Priority support'
    ],
    limits: {
      jokes: 500,
      setlists: 50,
      collaborators: 5,
      storage: 100,
      exports: 50
    }
  },
  team: {
    id: 'team',
    name: 'Comedy Team',
    price: 45,
    priceId: import.meta.env.VITE_STRIPE_PRICE_TEAM,
    interval: 'month',
    features: [
      'Unlimited jokes & setlists',
      '25 team members',
      'Team management',
      'Custom branding',
      'Venue integration',
      'API access',
      'Advanced sharing'
    ],
    limits: {
      jokes: -1,
      setlists: -1,
      collaborators: 25,
      storage: 500,
      exports: -1
    }
  },
  enterprise: {
    id: 'enterprise', 
    name: 'Enterprise',
    price: 99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE,
    interval: 'month',
    features: [
      'Everything in Team',
      'Unlimited team members',
      'Single Sign-On (SSO)',
      'Advanced security',
      'Custom integrations',
      'White-label options',
      'Dedicated support'
    ],
    limits: {
      jokes: -1,
      setlists: -1,
      collaborators: -1,
      storage: -1,
      exports: -1
    }
  }
};

class BillingService {
  constructor() {
    this.stripe = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      if (stripePromise) {
        this.stripe = await stripePromise;
        this.initialized = true;
        console.log('💳 Billing service initialized');
      } else {
        console.warn('⚠️ Stripe not configured - billing features disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize billing service:', error);
      reportError(error, { context: 'billing_initialization' });
    }
  }

  // Create checkout session for subscription
  async createCheckoutSession(priceId, tenantId, userId, successUrl, cancelUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          priceId,
          tenantId,
          userId,
          successUrl: successUrl || `${window.location.origin}/billing/success`,
          cancelUrl: cancelUrl || `${window.location.origin}/billing/cancel`
        })
      });

      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.error || 'Failed to create checkout session');
      }

      trackComedyEvent('checkout_session_created', {
        priceId,
        tenantId,
        planName: this.getPlanByPriceId(priceId)?.name
      });

      return session;
    } catch (error) {
      console.error('❌ Failed to create checkout session:', error);
      reportError(error, { context: 'checkout_session_creation' });
      throw error;
    }
  }

  // Redirect to Stripe Checkout
  async redirectToCheckout(priceId, tenantId, userId) {
    try {
      await this.initialize();
      
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const session = await this.createCheckoutSession(priceId, tenantId, userId);
      
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

    } catch (error) {
      console.error('❌ Checkout redirect failed:', error);
      reportError(error, { context: 'checkout_redirect' });
      throw error;
    }
  }

  // Create customer portal session
  async createCustomerPortalSession(customerId, returnUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          customerId,
          returnUrl: returnUrl || window.location.origin
        })
      });

      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.error || 'Failed to create portal session');
      }

      return session;
    } catch (error) {
      console.error('❌ Failed to create portal session:', error);
      reportError(error, { context: 'portal_session_creation' });
      throw error;
    }
  }

  // Get subscription status
  async getSubscriptionStatus(tenantId) {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/subscription/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      const subscription = await response.json();
      
      if (!response.ok) {
        throw new Error(subscription.error || 'Failed to get subscription status');
      }

      return subscription;
    } catch (error) {
      console.error('❌ Failed to get subscription status:', error);
      return null;
    }
  }

  // Get usage statistics
  async getUsageStats(tenantId) {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/usage/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      const usage = await response.json();
      
      if (!response.ok) {
        throw new Error(usage.error || 'Failed to get usage stats');
      }

      return usage;
    } catch (error) {
      console.error('❌ Failed to get usage stats:', error);
      return {
        jokes: 0,
        setlists: 0,
        collaborators: 0,
        storage: 0,
        exports: 0
      };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, reason) {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscriptionId,
          reason
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      trackComedyEvent('subscription_cancelled', {
        subscriptionId,
        reason
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      reportError(error, { context: 'subscription_cancellation' });
      throw error;
    }
  }

  // Update payment method
  async updatePaymentMethod(customerId) {
    try {
      const portalSession = await this.createCustomerPortalSession(customerId);
      window.location.href = portalSession.url;
    } catch (error) {
      console.error('❌ Failed to update payment method:', error);
      throw error;
    }
  }

  // Get invoices
  async getInvoices(customerId, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/invoices/${customerId}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      const invoices = await response.json();
      
      if (!response.ok) {
        throw new Error(invoices.error || 'Failed to get invoices');
      }

      return invoices;
    } catch (error) {
      console.error('❌ Failed to get invoices:', error);
      return [];
    }
  }

  // Usage tracking
  async trackUsage(tenantId, metric, value = 1) {
    try {
      await fetch(`${API_BASE_URL}/billing/track-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          tenantId,
          metric,
          value,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('❌ Failed to track usage:', error);
      // Don't throw - usage tracking shouldn't break app functionality
    }
  }

  // Helper methods
  getPlanByPriceId(priceId) {
    return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.priceId === priceId);
  }

  getPlanById(planId) {
    return SUBSCRIPTION_PLANS[planId];
  }

  async getAuthToken() {
    // This would get the Firebase ID token
    if (typeof window !== 'undefined' && window.firebase) {
      const user = window.firebase.auth().currentUser;
      if (user) {
        return await user.getIdToken();
      }
    }
    return null;
  }

  // Validate subscription status
  isSubscriptionActive(subscription) {
    return subscription && 
           subscription.status === 'active' && 
           subscription.currentPeriodEnd > Date.now();
  }

  // Calculate prorated amount for upgrades
  calculateProration(currentPlan, newPlan, daysRemaining, totalDaysInPeriod) {
    const dailyCurrentRate = currentPlan.price / totalDaysInPeriod;
    const dailyNewRate = newPlan.price / totalDaysInPeriod;
    
    const currentPeriodCredit = dailyCurrentRate * daysRemaining;
    const newPeriodCost = dailyNewRate * daysRemaining;
    
    return Math.max(0, newPeriodCost - currentPeriodCredit);
  }

  // Format price for display
  formatPrice(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  }
}

// Export singleton instance
export const billingService = new BillingService();

// React hook for billing operations
export const useBilling = () => {
  return {
    billingService,
    SUBSCRIPTION_PLANS,
    
    // Common operations
    subscribe: async (planId, tenantId, userId) => {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan || !plan.priceId) {
        throw new Error('Invalid plan selected');
      }
      
      return await billingService.redirectToCheckout(plan.priceId, tenantId, userId);
    },
    
    manageSubscription: async (customerId) => {
      return await billingService.updatePaymentMethod(customerId);
    },
    
    cancelSubscription: async (subscriptionId, reason) => {
      return await billingService.cancelSubscription(subscriptionId, reason);
    }
  };
};