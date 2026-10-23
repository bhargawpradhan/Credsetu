import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

// Inject Inter, Satoshi, and DM Sans fonts on Web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Google Fonts (Inter & DM Sans)
  const googleFontsLink = document.createElement('link');
  googleFontsLink.rel = 'stylesheet';
  googleFontsLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=Inter:wght@300;400;500;600;700;800;900&display=swap';
  document.head.appendChild(googleFontsLink);

  // Fontshare Satoshi
  const satoshiLink = document.createElement('link');
  satoshiLink.rel = 'stylesheet';
  satoshiLink.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap';
  document.head.appendChild(satoshiLink);

  // Global typography style
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    * {
      font-family: Satoshi, 'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
  document.head.appendChild(styleEl);
}

registerRootComponent(App);
