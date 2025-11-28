// DevTools entry point for SitefinityXHR Extension
// This script runs in the DevTools context and creates the panel

// Check if the current page is a Sitefinity site before creating the panel
function checkAndCreatePanel() {
  // Get the tab ID of the inspected window
  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Send message to content script to check if it's a Sitefinity site
  chrome.tabs.sendMessage(tabId, { action: 'checkSitefinity' }, function(response) {
    if (chrome.runtime.lastError) {
      // Content script might not be loaded yet, retry after a delay
      console.log('Sitefinity Community: Waiting for content script...');
      setTimeout(checkAndCreatePanel, 500);
      return;
    }

    if (response && response.isSitefinity) {
      createPanel();
    } else {
      console.log('Sitefinity Community: Not a Sitefinity site, panel not created');
    }
  });
}

function createPanel() {
  chrome.devtools.panels.create(
    'Sitefinity Community',
    'panel-icon.png',
    'dist/panel.html',
    function(panel) {
      console.log('Sitefinity Community DevTools panel created');

      panel.onShown.addListener(function(panelWindow) {
        console.log('Sitefinity Community panel shown');
      });

      panel.onHidden.addListener(function() {
        console.log('Sitefinity Community panel hidden');
      });
    }
  );
}

// Run the check after a short delay to ensure content script is loaded
setTimeout(checkAndCreatePanel, 100);
