import React, { useEffect, useState } from 'react';

function UsbScanner() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const scan = async () => {
      try {
        const list = await window.electron.scanUsbDevices();
        console.log('USB Devices:', list);
        setDevices(list);
      } catch (err) {
        console.error('Error scanning USB devices:', err);
      }
    };

    scan();
  }, []);

  return (
    <div>
      <h2>Connected USB Devices</h2>
      <ul>
        {devices.map((dev, index) => (
          <li key={index}>
            Vendor ID: {dev.vendorId.toString(16)}, Product ID: {dev.productId.toString(16)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsbScanner;
