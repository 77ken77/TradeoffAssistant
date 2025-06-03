// Handles dynamic item tables and row logic
import { $$, on, delegate } from '../core/dom-utils.js';
import { highlightDuplicates } from './duplicates.js';
import { refreshSummary } from './summary-table.js';

export function createItemTableHTML(constraintIdx, designIdx, type) {
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

let itemTableDelegated = false;
export function initItemTableContainer() {
  console.log('initItemTableContainer called');
  // Only handle table rendering, not event delegation
  // Remove previous event listeners by replacing buttons with clones
  document.querySelectorAll('.add-item-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  document.querySelectorAll('.delete-item-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  document.querySelectorAll('.copy-item-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  // Do NOT delegate here anymore
}

// Delegate events ONCE at module load
delegate(document, 'click', '.add-item-btn', handleAddItem);
delegate(document, 'click', '.delete-item-btn', handleDelete);
delegate(document, 'click', '.copy-item-btn', handleCopy);
delegate(document, 'input', '.item-name, .item-value, .item-qty', e => updateRow(e.target.closest('tr')));

// Listen for constraint type changes and update design value cells accordingly
function handleConstraintTypeChange(e) {
  const sel = e.target;
  const constraintIdx = sel.getAttribute('data-constraint-index');
  const type = sel.value;
  document.querySelectorAll(`.design-value-cell[data-constraint-index='${constraintIdx}']`).forEach((cell, designIdx) => {
    if (type === 'total' || type === 'average') {
      // Render item table if not present
      if (!cell.querySelector('.item-table')) {
        cell.innerHTML = createItemTableHTML(constraintIdx, designIdx, type);
      } else {
        // Update label if switching between total/average
        const tfootLabelCell = cell.querySelector('tfoot tr td');
        if (tfootLabelCell) tfootLabelCell.textContent = type === 'total' ? 'TOTAL' : 'AVERAGE';
      }
      initItemTableContainer();
      updateTableSum(cell.querySelector('.item-table'));
    } else {
      // Render single input if not present
      if (!cell.querySelector('input.design-value-input')) {
        cell.innerHTML = `<input name="values_${constraintIdx}_${designIdx}" type="number" step="any" class="form-control design-value-input" required>`;
      }
    }
  });
  refreshSummary();
}

// Attach event listener for constraint type changes
export function initItemTableTypeSwitch() {
  document.querySelectorAll('.constraint-type-select').forEach(sel => {
    sel.removeEventListener('change', handleConstraintTypeChange); // prevent duplicate
    sel.addEventListener('change', handleConstraintTypeChange);
  });
}

function handleAddItem(e) {
  console.log('handleAddItem called', e);
  const table = document.getElementById(e.target.dataset.tableId);
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
  updateRow(row);
  highlightDuplicates();
}

function handleDelete(e) {
  const row = e.target.closest('tr');
  if (row) row.remove();
  refreshSummary();
  highlightDuplicates();
}

function handleCopy(e) {
  // Implement copy logic as needed
}

function updateRow(row) {
  const valInput = row.querySelector('.item-value');
  const qtyInput = row.querySelector('.item-qty');
  let val = valInput ? parseFloat(valInput.value) || 0 : 0;
  let qty = qtyInput ? parseFloat(qtyInput.value) || 1 : 1;
  const totalCell = row.querySelector('.item-total');
  if (totalCell) totalCell.textContent = (val * qty).toFixed(2);
  // After updating a row, update the table sum for the parent table
  const table = row.closest('.item-table');
  if (table) updateTableSum(table);
  refreshSummary();
}

function updateTableSum(table) {
  let sum = 0, count = 0;
  table.querySelectorAll('tbody tr').forEach(row => {
    const val = parseFloat(row.querySelector('.item-value')?.value || '0');
    const qty = parseFloat(row.querySelector('.item-qty')?.value || '1');
    sum += val * qty;
    count++;
  });
  const tfootLabelCell = table.querySelector('tfoot tr td');
  const isAverage = tfootLabelCell && tfootLabelCell.textContent.includes('AVERAGE');
  const sumCell = table.querySelector('.item-table-sum');
  if (sumCell) sumCell.textContent = isAverage && count ? (sum / count).toFixed(2) : sum.toFixed(2);
}

export function updateAllTables() {
  $$('.item-table').forEach(table => {
    table.querySelectorAll('tbody tr').forEach(updateRow);
    updateTableSum(table);
  });
}

// At the end of the file, export updateTableSum for use in other modules
export { updateTableSum };
