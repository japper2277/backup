// Simple validation script to test our fixes
console.log('🔧 Running validation tests...');

// Test 1: Check if required DOM elements exist
setTimeout(() => {
    console.log('\n=== DOM Elements Test ===');
    
    const filterModal = document.getElementById('filter-modal');
    const pillsRowMobile = document.getElementById('active-pills-row-mobile');
    const modalButton = document.getElementById('modal-button');
    
    console.log('✓ Filter modal exists:', !!filterModal);
    console.log('✓ Mobile pills container exists:', !!pillsRowMobile);
    console.log('✓ Desktop modal button exists:', !!modalButton);
    
    if (filterModal) {
        console.log('✓ Modal classes:', filterModal.className);
        console.log('✓ Modal display style:', getComputedStyle(filterModal).display);
    }
    
    if (pillsRowMobile) {
        console.log('✓ Pills container children:', pillsRowMobile.children.length);
    }
}, 1000);

// Test 2: Check if functions exist
setTimeout(() => {
    console.log('\n=== Functions Test ===');
    console.log('✓ renderActivePills exists:', typeof window.renderActivePills === 'function');

}, 1500);

// Test 3: Try to render pills
setTimeout(() => {
    console.log('\n=== Pills Rendering Test ===');
    try {
        if (typeof window.renderActivePills === 'function') {
            window.renderActivePills();
            console.log('✓ Pills rendering completed without errors');
            
            // Check if All Filters button was created
            const mobileButton = document.getElementById('modal-button-mobile');
            console.log('✓ Mobile All Filters button created:', !!mobileButton);
        }
    } catch (error) {
        console.error('✗ Pills rendering error:', error);
    }
}, 2000);

// Test 4: Try to open modal
setTimeout(() => {
    console.log('\n=== Modal Opening Test ===');
    try {
        const modalButton = document.getElementById('modal-button') || document.getElementById('modal-button-mobile');
        if (modalButton) {
            console.log('✓ Found modal button, testing click...');
            modalButton.click();
            
            setTimeout(() => {
                const filterModal = document.getElementById('filter-modal');
                if (filterModal) {
                    const isVisible = getComputedStyle(filterModal).display !== 'none';
                    console.log('✓ Modal visible after click:', isVisible);
                    
                    // Close modal
                    if (isVisible) {
                        const closeBtn = document.getElementById('close-modal-x');
                        if (closeBtn) {
                            closeBtn.click();
                            console.log('✓ Modal closed');
                        }
                    }
                }
            }, 500);
        }
    } catch (error) {
        console.error('✗ Modal opening error:', error);
    }
}, 2500);

console.log('🔧 Validation tests scheduled. Check console in a few seconds...');
