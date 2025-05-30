document.addEventListener('DOMContentLoaded', () => {
  // A) Update constraint labels (already done)
  const defaultLabels = ['A','B','C','D','E'];
  document.getElementsByName('constraint_names')
    .forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        document.querySelectorAll('#designs-table .constraint-label')[idx]
          .textContent = inp.value.trim() || defaultLabels[idx];
      });
  });

  // B) Update design headers live
  const defaultDesigns = ['Design 1','Design 2','Design 3'];
  const designInputs = document.getElementsByName('design_names');
  const designHeaders = document.querySelectorAll('#designs-table .design-header');

  designInputs.forEach((inp, idx) => {
    inp.addEventListener('input', () => {
      designHeaders[idx].textContent = inp.value.trim() || defaultDesigns[idx];
    });
  });

  // C) Dynamic item tables for total/average constraints
  // Helper to create item table HTML
  function createItemTable(constraintIdx, designIdx, type) {
    const tableId = `item-table-${constraintIdx}-${designIdx}`;
    return `
      <table class="item-table" id="${tableId}">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Value</th>
            <th>QTY</th>
            <th>Total Value</th>
            <th>Delete</th>
            <th>Copy</th>
          </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
          <tr>
            <td colspan="6">
              <button type="button" class="add-item-btn" data-table-id="${tableId}">+ ADD ITEM</button>
            </td>
          </tr>
          <tr>
            <td colspan="3">${type === "total" ? "TOTAL" : "AVERAGE"}</td>
            <td class="item-table-sum" colspan="3">0</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // Replace design value cells with item tables if needed
  function updateDesignValueTables() {
    document.querySelectorAll('.design-value-cell').forEach(cell => {
      const constraintIdx = cell.getAttribute('data-constraint-index');
      const designIdx = cell.getAttribute('data-design-index');
      const typeSel = document.querySelector(`.constraint-type-select[data-constraint-index="${constraintIdx}"]`);
      const type = typeSel ? typeSel.value : 'single';
      // Only replace if not already correct
      if (type === 'total' || type === 'average') {
        // Only insert if not already a table
        if (!cell.querySelector('.item-table')) {
          cell.innerHTML = createItemTable(constraintIdx, designIdx, type);
        }
      } else {
        // Only insert if not already an input
        if (!cell.querySelector('input')) {
          cell.innerHTML = `<input name="values_${constraintIdx}_${designIdx}" type="number" step="any" class="form-control design-value-input" required>`;
        }
      }
    });
    setupItemTableEvents();
  }

  // Setup events for add/delete/copy and calculation
  function setupItemTableEvents() {
    document.querySelectorAll('.add-item-btn').forEach(btn => {
      btn.onclick = function() {
        const table = document.getElementById(btn.dataset.tableId);
        const tbody = table.querySelector('tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="text" class="item-name" required></td>
          <td><input type="number" class="item-value" value="0" step="any" required></td>
          <td><input type="number" class="item-qty" value="1" min="1" step="1" required></td>
          <td class="item-total">0</td>
          <td><button type="button" class="delete-item-btn">X DELETE</button></td>
          <td><button type="button" class="copy-item-btn">COPY</button></td>
        `;
        tbody.appendChild(row);
        attachRowEvents(row, table);
        updateTableSum(table);
        setupDynamicInputWidths(); // Ensure new row inputs are auto-sized
      };
    });
    // Attach events to all existing rows (for copy-pasted rows)
    document.querySelectorAll('.item-table tbody tr').forEach(row => {
      const table = row.closest('table');
      attachRowEvents(row, table);
      setupDynamicInputWidths(); // Ensure all row inputs are auto-sized
    });
  }

  function attachRowEvents(row, table) {
    row.querySelectorAll('input').forEach(inp => {
      inp.oninput = () => {
        updateTableSum(table);
        autoResizeInput(inp); // Auto-size on input
      };
      autoResizeInput(inp); // Initial auto-size
    });
    row.querySelector('.delete-item-btn').onclick = () => {
      row.remove();
      updateTableSum(table);
      setupDynamicInputWidths(); // Re-apply after delete
    };
    row.querySelector('.copy-item-btn').onclick = () => {
      copyItemToAllDesigns(row, table.id);
      setupDynamicInputWidths(); // Re-apply after copy
    };
    // Update sum on load
    updateTableSum(table);
  }

  function updateTableSum(table) {
    let sum = 0, count = 0;
    table.querySelectorAll('tbody tr').forEach(row => {
      const valInput = row.querySelector('.item-value');
      const qtyInput = row.querySelector('.item-qty');
      let val = 0, qty = 1;
      if (valInput) val = parseFloat(valInput.value) || 0;
      if (qtyInput) qty = parseFloat(qtyInput.value) || 1;
      const total = val * qty;
      const totalCell = row.querySelector('.item-total');
      if (totalCell) totalCell.textContent = total.toFixed(2);
      sum += total;
      count++;
    });
    const sumCell = table.querySelector('.item-table-sum');
    const tfootLabelCell = table.querySelector('tfoot tr td');
    if (!sumCell || !tfootLabelCell) return; // Prevent error if table is not fully rendered
    const isAverage = tfootLabelCell.textContent.includes('AVERAGE');
    sumCell.textContent = isAverage && count ? (sum / count).toFixed(2) : sum.toFixed(2);
    // After updating the table sum, update the summary table and hidden inputs
    updateSummaryConstraintsTable();
  }

  function copyItemToAllDesigns(row, tableId) {
    const match = tableId.match(/item-table-(\d+)-\d/);
    if (!match) return;
    const constraintIdx = match[1];
    // Get the values from the source row
    const nameInput = row.querySelector('.item-name');
    const valueInput = row.querySelector('.item-value');
    const qtyInput = row.querySelector('.item-qty');
    if (!nameInput || !valueInput || !qtyInput) return;
    const name = nameInput.value;
    const value = valueInput.value;
    const qty = qtyInput.value;
    for (let d = 0; d < 3; d++) {
      const table = document.getElementById(`item-table-${constraintIdx}-${d}`);
      if (!table) continue;
      // Don't copy to the same table if already present with same values
      if (table.contains(row)) continue;
      const tbody = table.querySelector('tbody');
      // Check if an identical row already exists in this table
      let exists = false;
      table.querySelectorAll('tbody tr').forEach(existingRow => {
        const n = existingRow.querySelector('.item-name');
        const v = existingRow.querySelector('.item-value');
        const q = existingRow.querySelector('.item-qty');
        if (n && v && q && n.value === name && v.value === value && q.value === qty) exists = true;
      });
      if (exists) continue;
      // Create a new row with the same values
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td><input type="text" class="item-name" required value="${name}"></td>
        <td><input type="number" class="item-value" value="${value}" step="any" required></td>
        <td><input type="number" class="item-qty" value="${qty}" min="1" step="1" required></td>
        <td class="item-total">0</td>
        <td><button type="button" class="delete-item-btn">X DELETE</button></td>
        <td><button type="button" class="copy-item-btn">COPY</button></td>
      `;
      attachRowEvents(newRow, table);
      tbody.appendChild(newRow);
      updateTableSum(table);
    }
  }

  // Listen for constraint type changes and update design value tables
  document.querySelectorAll('.constraint-type-select').forEach((sel, idx) => {
    sel.addEventListener('change', () => {
      updateDesignValueTables();
    });
  });

  // On page load, initialize design value tables
  updateDesignValueTables();

  // --- SUMMARY OF CONSTRAINTS TABLE (INPUT PAGE) ---
  function updateSummaryConstraintsTable() {
    document.querySelectorAll('.summary-value-cell').forEach(cell => {
      const i = cell.getAttribute('data-constraint-index');
      const d = cell.getAttribute('data-design-index');
      // If item table, sum all items; else, use input value
      const designCell = document.querySelector(`.design-value-cell[data-constraint-index='${i}'][data-design-index='${d}']`);
      let value = '';
      if (designCell) {
        const table = designCell.querySelector('.item-table');
        if (table) {
          // Sum all item values
          let sum = 0;
          table.querySelectorAll('tbody tr').forEach(row => {
            const val = parseFloat(row.querySelector('.item-value')?.value || '0');
            const qty = parseFloat(row.querySelector('.item-qty')?.value || '1');
            sum += val * qty;
          });
          value = sum.toFixed(2);
        } else {
          const inp = designCell.querySelector('input.design-value-input');
          value = inp ? inp.value : '';
        }
      }
      // Update visible value in a span, do not overwrite cell content
      let span = cell.querySelector('.summary-visible-value');
      if (!span) {
        span = document.createElement('span');
        span.className = 'summary-visible-value';
        cell.prepend(span);
      }
      span.textContent = value;
      // Update hidden input
      const hidden = cell.querySelector('input[type="hidden"]');
      if (hidden) hidden.value = value;
    });
    // Also update the value attribute of the hidden input (for form submission)
    document.querySelectorAll('.summary-value-cell input[type="hidden"]').forEach(inp => {
      inp.setAttribute('value', inp.value);
    });
  }
  // Update summary table on any input change
  document.addEventListener('input', updateSummaryConstraintsTable);
  document.addEventListener('change', updateSummaryConstraintsTable);
  // Initial update
  updateSummaryConstraintsTable();

  // EXPORT/IMPORT FEATURE
  // 1. Export all form data to JSON
  function exportFormData() {
    const data = {};
    // Design names
    data.design_names = Array.from(document.getElementsByName('design_names')).map(inp => inp.value);
    // Constraints
    data.constraints = Array.from(document.getElementsByName('constraint_names')).map(inp => inp.value);
    data.constraint_types = Array.from(document.getElementsByName('constraint_types')).map(sel => sel.value);
    data.constraint_prefs = Array.from(document.getElementsByName('constraint_prefs')).map(sel => sel.value);
    data.constraint_imps = Array.from(document.getElementsByName('constraint_imps')).map(sel => sel.value);
    // Design values (single)
    data.values = {};
    document.querySelectorAll('.design-value-cell').forEach(cell => {
      const i = cell.getAttribute('data-constraint-index');
      const d = cell.getAttribute('data-design-index');
      const inp = cell.querySelector('input.design-value-input');
      if (inp) {
        data.values[`values_${i}_${d}`] = inp.value;
      }
    });
    // Item tables
    data.item_tables = {};
    document.querySelectorAll('.item-table').forEach(table => {
      const id = table.id;
      const rows = [];
      table.querySelectorAll('tbody tr').forEach(row => {
        const name = row.querySelector('.item-name')?.value || '';
        const value = row.querySelector('.item-value')?.value || '';
        const qty = row.querySelector('.item-qty')?.value || '';
        if (name || value || qty) rows.push({name, value, qty});
      });
      data.item_tables[id] = rows;
    });
    // Download as JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tradeoff_form_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 2. Import form data from JSON
  function importFormData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = JSON.parse(e.target.result);
      // Design names
      if (data.design_names) {
        document.getElementsByName('design_names').forEach((inp, idx) => {
          inp.value = data.design_names[idx] || '';
          inp.dispatchEvent(new Event('input'));
        });
      }
      // Constraints
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
      // Wait for tables to render, then fill values
      setTimeout(() => {
        // Design values (single)
        if (data.values) {
          Object.entries(data.values).forEach(([key, val]) => {
            const inp = document.querySelector(`input[name="${key}"]`);
            if (inp) inp.value = val;
          });
        }
        // Item tables
        if (data.item_tables) {
          Object.entries(data.item_tables).forEach(([tableId, rows]) => {
            // Find the cell for this table
            const match = tableId.match(/item-table-(\d+)-(\d+)/);
            if (!match) return;
            const constraintIdx = match[1];
            const designIdx = match[2];
            const cell = document.querySelector(`.design-value-cell[data-constraint-index='${constraintIdx}'][data-design-index='${designIdx}']`);
            // Get the type for this constraint
            const typeSel = document.querySelector(`.constraint-type-select[data-constraint-index='${constraintIdx}']`);
            const type = typeSel ? typeSel.value : 'total';
            // Re-render the full item table HTML (headers, add-item, sum row)
            cell.innerHTML = createItemTable(constraintIdx, designIdx, type);
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
              attachRowEvents(tr, table);
            });
            updateTableSum(table);
          });
        }
        // After all tables are restored, re-attach all item table events
        setupItemTableEvents();
        // And update all table sums again to ensure correct display
        document.querySelectorAll('.item-table').forEach(table => updateTableSum(table));
        // Ensure summary table and hidden inputs are updated after import
        updateSummaryConstraintsTable();
      }, 200);
    };
    reader.readAsText(file);
  }

  // Add export/import buttons to the page
  function addExportImportButtons() {
    const form = document.querySelector('form');
    if (!form) return;
    const div = document.createElement('div');
    div.style.marginBottom = '1rem';
    div.innerHTML = `
      <button type="button" id="export-btn">Export</button>
      <input type="file" id="import-file" style="display:none" accept="application/json">
      <button type="button" id="import-btn">Import</button>
    `;
    form.parentNode.insertBefore(div, form);
    document.getElementById('export-btn').onclick = exportFormData;
    document.getElementById('import-btn').onclick = () => {
      document.getElementById('import-file').click();
    };
    document.getElementById('import-file').onchange = function(e) {
      if (e.target.files && e.target.files[0]) {
        importFormData(e.target.files[0]);
      }
    };
  }

  // Call after DOM loaded
  addExportImportButtons();

  // Ensure hidden summary inputs have correct value attribute on submit
  document.querySelector('form').addEventListener('submit', function() {
    updateSummaryConstraintsTable();
    document.querySelectorAll('.summary-value-cell input[type="hidden"]').forEach(inp => {
      inp.setAttribute('value', inp.value);
    });
  });

  // --- DYNAMIC INPUT WIDTHS ---
  function autoResizeInput(input) {
    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'fixed';
    span.style.whiteSpace = 'pre';
    span.style.font = getComputedStyle(input).font;
    span.textContent = input.value || input.placeholder || '';
    document.body.appendChild(span);
    // Add some extra space for cursor
    const width = Math.max(span.offsetWidth + 18, 32); // min 32px
    input.style.width = width + 'px';
    document.body.removeChild(span);
  }

  function setupDynamicInputWidths() {
    // For all .dynamic-width inputs
    document.querySelectorAll('input.dynamic-width').forEach(inp => {
      autoResizeInput(inp);
      inp.addEventListener('input', () => autoResizeInput(inp));
    });
    // For item table value/qty inputs
    document.querySelectorAll('.item-table input[type="number"], .item-table input[type="text"]').forEach(inp => {
      autoResizeInput(inp);
      inp.addEventListener('input', () => autoResizeInput(inp));
    });
  }

  // Call after DOM loaded and after any table update
  setupDynamicInputWidths();

  // Also call after design value tables or item tables are updated
  const origUpdateDesignValueTables = updateDesignValueTables;
  updateDesignValueTables = function() {
    origUpdateDesignValueTables();
    setupDynamicInputWidths();
  };

  // Also call after import
  const origImportFormData = importFormData;
  importFormData = function(file) {
    origImportFormData(file);
    setTimeout(setupDynamicInputWidths, 300);
  };
});
