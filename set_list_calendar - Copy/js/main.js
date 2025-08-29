// Main Application Entry Point
import config from './config.js';
import { dataStore } from './data.js';
import { renderCalendar } from './ui.js';
import { setupEventListeners } from './events.js';
import { initializeOnboarding } from './onboarding.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Validate configuration
        const validation = config.validate();
        if (!validation.valid) {
            config.log('error', 'Configuration validation failed', validation.errors);
        }
        if (validation.warnings.length > 0) {
            config.log('warn', 'Configuration warnings', validation.warnings);
        }
        
        // Initialize data
        await config.measurePerformance('Data Loading', async () => {
            dataStore.load();
        });
        
        // Run migration for V2 Joke Bank if needed
        await config.measurePerformance('Data Migration V2', async () => {
            dataStore.runMigrationV2();
        });
        
        // Apply saved theme or default
        const savedTheme = dataStore.getSetting('theme') || config.get('UI.DEFAULT_THEME');
        if (savedTheme) {
            applyTheme(savedTheme);
        }
        
        // Apply saved default view
        const savedDefaultView = dataStore.getSetting('defaultView') || config.get('UI.DEFAULT_VIEW');
        if (savedDefaultView) {
            applyDefaultView(savedDefaultView);
        }
        
        // Setup all event listeners
        await config.measurePerformance('Event Listeners Setup', async () => {
            setupEventListeners();
        });
        
        // Initial render
        await config.measurePerformance('Initial Calendar Render', async () => {
            renderCalendar();
        });
        
        // Initialize onboarding for new users (if feature enabled)
        if (config.isFeatureEnabled('ONBOARDING')) {
            initializeOnboarding();
        }
        
        // Log successful initialization
        config.log('info', `Mic Calendar v${config.get('VERSION')} initialized successfully!`);
        config.log('debug', 'Enabled features:', config.getEnabledFeatures());
        
        // Emit application ready event
        window.dispatchEvent(new CustomEvent('micCalendarReady', {
            detail: { version: config.get('VERSION'), features: config.getEnabledFeatures() }
        }));
        
    } catch (error) {
        config.log('error', 'Application initialization failed', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: var(--bg-surface); padding: 2rem; border-radius: 8px; 
                        border: 1px solid var(--accent-red); color: var(--text-primary); 
                        text-align: center; z-index: 10000;">
                <h3 style="color: var(--accent-red); margin-bottom: 1rem;">⚠️ Initialization Error</h3>
                <p>The application failed to start properly.</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">Please refresh the page or contact support if the problem persists.</p>
                <button onclick="window.location.reload()" 
                        style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--accent-blue); 
                               color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(errorMessage);
    }
});

// Theme application function
function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        // Light theme colors
        root.style.setProperty('--bg-main', '#ffffff');
        root.style.setProperty('--bg-surface', '#f8f9fa');
        root.style.setProperty('--bg-surface-2', '#e9ecef');
        root.style.setProperty('--bg-input', '#ffffff');
        root.style.setProperty('--text-primary', '#212529');
        root.style.setProperty('--text-secondary', '#6c757d');
        root.style.setProperty('--border-color', '#dee2e6');
    } else {
        // Dark theme colors (default)
        root.style.setProperty('--bg-main', '#18191a');
        root.style.setProperty('--bg-surface', '#232533');
        root.style.setProperty('--bg-surface-2', '#3a3b3c');
        root.style.setProperty('--bg-input', '#2a2d3e');
        root.style.setProperty('--text-primary', '#e4e6eb');
        root.style.setProperty('--text-secondary', '#b0b3b8');
        root.style.setProperty('--border-color', '#3e4042');
    }
}

// Default view application function
function applyDefaultView(view) {
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;
    
    // Import UI functions
    import('./ui.js').then(({ setExpandedView }) => {
        switch(view) {
            case 'week':
                document.getElementById('weekViewBtn')?.click();
                break;
            case 'month':
                document.getElementById('monthViewBtn')?.click();
                break;
            case 'list':
                document.getElementById('listViewBtn')?.click();
                break;
            default:
                document.getElementById('weekViewBtn')?.click();
        }
    });
}

// Make functions available globally
window.applyTheme = applyTheme;
window.applyDefaultView = applyDefaultView;
