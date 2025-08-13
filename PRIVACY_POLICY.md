# Privacy Policy for Sitefinity Community Extension

**Effective Date:** August 13, 2025  
**Last Updated:** August 13, 2025

## Overview

The Sitefinity Community Extension ("the Extension") is an unofficial developer tool designed to assist with Sitefinity CMS development. This privacy policy explains how the Extension handles data and protects user privacy.

## Data Collection and Usage

### What We Do NOT Collect

- **Personal Information**: We do not collect, store, or transmit any personal information
- **Browsing History**: We do not track or store your browsing history
- **Website Content**: We do not collect or store content from websites you visit
- **Authentication Data**: We do not collect or store login credentials or authentication tokens
- **Analytics Data**: We do not use any analytics services or tracking mechanisms
- **User Behavior**: We do not monitor or record user interactions beyond local functionality

### What We Do Collect (Locally Only)

The Extension stores the following data **locally on your device only**:

1. **API Request History**: 
   - API endpoints you have tested
   - HTTP methods used (GET, POST, PUT, DELETE)
   - Request parameters you have entered
   - Response status codes
   - **Purpose**: To allow you to easily reuse previous API calls during development
   - **Retention**: Last 10 unique requests, stored locally in your browser
   - **Access**: Only accessible by you through the Extension interface

2. **Site Detection Cache**:
   - Sitefinity version information detected from current page
   - **Purpose**: To display appropriate tools for the detected Sitefinity version
   - **Retention**: Session-based, cleared when browser is closed
   - **Access**: Only used for Extension functionality display

## Data Storage and Security

### Local Storage Only
- All data is stored locally in your browser using Chrome's built-in storage APIs
- No data is transmitted to external servers or third parties
- No data leaves your local machine
- Data is automatically removed when you uninstall the Extension

### No External Communications
- The Extension does not communicate with any external services
- No data analytics or telemetry services are used
- No crash reporting or error tracking to external services
- API requests are made directly from your browser to your Sitefinity installations only

## Permissions Explanation

The Extension requests the following permissions for legitimate functionality:

### activeTab Permission
- **Purpose**: To detect Sitefinity installations on the current website
- **Usage**: Only reads page meta tags when DevTools panel is opened
- **Data Access**: Limited to Sitefinity version detection information

### storage Permission
- **Purpose**: To save API request history locally for your convenience
- **Usage**: Stores only API testing data you explicitly create
- **Location**: Local browser storage only

### scripting Permission
- **Purpose**: To inject content scripts for Sitefinity site detection
- **Usage**: Reads meta tags to identify Sitefinity CMS installations
- **Scope**: Detection-only, no content modification

### Host Permissions (<all_urls>)
- **Purpose**: To enable API testing across all your Sitefinity environments
- **Usage**: Makes API requests only to endpoints you explicitly test
- **Control**: You initiate all API requests through the Extension interface

## Third-Party Services

**None.** This Extension does not integrate with, connect to, or share data with any third-party services, APIs, or platforms beyond your direct Sitefinity installations.

## Data Retention

- **API Request History**: Maximum of 10 most recent unique requests
- **Site Detection Data**: Cleared on browser session end
- **All Data**: Permanently deleted when Extension is uninstalled

## User Control

You have complete control over your data:

- **Clear History**: Use the "Clear All" button in the Extension to remove stored API history
- **Disable Extension**: Disable or remove the Extension at any time to stop all data collection
- **View Data**: All stored data is visible within the Extension interface
- **No Account Required**: No registration or account creation required

## Children's Privacy

This Extension is designed for software developers and is not intended for use by children under 13. We do not knowingly collect data from children under 13.

## Changes to Privacy Policy

We may update this privacy policy to reflect changes in the Extension's functionality. Users will be notified of significant changes through:
- Updates to this GitHub document
- Extension update notes in the Chrome Web Store

## Open Source Transparency

This Extension is open source. You can review the complete source code at:
[https://github.com/SitefinitySteve/sitefinity-community-extension](https://github.com/SitefinitySteve/sitefinity-community-extension)

## Contact Information

**Developer**: SitefinitySteve  
**Website**: [https://www.sitefinitysteve.com](https://www.sitefinitysteve.com)  
**GitHub Issues**: [https://github.com/SitefinitySteve/sitefinity-community-extension/issues](https://github.com/SitefinitySteve/sitefinity-community-extension/issues)

For privacy-related questions or concerns, please create an issue in the GitHub repository.

## Legal

This Extension is:
- **Unofficial**: Not affiliated with Progress Software Corporation or Sitefinity
- **Community-Driven**: Developed by and for the Sitefinity developer community
- **Open Source**: Available for review and contribution
- **Privacy-Focused**: Designed with privacy by design principles

---

**Summary**: The Sitefinity Community Extension stores minimal data locally on your device for functionality purposes only. We do not collect, transmit, or share any personal information or browsing data. All data remains under your complete control and is stored locally in your browser.