const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9226;
const USER_DATA_DIR = '/tmp/chrome-login-spacing-test-' + Date.now();

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

  // Test at 1280x850 (typical laptop display with browser chrome)
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:5173/login at 1280x850...');
  await sendPage('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(2500);

  const measurement = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const card = document.querySelector('div.bg-white.rounded-2xl');
        const footer = document.querySelector('footer');
        const cardRect = card ? card.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;

        // Gap between bottom of card and top of footer
        const gap = (footerRect && cardRect) ? (footerRect.top - cardRect.bottom) : null;
        const isOverlapping = gap !== null && gap < 0;

        return {
          cardTop: cardRect ? cardRect.top : null,
          cardBottom: cardRect ? cardRect.bottom : null,
          cardHeight: cardRect ? cardRect.height : null,
          footerTop: footerRect ? footerRect.top : null,
          gapBetweenCardAndFooter: gap,
          isOverlapping,
          hasSufficientBreathingRoom: gap !== null && gap >= 50
        };
      })()
    `,
    returnByValue: true
  });

  console.log('=== CARD & FOOTER POSITION AUDIT (1280x850) ===');
  console.log(measurement.result.value);

  // Capture Screenshot
  const screenshotRes = await sendPage('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');
  const screenshotPath = path.resolve('docs/screenshots/login_footer_pushed_down.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log(`Saved screenshot to ${screenshotPath} (${buffer.length} bytes)`);

  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
