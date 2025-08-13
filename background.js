// Background script for SitefinityXHR Extension
// Handles cross-origin requests and extension lifecycle


// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'makeRequest') {
    handleXHRRequest(request.url, request.options)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'updateIcon') {
    // Create dynamic icon based on Sitefinity detection
    updateExtensionIcon(request.isSitefinity);
  }
});

// Function to update extension icon
function updateExtensionIcon(isSitefinity) {
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  
  // Set background color based on detection
  if (isSitefinity) {
    ctx.fillStyle = '#00d9ff'; // Synthwave blue
  } else {
    ctx.fillStyle = '#666666'; // Grey
  }
  
  // Draw rounded rectangle background
  ctx.fillRect(0, 0, 16, 16);
  
  // Draw 'S' text
  ctx.fillStyle = isSitefinity ? '#0f0f23' : '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', 8, 8);
  
  // Convert to ImageData and set as icon
  const imageData = ctx.getImageData(0, 0, 16, 16);
  
  chrome.action.setIcon({
    imageData: {
      '16': imageData
    }
  });
}

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