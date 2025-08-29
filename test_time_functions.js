// Test your existing formatTime function
function formatTime(timeStr) {
    if (!timeStr) return '';
    
    // If it's in 24-hour format, convert to 12-hour
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        let [_, hours, minutes] = match;
        hours = parseInt(hours, 10);
        const modifier = hours >= 12 ? 'PM' : 'AM';
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${modifier}`;
    }
    
    // If it's already in 12-hour format, just clean it up
    return timeStr.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/i, (match, hours, minutes, modifier) => {
        hours = parseInt(hours, 10);
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${modifier.toUpperCase()}`;
    });
}

// Test your to12HourString function
function to12HourString(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    let hour = h % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

// Test cases
console.log('=== TESTING formatTime ===');
console.log('4:30 PM -> ', formatTime('4:30 PM'));
console.log('16:30 -> ', formatTime('16:30'));
console.log('09:00 -> ', formatTime('09:00'));
console.log('12:00 -> ', formatTime('12:00'));
console.log('00:30 -> ', formatTime('00:30'));

console.log('=== TESTING to12HourString ===');
console.log('16:30 -> ', to12HourString('16:30'));
console.log('09:00 -> ', to12HourString('09:00'));
console.log('12:00 -> ', to12HourString('12:00'));
console.log('00:30 -> ', to12HourString('00:30'));
