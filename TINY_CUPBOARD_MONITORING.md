# 🟦 Tiny Cupboard Real-Time Monitoring System

## Overview
Your app now automatically monitors the Tiny Cupboard Google Spreadsheet and updates in real-time whenever there are changes to mic schedules, hosts, or times.

## What It Does
- **Automatically checks** the Tiny Cupboard spreadsheet every 5 minutes
- **Detects changes** in real-time (new hosts, time changes, mic additions)
- **Updates your app** automatically without manual intervention
- **Shows notifications** when updates occur
- **Transforms spreadsheet data** to your app's format

## How It Works

### 1. Automatic Monitoring
- Starts automatically when your app loads
- Checks every 5 minutes for changes
- Only updates when actual changes are detected
- Runs in the background without user interaction

### 2. Data Transformation
The system converts the Tiny Cupboard spreadsheet format:
```
DAY | TIME | HOST | Name | How to Sign Up | More Info
SUN | 7:00 PM | Xander | SHOW UP GO UP | 
MON | 5:30 PM | Gene Morgan | SHOW UP GO UP |
```

Into your app's standard mic format with:
- Proper day names (Sunday, Monday, etc.)
- Formatted times (7:00 PM - 8:00 PM)
- Venue details (address, coordinates, etc.)
- Unique identifiers for each mic

### 3. Change Detection
- Compares current data with previous data
- Updates only when changes are detected
- Prevents unnecessary updates
- Maintains data integrity

## Configuration

### In `js/config.js`
```javascript
tinyCupboard: {
    url: 'https://docs.google.com/spreadsheets/d/1zsAfFe24uxio5o76BNcgZNNKbUMi6OE2NmoQkhIDCm0/export?format=csv&gid=0',
    enabled: true,
    name: 'Tiny Cupboard Schedule',
    priority: 2,
    updateInterval: 2 * 60 * 60 * 1000, // 2 hours
    replaceAll: false,
    venue: 'Tiny Cupboard',
    validateData: true,
    backupOnUpdate: true,
    filterByVenue: true
}
```

### Key Settings
- **`enabled: true`** - Turn monitoring on/off
- **`updateInterval`** - How often to check for updates
- **`venue: 'Tiny Cupboard'`** - Only affects Tiny Cupboard entries
- **`filterByVenue: true`** - Prevents conflicts with other data

## Features

### Real-Time Updates
- ✅ Host changes (e.g., "NEEDS NEW HOST" → "New Host Name")
- ✅ Time slot additions/removals
- ✅ Mic name updates
- ✅ Sign-up method changes
- ✅ Additional information updates

### Smart Notifications
- Green notification appears when updates occur
- Shows number of mics refreshed
- Auto-dismisses after 5 seconds
- Clickable close button

### Data Validation
- Ensures all required fields are present
- Validates time formats
- Checks coordinate data
- Prevents invalid data from breaking your app

## Testing the System

### 1. Demo Page
Open `tiny_cupboard_demo.html` to test the monitoring system:
- Start/stop monitoring
- Check for updates manually
- View real-time data transformation
- See monitoring logs

### 2. In Your Main App
- Look for "Live from Tiny Cupboard" in mic details
- Check console logs for monitoring activity
- Watch for update notifications
- Verify Tiny Cupboard mics show current data

## Console Logs
The system provides detailed logging:
```
[TinyCupboard] Starting monitoring...
[TinyCupboard] Checking for updates...
[TinyCupboard] Transformed 15 mics from spreadsheet
[TinyCupboard] Changes detected! Updating app data...
[TinyCupboard] Update completed successfully
```

## Troubleshooting

### Common Issues

**1. Monitoring not starting**
- Check if `enabled: true` in config
- Verify spreadsheet URL is accessible
- Check browser console for errors

**2. No updates detected**
- Verify spreadsheet has changed
- Check network connectivity
- Clear browser cache and reload

**3. Data not transforming correctly**
- Check spreadsheet format matches expected columns
- Verify day/time formats are correct
- Check console for transformation errors

### Debug Mode
Enable debug mode in config:
```javascript
SPREADSHEET_UPDATE_CONFIG: {
    debugMode: true,
    // ... other settings
}
```

## Manual Controls

### Start/Stop Monitoring
```javascript
// Start monitoring
window.MicFinderSpreadsheetUpdater.startTinyCupboardMonitoring();

// Stop monitoring
window.MicFinderSpreadsheetUpdater.stopTinyCupboardMonitoring();

// Check for updates now
window.MicFinderSpreadsheetUpdater.checkTinyCupboardUpdates();
```

### Get System Status
```javascript
const status = window.MicFinderSpreadsheetUpdater.getUpdateState();
console.log('Tiny Cupboard status:', status);
```

## Benefits

### For Users
- **Always current information** about Tiny Cupboard mics
- **Real-time host updates** (no more "NEEDS NEW HOST")
- **Accurate time slots** and sign-up methods
- **Live venue information** from the source

### For You
- **No manual updates** required
- **Automatic data synchronization**
- **Real-time monitoring** without server costs
- **Scalable system** for adding more venues

## Future Enhancements

### Planned Features
- [ ] Webhook support for instant updates
- [ ] Multiple venue monitoring
- [ ] Advanced change notifications
- [ ] Data analytics and reporting
- [ ] Mobile push notifications

### Adding More Venues
The system is designed to easily add more venues:
1. Add venue config to `SPREADSHEET_SOURCES`
2. Create venue-specific transformer function
3. Add to monitoring system
4. Test and deploy

## Support

### Getting Help
- Check console logs for error messages
- Verify spreadsheet accessibility
- Test with demo page first
- Review configuration settings

### Reporting Issues
Include in bug reports:
- Console error messages
- Spreadsheet URL accessibility
- Browser and OS information
- Steps to reproduce

---

**The Tiny Cupboard monitoring system is now live and automatically keeping your app updated with the latest mic information! 🎉**
