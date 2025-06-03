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
});
