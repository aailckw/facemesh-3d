import WebcamVideo from './WebcamVideo';

export default class WebcamCanvas {
  canvas: HTMLCanvasElement;
  canvasCtx: CanvasRenderingContext2D;
  webcamVideo: WebcamVideo;
  receivingStreem: boolean = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.canvasCtx = ctx;
    
    this.webcamVideo = new WebcamVideo(() => {
      this.receivingStreem = true;
    });
  }

  updateFromWebCam() {
    if (!this.receivingStreem) return;
    
    this.canvasCtx.drawImage(
      this.webcamVideo.videoTarget,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }
}

