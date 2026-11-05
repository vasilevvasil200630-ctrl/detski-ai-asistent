import fs from 'fs';
import path from 'path';

const distDir = 'C:/Users/USER/.gemini/antigravity/scratch/detski-ai-asistent/dist';
const assetsDir = path.join(distDir, 'assets');
const files = fs.readdirSync(assetsDir);

const cssFile = files.find((f) => f.endsWith('.css'));
const jsFile = files.find((f) => f.endsWith('.js'));

const css = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const js = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`);
html = html.replace(/<script type="module"[^>]*><\/script>/, () => `<script type="module">${js}</script>`);

const outPath = 'C:/Users/USER/.gemini/antigravity/scratch/detski-ai-asistent/standalone-presentation.html';
fs.writeFileSync(outPath, html, 'utf8');
console.log('Standalone file created at:', outPath);
