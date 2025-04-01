import * as THREE from 'three';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
  [key: string]: any;
}

export interface Range {
  from: number;
  to: number;
}

export const screenRange: {
  width: Range;
  height: Range;
} = {
  width: { from: -1, to: 1 },
  height: { from: -1, to: 1 }
};

export const videoAspectRatio = 4/3;

export function mapRangeToRange(
  from: number, 
  point: number, 
  range: Range, 
  invert: boolean = false
): number {
  let pointMagnitude: number = point / from;
  if (invert) pointMagnitude = 1 - pointMagnitude;
  const targetMagnitude = range.to - range.from;
  const pointInRange = targetMagnitude * pointMagnitude + range.from;
  
  return pointInRange;
}

export function flattenFacialLandMarkArray(data: Vector3D[]): number[] {
  let array: number[] = [];
  data.forEach((el) => {
    // Convert from canvas coordinates to Three.js coordinates
    el.x = mapRangeToRange(500 / videoAspectRatio, el.x, screenRange.height) - 1;
    el.y = mapRangeToRange(500 / videoAspectRatio, el.y, screenRange.height, true) + 1;
    el.z = (el.z / 100 * -1) + 0.5;
    
    array = [
      ...array,
      ...Object.values(el),
    ];
  });
  return array.filter((el) => typeof el === 'number');
}

export function createBufferAttribute(data: number[]): THREE.BufferAttribute {
  return new THREE.Float32BufferAttribute(data, 3);
}

