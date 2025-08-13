// Sitefinity Status Detection Service
// Detects when Sitefinity is in loading/status page state

export class SitefinityStatusService {
  constructor() {
    this.isInStatusMode = false
    this.callbacks = new Set()
    this.lastCheckedTimestamp = null
    this.pollingInterval = null
    this.pendingRequests = new Map() // Store pending requests to retry
  }

  // Check if response contains the Sitefinity status page
  checkResponseForStatusPage(responseText, responseUrl) {
    if (!responseText || typeof responseText !== 'string') {
      return false
    }

    // Look for the status page indicator
    const hasStatusApp = responseText.includes('appStatusApp') || 
                        responseText.includes('ng-app="appStatusApp"') ||
                        responseText.includes("ng-app='appStatusApp'")

    // Additional checks for Sitefinity status page patterns
    const hasStatusPageIndicators = responseText.includes('Sitefinity is starting') ||
                                   responseText.includes('Please wait while the system is loading') ||
                                   responseText.includes('moduleStatusApp') ||
                                   responseText.includes('startup-status')

    const isStatusPage = hasStatusApp || hasStatusPageIndicators

    // Update status if it changed
    if (isStatusPage !== this.isInStatusMode) {
      this.isInStatusMode = isStatusPage
      this.lastCheckedTimestamp = Date.now()
      this.notifyCallbacks(isStatusPage)
      
      // Start polling if entering status mode
      if (isStatusPage) {
        this.startPolling()
      } else {
        this.stopPolling()
        this.retryPendingRequests()
      }
    }

    return isStatusPage
  }

  // Check if current page is a status page by evaluating the page content
  async checkCurrentPageStatus() {
    try {
      // Check if DevTools API is available
      if (!chrome?.devtools?.inspectedWindow?.eval) {
        console.warn('DevTools API not available for page status check')
        return { isStatusPage: false, error: 'DevTools API not available' }
      }

      const result = await new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(`
          (function() {
            try {
              const htmlContent = document.documentElement.outerHTML || document.body.outerHTML || '';
              
              const hasStatusApp = htmlContent.includes('appStatusApp') || 
                                  htmlContent.includes('ng-app="appStatusApp"') ||
                                  htmlContent.includes("ng-app='appStatusApp'");
              
              const hasStatusPageIndicators = htmlContent.includes('Sitefinity is starting') ||
                                            htmlContent.includes('Please wait while the system is loading') ||
                                            htmlContent.includes('moduleStatusApp') ||
                                            htmlContent.includes('startup-status');
              
              return {
                isStatusPage: hasStatusApp || hasStatusPageIndicators,
                url: window.location.href,
                title: document.title || ''
              };
            } catch (e) {
              return { isStatusPage: false, error: e.message };
            }
          })()
        `, (result, isException) => {
          if (isException) {
            reject(new Error(isException.value || 'Evaluation failed'))
          } else {
            resolve(result)
          }
        });
      });

      if (result && typeof result.isStatusPage === 'boolean') {
        if (result.isStatusPage !== this.isInStatusMode) {
          this.isInStatusMode = result.isStatusPage
          this.lastCheckedTimestamp = Date.now()
          this.notifyCallbacks(result.isStatusPage)
        }
      }

      return result
    } catch (error) {
      console.error('Error checking current page status:', error)
      return { isStatusPage: false, error: error.message }
    }
  }

  // Subscribe to status changes
  onStatusChange(callback) {
    this.callbacks.add(callback)
    
    // Immediately call with current status
    callback(this.isInStatusMode)
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  // Notify all callbacks of status change
  notifyCallbacks(isInStatusMode) {
    this.callbacks.forEach(callback => {
      try {
        callback(isInStatusMode)
      } catch (error) {
        console.error('Error in status change callback:', error)
      }
    })
  }

  // Get current status
  getCurrentStatus() {
    return {
      isInStatusMode: this.isInStatusMode,
      lastChecked: this.lastCheckedTimestamp
    }
  }

  // Clear status (for testing or manual reset)
  clearStatus() {
    if (this.isInStatusMode) {
      this.isInStatusMode = false
      this.lastCheckedTimestamp = Date.now()
      this.notifyCallbacks(false)
    }
  }

  // Start periodic checking (optional, for proactive monitoring)
  startPeriodicCheck(intervalMs = 5000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(async () => {
      await this.checkCurrentPageStatus()
    }, intervalMs)
  }

  // Stop periodic checking
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // Start polling /api/default/sfhelp to check when Sitefinity is ready
  startPolling(intervalMs = 3000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    console.log('Starting Sitefinity readiness polling...')
    
    this.pollingInterval = setInterval(async () => {
      try {
        await this.checkSitefinityReadiness()
      } catch (error) {
        console.error('Error during readiness polling:', error)
      }
    }, intervalMs)
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      console.log('Stopping Sitefinity readiness polling')
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  // Check if Sitefinity is ready by testing /api/default/sfhelp
  async checkSitefinityReadiness() {
    try {
      if (!chrome?.devtools?.inspectedWindow?.eval) {
        return false
      }

      const result = await new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(`
          (function() {
            const testUrl = window.location.origin + '/api/default/sfhelp';
            
            fetch(testUrl, {
              method: 'GET',
              headers: {
                'X-Requested-With': 'Browser',
                'Content-Type': 'application/json'
              }
            })
            .then(response => response.text())
            .then(responseText => {
              const isStatusPage = responseText && (
                responseText.includes('appStatusApp') || 
                responseText.includes('ng-app="appStatusApp"') ||
                responseText.includes("ng-app='appStatusApp'") ||
                (responseText.includes('<html') && responseText.includes('ng-app'))
              );
              
              window.__sitefinityReadinessResult = {
                ready: !isStatusPage,
                response: responseText.substring(0, 200) // First 200 chars for debugging
              };
            })
            .catch(error => {
              window.__sitefinityReadinessResult = {
                ready: false,
                error: error.message
              };
            });
            
            return 'READINESS_CHECK_INITIATED';
          })()
        `, (evalResult, isException) => {
          if (isException) {
            reject(new Error(isException.value || 'Readiness check failed'))
          } else {
            // Poll for result
            setTimeout(() => {
              chrome.devtools.inspectedWindow.eval('window.__sitefinityReadinessResult', (readinessResult, readinessException) => {
                if (readinessException) {
                  reject(new Error('Failed to get readiness result'))
                } else if (readinessResult) {
                  chrome.devtools.inspectedWindow.eval('delete window.__sitefinityReadinessResult')
                  resolve(readinessResult)
                } else {
                  resolve({ ready: false, error: 'No result' })
                }
              })
            }, 1000)
          }
        })
      })

      if (result && result.ready) {
        console.log('Sitefinity is ready! Stopping polling and clearing status.')
        this.isInStatusMode = false
        this.lastCheckedTimestamp = Date.now()
        this.notifyCallbacks(false)
        this.stopPolling()
        this.retryPendingRequests()
        return true
      } else {
        console.log('Sitefinity still loading, continuing to poll...')
        return false
      }
    } catch (error) {
      console.error('Error checking Sitefinity readiness:', error)
      return false
    }
  }

  // Add a request to be retried when Sitefinity is ready
  addPendingRequest(requestId, requestParams, retryCallback) {
    this.pendingRequests.set(requestId, {
      params: requestParams,
      callback: retryCallback,
      timestamp: Date.now()
    })
    console.log('Added pending request:', requestId)
  }

  // Remove a pending request
  removePendingRequest(requestId) {
    this.pendingRequests.delete(requestId)
  }

  // Retry all pending requests when Sitefinity is ready
  retryPendingRequests() {
    if (this.pendingRequests.size === 0) {
      return
    }

    console.log(`Retrying ${this.pendingRequests.size} pending requests...`)
    
    for (const [requestId, request] of this.pendingRequests.entries()) {
      try {
        console.log('Retrying request:', requestId)
        request.callback(request.params)
      } catch (error) {
        console.error('Error retrying request:', requestId, error)
      }
    }
    
    this.pendingRequests.clear()
  }
}

// Create singleton instance
export const sitefinityStatusService = new SitefinityStatusService()