// Theme system for consistent styling across components
export const theme = {
  colors: {
    bg: {
      main: '#121212',
      surface: '#181818',
      surface2: '#282828',
      input: '#2a2d3e'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3'
    },
    accent: {
      green: '#1DB954',
      blue: '#45a3ff',
      orange: '#f5c518',
      purple: '#9d6cff',
      red: '#ef4444'
    },
    status: {
      'Idea': '#808080',
      'Workshopping': '#f5c518',
      'Tight 5 Ready': '#45a3ff',
      'Show Ready': '#1DB954'
    },
    border: '#3e4042'
  },
  
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem'
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    pill: '12px'
  },
  
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.1)',
    md: '0 5px 15px rgba(0,0,0,0.3)',
    lg: '0 10px 30px rgba(0,0,0,0.3)'
  },
  
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease'
  },
  
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1200px'
  }
};

// Helper function to get status color
export const getStatusColor = (status) => {
  return theme.colors.status[status] || theme.colors.status['Idea'];
};