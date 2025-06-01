// Handles dynamic updating of design headers in all relevant tables
import { $$, on } from '../core/dom-utils.js';
import { DEFAULT_DESIGNS } from '../core/constants.js';

export function initDesignHeaders() {
  const designInputs   = $$("input[name='design_names']");
  const designHeaders  = $$('#designs-table .design-header');
  const summaryHeaders = $$('#summary-constraints-table thead th');

  designInputs.forEach((inp, idx) => {
    on(inp, 'input', () => {
      const txt = inp.value.trim() || DEFAULT_DESIGNS[idx];
      designHeaders[idx].textContent = txt;
      if (summaryHeaders[idx+1]) summaryHeaders[idx+1].textContent = txt;
    });
  });
}
