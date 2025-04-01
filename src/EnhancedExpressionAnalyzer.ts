import * as faceapi from 'face-api.js';
import { ExpressionAnalysis } from './OpenAiService';
import { Vector3D } from './utils';

export default class EnhancedExpressionAnalyzer {
  private modelsLoaded: boolean = false;
  private baselineExpressions: Record<string, number> = {
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0
  };
  private expressionHistory: Array<faceapi.FaceExpressions> = [];
  private historyMaxLength: number = 5;
  
  // More stringent thresholds for smile detection
  private smileThresholds = {
    // Neural network confidence thresholds
    minimal: 0.40,    // Was implicitly 0.0 (any value above 0)
    slight: 0.60,     // Was implicitly around 0.2
    moderate: 0.75,   // Was implicitly around 0.5 
    broad: 0.85,      // Was implicitly around 0.8
    
    // Physical measurements (mouth width-to-height ratio)
    mouthRatioBase: 4.0,   // Was 3.0
    mouthRatioScale: 4.0    // Was 3.0
  };

  constructor() {}

  async loadModels(): Promise<void> {
    try {
      // Load face-api models
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      
      console.log('Face-API models loaded successfully');
      this.modelsLoaded = true;
    } catch (error) {
      console.error('Failed to load face-api models:', error);
      throw error;
    }
  }

  async downloadModels(): Promise<void> {
    // Create models directory if it doesn't exist
    await this.createDirectory('/models');
    
    // Download required models
    const modelFiles = [
      'face_expression_model-shard1',
      'face_expression_model-weights_manifest.json',
      'face_landmark_68_model-shard1',
      'face_landmark_68_model-weights_manifest.json',
      'face_recognition_model-shard1',
      'face_recognition_model-shard2',
      'face_recognition_model-weights_manifest.json',
      'tiny_face_detector_model-shard1',
      'tiny_face_detector_model-weights_manifest.json'
    ];
    
    const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
    
    for (const file of modelFiles) {
      try {
        await this.downloadFile(`${baseUrl}${file}`, `/models/${file}`);
        console.log(`Downloaded: ${file}`);
      } catch (error) {
        console.error(`Failed to download ${file}:`, error);
      }
    }
  }
  
  private async createDirectory(path: string): Promise<void> {
    // This is a browser-only method, so we just ensure the directory exists
    // In a real environment, this would need server-side implementation
    console.log(`Directory would be created at: ${path}`);
  }
  
  private async downloadFile(url: string, dest: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // In a browser context, we can't directly save files
      // But we could store it in IndexedDB or localStorage
      // For this demo, we'll just log the success
      console.log(`File would be saved to: ${dest}`);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async detectExpressions(canvas: HTMLCanvasElement): Promise<faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<{detection: faceapi.FaceDetection}, faceapi.FaceLandmarks68>> | null> {
    if (!this.modelsLoaded) {
      console.warn('Face-API models not loaded, using TensorFlow detection only');
      return null;
    }
    
    try {
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detections.length === 0) {
        return null;
      }
      
      // Store expression data in history for smoothing
      this.expressionHistory.push(detections[0].expressions);
      if (this.expressionHistory.length > this.historyMaxLength) {
        this.expressionHistory.shift();
      }
      
      return detections[0];
    } catch (error) {
      console.error('Error detecting expressions:', error);
      return null;
    }
  }
  
  // Get smoothed expression values by averaging recent history
  private getSmoothedExpressions(): Record<string, number> {
    if (this.expressionHistory.length === 0) {
      return this.baselineExpressions;
    }
    
    const smoothed = { ...this.baselineExpressions };
    
    for (const expressions of this.expressionHistory) {
      for (const [expression, value] of Object.entries(expressions)) {
        if (expression in smoothed) {
          smoothed[expression] += value / this.expressionHistory.length;
        }
      }
    }
    
    return smoothed;
  }
  
  // Analyze expressions using face-api and TensorFlow landmarks
  async analyzeExpressions(canvas: HTMLCanvasElement, landmarks: Vector3D[]): Promise<ExpressionAnalysis> {
    // Get face-api detections for expressions
    const detection = await this.detectExpressions(canvas);
    
    // Calculate facial measurements from landmarks (original method)
    const mouthTop = landmarks[13]; // Top lip
    const mouthBottom = landmarks[14]; // Bottom lip
    const mouthLeft = landmarks[78]; // Left corner of mouth
    const mouthRight = landmarks[308]; // Right corner of mouth
    const leftEyeTop = landmarks[159]; // Top of left eye
    const leftEyeBottom = landmarks[145]; // Bottom of left eye
    const rightEyeTop = landmarks[386]; // Top of right eye
    const rightEyeBottom = landmarks[374]; // Bottom of right eye
    
    // Calculate mouth width and height
    const mouthWidth = this.calculateDistance(mouthLeft, mouthRight);
    const mouthHeight = this.calculateDistance(mouthTop, mouthBottom);
    
    // Calculate eye openness
    const leftEyeHeight = this.calculateDistance(leftEyeTop, leftEyeBottom);
    const rightEyeHeight = this.calculateDistance(rightEyeTop, rightEyeBottom);
    const eyeOpenness = (leftEyeHeight + rightEyeHeight) / 2;
    
    // Calculate head pose
    const nose = landmarks[1];
    const leftCheek = landmarks[123];
    const rightCheek = landmarks[352];
    
    const pitch = (nose.y - (leftEyeTop.y + rightEyeTop.y) / 2) * 90;
    const yaw = (nose.x - (leftCheek.x + rightCheek.x) / 2) * 90;
    const roll = Math.atan2(rightEyeTop.y - leftEyeTop.y, rightEyeTop.x - leftEyeTop.x) * 180 / Math.PI;
    
    // Calculate smile level
    let smileLevel = 0;
    
    // If face-api detection is available, use its smile data
    if (detection) {
      const expressions = this.getSmoothedExpressions();
      
      // Apply more strict threshold to the happiness score from face-api
      // Using our adjusted thresholds
      let nnSmileLevel = 0;
      if (expressions.happy >= this.smileThresholds.minimal) {
        // Rescale the happiness value to fit our more stringent range
        nnSmileLevel = Math.min(1, (expressions.happy - this.smileThresholds.minimal) / 
                          (1 - this.smileThresholds.minimal));
      }
      
      // Calculate mouth shape contribution with stricter thresholds
      const mouthRatio = mouthWidth / (mouthHeight + 0.0001); // Avoid division by zero
      const mouthShapeContribution = Math.min(1, 
                                     Math.max(0, 
                                     (mouthRatio - this.smileThresholds.mouthRatioBase) / 
                                     this.smileThresholds.mouthRatioScale));
      
      // Combine both measures with weights, emphasizing neural network result more
      smileLevel = 0.75 * nnSmileLevel + 0.25 * mouthShapeContribution;
      
      // Add debug logging to help calibrate
      console.debug('Smile detection:', {
        rawHappy: expressions.happy,
        nnSmileLevel,
        mouthRatio,
        mouthShapeContribution,
        finalSmileLevel: smileLevel
      });
    } else {
      // Fallback to geometry-based smile detection with stricter thresholds
      const mouthRatio = mouthWidth / (mouthHeight + 0.0001);
      smileLevel = Math.min(1, Math.max(0, (mouthRatio - this.smileThresholds.mouthRatioBase) / 
                       this.smileThresholds.mouthRatioScale));
    }
    
    // Calculate mouth openness based on ratio of height to width
    const mouthOpenness = Math.min(1, mouthHeight / (mouthWidth * 0.3));
    
    return {
      mouthOpenness,
      eyeOpenness,
      smileLevel,  // Return the original smile level (0 = no smile, 1 = big smile)
      headPose: {
        pitch,
        yaw,
        roll
      }
    };
  }
  
  private calculateDistance(p1: Vector3D, p2: Vector3D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
} 