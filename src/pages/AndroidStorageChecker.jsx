import React, { useState } from 'react';

function AndroidStorageChecker() {
  const [storage, setStorage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStorage = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electron.getAndroidStorage();
      setStorage(result);
    } catch (err) {
      setError(err.toString());
      setStorage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h3>📱 Android Storage Info</h3>
      <button onClick={checkStorage} disabled={loading}>
        {loading ? 'Checking...' : 'Check Android Storage'}
      </button>

      {storage && (
        <div style={{ marginTop: 16 }}>
          <p><strong>Total:</strong> {storage.totalGB} GB</p>
          <p><strong>Used:</strong> {storage.usedGB} GB</p>
          <p><strong>Available:</strong> {storage.availableGB} GB</p>
          <p><strong>Usage:</strong> {storage.usagePercent}</p>
        </div>
      )}

      {error && (
        <div style={{ color: 'red', marginTop: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default AndroidStorageChecker;
