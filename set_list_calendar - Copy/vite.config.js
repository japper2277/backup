import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Base public path
    base: './',
    
    // Build configuration
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      target: 'es2015',
      rollupOptions: {
        input: {
          main: 'set_list_Calendar.html',
          demo: 'react-demo.html',
        },
        output: {
          // Simplified code splitting - let Vite handle it automatically
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database']
          },
          
          // Simple chunk file names
          chunkFileNames: 'assets/[name]-[hash].js',
          
          // Optimize asset file names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/\.(css)$/.test(assetInfo.name)) {
              return `css/[name]-[hash].${ext}`
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]-[hash].${ext}`
            }
            return `assets/[name]-[hash].${ext}`
          },
          
          // Add globals for React
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM'
          }
        },
      },
    },
    
    // Development server
    server: {
      port: 3000,
      open: true,
      host: true,
      strictPort: false,
      cors: true,
      force: true,
      origin: 'http://localhost:3000'
    },
    
    // Preview server (for production builds)
    preview: {
      port: 3000,
      open: true,
    },
    
    // Define global constants
    define: {
      // Inject environment variables into the app
      __APP_VERSION__: JSON.stringify(env.VERSION || '2.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: mode === 'development',
    },
    
    // CSS configuration
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        // Add CSS preprocessor options if needed
      },
    },
    
    // Asset optimization
    assetsInclude: ['**/*.csv'], // Include CSV files as assets
    
    // Plugin configuration
    plugins: [
      // React plugin for JSX support
      react(),
      
      // Custom plugin to inject environment variables into index.html
      {
        name: 'inject-env',
        transformIndexHtml: {
          enforce: 'pre',
          transform(html, ctx) {
            // Inject environment configuration
            const envConfig = {
              NODE_ENV: mode,
              VERSION: env.VERSION || '2.0.0',
              API_BASE_URL: env.API_BASE_URL || 'https://api.micfinderapp.com',
              CSV_DATA_URL: env.CSV_DATA_URL || './coordinates.csv',
              FEEDBACK_EMAIL: env.FEEDBACK_EMAIL || 'support@micfinderapp.com',
              FEATURES: {
                ONBOARDING: env.FEATURE_ONBOARDING !== 'false',
                MIC_FINDER: env.FEATURE_MIC_FINDER !== 'false',
                STATS_CHARTS: env.FEATURE_STATS_CHARTS !== 'false',
                SETLIST_BUILDER: env.FEATURE_SETLIST_BUILDER !== 'false',
                DATA_EXPORT: env.FEATURE_DATA_EXPORT !== 'false',
                KEYBOARD_SHORTCUTS: env.FEATURE_KEYBOARD_SHORTCUTS !== 'false',
                COLLABORATION: env.FEATURE_COLLABORATION === 'true',
                OFFLINE_MODE: env.FEATURE_OFFLINE_MODE === 'true',
                ANALYTICS: env.FEATURE_ANALYTICS === 'true',
                PUSH_NOTIFICATIONS: env.FEATURE_PUSH_NOTIFICATIONS === 'true',
              },
              PERFORMANCE: {
                CHART_ANIMATION_DURATION: parseInt(env.CHART_ANIMATION_DURATION) || 750,
                NOTIFICATION_DURATION: parseInt(env.NOTIFICATION_DURATION) || 3000,
                DEBOUNCE_DELAY: parseInt(env.DEBOUNCE_DELAY) || 300,
                MAX_EVENTS_PER_DAY: parseInt(env.MAX_EVENTS_PER_DAY) || 10,
                MAX_SAVED_SETLISTS: parseInt(env.MAX_SAVED_SETLISTS) || 50,
              },
              UI: {
                DEFAULT_VIEW: env.DEFAULT_VIEW || 'week',
                DEFAULT_THEME: env.DEFAULT_THEME || 'dark',
                MOBILE_BREAKPOINT: parseInt(env.MOBILE_BREAKPOINT) || 768,
                MODAL_ANIMATION_DURATION: parseInt(env.MODAL_ANIMATION_DURATION) || 200,
              },
              DATA: {
                AUTO_SAVE: env.AUTO_SAVE !== 'false',
                BACKUP_FREQUENCY: parseInt(env.BACKUP_FREQUENCY) || 86400000,
                MAX_STORAGE_SIZE: parseInt(env.MAX_STORAGE_SIZE) || 5242880,
              },
              DEBUG: {
                ENABLED: env.DEBUG_ENABLED === 'true' || mode === 'development',
                LOG_LEVEL: env.LOG_LEVEL || 'info',
                SHOW_PERFORMANCE_METRICS: env.SHOW_PERFORMANCE_METRICS === 'true',
                MOCK_API_DELAY: parseInt(env.MOCK_API_DELAY) || 500,
              },
            };
            
            // Inject the configuration before the closing head tag
            return html.replace(
              '</head>',
              `  <script>window.ENV_CONFIG = ${JSON.stringify(envConfig, null, 2)};</script>\n</head>`
            );
          },
        },
      },
    ],
    
    // Environment variables
    envPrefix: ['VITE_', 'FEATURE_', 'NODE_ENV', 'VERSION'],
    
    // Optimization configuration
    optimizeDeps: {
      include: [
        // Pre-bundle these dependencies
        'zustand',
        'immer',
        'react-window'
      ],
      exclude: [
        // Don't pre-bundle these
      ],
    },
    
    // Resolve configuration
    resolve: {
      alias: {
        // Fix react-firebase-hooks package resolution
        'react-firebase-hooks/auth': 'react-firebase-hooks/auth/dist/index.esm.js'
      }
    },
    
    // Worker configuration
    worker: {
      format: 'es',
    },
    
    // Experimental features
    experimental: {
      // Enable any experimental features here
    },
    
    // Vitest configuration
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.js'],
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', 'tests/e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/',
          'dist/',
          '**/*.config.js',
          '**/*.config.ts'
        ]
      },
      testTimeout: 10000,
      hookTimeout: 10000
    },
  };
});
