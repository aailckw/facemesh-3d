import { Vector3D } from './utils';
import { ExpressionAnalysis } from './OpenAiService';

// Landmark indices for key facial features
const FACIAL_LANDMARKS = {
  leftEye: {
    top: 159,
    bottom: 145
  },
  rightEye: {
    top: 386,
    bottom: 374
  },
  mouth: {
    top: 13,
    bottom: 14,
    left: 78,
    right: 308
  },
  nose: 1,
  leftCheek: 123,
  rightCheek: 352,
  forehead: 10
};

export default class ExpressionAnalyzer {
  // Average baseline measurements for normalization
  private baselines = {
    mouthHeight: 0,
    eyeHeight: 0,
    mouthWidth: 0,
    calibrated: false,
    samples: 0,
    maxSamples: 30
  };
  
  // Calculate the Euclidean distance between two 3D points
  private calculateDistance(p1: Vector3D, p2: Vector3D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  // Calibrate the analyzer with baseline measurements
  public calibrate(landmarks: Vector3D[]): void {
    if (this.baselines.samples >= this.baselines.maxSamples) return;
    
    // Get key points
    const mouthTop = landmarks[FACIAL_LANDMARKS.mouth.top];
    const mouthBottom = landmarks[FACIAL_LANDMARKS.mouth.bottom];
    const mouthLeft = landmarks[FACIAL_LANDMARKS.mouth.left];
    const mouthRight = landmarks[FACIAL_LANDMARKS.mouth.right];
    const leftEyeTop = landmarks[FACIAL_LANDMARKS.leftEye.top];
    const leftEyeBottom = landmarks[FACIAL_LANDMARKS.leftEye.bottom];
    
    // Calculate measurements
    const mouthHeight = this.calculateDistance(mouthTop, mouthBottom);
    const eyeHeight = this.calculateDistance(leftEyeTop, leftEyeBottom);
    const mouthWidth = this.calculateDistance(mouthLeft, mouthRight);
    
    // Update rolling average
    if (this.baselines.samples === 0) {
      this.baselines.mouthHeight = mouthHeight;
      this.baselines.eyeHeight = eyeHeight;
      this.baselines.mouthWidth = mouthWidth;
    } else {
      this.baselines.mouthHeight = (this.baselines.mouthHeight * this.baselines.samples + mouthHeight) / (this.baselines.samples + 1);
      this.baselines.eyeHeight = (this.baselines.eyeHeight * this.baselines.samples + eyeHeight) / (this.baselines.samples + 1);
      this.baselines.mouthWidth = (this.baselines.mouthWidth * this.baselines.samples + mouthWidth) / (this.baselines.samples + 1);
    }
    
    this.baselines.samples++;
    
    if (this.baselines.samples >= this.baselines.maxSamples) {
      this.baselines.calibrated = true;
      console.log('Expression analyzer calibration complete:', this.baselines);
    }
  }
  
  public analyze(landmarks: Vector3D[]): ExpressionAnalysis {
    // If not calibrated, return neutral values and calibrate
    if (!this.baselines.calibrated) {
      this.calibrate(landmarks);
      return {
        mouthOpenness: 0,
        eyeOpenness: 0,
        smileLevel: 0,
        headPose: { pitch: 0, yaw: 0, roll: 0 }
      };
    }
    
    // Get key points
    const mouthTop = landmarks[FACIAL_LANDMARKS.mouth.top];
    const mouthBottom = landmarks[FACIAL_LANDMARKS.mouth.bottom];
    const mouthLeft = landmarks[FACIAL_LANDMARKS.mouth.left];
    const mouthRight = landmarks[FACIAL_LANDMARKS.mouth.right];
    const leftEyeTop = landmarks[FACIAL_LANDMARKS.leftEye.top];
    const leftEyeBottom = landmarks[FACIAL_LANDMARKS.leftEye.bottom];
    const rightEyeTop = landmarks[FACIAL_LANDMARKS.rightEye.top];
    const rightEyeBottom = landmarks[FACIAL_LANDMARKS.rightEye.bottom];
    const nose = landmarks[FACIAL_LANDMARKS.nose];
    const leftCheek = landmarks[FACIAL_LANDMARKS.leftCheek];
    const rightCheek = landmarks[FACIAL_LANDMARKS.rightCheek];
    
    // Calculate current measurements
    const currentMouthHeight = this.calculateDistance(mouthTop, mouthBottom);
    const currentMouthWidth = this.calculateDistance(mouthLeft, mouthRight);
    const leftEyeHeight = this.calculateDistance(leftEyeTop, leftEyeBottom);
    const rightEyeHeight = this.calculateDistance(rightEyeTop, rightEyeBottom);
    
    // Normalize measurements
    const mouthOpenness = Math.min(2, Math.max(0, currentMouthHeight / this.baselines.mouthHeight));
    const eyeOpenness = Math.min(2, Math.max(0, (leftEyeHeight + rightEyeHeight) / (2 * this.baselines.eyeHeight)));
    
    // Calculate smile level based on mouth width-to-height ratio
    const mouthRatio = currentMouthWidth / currentMouthHeight;
    const baselineMouthRatio = this.baselines.mouthWidth / this.baselines.mouthHeight;
    const smileLevel = Math.min(1, Math.max(0, (mouthRatio / baselineMouthRatio) - 0.8));
    
    // Calculate head pose
    // Basic estimation using the positions of key landmarks
    const pitch = (nose.y - (leftEyeTop.y + rightEyeTop.y) / 2) * 90;
    const yaw = (nose.x - (leftCheek.x + rightCheek.x) / 2) * 90;
    const roll = Math.atan2(rightEyeTop.y - leftEyeTop.y, rightEyeTop.x - leftEyeTop.x) * 180 / Math.PI;
    
    return {
      mouthOpenness,
      eyeOpenness,
      smileLevel,
      headPose: {
        pitch,
        yaw,
        roll
      }
    };
  }
} 