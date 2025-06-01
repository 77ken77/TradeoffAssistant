// Highlight duplicate item names in item tables
import { $$ } from '../core/dom-utils.js';
import { ITEM_COLOR_PALETTE } from '../core/constants.js';

export function highlightDuplicates() {
  const allInputs = $$('.item-name');
  const nameMap = {};
  allInputs.forEach(inp => {
    const val = inp.value.trim().toLowerCase();
    if (!val) return;
    if (!nameMap[val]) nameMap[val] = [];
    nameMap[val].push(inp);
  });
  const names = Object.keys(nameMap).filter(name => nameMap[name].length > 1);
  const colorMap = {};
  names.forEach((name, idx) => {
    colorMap[name] = ITEM_COLOR_PALETTE[idx % ITEM_COLOR_PALETTE.length];
  });
  allInputs.forEach(inp => {
    const row = inp.closest('tr');
    if (row) {
      row.style.backgroundColor = '';
      row.classList.remove('duplicate-item-row');
    }
    inp.style.backgroundColor = '';
    inp.classList.remove('duplicate-item');
    const valueInput = row?.querySelector('.item-value');
    const qtyInput = row?.querySelector('.item-qty');
    if (valueInput) {
      valueInput.style.backgroundColor = '';
      valueInput.classList.remove('duplicate-item');
    }
    if (qtyInput) {
      qtyInput.style.backgroundColor = '';
      qtyInput.classList.remove('duplicate-item');
    }
  });
  allInputs.forEach(inp => {
    const val = inp.value.trim().toLowerCase();
    const row = inp.closest('tr');
    if (val && colorMap[val]) {
      if (row) {
        row.style.backgroundColor = colorMap[val];
        row.classList.add('duplicate-item-row');
      }
      inp.style.backgroundColor = colorMap[val];
      inp.classList.add('duplicate-item');
      const valueInput = row?.querySelector('.item-value');
      const qtyInput = row?.querySelector('.item-qty');
      if (valueInput) {
        valueInput.style.backgroundColor = colorMap[val];
        valueInput.classList.add('duplicate-item');
      }
      if (qtyInput) {
        qtyInput.style.backgroundColor = colorMap[val];
        qtyInput.classList.add('duplicate-item');
      }
    }
  });
}
