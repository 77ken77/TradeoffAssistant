// Handles updating the Summary of Constraints table
import { $$ } from '../core/dom-utils.js';
import { highlightDuplicates } from './duplicates.js';

export function refreshSummary() {
  $$('.summary-value-cell').forEach(cell => {
    const i = cell.getAttribute('data-constraint-index');
    const d = cell.getAttribute('data-design-index');
    const designCell = document.querySelector(`.design-value-cell[data-constraint-index='${i}'][data-design-index='${d}']`);
    let value = '';
    if (designCell) {
      const table = designCell.querySelector('.item-table');
      if (table) {
        let sum = 0, count = 0;
        table.querySelectorAll('tbody tr').forEach(row => {
          const val = parseFloat(row.querySelector('.item-value')?.value || '0');
          const qty = parseFloat(row.querySelector('.item-qty')?.value || '1');
          sum += val * qty;
          count++;
        });
        const tfootLabelCell = table.querySelector('tfoot tr td');
        const isAverage = tfootLabelCell && tfootLabelCell.textContent.includes('AVERAGE');
        value = isAverage && count ? (sum / count).toFixed(2) : sum.toFixed(2);
      } else {
        const inp = designCell.querySelector('input.design-value-input');
        value = inp ? inp.value : '';
      }
    }
    let span = cell.querySelector('.summary-visible-value');
    if (!span) {
      span = document.createElement('span');
      span.className = 'summary-visible-value';
      cell.prepend(span);
    }
    span.textContent = value;
    const hidden = cell.querySelector('input[type="hidden"]');
    if (hidden) {
      hidden.value = value;
      hidden.setAttribute('value', value);
    }
  });
  highlightDuplicates();
}

export function initSummaryAutoRefresh() {
  ['input','change'].forEach(ev => document.addEventListener(ev, refreshSummary));
}
