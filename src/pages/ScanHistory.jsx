import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { generateScanReport } from '../services/report';

export default function ScanHistory() {
  const { scans, setCurrentScan, removeScan } = useContext(AppContext);
  const navigate = useNavigate();

  const [riskFilter, setRiskFilter] = useState('All Risk Levels');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('Newest First');

  const filteredScans = scans
    .filter(scan => {
      // Risk filter
      if (riskFilter === 'High Risk') return scan.risk === 'High' || scan.risk === 'High Risk' || scan.risk === 'Urgent Evaluation Recommended';
      if (riskFilter === 'Moderate Risk') return scan.risk === 'Medium' || scan.risk === 'Moderate Risk';
      if (riskFilter === 'Low Risk') return scan.risk === 'Low' || scan.risk === 'Low Risk';
      return true;
    })
    .filter(scan => {
      // Search term
      const term = searchTerm.toLowerCase();
      return (
        scan.id.toLowerCase().includes(term) ||
        scan.condition.toLowerCase().includes(term) ||
        scan.date.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      // Sort order
      if (sortOrder === 'Oldest First') {
        const timeA = a.created_at ? new Date(a.created_at) : new Date(a.date);
        const timeB = b.created_at ? new Date(b.created_at) : new Date(b.date);
        return timeA - timeB;
      }
      if (sortOrder === 'Confidence (High)') {
        const confA = parseFloat(String(a.confidence).replace('%', ''));
        const confB = parseFloat(String(b.confidence).replace('%', ''));
        return confB - confA;
      }
      // Newest First (default)
      const timeA = a.created_at ? new Date(a.created_at) : new Date(a.date);
      const timeB = b.created_at ? new Date(b.created_at) : new Date(b.date);
      return timeB - timeA;
    });

  const handleDetails = (scan) => {
    setCurrentScan(scan);
    navigate('/result');
  };

  const handleDownload = (scan) => {
    generateScanReport(scan);
  };

  const handleDelete = async (scanId) => {
    if (window.confirm("Are you sure you want to delete this scan from your history? This will permanently remove the scan data and image from the database.")) {
      try {
        await removeScan(scanId);
      } catch (err) {
        alert("Failed to delete scan: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Scan History</h1>
          <p className="text-on-surface-variant font-body-sm mt-1 text-sm">Review and manage your clinical diagnostic timeline.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              className="pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none w-56 outline-none" 
              placeholder="Search by ID or condition..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative inline-block text-left">
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant text-on-surface rounded-xl px-4 pr-10 py-2.5 font-label-md focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer text-sm outline-none font-semibold"
            >
              <option>All Risk Levels</option>
              <option>High Risk</option>
              <option>Moderate Risk</option>
              <option>Low Risk</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">expand_more</span>
          </div>

          <div className="relative inline-block text-left">
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant text-on-surface rounded-xl px-4 pr-10 py-2.5 font-label-md focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer text-sm outline-none font-semibold"
            >
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Confidence (High)</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">sort</span>
          </div>

          <Link 
            to="/new-scan" 
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-label-md flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Start New Scan
          </Link>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative space-y-12">
        {filteredScans.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">folder_open</span>
            <p className="text-on-surface-variant font-medium">No scans match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredScans.map((scan) => {
              const isHighRisk = scan.risk === 'High' || scan.risk === 'Medium' || scan.risk === 'High Risk' || scan.risk === 'Moderate Risk' || scan.risk === 'Urgent Evaluation Recommended';
              return (
                <div 
                  key={scan.id} 
                  className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 hover:shadow-md hover:border-primary transition-all group flex flex-col justify-between"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-surface-container shrink-0">
                      <img className="w-full h-full object-cover" src={scan.image} alt={scan.condition} />
                    </div>
                    
                    <div className="flex-grow space-y-2 text-left">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-headline-md text-base font-bold text-on-surface">{scan.condition}</h3>
                          <p className="text-on-surface-variant text-xs">ID: {scan.id} • {scan.date}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isHighRisk ? 'bg-error-container text-error' : 'bg-green-100 text-green-800'
                        }`}>
                          {scan.risk} Risk
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 pt-2">
                        <div>
                          <p className="text-on-surface-variant text-[10px] uppercase font-semibold tracking-wider">Confidence</p>
                          <p className="font-headline-md text-base text-primary font-bold">{scan.confidence}</p>
                        </div>
                        <div className="h-10 w-px bg-outline-variant"></div>
                        <div>
                          <p className="text-on-surface-variant text-[10px] uppercase font-semibold tracking-wider">Prediction</p>
                          <p className="font-headline-md text-base text-on-surface font-bold">{isHighRisk ? 'Suspicious' : 'Benign'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between items-center gap-3">
                    <button 
                      onClick={() => handleDelete(scan.id)}
                      className="text-red-600 hover:bg-red-50 font-label-md px-3 py-2 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      title="Delete Scan"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDetails(scan)}
                        className="text-on-surface-variant font-label-md px-4 py-2 hover:bg-surface-container rounded-lg transition-colors text-xs font-semibold cursor-pointer"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => handleDownload(scan)}
                        className="bg-secondary-container text-on-secondary-container font-label-md px-4 py-2 rounded-lg hover:brightness-95 transition-colors text-xs font-semibold cursor-pointer"
                      >
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
