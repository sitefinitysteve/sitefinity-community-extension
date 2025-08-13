// Content script for SitefinityXHR Extension
// This script runs on all pages to help with site detection

(function() {
  'use strict';
  
  // Function to check if current page is a Sitefinity site
  function checkSitefinitySite() {
    const metaTags = document.querySelectorAll('meta[name="Generator"]');
    for (const meta of metaTags) {
      if (meta.content && meta.content.toLowerCase().includes('sitefinity')) {
        // Extract version from generator content like "Sitefinity 14.2.7929.0"
        const versionMatch = meta.content.match(/sitefinity\s+([\d.]+)/i);
        const version = versionMatch ? versionMatch[1] : 'Unknown';
        
        return {
          isSitefinity: true,
          generator: meta.content,
          version: version,
          url: window.location.href
        };
      }
    }
    return {
      isSitefinity: false,
      url: window.location.href
    };
  }

  // Check site and update icon
  const siteInfo = checkSitefinitySite();
  
  // Send message to background to update icon
  chrome.runtime.sendMessage({
    action: 'updateIcon',
    isSitefinity: siteInfo.isSitefinity
  });
  
  // Listen for messages from popup/panel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkSitefinity') {
      sendResponse(siteInfo);
    }
  });

})();