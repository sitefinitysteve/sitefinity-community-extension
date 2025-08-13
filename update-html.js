import fs from 'fs';
import path from 'path';

// Find the generated CSS file with hash
const distDir = './dist';
const files = fs.readdirSync(distDir);
const cssFile = files.find(file => file.startsWith('panel.') && file.endsWith('.css'));

if (cssFile) {
  // Update panel.html
  const panelHtmlPath = path.join(distDir, 'panel.html');
  let panelHtml = fs.readFileSync(panelHtmlPath, 'utf8');
  panelHtml = panelHtml.replace(/panel\.css/, cssFile);
  fs.writeFileSync(panelHtmlPath, panelHtml);
  
  console.log(`Updated panel.html to reference ${cssFile}`);
} else {
  console.error('Could not find generated CSS file');
}