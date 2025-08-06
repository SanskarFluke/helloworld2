const usb = require('usb');

// Filter by Fluke Networks Vendor ID
const devices = usb.getDeviceList().filter(dev => dev.deviceDescriptor.idVendor === 0x0f7e);

if (devices.length === 0) {
  console.log("No Fluke devices found.");
} else {
  devices.forEach((device, index) => {
    const { idVendor, idProduct, iManufacturer, iProduct, bDeviceClass, bDeviceSubClass } = device.deviceDescriptor;
    console.log(`Device #${index + 1}`);
    console.log(`Vendor ID: ${idVendor.toString(16)}`);
    console.log(`Product ID: ${idProduct.toString(16)}`);
    console.log(`Device Class: ${bDeviceClass}`);
    console.log(`Device SubClass: ${bDeviceSubClass}`);
    console.log('--------------------------------------');
  });
}
