
import React, { useState, useRef, useEffect } from 'react';
import { ProjectFile, ChatMessage, AppState } from './types';
import { generateProjectResponse } from './geminiService';
import { FileItem, ChatBubble, LoadingIndicator } from './components';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    files: [],
    messages: [
      {
        role: 'model',
        text: "I'm ready to build. Upload your assets or describe your app/game, and I will generate the complete, functional code for you to preview immediately.",
        timestamp: Date.now()
      }
    ],
    isGenerating: false,
    currentCode: '',
    previewCode: '',
    activeTab: 'preview' // Default to preview to show the "real" result
  });

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, state.isGenerating]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: ProjectFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isText = file.type.startsWith('text/') || 
                     file.name.endsWith('.ts') || 
                     file.name.endsWith('.tsx') || 
                     file.name.endsWith('.js') || 
                     file.name.endsWith('.json') || 
                     file.name.endsWith('.md') ||
                     file.name.endsWith('.css');

      const reader = new FileReader();
      const content = await new Promise<string>((resolve) => {
        reader.onload = () => {
          if (isText) {
            resolve(reader.result as string);
          } else {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          }
        };
        if (isText) reader.readAsText(file);
        else reader.readAsDataURL(file);
      });

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        content,
        isText
      });
    }

    setState(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setState(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
  };

  const handleSend = async () => {
    if (!input.trim() || state.isGenerating) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isGenerating: true
    }));
    setInput('');

    try {
      const responseText = await generateProjectResponse(input, state.messages, state.files);
      
      const modelMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      // Extract HTML/Preview code block
      const htmlMatch = responseText.match(/```html\n([\s\S]*?)```/i);
      const previewCode = htmlMatch ? htmlMatch[1] : '';
      
      // General code extraction for display
      const allCodeMatches = responseText.match(/```(?:[\w]*)\n([\s\S]*?)```/g);
      const fullCode = allCodeMatches ? allCodeMatches.join('\n\n') : '';

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, modelMsg],
        isGenerating: false,
        currentCode: fullCode || prev.currentCode,
        previewCode: previewCode || prev.previewCode,
        activeTab: previewCode ? 'preview' : (fullCode ? 'code' : prev.activeTab)
      }));
    } catch (error) {
      console.error("Generation error:", error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        messages: [...prev.messages, {
          role: 'model',
          text: "Error generating project. Please check console for details.",
          timestamp: Date.now()
        }]
      }));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar - Context & Files */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
            </div>
            <h1 className="font-bold text-lg tracking-tight">AI Forge</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Assets & Context</h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 px-2 py-1 rounded transition-colors"
              >
                + Upload
              </button>
              <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
            {state.files.length === 0 ? (
              <div className="text-center p-6 border-2 border-dashed border-slate-800 rounded-lg">
                <p className="text-xs text-slate-600">Provide context (PDFs, images, code) for the AI.</p>
              </div>
            ) : (
              state.files.map(file => (
                <FileItem key={file.id} file={file} onDelete={removeFile} />
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="text-[10px] text-slate-600 mb-2">ARCHITECT CORE</div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <span>Gemini 3 Pro Active</span>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/30">
          <div className="flex space-x-4">
            {(['preview', 'code', 'docs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab }))}
                className={`text-sm font-medium px-4 py-2 rounded-md transition-all ${
                  state.activeTab === tab 
                    ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab === 'preview' ? 'Live Preview' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex">
          {/* Main Visualizer */}
          <div className="flex-1 bg-slate-950 overflow-hidden">
            {state.activeTab === 'preview' && (
              <div className="h-full w-full bg-slate-900 flex flex-col">
                {state.previewCode ? (
                  <iframe
                    title="AI Render"
                    srcDoc={state.previewCode}
                    className="w-full h-full border-none bg-white"
                    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-600 flex-col space-y-4">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700">
                      <svg className="w-10 h-10 animate-spin text-indigo-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <p className="text-sm font-medium tracking-wide">Awaiting your command to architect the live preview.</p>
                  </div>
                )}
              </div>
            )}

            {state.activeTab === 'code' && (
              <div className="h-full p-6 overflow-auto">
                {state.currentCode ? (
                  <pre className="code-font text-sm leading-relaxed text-indigo-200/90 bg-slate-900/80 p-6 rounded-xl border border-slate-800 whitespace-pre-wrap">
                    {state.currentCode}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-700">
                    <p>No source code generated yet.</p>
                  </div>
                )}
              </div>
            )}

            {state.activeTab === 'docs' && (
              <div className="h-full p-8 overflow-auto prose prose-invert max-w-none">
                <h2 className="text-indigo-400">Implementation Strategy</h2>
                <div className="text-slate-400 space-y-4">
                  <p>The AI Architect processes your requests by generating standalone HTML files containing all logic and styling. This allows for instant deployment and testing.</p>
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                    <h4 className="text-indigo-300 font-bold m-0 mb-2">Current Context Stats:</h4>
                    <ul className="text-xs m-0">
                      <li>Files Uploaded: {state.files.length}</li>
                      <li>Total Tokens Consumed: ~{state.messages.reduce((acc, m) => acc + m.text.length, 0)} (Est)</li>
                      <li>Engine: Gemini 3 Pro (Experimental)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="w-[420px] border-l border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              {state.messages.map((msg, idx) => (
                <ChatBubble key={idx} message={msg} />
              ))}
              {state.isGenerating && <LoadingIndicator />}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe your app or game in detail..."
                  className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none min-h-[80px] transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || state.isGenerating}
                  className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-transform active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
