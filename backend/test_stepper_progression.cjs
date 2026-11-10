const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;
const USER_DATA_DIR = '/tmp/chrome-stepper-test-' + Date.now();

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

  // Auto accept any modal dialog
  browserWs.addEventListener('message', async (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Page.javascriptDialogOpening') {
      console.log('[Dialog opened]', data.params.message);
      await sendPage('Page.handleJavaScriptDialog', { accept: true });
    }
  });

  console.log('1. Setting up Officer Rajesh Verma session in localStorage...');
  await sendPage('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(1500);

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
        return { success: true };
      })()
    `,
    returnByValue: true
  });

  // Navigate to complaint JS-2026-94821 detail page
  console.log('2. Navigating to complaint detail page /complaints/d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01...');
  await sendPage('Page.navigate', { url: 'http://localhost:5173/complaints/d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01' });
  await sleep(2500);

  // Check Logo and Initial Stepper
  const initialCheck = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const hasBrandSvg = Boolean(document.querySelector('svg linearGradient#brandShieldGrad'));
        const brandText = document.querySelector('header span')?.textContent;
        const stageBadge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Stage'))?.textContent;
        const formExists = Boolean(document.querySelector('form'));
        return { hasBrandSvg, brandText, stageBadge, formExists };
      })()
    `,
    returnByValue: true
  });
  console.log('Initial page inspection:', initialCheck.result.value);

  // Helper inside browser to transition status
  async function transitionStatus(targetStatus, notes) {
    const res = await sendPage('Runtime.evaluate', {
      expression: `
        (function() {
          const select = document.querySelector('select');
          if (!select) return { error: 'select not found' };
          const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
          selectSetter.call(select, '${targetStatus}');
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));

          const input = document.querySelector('input[type="text"][placeholder*="inspection"]');
          if (!input) return { error: 'input not found' };
          const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          inputSetter.call(input, '${notes}');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          const submitBtn = document.querySelector('button[type="submit"]');
          if (!submitBtn) return { error: 'submit button not found' };
          submitBtn.click();
          return { success: true, target: '${targetStatus}' };
        })()
      `,
      returnByValue: true
    });
    return res.result.value;
  }

  // Transition 1: Mark as Verified (Stage 2)
  console.log('\n3. Performing Officer Action: Transition to "verified" (Stage 2)...');
  const t1 = await transitionStatus('verified', 'Initial field inspection report verified by PWD Assistant Engineer.');
  console.log('Transition 1 triggered:', t1);
  await sleep(2000);

  const stage2 = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const badge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Stage'))?.textContent;
        const doneBadges = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.includes('Done'));
        return { badge, doneCount: doneBadges.length };
      })()
    `,
    returnByValue: true
  });
  console.log('Stage 2 Result:', stage2.result.value);

  // Transition 2: Assign Field Team (Stage 3)
  console.log('\n4. Performing Officer Action: Transition to "assigned" (Stage 3)...');
  const t2 = await transitionStatus('assigned', 'Field maintenance unit dispatched with cold mix asphalt repair truck.');
  console.log('Transition 2 triggered:', t2);
  await sleep(2000);

  const stage3 = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const badge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Stage'))?.textContent;
        const doneBadges = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.includes('Done'));
        return { badge, doneCount: doneBadges.length };
      })()
    `,
    returnByValue: true
  });
  console.log('Stage 3 Result:', stage3.result.value);

  // Transition 3: Mark In Progress (Stage 4)
  console.log('\n5. Performing Officer Action: Transition to "in_progress" (Stage 4)...');
  const t3 = await transitionStatus('in_progress', 'Excavation and asphalt compaction actively underway on site.');
  console.log('Transition 3 triggered:', t3);
  await sleep(2000);

  const stage4 = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const badge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Stage'))?.textContent;
        const doneBadges = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.includes('Done'));
        return { badge, doneCount: doneBadges.length };
      })()
    `,
    returnByValue: true
  });
  console.log('Stage 4 Result:', stage4.result.value);

  // Transition 4: Mark Resolved (Stage 5)
  console.log('\n6. Performing Officer Action: Transition to "resolved" (Stage 5)...');
  const t4 = await transitionStatus('resolved', 'Road pothole patching and leveling successfully completed with photo verification.');
  console.log('Transition 4 triggered:', t4);
  await sleep(2000);

  const stage5 = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const badge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Stage'))?.textContent;
        const doneBadges = Array.from(document.querySelectorAll('span')).filter(s => s.textContent.includes('Done'));
        return { badge, doneCount: doneBadges.length };
      })()
    `,
    returnByValue: true
  });
  console.log('Stage 5 (Resolved) Result:', stage5.result.value);

  // Capture full screenshot
  const screenshotRes = await sendPage('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');
  const screenshotPath = path.resolve('docs/screenshots/stepper_and_logo_verified.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log(`\nSaved final screenshot to ${screenshotPath} (${buffer.length} bytes)`);

  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
