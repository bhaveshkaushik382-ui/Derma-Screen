import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { generateScanReport } from '../services/report';

export default function ScreeningResult() {
  const { currentScan, setCurrentScan } = useContext(AppContext);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fallback scan if page is loaded directly
  const scan = currentScan || {
    id: "DS-8821",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400",
    fileName: "clinical_scan_001.jpg",
    date: "Jul 04, 2026",
    condition: "Atypical Melanocytic Nevus",
    confidence: "91.5%",
    risk: "High",
    status: "Completed",
    notes: "Asymmetric pigmentation pattern detected. A dermatological physical biopsy is advised to rule out dysplastic changes."
  };

  const [showGradCam, setShowGradCam] = useState(false);

  const confidenceValue = parseFloat(scan.confidence) || 91;
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (confidenceValue / 100) * circumference;

  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    // Animate progress ring on load
    const t = setTimeout(() => {
      setDashOffset(strokeOffset);
    }, 300);
    return () => clearTimeout(t);
  }, [strokeOffset, circumference]);

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isHighRisk = scan.risk === 'High Risk' || scan.risk === 'High' || scan.risk === 'Moderate Risk' || scan.risk === 'Medium' || scan.risk === 'Urgent Evaluation Recommended';

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant mb-2 text-xs font-semibold">
            <Link to="/history" className="hover:text-primary transition-colors">SCANS</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary">RESULT ANALYSIS</span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Analysis Complete</h1>
          <p className="text-on-surface-variant font-body-md mt-1 text-sm">
            Scan ID: #{scan.id} • Date: {scan.date}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleShare}
            className="h-12 px-6 flex items-center justify-center gap-2 border border-outline text-primary font-label-md rounded-xl hover:bg-surface-container-low transition-all font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              {copied ? 'check' : 'share'}
            </span>
            {copied ? 'Copied Link!' : 'Share'}
          </button>
          
          <button 
            onClick={handleSave}
            className="h-12 px-6 flex items-center justify-center gap-2 bg-primary text-white font-label-md rounded-xl hover:shadow-md active:scale-95 transition-all font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              {saved ? 'check_circle' : 'save'}
            </span>
            {saved ? 'Saved!' : 'Save Result'}
          </button>
        </div>
      </div>

      {/* Result Bento Grid */}
      {scan.quality_warning && (
        <div className="bg-error-container/20 border border-error/30 rounded-2xl p-4 flex gap-4 items-start mb-6">
          <span className="material-symbols-outlined text-error text-3xl">warning</span>
          <div>
            <h4 className="text-on-surface text-base font-bold">Image Quality Warning</h4>
            <p className="text-on-surface-variant text-sm mt-0.5">{scan.quality_warning}</p>
            <p className="text-error text-xs mt-1 font-semibold">
              Poor image quality may affect the reliability of the AI model's prediction.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Uploaded Image Viewport with GradCAM Toggle */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant group relative">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="bg-black/50 backdrop-blur-md text-white text-[12px] px-3 py-1 rounded-full font-label-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">zoom_in</span> High-Res Capture
            </span>
          </div>

          {/* GradCAM Toggle Button */}
          {scan.grad_cam_image && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setShowGradCam(!showGradCam)}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg ${
                  showGradCam
                    ? 'bg-primary text-white shadow-primary/30'
                    : 'bg-white/90 text-on-surface hover:bg-primary hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showGradCam ? 'visibility' : 'local_fire_department'}
                </span>
                {showGradCam ? 'Show Original' : 'Show GradCAM'}
              </button>
            </div>
          )}
          
          <div className="aspect-[4/3] w-full bg-black flex items-center justify-center relative">
            {/* Original Image */}
            <img 
              className={`w-full h-full object-cover transition-opacity duration-300 ${showGradCam ? 'opacity-0' : 'opacity-100'}`}
              src={scan.image} 
              alt="Scan capture"
            />
            {/* GradCAM Overlay */}
            {scan.grad_cam_image && (
              <img 
                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${showGradCam ? 'opacity-100' : 'opacity-0'}`}
                src={scan.grad_cam_image} 
                alt="GradCAM heatmap"
              />
            )}
          </div>
          
          <div className="p-6 border-t border-outline-variant flex items-center justify-between text-sm">
            <div className="flex gap-2">
              <button className="p-3 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">zoom_in</span>
              </button>
              {scan.grad_cam_image && (
                <button 
                  onClick={() => setShowGradCam(!showGradCam)}
                  className={`p-3 rounded-lg transition-colors ${showGradCam ? 'bg-primary/10 text-primary' : 'bg-surface-container hover:bg-surface-container-high'}`}
                >
                  <span className="material-symbols-outlined text-on-surface-variant">local_fire_department</span>
                </button>
              )}
              <button className="p-3 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">contrast</span>
              </button>
            </div>
            <span className="text-on-surface-variant font-label-md">
              {showGradCam ? 'GradCAM Attention Map' : 'Capture Source: Dermascope Gen 3'}
            </span>
          </div>
        </div>

        {/* Result Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Main Prediction Result */}
          <div className="glass-card rounded-2xl p-8 border border-outline-variant flex flex-col items-center text-center">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label-md mb-8 font-semibold text-sm ${
              isHighRisk ? 'bg-error-container text-error' : 'bg-green-100 text-green-800'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {isHighRisk ? 'warning' : 'verified'}
              </span>
              {isHighRisk ? 'Suspicious' : 'Benign / Low Concern'}
            </span>

            {/* Progress Gauge */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  className="text-surface-container-high" 
                  cx="96" 
                  cy="96" 
                  fill="transparent" 
                  r={radius} 
                  stroke="currentColor" 
                  strokeWidth="12"
                />
                <circle 
                  className={`transition-all duration-1000 ease-out ${isHighRisk ? 'text-error' : 'text-primary'}`}
                  cx="96" 
                  cy="96" 
                  fill="transparent" 
                  r={radius} 
                  stroke="currentColor" 
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline-xl text-headline-xl text-on-surface leading-none font-bold">{scan.confidence}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase mt-1 text-xs">Confidence</span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full justify-center mb-8">
              <div className="px-4 py-2 bg-surface-container-low rounded-lg border border-outline-variant text-left min-w-[100px]">
                <p className="font-label-sm text-xs text-on-surface-variant">Risk Level</p>
                <p className={`font-headline-md text-lg font-bold ${isHighRisk ? 'text-error' : 'text-primary'}`}>{scan.risk}</p>
              </div>
              <div className="px-4 py-2 bg-surface-container-low rounded-lg border border-outline-variant text-left min-w-[100px]">
                <p className="font-label-sm text-xs text-on-surface-variant">Classification</p>
                <p className="font-headline-md text-lg font-bold text-on-surface">{scan.condition.split(' ')[0]}</p>
              </div>
            </div>
            
            <div className="w-full h-px bg-outline-variant mb-6"></div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={() => generateScanReport(scan)}
                className="w-full h-12 bg-primary text-white font-label-md rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all text-sm font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined">description</span>
                Generate Detailed Report
              </button>
              <Link 
                to="/new-scan"
                className="w-full h-12 bg-secondary-container text-on-secondary-container font-label-md rounded-xl flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-all text-sm font-semibold"
              >
                <span className="material-symbols-outlined">add_a_photo</span>
                New Scan
              </Link>
            </div>
          </div>

          {/* AI Notice */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex gap-4 items-start">
            <span className="material-symbols-outlined text-on-surface-variant mt-1 text-[20px]">info</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-xs">
              This AI result is intended for screening purposes only and is not a medical diagnosis. Please consult a qualified dermatologist for a formal clinical evaluation.
            </p>
          </div>

          {/* Next Steps / Clinical Recommendations */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <h3 className="font-headline-md text-[18px] mb-4 text-on-surface font-bold">Recommended Actions</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-sm">
                  {isHighRisk ? 'Schedule urgent dermatology review (within 2 weeks)' : 'Monitor mole monthly for size and shape variations'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-sm">
                  Avoid direct UV exposure to the area and apply broad spectrum SPF 50+
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
