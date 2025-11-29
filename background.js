// Background script for SitefinityXHR Extension
// Handles cross-origin requests and extension lifecycle

// Handle messages from DevTools panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'makeRequest') {
    handleXHRRequest(request.url, request.options)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    return true; // Keep message channel open for async response
  }
});

async function handleXHRRequest(url, options = {}) {
  try {
    const headers = {
      'X-Requested-With': 'Browser',
      ...options.headers
    };
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body
    });

    const data = await response.json();
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('SitefinityXHR Extension installed');
});