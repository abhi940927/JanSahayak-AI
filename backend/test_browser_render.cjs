const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;
const USER_DATA_DIR = '/tmp/chrome-test-browser-session-' + Date.now();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDebuggerUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  // Launch Chrome
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

  if (!wsUrl) {
    console.error('Failed to get WebSocketDebuggerUrl');
    chromeProcess.kill();
    process.exit(1);
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

  const errors = [];
  browserWs.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map(a => a.value || a.description).join(' ');
      if (data.params.type === 'error') {
        errors.push(`[Console Error] ${text}`);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      errors.push(`[Uncaught Exception] ${JSON.stringify(data.params.exceptionDetails)}`);
    }
  });

  console.log('1. Navigating to http://localhost:5173/ with authenticated citizen profile...');
  // Initialize localStorage with authentic citizen profile "Avi"
  await sendPage('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(1500);

  const initSessionResult = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const citizenUser = {
          id: 'mock-user-avi-2026',
          full_name: 'Avi',
          email: 'abhisingh329624@gmail.com',
          phone_number: '9576202571',
          dob: '2006-06-23',
          avatar_url: null,
          role: 'citizen',
          roles: ['citizen'],
          department_id: null,
          designation: 'Citizen / Resident',
          is_active: true
        };
        localStorage.setItem('jansahayak_user', JSON.stringify(citizenUser));
        localStorage.setItem('jansahayak_role', 'citizen');
        localStorage.setItem('jansahayak_token', 'mock-token:citizen:mock-user-avi-2026:1762772000000');
        return { success: true };
      })()
    `,
    returnByValue: true
  });
  console.log('Local storage session setup:', initSessionResult.result.value);

  // Navigate to Citizen Dashboard
  await sendPage('Page.navigate', { url: 'http://localhost:5173/citizen/dashboard' });
  await sleep(2500);

  // Check state of Citizen Dashboard
  const dashboardState = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const bodyText = document.body.innerText;
        return {
          url: window.location.href,
          title: document.title,
          heading: document.querySelector('h1')?.textContent || document.querySelector('h2')?.textContent,
          welcomeText: bodyText.includes('Welcome back, Avi'),
          hasVerifiedCitizenBadge: bodyText.includes('Verified Citizen'),
          hasMyGrievancesTab: bodyText.includes('My Grievances'),
          hasRoleDropdown: Boolean(document.querySelector('select')),
          hasActiveRoleBadge: bodyText.includes('citizen'),
          hasWhiteScreen: bodyText.trim().length === 0,
          bodySample: bodyText.slice(0, 300)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('=== CITIZEN DASHBOARD AUDIT RESULTS ===');
  console.log(dashboardState.result.value);

  // Capture screenshot
  const screenshotRes = await sendPage('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');
  const screenshotPath = path.resolve('docs/screenshots/clean_citizen_dashboard_verified.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log(`Saved screenshot to ${screenshotPath} (${buffer.length} bytes)`);

  console.log('\n=== BROWSER CONSOLE ERRORS ===');
  if (errors.length === 0) {
    console.log('ZERO console errors or uncaught exceptions detected!');
  } else {
    errors.forEach(e => console.error(e));
  }

  // Also test File Complaint page
  console.log('\n2. Testing /citizen/file-complaint page...');
  await sendPage('Page.navigate', { url: 'http://localhost:5173/citizen/file-complaint' });
  await sleep(2500);

  const filePageScreenshot = await sendPage('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.resolve('docs/screenshots/clean_file_complaint_verified.png'), Buffer.from(filePageScreenshot.data, 'base64'));
  console.log('Saved screenshot of File Complaint page.');

  // Cleanup
  chromeProcess.kill();
  process.exit(errors.length > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
