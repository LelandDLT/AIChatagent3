import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';

const SUPABASE_URL = "https://mlknnafbxaevonupiblt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa25uYWZieGFldm9udXBpYmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4NTIwMTcsImV4cCI6MjA1MzQyODAxN30.BiDuXhGOArdzPUexfjpZSfaMCih8qL8lAqvdfa4ESvA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function ChatInterface() {
  const [messages, setMessages] = useState<Array<any>>([]);
  const [input, setInput] = useState('');
  const [session, setSession] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'dark'|'light'>('light');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentication handlers
  const handleSignUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  };

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    setSession(null);
  };

  // Message handling
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = {
      text: input,
      dateTimeISO: new Date().toISOString(),
      speaker: 'User'
    };

    setMessages(prev => [...prev, newMessage]);
    
    if (session?.user) {
      const { data, error } = await supabase
        .from('MessagesTable')
        .upsert(
          { user_id: session.user.id, chat_messages: [newMessage] },
          { onConflict: 'user_id', ignoreDuplicates: false }
        );
        
      if (error) console.error('Message save error:', error);
    }

    setInput('');
  };

  // Theme handling
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-purple-900' : 'bg-amber-50'}`}>
      {/* Auth buttons */}
      <div className="flex justify-end gap-2 mb-4">
        {!session ? (
          <>
            <button onClick={() => handleSignIn('test@example.com', 'password')} 
              className="px-4 py-2 bg-blue-500 text-white rounded">
              Sign In
            </button>
            <button onClick={() => handleSignUp('test@example.com', 'password')} 
              className="px-4 py-2 bg-green-500 text-white rounded">
              Sign Up
            </button>
          </>
        ) : (
          <button onClick={handleSignOut} 
            className="px-4 py-2 bg-red-500 text-white rounded">
            Sign Out
          </button>
        )}
      </div>

      {/* Chat messages */}
      <div className="h-96 overflow-y-auto mb-4 p-2 rounded-lg bg-white bg-opacity-50">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 p-2 rounded-lg ${msg.speaker === 'User' ? 'ml-auto bg-blue-100' : 'mr-auto bg-gray-100'}`}>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
            <div className="text-xs text-gray-500 mt-1">{new Date(msg.dateTimeISO).toLocaleString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-2 border rounded"
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-purple-600 text-white rounded">
          Send
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-purple-800' : 'bg-white'}`}>
            {/* Settings content */}
            <button onClick={() => setShowSettings(false)} className="float-right">
              ✕
            </button>
            <h2 className="text-xl mb-4">Settings</h2>
            {/* Theme selection */}
            <div className="mb-4">
              <label className="block mb-2">Theme:</label>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value as 'dark'|'light')}
                className="p-2 rounded border"
              >
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
