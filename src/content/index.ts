import styles from './dist.css?inline'
// Initialize webext-bridge for Content Script context (for future stories)
import 'webext-bridge/content-script'

console.log('Zhiyue Content Script Loaded');

const host = document.createElement('div');
host.id = 'zhiyue-extension-host';
// Set extensive z-index to ensure visibility
host.style.zIndex = '2147483647';
host.style.position = 'fixed';
host.style.top = '10px';
host.style.right = '10px';

// Shadow DOM
const shadow = host.attachShadow({ mode: 'open' });
const style = document.createElement('style');
style.textContent = styles;
shadow.appendChild(style);

const app = document.createElement('div');
// Use zy- prefix as configured
app.className = 'zy-bg-blue-600 zy-p-4 zy-text-white zy-rounded-lg zy-shadow-xl zy-font-bold';
app.textContent = 'Zhiyue Active (IPC Ready)';
shadow.appendChild(app);

document.body.appendChild(host);
