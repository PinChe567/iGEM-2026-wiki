(() => {
  'use strict';
  const root = document.querySelector('[data-microscopy-explorer]');
  if (!root) return;
  const condition = root.querySelector('[data-micro-condition]');
  const field = root.querySelector('[data-micro-field]');
  const view = root.querySelector('[data-micro-view]');
  const image = root.querySelector('[data-micro-image]');
  const open = root.querySelector('[data-micro-open]');
  const caption = root.querySelector('[data-micro-caption]');
  const status = root.querySelector('[data-micro-status]');
  const coverage = root.querySelector('[data-micro-coverage]');
  const legend = root.querySelector('.microscopy-legend');
  const base = 'assets/results/microscopy/';
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let records;
  function render(changeCondition = false) {
    const group = records.fields.filter(f => f.condition === condition.value);
    if (changeCondition) {
      field.replaceChildren(...group.map(f => {
        const option = document.createElement('option');
        option.value = f.field;
        option.textContent = 'Field ' + f.field + ' of ' + group.length;
        return option;
      }));
    }
    const row = group.find(f => f.field === Number(field.value));
    if (!row) return;
    field.disabled = group.length === 1;
    coverage.textContent = condition.value + ' · ' + group.length + (group.length === 1 ? ' field acquired' : ' fields acquired') + ' · technical observations';
    legend.hidden = view.value !== 'object-overlay';
    const stem = base + slug(condition.value) + '/field-' + String(row.field).padStart(2, '0');
    const url = stem + '-' + view.value + '.webp';
    image.src = url;
<<<<<<< HEAD
    const viewLabel=view.selectedOptions[0];
    image.alt = condition.value + ', field ' + row.field + ': ' + (window.AeroSenseI18n?.sourceText(viewLabel)||viewLabel.textContent);
=======
    image.alt = condition.value + ', field ' + row.field + ': ' + view.selectedOptions[0].textContent;
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
    image.width = view.value === 'panel' ? 1440 : 1296;
    image.height = view.value === 'panel' ? 1160 : 972;
    open.href = view.value === 'object-overlay' ? stem + '-object-overlay.png' : url;
    const description = view.value === 'panel' || view.value === 'merge-display'
      ? 'Common linear display windows: DAPI 0–255, GREEN 0–120, RED 0–180. These display adjustments are not used in quantification.'
      : view.value === 'object-overlay'
        ? 'Object classifications and exclusions. The merge background is dimmed for legibility. Click for the full-resolution overlay; object numbers match the CSV.'
        : 'Acquired intensity levels; the same channel exposure was used across conditions.';
<<<<<<< HEAD
    const numberLabel = caption.querySelector(':scope > .media-caption__label, :scope > .wiki-figure__num');
    caption.textContent = condition.value + ' · Field ' + row.field + ' of ' + group.length + '. ' + description + ' Technical field, not a biological replicate. Original scale bars are retained; numeric exposure/gain and objective metadata are unavailable.';
    if (numberLabel) caption.prepend(numberLabel);
=======
    caption.textContent = condition.value + ' · Field ' + row.field + ' of ' + group.length + '. ' + description + ' Technical field, not a biological replicate. Original scale bars are retained; numeric exposure/gain and objective metadata are unavailable.';
>>>>>>> b034157e7bf87312c675bab82e5b976e5b227fa0
    status.textContent = row.eligible_objects + ' eligible DAPI objects; RED+ ' + row.red_positive_objects_p99 + ' (' + row.red_positive_fraction_percent_p99.toFixed(1) + '%), GREEN+ ' + row.green_positive_objects_p99 + ' (' + row.green_positive_fraction_percent_p99.toFixed(1) + '%). Eligible objects retain ' + row.eligible_blue_foreground_percent.toFixed(1) + '% of segmented DAPI foreground. These fractions are not transfection efficiency.';
  }
  fetch(base + 'nuclear-object-summary.json').then(r => {
    if (!r.ok) throw new Error('Unavailable microscopy data');
    return r.json();
  }).then(data => {
    records = data;
    render(true);
    condition.addEventListener('change', () => render(true));
    field.addEventListener('change', () => render());
    view.addEventListener('change', () => render());
  }).catch(() => {
    status.textContent = 'The interactive data could not be loaded. The complete tables and all direct field links remain available below.';
    [condition, field, view].forEach(control => { control.disabled = true; });
  });
})();
