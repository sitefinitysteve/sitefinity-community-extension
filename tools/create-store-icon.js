#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { createCanvas } from 'canvas'

// Read the SVG content
const svgContent = readFileSync('./icon-blue.svg', 'utf8')

// Create a 128x128 canvas
const canvas = createCanvas(128, 128)
const ctx = canvas.getContext('2d')

// Set up high-quality rendering
ctx.imageSmoothingEnabled = true
ctx.imageSmoothingQuality = 'high'

// Draw background (rounded rectangle)
ctx.fillStyle = '#00d9ff' // Sitefinity blue
ctx.roundRect(0, 0, 128, 128, 16) // Scaled up corner radius
ctx.fill()

// Draw the 'S' text
ctx.fillStyle = '#0f0f23' // Dark text
ctx.font = 'bold 80px monospace' // Scaled up font
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText('S', 64, 64) // Centered

// Export as PNG
const buffer = canvas.toBuffer('image/png')
writeFileSync('./store-icon-128.png', buffer)

console.log('✅ Created store-icon-128.png (128x128)')
console.log('🎯 Ready for Chrome Web Store!')