const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, execSync } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';
const os = require('os');
const fs = require('fs');
const usb = require('usb');
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const net = require('net');



const sshKeyPath = path.join(os.homedir(), '.electron_ssh/id_rsa');
const SSH_KEY_PATH = path.join(os.homedir(), '.ssh', 'id_rsa');


function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  console.log("ENV:", process.env.NODE_ENV);
  console.log("isDev:", isDev);

  if (isDev) {
    console.log("Loading from Vite dev server: http://localhost:5173");
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log("Loading local file:", indexPath);
    win.loadFile(indexPath).catch(err => {
      console.error("Failed to load index.html:", err);
    });
    win.webContents.openDevTools(); // Optional
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.handle('get-android-storage', async () => {
  return new Promise((resolve, reject) => {
    exec('adb shell df /storage/emulated', (err, stdout) => {
      if (err) {
        return reject('ADB Error: ' + err.message);
      }

      const line = stdout.trim().split('\n').find(l => l.includes('/storage/emulated'));
      if (!line) {
        return reject('Storage info not found');
      }

      const parts = line.split(/\s+/);
      if (parts.length < 5) {
        return reject('Malformed ADB output');
      }

      resolve({
        totalGB: (parseInt(parts[1]) / 1024 / 1024).toFixed(2),
        usedGB: (parseInt(parts[2]) / 1024 / 1024).toFixed(2),
        availableGB: (parseInt(parts[3]) / 1024 / 1024).toFixed(2),
        usagePercent: parts[4],
      });
    });
  });
});

ipcMain.handle('generate-ssh-key', async () => {
  const sshDir = path.join(os.homedir(), '.ssh');
  const privateKeyPath = path.join(sshDir, 'id_rsa');
  const publicKeyPath = privateKeyPath + '.pub';

  console.log('[MAIN] Checking if SSH key already exists...');
  try {
    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
      console.log('[MAIN] SSH key already exists');
      return 'exists';
    }

    console.log('[MAIN] Starting ssh-keygen...');
    return new Promise((resolve, reject) => {
      exec(`ssh-keygen -t rsa -b 2048 -f "${privateKeyPath}" -N "" -q`, (error) => {
        if (error) {
          console.error('[MAIN] SSH keygen error:', error);
          reject(error);
        } else {
          console.log('[MAIN] SSH keygen success');
          resolve('generated');
        }
      });
    });
  } catch (e) {
    console.error('[MAIN] Failed during SSH key check/generation:', e);
    throw e;
  }
});

ipcMain.handle('get-public-key', async () => {
  const pubKeyPath = sshKeyPath + '.pub';
  return fs.promises.readFile(pubKeyPath, 'utf8');
});

function checkBinary(binary) {
  return new Promise((resolve) => {
    exec(`which ${binary}`, (err, stdout) => {
      resolve(!err && !!stdout.trim());
    });
  });
}

ipcMain.handle('check-binaries', async () => {
  const ssh = await checkBinary('ssh');
  const scp = await checkBinary('scp');
  return { ssh, scp };
});


ipcMain.handle('scp-download', async (event, { user, host, remotePath, localPath }) => {
  return new Promise((resolve, reject) => {
    const command = `scp -i "${sshKeyPath}" ${user}@${host}:"${remotePath}" "${localPath}"`;
    exec(command, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve('File downloaded');
    });
  });
});


ipcMain.handle('scan-usb-devices', async () => {
  const devices = usb.getDeviceList();

  const result = await Promise.all(
    devices.map(async (device) => {
      const dd = device.deviceDescriptor;
      const entry = {
        vendorId: dd.idVendor,
        productId: dd.idProduct,
        manufacturer: null,
        product: null,
        serialNumber: null,
      };

      try {
        device.open();

        // Promisify descriptor reads
        const getStr = (index) =>
          new Promise((resolve, reject) => {
            if (!index) return resolve(null);
            device.getStringDescriptor(index, (err, data) =>
              err ? resolve(null) : resolve(data)
            );
          });

        entry.manufacturer = await getStr(dd.iManufacturer);
        entry.product = await getStr(dd.iProduct);
        entry.serialNumber = await getStr(dd.iSerialNumber);

        device.close();
      } catch (err) {
        console.warn(`Failed to read USB device strings:`, err.message);
      }

      return entry;
    })
  );

  return result;
});


// ---- CONFIG ----
const SSH_USER = 'cwuser';
const SSH_PASSWORD = 'fnet99';
const SYSINFO_CMD = 'sysinfo';
const KEY_PATH = path.join(os.homedir(), '.ssh/id_rsa');
const PUB_KEY_PATH = KEY_PATH + '.pub';

// ---- UTILITY FUNCTIONS ----

// Generate SSH key if not exists
function generateSSHKeyIfNotExists() {
  try {
    if (!fs.existsSync(KEY_PATH) || !fs.existsSync(PUB_KEY_PATH)) {
      console.log('[INFO] Generating SSH key...');
      execSync(`ssh-keygen -t rsa -b 2048 -f "${KEY_PATH}" -N ""`);
      console.log('[INFO] SSH key generated.');
    }
  } catch (err) {
    console.error('[ERROR] SSH key generation failed:', err);
  }
}

// Get all 169.254.x.x interfaces
function getInterfaces() {
  const ifconfigOutput = execSync('ifconfig').toString();
  const interfaces = [];
  const blocks = ifconfigOutput.split(/\n(?=\S)/);

  for (const block of blocks) {
    const nameMatch = block.match(/^(\S+):/);
    const inetMatch = block.match(/inet (169\.254\.\d+\.\d+)/);
    if (nameMatch && inetMatch) {
      interfaces.push(nameMatch[1]);
    }
  }

  console.log('[INFO] 169.254 interfaces:', interfaces);
  return interfaces;
}

// Run arp-scan
function arpScan(interfaceName) {
  try {
    console.log(`[INFO] Running arp-scan on ${interfaceName}`);
    const output = execSync(`arp-scan --interface=${interfaceName} 169.254.0.0/16`).toString();
    const lines = output.split('\n');
    const ips = lines
      .filter(line => line.includes('169.254.'))
      .map(line => line.split('\t')[0]);

    console.log(`[INFO] Found IPs on ${interfaceName}:`, ips);
    return ips;
  } catch (err) {
    console.warn(`[WARN] arp-scan failed on ${interfaceName}`);
    return [];
  }
}

//Ping an IP
function pingIP(ip) {
  try {
    execSync(`ping -c 1 -W 1 ${ip}`);
    console.log(`[INFO] Ping successful: ${ip}`);
    return true;
  } catch {
    console.warn(`[WARN] Ping failed: ${ip}`);
    return false;
  }
}

// Check if SSH port 22 is open
function isSSHOpen(ip, port = 22, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const onError = () => {
      socket.destroy();
      console.log(`[INFO] SSH port on ${ip}: CLOSED`);
      resolve(false);
    };

    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', onError);

    socket.connect(port, ip, () => {
      socket.end();
      console.log(`[INFO] SSH port on ${ip}: OPEN`);
      resolve(true);
    });
  });
}

// Try SSH with key first, then password
function trySSH(ip) {
  return new Promise((resolve, reject) => {
    const CMD_WRAPPED = `sh -l -c "${SYSINFO_CMD}"`;
    const commonOptions = [
      '-o HostKeyAlgorithms=+ssh-rsa',
      '-o PubkeyAcceptedAlgorithms=+ssh-rsa',
      '-o StrictHostKeyChecking=no',
      '-o UserKnownHostsFile=/dev/null',
      '-o ConnectTimeout=3',
      '-v' // verbose SSH debug
    ].join(' ');

    console.log(`[INFO] Trying SSH key authentication to ${ip}...`);
    const sshKeyCmd = `ssh ${commonOptions} -i "${KEY_PATH}" ${SSH_USER}@${ip} '${CMD_WRAPPED}'`;

    try {
      const output = execSync(sshKeyCmd, { stdio: 'pipe' }).toString();
      console.log(`[DEBUG] SSH key output:\n${output}`);

      try {
        const parsed = JSON.parse(output.trim());
        const serial = parsed?.instruments?.[0]?.serial_number;

        if (serial) {
          console.log('[INFO] SSH key authentication successful');
          return resolve(parsed);
        } else {
          console.warn('[WARN] SSH key output is valid JSON but missing serial_number');
        }
      } catch (jsonErr) {
        console.warn('[WARN] SSH key output is not valid JSON.');
      }
    } catch (err) {
      console.warn('[WARN] SSH key authentication failed.');
      console.debug(`[DEBUG] SSH key error:\n${err.stderr?.toString() || err.message}`);
    }

    // ---- Fallback to Password Auth ---- //
    console.log('[INFO] Falling back to SSH password authentication...');
    const sshPassCmd = `sshpass -p ${SSH_PASSWORD} ssh ${commonOptions.replace('-o ConnectTimeout=3', '-o ConnectTimeout=5')} ${SSH_USER}@${ip} '${CMD_WRAPPED}'`;

    exec(sshPassCmd, { timeout: 8000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[ERROR] SSH password login failed:', error.message);
        console.debug(`[DEBUG] SSH password stderr:\n${stderr}`);
        return reject(new Error('SSH password login failed'));
      }

      console.log(`[DEBUG] SSH password stdout:\n${stdout}`);

      try {
        const parsed = JSON.parse(stdout.trim());
        const serial = parsed?.instruments?.[0]?.serial_number;
        const model = parsed?.instruments?.[0]?.model;
        const swVersions = parsed?.instruments?.[0]?.components?.sw ?? [];


        if (serial) {
          console.log('[INFO] SSH password authentication successful');
          console.log('serial_number: '+serial);
          console.log('model: '+ model);
          console.log('sw: '+swVersions);
          return resolve(parsed);
        } else {
          console.warn('[WARN] SSH password output is valid JSON but missing serial_number');
          return reject(new Error('serial_number missing from SSH output'));
        }
      } catch (parseErr) {
        console.warn('[WARN] SSH password output is not valid JSON.');
        return reject(new Error('SSH output not in JSON format'));
      }
    });
  });
}



// ---- IPC HANDLER ----
ipcMain.handle('scan-versiv', async () => {
  console.log('[INFO] Starting Versiv device scan...');
  try {
    generateSSHKeyIfNotExists();

    const interfaces = getInterfaces();
    if (!interfaces.length) throw new Error('No 169.254.x.x interfaces found.');

    for (const iface of interfaces) {
      const ips = arpScan(iface);
      if (!ips.length) continue;

      for (const ip of ips) {
        if (!pingIP(ip)) continue;
        if (!await isSSHOpen(ip)) continue;

        try {
          const sysinfo = await trySSH(ip);
          console.log(`[SUCCESS] Connected to Versiv at ${ip}`);
          return { deviceIP: ip, sysinfo };
        } catch (err) {
          console.warn(`[ERROR] SSH failed for ${ip}: ${err.message}`);
        }
      }
    }

    throw new Error('No Versiv device found on any interface.');
  } catch (err) {
    console.error('[ERROR] Versiv scan failed:', err.message);
    return { error: err.message || String(err) };
  }
});


/*

Kamya0801@sansmya

*/