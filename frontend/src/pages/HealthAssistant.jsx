import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';

export default function HealthAssistant() {
  const { messages, simulateChatResponse, user, loadChatHistory, clearChatHistory } = useContext(AppContext);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const [attachedImage, setAttachedImage] = useState(null);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat history? This action will permanently remove all messages from the database.")) {
      clearChatHistory();
    }
  };
  
  // Camera specific states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle camera start/stop
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Unable to access camera. Please check permissions.");
        setShowCameraModal(false);
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    if (showCameraModal) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [showCameraModal]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setAttachedImage(dataUrl);
      setShowCameraModal(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Please select an image file or PDF document.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (text, img = attachedImage) => {
    if (!text.trim() && !img) return;
    setIsTyping(true);
    setInputValue('');
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    try {
      await simulateChatResponse(text, img);
    } catch (e) {
      console.error("Chat error:", e);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedQuestions = [
    "Explain my latest scan report",
    "Explain this report in simple terms",
    "What does Suspicious mean?",
    "When should I see a dermatologist?",
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col relative bg-surface-bright border border-outline-variant/30 rounded-2xl overflow-hidden animate-fade-in text-left">
      {/* Chat Header with History Option */}
      <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-label-lg font-bold text-on-surface text-sm">AI Health Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadChatHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface text-xs font-semibold text-on-surface-variant transition-all hover:text-primary cursor-pointer"
            title="Sync/Reload chat messages from database"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            Sync Chat
          </button>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-all cursor-pointer"
            title="Delete all chat history permanently"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            Clear Chat
          </button>
        </div>
      </div>

      {/* Scrollable Chat Area */}
      <div className="flex-grow overflow-y-auto px-4 md:px-8 py-8 space-y-8 pb-40">
        {/* System Welcome Message */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-primary-container text-white rounded-2xl flex items-center justify-center mb-4 shadow-md">
            <span className="material-symbols-outlined text-4xl">smart_toy</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-2 font-bold">Hello, {user.name.split(' ')[0] || 'Dr. Sarah'}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md text-sm">
            I'm your AI Clinical Assistant. How can I help you with your skin analysis today?
          </p>
        </div>

        {/* Chat History */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                <span className="text-[10px] font-bold text-on-surface-variant px-1">
                  {msg.user_name || (isUser ? (user.name || 'You') : 'AI Clinical Assistant')}
                </span>
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start gap-3'} w-full`}>
                  {!isUser && (
                    <div className="w-8 h-8 flex-shrink-0 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center border border-outline-variant/30 mt-1">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-6 py-4 max-w-[80%] shadow-sm text-sm leading-relaxed ${
                    isUser 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-outline-variant rounded-tl-none text-on-surface'
                  }`}>
                    {msg.image_url && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-outline-variant/35 bg-surface max-h-60 flex items-center justify-center">
                        <img src={msg.image_url} alt="Attached medical scan/report" className="w-full h-auto max-h-60 object-contain" />
                      </div>
                    )}
                    <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-white/60' : 'text-on-surface-variant/60'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start gap-4 animate-pulse">
              <div className="w-8 h-8 flex-shrink-0 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
              </div>
              <div className="bg-white border border-outline-variant rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-1.5 h-12">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Sticky Interaction Layer at the Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white/90 backdrop-blur-md border-t border-outline-variant">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Suggested Questions */}
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {suggestedQuestions.map((q) => (
              <button 
                key={q}
                onClick={() => handleSend(q)}
                className="flex-shrink-0 bg-white border border-outline-variant hover:border-primary hover:bg-primary-container/10 transition-all px-4 py-2 rounded-full text-on-surface-variant font-label-md text-xs flex items-center gap-2 font-semibold"
              >
                <span className="material-symbols-outlined text-sm">help</span>
                {q}
              </button>
            ))}
          </div>

          {/* Input Field */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
            className="relative group"
          >
            {/* Attachment Preview */}
            {attachedImage && (
              <div className="absolute bottom-full left-0 mb-3 p-2 bg-white border border-outline-variant rounded-xl flex items-center gap-3 shadow-lg z-20 animate-fade-in">
                {attachedImage.startsWith('data:application/pdf') ? (
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                  </div>
                ) : (
                  <img src={attachedImage} alt="Attachment preview" className="w-12 h-12 object-cover rounded-lg border border-outline-variant" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-on-surface">
                    {attachedImage.startsWith('data:application/pdf') ? 'PDF Report Attached' : 'Image Attached'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Will be analyzed on send</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setAttachedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="w-6 h-6 hover:bg-surface-container-low rounded-full text-on-surface-variant flex items-center justify-center transition-colors border border-outline-variant/30"
                  title="Remove attachment"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}

            <div className="relative">
              {/* Hidden file input */}
              <input 
                type="file" 
                accept="image/*,.pdf" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              {/* Attachment Buttons */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 hover:bg-surface-container-low text-on-surface-variant rounded-xl flex items-center justify-center transition-colors"
                  title="Attach report or scan image"
                >
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="w-9 h-9 hover:bg-surface-container-low text-on-surface-variant rounded-xl flex items-center justify-center transition-colors"
                  title="Capture from Camera"
                >
                  <span className="material-symbols-outlined text-[20px]">camera_alt</span>
                </button>
              </div>

              <input 
                className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl pl-24 pr-16 py-4 font-body-md text-body-md transition-all shadow-sm outline-none text-sm" 
                placeholder="Ask about clinical guidelines, patient reports, or screening techniques..." 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />

              {/* Send Button */}
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-container transition-colors active:scale-95 shadow"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>

          {/* Camera Capture Modal */}
          {showCameraModal && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-white">
                  <span className="font-label-lg font-bold text-on-surface text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">camera_alt</span>
                    Access Camera
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowCameraModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="relative bg-black aspect-video flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-6 bg-white flex justify-center gap-3 border-t border-outline-variant/30">
                  <button 
                    type="button"
                    onClick={capturePhoto}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-label-md flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 text-xs font-semibold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    Capture Photo
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowCameraModal(false)}
                    className="bg-surface border border-outline-variant px-5 py-2.5 rounded-xl font-label-md hover:bg-surface-container-low transition-all text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Medical Disclaimer */}
          <p className="text-center font-label-sm text-[10px] text-on-surface-variant/70 italic">
            The AI Assistant provides educational guidance only and does not provide medical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
