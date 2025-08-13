// DevTools entry point for SitefinityXHR Extension
// This script runs in the DevTools context and creates the panel

chrome.devtools.panels.create(
  'Sitefinity Community',
  'panel-icon.png', // Optional icon (we'll use a default one)
  'dist/panel.html',
  function(panel) {
    console.log('Sitefinity Community DevTools panel created');
    
    // Panel created successfully
    panel.onShown.addListener(function(panelWindow) {
      // Panel is shown
      console.log('Sitefinity Community panel shown');
    });
    
    panel.onHidden.addListener(function() {
      // Panel is hidden
      console.log('Sitefinity Community panel hidden');
    });
  }
);