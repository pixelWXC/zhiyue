import styles from './dist.css?inline'
// Initialize webext-bridge for Content Script context (for future stories)
import 'webext-bridge/content-script'

console.log('Zhiyue Content Script Loaded');

const host = document.createElement('div');
host.id = 'zhiyue-extension-host';
// Set extensive z-index to ensure visibility
host.style.zIndex = '2147483647';
host.style.position = 'fixed';
host.style.top = '0';
host.style.left = '0';
host.style.width = '100%';
host.style.height = '100%';
host.style.pointerEvents = 'none'; // Allow clicks to pass through to the page

import { createApp } from 'vue';
import ContentOverlay from './ui/ContentOverlay.vue';

// Shadow DOM
const shadow = host.attachShadow({ mode: 'open' });
const style = document.createElement('style');
style.textContent = styles;
shadow.appendChild(style);

const appContainer = document.createElement('div');
appContainer.id = 'zhiyue-app';
shadow.appendChild(appContainer);

// Mount Vue App
const app = createApp(ContentOverlay);
app.mount(appContainer);

document.body.appendChild(host);
