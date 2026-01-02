
import React from 'react';
import { ProjectFile, ChatMessage } from './types';

export const FileItem: React.FC<{ file: ProjectFile; onDelete: (id: string) => void }> = ({ file, onDelete }) => (
  <div className="flex items-center justify-between p-2 mb-2 rounded bg-slate-800 border border-slate-700 hover:border-indigo-500 transition-colors group">
    <div className="flex items-center overflow-hidden">
      <div className="mr-2 text-indigo-400">
        {file.isText ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        )}
      </div>
      <span className="text-sm truncate font-medium text-slate-300">{file.name}</span>
    </div>
    <button 
      onClick={() => onDelete(file.id)}
      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  </div>
);

export const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => (
  <div className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
      message.role === 'user' 
        ? 'bg-indigo-600 text-white rounded-tr-none' 
        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
    }`}>
      <div className="text-xs opacity-50 mb-1 font-bold uppercase tracking-wider">
        {message.role === 'user' ? 'You' : 'Architect AI'}
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {message.text}
      </div>
    </div>
  </div>
);

export const LoadingIndicator: React.FC = () => (
  <div className="flex items-center space-x-2 p-4 animate-pulse">
    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    <span className="text-sm text-indigo-400 font-medium ml-2">Architecting solution...</span>
  </div>
);
