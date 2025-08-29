# Google Sheets Integration Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Google Sheets URL

1. **Open your Google Sheet** (the one you want to pull data from)
2. **Go to File → Share → Publish to web**
3. **Select the sheet/tab** you want to publish
4. **Click "Publish"**
5. **Copy the URL** that looks like:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123.../pub?output=csv
   ```

### Step 2: Update Your Config

1. **Open `js/config.js`**
2. **Replace the URL** on line 8:
   ```javascript
   url: 'YOUR_ACTUAL_GOOGLE_SHEETS_URL_HERE',
   ```
3. **Save the file**

### Step 3: Test the Integration

1. **Open your app** in the browser
2. **Open browser console** (F12)
3. **Look for messages like:**
   ```
   [MultiSpreadsheetUpdater] Checking all sources for updates...
   [MultiSpreadsheetUpdater] Successfully updated from Main Schedule: X entries
   ```

## 🔧 Advanced Configuration

### Update Frequency
```javascript
updateInterval: 6 * 60 * 60 * 1000, // 6 hours (change as needed)
```

### Enable Debug Mode
```javascript
debugMode: true, // Set to true to see detailed logs
```

### Notification Settings
```javascript
showNotifications: true, // Show update notifications to users
```

## 🛡️ Safety Features

### Automatic Backups
- ✅ Creates backup before every update
- ✅ Falls back to CSV if Google Sheets fails
- ✅ Validates data before applying

### Data Validation
- ✅ Checks required fields (venue, day, time)
- ✅ Validates coordinates
- ✅ Ensures proper time format

### Error Recovery
- ✅ If update fails → keeps existing data
- ✅ If validation fails → rejects bad data
- ✅ If network fails → uses CSV backup

## 📊 Monitoring

### Admin Panel
Visit `/admin.html` to:
- ✅ Check update status
- ✅ Force manual updates
- ✅ View backup information
- ✅ Enable/disable updates

### Browser Console
Look for these messages:
```
✅ [MultiSpreadsheetUpdater] Successfully updated from Main Schedule: 150 entries
⚠️ [MultiSpreadsheetUpdater] Validation warnings: Row 15: Time format should be "HH:MM AM/PM"
❌ [MultiSpreadsheetUpdater] Data validation failed: Row 23: Missing required fields
```

## 🚨 Troubleshooting

### "No data loaded"
1. **Check the URL** - make sure it ends with `?output=csv`
2. **Check permissions** - sheet must be published to web
3. **Check column names** - must match expected format

### "Validation failed"
1. **Check required columns:**
   - `Venue Name`
   - `Day`
   - `Start Time`
   - `Geocodio Latitude`
   - `Geocodio Longitude`

2. **Check data format:**
   - Time: `7:30 PM` (12-hour format)
   - Day: `Monday`, `Tuesday`, etc.
   - Coordinates: numbers only

### "Update failed"
1. **Check network** - ensure internet connection
2. **Check sheet access** - verify URL is correct
3. **Check browser console** for specific error messages

## 🔄 Update Process

### What Happens When Sheets Updates:
1. **App loads** → Checks for updates every 6 hours
2. **Downloads new data** → From Google Sheets
3. **Validates data** → Checks format and required fields
4. **Creates backup** → Of current data
5. **Applies updates** → Replaces old data with new
6. **Notifies user** → Shows success/error message

### Fallback Process:
1. **If Google Sheets fails** → Uses CSV backup
2. **If validation fails** → Keeps existing data
3. **If network fails** → Uses cached data

## 📝 Column Requirements

Your Google Sheet must have these columns:

| Column Name | Required | Format | Example |
|-------------|----------|--------|---------|
| `Venue Name` | ✅ | Text | `West Side Comedy Club` |
| `Day` | ✅ | Text | `Monday` |
| `Start Time` | ✅ | Time | `7:30 PM` |
| `Geocodio Latitude` | ✅ | Number | `40.7589` |
| `Geocodio Longitude` | ✅ | Number | `-73.9851` |
| `Location` | ❌ | Text | `123 Main St` |
| `Borough` | ❌ | Text | `Manhattan` |
| `Cost` | ❌ | Text | `Free` |
| `Host(s) / Organizer` | ❌ | Text | `John Doe` |

## 🎯 Best Practices

### 1. Test First
- Set up with a test sheet first
- Verify data loads correctly
- Check venue name normalization

### 2. Monitor Updates
- Check admin panel regularly
- Watch browser console for errors
- Set up notifications if needed

### 3. Keep CSV Backup
- Always maintain `coordinates_fixed.csv`
- Update it manually if needed
- Use as emergency fallback

### 4. Validate Data
- Check your Google Sheet format
- Ensure all required columns exist
- Test with sample data first

## 🆘 Emergency Recovery

### If Everything Breaks:
1. **Disable updates:**
   ```javascript
   // In browser console
   window.MicFinderSpreadsheetUpdater.disableUpdates()
   ```

2. **Restore from backup:**
   ```javascript
   // In browser console
   window.MicFinderSpreadsheetUpdater.restoreFromBackup()
   ```

3. **Force CSV mode:**
   ```javascript
   // In browser console
   window.MicFinderConfig.SPREADSHEET_UPDATE_CONFIG.enabled = false
   location.reload()
   ```

## ✅ Success Checklist

- [ ] Google Sheet is published to web
- [ ] URL is correctly set in `js/config.js`
- [ ] App loads data from Google Sheets
- [ ] Venue names are properly capitalized
- [ ] Admin panel shows update status
- [ ] Backup system is working
- [ ] Fallback to CSV works

## 🎉 You're Done!

Your app now automatically updates from Google Sheets with:
- ✅ **Automatic updates** every 6 hours
- ✅ **Data validation** and error checking
- ✅ **Automatic backups** and recovery
- ✅ **Capitalization fixes** for venue names
- ✅ **Admin panel** for monitoring

The system is designed to be **bulletproof** - even if the Google Sheets has issues, your app will keep working with the last known good data. 