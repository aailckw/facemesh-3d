import ThreeSetup from './ThreeSetup';
import WebcamCanvas from './WebcamCanvas';
import FaceLandmark from './FaceLandmark';
import PointCloud from './PointCloud';
import EnhancedExpressionAnalyzer from './EnhancedExpressionAnalyzer';
import { ExpressionAnalysis } from './OpenAiService';
import { flattenFacialLandMarkArray, createBufferAttribute } from './utils';
import * as THREE from 'three';

export default class FacePointCloud {
  private threeSetUp: ThreeSetup;
  private setUpElements: ReturnType<ThreeSetup['getSetup']>;
  private webcamCanvas: WebcamCanvas;
  private faceMeshDetector: FaceLandmark;
  private pointCloud: PointCloud;
  private expressionAnalyzer: EnhancedExpressionAnalyzer;
  private colorsInitialized: boolean = false;
  private gridHelper: THREE.GridHelper;
  private videoBackground: THREE.Mesh | null = null;
  private useRealColors: boolean = true;
  private lastLandmarks: any[] = [];
  private lastExpressionData: ExpressionAnalysis | null = null;
  private expressionUpdateCallback: ((data: ExpressionAnalysis) => void) | null = null;
  private modelsLoaded: boolean = false;

  constructor() {
    this.threeSetUp = new ThreeSetup();
    this.setUpElements = this.threeSetUp.getSetup();
    this.webcamCanvas = new WebcamCanvas();
    this.faceMeshDetector = new FaceLandmark();
    this.pointCloud = new PointCloud();
    this.gridHelper = new THREE.GridHelper(10, 10);
    this.expressionAnalyzer = new EnhancedExpressionAnalyzer();
    
    // Initialize face-api
    this.initFaceApi();
  }
  
  private async initFaceApi() {
    try {
      await this.expressionAnalyzer.loadModels();
      this.modelsLoaded = true;
      console.log('Successfully loaded face-api models');
    } catch (error) {
      console.warn('Could not load face-api models. Attempting to download them:', error);
      this.modelsLoaded = false;
      
      try {
        await this.expressionAnalyzer.downloadModels();
        await this.expressionAnalyzer.loadModels();
        this.modelsLoaded = true;
        console.log('Successfully downloaded and loaded face-api models');
      } catch (secondError) {
        console.error('Failed to download and load models:', secondError);
      }
    }
  }

  setExpressionUpdateCallback(callback: (data: ExpressionAnalysis) => void) {
    this.expressionUpdateCallback = callback;
  }

  getLastExpressionData(): ExpressionAnalysis | null {
    return this.lastExpressionData;
  }

  async bindFaceDataToPointCloud() {
    const keypoints = await this.faceMeshDetector.detectFace(this.webcamCanvas.canvas);
    if (keypoints.length === 0) return;
    
    // Store landmarks for expression analysis
    this.lastLandmarks = keypoints;
    
    // Analyze facial expressions using the enhanced analyzer
    const expressionData = await this.expressionAnalyzer.analyzeExpressions(
      this.webcamCanvas.canvas, 
      keypoints
    );
    
    this.lastExpressionData = expressionData;
    
    // Call the callback if it exists
    if (this.expressionUpdateCallback) {
      this.expressionUpdateCallback(expressionData);
    }
    
    const flatData = flattenFacialLandMarkArray(keypoints);
    const facePositions = createBufferAttribute(flatData);
    this.pointCloud.updateProperty(facePositions, 'position');
    
    // Apply colors
    if (this.useRealColors) {
      this.pointCloud.setRealColors(keypoints, this.webcamCanvas.canvas);
    } else if (!this.colorsInitialized) {
      this.pointCloud.setDefaultColors(keypoints.length);
      this.colorsInitialized = true;
    }
  }
  
  setPointSize(size: number) {
    this.pointCloud.setPointSize(size);
  }
  
  toggleColorMode(useRealColors: boolean) {
    this.useRealColors = useRealColors;
    this.colorsInitialized = false;
  }
  
  toggleVideoBackground(show: boolean) {
    const { scene } = this.setUpElements;
    
    if (show) {
      if (!this.videoBackground) {
        // Create a plane for the video
        const geometry = new THREE.PlaneGeometry(4, 3);
        const texture = this.threeSetUp.createVideoTexture(this.webcamCanvas.webcamVideo.videoTarget);
        const material = new THREE.MeshBasicMaterial({ 
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5
        });
        this.videoBackground = new THREE.Mesh(geometry, material);
        this.videoBackground.position.z = -1;
      }
      scene.add(this.videoBackground);
    } else if (this.videoBackground) {
      scene.remove(this.videoBackground);
    }
  }
  
  toggleGrid(show: boolean) {
    const { scene } = this.setUpElements;
    
    if (show) {
      scene.add(this.gridHelper);
    } else {
      scene.remove(this.gridHelper);
    }
  }

  async initWork() {
    const { camera, scene, renderer } = this.setUpElements;
    
    camera.position.z = 3;
    camera.position.y = 1;
    camera.lookAt(0, 0, 0);
    
    const orbitControlsUpdate = this.threeSetUp.applyOrbitControls();
    
    scene.add(this.gridHelper);
    scene.add(this.pointCloud.cloud);
    
    // Add ambient and directional light for better visualization
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    await this.faceMeshDetector.loadDetector();
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (this.webcamCanvas.receivingStreem) {
        this.bindFaceDataToPointCloud();
      }
      
      this.webcamCanvas.updateFromWebCam();
      orbitControlsUpdate();
      renderer.render(scene, camera);
    };
    
    animate();
  }
}

