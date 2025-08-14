const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';
const os = require('os');
const fs = require('fs');
const usb = require('usb');
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const net = require('net');
const sudo = require('sudo-prompt');




const sshKeyPath = path.join(os.homedir(), '.electron_ssh/id_rsa');
const SSH_KEY_PATH = path.join(os.homedir(), '.ssh', 'id_rsa');

const ADB_PATH = isDev ? 'adb' : '/usr/local/bin/adb';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'dist', 'preload.js'),
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
    exec(`${ADB_PATH} shell df /storage/emulated`, (err, stdout) => {
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
const SYSINFO_CMD = 'sysinfo';
const KEY_PATH = path.join(os.homedir(), '.ssh/id_rsa');
const PUB_KEY_PATH = KEY_PATH + '.pub';
const options = { name: 'Versiv Auto Connect' };
process.env.PATH = [process.env.PATH || '', '/usr/local/bin', '/opt/homebrew/bin'].join(':');


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
// Get names of interfaces with 169.254.x.x addresses
function getInterfaces() {
  let output;
  try {
    output = execSync('ifconfig').toString();
  } catch (err) {
    console.error('[ERROR] Failed to run ifconfig:', err.message);
    return [];
  }

  const interfaces = [];
  const blocks = output.split(/\n(?=\S)/);

  for (const block of blocks) {
    const name = block.match(/^(\S+):/)?.[1];
    const ip = block.match(/inet (169\.254\.\d+\.\d+)/)?.[1];
    if (name && ip) {
      interfaces.push(name);
    }
  }

  console.log('[INFO] Found 169.254 interfaces:', interfaces);
  return interfaces;
}


function getBinPath(cmd, extras = []) {
  const guesses = [
    ...extras,
    `/usr/local/bin/${cmd}`,
    `/opt/homebrew/bin/${cmd}`,
    `/usr/bin/${cmd}`,
    `/bin/${cmd}`,
    `/usr/sbin/${cmd}`,
    `/sbin/${cmd}`,
  ];
  for (const p of guesses) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}


//Run arp-scan
function arpScan(interfaceName) {
  return new Promise((resolve, reject) => {
    const scan = spawn(getArpScanPath(), [
      `--interface=${interfaceName}`,
      '169.254.0.0/16'
    ]);

    const results = new Map(); // IP → MAC

    scan.stdout.on('data', (data) => {
      data.toString().split('\n').forEach((line) => {
        const match = line.match(/^(169\.254\.\d+\.\d+)\s+([0-9A-Fa-f:]{17})/);
        if (match) {
          results.set(match[1], match[2]);
        }
      });
    });

    scan.stderr.on('data', (data) => {
      console.warn(`[arp-scan stderr] ${data.toString().trim()}`);
    });

    scan.on('error', (err) => {
      console.error('[ERROR] Failed to run arp-scan:', err.message);
      reject(err);
    });

    scan.on('close', () => {
      resolve(Array.from(results, ([ip, mac]) => ({ ip, mac })));
    });
  });
}



function getArpScanPath() {
  const p = getBinPath('arp-scan');
  if (p) return p;
  throw new Error('arp-scan not found. Install with: brew install arp-scan');
}


function arpScanAndRefresh(interfaceName) {
  return new Promise((resolve, reject) => {
    const arpScanPath    = getArpScanPath();
    const arpPath        = getBinPath('arp')         || '/usr/sbin/arp';
    const teePath        = getBinPath('tee')         || '/usr/bin/tee';
    const catPath        = getBinPath('cat')         || '/bin/cat';
    // ssh-keygen step is actually unnecessary given your SSH options, but keep it if you want:
    const sshKeygenPath  = getBinPath('ssh-keygen')  || '/usr/bin/ssh-keygen';

    // Note: macOS uses lowercase `-s`
    const script = `
      set -e
      echo "[INFO] Running ARP scan on ${interfaceName}..."
      "${arpScanPath}" --interface=${interfaceName} 169.254.0.0/16 | "${teePath}" /tmp/versiv_scan.txt

      # For each discovered 169.254.* host, refresh ARP; ignore known_hosts because we set UserKnownHostsFile=/dev/null.
      while read -r ip mac rest; do
        case "$ip" in
          169.254.*)
            echo "[INFO] Refreshing ARP for $ip ($mac) on ${interfaceName}..."
            "${arpPath}" -d "$ip" || true
            "${arpPath}" -s "$ip" "$mac" -i ${interfaceName}
            ;;
        esac
      done < /tmp/versiv_scan.txt
    `;

    sudo.exec(script, { name: 'Versiv Auto Connect' }, (err, stdout, stderr) => {
      if (err) return reject(err);
      if (stderr) console.warn('[WARN][sudo]', stderr);

      try {
        const scanOutput = execSync(`"${catPath}" /tmp/versiv_scan.txt`).toString();
        const ips = [];
        for (const line of scanOutput.split('\n')) {
          const m = line.match(/^(169\.254\.\d+\.\d+)\s+([0-9A-Fa-f:]{17})/);
          if (m) ips.push({ ip: m[1], mac: m[2] });
        }
        resolve(ips);
      } catch (e) {
        console.warn('[WARN] Could not read /tmp/versiv_scan.txt:', e.message);
        resolve([]); // fall back to "none found"
      }
    });
  });
}



//Ping an IP
function getLocalIPForInterface(iface) {
  const ifconfigOutput = execSync(`ifconfig ${iface}`).toString();
  const match = ifconfigOutput.match(/inet (169\.254\.\d+\.\d+)/);
  return match?.[1] || null;
}

// Ping a specific IP from a given interface
function pingIP(ip, iface) {
  const localIP = getLocalIPForInterface(iface);
  if (!localIP) {
    console.warn(`[WARN] No local IP found for interface: ${iface}`);
    return false;
  }

  try {
    execSync(`ping -c 1 -W 1 -S ${localIP} ${ip}`, { stdio: 'ignore' });
    console.log(`[INFO] Ping successful: ${ip} (via ${localIP})`);
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
function trySSH(ip, sshUser, sshPassword) {
  return new Promise((resolve, reject) => {
    const sshPath     = getBinPath('ssh')     || '/usr/bin/ssh';
    const sshpassPath = getBinPath('sshpass'); // Homebrew; may be null in prod

    const CMD_WRAPPED = `sh -l -c "${SYSINFO_CMD}"`;

    const common = [
      '-o HostKeyAlgorithms=+ssh-rsa',
      '-o PubkeyAcceptedAlgorithms=+ssh-rsa',
      '-o StrictHostKeyChecking=no',
      '-o UserKnownHostsFile=/dev/null',
      '-o ConnectTimeout=3',
      '-o PasswordAuthentication=no',
      '-v'
    ].join(' ');

    // 1) Try key
    const sshKeyCmd = `"${sshPath}" ${common} -i "${KEY_PATH}" ${sshUser}@${ip} '${CMD_WRAPPED}'`;
    try {
      const output = execSync(sshKeyCmd, { stdio: 'pipe' }).toString();
      try {
        const parsed = JSON.parse(output.trim());
        const serial = parsed?.instruments?.[0]?.serial_number;
        if (serial) return resolve(parsed);
      } catch {/* fall through */}
    } catch {/* fall through to password */ }

    // 2) Password fallback (requires sshpass)
    if (!sshpassPath) {
      return reject(new Error('sshpass not found (Homebrew). Install sshpass or switch to an SSH library (ssh2) for password auth.'));
    }

    const sshPassCmd = `"${sshpassPath}" -p '${sshPassword}' "${sshPath}" \
      -o HostKeyAlgorithms=+ssh-rsa \
      -o PubkeyAcceptedAlgorithms=+ssh-rsa \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -o PreferredAuthentications=password \
      -T ${sshUser}@${ip} \
      'sh -l -c "${SYSINFO_CMD}"'`;

    exec(sshPassCmd, { timeout: 8000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(`SSH password login failed: ${error.message}`));
      try {
        const parsed = JSON.parse(stdout.trim());
        const serial = parsed?.instruments?.[0]?.serial_number;
        if (serial) return resolve(parsed);
        return reject(new Error('serial_number missing from SSH output'));
      } catch {
        return reject(new Error('SSH output not in JSON format'));
      }
    });
  });
}


function refreshARPAndSSH(ip, mac, iface) {
  console.log(`[INFO] Refreshing ARP/SSH for ${ip} (MAC: ${mac}, iface: ${iface})`);

  try {
    execSync(`sudo arp -d -n ${ip}`);
    console.log(`[INFO] Deleted ARP entry for ${ip}`);
  } catch (err) {
    console.warn(`[WARN] Could not delete ARP entry: ${err.message}`);
  }

  try {
    execSync(`ssh-keygen -R ${ip} -f ~/.ssh/known_hosts`);
    console.log(`[INFO] Removed SSH host key for ${ip}`);
  } catch (err) {
    console.warn(`[WARN] Could not remove SSH host key: ${err.message}`);
  }

  try {
    execSync(`sudo arp -S ${ip} ${mac} -i ${iface}`);
    console.log(`[INFO] Set static ARP for ${ip} → ${mac}`);
  } catch (err) {
    console.warn(`[WARN] Could not set static ARP: ${err.message}`);
  }
}

// ---- IPC HANDLER ----
ipcMain.handle('scan-versiv', async (_event, { sshUser, sshPassword }) => {
  console.log('[INFO] Starting Versiv device scan...');
  try {
    generateSSHKeyIfNotExists();

    const interfaces = getInterfaces();
    if (!interfaces.length) throw new Error('No 169.254.x.x interfaces found.');

    for (const iface of interfaces) {
      const ips = await arpScanAndRefresh(iface);
      if (!ips.length) continue;

      for (const { ip, mac } of ips) {
        if (!pingIP(ip, iface)) continue;
        if (!await isSSHOpen(ip)) continue;
        try {
          const sysinfo = await trySSH(ip, sshUser, sshPassword);
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