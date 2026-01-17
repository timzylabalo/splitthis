import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ReceiptView } from './components/ReceiptView';
import { ChatInterface } from './components/ChatInterface';
import { SummaryPanel } from './components/SummaryPanel';
import { AttendeeSetup } from './components/AttendeeSetup';
import { ShareModal } from './components/ShareModal';
import { ReceiptData, ChatMessage } from './types';
import { fileToGenerativePart, parseReceiptImage, processChatCommand } from './services/geminiService';
import { Split, RotateCcw, QrCode, Users } from 'lucide-react';

type AppStep = 'upload' | 'attendees' | 'split';

// Helper to generate a random 4-char code
const generateSessionCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function App() {
  const [step, setStep] = useState<AppStep>('upload');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sessionCode, setSessionCode] = useState<string>('');
  
  // Join Session State
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleImageSelected = async (file: File) => {
    setIsLoading(true);
    try {
      const base64Data = await fileToGenerativePart(file);
      const parsedReceipt = await parseReceiptImage(base64Data, file.type);
      setReceipt(parsedReceipt);
      setStep('attendees');
    } catch (error) {
      alert("Failed to process receipt. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAttendee = (name: string) => {
    if (!attendees.includes(name)) {
      setAttendees(prev => [...prev, name]);
    }
  };

  const handleRemoveAttendee = (name: string) => {
    setAttendees(prev => prev.filter(a => a !== name));
  };

  const startSplitting = () => {
    const code = generateSessionCode();
    setSessionCode(code);
    setStep('split');
    if (receipt) {
        setMessages([{
            id: 'init',
            sender: 'bot',
            text: `Session ${code} started! I see ${attendees.length} people. Assign items on the left or tell me who had what.`,
            timestamp: new Date()
        }]);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!receipt) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsChatProcessing(true);

    try {
      const result = await processChatCommand(receipt, text, attendees);
      
      if (result.updatedReceipt) {
        setReceipt(result.updatedReceipt);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: result.message,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Sorry, I had trouble processing that. Could you try again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleManualAssignment = (itemId: string, assignedTo: string[]) => {
    if (!receipt) return;
    const updatedItems = receipt.items.map(item => 
      item.id === itemId ? { ...item, assignedTo } : item
    );
    setReceipt({ ...receipt, items: updatedItems });
  };

  const handleReset = () => {
    setReceipt(null);
    setMessages([]);
    setAttendees([]);
    setStep('upload');
    setSessionCode('');
    setJoinCode('');
  };

  const handleJoinSession = (e: React.FormEvent) => {
      e.preventDefault();
      // Since there is no backend, we just simulate a loading state
      if (!joinCode.trim()) return;
      setIsJoining(true);
      setTimeout(() => {
          setIsJoining(false);
          alert("Multiplayer Syncing requires a database backend. In this demo version, please use the host device to split the bill.");
      }, 1000);
  };

  return (
    <div className="h-screen flex flex-col font-sans text-gray-900 bg-gray-100">
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Split className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
            splitbills.online
          </h1>
        </div>
        
        <div className="flex gap-2 items-center">
            {step === 'split' && (
             <button 
                onClick={() => setShowShareModal(true)}
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 flex items-center gap-1 transition-colors px-3 py-1 bg-gray-100 rounded-lg hover:bg-indigo-50 mr-1"
            >
                <QrCode className="w-4 h-4" /> 
                <span className="hidden sm:inline">Share</span>
            </button>
            )}

            {step === 'split' && (
                <button 
                  onClick={() => setStep('attendees')}
                  className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-3 py-1"
                >
                  <UsersIcon className="w-4 h-4" /> <span className="hidden sm:inline">People</span>
                </button>
            )}
            {(step !== 'upload') && (
            <button 
                onClick={handleReset}
                className="text-sm font-medium text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors px-3 py-1"
            >
                <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Reset</span>
            </button>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-gray-50">
        <div className="h-full w-full overflow-y-auto lg:overflow-hidden">
            
            {/* Step 1: Upload & Join */}
            {step === 'upload' && (
            <div className="min-h-full flex flex-col justify-center p-4 md:p-8 overflow-y-auto">
                <div className="w-full max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12 items-start md:items-stretch py-4">
                    
                    {/* Left: Upload Section */}
                    <div className="flex flex-col gap-6">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                                Split bills, <br/><span className="text-indigo-600">keep friends.</span>
                            </h2>
                            <p className="text-gray-500 text-lg md:text-xl font-light">
                                Upload a receipt, add friends, and let AI do the math.
                            </p>
                        </div>
                        
                        <div className="flex-1 shadow-2xl shadow-indigo-100 rounded-2xl overflow-hidden bg-white">
                            <ImageUploader onImageSelected={handleImageSelected} isLoading={isLoading} />
                        </div>
                    </div>

                    {/* Right: Join Section */}
                    <div className="flex flex-col justify-center h-full">
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-center relative overflow-hidden">
                             {/* Decorative blob */}
                             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-purple-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

                             <div className="relative z-10 mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mb-4 shadow-sm">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Joining a bill?</h3>
                                <p className="text-gray-500">Enter the 4-digit session code.</p>
                             </div>
                             
                             <form onSubmit={handleJoinSession} className="relative z-10 flex gap-3">
                                <input 
                                    type="text" 
                                    placeholder="A4F2"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    maxLength={4}
                                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-xl font-mono font-bold rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 block w-full p-4 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 outline-none transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={!joinCode || isJoining}
                                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-4 font-bold transition-all disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-xl"
                                >
                                    {isJoining ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                    ) : (
                                        <ArrowRightIcon className="w-6 h-6" />
                                    )}
                                </button>
                             </form>
                        </div>
                        
                        {/* Mobile-only spacer for scrolling */}
                        <div className="h-8 md:hidden"></div>
                    </div>
                </div>
            </div>
            )}

            {/* Step 2: Attendees */}
            {step === 'attendees' && (
                <div className="h-full flex flex-col justify-center items-center p-4 bg-gray-50 overflow-y-auto">
                    <AttendeeSetup 
                        attendees={attendees}
                        onAddAttendee={handleAddAttendee}
                        onRemoveAttendee={handleRemoveAttendee}
                        onContinue={startSplitting}
                    />
                </div>
            )}

            {/* Step 3: Split View */}
            {step === 'split' && receipt && (
            <div className="h-full flex flex-col lg:grid lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-y-auto lg:overflow-hidden">
                
                {/* Left: Receipt (4 cols) */}
                <div className="lg:col-span-4 min-h-[500px] lg:h-full flex flex-col">
                    <ReceiptView 
                        data={receipt} 
                        attendees={attendees} 
                        onAssignItem={handleManualAssignment}
                        sessionCode={sessionCode}
                    />
                </div>

                {/* Middle: Chat (5 cols) */}
                <div className="lg:col-span-5 min-h-[500px] lg:h-full flex flex-col">
                    <ChatInterface 
                        messages={messages} 
                        onSendMessage={handleSendMessage} 
                        isProcessing={isChatProcessing} 
                    />
                </div>

                {/* Right: Summary (3 cols) */}
                <div className="lg:col-span-3 min-h-[300px] lg:h-full flex flex-col">
                    <SummaryPanel receipt={receipt} />
                </div>
            </div>
            )}
        </div>
      </main>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    )
}

// Simple helper icon component for the header
function UsersIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    );
}