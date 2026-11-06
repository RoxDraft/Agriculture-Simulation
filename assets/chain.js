/* value-chain.html: crop combo designer (section 1) and 100-year history (section 2). Data in chain-data.js and chain-hist.js. */
(function(){
const D = window.CHAIN, H = window.CHAIN_HIST;
const $ = id => document.getElementById(id);
const en = () => !!(window.I18N && I18N.lang === 'en');
const L = p => Array.isArray(p) ? (en() ? p[1] : p[0]) : p;
const T = (th, e) => en() ? e : th;
const fmt = (n, d=0) => Number(n).toLocaleString('en-US', {maximumFractionDigits:d});
const RANK = {s:0, m:1, l:2};
const INF = () => `<span class="inf">${T('อนุมาน','inferred')}</span>`;
const UNV = () => `<span class="noref">${T('ยังไม่ได้ตรวจกับต้นฉบับ','not yet checked')}</span>`;
let store = {}; try { store = JSON.parse(localStorage.getItem('agrisim.chain') || '{}') } catch(e){}
const S = { crop: store.crop || 'rice', size: store.size || 'm', on: store.on || {} };
const save = () => { try { localStorage.setItem('agrisim.chain', JSON.stringify(S)) } catch(e){} };
const crop = () => D.crops.find(c => c.id === S.crop) || D.crops[0];
const onSet = () => (S.on[S.crop] = S.on[S.crop] || {});

/* ---------- section 1: combo designer ---------- */
function tabs(){
  $('cropTabs').innerHTML = D.crops.map(c => `<button type="button" role="tab" aria-selected="${c.id === S.crop}" data-c="${c.id}"><span aria-hidden="true">${c.icon}</span>${L(c.n)}</button>`).join('');
  $('sizeSeg').innerHTML = D.sizes.map(([k, n]) => `<button type="button" aria-pressed="${k === S.size}" data-s="${k}">${L(n)}</button>`).join('');
}
function lineMode(ln){
  // own = run it yourself; hub = needs a bigger partner (cooperative hub or plant); value shared
  return RANK[S.size] >= RANK[ln.min] ? 'own' : 'hub';
}
function draw(){
  const c = crop(), on = onSet();
  [...$('cropTabs').children].forEach(b => b.setAttribute('aria-selected', b.dataset.c === S.crop));
  [...$('sizeSeg').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.s === S.size));
  // stage flow
  $('flow').innerHTML = c.stages.map(([n, m], i) => {
    const txt = L(m[S.size]), none = txt === '—';
    return `<div class="stg${none ? ' none' : ''}"><i>${i + 1}</i><b>${L(n)}</b><span>${none ? T('ทำเองไม่คุ้มที่ขนาดนี้ ขายวัตถุดิบต่อให้ผู้แปรรูป','Not worth doing at this size; sell the raw material on') : txt}</span></div>`;
  }).join('<span class="arr" aria-hidden="true">→</span>');
  // by-product lines
  $('lines').innerHTML = c.lines.map(ln => {
    const mode = lineMode(ln), chk = !!on[ln.id];
    return `<label class="ln${chk ? ' on' : ''}${mode === 'hub' ? ' hub' : ''}"><input type="checkbox" data-l="${ln.id}" ${chk ? 'checked' : ''}>
      <span class="ln-h"><b>${L(ln.n)}</b><small>${ln.mass ? fmt(ln.mass,1) + '% ' + T('ของวัตถุดิบ','of raw') : T('ไม่กินน้ำหนักวัตถุดิบหลัก','uses no main raw mass')} · ${T('ลงทุน','capex')} ${'฿'.repeat(ln.capex)} · ${T('ขั้นต่ำ','min.')} ${L(D.sizes.find(s => s[0] === ln.min)[1])}</small></span>
      <span class="ln-m">${T('เครื่องจักร','Machines')}: ${L(ln.mach)}</span>
      <span class="ln-f">${T('ป้อนต่อให้','Feeds')}: ${L(ln.feeds)}</span>
      ${ln.note ? `<span class="ln-n">${L(ln.note)}</span>` : ''}
      ${mode === 'hub' ? `<span class="ln-w">${T('ขนาดนี้ทำเองไม่ไหว: รวมกลุ่มเป็นศูนย์กลาง หรือขายเป็นวัตถุดิบให้โรงงาน ได้มูลค่าราว 30%','Too big for this size: pool into a hub or sell as feedstock to a plant, keeping about 30% of the value')}</span>` : ''}
    </label>`;
  }).join('');
  result();
  save();
}
function result(){
  const c = crop(), on = onSet();
  const chosen = c.lines.filter(l => on[l.id]);
  const sellOnly = c.stages.some(([, m]) => L(m[S.size]) === '—');
  const mainV = c.main.v * (sellOnly ? 0.6 : 1);
  let value = mainV, mass = Math.min(100, c.main.mass), capex = 0;
  const parts = [{n:L(c.main.n), m:c.main.mass, v:mainV, cls:'main'}];
  chosen.forEach(l => {
    const k = lineMode(l) === 'own' ? 1 : 0.3;
    value += l.v * k; mass += l.mass; capex += lineMode(l) === 'own' ? l.capex : 0;
    parts.push({n:L(l.n), m:l.mass, v:l.v * k, cls:lineMode(l)});
  });
  mass = Math.min(100, mass);
  const waste = Math.max(0, 100 - mass);
  // mass bar
  const massBar = parts.filter(p => p.m > 0).map(p => `<i class="${p.cls}" style="width:${Math.min(100, p.m)}%" title="${p.n} ${fmt(p.m,1)}%"></i>`).join('') + (waste > 0.5 ? `<i class="waste" style="width:${waste}%" title="${T('เหลือทิ้ง/ไม่ได้ใช้','Unused / waste')} ${fmt(waste)}%"></i>` : '');
  const vmax = Math.max(...D.crops.map(cc => cc.main.v + cc.lines.reduce((a, l) => a + l.v, 0)));
  const valBar = parts.map(p => `<i class="${p.cls}" style="width:${100 * p.v / vmax}%" title="${p.n} ${fmt(p.v,1)}"></i>`).join('');
  const own = chosen.filter(l => lineMode(l) === 'own'), hub = chosen.filter(l => lineMode(l) === 'hub');
  const arch = [];
  arch.push(`<li><b>${T('สายหลัก','Main line')}:</b> ${sellOnly ? T('ทำถึงขั้นแปรรูปต้น แล้วขายวัตถุดิบให้โรงงาน','process to a first stage, then sell raw material to a plant') : T('ทำเองครบถึงสินค้าพร้อมขาย','run all the way to a saleable product')} → ${L(c.main.n)}</li>`);
  if (own.length) arch.push(`<li><b>${T('ทำเองเพิ่ม','Add in-house')}:</b> ${own.map(l => L(l.n)).join(' · ')}</li>`);
  if (hub.length) arch.push(`<li><b>${T('ผ่านศูนย์กลาง/คู่ค้า','Through a hub or partner')}:</b> ${hub.map(l => L(l.n)).join(' · ')}</li>`);
  if (waste > 40) arch.push(`<li class="bad">${T(`ยังเหลือวัตถุดิบไม่ได้ใช้ ${fmt(waste)}% ลองเพิ่มสายที่ใช้เปลือก กาก หรือน้ำเสีย`, `${fmt(waste)}% of the raw material is still unused; try adding lines for husks, residues or wastewater`)}</li>`);
  $('res').innerHTML = `
    <div class="kpi4">
      <div><small>${T('ดัชนีมูลค่าต่อวัตถุดิบ 1 ตัน','Value index per tonne of raw')}</small><b>${fmt(value,1)}</b><small>${T('สายหลักอย่างเดียว = 10','main line alone = 10')}</small></div>
      <div><small>${T('ใช้วัตถุดิบได้','Raw material used')}</small><b>${fmt(mass)}%</b><small>${T('ตามน้ำหนัก','by weight')}</small></div>
      <div><small>${T('เหลือทิ้ง','Left as waste')}</small><b>${fmt(waste)}%</b><small>${T('รวมน้ำที่ระเหย','incl. water lost')}</small></div>
      <div><small>${T('ระดับลงทุนเพิ่ม','Extra investment')}</small><b>${capex ? '฿'.repeat(Math.min(capex, 12)) : '—'}</b><small>${own.length} ${T('สายทำเอง','in-house lines')}</small></div>
    </div>
    <div class="barlbl">${T('วัตถุดิบไปไหน (ตามน้ำหนัก)','Where the raw material goes (by weight)')}</div><div class="mbar">${massBar}</div>
    <div class="barlbl">${T('มูลค่ามาจากไหน','Where the value comes from')}</div><div class="mbar">${valBar}</div>
    <div class="legend3"><span><i style="background:var(--leaf)"></i>${T('สายหลัก','Main line')}</span><span><i style="background:var(--water)"></i>${T('ทำเอง','In-house')}</span><span><i style="background:var(--warn)"></i>${T('ผ่านศูนย์กลาง/ขายวัตถุดิบ','Via hub / sold as feedstock')}</span><span><i style="background:var(--line)"></i>${T('เหลือทิ้ง','Waste')}</span></div>
    <h4>${T('สถาปัตยกรรมที่ได้','Resulting architecture')} ${INF()}</h4><ul class="arch">${arch.join('')}</ul>`;
}
function preset(kind){
  const c = crop(), on = (S.on[S.crop] = {});
  c.lines.forEach(l => {
    if (kind === 'zero') on[l.id] = RANK[l.min] <= RANK[S.size] || l.mass >= 10;
    if (kind === 'bio') on[l.id] = true;
  });
  draw();
}

/* ---------- section 2: history ---------- */
function facts(){
  $('facts').innerHTML = H.facts.map(f => `<div><b>${L(f.n)}</b><div class="fv">${f.v.map(([y, v]) => `<span><small>${y}</small>${v}</span>`).join('')}</div><p>${L(f.note)} <sup><a href="#c${f.ref}">${f.ref}</a></sup></p></div>`).join('');
  const max = Math.max(...H.caps.map(c => c.v));
  $('caps').innerHTML = H.caps.map(c => `<div class="caprow"><span>${c.n}<small>${L(c.seg)}</small></span><div><i style="width:${100 * c.v / max}%"></i></div><b>$${fmt(c.v)}B</b></div>`).join('') +
    `<p class="note">${T('มูลค่าตลาดอ่านจาก companiesmarketcap.com เมื่อ 6 พ.ย. 2026 (ราคาหน่วงเวลา) ใช้เทียบขนาดของแต่ละช่วงในห่วงโซ่ ไม่ใช่ข้อมูลย้อนหลัง 100 ปี ซึ่งยังไม่มีชุดข้อมูลสาธารณะที่เทียบได้ตรงๆ','Market caps read from companiesmarketcap.com on 6 Nov 2026 (delayed prices), to compare the size of each link in the chain. They are not a 100-year series; no public dataset compares that directly.')} <sup><a href="#c5">5</a></sup></p>`;
}
function heat(){
  const tbl = $('heat');
  tbl.innerHTML = `<thead><tr><th>${T('ปัญหา','Problem')}</th>${H.eras.map(e => `<th>${e}</th>`).join('')}</tr></thead><tbody>` +
    H.problems.map((p, i) => `<tr data-i="${i}" tabindex="0"><td>${L(p.n)}</td>${p.w.map(w => `<td class="h${w}"><span>${['·','●','●●','●●●'][w]}</span></td>`).join('')}</tr>`).join('') + '</tbody>';
  const show = i => { $('heatWhy').innerHTML = `<b>${L(H.problems[i].n)}:</b> ${L(H.problems[i].why)} ${INF()}`; [...tbl.tBodies[0].rows].forEach(r => r.classList.toggle('on', +r.dataset.i === i)) };
  [...tbl.tBodies[0].rows].forEach(r => { const f = () => show(+r.dataset.i); r.addEventListener('click', f); r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); f() } }) });
  show(S.heat || 1);
}
function regions(){
  $('regionCards').innerHTML = H.regions.map(r => `<div><h4>${L(r.n)}</h4><p>${L(r.t)} ${r.src === 'ok' ? `<sup><a href="#c${r.n[1] === 'Thailand' ? 4 : 1}">${r.n[1] === 'Thailand' ? 4 : 1}</a></sup>` : UNV()}</p></div>`).join('');
}
let kindOn = 'all';
function tips(){
  const ks = Object.keys(H.kinds);
  $('tipSeg').innerHTML = [['all', ['ทั้งหมด','All']], ...ks.map(k => [k, H.kinds[k]])].map(([k, n]) => `<button type="button" aria-pressed="${k === kindOn}" data-k="${k}">${L(n)}</button>`).join('');
  const list = H.tips.filter(t => kindOn === 'all' || t.k === kindOn);
  // timeline svg
  const W = 900, x0 = 30, x1 = 880, Y0 = 1910, Y1 = 2026, X = y => x0 + (x1 - x0) * (y - Y0) / (Y1 - Y0);
  const lanes = {res:28, prod:52, mkt:76, pol:100};
  let s = `<svg viewBox="0 0 ${W} 140" role="img" aria-label="${T('เส้นเวลา tipping point 1910–2026','Tipping-point timeline 1910–2026')}">`;
  for (let y = 1920; y <= 2020; y += 20) s += `<line x1="${X(y)}" x2="${X(y)}" y1="14" y2="112" class="tl-grid"/><text x="${X(y)}" y="130" text-anchor="middle" class="tl-t">${y}</text>`;
  H.tips.forEach((t, i) => { const dim = kindOn !== 'all' && t.k !== kindOn; s += `<circle cx="${X(t.y)}" cy="${lanes[t.k]}" r="6" class="tl-d k-${t.k}${dim ? ' dim' : ''}" data-i="${i}"><title>${t.y} · ${L(t.who)}</title></circle>` });
  s += '</svg>';
  $('tl').innerHTML = s + `<div class="legend3">${ks.map(k => `<span><i class="k-${k}"></i>${L(H.kinds[k])}</span>`).join('')}</div>`;
  $('tipList').innerHTML = list.map(t => `<li class="k-${t.k}"><span class="yr">${t.y}</span><div><b>${L(t.who)}</b> <span class="kd">${L(H.kinds[t.k])}</span><p>${L(t.what)} ${t.src === 'ok' ? '' : UNV()}</p></div></li>`).join('');
}

/* ---------- boot ---------- */
function all(){ tabs(); draw(); facts(); heat(); regions(); tips() }
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.c){ S.crop = b.dataset.c; draw() }
  else if (b.dataset.s){ S.size = b.dataset.s; draw() }
  else if (b.dataset.preset){ preset(b.dataset.preset) }
  else if (b.dataset.k && b.closest('#tipSeg')){ kindOn = b.dataset.k; tips() }
});
document.addEventListener('change', e => { const i = e.target; if (i.dataset && i.dataset.l){ onSet()[i.dataset.l] = i.checked; draw() } });
$('cropTabs').addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const ids = D.crops.map(c => c.id), i = ids.indexOf(S.crop), n = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
  S.crop = n; draw(); $('cropTabs').querySelector(`[data-c="${n}"]`).focus();
});
all();
window.addEventListener('langchange', all);
})();
