const SVGS = {
  passenger: '<svg viewBox="0 0 220 100" xmlns="http://www.w3.org/2000/svg"><path d="M15 70 L22 48 Q28 32 50 28 L95 24 Q130 22 165 28 L185 33 L200 50 L205 70 Z" fill="currentColor" opacity=".85"/><path d="M50 30 L75 14 Q90 10 110 10 L140 12 Q155 14 165 28 L60 30 Z" fill="currentColor" opacity=".55"/><circle cx="60" cy="72" r="12" fill="#fff"/><circle cx="60" cy="72" r="7" fill="#1f1f1f"/><circle cx="165" cy="72" r="12" fill="#fff"/><circle cx="165" cy="72" r="7" fill="#1f1f1f"/></svg>',
  motorcycle: '<svg viewBox="0 0 220 100" xmlns="http://www.w3.org/2000/svg"><path d="M65 60 Q90 25 120 30 L150 35 L170 50 L155 65 Z" fill="currentColor" opacity=".85"/><circle cx="55" cy="70" r="22" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="175" cy="70" r="22" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="55" cy="70" r="5" fill="currentColor"/><circle cx="175" cy="70" r="5" fill="currentColor"/></svg>'
};
const BRAND_COLORS = {BMW:['#1c69d4','#0653b6'],'Mercedes-Benz':['#888','#444'],Audi:['#bb0a30','#7a0014'],Tesla:['#e31937','#8b0d1e'],Porsche:['#d4af37','#856a14'],Toyota:['#eb0a1e','#a30614'],Honda:['#cc0000','#7a0000'],Ford:['#003478','#001f4d'],Volkswagen:['#001e50','#001031'],Volvo:['#1d3c6e','#0e2347'],Mazda:['#101010','#000'],Hyundai:['#002c5f','#001a3a'],Kia:['#05141f','#000'],Nissan:['#c3002f','#7f001f'],Chevrolet:['#d4af37','#a8861a'],Lexus:['#1e2c50','#0c1530']};

let DATA = null;
const STATE = { type: '', brand: '', series: '', model: '', year: '' };

const el = {
  type: document.getElementById('sel-type'),
  brand: document.getElementById('sel-brand'),
  series: document.getElementById('sel-series'),
  model: document.getElementById('sel-model'),
  year: document.getElementById('sel-year'),
  search: document.getElementById('btn-search'),
  reset: document.getElementById('btn-reset'),
  count: document.getElementById('info-count'),
  results: document.getElementById('results-container'),
  resultsCount: document.getElementById('results-count'),
  resultsMeta: document.getElementById('results-meta'),
  brandQuick: document.getElementById('brand-quick')
};

function formatNum(n) { return new Intl.NumberFormat('pl-PL').format(n); }
function fillSelect(s, items, placeholder, disabled, formatter) {
  s.innerHTML = '<option value="">' + placeholder + '</option>';
  items.forEach(it => {
    const v = formatter ? formatter(it).value : it;
    const l = formatter ? formatter(it).label : it;
    s.innerHTML += '<option value="' + v + '">' + l + '</option>';
  });
  s.disabled = !!disabled;
}
function cleanBrand(b) { return (b || '').replace(/^[A-Z]\s+/, '').replace(/^\s+|\s+$/g, ''); }
function getBrandGrad(b) {
  const k = cleanBrand(b);
  const c = BRAND_COLORS[k] || ['#ff8565', '#f0506e'];
  return 'linear-gradient(135deg,' + c[0] + ' 0%,' + c[1] + ' 100%)';
}
function vehicleType() { return STATE.type === '7' ? 'motorcycle' : 'passenger'; }

function uniqueBrands() {
  const set = new Map();
  (DATA.templates || []).forEach(t => {
    const k = cleanBrand(t.brand);
    if (k) set.set(k, (set.get(k) || 0) + 1);
  });
  return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
}
function uniqueSeriesForBrand(brand) {
  const set = new Set();
  (DATA.templates || []).filter(t => cleanBrand(t.brand) === brand).forEach(t => t.series && set.add(t.series));
  return Array.from(set).sort();
}
function uniqueModelsForBrandSeries(brand, series) {
  const set = new Set();
  (DATA.templates || []).filter(t => cleanBrand(t.brand) === brand && (!series || t.series === series)).forEach(t => t.model && set.add(t.model));
  return Array.from(set).sort();
}
function uniqueYearsFor(brand, series, model) {
  const set = new Set();
  (DATA.templates || []).filter(t => cleanBrand(t.brand) === brand && (!series || t.series === series) && (!model || t.model === model)).forEach(t => t.year && set.add(t.year));
  return Array.from(set).sort().reverse();
}
function filteredTemplates() {
  return (DATA.templates || []).filter(t => {
    if (STATE.brand && cleanBrand(t.brand) !== STATE.brand) return false;
    if (STATE.series && t.series !== STATE.series) return false;
    if (STATE.model && t.model !== STATE.model) return false;
    if (STATE.year && t.year !== STATE.year) return false;
    return true;
  });
}
function updateCount() { el.count.textContent = formatNum(filteredTemplates().length); }
function loadBrands() {
  const brands = uniqueBrands();
  fillSelect(el.brand, brands, 'Wybierz marke...', false, b => ({ value: b[0], label: b[0] + ' (' + b[1] + ')' }));
}
function loadSeries() {
  if (!STATE.brand) { fillSelect(el.series, [], 'Najpierw marka', true); return; }
  fillSelect(el.series, uniqueSeriesForBrand(STATE.brand), 'Wybierz serie (opcjonalnie)', false);
}
function loadModels() {
  if (!STATE.brand) { fillSelect(el.model, [], 'Najpierw marka', true); return; }
  fillSelect(el.model, uniqueModelsForBrandSeries(STATE.brand, STATE.series), 'Wybierz model (opcjonalnie)', false);
}
function loadYears() {
  if (!STATE.brand) { fillSelect(el.year, [], 'Najpierw marka', true); return; }
  fillSelect(el.year, uniqueYearsFor(STATE.brand, STATE.series, STATE.model), 'Wybierz rok (opcjonalnie)', false);
}

function renderResults() {
  if (!STATE.brand) {
    el.results.innerHTML = '<div class="empty-state"><div class="emoji">&#128663;</div><h3>Wybierz marke pojazdu</h3><p>aby zobaczyc dostepne szablony PPF z bazy YINK</p></div>';
    el.resultsCount.textContent = '';
    el.resultsMeta.innerHTML = '';
    return;
  }
  const all = filteredTemplates();
  const tpls = all.slice(0, 60);
  el.resultsCount.textContent = '(' + formatNum(all.length) + ' szablonow)';
  let chips = '';
  if (STATE.brand) chips += '<span class="chip">' + STATE.brand + '<span class="x" data-clear="brand">&times;</span></span>';
  if (STATE.series) chips += '<span class="chip">' + STATE.series + '<span class="x" data-clear="series">&times;</span></span>';
  if (STATE.model) chips += '<span class="chip">' + STATE.model + '<span class="x" data-clear="model">&times;</span></span>';
  if (STATE.year) chips += '<span class="chip">' + STATE.year + '<span class="x" data-clear="year">&times;</span></span>';
  el.resultsMeta.innerHTML = chips;

  let grid = '<div class="results-grid">';
  tpls.forEach(t => {
    const brand = cleanBrand(t.brand);
    const subject = encodeURIComponent('Zapytanie o szablon PPF: ' + brand + ' ' + (t.series||'') + ' ' + (t.model||'') + ' (' + (t.year||'') + ')');
    grid += '<div class="tpl-card" data-id="' + t.id + '">';
    grid += '<div class="tpl-thumb" style="background:' + getBrandGrad(brand) + ';color:#fff">';
    grid += '<img src="' + t.imageUrl + '" alt="' + brand + ' ' + (t.model||'') + '" loading="lazy" style="width:90%;height:90%;object-fit:contain;filter:drop-shadow(0 4px 14px rgba(0,0,0,.3))">';
    grid += '</div>';
    grid += '<div class="tpl-body">';
    grid += '<div class="tpl-brand">' + brand + '</div>';
    grid += '<div class="tpl-name">' + (t.series || 'Generic') + (t.model ? ' &middot; ' + t.model : '') + '</div>';
    grid += '<div class="tpl-meta">Rok ' + (t.year || '?') + ' &middot; YINK-' + t.id + ' &middot; ' + (t.area || '0.00') + ' m&sup2;</div>';
    grid += '<div class="tpl-actions">';
    grid += '<a href="mailto:pro@prowrap.pl?subject=' + subject + '" class="btn-sm btn-primary">Zapytaj</a>';
    grid += '<button class="btn-sm btn-ghost" data-preview="' + t.imageUrl + '" data-title="' + brand + ' ' + (t.series||'') + ' ' + (t.model||'') + '">Podglad</button>';
    grid += '</div></div></div>';
  });
  grid += '</div>';
  el.results.innerHTML = grid;
}

window.openPreview = function(url, title) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:2rem;cursor:zoom-out;backdrop-filter:blur(4px)';
  overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:1.4rem;max-width:1000px;max-height:90vh;overflow:auto;box-shadow:0 30px 80px rgba(0,0,0,.5)" onclick="event.stopPropagation()"><div style="font-family:Poppins,sans-serif;font-weight:800;margin-bottom:.9rem;color:#1f1f1f;font-size:1.05rem">' + title + '</div><img src="' + url + '" style="max-width:100%;max-height:75vh;display:block;margin:0 auto;background:#f7f7f8;border-radius:8px"></div>';
  overlay.onclick = () => overlay.remove();
  document.addEventListener('keydown', function escListener(e){ if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',escListener);} });
  document.body.appendChild(overlay);
};

function clearLevel(k) {
  const keys = ['brand', 'series', 'model', 'year'];
  const i = keys.indexOf(k);
  for (let j = i; j < keys.length; j++) STATE[keys[j]] = '';
  el.brand.value = STATE.brand; el.series.value = STATE.series; el.model.value = STATE.model; el.year.value = STATE.year;
  loadSeries(); loadModels(); loadYears();
  updateCount(); renderResults();
  el.search.disabled = !STATE.brand;
}

el.type.addEventListener('change', function() { STATE.type = this.value; });
el.brand.addEventListener('change', function() {
  STATE.brand = this.value; STATE.series = ''; STATE.model = ''; STATE.year = '';
  loadSeries(); loadModels(); loadYears(); updateCount();
  el.search.disabled = !STATE.brand;
  if (STATE.brand) renderResults();
});
el.series.addEventListener('change', function() {
  STATE.series = this.value; STATE.model = ''; STATE.year = '';
  loadModels(); loadYears(); updateCount(); renderResults();
});
el.model.addEventListener('change', function() {
  STATE.model = this.value; STATE.year = '';
  loadYears(); updateCount(); renderResults();
});
el.year.addEventListener('change', function() { STATE.year = this.value; updateCount(); renderResults(); });
el.search.addEventListener('click', function() {
  renderResults();
  document.querySelector('.results').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
el.reset.addEventListener('click', function() { clearLevel('brand'); });

document.addEventListener('click', function(e) {
  const c = e.target.closest('[data-clear]');
  if (c) { clearLevel(c.dataset.clear); return; }
  const p = e.target.closest('[data-preview]');
  if (p) window.openPreview(p.dataset.preview, p.dataset.title);
});

fetch('/yink-data.json').then(r => r.json()).then(data => {
  DATA = data;
  fillSelect(el.type, data.types, 'Wszystkie typy', false, t => ({ value: t.id, label: t.val }));
  loadBrands();
  updateCount();
  const topBrands = uniqueBrands().slice(0, 10);
  let quickHtml = '';
  topBrands.forEach(([brand, count]) => {
    const initial = brand[0];
    quickHtml += '<div class="brand-card" data-brand="' + brand + '"><div class="brand-logo" style="background:' + getBrandGrad(brand) + ';-webkit-background-clip:text;background-clip:text;color:transparent">' + initial + '</div><div class="brand-name">' + brand + '</div><div class="brand-count">' + count + ' szablonow</div></div>';
  });
  el.brandQuick.innerHTML = quickHtml;
  el.brandQuick.addEventListener('click', function(e) {
    const c = e.target.closest('[data-brand]');
    if (!c) return;
    el.brand.value = c.dataset.brand; STATE.brand = c.dataset.brand;
    STATE.series = ''; STATE.model = ''; STATE.year = '';
    loadSeries(); loadModels(); loadYears(); updateCount();
    el.search.disabled = false;
    renderResults();
    document.querySelector('.results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}).catch(err => {
  el.results.innerHTML = '<div class="empty-state"><div class="emoji">&#9888;</div><h3>Blad ladowania danych</h3><p>' + err.message + '</p></div>';
});
