import React, { createContext, useState, useEffect } from 'react';
import { onAuthChange, getIdToken, logoutUser } from '../services/firebase';
import { verifyAuth, getScans, sendChatMessage, getChatHistory, deleteChatHistory, deleteScan } from '../services/api';

export const AppContext = createContext();

const initialMessages = [
  {
    id: 1,
    sender: "assistant",
    text: "Hello! I am your DermaScreen AI assistant. I can help answer questions about your skin scan reports, provide general skincare advice, or explain terms in your screening results. How can I assist you today?",
    time: "10:30 AM"
  }
];

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    isLoggedIn: false,
    firebaseUser: null,
  });

  const [scans, setScans] = useState(() => {
    const saved = localStorage.getItem("dermascreen_scans");
    return saved ? JSON.parse(saved) : [];
  });
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("dermascreen_messages");
    return saved ? JSON.parse(saved) : initialMessages;
  });
  const [currentScan, setCurrentScan] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sync scans to localStorage whenever scans state changes
  useEffect(() => {
    if (scans.length > 0) {
      localStorage.setItem("dermascreen_scans", JSON.stringify(scans));
    }
  }, [scans]);

  // ─────────────────── Firebase Auth Listener ───────────────────
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token and verify with backend
          const idToken = await firebaseUser.getIdToken();
          const backendUser = await verifyAuth(idToken);

          setUser({
            id: backendUser.id,
            name: firebaseUser.displayName || backendUser.name || firebaseUser.email.split("@")[0],
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || backendUser.avatar_url || "",
            isLoggedIn: true,
            firebaseUser: firebaseUser,
          });

          // Load scans from backend
          try {
            const scanData = await getScans();
            if (scanData.scans && scanData.scans.length > 0) {
              const backendScans = scanData.scans.map(s => ({
                id: s.scan_id,
                date: s.date || s.created_at,
                created_at: s.created_at,
                condition: s.condition,
                confidence: s.confidence,
                risk: s.risk,
                status: s.status,
                image: s.image_url,
                notes: s.notes || "",
              }));
              
              setScans(prev => {
                // Merge backend scans with any locally cached scans avoiding duplicates
                const existingIds = new Set(backendScans.map(b => b.id));
                const localOnly = prev.filter(p => !existingIds.has(p.id));
                const combined = [...backendScans, ...localOnly];
                localStorage.setItem("dermascreen_scans", JSON.stringify(combined));
                return combined;
              });
            }
          } catch (err) {
            console.warn("Could not load scans from backend:", err.message);
          }

          // Load chat history from backend
          try {
            const chatHistory = await getChatHistory();
            if (chatHistory && chatHistory.length > 0) {
              setMessages(chatHistory.map((m, idx) => ({
                id: idx + 1,
                sender: m.sender,
                text: m.text,
                time: m.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              })));
            }
          } catch (err) {
            console.warn("Could not load chat history from backend:", err.message);
          }
        } catch (err) {
          console.warn("Backend verification failed:", err.message);
          // Still set user as logged in even if backend is down
          setUser({
            name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || "",
            isLoggedIn: true,
            firebaseUser: firebaseUser,
          });
        }
      } else {
        setUser({
          name: "",
          email: "",
          avatar: "",
          isLoggedIn: false,
          firebaseUser: null,
        });
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("dermascreen_messages", JSON.stringify(messages));
  }, [messages]);

  const login = (email, password) => {
    // This is now handled by Firebase — see Auth.jsx
    // Keeping for backward compatibility
    setUser({
      name: email.split("@")[0],
      email: email,
      avatar: "",
      isLoggedIn: true,
      firebaseUser: null,
    });
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser({
      name: "",
      email: "",
      avatar: "",
      isLoggedIn: false,
      firebaseUser: null,
    });
    setScans([]);
    localStorage.removeItem("dermascreen_messages");
    setMessages(initialMessages);
  };

  const addScan = (scanData) => {
    const newScan = {
      id: scanData.scan_id || scanData.id || `DS-${Math.floor(1000 + Math.random() * 9000)}`,
      date: scanData.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      created_at: scanData.created_at || new Date().toISOString(),
      condition: scanData.condition,
      confidence: scanData.confidence,
      risk: scanData.risk,
      image: scanData.image_url || scanData.image,
      notes: scanData.notes || "",
      status: scanData.status || "Completed",
    };
    setScans(prev => [newScan, ...prev]);
    return newScan;
  };

  const sendMessage = async (userText, imageUrl = null) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: userText,
      user_name: user.name || "You",
      image_url: imageUrl,
      time,
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      // Call the real backend API
      const history = messages.slice(-10).map(m => ({
        sender: m.sender,
        text: m.text,
        user_name: m.user_name,
      }));

      const response = await sendChatMessage(userText, history, imageUrl);

      setMessages(prev => [...prev, {
        id: response.id || Date.now() + 1,
        sender: "assistant",
        text: response.text,
        user_name: response.user_name || "AI Clinical Assistant",
        time: response.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      console.warn("Chat API failed, using fallback:", err.message);
      // Fallback response
      setTimeout(() => {
        let replyText = "I understand you're asking about that. Based on common dermatological resources, it's always best to keep track of any asymmetrical moles, jagged borders, color variations, or diameter growth (the ABCDEs of skin health).";
        
        const lower = userText.toLowerCase();
        if (lower.includes("melanoma") || lower.includes("cancer")) {
          replyText = "If you're concerned about potential melanoma or skin cancer, please schedule an appointment with a dermatologist promptly. DermaScreen is a screening support tool, not a definitive diagnostic device.";
        } else if (lower.includes("scan") || lower.includes("result") || lower.includes("atypical")) {
          replyText = "Your latest scan report may require attention. We recommend sharing this report with your healthcare provider for a physical skin examination.";
        } else if (lower.includes("routine") || lower.includes("prevent") || lower.includes("sun")) {
          replyText = "To prevent UV-induced skin damage and lower skin cancer risk, dermatologists advise applying broad-spectrum sunscreen (SPF 30+), wearing protective hats/clothing, and avoiding peak sun hours.";
        }

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: "assistant",
          text: replyText,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 800);
    }
  };

  const loadChatHistory = async () => {
    try {
      const chatHistory = await getChatHistory();
      if (chatHistory && chatHistory.length > 0) {
        setMessages(chatHistory.map((m, idx) => ({
          id: idx + 1,
          sender: m.sender,
          text: m.text,
          user_name: m.user_name,
          time: m.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        })));
      }
    } catch (err) {
      console.warn("Could not load chat history:", err.message);
    }
  };

  const clearChatHistory = async () => {
    try {
      await deleteChatHistory();
    } catch (err) {
      console.warn("Failed to delete chat history from backend:", err.message);
    }
    localStorage.removeItem("dermascreen_messages");
    setMessages(initialMessages);
  };

  const removeScan = async (scanId) => {
    try {
      await deleteScan(scanId);
      setScans(prev => prev.filter(s => s.scan_id !== scanId && s.id !== scanId));
      return true;
    } catch (err) {
      console.error("Failed to delete scan:", err.message);
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      scans,
      setScans,
      messages,
      setMessages,
      currentScan,
      setCurrentScan,
      authLoading,
      login,
      logout,
      addScan,
      sendMessage,
      loadChatHistory,
      clearChatHistory,
      removeScan,
      // Keep old name for backward compat
      simulateChatResponse: sendMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
};
