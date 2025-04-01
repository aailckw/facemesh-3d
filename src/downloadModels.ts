/**
 * This file provides a way to download face-api.js models
 * It creates a button that will trigger the download
 */

const MODELS_PATH = 'models';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const MODELS = [
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

// Define interfaces for the IndexedDB objects
interface IDBModel {
  name: string;
  data: Blob;
}

type IDBDatabase = globalThis.IDBDatabase;

export function createModelDownloadButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = 'Download Face-API Models';
  btn.style.position = 'fixed';
  btn.style.bottom = '70px';
  btn.style.left = '10px';
  btn.style.zIndex = '101';
  btn.style.padding = '5px 10px';
  btn.style.background = 'rgba(0, 0, 0, 0.5)';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '5px';
  btn.style.cursor = 'pointer';
  
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Downloading...';
    
    try {
      await downloadModels();
      btn.textContent = 'Models Downloaded!';
      setTimeout(() => {
        btn.textContent = 'Download Face-API Models';
        btn.disabled = false;
      }, 3000);
    } catch (error) {
      console.error('Failed to download models:', error);
      btn.textContent = 'Download Failed';
      setTimeout(() => {
        btn.textContent = 'Download Face-API Models';
        btn.disabled = false;
      }, 3000);
    }
  });
  
  document.body.appendChild(btn);
  return btn;
}

async function downloadModels(): Promise<void> {
  try {
    // Use IndexedDB to store the models
    const db = await openModelsDatabase();
    
    for (const model of MODELS) {
      const url = `${GITHUB_RAW_URL}/${model}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download ${model}: ${response.statusText}`);
      }
      
      // Convert the response to a blob
      const blob = await response.blob();
      
      // Save to IndexedDB
      await saveModelToIndexedDB(db, model, blob);
      
      console.log(`Downloaded and saved ${model}`);
    }
    
    console.log('All models downloaded and saved!');
  } catch (error) {
    console.error('Error downloading models:', error);
    throw error;
  }
}

function openModelsDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('face-api-models', 1);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('models', { keyPath: 'name' });
    };
    
    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
}

function saveModelToIndexedDB(db: IDBDatabase, name: string, blob: Blob): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('models', 'readwrite');
    const store = transaction.objectStore('models');
    
    const request = store.put({ name, data: blob } as IDBModel);
    
    request.onerror = () => reject(new Error(`Failed to save model ${name}`));
    request.onsuccess = () => resolve();
  });
}

export function setupFaceApiModelPath(): void {
  // Override the fetch function to check IndexedDB first
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Only intercept requests to the models path
    if (typeof input === 'string' && input.startsWith(MODELS_PATH)) {
      try {
        const modelName = input.substring(input.lastIndexOf('/') + 1);
        const db = await openModelsDatabase();
        const model = await getModelFromIndexedDB(db, modelName);
        
        if (model) {
          console.log(`Using cached model: ${modelName}`);
          return new Response(model.data);
        }
      } catch (error) {
        console.warn('Failed to get model from IndexedDB:', error);
      }
    }
    
    // Fall back to the original fetch implementation
    return originalFetch.call(window, input, init);
  };
}

function getModelFromIndexedDB(db: IDBDatabase, name: string): Promise<IDBModel | undefined> {
  return new Promise<IDBModel | undefined>((resolve, reject) => {
    const transaction = db.transaction('models', 'readonly');
    const store = transaction.objectStore('models');
    
    const request = store.get(name);
    
    request.onerror = () => reject(new Error(`Failed to get model ${name}`));
    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBRequest<IDBModel>).result);
    };
  });
} 