// Import form data from JSON and update UI
import { refreshSummary } from '../ui/summary-table.js';
import { createItemTableHTML, initItemTableContainer, updateAllTables } from '../ui/item-table.js';

export function importFormData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    if (data.design_names) {
      document.getElementsByName('design_names').forEach((inp, idx) => {
        inp.value = data.design_names[idx] || '';
        inp.dispatchEvent(new Event('input'));
      });
    }
    if (data.constraints) {
      document.getElementsByName('constraint_names').forEach((inp, idx) => {
        inp.value = data.constraints[idx] || '';
        inp.dispatchEvent(new Event('input'));
      });
    }
    if (data.constraint_types) {
      document.getElementsByName('constraint_types').forEach((sel, idx) => {
        sel.value = data.constraint_types[idx] || 'single';
        sel.dispatchEvent(new Event('change'));
      });
    }
    if (data.constraint_prefs) {
      document.getElementsByName('constraint_prefs').forEach((sel, idx) => {
        sel.value = data.constraint_prefs[idx] || 'min';
      });
    }
    if (data.constraint_imps) {
      document.getElementsByName('constraint_imps').forEach((sel, idx) => {
        sel.value = data.constraint_imps[idx] || '10';
      });
    }
    setTimeout(() => {
      if (data.values) {
        Object.entries(data.values).forEach(([key, val]) => {
          const inp = document.querySelector(`input[name="${key}"]`);
          if (inp) inp.value = val;
        });
      }
      if (data.item_tables) {
        Object.entries(data.item_tables).forEach(([tableId, rows]) => {
          const match = tableId.match(/item-table-(\d+)-(\d+)/);
          if (!match) return;
          const constraintIdx = match[1];
          const designIdx = match[2];
          const typeSel = document.querySelector(`.constraint-type-select[data-constraint-index='${constraintIdx}']`);
          const type = typeSel ? typeSel.value : 'total';
          const cell = document.querySelector(`.design-value-cell[data-constraint-index='${constraintIdx}'][data-design-index='${designIdx}']`);
          if (!cell) return;
          // Render the item table HTML
          cell.innerHTML = createItemTableHTML(constraintIdx, designIdx, type);
          const table = cell.querySelector('.item-table');
          const tbody = table.querySelector('tbody');
          // Add saved rows
          rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><input type="text" class="item-name" required value="${row.name}"></td>
              <td><input type="number" class="item-value" value="${row.value}" step="any" required></td>
              <td><input type="number" class="item-qty" value="${row.qty}" min="1" step="1" required></td>
              <td class="item-total">0</td>
              <td><button type="button" class="delete-item-btn">X DELETE</button></td>
              <td><button type="button" class="copy-item-btn">COPY</button></td>
            `;
            tbody.appendChild(tr);
          });
        });
        // Re-initialize item table events after all tables are restored
        initItemTableContainer();
        updateAllTables();
      }
      refreshSummary();
    }, 200);
  };
  reader.readAsText(file);
}
