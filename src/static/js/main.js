// Import all UI and IO modules and initialize the app
import { initConstraintLabels } from './ui/constraint-labels.js';
import { initDesignHeaders } from './ui/design-headers.js';
import { initItemTableContainer, updateAllTables } from './ui/item-table.js';
import { initSummaryAutoRefresh } from './ui/summary-table.js';
import { initResultsAutoRefresh } from './ui/results-panel.js';
import { highlightDuplicates } from './ui/duplicates.js';
import { exportFormData } from './io/exporter.js';
import { importFormData } from './io/importer.js';

// Add export/import button logic
function addExportImportUI() {
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  let importFile = document.getElementById('import-file');
  if (!importFile) {
    importFile = document.createElement('input');
    importFile.type = 'file';
    importFile.id = 'import-file';
    importFile.style.display = 'none';
    importFile.accept = 'application/json';
    document.body.appendChild(importFile);
  }
  if (exportBtn) exportBtn.onclick = exportFormData;
  if (importBtn) importBtn.onclick = () => importFile.click();
  importFile.onchange = function(e) {
    if (e.target.files && e.target.files[0]) {
      importFormData(e.target.files[0]);
    }
  };
}

function addSensitivityDownload() {
  const btn = document.getElementById('download-sensitivity-btn');
  if (!btn) return;
  btn.onclick = () => {
    const imgUrl = '/static/img/sensitivity_analysis.png';
    const a = document.createElement('a');
    a.href = imgUrl + '?t=' + Date.now(); // prevent caching
    a.download = 'sensitivity_analysis.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
}

function lerpColor(a, b, t) {
  return a + (b - a) * t;
}

function getGradientColor(val) {
  // val: 1.0 (red) to 10.0 (green), 5.0 is yellow
  // Red:   #FF0000 (1.0)
  // Yellow: #EDDD53 (5.0)
  // Green: #00FF15 (10.0)
  let r, g, b;
  if (val <= 5) {
    // Red to Yellow
    const t = (val - 1) / 4;
    r = Math.round(lerpColor(255, 237, t));
    g = Math.round(lerpColor(0, 221, t));
    b = Math.round(lerpColor(0, 83, t));
  } else {
    // Yellow to Green
    const t = (val - 5) / 5;
    r = Math.round(lerpColor(237, 0, t));
    g = Math.round(lerpColor(221, 255, t));
    b = Math.round(lerpColor(83, 21, t));
  }
  return `rgb(${r},${g},${b})`;
}

function colorResultMidCells() {
  document.querySelectorAll('.result-mid').forEach(td => {
    const val = parseFloat(td.getAttribute('data-val'));
    if (isNaN(val)) return;
    const color = getGradientColor(val);
    if (document.body.classList.contains('dark-mode')) {
      td.style.setProperty('--mid-bg', color);
      td.style.setProperty('--mid-color', color);
      td.style.setProperty('color', `var(--mid-bg)`);
      td.style.setProperty('background', 'transparent');
    } else {
      td.style.setProperty('--mid-bg', color);
      td.style.setProperty('--mid-color', '#000');
      td.style.setProperty('background', `var(--mid-bg)`);
      td.style.setProperty('color', `var(--mid-color)`);
    }
    td.style.fontWeight = 'bold';
  });
}

// Patch results-panel.js to call colorResultMidCells after refresh
import { refreshResults as origRefreshResults } from './ui/results-panel.js';
export async function refreshResults() {
  await origRefreshResults();
  colorResultMidCells();
  highlightDuplicates();
}

document.addEventListener('DOMContentLoaded', () => {
  initConstraintLabels();
  initDesignHeaders();
  initItemTableContainer();
  initSummaryAutoRefresh();
  initResultsAutoRefresh();
  addExportImportUI();
  addSensitivityDownload();
  updateAllTables();
  highlightDuplicates();
  colorResultMidCells();
});
