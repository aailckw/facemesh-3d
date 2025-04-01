import FacePointCloud from './FacePointCloud';
import OpenAiService, { ExpressionAnalysis } from './OpenAiService';
import { createModelDownloadButton, setupFaceApiModelPath } from './downloadModels';

async function main() {
  const facePointCloud = new FacePointCloud();
  const openAiService = new OpenAiService();
  
  // Setup face-api model path handler
  setupFaceApiModelPath();
  
  // Create the model download button
  createModelDownloadButton();
  
  await facePointCloud.initWork();
  
  // Set up UI controls
  setupUIControls(facePointCloud);
  
  // Set up chat interface
  setupChatInterface(facePointCloud, openAiService);
  
  // Set up expression display
  setupExpressionDisplay(facePointCloud);
}

function setupUIControls(facePointCloud: FacePointCloud) {
  // Point size control
  const pointSizeSlider = document.getElementById('pointSize') as HTMLInputElement;
  const pointSizeValue = document.getElementById('pointSizeValue') as HTMLSpanElement;
  
  if (pointSizeSlider && pointSizeValue) {
    pointSizeSlider.addEventListener('input', (e) => {
      const size = parseFloat((e.target as HTMLInputElement).value);
      pointSizeValue.textContent = size.toFixed(2);
      facePointCloud.setPointSize(size);
    });
  }
  
  // Color mode toggle
  const useRealColorsToggle = document.getElementById('useRealColors') as HTMLInputElement;
  if (useRealColorsToggle) {
    useRealColorsToggle.addEventListener('change', (e) => {
      const useRealColors = (e.target as HTMLInputElement).checked;
      facePointCloud.toggleColorMode(useRealColors);
    });
  }
  
  // Video background toggle
  const showVideoToggle = document.getElementById('showVideo') as HTMLInputElement;
  if (showVideoToggle) {
    showVideoToggle.addEventListener('change', (e) => {
      const show = (e.target as HTMLInputElement).checked;
      facePointCloud.toggleVideoBackground(show);
    });
  }
  
  // Grid toggle
  const showGridToggle = document.getElementById('showGrid') as HTMLInputElement;
  if (showGridToggle) {
    showGridToggle.addEventListener('change', (e) => {
      const show = (e.target as HTMLInputElement).checked;
      facePointCloud.toggleGrid(show);
    });
  }
  
  // Expression display toggle
  const showExpressionsToggle = document.getElementById('showExpressions') as HTMLInputElement;
  const expressionDisplay = document.getElementById('expression-display');
  
  if (showExpressionsToggle && expressionDisplay) {
    showExpressionsToggle.addEventListener('change', (e) => {
      const show = (e.target as HTMLInputElement).checked;
      expressionDisplay.classList.toggle('hidden', !show);
    });
  }
}

function setupExpressionDisplay(facePointCloud: FacePointCloud) {
  const mouthValue = document.getElementById('mouth-value');
  const eyeValue = document.getElementById('eye-value');
  const smileValue = document.getElementById('smile-value');
  const pitchValue = document.getElementById('pitch-value');
  const yawValue = document.getElementById('yaw-value');
  const rollValue = document.getElementById('roll-value');
  
  // Emoji elements
  const mouthEmoji = document.getElementById('mouth-emoji');
  const eyeEmoji = document.getElementById('eye-emoji');
  const smileEmoji = document.getElementById('smile-emoji');
  
  facePointCloud.setExpressionUpdateCallback((data: ExpressionAnalysis) => {
    if (mouthValue) mouthValue.textContent = data.mouthOpenness.toFixed(2);
    if (eyeValue) eyeValue.textContent = data.eyeOpenness.toFixed(2);
    // Reverse the smile value for display while keeping the same scale in the UI
    const displaySmileLevel = 1 - data.smileLevel;
    if (smileValue) smileValue.textContent = displaySmileLevel.toFixed(2);
    if (pitchValue) pitchValue.textContent = data.headPose.pitch.toFixed(2);
    if (yawValue) yawValue.textContent = data.headPose.yaw.toFixed(2);
    if (rollValue) rollValue.textContent = data.headPose.roll.toFixed(2);
    
    // Update emojis based on expression values
    if (mouthEmoji) {
      if (data.mouthOpenness < 0.2) {
        mouthEmoji.textContent = '😐';
      } else if (data.mouthOpenness < 0.5) {
        mouthEmoji.textContent = '😮';
      } else {
        mouthEmoji.textContent = '😲';
      }
    }
    
    if (eyeEmoji) {
      if (data.eyeOpenness < 0.3) {
        eyeEmoji.textContent = '😑';
      } else if (data.eyeOpenness < 0.7) {
        eyeEmoji.textContent = '👁️';
      } else {
        eyeEmoji.textContent = '👁️‍🗨️';
      }
    }
    
    if (smileEmoji) {
      // Use the reversed smile level for emoji display
      if (displaySmileLevel < 0.3) {  // Low smile level
        smileEmoji.textContent = '😐';
      } else if (displaySmileLevel < 0.6) {  // Moderate smile
        smileEmoji.textContent = '🙂';
      } else if (displaySmileLevel < 0.85) {  // Big smile
        smileEmoji.textContent = '😊';
      } else {  // Very big smile
        smileEmoji.textContent = '😄';
      }
    }
  });
}

function setupChatInterface(facePointCloud: FacePointCloud, openAiService: OpenAiService) {
  const chatToggle = document.getElementById('chat-toggle');
  const chatContainer = document.getElementById('chat-container');
  const apiKeyContainer = document.getElementById('api-key-container');
  const chatInterface = document.getElementById('chat-interface');
  const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
  const saveApiKeyButton = document.getElementById('save-api-key');
  const chatForm = document.getElementById('chat-form') as HTMLFormElement;
  const messageInput = document.getElementById('message-input') as HTMLInputElement;
  const chatMessages = document.getElementById('chat-messages');
  const includeExpressionsToggle = document.getElementById('include-expressions') as HTMLInputElement;
  
  // Toggle chat visibility
  if (chatToggle && chatContainer) {
    chatToggle.addEventListener('click', () => {
      chatContainer.classList.toggle('hidden');
      
      if (!chatContainer.classList.contains('hidden')) {
        // Focus on the relevant input
        if (openAiService.isInitialized() && messageInput) {
          messageInput.focus();
        } else if (apiKeyInput) {
          apiKeyInput.focus();
        }
      }
    });
  }
  
  // Save API key
  if (saveApiKeyButton && apiKeyInput && apiKeyContainer && chatInterface) {
    saveApiKeyButton.addEventListener('click', () => {
      const apiKey = apiKeyInput.value.trim();
      
      if (!apiKey) {
        alert('Please enter a valid API key');
        return;
      }
      
      const success = openAiService.setApiKey(apiKey);
      
      if (success) {
        apiKeyContainer.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        
        // Add welcome message
        addMessage('Hello! I am your AI assistant. I can see your facial expressions and respond to your questions. How can I help you today?', 'ai');
        
        // Focus on message input
        if (messageInput) {
          messageInput.focus();
        }
      } else {
        alert('Failed to initialize OpenAI with the provided key. Please try again.');
      }
    });
  }
  
  // Send message
  if (chatForm && messageInput && chatMessages) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = messageInput.value.trim();
      if (!message) return;
      
      // Add user message to chat
      addMessage(message, 'user');
      
      // Clear input
      messageInput.value = '';
      
      // Get expression data if needed
      let expressionData = undefined;
      if (includeExpressionsToggle?.checked) {
        expressionData = facePointCloud.getLastExpressionData() || undefined;
      }
      
      // Show typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'message ai-message';
      typingIndicator.textContent = 'Typing...';
      chatMessages.appendChild(typingIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Get response from OpenAI
      const response = await openAiService.sendMessage(message, expressionData);
      
      // Remove typing indicator
      chatMessages.removeChild(typingIndicator);
      
      // Add AI response to chat
      addMessage(response, 'ai');
    });
  }
  
  // Function to add message to chat
  function addMessage(content: string, role: 'user' | 'ai') {
    if (!chatMessages) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}-message`;
    messageEl.textContent = content;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

window.addEventListener('DOMContentLoaded', main);

