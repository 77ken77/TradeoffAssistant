// Handles dynamic results and sensitivity analysis panel
import { refreshSummary } from './summary-table.js';

export async function refreshResults() {
  refreshSummary();
  document.querySelectorAll('.summary-value-cell input[type="hidden"]').forEach(inp => {
    inp.setAttribute('value', inp.value);
  });
  const form = document.getElementById('tradeoff-form');
  const formData = new FormData(form);
  const resp = await fetch(window.location.pathname, {
    method: 'POST',
    body: formData,
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });
  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const newResults = doc.querySelector('#results-table-container');
  const resultsContainer = document.getElementById('results-table-container');
  if (newResults && resultsContainer) {
    resultsContainer.innerHTML = newResults.innerHTML;
  }
  const newImg = doc.querySelector('#sensitivity-chart-img');
  const img = document.getElementById('sensitivity-chart-img');
  if (newImg && img) {
    setTimeout(() => {
      const baseSrc = newImg.src.split('?')[0];
      img.src = baseSrc + '?t=' + Date.now();
    }, 150);
  }
}

export function initResultsAutoRefresh() {
  const form = document.getElementById('tradeoff-form');
  if (form) {
    ['input','change'].forEach(ev => form.addEventListener(ev, refreshResults));
  }
}
