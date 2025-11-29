// DevTools entry point for SitefinityXHR Extension
// This script runs in the DevTools context and creates the panel

// Check if the current page is a Sitefinity site before creating the panel
function checkAndCreatePanel() {
  // Use eval to directly check for Sitefinity meta tag in the inspected page
  const checkCode = `
    (function() {
      const metaTags = document.querySelectorAll('meta[name="Generator"]');
      for (const meta of metaTags) {
        if (meta.content && meta.content.toLowerCase().includes('sitefinity')) {
          return true;
        }
      }
      return false;
    })()
  `;

  chrome.devtools.inspectedWindow.eval(checkCode, function(isSitefinity, isException) {
    if (isException) {
      console.log('Sitefinity Community: Error checking for Sitefinity');
      return;
    }

    if (isSitefinity) {
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
