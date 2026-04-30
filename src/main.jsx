import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA / offline support + Web Share Target
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('[SW] Registration failed:', err))
  })

  // Listen for shared images forwarded by the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SHARE_TARGET_IMAGE') {
      const { fileName, mimeType, buffer } = event.data;
      const file = new File([buffer], fileName, { type: mimeType });
      // Dispatch a custom event so App can receive the file and open the dialog
      window.dispatchEvent(new CustomEvent('share-target-image', { detail: { file } }));
    }
  });
}
