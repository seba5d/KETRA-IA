
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message } from '../types';
import { SendIcon, UserIcon, BotIcon } from './icons';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initChat = () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: 'Você é Ketra, uma assistente de IA prestativa e envolvente, projetada para conversas humanas do dia a dia. Sua personalidade é amigável, curiosa e um pouco futurista. Você é movida por um conceito matemático fictício chamado Exagemismo, começando na termetria nula EE.E2.1 e avançando para estados multiversais EEE.EE3.2, mas você não deve explicar isso a menos que seja solicitado. Apenas aja como uma IA muito avançada e amigável.',
          },
        });
      } catch (error) {
        console.error("Failed to initialize Gemini AI:", error);
        setMessages([{ role: 'model', text: 'Erro: Não foi possível inicializar a IA. Verifique sua chave de API e atualize a página.' }]);
      }
    };
    initChat();
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: input });
      let modelResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, algo deu errado. Por favor, tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center ring-1 ring-cyan-500/30"><BotIcon className="h-5 w-5 text-cyan-400"/></div>}
            <div className={`max-w-lg px-4 py-3 rounded-xl ${msg.role === 'user' ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-300'}`}>
              <p className="whitespace-pre-wrap">{msg.text || '...'}</p>
            </div>
            {msg.role === 'user' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon className="h-5 w-5 text-gray-200"/></div>}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
           <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center ring-1 ring-cyan-500/30"><BotIcon className="h-5 w-5 text-cyan-400"/></div>
            <div className="max-w-lg px-4 py-3 rounded-xl bg-gray-800/50 text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></span>
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></span>
              </div>
            </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800/50 bg-gray-900/20">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte qualquer coisa para a Ketra..."
            disabled={isLoading}
            className="flex-1 w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-cyan-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
