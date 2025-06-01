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

export function initItemTableContainer() {
  delegate(document, 'click', '.add-item-btn', handleAddItem);
  delegate(document, 'click', '.delete-item-btn', handleDelete);
  delegate(document, 'click', '.copy-item-btn', handleCopy);
  delegate(document, 'input', '.item-name, .item-value, .item-qty', e => updateRow(e.target.closest('tr')));
}

function handleAddItem(e) {
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
  refreshSummary();
}

export function updateAllTables() {
  $$('.item-table tbody tr').forEach(updateRow);
}
