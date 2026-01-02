
export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 for binary, raw for text
  isText: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AppState {
  files: ProjectFile[];
  messages: ChatMessage[];
  isGenerating: boolean;
  currentCode: string;
  previewCode: string; // The code to be injected into the preview iframe
  activeTab: 'code' | 'preview' | 'docs';
}
