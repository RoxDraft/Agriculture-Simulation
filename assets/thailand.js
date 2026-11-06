/* Thailand regional planning map: relief raster, layers, region dossier, A→B planner. */
(function(){
const T = window.TH;
const EN = window.TH_EN || {}, isEn = () => !!(window.I18N && I18N.lang === 'en');
const tr = s => isEn() && EN[s] != null ? EN[s] : s, TT = (th, en) => isEn() ? en : th;
const M_ = () => TT('ม.', 'm'), KM_ = () => TT('กม.', 'km'), MCM_ = () => TT('ล้าน ลบ.ม.', 'million m³');
const SVGNS = 'http://www.w3.org/2000/svg';
const KX = 66, KY = 68, LON0 = 97.2, LAT0 = 20.8;
const X = lon => (lon - LON0) * KX, Y = lat => (LAT0 - lat) * KY;
const LON = x => x / KX + LON0, LAT = y => LAT0 - y / KY;
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const isDark = () => css('--paper').toLowerCase() !== '#ffffff';
const fmt = (n, d=0) => Number(n).toLocaleString('th-TH', {maximumFractionDigits:d, minimumFractionDigits:d});
const store = {get(k,d){try{const v=localStorage.getItem('th.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem('th.'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- geography models ---------- */
function regionOf(lon, lat){
  if (lat < 10.95) return 'S';
  if (lat < 13.65 && lon < 100.18) return 'W';
  if (lat >= 13.65 && lat < 15.3 && lon < 99.75) return 'W';
  if (lat >= 15.3 && lat < 17.75 && lon < 99.15) return 'W';
  if (lat >= 17.6 && lon < 101.25) return 'N';
  if (lon >= 101.25 && lat >= 16.7) return 'NE';
  if (lon >= 101.45 && lat >= 14.15) return 'NE';
  if (lon >= 100.85 && lat < 14.15) return 'E';
  return 'C';
}
function segDist(px, py, ax, ay, bx, by){
  const dx = bx-ax, dy = by-ay, L = dx*dx + dy*dy;
  let t = L ? ((px-ax)*dx + (py-ay)*dy) / L : 0; t = Math.max(0, Math.min(1, t));
  const qx = ax + t*dx - px, qy = ay + t*dy - py; return Math.sqrt(qx*qx + qy*qy);
}
function elev(lon, lat){
  const r = regionOf(lon, lat); let b;
  if (r === 'C') b = Math.max(1, (lat-13.45)*14) + (lon > 100.8 && lat > 14.6 && lat < 17.5 ? 80 : 0);
  else if (r === 'NE') b = 150 + (lat-15)*20 - (lon-103)*12;
  else if (r === 'N') b = 230;
  else if (r === 'W') b = 30 + Math.max(0, lat-12)*10;
  else if (r === 'E') b = 15;
  else b = 10;
  // strongest ridge wins plus a small share of the rest, so overlapping ranges don't stack into a plateau
  let top = 0, rest = 0;
  for (const [x1,y1,x2,y2,H,w] of T.ridges){ const d = segDist(lon, lat, x1, y1, x2, y2); if (d < w*3.5){ const v = H*Math.exp(-d*d/(2*w*w)); if (v > top){ rest += top; top = v } else rest += v } }
  return Math.max(0, Math.round(b + top + rest*0.15));
}
const HYPS = [[0,'#4f8f5a'],[20,'#79a85f'],[50,'#a9c26a'],[100,'#d6cf7c'],[200,'#e3b86b'],[400,'#cc9158'],[700,'#a96a45'],[1000,'#86594a'],[1500,'#b0a097'],[2000,'#efebe7']];
function mix(a, b, k){ const p = s => [1,3,5].map(i => parseInt(s.slice(i,i+2),16)); const A = p(a), B = p(b); return 'rgb(' + A.map((v,i) => Math.round(v*k + B[i]*(1-k))).join(',') + ')' }
function hypColor(h){ let c = HYPS[0][1]; for (const [t,col] of HYPS) if (h >= t) c = col; return c }

/* ---------- state ---------- */
const S = {
  region: store.get('region','N'),
  mode: store.get('mode','relief'),
  layers: store.get('layers', {rivers:1,lakes:1,cities:1,road:0,rail:0,grid:0,water:0,port:1,air:0,pow:0,ind:1}),
  a: store.get('a','cnx'), b: store.get('b','bkk'), next: 'a'
};

/* ---------- relief raster ---------- */
const STEP = 0.04, SC = 1.5;
const cells = [];
for (let lat = 20.8; lat > 5.4; lat -= STEP) for (let lon = 97.2; lon < 105.9; lon += STEP){
  const cl = lon + STEP/2, ct = lat - STEP/2; cells.push([lon, lat, elev(cl, ct), regionOf(cl, ct)]);
}
const outlinePath = () => {
  const p = new Path2D(); T.outline.forEach(([lo,la],i) => i ? p.lineTo(X(lo)*SC, Y(la)*SC) : p.moveTo(X(lo)*SC, Y(la)*SC)); p.closePath();
  T.islands.forEach(([lo,la,rx,ry]) => { p.moveTo(X(lo+rx)*SC, Y(la)*SC); p.ellipse(X(lo)*SC, Y(la)*SC, rx*KX*SC, ry*KY*SC, 0, 0, Math.PI*2) });
  return p;
};
const clipP = outlinePath();
const hitCv = document.createElement('canvas'), hitCtx = hitCv.getContext('2d');
function renderRaster(){
  const cv = document.createElement('canvas'); cv.width = 580*SC; cv.height = 1050*SC;
  const ctx = cv.getContext('2d'); ctx.save(); ctx.clip(clipP);
  const w = STEP*KX*SC + 1.2, h = STEP*KY*SC + 1.2, dark = isDark();
  // cells overlap by a pixel, so blend toward the paper colour here instead of using globalAlpha
  const paper = css('--paper'), memo = {};
  for (const [lon, lat, e, r] of cells){
    const base = S.mode === 'region' ? T.regions[r].color : hypColor(e);
    const keep = S.mode === 'region' ? (r === S.region ? .8 : .35) : (r === S.region ? (dark ? .85 : 1) : (dark ? .45 : .5));
    const key = base + keep;
    ctx.fillStyle = memo[key] || (memo[key] = mix(base, paper, keep));
    ctx.fillRect(X(lon)*SC, Y(lat)*SC, w, h);
  }
  ctx.restore();
  // region borders: draw where neighbouring cells change region
  ctx.save(); ctx.clip(clipP); ctx.globalAlpha = .9; ctx.fillStyle = css('--ink');
  const cols = Math.round(8.7/STEP)+1;
  for (let i = 0; i < cells.length; i++){
    const c = cells[i], rt = cells[i+1], dn = cells[i+cols];
    if (rt && rt[3] !== c[3] && rt[1] === c[1]) ctx.fillRect(X(rt[0])*SC-0.6, Y(c[1])*SC, 1.2, h);
    if (dn && dn[3] !== c[3]) ctx.fillRect(X(c[0])*SC, Y(dn[1])*SC-0.6, w, 1.2);
  }
  ctx.restore();
  $('relief').setAttribute('href', cv.toDataURL('image/png'));
}

/* ---------- SVG helpers ---------- */
function el(tag, attrs, parent){ const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e }
const pts = arr => arr.map(([lo,la]) => X(lo).toFixed(1)+','+Y(la).toFixed(1)).join(' ');
function title(e, t){ el('title', {}, e).textContent = t; return e }

function drawStatic(){
  ['gRegLbl','gRivers','gLakes','gRoad','gRail','gGrid','gWater','gPts','gCity','gSea'].forEach(id => $(id).innerHTML = '');
  $('outline').setAttribute('d', 'M' + T.outline.map(([lo,la]) => X(lo).toFixed(1)+' '+Y(la).toFixed(1)).join('L') + 'Z');
  const gR = $('gRivers');
  T.rivers.forEach(([n, o, p]) => title(el('polyline', {points:pts(p), fill:'none', stroke:'var(--river)', 'stroke-width':[0,2.4,1.5,.9][o], 'stroke-linecap':'round', 'stroke-linejoin':'round'}, gR), TT('แม่น้ำ' + n, tr(n) + ' River')));
  [['ปิง',98.75,18.2],['วัง',99.38,17.95],['ยม',100.0,17.4],['น่าน',100.35,16.2],['เจ้าพระยา',100.62,14.7],['มูล',103.4,15.0],['ชี',103.0,16.55],['โขง',104.95,17.0],['แม่กลอง',99.6,13.75],['ป่าสัก',101.25,15.9],['ตาปี',99.55,8.7],['บางปะกง',101.45,13.8]]
    .forEach(([n,lo,la]) => el('text', {class:'lbl', x:X(lo), y:Y(la), fill:'var(--river)', style:'fill:var(--river);font-size:9.5px'}, gR).textContent = tr(n));
  const gL = $('gLakes');
  T.lakes.forEach(([lo,la,rx,ry,n,cap,k]) => {
    const g = el('g', {}, gL);
    el('ellipse', {cx:X(lo), cy:Y(la), rx:rx*KX, ry:ry*KY, fill:'var(--river)', 'fill-opacity':k==='lake'?.55:.75, stroke:'var(--paper)', 'stroke-width':.8}, g);
    title(g, tr(n) + (cap ? ` · ${TT('ความจุ','capacity')} ~${fmt(cap)} ${MCM_()}` : ''));
    if (cap > 2000 || k === 'lake' && rx > .08) el('text', {class:'lbl', x:X(lo+rx)+3, y:Y(la)+3, style:'font-size:9px'}, g).textContent = isEn() ? tr(n).replace(/ Dam$/,'') : n.replace('เขื่อน','');
  });
  T.seas.forEach(([lo,la,n]) => el('text', {class:'lbl sea', x:X(lo), y:Y(la), 'text-anchor':'middle'}, $('gSea')).textContent = tr(n));
  el('text', {class:'lbl', x:10, y:18, style:'font-size:11px'}, $('gSea')).textContent = 'N ↑';
  // scale bar 100 km ≈ 0.9 deg lat
  const g = el('g', {}, $('gSea')); const y0 = 1030, len = 100/111*KY;
  el('line', {x1:20, y1:y0, x2:20+len, y2:y0, stroke:'var(--ink)', 'stroke-width':2}, g);
  el('text', {class:'lbl', x:20, y:y0-5}, g).textContent = TT('100 กม. (โดยประมาณ)', '100 km (approx.)');
  const lines = (gid, list, stroke, w, dash) => list.forEach(([n,p]) => title(el('polyline', {points:pts(p), fill:'none', stroke, 'stroke-width':w, 'stroke-dasharray':dash||'', 'stroke-linecap':'round', 'stroke-linejoin':'round', opacity:.9}, $(gid)), tr(n)));
  lines('gRoad', T.roads, '#c0392b', 1.6);
  lines('gRail', T.rails, 'var(--ink)', 1.4, '5 3');
  lines('gGrid', T.grid, '#e0a800', 1.6, '1 3');
  lines('gWater', T.waterways, '#1e5fa8', 2.2, '8 3');
  const gP = $('gPts');
  T.points.forEach(([k,n,lo,la]) => {
    const g = el('g', {'data-k': k==='sol'||k==='wnd' ? 'pow' : k}, gP), x = X(lo), y = Y(la);
    if (k === 'port') el('rect', {x:x-4, y:y-4, width:8, height:8, fill:'#1e5fa8', stroke:'var(--paper)', 'stroke-width':1}, g);
    else if (k === 'air') el('path', {d:`M${x} ${y-5}L${x+5} ${y+4}L${x-5} ${y+4}Z`, fill:'#6b4fa0', stroke:'var(--paper)', 'stroke-width':1}, g);
    else if (k === 'ind') el('path', {d:`M${x} ${y-5}L${x+5} ${y}L${x} ${y+5}L${x-5} ${y}Z`, fill:'#8a5a44', stroke:'var(--paper)', 'stroke-width':1}, g);
    else { el('circle', {cx:x, cy:y, r:4.5, fill:k==='sol'?'#e0a800':k==='wnd'?'#3b8a8f':'#e07b00', stroke:'var(--paper)', 'stroke-width':1}, g);
           el('path', {d:`M${x+1} ${y-3}L${x-2} ${y+.5}H${x}L${x-1} ${y+3}L${x+2} ${y-.5}H${x}Z`, fill:'#fff'}, g) }
    title(g, tr(n));
  });
  const gC = $('gCity');
  T.cities.forEach(([id,n,lo,la,e]) => {
    const g = el('g', {class:'city', tabindex:0, role:'button', 'data-id':id, 'aria-label':`${tr(n)} ${TT('สูง','elevation')} ${e} ${M_()}`}, gC);
    el('circle', {cx:X(lo), cy:Y(la), r:4}, g);
    const far = X(lo) > 470; el('text', {class:'lbl', x:far ? X(lo)-6 : X(lo)+6, y:Y(la)+3.5, 'text-anchor':far ? 'end' : 'start'}, g).textContent = tr(n);
    title(g, `${tr(n)} · ${TT('สูงจากระดับทะเลราว','about')} ${e} ${TT('ม.','m above sea level')}`);
    const pick = ev => { ev.stopPropagation(); setPoint(id) };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); pick(ev) } });
  });
  const gRL = $('gRegLbl');
  Object.entries(T.regions).forEach(([k,r]) => el('text', {class:'lbl rg', x:X(r.lbl[0]), y:Y(r.lbl[1]), 'text-anchor':'middle', 'data-r':k}, gRL).textContent = tr(r.name));
}

/* ---------- map interaction ---------- */
const svg = $('map');
function svgPoint(ev){ const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()) }
function inLand(x, y){ return hitCtx.isPointInPath(clipP, x*SC, y*SC) }
svg.addEventListener('pointermove', ev => {
  const p = svgPoint(ev), lo = LON(p.x), la = LAT(p.y);
  if (!inLand(p.x, p.y)){ $('readout').textContent = `${la.toFixed(2)}°N ${lo.toFixed(2)}°E · ${TT('ทะเล/ประเทศเพื่อนบ้าน','sea / neighboring country')}`; return }
  const r = T.regions[regionOf(lo, la)];
  $('readout').textContent = `${la.toFixed(2)}°N ${lo.toFixed(2)}°E · ${tr(r.name)} · ${TT('ความสูงโดยประมาณ','approx. elevation')} ${fmt(elev(lo, la))} ${M_()}`;
});
svg.addEventListener('click', ev => { const p = svgPoint(ev); if (inLand(p.x, p.y)) selectRegion(regionOf(LON(p.x), LAT(p.y))) });

function setPoint(id){
  if (S.next === 'a'){ S.a = id; S.next = 'b' } else { S.b = id; S.next = 'a' }
  if (S.a === S.b) S.next = 'b';
  $('selA').value = S.a; $('selB').value = S.b; plan();
}

/* ---------- layers & legend ---------- */
const LAYERS = [['rivers','แม่น้ำ','gRivers','Rivers'],['lakes','อ่าง/บึง','gLakes','Reservoirs/lakes'],['cities','เมือง','gCity','Cities'],['road','ถนนหลัก','gRoad','Main roads'],['rail','รถไฟ','gRail','Rail'],['water','เส้นทางเรือ','gWater','Waterways'],['grid','สายส่งไฟฟ้า','gGrid','Power lines'],['port','ท่าเรือ',null,'Ports'],['air','สนามบิน',null,'Airports'],['pow','โรงไฟฟ้า',null,'Power plants'],['ind','เขตอุตสาหกรรม',null,'Industrial zones']];
function buildLayers(){
  const box = $('layers'); box.innerHTML = '';
  const m = document.createElement('label');
  m.innerHTML = `<input type="checkbox" ${S.mode==='region'?'checked':''}> ${TT('สีตามภูมิภาค','Color by region')}`;
  m.querySelector('input').addEventListener('change', e => { S.mode = e.target.checked ? 'region' : 'relief'; store.set('mode', S.mode); renderRaster(); legend() });
  box.appendChild(m);
  LAYERS.forEach(([k, n, , ne]) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" ${S.layers[k]?'checked':''}> ${TT(n, ne)}`;
    l.querySelector('input').addEventListener('change', e => { S.layers[k] = e.target.checked ? 1 : 0; store.set('layers', S.layers); applyLayers() });
    box.appendChild(l);
  });
  applyLayers();
}
function applyLayers(){
  LAYERS.forEach(([k,,g]) => { if (g) $(g).style.display = S.layers[k] ? '' : 'none' });
  [...$('gPts').children].forEach(g => g.style.display = S.layers[g.dataset.k] ? '' : 'none');
}
function legend(){
  const box = $('hyps');
  if (S.mode === 'region'){ box.innerHTML = Object.values(T.regions).map(r => `<span><i style="background:${r.color}"></i>${isEn() ? tr(r.name) : r.name.replace('ภาค','')}</span>`).join(''); return }
  box.innerHTML = HYPS.map(([t,c]) => `<span><i style="background:${c}"></i>${t>=1000?(t/1000)+'k':t}</span>`).join('') + `<span style="flex:2;align-items:flex-start">${TT('ม. จากระดับทะเล','m above sea level')}</span>`;
}

/* ---------- region dossier ---------- */
const LANDK_ = [['forest','ป่าไม้','var(--forest)','Forest'],['agri','เกษตร','var(--crop)','Farming'],['urban','ที่อยู่อาศัย/เมือง','#9a8f86','Housing/urban'],['ind','อุตสาหกรรม','#8a5a44','Industry'],['other','แหล่งน้ำ/อื่นๆ','var(--river)','Water/other']];
const GRPK_ = [['agri','เกษตร','var(--crop)','Agriculture'],['ind','อุตสาหกรรม','#8a5a44','Industry'],['svc','บริการ','#6b8fb0','Services']];
const loc = a => a.map(([k,n,c,e]) => [k, TT(n,e), c]);
let LANDK = loc(LANDK_), GRPK = loc(GRPK_);
const stack = (obj, keys) => `<div class="stack">${keys.map(([k,n,c]) => `<i style="width:${obj[k]}%;background:${c}" title="${n} ${obj[k]}%"></i>`).join('')}</div><div class="keyrow">${keys.map(([k,n,c]) => `<span><b style="background:${c}"></b>${n} ${obj[k]}%</span>`).join('')}</div>`;
function regionStats(k){
  const es = cells.filter(c => c[3] === k && inLand(X(c[0]+STEP/2), Y(c[1]-STEP/2))).map(c => c[2]);
  const bands = [[0,50,'&lt;50'],[50,200,'50–200'],[200,500,'200–500'],[500,1000,'500–1,000'],[1000,9e9,'&gt;1,000']];
  return {mean: es.reduce((a,b)=>a+b,0)/es.length, max: Math.max(...es), bands: bands.map(([a,b,n]) => [n, Math.round(100*es.filter(e => e>=a && e<b).length/es.length)])};
}
const statCache = {};
function selectRegion(k){
  S.region = k; store.set('region', k);
  [...$('regTabs').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
  const r = T.regions[k], st = statCache[k] || (statCache[k] = regionStats(k));
  const lakes = T.lakes.filter(l => regionOf(l[0], l[1]) === k);
  const rivers = [...new Set(T.rivers.filter(([,,p]) => p.some(([lo,la]) => regionOf(lo,la) === k)).map(r => r[0]))];
  const bandCol = ['#79a85f','#d6cf7c','#cc9158','#86594a','#b0a097'];
  $('regBox').innerHTML = `
    <div><h3 style="font-size:20px">${TT(r.name, tr(r.name) + ' region')}</h3><p class="note">${r.prov} ${TT('จังหวัด','provinces')} · ${TT('เมืองหลัก','main cities:')} ${tr(r.cities)}</p></div>
    <div class="card"><h3>${TT('ความสูงของพื้นที่','Elevation')} <span class="tag inf">${TT('แบบจำลอง','model')}</span></h3>
      <p>${tr(r.terrain)}</p>
      <div class="stack">${st.bands.map(([n,p],i) => `<i style="width:${p}%;background:${bandCol[i]}" title="${n} ${M_()} ${p}%"></i>`).join('')}</div>
      <div class="keyrow">${st.bands.map(([n,p],i) => `<span><b style="background:${bandCol[i]}"></b>${n} ${M_()} ${p}%</span>`).join('')}</div>
      <p class="note">${TT(`ความสูงเฉลี่ยในแบบจำลองราว ${fmt(st.mean)} ม. จุดสูงสุดราว ${fmt(st.max)} ม.`, `Model mean elevation about ${fmt(st.mean)} m, highest point about ${fmt(st.max)} m.`)}</p></div>
    <div class="card"><h3>${TT('ผังการใช้ที่ดิน','Land use')} <span class="tag inf">${TT('อนุมาน','inferred')}</span></h3>${stack(r.land, LANDK)}
      <h3 style="margin-top:6px">${TT('โครงสร้างเศรษฐกิจ','Economy')} <span class="tag inf">${TT('อนุมาน','inferred')}</span></h3>${stack(r.grp, GRPK)}
      <ul>${r.industry.map(i => `<li>${tr(i)}</li>`).join('')}</ul></div>
    <div class="card"><h3>${TT('น้ำ','Water')}</h3><p>${tr(r.water)}</p>
      <p class="note">${TT('แม่น้ำในภูมิภาค','Rivers in the region')}: ${rivers.map(tr).join(' · ') || '-'}</p>
      ${lakes.length ? `<ul>${lakes.map(l => `<li>${tr(l[4])}${l[5] ? ` · ~${fmt(l[5])} ${MCM_()} <span class="tag">${TT('ข้อมูล','data')}</span>` : ''}</li>`).join('')}</ul>` : ''}</div>
    <div class="card"><h3>${TT('ไฟฟ้าและขนส่ง','Power and transport')}</h3><p>${tr(r.power)}</p><p>${tr(r.transport)}</p></div>
    <div class="card"><h3>${TT('แนวทางวางผัง','Planning direction')} <span class="tag inf">${TT('อนุมาน','inferred')}</span></h3><p>${tr(r.plan)}</p></div>`;
  [...$('gRegLbl').children].forEach(t => t.style.fontWeight = t.dataset.r === k ? 800 : 500);
  renderRaster();
}
function buildTabs(){
  $('regTabs').innerHTML = '';
  Object.entries(T.regions).forEach(([k, r]) => {
    const b = document.createElement('button'); b.textContent = isEn() ? tr(r.name) : r.name.replace('ภาคตะวันออกเฉียงเหนือ','อีสาน'); b.setAttribute('aria-pressed', k === S.region); b.dataset.k = k;
    b.addEventListener('click', () => selectRegion(k)); $('regTabs').appendChild(b);
  });
}
function buildCompare(){
  $('cmp').innerHTML = Object.entries(T.regions).map(([k,r]) => `<div style="display:grid;grid-template-columns:minmax(90px,150px) 1fr;gap:4px 12px;align-items:center">
    <b style="font-size:13.5px">${isEn() ? tr(r.name) : r.name.replace('ภาคตะวันออกเฉียงเหนือ','ภาคอีสาน')}</b>
    <div><div class="stack" style="height:14px">${LANDK.map(([kk,n,c]) => `<i style="width:${r.land[kk]}%;background:${c}" title="${n} ${r.land[kk]}%"></i>`).join('')}</div>
    <div class="stack" style="height:10px;margin-top:3px">${GRPK.map(([kk,n,c]) => `<i style="width:${r.grp[kk]}%;background:${c}" title="${n} ${r.grp[kk]}%"></i>`).join('')}</div></div></div>`).join('')
    + `<div class="keyrow">${LANDK.map(([,n,c]) => `<span><b style="background:${c}"></b>${n}</span>`).join('')}</div><div class="keyrow">${TT('แถบล่าง:','Lower bar:')} ${GRPK.map(([,n,c]) => `<span><b style="background:${c}"></b>${n}</span>`).join('')}</div>`;
}

/* ---------- planner ---------- */
const city = id => T.cities.find(c => c[0] === id);
function hav(lo1, la1, lo2, la2){
  const R = 6371, r = Math.PI/180, dLa = (la2-la1)*r, dLo = (lo2-lo1)*r;
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(a));
}
const hasAir = c => T.points.some(([k,,lo,la]) => k === 'air' && hav(lo, la, c[2], c[3]) < 40);
function plan(){
  S.a = $('selA').value; S.b = $('selB').value; store.set('a', S.a); store.set('b', S.b);
  const A = city(S.a), B = city(S.b);
  [...$('gCity').children].forEach(g => { g.classList.toggle('a', g.dataset.id === S.a); g.classList.toggle('b', g.dataset.id === S.b) });
  const gl = $('gLine'); gl.innerHTML = '';
  if (!A || !B || A === B){ $('res').innerHTML = `<p class="note">${TT('เลือกเมือง A และ B ให้ต่างกัน','Pick two different cities for A and B')}</p>`; $('prof').innerHTML = ''; $('modes').innerHTML = ''; return }
  el('line', {x1:X(A[2]), y1:Y(A[3]), x2:X(B[2]), y2:Y(B[3]), stroke:'#d4613a', 'stroke-width':2, 'stroke-dasharray':'6 4'}, gl);
  const L = hav(A[2], A[3], B[2], B[3]);
  // profile
  const N = 120, prof = [];
  for (let i = 0; i <= N; i++){ const t = i/N, lo = A[2] + (B[2]-A[2])*t, la = A[3] + (B[3]-A[3])*t; prof.push(i === 0 ? A[4] : i === N ? B[4] : elev(lo, la)) }
  const peak = Math.max(...prof), peakI = prof.indexOf(peak);
  drawProfile(prof, L, A, B, peak, peakI);
  // water
  const V = Math.max(0, +$('inV').value || 0), hf = 0.6*L*1.15, dH = B[4] - A[4];
  const kWhPerM = V*3633; // kWh per metre of head for V million m3 at 75% pump efficiency
  const liftDirect = Math.max(0, dH + hf), liftRidge = Math.max(0, peak - A[4] + hf);
  const ridge = peak > Math.max(A[4], B[4]) + 50;
  const gravity = -dH > hf;
  const waterHtml = gravity
    ? `<div class="kv"><span>${TT('ปลายทางต่ำกว่า','Destination lower by')}</span><span>${fmt(-dH)} ${M_()}</span><span>${TT('แรงเสียดทานประมาณ','Friction loss approx.')}</span><span>${fmt(hf)} ${M_()}</span><span>${TT('ไหลด้วยแรงโน้มถ่วง','Gravity flow')}</span><span>${TT('ได้','yes')}</span><span>${TT('ผลิตไฟคืนได้ราว','Power recoverable approx.')}</span><span>${fmt((-dH-hf)*V*2316/1e6,2)} ${TT('GWh/ปี','GWh/yr')}</span></div>`
    : `<div class="kv"><span>${TT('ยกน้ำสุทธิ','Net lift')}</span><span>${fmt(liftDirect)} ${M_()}</span><span>${TT('พลังงานสูบ','Pumping energy')}</span><span>${fmt(liftDirect*kWhPerM/1e6,2)} ${TT('GWh/ปี','GWh/yr')}</span><span>${TT('ค่าไฟ (4 บาท/หน่วย)','Power cost (4 baht/kWh)')}</span><span>${fmt(liftDirect*kWhPerM*4/1e6,1)} ${TT('ล้านบาท/ปี','million baht/yr')}</span><span>${TT('ต่อ ลบ.ม.','Per m³')}</span><span>${V ? fmt(liftDirect*kWhPerM*4/(V*1e6),2) : '-'} ${TT('บาท','baht')}</span></div>`;
  const ridgeHtml = ridge ? `<p class="note">${TT(`แนวเส้นตรงผ่านพื้นที่สูงราว ${fmt(peak)} ม. ถ้าเป็นคลองเปิดต้องอ้อมแนวเขาหรือเจาะอุโมงค์ ถ้าสูบข้ามสันเขาต้องยก ${fmt(liftRidge)} ม. ใช้ไฟ ~${fmt(liftRidge*kWhPerM/1e6,2)} GWh/ปี`, `The straight line crosses ground about ${fmt(peak)} m high. An open canal would have to go around the hills or through a tunnel. Pumping over the ridge means a ${fmt(liftRidge)} m lift, using ~${fmt(liftRidge*kWhPerM/1e6,2)} GWh/yr.`)}</p>` : '';
  // power
  const kv = +$('selKV').value, P = Math.max(0, +$('inP').value || 0);
  const lossPer100 = {500:0.6, 230:1.6, 115:4.5}[kv], lossPct = Math.min(60, lossPer100*L*1.2/100), lossMW = P*lossPct/100;
  const suggest = P > 600 || L > 250 ? 500 : P > 120 || L > 80 ? 230 : 115;
  // transport
  const tons = Math.max(0, +$('inT').value || 0);
  const wA = A[5], wB = B[5];
  let waterKm = null;
  if (wA && wA === wB) waterKm = L*(wA === 'm' ? 1.4 : 1.6);
  else if ((wA === 'g' && wB === 'a') || (wA === 'a' && wB === 'g')) waterKm = L*1.6 + 1500;
  const air = hasAir(A) && hasAir(B);
  const M = [
    [TT('ถนน (รถบรรทุก)','Road (truck)'), L*1.3, 1.72, 50, 0, 62],
    [TT('ราง (รถไฟสินค้า)','Rail (freight train)'), L*1.4, 0.93, 35, 6, 22],
    [TT('ทางน้ำ (เรือลำเลียง/ชายฝั่ง)','Water (barge/coastal)'), waterKm, 0.64, 12, 12, 30],
    [TT('อากาศ (ขนส่งทางอากาศ)','Air (air freight)'), air ? L*1.05 : null, 12, 600, 4, 600]
  ].map(([n, km, c, v, hold, co2]) => km == null ? {n, na:true} : {n, km, cost:km*c*tons, h:km/v + hold, co2:km*tons*co2/1e6});
  const okM = M.filter(m => !m.na), best = okM.reduce((a,b) => a.cost < b.cost ? a : b);
  $('res').innerHTML = `
    <div class="card"><h3>${TT('ระยะทางและความสูง','Distance and elevation')}</h3><div class="kv">
      <span>${TT('เส้นตรง','Straight line')} A→B</span><span>${fmt(L)} ${KM_()}</span><span>${tr(A[1])}</span><span>${fmt(A[4])} ${M_()}</span><span>${tr(B[1])}</span><span>${fmt(B[4])} ${M_()}</span><span>${TT('จุดสูงสุดบนแนว','Highest point on the line')}</span><span>${fmt(peak)} ${M_()}</span></div></div>
    <div class="card"><h3>${TT('ส่งน้ำ','Move water:')} ${fmt(V,1)} ${MCM_()}/${TT('ปี','yr')} <span class="tag inf">${TT('อนุมาน','inferred')}</span></h3>${waterHtml}${ridgeHtml}</div>
    <div class="card"><h3>${TT('ส่งไฟ','Send power:')} ${fmt(P)} MW ${TT('ที่','at')} ${kv} kV <span class="tag inf">${TT('อนุมาน','inferred')}</span></h3><div class="kv">
      <span>${TT('สูญเสียในสาย','Line loss')}</span><span>~${fmt(lossPct,1)}%</span><span>${TT('กำลังที่หายไป','Power lost')}</span><span>${fmt(lossMW,1)} MW</span><span>${TT('พลังงานหาย/ปี (โหลด 60%)','Energy lost/yr (60% load)')}</span><span>${fmt(lossMW*8760*0.6/1000,1)} GWh</span></div>
      <p class="note">${kv === suggest ? TT('ระดับแรงดันนี้เหมาะกับขนาดและระยะทาง','This voltage suits the load and distance') : TT(`ขนาดนี้ควรใช้ ${suggest} kV`, `This load should use ${suggest} kV`)}</p></div>`;
  $('modes').innerHTML = `<thead><tr><th>${TT(`ขนส่ง ${fmt(tons)} ตัน`, `Ship ${fmt(tons)} t`)}</th><th>${TT('ระยะทาง (กม.)','Distance (km)')}</th><th>${TT('เวลา (ชม.)','Time (h)')}</th><th>${TT('ต้นทุน (บาท)','Cost (baht)')}</th><th>${TT('CO₂ (ตัน)','CO₂ (t)')}</th></tr></thead><tbody>` +
    M.map(m => m.na ? `<tr class="na"><td>${m.n}</td><td colspan="4">${TT('ไม่มีเส้นทางตรงระหว่างสองเมืองนี้','No direct route between these two cities')}</td></tr>`
      : `<tr class="${m === best ? 'best' : ''}"><td>${m.n}${m === best ? TT(' · ถูกที่สุด',' · cheapest') : ''}</td><td>${fmt(m.km)}</td><td>${fmt(m.h,1)}</td><td>${fmt(m.cost)}</td><td>${fmt(m.co2,1)}</td></tr>`).join('') + '</tbody>';
}
function drawProfile(prof, L, A, B, peak, peakI){
  const s = $('prof'), W = 600, H = 170, l = 44, r = 10, t = 12, b = 26;
  const top = Math.max(100, Math.ceil(peak/100)*100*1.1), xs = i => l + (W-l-r)*i/(prof.length-1), ys = e => t + (H-t-b)*(1 - e/top);
  const d = prof.map((e,i) => `${i?'L':'M'}${xs(i).toFixed(1)} ${ys(e).toFixed(1)}`).join('');
  const ticks = [0, top/2, top].map(v => Math.round(v/10)*10);
  s.innerHTML = `${ticks.map(v => `<line x1="${l}" x2="${W-r}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--line)"/><text x="${l-6}" y="${ys(v)+4}" text-anchor="end" style="font:10px var(--f-mono);fill:var(--muted)">${fmt(v)}</text>`).join('')}
    <path d="${d}L${xs(prof.length-1)} ${ys(0)}L${xs(0)} ${ys(0)}Z" fill="var(--soil)" fill-opacity=".25"/>
    <path d="${d}" fill="none" stroke="var(--soil)" stroke-width="1.8"/>
    <line x1="${xs(0)}" y1="${ys(prof[0])}" x2="${xs(prof.length-1)}" y2="${ys(prof[prof.length-1])}" stroke="var(--river)" stroke-dasharray="4 3"/>
    <circle cx="${xs(0)}" cy="${ys(prof[0])}" r="4" fill="#d4613a"/><circle cx="${xs(prof.length-1)}" cy="${ys(prof[prof.length-1])}" r="4" fill="#2b78a8"/>
    <text x="${xs(peakI)}" y="${ys(peak)-5}" text-anchor="middle" style="font:10px var(--f-mono);fill:var(--ink)">${fmt(peak)} ${M_()}</text>
    <text x="${l}" y="${H-8}" style="font:11px var(--f-body);fill:var(--ink)">A ${tr(A[1])}</text>
    <text x="${W-r}" y="${H-8}" text-anchor="end" style="font:11px var(--f-body);fill:var(--ink)">B ${tr(B[1])} · ${fmt(L)} ${KM_()}</text>
    <text x="${W/2}" y="${H-8}" text-anchor="middle" style="font:10px var(--f-body);fill:var(--muted)">${TT('เส้นประฟ้า = ความลาดเฉลี่ย A→B','Blue dashes = average slope A→B')}</text>`;
}
function fillCities(){
  const opts = T.cities.map(([id,n,,,e]) => `<option value="${id}">${tr(n)} (${e} ${M_()})</option>`).join('');
  $('selA').innerHTML = opts; $('selB').innerHTML = opts; $('selA').value = S.a; $('selB').value = S.b;
}
function buildPlanner(){
  fillCities();
  ['selA','selB','inV','inP','inT','selKV'].forEach(id => $(id).addEventListener('input', plan));
}

/* ---------- boot ---------- */
drawStatic(); buildLayers(); legend(); buildTabs(); buildCompare(); buildPlanner();
selectRegion(T.regions[S.region] ? S.region : 'N'); plan();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderRaster);
window.addEventListener('langchange', () => {
  LANDK = loc(LANDK_); GRPK = loc(GRPK_);
  drawStatic(); applyLayers(); buildLayers(); legend(); buildTabs(); buildCompare(); fillCities();
  selectRegion(S.region); plan();
});
})();
