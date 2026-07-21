import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { generateScanReport, generateHistoryReport } from '../services/report';

export default function Dashboard() {
  const { scans, user, setCurrentScan } = useContext(AppContext);
  const navigate = useNavigate();

  // Calculate statistics dynamically from current scan list
  const totalScans = scans.length;
  const highRiskAlerts = scans.filter(s => 
    s.risk === 'High' || 
    s.risk === 'Medium' || 
    s.risk === 'High Risk' || 
    s.risk === 'Moderate Risk' || 
    s.risk === 'Urgent Evaluation Recommended'
  ).length;

  const confidenceValues = scans
    .map(s => parseFloat(s.confidence))
    .filter(val => !isNaN(val));
  const averageConfidence = confidenceValues.length > 0
    ? `${(confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length).toFixed(1)}%`
    : "0.0%";

  const lowRiskCount = scans.filter(s => s.risk === 'Low' || s.risk === 'Low Risk').length;
  const mediumRiskCount = scans.filter(s => s.risk === 'Medium' || s.risk === 'Moderate Risk').length;
  const highRiskCount = scans.filter(s => s.risk === 'High' || s.risk === 'High Risk' || s.risk === 'Urgent Evaluation Recommended').length;

  const lowPct = totalScans > 0 ? Math.round((lowRiskCount / totalScans) * 100) : 0;
  const mediumPct = totalScans > 0 ? Math.round((mediumRiskCount / totalScans) * 100) : 0;
  const highPct = totalScans > 0 ? Math.round((highRiskCount / totalScans) * 100) : 0;

  const [trendFilter, setTrendFilter] = useState('Last 6 Months');

  // Get dynamic monthly trend based on filter
  const getMonthlyTrend = () => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const trend = [];
    const today = new Date();
    
    if (trendFilter === 'Last 6 Months') {
      // Last 6 months (relative to today)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        trend.push({
          monthName: months[d.getMonth()],
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          count: 0
        });
      }
    } else if (trendFilter === 'Last Year (Full)') {
      // Full previous calendar year (12 months)
      const lastYear = today.getFullYear() - 1;
      for (let i = 0; i < 12; i++) {
        trend.push({
          monthName: months[i],
          year: lastYear,
          monthIndex: i,
          count: 0
        });
      }
    } else if (trendFilter === 'Last Year (Last 6 Months)') {
      // Last 6 months of the previous calendar year (Jul - Dec of lastYear)
      const lastYear = today.getFullYear() - 1;
      for (let i = 6; i < 12; i++) {
        trend.push({
          monthName: months[i],
          year: lastYear,
          monthIndex: i,
          count: 0
        });
      }
    }

    // Populate counts from user scans
    scans.forEach(scan => {
      const dateVal = scan.created_at || scan.date;
      if (!dateVal) return;
      const scanDate = new Date(dateVal);
      if (isNaN(scanDate.getTime())) return;
      
      const scanMonth = scanDate.getMonth();
      const scanYear = scanDate.getFullYear();
      
      const match = trend.find(t => t.monthIndex === scanMonth && t.year === scanYear);
      if (match) {
        match.count += 1;
      }
    });

    return trend;
  };

  const trendData = getMonthlyTrend();
  const maxCount = Math.max(...trendData.map(t => t.count), 1);

  const handleScanClick = (scan) => {
    setCurrentScan(scan);
    navigate('/result');
  };

  const handleGenerateReport = () => {
    navigate('/history');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background font-bold">Good morning, {user.name.split(' ')[0] || 'Dr. Mitchell'}</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Here is the diagnostic summary for your clinical cases today.</p>
        </div>
        <Link 
          to="/new-scan"
          className="bg-primary text-white px-6 py-3 rounded-xl font-label-md flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 text-sm font-semibold"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          Start New Scan
        </Link>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-on-surface-variant text-label-md uppercase tracking-wider text-xs font-semibold">Total Scans</p>
          <h3 className="font-headline-md text-headline-md mt-1 font-bold">{totalScans.toLocaleString()}</h3>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <span className="material-symbols-outlined text-secondary">calendar_today</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-label-md uppercase tracking-wider text-xs font-semibold">Last Scan Date</p>
          <h3 className="font-headline-md text-headline-md mt-1 font-bold">{scans[0]?.date || 'Today'}</h3>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant hover:border-primary transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <span className="material-symbols-outlined text-tertiary">check_circle</span>
            </div>
            <span className="text-xs font-bold text-tertiary bg-tertiary/5 px-2 py-1 rounded-full">High</span>
          </div>
          <p className="text-on-surface-variant text-label-md uppercase tracking-wider text-xs font-semibold">Avg. Confidence</p>
          <h3 className="font-headline-md text-headline-md mt-1 font-bold">{averageConfidence}</h3>
        </div>

        <div className={`bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant border-l-4 hover:border-primary transition-all ${highRiskAlerts > 0 ? 'border-l-error' : 'border-l-primary'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${highRiskAlerts > 0 ? 'bg-error/10' : 'bg-primary/10'}`}>
              <span className={`material-symbols-outlined ${highRiskAlerts > 0 ? 'text-error' : 'text-primary'}`}>{highRiskAlerts > 0 ? 'warning' : 'verified'}</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${highRiskAlerts > 0 ? 'text-error bg-error/10' : 'text-primary bg-primary/5'}`}>
              {highRiskAlerts > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <p className="text-on-surface-variant text-label-md uppercase tracking-wider text-xs font-semibold">Risk Alerts</p>
          <h3 className="font-headline-md text-headline-md mt-1 font-bold">{String(highRiskAlerts).padStart(2, '0')}</h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 space-y-gutter">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Recent Scans</h2>
              <Link to="/history" className="text-primary font-label-md hover:underline text-sm font-semibold">View All</Link>
            </div>
            
            <div className="divide-y divide-outline-variant">
              {scans.slice(0, 3).map((scan) => {
                const isHighRisk = scan.risk === 'High' || scan.risk === 'Medium' || scan.risk === 'High Risk' || scan.risk === 'Moderate Risk' || scan.risk === 'Urgent Evaluation Recommended';
                return (
                  <div 
                    key={scan.id}
                    onClick={() => handleScanClick(scan)}
                    className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-surface-container-low transition-all group cursor-pointer"
                  >
                    <div className="relative w-full sm:w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" src={scan.image} alt={scan.condition} />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    <div className="flex-1 space-y-1 w-full text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-label-md text-on-surface text-lg font-semibold">Patient {scan.id}</h4>
                        <span className="text-xs text-on-surface-variant">{scan.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isHighRisk 
                            ? 'bg-error-container text-error' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {scan.risk} Risk
                        </span>
                        <span className="text-body-sm text-on-surface-variant">Confidence: {scan.confidence}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span> {scan.condition} check
                      </p>
                    </div>
                    
                    <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scan Trends Chart Placeholder */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Monthly Scan Trend</h2>
              <select 
                value={trendFilter}
                onChange={(e) => setTrendFilter(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-lg text-xs font-label-md py-1.5 px-3 focus:ring-primary focus:border-primary outline-none cursor-pointer font-semibold text-on-surface"
              >
                <option>Last 6 Months</option>
                <option>Last Year (Full)</option>
                <option>Last Year (Last 6 Months)</option>
              </select>
            </div>
            
            <div className="flex-1 flex items-end gap-2 md:gap-4 px-2 h-64">
              {trendData.map((data, idx) => {
                const heightPercent = maxCount > 0 ? (data.count / maxCount) * 75 : 0;
                const isCurrentMonth = trendFilter === 'Last 6 Months' && idx === 5;
                return (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group">
                    <span className="text-[10px] font-bold text-on-surface-variant min-h-[16px]">
                      {data.count > 0 ? data.count : ''}
                    </span>
                    <div 
                      className={`w-full rounded-t-lg transition-all ${
                        isCurrentMonth 
                          ? 'bg-primary' 
                          : 'bg-primary-fixed-dim group-hover:bg-primary'
                      }`}
                      style={{ height: `${heightPercent}%`, minHeight: data.count > 0 ? '4px' : '0px' }}
                      title={`${data.monthName} ${data.year}: ${data.count} scans`}
                    ></div>
                    <span className={`text-[10px] ${isCurrentMonth ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                      {data.monthName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-gutter">
          {/* Quick Actions */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 space-y-4">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs font-bold text-left">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleGenerateReport}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:bg-surface-container-low hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="font-label-md text-sm font-semibold">Generate Full Report</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">arrow_forward</span>
              </button>
              <button 
                onClick={() => generateHistoryReport(scans)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:bg-surface-container-low hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">archive</span>
                  <span className="font-label-md text-sm font-semibold">Export History</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">download</span>
              </button>
            </div>
          </div>

          {/* AI Assistant Shortcut */}
          <div className="relative overflow-hidden bg-primary-container rounded-2xl p-6 text-white shadow-xl text-left">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <span className="font-label-md uppercase tracking-widest text-xs opacity-80 font-bold">AI Clinical Assistant</span>
              </div>
              <h4 className="font-headline-md text-headline-md leading-tight mb-2 font-bold">Need help with a diagnosis?</h4>
              <p className="text-body-sm mb-6 opacity-90 text-sm">Upload multiple images for a longitudinal comparative analysis using our latest neural engine.</p>
              <Link to="/assistant" className="inline-block bg-white text-primary px-6 py-2.5 rounded-xl font-label-md hover:bg-primary-fixed transition-colors text-sm font-semibold">
                Ask Assistant
              </Link>
            </div>
            {/* Abstract Background Decoration */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <span className="material-symbols-outlined text-8xl">clinical_notes</span>
            </div>
          </div>

          {/* Risk Distribution Pie Chart Placeholder */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 text-left">
            <h2 className="font-label-md text-on-surface mb-6 font-semibold">Risk Distribution</h2>
            <div className="flex items-center justify-center py-6">
              <div className="relative w-40 h-40 rounded-full border-[12px] border-primary">
                <div className="absolute inset-[-12px] border-[12px] border-error rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 20%)' }}></div>
                <div className="absolute inset-[-12px] border-[12px] border-secondary rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 20%, 100% 60%)' }}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-on-surface">{totalScans}</span>
                  <span className="text-[10px] text-on-surface-variant font-label-md uppercase">Total</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-xs text-on-surface-variant">Low Risk (Benign)</span>
                </div>
                <span className="text-xs font-bold">{lowPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="text-xs text-on-surface-variant">Moderate Risk</span>
                </div>
                <span className="text-xs font-bold">{mediumPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span className="text-xs text-on-surface-variant">High Risk</span>
                </div>
                <span className="text-xs font-bold">{highPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
