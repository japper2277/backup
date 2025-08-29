// Accessibility Functionality

// Trap focus within an element
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}

// Save current focus
function saveFocus() {
    window.MicFinderState.setLastFocusedElement(document.activeElement);
}

// Restore focus
function restoreFocus() {
    const lastFocusedElement = window.MicFinderState.getLastFocusedElement();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
        window.MicFinderState.setLastFocusedElement(null);
    }
}

// Focus first interactive element
function focusFirstInteractiveElement(element) {
    const focusable = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
        focusable[0].focus();
    }
}

// Set ARIA expanded attribute
function setAriaExpanded(element, expanded) {
    element.setAttribute('aria-expanded', expanded.toString());
}

// Set ARIA label
function setAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
}

// Set ARIA described by
function setAriaDescribedBy(element, describedBy) {
    element.setAttribute('aria-describedby', describedBy);
}

// Set ARIA controls
function setAriaControls(element, controls) {
    element.setAttribute('aria-controls', controls);
}

// Set ARIA live
function setAriaLive(element, live) {
    element.setAttribute('aria-live', live);
}

// Announce to screen reader
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Export accessibility functionality
window.MicFinderAccessibility = {
    trapFocus,
    saveFocus,
    restoreFocus,
    focusFirstInteractiveElement,
    setAriaExpanded,
    setAriaLabel,
    setAriaDescribedBy,
    setAriaControls,
    setAriaLive,
    announceToScreenReader
}; 