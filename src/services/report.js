/**
 * DermaScreen — Clinical Report Generator
 * Dynamically builds a beautiful, printable clinical report in a new tab
 * and triggers the system print/PDF download dialog.
 */

export function generateScanReport(scan) {
  if (!scan) return;

  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert("Popup blocked! Please allow popups to view and generate the clinical report.");
    return;
  }

  // Parse quality score if present
  let qualityHTML = '';
  if (scan.qualityScore || scan.quality_score) {
    let scores = scan.qualityScore || scan.quality_score;
    if (typeof scores === 'string') {
      try {
        scores = JSON.parse(scores);
      } catch (e) {
        scores = null;
      }
    }

    if (scores) {
      qualityHTML = `
        <div class="section-title">Clinical Quality Validation</div>
        <table class="metrics-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(scores).map(([key, metric]) => {
              const statusClass = metric.status === 'success' ? 'status-success' : metric.status === 'warning' ? 'status-warning' : 'status-error';
              const statusLabel = metric.status.toUpperCase();
              return `
                <tr>
                  <td><strong>${metric.label || key}</strong></td>
                  <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                  <td>${metric.value}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  }

  const isHighRisk = scan.risk === 'High Risk' || scan.risk === 'High' || scan.risk === 'Moderate Risk' || scan.risk === 'Medium' || scan.risk === 'Urgent Evaluation Recommended';
  const riskClass = isHighRisk ? 'risk-high' : 'risk-low';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Clinical Screening Report - #${scan.id || scan.scan_id}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1c1b1f;
          background-color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e1e3e1;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #006a6a;
          letter-spacing: -0.5px;
        }
        .report-meta {
          text-align: right;
          font-size: 12px;
          color: #49454f;
        }
        .title {
          font-size: 28px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 10px;
          color: #1c1b1f;
        }
        .grid {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .card {
          border: 1px solid #c9c7c5;
          border-radius: 12px;
          padding: 24px;
          background-color: #faf9f6;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #49454f;
          margin-bottom: 16px;
          border-bottom: 1px solid #e1e3e1;
          padding-bottom: 6px;
        }
        .result-pill {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .risk-high {
          background-color: #ffdad6;
          color: #410002;
        }
        .risk-low {
          background-color: #e8f5e9;
          color: #1b5e20;
        }
        .score-display {
          display: flex;
          align-items: baseline;
          margin-bottom: 10px;
        }
        .score-val {
          font-size: 48px;
          font-weight: 800;
          color: #006a6a;
          line-height: 1;
        }
        .score-lbl {
          font-size: 14px;
          color: #49454f;
          margin-left: 10px;
        }
        .images-container {
          display: grid;
          grid-template-cols: 1fr ${scan.grad_cam_image || scan.gradcam ? '1fr' : ''};
          gap: 20px;
          margin-bottom: 30px;
        }
        .image-box {
          border: 1px solid #c9c7c5;
          border-radius: 12px;
          overflow: hidden;
          background-color: #000;
          text-align: center;
        }
        .image-box img {
          max-width: 100%;
          height: auto;
          max-height: 350px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        .image-box .label {
          background-color: #1c1b1f;
          color: #ffffff;
          padding: 8px;
          font-size: 12px;
          font-weight: 600;
        }
        .metrics-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 30px;
        }
        .metrics-table th, .metrics-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e3e1;
        }
        .metrics-table th {
          background-color: #faf9f6;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #49454f;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
        }
        .status-success { background-color: #e8f5e9; color: #1b5e20; }
        .status-warning { background-color: #fff9c4; color: #f57f17; }
        .status-error { background-color: #ffdad6; color: #410002; }
        
        .notes-box {
          background-color: #e0f2f1;
          border-left: 4px solid #006a6a;
          padding: 20px;
          border-radius: 0 12px 12px 0;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .disclaimer {
          font-size: 11px;
          color: #49454f;
          text-align: center;
          border-top: 1px solid #e1e3e1;
          padding-top: 20px;
          margin-top: 50px;
          font-style: italic;
        }
        .print-btn-container {
          margin-bottom: 30px;
          text-align: right;
        }
        .print-btn {
          background-color: #006a6a;
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 100px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .print-btn:hover {
          background-color: #005353;
        }
        @media print {
          .print-btn-container {
            display: none;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-container">
        <button class="print-btn" onclick="window.print()">Download Report (PDF)</button>
      </div>

      <div class="header">
        <div class="logo">DermaScreen AI</div>
        <div class="report-meta">
          <strong>Report Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}<br>
          <strong>Scan ID:</strong> #${scan.id || scan.scan_id}
        </div>
      </div>

      <div class="title">Clinical Diagnostic Summary</div>
      <p style="color: #49454f; margin-bottom: 30px;">
        Automated dermatological screening report generated by DermaScreen Clinical Neural Engine.
      </p>

      <div class="grid">
        <div class="card">
          <div class="section-title">Diagnostic Result</div>
          <div class="result-pill ${riskClass}">
            ${isHighRisk ? 'Suspicious / Attention Required' : 'Benign / Low Concern'}
          </div>
          
          <div style="font-size: 14px; margin-bottom: 6px; color: #49454f;">Primary Condition Mapping</div>
          <div style="font-size: 20px; font-weight: 700; color: #1c1b1f; margin-bottom: 16px;">
            ${scan.condition}
          </div>
          
          <div class="score-display">
            <div class="score-val">${scan.confidence}</div>
            <div class="score-lbl">Classifier Confidence</div>
          </div>
        </div>

        <div class="card">
          <div class="section-title">Clinical Risk Assessment</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #49454f;">Risk Severity:</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right; color: ${isHighRisk ? '#ba1a1a' : '#006a6a'}">
                ${scan.risk}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #49454f;">Timeline Priority:</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">
                ${isHighRisk ? 'Urgent (Within 2 Weeks)' : 'Routine / Longitudinal monitoring'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #49454f;">Status:</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #006a6a;">
                ${scan.status || 'Completed'}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="section-title">Clinical Images & AI Heatmaps</div>
      <div class="images-container">
        <div class="image-box">
          <div class="label">Original Clinical Image</div>
          <img src="${scan.image}" alt="Clinical Source">
        </div>
        ${scan.grad_cam_image || scan.gradcam ? `
          <div class="image-box">
            <div class="label">GradCAM Neural Activation Map</div>
            <img src="${scan.grad_cam_image || scan.gradcam}" alt="Neural Activation Map">
          </div>
        ` : ''}
      </div>

      <div class="notes-box">
        <strong>Recommendations & Clinical Advice:</strong><br>
        <p style="margin-top: 8px; margin-bottom: 0;">${scan.notes || 'No recommendations recorded.'}</p>
      </div>

      ${qualityHTML}

      <div class="disclaimer">
        <strong>Medical Disclaimer:</strong> This document represents an AI-driven screening support recommendation. 
        It does not constitute a formal medical diagnosis. All classification scores and heatmaps should be clinically 
        reviewed by a qualified board-certified dermatologist in conjunction with physical dermoscopy and histological biopsy if indicated.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  reportWindow.document.open();
  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
}

export function generateHistoryReport(scans) {
  if (!scans || scans.length === 0) {
    alert("No scan history available to export.");
    return;
  }

  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert("Popup blocked! Please allow popups to view and generate the clinical report.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Clinical Scan History Report - DermaScreen</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1c1b1f;
          background-color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e1e3e1;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #006b2c;
          letter-spacing: -0.5px;
        }
        .report-meta {
          text-align: right;
          font-size: 12px;
          color: #49454f;
        }
        .title {
          font-size: 26px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 10px;
          color: #1c1b1f;
        }
        .subtitle {
          font-size: 14px;
          color: #49454f;
          margin-bottom: 30px;
        }
        .print-btn {
          background-color: #006b2c;
          color: white;
          border: none;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: background 0.2s;
        }
        .print-btn:hover {
          background-color: #005320;
        }
        @media print {
          .print-btn {
            display: none;
          }
          body {
            padding: 0;
          }
        }
        .scans-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .scans-table th, .scans-table td {
          border-bottom: 1px solid #e1e3e1;
          padding: 12px;
          text-align: left;
          font-size: 13px;
        }
        .scans-table th {
          background-color: #f4f6f4;
          font-weight: 700;
          color: #1c1b1f;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .risk-high {
          background-color: #ffdad6;
          color: #410002;
        }
        .risk-low {
          background-color: #caead6;
          color: #042014;
        }
        .scan-thumbnail {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #e1e3e1;
        }
        .disclaimer {
          font-size: 10px;
          color: #747775;
          margin-top: 50px;
          border-top: 1px solid #e1e3e1;
          padding-top: 15px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">Download Report (PDF)</button>
      
      <div class="header">
        <div class="logo">DermaScreen</div>
        <div class="report-meta">
          <strong>Report Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}<br>
          <strong>Total Cases:</strong> ${scans.length}
        </div>
      </div>

      <h1 class="title">Clinical Case History Report</h1>
      <p class="subtitle">Comprehensive longitudinal history of dermatological screening cases mapped via DermaScreen Clinical Neural Engine.</p>

      <table class="scans-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Date</th>
            <th>Scan ID</th>
            <th>Condition</th>
            <th>Confidence</th>
            <th>Risk Level</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${scans.map(scan => {
            const isHighRisk = scan.risk === 'High Risk' || scan.risk === 'High' || scan.risk === 'Moderate Risk' || scan.risk === 'Medium' || scan.risk === 'Urgent Evaluation Recommended';
            const riskClass = isHighRisk ? 'risk-high' : 'risk-low';
            return `
              <tr>
                <td>
                  <img class="scan-thumbnail" src="${scan.image || scan.image_url}" alt="Lesion thumbnail">
                </td>
                <td>${scan.date || scan.created_at || 'N/A'}</td>
                <td><code>${scan.id || scan.scan_id}</code></td>
                <td><strong>${scan.condition}</strong></td>
                <td>${scan.confidence}</td>
                <td>
                  <span class="status-badge ${riskClass}">${scan.risk}</span>
                </td>
                <td>${scan.status || 'Completed'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="disclaimer">
        <strong>Medical Disclaimer:</strong> This clinical case history document represents a summary of AI-driven screening support observations. 
        It is not a substitute for formal medical record keeping, histological analysis, or medical diagnosis. All records should be 
        clinically cross-referenced and validated by a board-certified dermatologist.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  reportWindow.document.open();
  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
}
