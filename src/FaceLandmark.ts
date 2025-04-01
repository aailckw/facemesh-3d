import '@mediapipe/face_mesh';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { Vector3D } from './utils';

interface FaceLandmarkResult {
  keypoints: Vector3D[];
}

export default class FaceLandmark {
  private model: any;
  private detectorConfig: any;
  private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

  constructor() {
    this.model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    this.detectorConfig = {
      runtime: 'mediapipe',
      refineLandmarks: true,
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
    };
  }

  private async getDetector() {
    return await faceLandmarksDetection.createDetector(
      this.model,
      this.detectorConfig
    );
  }

  async loadDetector() {
    document.getElementById('loading')!.style.display = 'flex';
    this.detector = await this.getDetector();
    document.getElementById('loading')!.style.display = 'none';
  }

  async detectFace(source: HTMLCanvasElement | HTMLVideoElement) {
    if (!this.detector) {
      console.error('Detector not loaded');
      return [];
    }
    
    const data = await this.detector.estimateFaces(source);
    const keypoints = (data as FaceLandmarkResult[])[0]?.keypoints;
    
    if (keypoints) return keypoints;
    return [];
  }
}

