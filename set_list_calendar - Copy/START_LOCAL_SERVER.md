# 🚀 Quick Start - Local Development Server

## ⚠️ IMPORTANT: Module Loading Issue

If you're getting the error:
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

This means you're opening the HTML file directly (`file://` protocol) instead of serving it through a web server. JavaScript modules require a proper HTTP server.

## 🛠️ Quick Solutions

### Option 1: Python Server (Recommended)
```bash
# Navigate to project directory
cd /path/to/mic-calendar

# Start Python server
python -m http.server 3000

# Open http://localhost:3000/set_list_Calendar.html
```

### Option 2: Node.js Server
```bash
# Install a simple server
npm install -g http-server

# Start server
http-server -p 3000

# Open http://localhost:3000/set_list_Calendar.html
```

### Option 3: PHP Server
```bash
# Start PHP server
php -S localhost:3000

# Open http://localhost:3000/set_list_Calendar.html
```

### Option 4: VS Code Live Server Extension
1. Install the "Live Server" extension in VS Code
2. Right-click on `set_list_Calendar.html`
3. Select "Open with Live Server"

## 🎯 What This Fixes

Running through a server fixes:
- ✅ JavaScript module imports
- ✅ CORS issues with CSV loading
- ✅ Proper environment variable handling
- ✅ All interactive features

## 🚀 For Production

For production deployment, **always** use the built version:
```bash
npm run build
npm run preview
```

Then deploy the `dist` folder to your hosting service.

---

**TL;DR**: Never open `file://` directly. Always use a server! 🎭
