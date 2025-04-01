export default class WebcamVideo {
  videoTarget: HTMLVideoElement;
  videoConstraints: MediaStreamConstraints;
  onReceivingData: () => void;

  constructor(onReceivingData: () => void = () => {}) {
    this.videoTarget = document.createElement('video');
    this.videoConstraints = {
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        facingMode: 'user'
      }
    };
    this.onReceivingData = onReceivingData;
    this.init();
  }

  private init() {
    navigator.mediaDevices.getUserMedia(this.videoConstraints)
      .then((mediaStream) => {
        this.videoTarget.srcObject = mediaStream;
        this.videoTarget.onloadedmetadata = () => this.onLoadMetadata();
      })
      .catch((err) => {
        alert(err.name + ': ' + err.message);
      });
  }

  private onLoadMetadata() {
    this.videoTarget.setAttribute('autoplay', 'true');
    this.videoTarget.setAttribute('playsinline', 'true');
    this.videoTarget.play();
    this.onReceivingData();
  }
}

