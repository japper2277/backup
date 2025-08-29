/**
 * Business Analytics Dashboard - SaaS Metrics & KPIs
 * Comprehensive business intelligence for comedy SaaS platform
 */

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useTenant } from '../../contexts/TenantContext';
import { PermissionGate } from '../auth/PermissionGate';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const DashboardContainer = styled.div`
  padding: 2rem;
  background: #121212;
  min-height: 100vh;
  color: #ffffff;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #b3b3b3;
    font-size: 1.1rem;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #333;
  
  .metric-header {
    display: flex;
    align-items: center;
    justify-content: between;
    margin-bottom: 1rem;
    
    .metric-icon {
      background: linear-gradient(45deg, #1DB954, #45a3ff);
      border-radius: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      margin-right: 1rem;
    }
    
    h3 {
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 600;
      margin: 0;
    }
  }
  
  .metric-value {
    font-size: 2rem;
    font-weight: 800;
    color: #1DB954;
    margin-bottom: 0.5rem;
  }
  
  .metric-change {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    
    &.positive {
      color: #1DB954;
    }
    
    &.negative {
      color: #ff6b35;
    }
    
    &.neutral {
      color: #b3b3b3;
    }
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #333;
  
  h3 {
    color: #ffffff;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  
  .chart-container {
    position: relative;
    height: 300px;
  }
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const InsightCard = styled.div`
  background: #2a2a2a;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #333;
  
  h3 {
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  
  .insight-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .insight-metric {
        float: right;
        color: #1DB954;
        font-weight: 600;
      }
    }
  }
`;

// Sample data - in real app this would come from API
const generateMockData = () => ({
  revenue: {
    current: 12450,
    previous: 9800,
    change: 27.0
  },
  users: {
    current: 1247,
    previous: 1156,
    change: 7.9
  },
  churn: {
    current: 3.2,
    previous: 4.1,
    change: -22.0
  },
  arpu: {
    current: 23.50,
    previous: 21.20,
    change: 10.8
  },
  revenueData: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Recurring Revenue',
      data: [8500, 9200, 9800, 10400, 11200, 12450],
      borderColor: '#1DB954',
      backgroundColor: 'rgba(29, 185, 84, 0.1)',
      fill: true,
      tension: 0.4
    }]
  },
  subscriptionData: {
    labels: ['Free', 'Pro', 'Team', 'Enterprise'],
    datasets: [{
      data: [634, 423, 156, 34],
      backgroundColor: ['#666666', '#1DB954', '#45a3ff', '#f7931e'],
      borderWidth: 0
    }]
  },
  userEngagement: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Daily Active Users',
        data: [456, 523, 612, 687],
        backgroundColor: '#1DB954'
      },
      {
        label: 'Weekly Active Users',
        data: [987, 1056, 1134, 1247],
        backgroundColor: '#45a3ff'
      }
    ]
  }
});

export const BusinessDashboard = () => {
  const { hasPermission, subscriptionTier, currentTenant } = useTenant();
  const [data, setData] = useState(generateMockData());
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeClass = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  if (loading) {
    return (
      <DashboardContainer>
        <Header>
          <h1>Loading Dashboard...</h1>
          <p>Preparing your business analytics</p>
        </Header>
      </DashboardContainer>
    );
  }

  return (
    <PermissionGate permission="view_analytics" feature="advanced_analytics">
      <DashboardContainer>
        <Header>
          <h1>Business Dashboard</h1>
          <p>Track your comedy platform's key metrics and growth</p>
        </Header>

        <MetricsGrid>
          <MetricCard>
            <div className="metric-header">
              <div className="metric-icon">💰</div>
              <h3>Monthly Recurring Revenue</h3>
            </div>
            <div className="metric-value">{formatCurrency(data.revenue.current)}</div>
            <div className={`metric-change ${getChangeClass(data.revenue.change)}`}>
              <span>{formatPercentage(data.revenue.change)}</span>
              <span>vs last month</span>
            </div>
          </MetricCard>

          <MetricCard>
            <div className="metric-header">
              <div className="metric-icon">👥</div>
              <h3>Total Users</h3>
            </div>
            <div className="metric-value">{data.users.current.toLocaleString()}</div>
            <div className={`metric-change ${getChangeClass(data.users.change)}`}>
              <span>{formatPercentage(data.users.change)}</span>
              <span>vs last month</span>
            </div>
          </MetricCard>

          <MetricCard>
            <div className="metric-header">
              <div className="metric-icon">📉</div>
              <h3>Churn Rate</h3>
            </div>
            <div className="metric-value">{data.churn.current.toFixed(1)}%</div>
            <div className={`metric-change ${getChangeClass(-data.churn.change)}`}>
              <span>{formatPercentage(data.churn.change)}</span>
              <span>vs last month</span>
            </div>
          </MetricCard>

          <MetricCard>
            <div className="metric-header">
              <div className="metric-icon">💳</div>
              <h3>ARPU</h3>
            </div>
            <div className="metric-value">{formatCurrency(data.arpu.current)}</div>
            <div className={`metric-change ${getChangeClass(data.arpu.change)}`}>
              <span>{formatPercentage(data.arpu.change)}</span>
              <span>vs last month</span>
            </div>
          </MetricCard>
        </MetricsGrid>

        <ChartsGrid>
          <ChartCard>
            <h3>Revenue Growth</h3>
            <div className="chart-container">
              <Line
                data={data.revenueData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#2a2a2a',
                      titleColor: '#ffffff',
                      bodyColor: '#e0e0e0',
                      borderColor: '#1DB954',
                      borderWidth: 1
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: '#333' },
                      ticks: { color: '#b3b3b3' }
                    },
                    y: {
                      grid: { color: '#333' },
                      ticks: { 
                        color: '#b3b3b3',
                        callback: (value) => formatCurrency(value)
                      }
                    }
                  }
                }}
              />
            </div>
          </ChartCard>

          <ChartCard>
            <h3>Subscription Distribution</h3>
            <div className="chart-container">
              <Doughnut
                data={data.subscriptionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#e0e0e0' }
                    },
                    tooltip: {
                      backgroundColor: '#2a2a2a',
                      titleColor: '#ffffff',
                      bodyColor: '#e0e0e0'
                    }
                  }
                }}
              />
            </div>
          </ChartCard>
        </ChartsGrid>

        <ChartCard style={{ marginBottom: '2rem' }}>
          <h3>User Engagement</h3>
          <div className="chart-container">
            <Bar
              data={data.userEngagement}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: { color: '#e0e0e0' }
                  },
                  tooltip: {
                    backgroundColor: '#2a2a2a',
                    titleColor: '#ffffff',
                    bodyColor: '#e0e0e0'
                  }
                },
                scales: {
                  x: {
                    grid: { color: '#333' },
                    ticks: { color: '#b3b3b3' }
                  },
                  y: {
                    grid: { color: '#333' },
                    ticks: { color: '#b3b3b3' }
                  }
                }
              }}
            />
          </div>
        </ChartCard>

        <InsightsGrid>
          <InsightCard>
            <h3>Top Features Used</h3>
            <ul className="insight-list">
              <li>
                Joke Bank
                <span className="insight-metric">87%</span>
              </li>
              <li>
                Setlist Builder
                <span className="insight-metric">72%</span>
              </li>
              <li>
                Performance Tracking
                <span className="insight-metric">45%</span>
              </li>
              <li>
                Collaboration
                <span className="insight-metric">28%</span>
              </li>
              <li>
                Audio Notes
                <span className="insight-metric">15%</span>
              </li>
            </ul>
          </InsightCard>

          <InsightCard>
            <h3>Conversion Funnel</h3>
            <ul className="insight-list">
              <li>
                App Visits
                <span className="insight-metric">5,234</span>
              </li>
              <li>
                Sign-ups
                <span className="insight-metric">1,247</span>
              </li>
              <li>
                Trial to Paid
                <span className="insight-metric">423</span>
              </li>
              <li>
                Active Users
                <span className="insight-metric">687</span>
              </li>
              <li>
                Power Users
                <span className="insight-metric">156</span>
              </li>
            </ul>
          </InsightCard>

          <InsightCard>
            <h3>Revenue Insights</h3>
            <ul className="insight-list">
              <li>
                Pro Plan Revenue
                <span className="insight-metric">$6,345</span>
              </li>
              <li>
                Team Plan Revenue
                <span className="insight-metric">$7,020</span>
              </li>
              <li>
                Enterprise Revenue
                <span className="insight-metric">$3,366</span>
              </li>
              <li>
                Avg. Customer LTV
                <span className="insight-metric">$156</span>
              </li>
              <li>
                Monthly Growth
                <span className="insight-metric">+27%</span>
              </li>
            </ul>
          </InsightCard>
        </InsightsGrid>
      </DashboardContainer>
    </PermissionGate>
  );
};

export default BusinessDashboard;