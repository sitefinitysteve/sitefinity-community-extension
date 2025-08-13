# SitefinityXHR Extension Installation

## How to Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" button
4. Select this folder: `/Users/steve/Apps/chrome-extensions/SitefinityXHR`
5. The extension should now appear in your extensions list

## How to Use

1. Navigate to a Sitefinity website
2. Click the extension icon in the browser toolbar
3. The popup will show whether it detected a Sitefinity site
4. If detected, enter an API route (e.g., `/api/default/newsitems`)
5. Click "Execute" to make the request
6. Results will be logged to the browser's developer console
7. Past requests are saved in the history for easy re-use

## Features

- ✅ Validates Sitefinity sites by checking meta generator tag
- ✅ Input field for API routes
- ✅ Request history (last 10 calls)
- ✅ Click history items to reuse routes
- ✅ Delete individual history items
- ✅ Clear all history
- ✅ Results logged to console
- ✅ Chrome Extension Store policy compliant

## Troubleshooting

- If the extension doesn't detect a Sitefinity site, check that the page has `<meta name="Generator" content="...Sitefinity...">` in the HTML
- Open Developer Tools (F12) to see request results in the console
- Make sure you have the necessary permissions to access the target APIs