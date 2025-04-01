# Real-time Face Mesh Point Cloud

This project implements a real-time face mesh point cloud visualization using Three.js, TensorFlow.js, and TypeScript.

## Features

- Real-time face tracking using TensorFlow.js
- 3D point cloud visualization using Three.js
- Camera access for face tracking
- OrbitControls for interactive view manipulation

## Technologies Used

- Three.js for 3D rendering
- TensorFlow.js and MediaPipe for face tracking
- TypeScript for type-safe development
- Webpack for bundling

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm start
```

4. Open your browser at http://localhost:4000

## Usage

- Allow camera access when prompted
- The application will initialize the face tracking model
- Your face will be represented as a 3D point cloud
- Use mouse to orbit around the point cloud:
  - Left click and drag to rotate
  - Right click and drag to pan
  - Scroll to zoom

## Credits

Based on the tutorial by TECHTEE, "Real-time face mesh point cloud with Three.JS, Tensorflow.js and Typescript". # facemesh-3d

A real-time 3D face mesh visualization with expression analysis using Three.js, TensorFlow.js, and face-api.js
