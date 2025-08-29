// Test script to validate All Filters button fixes
console.log('🧪 Testing All Filters Button Fixes...');

// Test 1: Check if renderActivePills function exists
if (typeof window.renderActivePills === 'function') {
    console.log('✅ renderActivePills function exists');
} else {
    console.error('❌ renderActivePills function missing');
}

// Test 2: Check if mobile pills container exists
const pillsContainer = document.getElementById('active-pills-row-mobile');
if (pillsContainer) {
    console.log('✅ Mobile pills container found');
    
    // Test 3: Try to render pills
    try {
        window.renderActivePills();
        console.log('✅ Pills rendered without errors');
        
        // Test 4: Check if All Filters button was created
        setTimeout(() => {
            const allFiltersBtn = document.getElementById('modal-button-mobile');
            if (allFiltersBtn) {
                console.log('✅ All Filters button found');
                
                // Test 5: Check button dimensions
                const rect = allFiltersBtn.getBoundingClientRect();
                console.log('📏 Button dimensions:', {
                    width: rect.width,
                    height: rect.height,
                    display: getComputedStyle(allFiltersBtn).display
                });
                
                if (rect.width > 0 && rect.height > 0) {
                    console.log('✅ Button has proper dimensions');
                } else {
                    console.error('❌ Button has zero dimensions');
                }
                
                // Test 6: Check if click works
                const testClick = () => {
                    console.log('🖱️ Testing button click...');
                    allFiltersBtn.click();
                    
                    // Check if modal opened
                    setTimeout(() => {
                        const modal = document.getElementById('filter-modal');
                        if (modal && !modal.classList.contains('hidden')) {
                            console.log('✅ Modal opened successfully!');
                        } else {
                            console.error('❌ Modal did not open');
                        }
                    }, 100);
                };
                
                // Add test click button
                const testClickBtn = document.createElement('button');
                testClickBtn.textContent = 'Test Click';
                testClickBtn.style.position = 'fixed';
                testClickBtn.style.top = '10px';
                testClickBtn.style.right = '10px';
                testClickBtn.style.zIndex = '9999';
                testClickBtn.style.background = 'red';
                testClickBtn.style.color = 'white';
                testClickBtn.style.padding = '10px';
                testClickBtn.onclick = testClick;
                document.body.appendChild(testClickBtn);
                
            } else {
                console.error('❌ All Filters button not found');
            }
        }, 100);
        
    } catch (e) {
        console.error('❌ Pills rendering failed:', e);
    }
    
} else {
    console.error('❌ Mobile pills container not found');
}

// Test 7: Check if openModal function exists
if (typeof openModal === 'function') {
    console.log('✅ openModal function exists');
} else {
    console.error('❌ openModal function missing');
}

console.log('🧪 Test script completed');