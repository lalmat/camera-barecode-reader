'use strict'
importScripts('zxing_reader.js');

var zxing = null;
var stream = null;
var reading = false;
var imageCapture = null;

ZXing().then(function(value) {
    zxing = value;
});

async function waitZXingLoading() {
  while(zxing == null) {
    await delay();
  }
}

function delay() {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(true); }, 30);
  })
}

async function readFileSync(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = function(evt) {
      resolve(new Uint8Array(evt.target.result));
    }
    reader.readAsArrayBuffer(file);
  })
}

async function analyseImageFile(file) {
  const fileData = await readFileSync(file);
  const buffer = zxing._malloc(fileData.length);
  zxing.HEAPU8.set(fileData, buffer);
  const result = zxing.readBarcode(buffer, fileData.length, true, '');
  zxing._free(buffer);

  return result;
}


onmessage = async function(e) {
  const {message, data} = e.data;

  if (message == "initialize") {
    await waitZXingLoading();
    postMessage({message: 'initialized', data: true});
  }

  if (message == "video") {
    startVideo(data);
  }

  if (message == "decode") {
    const result = await analyseImageFile(data);
    if (result.text != "") {
      postMessage({message: 'decoded', data: result});
    }
  }
}