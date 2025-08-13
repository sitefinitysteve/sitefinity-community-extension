#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createCanvas, loadImage } from 'canvas'
import { join } from 'path'

const ASSETS_DIR = './assets'
const OUTPUT_DIR = './assets/store-screenshots'

// Chrome Web Store screenshot requirements
const TARGET_WIDTH = 1280
const TARGET_HEIGHT = 800

async function resizeScreenshots() {
  console.log('📸 Resizing screenshots for Chrome Web Store...')
  
  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created ${OUTPUT_DIR}/ directory`)
  }

  const imageFiles = [
    'api-discovery.png',
    'api-tester-servicestack.png', 
    'api-tester.png'
  ]

  for (const filename of imageFiles) {
    const inputPath = join(ASSETS_DIR, filename)
    const outputPath = join(OUTPUT_DIR, filename)
    
    if (!existsSync(inputPath)) {
      console.warn(`⚠️  File not found: ${inputPath}`)
      continue
    }

    try {
      console.log(`🔄 Processing ${filename}...`)
      
      // Load the original image
      const originalImage = await loadImage(inputPath)
      
      // Create canvas with target dimensions
      const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT)
      const ctx = canvas.getContext('2d')
      
      // Fill background with dark color (matching extension theme)
      ctx.fillStyle = '#262626' // vue-dark color
      ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)
      
      // Calculate scaling to fit image while maintaining aspect ratio
      const scale = Math.min(
        TARGET_WIDTH / originalImage.width,
        TARGET_HEIGHT / originalImage.height
      )
      
      const scaledWidth = originalImage.width * scale
      const scaledHeight = originalImage.height * scale
      
      // Center the image
      const x = (TARGET_WIDTH - scaledWidth) / 2
      const y = (TARGET_HEIGHT - scaledHeight) / 2
      
      // Enable high-quality scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw the scaled image
      ctx.drawImage(originalImage, x, y, scaledWidth, scaledHeight)
      
      // Save the resized image
      const buffer = canvas.toBuffer('image/png')
      writeFileSync(outputPath, buffer)
      
      console.log(`✅ Created ${outputPath} (${TARGET_WIDTH}x${TARGET_HEIGHT})`)
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message)
    }
  }
  
  console.log('')
  console.log('🎯 Screenshots ready for Chrome Web Store!')
  console.log(`📁 Files saved to: ${OUTPUT_DIR}/`)
  console.log('')
  console.log('Chrome Web Store requirements:')
  console.log('• Size: 1280x800 pixels ✅')
  console.log('• Format: PNG ✅') 
  console.log('• Max file size: 2MB per image ✅')
}

// Run the script
resizeScreenshots().catch(error => {
  console.error('❌ Failed to resize screenshots:', error)
  process.exit(1)
})