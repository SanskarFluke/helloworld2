import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SshManager() {
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);

  const log = (msg) => {
    console.log('[DEBUG]', msg);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

const generateKey = async () => {
  log('▶ Starting SSH key generation...');
  try {
    const result = await window.electron.generateSSHKey();

    if (result === 'exists') {
      setStatus('ℹ️ SSH key already exists');
      log('ℹ️ SSH key already exists. No need to regenerate.');
    } else if (result === 'generated') {
      setStatus('✅ SSH key generated');
      log('✅ SSH key generated successfully');
    } else {
      setStatus('❓ Unexpected response');
      log('❓ Unexpected response from SSH key generation: ' + result);
    }
  } catch (e) {
    setStatus('❌ Error generating SSH key');
    log('❌ Error generating SSH key: ' + e.message);
    log('❌ Error generating SSH key full error: ' + e);
    console.error(e);
  }
};

  const uploadKey = async () => {
    log('▶ Fetching public key to upload...');
    try {
      const key = await window.electron.getPublicKey();
      log('✅ Retrieved public key:\n' + key);

      const response = await fetch('http://10.206.250.234:3002/upload-key', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: key,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setStatus('✅ Public key uploaded');
      log('✅ Public key uploaded to server');
    } catch (e) {
      setStatus('❌ Error uploading public key');
      log('❌ Upload failed: ' + e.message);
      console.error(e);
    }
  };

const downloadFile = async () => {
  const options = {
    user: 'sanskar.jaiswal',
    host: '10.206.250.234',
    remotePath: '/Users/sanskar.jaiswal/sample.pdf',
    localPath: '/Users/sanskar.jaiswal/Downloads/sample.pdf', // corrected!
  };

  log('▶ Initiating SCP download with options: ' + JSON.stringify(options, null, 2));
  try {
    await window.electron.scpDownload(options);
    setStatus('✅ File downloaded');
    log('✅ File downloaded successfully to ' + options.localPath);
  } catch (e) {
    setStatus('❌ Error downloading file');
    log('❌ SCP download failed: ' + e.message);
    console.error(e);
  }
};




  return (
    <div className="p-4 space-y-4">
      <div className="space-x-2">
        <button onClick={generateKey}>Generate SSH Key</button>
        <button onClick={uploadKey}>Upload Public Key to Server</button>
        <button onClick={downloadFile}>Download File via SCP</button>
        <Link to="/home"><button style={{backgroundColor: 'pink'}}>Back to home</button></Link>
      </div>
      <p>Status: {status}</p>

      <div
        style={{
          maxHeight: '200px',
          overflowY: 'scroll',
          background: '#111',
          color: '#0f0',
          padding: '10px',
          borderRadius: '8px',
          marginTop: '10px',
          fontFamily: 'monospace',
          fontSize: '14px',
        }}
      >
        <strong>Debug Log:</strong>
        <pre>{logs.join('\n')}</pre>
      </div>
    </div>
  );
}
