class ZXingReader {

  constructor(video, canvas) {
    this.video = video
    this.canvas = canvas
    this.scanRate = 50
    this.stream = null
    this.streaming = false
    this.decoding = false
    this.decodedCallBacks = []
    this.cropData = {
      sX: 0, sY: 0, sW: 0, sH: 0,
      dX: 0, dY: 0, dW: 0, dH: 0,
    };

    this.barcodeWorker = new Worker("./zxing_worker.js");
    this.barcodeWorker.onmessage = (responseData) => {
      const {message, data} = responseData.data;
      if (message == 'decoded') { this.callDecodedCallbacks(data) }
    };
    this.barcodeWorker.postMessage({message: 'initialize'});
  }

  async start(deviceId) {
    this.streaming = false;
    if (this.stream) await this.stream.getVideoTracks()[0].stop();
    this.video.addEventListener('play', this.computeCropData);

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width:720, height:320, frameRate: { ideal: 28, max: 28 }, deviceId, facingMode:"environment" }
    }).then(stream => {
      this.stream = stream
      this.video.srcObject = this.stream;
    })
    this.streaming = true;
    this.startDecoding();
  }

  stop() {
    this.streaming = false;
  }

  computeCropData() {
    this.cropData.sW = this.video.videoWidth;
    this.cropData.sH = this.video.videoHeight;
    this.cropData.dW = this.canvas.width;
    this.cropData.dH = (this.cropData.sH * this.cropData.dW) / this.cropData.sW;
  }

  startDecoding() {
    try {
      if (this.streaming) {
        requestAnimationFrame(this.startDecoding);
        canvas.getContext('2d').drawImage(this.video, 0, 0, this.cropData.sW, this.cropData.sH, 0, 0, this.cropData.dW, this.cropData.dH);
        /*
        if (this.decoding == false) {
          this.decoding = true;
          this.canvas.toBlob(blob => {
            this.barcodeWorker.postMessage({message: 'decode', data: blob});
            setTimeout(() => { this.decoding = false }, this.scanRate);
          })
        }
        */
      }
    }
    catch (e) {
      console.log(e);
      //this.streaming = false;
    }
  }

  addDecodedCallBack(callback) {
    this.decodedCallBacks.push(callback);
  }

  callDecodedCallbacks(data) {
    for(const fn of this.decodedCallBacks) {
      fn(data);
    }
  }
}