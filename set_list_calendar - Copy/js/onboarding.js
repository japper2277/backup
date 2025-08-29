// Onboarding Module - Provides guided tour for new users
import { showNotification } from './modals.js';

let tour = null;

export function initializeOnboarding() {
    // Check if user has completed onboarding and if they want to see it
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    
    // Import dataStore to check settings
    import('./data.js').then(({ dataStore }) => {
        const showOnboarding = dataStore.getSetting('showOnboarding');
        
        if (!hasCompletedOnboarding && showOnboarding && typeof Shepherd !== 'undefined') {
            // Start onboarding after a brief delay to let the page settle
            setTimeout(startOnboardingTour, 1000);
        }
    });
}

export function startOnboardingTour() {
    if (typeof Shepherd === 'undefined') {
        console.warn('Shepherd.js not available for onboarding');
        return;
    }
    
    tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shadow-md bg-purple-dark',
            scrollTo: true,
            cancelIcon: {
                enabled: true
            }
        }
    });

    // Welcome Step
    tour.addStep({
        title: 'Welcome to Mic Calendar! 🎤',
        text: `
            <p>Welcome to your comedy set tracking app! This tour will show you the key features to help you manage your performances effectively.</p>
            <p>Let's get started!</p>
        `,
        buttons: [
            {
                text: 'Skip Tour',
                action: tour.cancel,
                secondary: true
            },
            {
                text: 'Start Tour',
                action: tour.next
            }
        ]
    });

    // Calendar View
    tour.addStep({
        title: 'Your Performance Calendar',
        text: 'This is your main calendar view where you can see all your scheduled and past comedy sets. Each colored pill represents a different type of performance.',
        attachTo: {
            element: '#calendarGrid',
            on: 'top'
        },
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                secondary: true
            },
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    // View Toggle
    tour.addStep({
        title: 'Switch Views',
        text: 'You can switch between Week, Month, and List views to see your sets in different formats. Try clicking these buttons!',
        attachTo: {
            element: '.view-toggle',
            on: 'bottom'
        },
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                secondary: true
            },
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    // Add Set Button
    tour.addStep({
        title: 'Log Your Sets',
        text: 'Click "Add Set" to record a new comedy performance. You can add details like venue, date, setlist, and notes about how it went.',
        attachTo: {
            element: '#addSetBtn',
            on: 'bottom'
        },
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                secondary: true
            },
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    // Add Mic Button
    tour.addStep({
        title: 'Add from Mic Finder',
        text: 'Use "Add Mic" to quickly add sets from our open mic database. This pre-fills venue information and saves you time.',
        attachTo: {
            element: '#addMicBtn',
            on: 'bottom'
        },
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                secondary: true
            },
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    // Search and Filter
    tour.addStep({
        title: 'Search & Filter',
        text: 'Use the search bar to find specific venues, jokes, or notes. Filter by performance type or use advanced filters for date ranges and joke counts.',
        attachTo: {
            element: '#venueSearch',
            on: 'bottom'
        },
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                secondary: true
            },
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    // Stats
    tour.addStep({
        title: 'Track Your Progress',
        text: 'Click the Stats icon in the bottom navigation to see detailed analytics about your performances, top venues, and joke usage.',
        attachTo: {
            element: '#statsNavBtn',
            on: 'top'
        },
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                secondary: true
            },
            {
                text: 'Next',
                action: tour.next
            }
        ]
    });

    // Keyboard Shortcuts
    tour.addStep({
        title: 'Pro Tips! ⚡',
        text: `
            <p><strong>Keyboard Shortcuts:</strong></p>
            <ul style="text-align: left; margin: 1rem 0;">
                <li><code>Ctrl+F</code> - Focus search</li>
                <li><code>Ctrl+T</code> - Go to today</li>
                <li><code>Ctrl+M</code> - Add mic</li>
                <li><code>1/2/3</code> - Switch views</li>
                <li><code>←/→</code> - Navigate weeks</li>
            </ul>
            <p><strong>Click any empty day to quickly add a set for that date!</strong></p>
        `,
        buttons: [
            {
                text: 'Back',
                action: tour.back,
                secondary: true
            },
            {
                text: 'Finish Tour',
                action: tour.complete
            }
        ]
    });

    // Tour completion
    tour.on('complete', () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        showNotification('Welcome aboard! You\'re ready to start tracking your comedy journey! 🎭', 'success');
    });

    tour.on('cancel', () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        showNotification('Tour skipped. You can restart it anytime from Settings!', 'info');
    });

    tour.start();
}

export function restartOnboardingTour() {
    localStorage.removeItem('hasCompletedOnboarding');
    startOnboardingTour();
}
