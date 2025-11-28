// XHR Monitor Service
// Monitors network XHR/Fetch requests using chrome.devtools.network API

export class XhrMonitorService {
  constructor() {
    this.isMonitoring = false
    this.callbacks = new Set()
    this.listener = null
  }

  // Start monitoring XHR requests
  start() {
    if (this.isMonitoring) {
      return
    }

    if (!chrome?.devtools?.network?.onRequestFinished) {
      console.warn('chrome.devtools.network API not available')
      return
    }

    this.listener = (request) => {
      this.handleRequest(request)
    }

    chrome.devtools.network.onRequestFinished.addListener(this.listener)
    this.isMonitoring = true
    console.log('XHR Monitor: Started monitoring')
  }

  // Stop monitoring XHR requests
  stop() {
    if (!this.isMonitoring || !this.listener) {
      return
    }

    if (chrome?.devtools?.network?.onRequestFinished) {
      chrome.devtools.network.onRequestFinished.removeListener(this.listener)
    }

    this.listener = null
    this.isMonitoring = false
    console.log('XHR Monitor: Stopped monitoring')
  }

  // Handle incoming request
  handleRequest(harEntry) {
    // Filter for XHR/Fetch requests only
    const resourceType = harEntry._resourceType
    if (resourceType !== 'xhr' && resourceType !== 'fetch') {
      return
    }

    // Extract request info
    const requestInfo = {
      url: harEntry.request.url,
      method: harEntry.request.method,
      status: harEntry.response.status,
      statusText: harEntry.response.statusText,
      timestamp: new Date().toISOString(),
      mimeType: harEntry.response.content?.mimeType || '',
      size: harEntry.response.content?.size || 0
    }

    // Extract headers (convert from array of {name, value} to object)
    const requestHeaders = {}
    if (harEntry.request.headers) {
      harEntry.request.headers.forEach(h => {
        requestHeaders[h.name] = h.value
      })
    }

    const responseHeaders = {}
    if (harEntry.response.headers) {
      harEntry.response.headers.forEach(h => {
        responseHeaders[h.name] = h.value
      })
    }

    // Extract request payload/body
    let requestPayload = null
    if (harEntry.request.postData) {
      requestPayload = harEntry.request.postData.text || null
      // Try to parse as JSON
      if (requestPayload) {
        try {
          requestPayload = JSON.parse(requestPayload)
        } catch (e) {
          // Keep as string
        }
      }
    }

    // Get the response content asynchronously
    harEntry.getContent((content, encoding) => {
      let data = content

      // Try to parse as JSON
      if (content && requestInfo.mimeType.includes('application/json')) {
        try {
          data = JSON.parse(content)
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      // Build the captured request object
      const capturedRequest = {
        route: this.extractRoute(requestInfo.url),
        method: requestInfo.method,
        url: requestInfo.url,
        timestamp: requestInfo.timestamp,
        status: requestInfo.status,
        statusText: requestInfo.statusText,
        success: requestInfo.status >= 200 && requestInfo.status < 400,
        captured: true,
        responseData: {
          success: requestInfo.status >= 200 && requestInfo.status < 400,
          status: requestInfo.status,
          statusText: requestInfo.statusText,
          data: data,
          url: requestInfo.url,
          method: requestInfo.method,
          requestHeaders: requestHeaders,
          responseHeaders: responseHeaders,
          requestPayload: requestPayload
        }
      }

      // Notify all callbacks
      this.notifyCallbacks(capturedRequest)
    })
  }

  // Extract route from full URL
  extractRoute(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    } catch (e) {
      return url
    }
  }

  // Subscribe to captured requests
  onRequest(callback) {
    this.callbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  // Notify all callbacks of new request
  notifyCallbacks(request) {
    this.callbacks.forEach(callback => {
      try {
        callback(request)
      } catch (error) {
        console.error('Error in XHR monitor callback:', error)
      }
    })
  }

  // Get current monitoring status
  getStatus() {
    return this.isMonitoring
  }

  // Toggle monitoring on/off
  toggle() {
    if (this.isMonitoring) {
      this.stop()
    } else {
      this.start()
    }
    return this.isMonitoring
  }
}

// Create singleton instance
export const xhrMonitorService = new XhrMonitorService()
