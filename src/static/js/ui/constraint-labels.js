// Handles dynamic updating of constraint labels in all relevant tables
import { $$, on } from '../core/dom-utils.js';
import { DEFAULT_LABELS } from '../core/constants.js';

export function initConstraintLabels() {
  $$("input[name='constraint_names']").forEach((inp, idx) => {
    on(inp, 'input', () => {
      const label = inp.value.trim() || DEFAULT_LABELS[idx];
      $$('#designs-table .constraint-label')[idx].textContent = label;
      $$('.constraint-label-summary')[idx].textContent = label;
    });
  });
}
