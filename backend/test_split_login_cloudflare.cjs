const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9227;
const USER_DATA_DIR = '/tmp/chrome-split-login-' + Date.now();

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function getDebuggerUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).webSocketDebuggerUrl));
    }).on('error', reject);
  });
}

async function run() {
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      wsUrl = await getDebuggerUrl();
      if (wsUrl) break;
    } catch {
      await sleep(300);
    }
  }

  const browserWs = new WebSocket(wsUrl);
  let msgId = 1;
  const callbacks = new Map();
  function send(ws, method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  browserWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const { resolve, reject } = callbacks.get(data.id);
      callbacks.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(resolve => browserWs.onopen = resolve);
  const { targetId } = await send(browserWs, 'Target.createTarget', { url: 'http://localhost:5173/login' });
  const { sessionId } = await send(browserWs, 'Target.attachToTarget', { targetId, flatten: true });

  function sendPage(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, { resolve, reject });
      browserWs.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 880,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('1. Navigating to http://localhost:5173/login...');
  await sendPage('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(2500);

  // Inspect page structure
  const pageInspection = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const bodyText = document.body.innerText;
        const hasTurnstile = bodyText.includes('CLOUDFLARE') && bodyText.includes('Success!');
        const hasGoogleBtn = bodyText.includes('Continue with Google / Gmail');
        const slideHeading = document.querySelector('h2')?.textContent;
        const formHeading = document.querySelector('h1')?.textContent;
        const dotCount = document.querySelectorAll('button[aria-label*="Go to slide"]').length;
        const footer = document.querySelector('footer');
        const card = document.querySelector('div.max-w-5xl');
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        const cardRect = card ? card.getBoundingClientRect() : null;
        const gap = (footerRect && cardRect) ? (footerRect.top - cardRect.bottom) : null;

        return {
          hasTurnstile,
          hasGoogleBtn,
          slideHeading,
          formHeading,
          dotCount,
          gapToFooter: gap,
          isFooterOverlapping: gap !== null && gap < 0
        };
      })()
    `,
    returnByValue: true
  });

  console.log('\n=== INITIAL SPLIT-SCREEN & CLOUDFLARE AUDIT ===');
  console.log(pageInspection.result.value);

  // Capture Screenshot of Slide 1
  const screenshot1Res = await sendPage('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve('docs/screenshots/split_login_slide1_cloudflare.png'), Buffer.from(screenshot1Res.data, 'base64'));
  console.log('Saved screenshot of Slide 1 with Cloudflare Turnstile.');

  // Wait 3.5 seconds to verify auto-advance of the 3-second carousel
  console.log('\n2. Waiting 3.5 seconds to observe automated carousel advance...');
  await sleep(3500);

  const slide2Inspection = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        return {
          slideHeading: document.querySelector('h2')?.textContent,
          badge: document.querySelector('div[class*="bg-gov-teal-900"]')?.textContent.trim()
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Carousel After 3s advance:', slide2Inspection.result.value);

  const screenshot2Res = await sendPage('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve('docs/screenshots/split_login_slide2_advanced.png'), Buffer.from(screenshot2Res.data, 'base64'));
  console.log('Saved screenshot of Slide 2 advance.');

  // Test 1-Click Fast Google Sign In
  console.log('\n3. Testing 1-Click Fast Google / Gmail authentication...');
  const googleClickRes = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button'));
        const googleBtn = btns.find(b => b.textContent.includes('Continue with Google'));
        if (googleBtn) {
          googleBtn.click();
          return { clicked: true };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Google Sign In click:', googleClickRes.result.value);

  // Wait for Google Auth completion and redirection to citizen dashboard
  await sleep(3000);

  const postGoogleState = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        return {
          currentUrl: window.location.href,
          heading: document.querySelector('h1')?.textContent || document.querySelector('h2')?.textContent,
          isDashboard: window.location.href.includes('/dashboard'),
          tokenInStorage: Boolean(localStorage.getItem('jansahayak_token'))
        };
      })()
    `,
    returnByValue: true
  });
  console.log('\n=== GOOGLE AUTHENTICATION REDIRECT RESULT ===');
  console.log(postGoogleState.result.value);

  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
