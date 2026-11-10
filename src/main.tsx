import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// V APK offline kopii (appassets.androidplatform.net) se service worker neregistruje – soubory servíruje WebViewAssetLoader.
if ("serviceWorker" in navigator && location.hostname !== 'appassets.androidplatform.net') {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
