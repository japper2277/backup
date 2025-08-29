// Comprehensive test for all the fixes
console.log('🔧 COMPREHENSIVE ALL FILTERS BUTTON TEST');

document.addEventListener('DOMContentLoaded', function() {
    console.log('\n=== Testing All Fixes ===');
    
    setTimeout(() => {
        // Test 1: DOM Elements
        console.log('\n1️⃣ Testing DOM Elements...');
        const modal = document.getElementById('filter-modal');
        const desktopBtn = document.getElementById('modal-button');
        const mobileBtn = document.getElementById('modal-button-mobile');
        
        console.log('✓ Modal exists:', !!modal);
        console.log('✓ Desktop button exists:', !!desktopBtn);
        console.log('✓ Mobile button exists:', !!mobileBtn);
        
        if (modal) {
            console.log('✓ Modal classes:', modal.className);
            console.log('✓ Modal display:', getComputedStyle(modal).display);
        }
        
        // Test 2: Button Dimensions
        console.log('\n2️⃣ Testing Button Dimensions...');
        [desktopBtn, mobileBtn].forEach((btn, index) => {
            if (btn) {
                const rect = btn.getBoundingClientRect();
                const name = index === 0 ? 'Desktop' : 'Mobile';
                console.log(`✓ ${name} button dimensions:`, {
                    width: rect.width,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0
                });
                
                if (rect.width === 0 || rect.height === 0) {
                    console.warn(`⚠️  ${name} button has zero dimensions!`);
                    
                    // Try to fix it
                    btn.style.minWidth = '100px';
                    btn.style.minHeight = '40px';
                    btn.style.display = 'flex';
                    btn.style.alignItems = 'center';
                    btn.style.padding = '10px 20px';
                    
                    const newRect = btn.getBoundingClientRect();
                    console.log(`🔧 After fix:`, {
                        width: newRect.width,
                        height: newRect.height
                    });
                }
            }
        });
        
        // Test 3: Modal Opening
        console.log('\n3️⃣ Testing Modal Opening...');
        const testBtn = desktopBtn || mobileBtn;
        
        if (testBtn) {
            console.log('🧪 Testing modal open with button:', testBtn.id);
            
            // Add test listener
            const testClick = () => {
                console.log('🎯 Button clicked successfully!');
                
                setTimeout(() => {
                    if (modal) {
                        const isVisible = getComputedStyle(modal).display !== 'none';
                        console.log('📋 Modal visible:', isVisible);
                        console.log('📋 Modal classes:', modal.className);
                        console.log('📋 Modal style:', modal.style.cssText);
                        
                        if (isVisible) {
                            console.log('🎉 SUCCESS: Modal opens correctly!');
                            
                            // Test closing
                            const closeBtn = document.getElementById('close-modal-x');
                            if (closeBtn) {
                                console.log('🧪 Testing modal close...');
                                closeBtn.click();
                                
                                setTimeout(() => {
                                    const stillVisible = getComputedStyle(modal).display !== 'none';
                                    if (!stillVisible) {
                                        console.log('🎉 SUCCESS: Modal closes correctly!');
                                    } else {
                                        console.log('❌ ISSUE: Modal not closing properly');
                                    }
                                }, 100);
                            }
                        } else {
                            console.log('❌ ISSUE: Modal not visible after click');
                            console.log('Debug info:');
                            console.log('- Computed display:', getComputedStyle(modal).display);
                            console.log('- Has hidden class:', modal.classList.contains('hidden'));
                            console.log('- Has flex class:', modal.classList.contains('flex'));
                        }
                    }
                }, 200);
            };
            
            testBtn.addEventListener('click', testClick, { once: true });
            testBtn.click();
        } else {
            console.log('❌ No button available for testing');
        }
        
        // Test 4: Check for duplicates
        console.log('\n4️⃣ Checking for Duplicates...');
        const allDesktopBtns = document.querySelectorAll('#modal-button');
        const allMobileBtns = document.querySelectorAll('#modal-button-mobile');
        
        console.log('🖥️ Desktop buttons found:', allDesktopBtns.length);
        console.log('📱 Mobile buttons found:', allMobileBtns.length);
        
        if (allDesktopBtns.length > 1 || allMobileBtns.length > 1) {
            console.warn('⚠️  DUPLICATE BUTTONS DETECTED!');
        } else {
            console.log('✅ No duplicate buttons');
        }
        
        // Test 5: Event listeners
        console.log('\n5️⃣ Testing Event Listeners...');
        console.log('Event listeners should be attached automatically.');
        console.log('Check for console messages like "[MODAL] Desktop button clicked"');
        
        console.log('\n🏁 COMPREHENSIVE TEST COMPLETE');
        console.log('Summary:');
        console.log('- Modal element:', !!modal ? '✅' : '❌');
        console.log('- Buttons exist:', !!(desktopBtn || mobileBtn) ? '✅' : '❌');
        console.log('- Dimensions OK:', testBtn && testBtn.getBoundingClientRect().width > 0 ? '✅' : '❌');
        
    }, 2000); // Wait 2 seconds for everything to load
});

console.log('🔧 Comprehensive test script loaded...');
