import React, { useState } from 'react';

const VersivAutoConnect = () => {
  const [status, setStatus] = useState('Idle');
  const [deviceIP, setDeviceIP] = useState('');
  const [sysinfo, setSysinfo] = useState('');
  const [error, setError] = useState('');

  const [sshUser, setSshUser] = useState('cwuser');
  const [sshPassword, setSshPassword] = useState('fnet99');

  const handleScan = async () => {
    setStatus('Scanning interfaces...');
    setError('');
    setDeviceIP('');
    setSysinfo('');

    try {
      const result = await window.electron.ipcRenderer.invoke('scan-versiv', {
        sshUser,
        sshPassword
      });

      if (result.error) {
        setStatus('Error');
        setError(result.error);
      } else {
        setStatus('Connected');
        setDeviceIP(result.deviceIP);
        setSysinfo(result.sysinfo);
      }
    } catch (err) {
      setStatus('Error');
      setError(err.toString());
    }
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <h2>Versiv Auto Connect</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>SSH Username: </label>
        <input
          type="text"
          value={sshUser}
          onChange={(e) => setSshUser(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>SSH Password: </label>
        <input
          type="password"
          value={sshPassword}
          onChange={(e) => setSshPassword(e.target.value)}
        />
      </div>

      <button
        onClick={handleScan}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          borderRadius: '6px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
        }}
      >
        Scan & Connect
      </button>

      <div style={{ marginTop: '1rem' }}>
        <strong>Status:</strong> {status}
      </div>

      {deviceIP && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Device IP:</strong> {deviceIP}
        </div>
      )}

      {sysinfo && (
        <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: '1rem', borderRadius: '6px' }}>
          <strong>Sysinfo Output:</strong>
          <pre>{JSON.stringify(sysinfo, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', color: 'red', whiteSpace: 'pre-wrap' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default VersivAutoConnect;
