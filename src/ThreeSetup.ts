import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Sizes {
  width: number;
  height: number;
}

export default class ThreeSetup {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private sizes: Sizes;

  constructor() {
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x121212);

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  getSetup() {
    return {
      camera: this.camera,
      scene: this.scene,
      renderer: this.renderer,
      sizes: this.sizes
    };
  }

  applyOrbitControls() {
    const controls = new OrbitControls(
      this.camera, this.renderer.domElement
    );
    controls.enableDamping = true;
    return () => controls.update();
  }
  
  createVideoTexture(videoElement: HTMLVideoElement): THREE.VideoTexture {
    const texture = new THREE.VideoTexture(videoElement);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    return texture;
  }
}

