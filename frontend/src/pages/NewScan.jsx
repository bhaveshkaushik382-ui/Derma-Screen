import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function NewScan() {
  const { setCurrentScan } = useContext(AppContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const [abcdeAnswers, setAbcdeAnswers] = useState({
    A: null,
    B: null,
    C: null,
    D: null,
    E: null
  });

  const abcdeQuestions = [
    { key: 'A', label: 'A - Asymmetry', desc: 'Is the lesion asymmetrical? (One half does not match the other)' },
    { key: 'B', label: 'B - Border irregularity', desc: 'Are the edges ragged, notched, blurred, or poorly defined?' },
    { key: 'C', label: 'C - Color variation', desc: 'Are there multiple colors (brown, black, tan, red, white, or blue)?' },
    { key: 'D', label: 'D - Diameter > 6mm', desc: 'Is the size of the lesion larger than 6mm (pencil eraser size)?' },
    { key: 'E', label: 'E - Evolving / Changing', desc: 'Has the lesion changed in size, shape, color, or caused symptoms like itching/bleeding?' }
  ];

  const isQuestionnaireComplete = Object.values(abcdeAnswers).every(val => val !== null);

  // Camera specific states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Handle camera start/stop
  React.useEffect(() => {
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
      
      canvas.toBlob((blob) => {
        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
        setImageFile(file);
        setImageSrc(canvas.toDataURL('image/jpeg'));
        setFileName("camera_capture.jpg");
        setShowCameraModal(false);
      }, 'image/jpeg');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file);  // Keep the File object for upload
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setImageSrc(null);
    setImageFile(null);
    setFileName('');
    setAbcdeAnswers({
      A: null,
      B: null,
      C: null,
      D: null,
      E: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerCameraDemo = () => {
    setShowCameraModal(true);
  };

  const handleAnalyze = () => {
    if (!imageSrc || !isQuestionnaireComplete) return;
    setLoading(true);

    // Store the image data and file in currentScan for the quality page to use
    const newScanSession = {
      id: `DS-${Math.floor(1000 + Math.random() * 9000)}`,
      image: imageSrc,
      imageFile: imageFile,  // Pass the actual File object for API upload
      fileName: fileName,
      abcdeAnswers: abcdeAnswers,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    };
    setCurrentScan(newScanSession);
    setLoading(false);
    navigate('/quality');
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Section */}
      <div className="w-full max-w-4xl">
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-3 font-bold">Begin Diagnostic Scan</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Upload a high-resolution clinical image or capture one directly using your medical grade camera for immediate AI analysis.
        </p>
      </div>

      {/* Bento Layout for Content */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Main Interaction Area */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Dropzone Component */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !imageSrc && fileInputRef.current.click()}
            className={`relative group bg-surface-container-low rounded-[2rem] p-8 lg:p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden h-[450px] border-2 border-dashed ${
              isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-outline-variant hover:bg-surface-container-high'
            }`}
          >
            <input 
              ref={fileInputRef}
              accept="image/*" 
              className="hidden" 
              type="file"
              onChange={handleFileChange}
            />

            {!imageSrc ? (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-background mb-2 font-bold">Drag & drop clinical image</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-xs">
                  Supports high-resolution dermatological photos for accurate AI mapping.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                    className="h-12 px-8 bg-primary text-white rounded-full font-label-md flex items-center gap-2 hover:shadow-lg active:scale-95 transition-all text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    Browse Files
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); triggerCameraDemo(); }}
                    className="h-12 px-8 bg-secondary-container text-on-secondary-container rounded-full font-label-md flex items-center gap-2 hover:bg-secondary-fixed-dim active:scale-95 transition-all text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-[20px]">camera_alt</span>
                    Use Camera
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                <div className="relative w-full h-full max-h-[340px] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                  <img 
                    className="w-full h-full object-cover" 
                    src={imageSrc} 
                    alt="Clinical Preview"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                    <span className="text-white font-label-md bg-primary/80 backdrop-blur-sm self-start px-3 py-1 rounded-full mb-2 text-xs font-semibold">Selected for Analysis</span>
                    <h3 className="text-white font-headline-md truncate text-lg font-bold">{fileName}</h3>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ABCDE Rule Clinical Questionnaire */}
          {imageSrc && (
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl space-y-4 shadow-sm animate-fade-in">
              <h3 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_assessment</span>
                Mandatory ABCDE Clinical Questionnaire
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Skin cancer screenings combine visual analysis with clinical history. Please evaluate the lesion and answer the following questions based on the ABCDE rule. All questions are required to enable the Analyze action.
              </p>
              
              <div className="space-y-3 pt-2">
                {abcdeQuestions.map((q) => (
                  <div key={q.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-outline-variant/40 hover:bg-surface-container-low transition-colors gap-3 bg-white">
                    <div className="space-y-0.5 max-w-lg">
                      <span className="text-xs font-bold text-primary block">{q.label}</span>
                      <p className="text-xs text-on-surface-variant">{q.desc}</p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setAbcdeAnswers(prev => ({ ...prev, [q.key]: true }))}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          abcdeAnswers[q.key] === true
                            ? 'bg-error text-white shadow-sm'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setAbcdeAnswers(prev => ({ ...prev, [q.key]: false }))}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          abcdeAnswers[q.key] === false
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guidance Tips */}
          <div className="glass-card border border-outline-variant p-6 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-tertiary-fixed rounded-lg text-primary flex-shrink-0">
              <span className="material-symbols-outlined">tips_and_updates</span>
            </div>
            <div>
              <h4 className="font-label-md text-on-background mb-1 font-semibold">Photography Tips for Best Results</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-sm">
                Ensure the skin is clean, use bright natural light or professional flash, and keep the lens 10-15cm from the subject for optimal focus.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration & Format Info */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Action Card */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-sm">
            <h3 className="font-headline-md text-headline-md text-on-background mb-6 font-bold">Scan Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/30 text-sm">
                <span className="font-body-sm text-on-surface-variant">Format Compatibility</span>
                <div className="flex gap-1 font-semibold">
                  <span className="px-2 py-0.5 bg-surface-container-high rounded-md text-[10px] text-on-surface-variant">JPG</span>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded-md text-[10px] text-on-surface-variant">PNG</span>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded-md text-[10px] text-on-surface-variant">JPEG</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/30 text-sm">
                <span className="font-body-sm text-on-surface-variant">Max File Size</span>
                <span className="font-label-md text-on-background font-semibold">25 MB</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/30 text-sm">
                <span className="font-body-sm text-on-surface-variant">AI Model</span>
                <span className="font-label-md text-primary flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-base">verified</span>
                  V4.2 Clinical
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {imageSrc && !isQuestionnaireComplete && (
                <p className="text-xs text-error font-semibold text-center mb-1 animate-pulse">
                  * Answer all ABCDE questions to analyze
                </p>
              )}
              <button 
                onClick={handleAnalyze}
                disabled={!imageSrc || !isQuestionnaireComplete || loading}
                className={`w-full h-12 rounded-xl font-label-md transition-all flex items-center justify-center font-bold ${
                  imageSrc && isQuestionnaireComplete && !loading
                    ? 'bg-primary text-white hover:shadow-lg active:scale-95 cursor-pointer'
                    : 'bg-primary/20 text-on-primary-container/40 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Analyze Image"
                )}
              </button>
              
              {imageSrc && !loading && (
                <button 
                  onClick={handleRemove}
                  className="w-full h-12 bg-surface text-error border border-error/20 rounded-xl font-label-md hover:bg-error-container/20 transition-all font-semibold"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>

          {/* Privacy/Legal Card */}
          <div className="bg-surface-container border border-outline-variant/50 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 text-on-surface-variant font-semibold text-xs">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="font-label-sm uppercase tracking-wider">Security Protocol</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-sm">
              All images are encrypted at rest and in transit. Processing complies with HIPAA and GDPR standards for patient data privacy.
            </p>
          </div>
        </div>
      </div>

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
    </div>
  );
}
