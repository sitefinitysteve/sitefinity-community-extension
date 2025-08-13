import { spawn } from 'child_process';
import { watch } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Starting development mode...');

// Function to copy files and update HTML
function copyFiles() {
  try {
    execSync('npm run copy-files', { stdio: 'pipe' });
    console.log('📁 Files copied successfully');
  } catch (error) {
    console.error('❌ Error copying files:', error.message);
  }
}

// Initial build and copy
console.log('📦 Initial build...');
try {
  execSync('vite build', { stdio: 'inherit' });
  copyFiles();
} catch (error) {
  console.error('❌ Initial build failed:', error.message);
  process.exit(1);
}

// Start Vite in watch mode
console.log('📦 Starting Vite build watcher...');
const viteProcess = spawn('npx', ['vite', 'build', '--watch'], {
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true
});

// Monitor Vite output and copy files after each build
viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Copy files after successful build
  if (output.includes('built in')) {
    setTimeout(copyFiles, 100); // Small delay to ensure build is complete
  }
});

// Watch for changes to HTML files and manifest
const filesToWatch = ['manifest.json', 'panel.html', 'devtools.html'];

filesToWatch.forEach(file => {
  watch(file, (eventType) => {
    if (eventType === 'change') {
      console.log(`📝 ${file} changed, copying files...`);
      copyFiles();
    }
  });
});

console.log('👀 Watching for changes to:', filesToWatch.join(', '));

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  viteProcess.kill();
  process.exit(0);
});

viteProcess.on('close', (code) => {
  console.log(`📦 Vite process exited with code ${code}`);
  process.exit(code);
});