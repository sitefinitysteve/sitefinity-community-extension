# Sitefinity Community Extension

An unofficial community extension for Sitefinity development tools built with Vue.js 3 and Tailwind CSS 4.

## Features

- **API Tester**: Make HTTP requests to Sitefinity APIs with request history
- **Sitefinity Detection**: Automatically detects Sitefinity sites and versions
- **Request History**: Remembers last 10 unique requests for easy re-use
- **Vue DevTools Style**: Professional dark theme matching Vue.js DevTools

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Build for development (with file watching)
npm run watch

# Build for production
npm run build
```

### Loading in Chrome

1. Run `npm run build` to create the `dist/` folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder
5. Navigate to a Sitefinity site and open DevTools
6. Look for the "Sitefinity Community" tab

## Build Output

The build process creates:

- `dist/panel.html` - Vue.js-powered DevTools panel
- `dist/panel.js` - Bundled Vue application
- `dist/background.js` - Service worker
- `dist/content.js` - Content script for site detection
- `dist/devtools.js` - DevTools entry point
- `dist/manifest.json` - Extension manifest

## Chrome Web Store Deployment

1. Run `npm run build`
2. Zip the entire `dist/` folder
3. Upload to Chrome Web Store Developer Dashboard

## Tech Stack

- **Vue.js 3** - Reactive UI framework
- **Tailwind CSS 4** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **Chrome Extensions Manifest V3** - Extension API

## Created By

**SitefinitySteve**  
[www.sitefinitysteve.com](https://www.sitefinitysteve.com)

---

*This is an unofficial community extension and is not affiliated with Progress Software Corporation.*