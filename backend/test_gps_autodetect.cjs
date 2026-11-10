const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9225;
const USER_DATA_DIR = '/tmp/chrome-gps-test-' + Date.now();

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

  // Grant browser geolocation permission
  await send(browserWs, 'Browser.grantPermissions', {
    permissions: ['geolocation'],
    origin: 'http://localhost:5173'
  });

  // Override geolocation to Jalandhar, Punjab (Lat 31.3260, Lon 75.5762)
  console.log('1. Setting Geolocation override: Jalandhar, Punjab (31.3260, 75.5762)...');
  await sendPage('Emulation.setGeolocationOverride', {
    latitude: 31.3260,
    longitude: 75.5762,
    accuracy: 10
  });

  // Set authenticated citizen session
  await sendPage('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(1000);

  await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const citizenUser = {
          id: 'mock-user-avi-2026',
          full_name: 'Avi',
          email: 'abhisingh329624@gmail.com',
          phone_number: '9576202571',
          dob: '2006-06-23',
          role: 'citizen',
          roles: ['citizen'],
          designation: 'Citizen / Resident',
          is_active: true
        };
        localStorage.setItem('jansahayak_user', JSON.stringify(citizenUser));
        localStorage.setItem('jansahayak_role', 'citizen');
        localStorage.setItem('jansahayak_token', 'mock-token:citizen:mock-user-avi-2026:1762772000000');
      })()
    `
  });

  console.log('2. Navigating to /citizen/file-complaint...');
  await sendPage('Page.navigate', { url: 'http://localhost:5173/citizen/file-complaint' });
  await sleep(2500);

  // Click the Auto-Detect My GPS button
  console.log('3. Clicking "Auto-Detect My GPS" button...');
  const clickRes = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const gpsBtn = buttons.find(b => b.textContent.includes('Auto-Detect My GPS') || b.textContent.includes('GPS'));
        if (gpsBtn) {
          gpsBtn.click();
          return { clicked: true, text: gpsBtn.textContent.trim() };
        }
        return { clicked: false, buttons: buttons.map(b => b.textContent.trim()) };
      })()
    `,
    returnByValue: true
  });
  console.log('GPS Button Click Result:', clickRes.result.value);

  // Wait for GPS lock and reverse geocoding to complete
  console.log('4. Waiting for GPS lock & reverse geocoding resolution...');
  await sleep(4000);

  // Inspect form input values
  const formState = await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const addressInput = document.querySelector('input[placeholder*="Outer Ring Road"]') || document.querySelector('input[placeholder*="House/Street"]');
        const cityInput = document.querySelector('input[placeholder="City"]');
        const stateInput = document.querySelector('input[placeholder="State"]');
        const pincodeInput = document.querySelector('input[placeholder*="Pincode"]');
        const gpsMsgElem = document.querySelector('div[class*="bg-emerald-50"], div[class*="bg-sky-50"], div[class*="bg-amber-50"]');
        const coordsElem = document.querySelector('div[class*="font-mono"]');

        return {
          addressValue: addressInput ? addressInput.value : '',
          cityValue: cityInput ? cityInput.value : '',
          stateValue: stateInput ? stateInput.value : '',
          pincodeValue: pincodeInput ? pincodeInput.value : '',
          gpsBannerMessage: gpsMsgElem ? gpsMsgElem.textContent.trim() : '',
          coordinatesDisplay: coordsElem ? coordsElem.textContent.trim() : ''
        };
      })()
    `,
    returnByValue: true
  });

  console.log('\n=== AUTO-DETECT GPS RESOLUTION RESULTS ===');
  console.log(formState.result.value);

  // Scroll into view of Location Details for clean screenshot
  await sendPage('Runtime.evaluate', {
    expression: `
      (function() {
        const label = Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('Location Details'));
        if (label) label.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()
    `
  });
  await sleep(1000);

  // Capture Screenshot of populated form
  const screenshotRes = await sendPage('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshotRes.data, 'base64');
  const screenshotPath = path.resolve('docs/screenshots/gps_autodetect_verified.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log(`\nSaved screenshot to ${screenshotPath} (${buffer.length} bytes)`);

  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
