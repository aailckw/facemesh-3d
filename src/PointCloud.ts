import * as THREE from 'three';

export default class PointCloud {
  bufferGeometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  cloud: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  
  constructor() {
    this.bufferGeometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.0151,
      sizeAttenuation: true,
    });
    this.cloud = new THREE.Points(this.bufferGeometry, this.material);
  }

  updateProperty(attribute: THREE.BufferAttribute, name: string) {
    this.bufferGeometry.setAttribute(
      name,
      attribute
    );
    this.bufferGeometry.attributes[name].needsUpdate = true;
  }

  setDefaultColors(pointsCount: number) {
    const colors = new Float32Array(pointsCount * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < pointsCount; i++) {
      // Map colors based on position (front to back)
      const z = i / pointsCount;
      color.setHSL(0.6 - z * 0.5, 1.0, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    this.updateProperty(new THREE.Float32BufferAttribute(colors, 3), 'color');
  }
  
  setRealColors(points: Array<{x: number, y: number}>, canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colors = new Float32Array(points.length * 3);
    
    for (let i = 0; i < points.length; i++) {
      // Convert the 3D point coordinates back to canvas space
      const x = Math.floor(((points[i].x + 1) / 2) * canvas.width);
      const y = Math.floor(((1 - (points[i].y - 1) / 2)) * canvas.height);
      
      // Get pixel color (ensure we don't go out of bounds)
      const pixelX = Math.max(0, Math.min(x, canvas.width - 1));
      const pixelY = Math.max(0, Math.min(y, canvas.height - 1));
      const pixelIndex = (pixelY * canvas.width + pixelX) * 4;
      
      // RGB values
      colors[i * 3] = data[pixelIndex] / 255;
      colors[i * 3 + 1] = data[pixelIndex + 1] / 255;
      colors[i * 3 + 2] = data[pixelIndex + 2] / 255;
    }
    
    this.updateProperty(new THREE.Float32BufferAttribute(colors, 3), 'color');
  }
  
  setPointSize(size: number) {
    this.material.size = size / 100;
    this.material.needsUpdate = true;
  }
}

