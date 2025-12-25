import styles from './dist.css?inline'

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
app.textContent = 'Zhiyue Active';
shadow.appendChild(app);

document.body.appendChild(host);
