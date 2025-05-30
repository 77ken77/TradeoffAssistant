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
      };
    });
    // Attach events to all existing rows (for copy-pasted rows)
    document.querySelectorAll('.item-table tbody tr').forEach(row => {
      const table = row.closest('table');
      attachRowEvents(row, table);
    });
  }

  function attachRowEvents(row, table) {
    row.querySelectorAll('input').forEach(inp => {
      inp.oninput = () => updateTableSum(table);
    });
    row.querySelector('.delete-item-btn').onclick = () => {
      row.remove();
      updateTableSum(table);
    };
    row.querySelector('.copy-item-btn').onclick = () => {
      copyItemToAllDesigns(row, table.id);
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
    const isAverage = table.querySelector('tfoot tr td').textContent.includes('AVERAGE');
    table.querySelector('.item-table-sum').textContent = isAverage && count ? (sum / count).toFixed(2) : sum.toFixed(2);
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
});
