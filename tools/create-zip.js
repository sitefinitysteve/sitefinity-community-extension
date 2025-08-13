#!/usr/bin/env node

import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, relative } from 'path'
import { createRequire } from 'module'

// Create a require function to use CommonJS modules
const require = createRequire(import.meta.url)
const archiver = require('archiver')

const DIST_DIR = './dist'
const PUBLISH_DIR = './publish'
const OUTPUT_FILE = './publish/sitefinity-community-extension.zip'

async function createZip() {
  console.log('🚀 Creating Chrome Web Store package...')
  
  // Check if dist directory exists
  if (!existsSync(DIST_DIR)) {
    console.error('❌ Error: dist/ directory not found. Run "npm run build" first.')
    process.exit(1)
  }

  // Create publish directory if it doesn't exist
  if (!existsSync(PUBLISH_DIR)) {
    mkdirSync(PUBLISH_DIR, { recursive: true })
    console.log(`📁 Created ${PUBLISH_DIR}/ directory`)
  }

  // Create output stream
  const output = createWriteStream(OUTPUT_FILE)
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
  })

  // Listen for archive events
  output.on('close', () => {
    const sizeKB = Math.round(archive.pointer() / 1024)
    console.log(`✅ Package created: ${OUTPUT_FILE}`)
    console.log(`📦 Size: ${sizeKB} KB`)
    console.log(`🎯 Ready for Chrome Web Store upload!`)
    console.log('')
    console.log('Next steps:')
    console.log('1. Go to https://chrome.google.com/webstore/devconsole')
    console.log('2. Click "Add new item"')
    console.log(`3. Upload ${OUTPUT_FILE.replace('./', '')}`)
  })

  output.on('error', (err) => {
    console.error('❌ Error creating zip file:', err)
    process.exit(1)
  })

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('⚠️  Warning:', err)
    } else {
      console.error('❌ Archive error:', err)
      process.exit(1)
    }
  })

  archive.on('error', (err) => {
    console.error('❌ Archive error:', err)
    process.exit(1)
  })

  // Pipe archive data to the file
  archive.pipe(output)

  // Add files from dist directory
  await addDirectoryToArchive(archive, DIST_DIR, '')

  // Finalize the archive
  await archive.finalize()
}

async function addDirectoryToArchive(archive, dirPath, archivePath) {
  const items = await readdir(dirPath)
  
  for (const item of items) {
    const fullPath = join(dirPath, item)
    const archiveItemPath = archivePath ? join(archivePath, item) : item
    const stats = await stat(fullPath)
    
    if (stats.isDirectory()) {
      await addDirectoryToArchive(archive, fullPath, archiveItemPath)
    } else {
      console.log(`📄 Adding: ${archiveItemPath}`)
      archive.file(fullPath, { name: archiveItemPath })
    }
  }
}

// Run the script
createZip().catch(error => {
  console.error('❌ Failed to create zip:', error)
  process.exit(1)
})