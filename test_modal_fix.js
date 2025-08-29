// Test script to verify modal fixes
console.log('🧪 Testing All Filters Modal Fixes...');

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for everything to load
    setTimeout(function() {
        console.log('\n=== Modal Fix Test Results ===');
        
        // Test 1: Check if modal exists
        const modal = document.getElementById('filter-modal');
        console.log('✓ Modal element exists:', !!modal);
        if (modal) {
            console.log('✓ Modal initial classes:', modal.className);
            console.log('✓ Modal initial display:', getComputedStyle(modal).display);
        }
        
        // Test 2: Check for buttons
        const desktopBtn = document.getElementById('modal-button');
        const mobileBtn = document.getElementById('modal-button-mobile');
        console.log('✓ Desktop button exists:', !!desktopBtn);
        console.log('✓ Mobile button exists:', !!mobileBtn);
        
        // Test 3: Try clicking the button that exists
        const testButton = desktopBtn || mobileBtn;
        if (testButton) {
            console.log('✓ Testing button click...');
            
            // Simulate click
            testButton.click();
            
            // Check result after a moment
            setTimeout(() => {
                if (modal) {
                    const isVisible = getComputedStyle(modal).display !== 'none';
                    console.log('✓ Modal visible after click:', isVisible);
                    console.log('✓ Modal classes after click:', modal.className);
                    console.log('✓ Modal computed display:', getComputedStyle(modal).display);
                    
                    if (isVisible) {
                        console.log('🎉 SUCCESS: Modal is now visible!');
                        
                        // Test closing
                        const closeBtn = document.getElementById('close-modal-x');
                        if (closeBtn) {
                            console.log('✓ Testing close button...');
                            closeBtn.click();
                            
                            setTimeout(() => {
                                const stillVisible = getComputedStyle(modal).display !== 'none';
                                console.log('✓ Modal hidden after close:', !stillVisible);
                                if (!stillVisible) {
                                    console.log('🎉 SUCCESS: Modal close also works!');
                                }
                            }, 100);
                        }
                    } else {
                        console.log('❌ ISSUE: Modal still not visible');
                        console.log('Debug info:');
                        console.log('- Modal style.cssText:', modal.style.cssText);
                        console.log('- All CSS rules affecting modal:');
                        
                        // Try to force show it for debugging
                        modal.style.cssText = 'display: block !important; position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,0,0,0.5); z-index: 9999;';
                        console.log('- Forced visibility test - can you see a red overlay?');
                    }
                }
            }, 200);
        } else {
            console.log('❌ No button found to test');
        }
        
    }, 1000);
});

console.log('🧪 Test script loaded - results will appear in 1 second...');
