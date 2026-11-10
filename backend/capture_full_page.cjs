const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9223;
const USER_DATA_DIR = '/tmp/chrome-fullpage-' + Date.now();

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
  const { targetId } = await send(browserWs, 'Target.createTarget', { url: 'http://localhost:5173/' });
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

  // Set officer session
  await sendPage('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(1000);

  await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const officerUser = {
          id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u02',
          full_name: 'Rajesh Verma',
          email: 'officer.pwd@jansahayak.gov.in',
          role: 'officer',
          roles: ['officer'],
          department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          designation: 'Assistant Municipal Engineer',
          is_active: true
        };
        localStorage.setItem('jansahayak_user', JSON.stringify(officerUser));
        localStorage.setItem('jansahayak_role', 'officer');
        localStorage.setItem('jansahayak_token', 'mock-token:officer:u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u02:1762772000000');
      })()
    `
  });

  await sendPage('Page.navigate', { url: 'http://localhost:5173/complaints/d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01' });
  await sleep(2500);

  // Scroll into view of the stepper
  await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const stepper = document.querySelector('h3');
        const allH3 = Array.from(document.querySelectorAll('h3'));
        const stepperH3 = allH3.find(h => h.textContent.includes('Resolution Lifecycle'));
        if (stepperH3) {
          stepperH3.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      })()
    `
  });
  await sleep(1000);

  // Capture Screenshot of the Stepper
  const screenshotRes = await sendPage('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false
  });

  const buffer = Buffer.from(screenshotRes.data, 'base64');
  const screenshotPath = path.resolve('docs/screenshots/stepper_scroll_view.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log(`Saved screenshot of Stepper view to ${screenshotPath}`);

  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
