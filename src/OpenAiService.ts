export interface ExpressionAnalysis {
  mouthOpenness: number;
  eyeOpenness: number;
  smileLevel: number;
  headPose: {
    pitch: number;
    yaw: number;
    roll: number;
  }
}

type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  role: MessageRole;
  content: string;
}

export default class OpenAiService {
  private apiKey: string = '';
  private chatHistory: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant integrated with a face mesh point cloud application. You can respond to user queries and also react to their facial expressions.'
    }
  ];
  
  constructor() {
    // The API key will be set by user input
  }
  
  setApiKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    this.apiKey = key;
    return true;
  }
  
  isInitialized(): boolean {
    return !!this.apiKey;
  }
  
  async sendMessage(message: string, expressionData?: ExpressionAnalysis): Promise<string> {
    if (!this.apiKey) {
      return 'Please set your OpenAI API key first.';
    }
    
    let enhancedMessage = message;
    
    // If expression data is provided, include it in the message
    if (expressionData) {
      const expressionInfo = `
[Facial Expression Data]
- Mouth openness: ${expressionData.mouthOpenness.toFixed(2)}
- Eye openness: ${expressionData.eyeOpenness.toFixed(2)}
- Smile level: ${expressionData.smileLevel.toFixed(2)}
- Head pose: pitch ${expressionData.headPose.pitch.toFixed(2)}, yaw ${expressionData.headPose.yaw.toFixed(2)}, roll ${expressionData.headPose.roll.toFixed(2)}
`;
      enhancedMessage = `${message}\n\n${expressionInfo}`;
    }
    
    // Add the user message to history
    this.chatHistory.push({
      role: 'user',
      content: enhancedMessage
    });
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: this.chatHistory,
          max_tokens: 150
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        return `Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`;
      }
      
      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'No response from OpenAI.';
      
      // Add the assistant response to history
      this.chatHistory.push({
        role: 'assistant',
        content: assistantMessage
      });
      
      // Keep chat history at a reasonable size
      if (this.chatHistory.length > 10) {
        // Keep the system prompt and the last 9 messages
        this.chatHistory = [
          this.chatHistory[0],
          ...this.chatHistory.slice(this.chatHistory.length - 9)
        ];
      }
      
      return assistantMessage;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return 'Sorry, there was an error communicating with OpenAI.';
    }
  }
  
  clearHistory() {
    this.chatHistory = [this.chatHistory[0]]; // Keep the system prompt
  }
} 