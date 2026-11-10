const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9224;
const USER_DATA_DIR = '/tmp/chrome-login-test-' + Date.now();

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
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:5173/login at 1280x900 resolution...');
  await sendPage('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(2500);

  const auditResult = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const svgs = Array.from(document.querySelectorAll('svg linearGradient#brandShieldGrad'));
        const footer = document.querySelector('footer');
        const loginCard = document.querySelector('div.bg-white.rounded-2xl');
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        const windowHeight = window.innerHeight;

        return {
          brandLogoCount: svgs.length, // Should have Navbar, Login card, and Footer!
          hasFooter: Boolean(footer),
          windowHeight,
          footerTop: footerRect ? footerRect.top : null,
          footerBottom: footerRect ? footerRect.bottom : null,
          isFooterAtOrBelowBottom: footerRect ? (footerRect.bottom >= windowHeight) : false,
          loginCardCentered: loginCard ? (loginCard.getBoundingClientRect().top > 50) : false
        };
      })()
    `,
    returnByValue: true
  });

  console.log('=== LOGIN PAGE & FOOTER AUDIT RESULT ===');
  console.log(auditResult.result.value);

  // Capture screenshot of viewport
  const screenshotRes = await sendPage('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');
  const screenshotPath = path.resolve('docs/screenshots/clean_login_footer_verified.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log(`Saved screenshot to ${screenshotPath} (${buffer.length} bytes)`);

  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
