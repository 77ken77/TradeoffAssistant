// Export form data to JSON and trigger download
export function exportFormData() {
  const data = {};
  data.design_names = Array.from(document.getElementsByName('design_names')).map(inp => inp.value);
  data.constraints = Array.from(document.getElementsByName('constraint_names')).map(inp => inp.value);
  data.constraint_types = Array.from(document.getElementsByName('constraint_types')).map(sel => sel.value);
  data.constraint_prefs = Array.from(document.getElementsByName('constraint_prefs')).map(sel => sel.value);
  data.constraint_imps = Array.from(document.getElementsByName('constraint_imps')).map(sel => sel.value);
  data.values = {};
  document.querySelectorAll('.design-value-cell').forEach(cell => {
    const i = cell.getAttribute('data-constraint-index');
    const d = cell.getAttribute('data-design-index');
    const inp = cell.querySelector('input.design-value-input');
    if (inp) {
      data.values[`values_${i}_${d}`] = inp.value;
    }
  });
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
