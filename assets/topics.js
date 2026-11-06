/* Simulations for soil-page topics 1, 2, 3, 5 plus the shared helpers (window.SIMK) used by topics2.js and topics3.js.
   All numbers are relative teaching models (tagged "inferred" on the page), not field measurements. */
(function(){
const L = (th, en) => (window.I18N && I18N.lang === 'en') ? en : th;
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (n, d = 0) => Number(n).toLocaleString(L('th-TH', 'en-US'), {maximumFractionDigits: d, minimumFractionDigits: d});
const INF = () => `<span class="inf">${L('อนุมาน', 'inferred')}</span>`;
const UNV = () => `<span class="noref">${L('ยังไม่ได้ตรวจกับต้นฉบับ', 'not yet checked against source')}</span>`;

function head(th, en, dth, den){
  return `<div class="sim-h"><span class="sim-tag">${L('จำลอง', 'Simulation')}</span><h3>${L(th, en)}</h3>${dth ? `<p>${L(dth, den)}</p>` : ''}</div>`;
}
function seg(k, opts, val, label){
  return `<div class="seg2" data-k="${k}" role="group"${label ? ` aria-label="${label}"` : ''}>` +
    opts.map(([v, th, en]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(val)}">${L(th, en)}</button>`).join('') + '</div>';
}
function rng(k, th, en, min, max, step, val){
  return `<label class="rng"><span>${L(th, en)} <b data-o="${k}"></b></span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
}
function chk(k, th, en, val){
  return `<label class="chk2"><input type="checkbox" data-k="${k}"${val ? ' checked' : ''}> <span>${L(th, en)}</span></label>`;
}
const out = (root, k) => root.querySelector(`[data-o="${k}"]`);
function setOut(root, k, html){ const e = out(root, k); if (e) e.innerHTML = html }

/* Sim(id, state, build, update): build() returns HTML (rebuilt on language change), update() refreshes outputs. */
function Sim(id, state, build, update){
  const root = $(id); if (!root) return null;
  const api = {state, root, refresh(){ update(state, root, api) }};
  function full(){ root.innerHTML = build(state, api); update(state, root, api) }
  root.addEventListener('click', e => {
    const b = e.target.closest('.seg2 button');
    if (!b || !root.contains(b)) return;
    const k = b.parentElement.dataset.k, v = b.dataset.v;
    state[k] = v !== '' && !isNaN(+v) ? +v : v;
    [...b.parentElement.children].forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    update(state, root, api);
  });
  root.addEventListener('input', e => {
    const t = e.target; if (!t.dataset || !t.dataset.k) return;
    state[t.dataset.k] = t.type === 'checkbox' ? t.checked : +t.value;
    update(state, root, api);
  });
  full();
  window.addEventListener('langchange', full);
  return api;
}
/* simple player: calls step() every ms until it returns false */
function player(ms){
  let timer = null;
  return {
    get on(){ return !!timer },
    start(step, end){ this.stop(); timer = setInterval(() => { if (step() === false){ this.stop(); if (end) end() } }, ms) },
    stop(){ clearInterval(timer); timer = null }
  };
}
function rand(seed){ let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647 }
function mixHex(a, b, t){
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join('');
}
function lineChart(series, opt){
  // series: [{c, pts:[[x,y]], dash}] ; opt: {w,h,xmax,ymax,xlab,ylab,marker,xticks}
  const w = opt.w || 640, h = opt.h || 180, l = 36, r = 10, t = 10, b = 26;
  const X = x => l + (w - l - r) * x / opt.xmax, Y = y => t + (h - t - b) * (1 - y / opt.ymax);
  let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${opt.aria || ''}">`;
  for (let i = 0; i <= 4; i++){ const y = opt.ymax * i / 4; s += `<line x1="${l}" x2="${w - r}" y1="${Y(y)}" y2="${Y(y)}" style="stroke:var(--line)"/><text x="${l - 5}" y="${Y(y) + 3}" text-anchor="end" style="font:10px var(--mono);fill:var(--muted)">${fmt(y)}</text>` }
  (opt.xticks || []).forEach(([x, lab]) => { s += `<text x="${X(x)}" y="${h - 8}" text-anchor="middle" style="font:10px var(--mono);fill:var(--muted)">${lab}</text>` });
  (opt.bands || []).forEach(([x0, x1, c]) => { s += `<rect x="${X(x0)}" y="${t}" width="${X(x1) - X(x0)}" height="${h - t - b}" style="fill:${c};opacity:.12"/>` });
  series.forEach(sr => {
    s += `<polyline fill="none" points="${sr.pts.map(([x, y]) => X(x).toFixed(1) + ',' + Y(clamp(y, 0, opt.ymax)).toFixed(1)).join(' ')}" style="stroke:${sr.c};stroke-width:${sr.wd || 2.2}${sr.dash ? ';stroke-dasharray:5 4' : ''}"/>`;
  });
  if (opt.marker != null) s += `<line x1="${X(opt.marker)}" x2="${X(opt.marker)}" y1="${t}" y2="${h - b}" style="stroke:var(--fg);stroke-width:1;stroke-dasharray:3 3"/>`;
  (opt.dots || []).forEach(([x, y, c]) => { s += `<circle cx="${X(x)}" cy="${Y(y)}" r="4" style="fill:${c}"/>` });
  return s + '</svg>';
}
window.SIMK = {L, $, css, clamp, fmt, INF, UNV, head, seg, rng, chk, out, setOut, Sim, player, rand, mixHex, lineChart};

/* ================= 1. replanting and soil pathogen build-up ================= */
const PATH = [
  {k:'fus', c:'#8e44ad', r:1.8, keep:[.85,.85], sup:.6, w:.5,
    n:['ฟิวซาเรียม','Fusarium'], sci:'Fusarium oxysporum',
    grp:['เชื้อราแท้ (Fungi, Ascomycota)','True fungus (Fungi, Ascomycota)'],
    size:['เส้นใยกว้าง ~3–5 ไมโครเมตร','Hyphae ~3–5 µm wide'],
    st:['เส้นใยมีผนังกั้นเป็นห้อง ผนังเซลล์เป็นไคติน สร้างสปอร์ 3 แบบ: สปอร์ใหญ่รูปเคียว สปอร์เล็ก และคลาไมโดสปอร์ผนังหนา','Septate hyphae with chitin walls. Three spore types: sickle-shaped macroconidia, microconidia and thick-walled chlamydospores'],
    live:['คลาไมโดสปอร์อยู่ในดินได้หลายปีแม้ไม่มีพืชอาศัย','Chlamydospores survive in soil for years without a host'],
    hit:['เข้าทางปลายรากและแผล ไปอุดท่อน้ำ ทำให้เหี่ยวทั้งต้น','Enters root tips and wounds, blocks the xylem, the whole plant wilts'],
    ctl:['พันธุ์ต้านทาน หมุนเวียนนานหลายปี ไตรโคเดอร์มา ไม่ให้ดินเป็นกรดจัด','Resistant varieties, long rotations, Trichoderma, avoid very acid soil']},
  {k:'pyt', c:'#2e86c1', r:2.0, keep:[.55,.55], sup:.45, w:.35,
    n:['พิเทียม','Pythium'], sci:'Pythium spp.',
    grp:['ราน้ำ (Oomycota) ไม่ใช่เชื้อราแท้ ใกล้สาหร่ายสีน้ำตาลมากกว่า','Water mold (Oomycota): not a true fungus, closer to brown algae'],
    size:['เส้นใยกว้าง ~5–10 ไมโครเมตร','Hyphae ~5–10 µm wide'],
    st:['เส้นใยไม่มีผนังกั้น ผนังเซลล์เป็นเซลลูโลสและกลูแคน ไม่ใช่ไคติน สร้างซูโอสปอร์ที่มีหาง 2 เส้นว่ายในน้ำ','Non-septate hyphae with cellulose and glucan walls, no chitin. Makes zoospores with two flagella that swim in water'],
    live:['โอโอสปอร์ผนังหนาอยู่ในดินได้นาน ระบาดเร็วเมื่อดินแฉะ','Thick-walled oospores persist; explodes when soil is waterlogged'],
    hit:['กล้าเน่ายุบ รากเน่า โดยเฉพาะต้นอ่อน','Damping-off and root rot, especially seedlings'],
    ctl:['ระบายน้ำดี ไม่ให้น้ำขัง ไตรโคเดอร์มา ยาที่ใช้กับราแท้บางชนิดไม่ได้ผลกับราน้ำ','Good drainage, Trichoderma. Some fungicides for true fungi do not work on water molds']},
  {k:'rhz', c:'#a0522d', r:1.7, keep:[.9,.65], sup:.55, w:.3,
    n:['ไรซอคโทเนีย','Rhizoctonia'], sci:'Rhizoctonia solani',
    grp:['เชื้อราแท้ (Fungi, Basidiomycota)','True fungus (Fungi, Basidiomycota)'],
    size:['เส้นใยกว้าง ~6–10 ไมโครเมตร','Hyphae ~6–10 µm wide'],
    st:['ไม่สร้างสปอร์ทั่วไป เส้นใยแตกกิ่งเกือบตั้งฉากและคอดที่โคนกิ่ง สร้างเม็ดสเคลอโรเทียมสีน้ำตาลเข้มไว้อยู่รอด','No common spores. Hyphae branch at near right angles with a constriction; forms dark brown sclerotia to survive'],
    live:['สเคลอโรเทียมและเศษซากพืช มีพืชอาศัยกว้างมาก รวมถึงพืชตระกูลถั่ว','Sclerotia and plant debris; very wide host range, including legumes'],
    hit:['โคนเน่า กาบใบแห้งในข้าว กล้าเน่า','Stem-base rot, rice sheath blight, damping-off'],
    ctl:['ไตรโคเดอร์มา ลดความชื้นที่โคนต้น ไถกลบให้ซากย่อย หมุนเวียนกับถั่วได้ผลน้อยเพราะถั่วก็เป็นพืชอาศัย','Trichoderma, drier stem base, bury debris. Rotation with legumes helps less because legumes are hosts too']},
  {k:'ral', c:'#c0392b', r:1.9, keep:[.7,.7], sup:.9, w:.6,
    n:['ราลสโตเนีย','Ralstonia'], sci:'Ralstonia solanacearum',
    grp:['แบคทีเรีย (Bacteria) เซลล์เดียว ไม่มีนิวเคลียส','Bacterium: single cell, no nucleus'],
    size:['เซลล์รูปท่อน ~0.5 × 1.5 ไมโครเมตร เล็กกว่าเส้นใยราหลายเท่า','Rod ~0.5 × 1.5 µm, many times smaller than a fungal hypha'],
    st:['ไม่มีเส้นใย แบ่งตัวเป็นสองเท่าได้ในไม่กี่ชั่วโมง มีหางแฟลกเจลลาว่ายในน้ำ สร้างเมือกอุดท่อน้ำ','No hyphae. Doubles in hours, swims with flagella, makes slime that clogs the xylem'],
    live:['อยู่ในดิน น้ำ และรากวัชพืชได้นาน ไหลไปกับน้ำระหว่างแปลง','Persists in soil, water and weed roots; moves with water between fields'],
    hit:['เหี่ยวเขียวทั้งที่ใบยังเขียว ตัดโคนแช่น้ำเห็นเมือกขาวไหลออก','Green wilt while leaves stay green; a cut stem in water streams white ooze'],
    ctl:['ไตรโคเดอร์มาช่วยน้อย ต้องหมุนเวียนกับพืชที่ไม่ใช่ตระกูลมะเขือ เช่น ข้าว ข้าวโพด อย่างน้อย 2–3 ปี ใช้ต้นตอต้านทาน','Trichoderma helps little. Rotate with non-nightshade crops such as rice or maize for 2–3+ years; resistant rootstocks']},
  {k:'nem', c:'#7f8c8d', r:2.1, keep:[.5,.45], sup:.75, w:.3,
    n:['ไส้เดือนฝอยรากปม','Root-knot nematode'], sci:'Meloidogyne spp.',
    grp:['สัตว์ (หนอนตัวกลม Nematoda)','Animal (roundworm, Nematoda)'],
    size:['ตัวอ่อนยาว ~0.4 มิลลิเมตร ใหญ่ที่สุดในกลุ่มนี้','Juveniles ~0.4 mm long, the largest here'],
    st:['มีปาก ระบบย่อยอาหาร และเข็มแทง (stylet) เจาะเซลล์ราก ตัวเมียบวมกลมฝังในรากและวางไข่หลายร้อยฟอง','Has a mouth, gut and a stylet that pierces root cells. Females swell inside the root and lay hundreds of eggs'],
    live:['ไข่ในถุงเจลาตินอยู่ในดิน ขยายเร็วเมื่อปลูกพืชอาศัยซ้ำ','Eggs in gelatinous sacs in soil; multiplies fast with repeated host crops'],
    hit:['รากเป็นปม ดูดน้ำไม่ได้ แผลที่เจาะเปิดทางให้ฟิวซาเรียมและราลสโตเนีย','Galled roots take up little water; its wounds open the door to Fusarium and Ralstonia'],
    ctl:['หมุนเวียนกับพืชที่ไม่ใช่พืชอาศัย ปอเทือง ดาวเรือง เพิ่มอินทรียวัตถุ','Rotate with non-hosts, sunn hemp or marigold, add organic matter']}
];
const P0 = {fus:5, pyt:8, rhz:6, ral:3, nem:4};
function glyph(k, x, y, s, c){
  x = +x; y = +y;
  const g = (d, extra = '') => `<path d="${d}" transform="translate(${x} ${y}) scale(${s})" style="fill:none;stroke:${c};stroke-width:${1.6 / s};stroke-linecap:round${extra}"/>`;
  if (k === 'fus') return g('M-10 0 q5 -4 10 0 t10 0 M-5 -3 v6 M5 -3 v6') + `<path d="M-4 6 q4 6 9 0 q-4 3 -9 0z" transform="translate(${x} ${y}) scale(${s})" style="fill:${c}"/>`;
  if (k === 'pyt') return g('M-12 2 q6 -6 12 0 t12 0') + `<circle cx="${x + 9 * s}" cy="${y - 6 * s}" r="${2.4 * s}" style="fill:${c}"/>` + g('M9 -6 q4 -5 8 -3 M9 -6 q-2 -6 2 -9');
  if (k === 'rhz') return g('M-10 0 h12 M2 0 v-9 M-4 0 v7') + `<ellipse cx="${x + 7 * s}" cy="${y + 5 * s}" rx="${3.4 * s}" ry="${2.6 * s}" style="fill:${c}"/>`;
  if (k === 'ral') return [[-4,0],[2,-3],[3,4]].map(([dx,dy]) => `<rect x="${x + dx * s - 3 * s}" y="${y + dy * s - 1.3 * s}" width="${6 * s}" height="${2.6 * s}" rx="${1.3 * s}" style="fill:${c}"/>`).join('') + g('M6 -3 q3 -2 5 1');
  if (k === 'nem') return g('M-10 3 q4 -8 8 0 t8 0 t6 -2', ';stroke-width:' + (2.6 / s));
  return '';
}
function soilScene(pops, health, crop, hi){
  const W = 640, H = 270, rnd = rand(7);
  const leaf = mixHex('#3f8a3a', '#b48a2c', clamp(1 - health, 0, 1));
  const droop = (1 - health) * 28;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('ภาพตัดขวางดินและเชื้อโรค', 'Soil cross-section with pathogens')}">`;
  s += `<defs><linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a33"/><stop offset="1" stop-color="#4e3320"/></linearGradient></defs>`;
  s += `<rect x="0" y="0" width="${W}" height="78" style="fill:var(--bg)"/><rect x="0" y="78" width="${W}" height="${H - 78}" fill="url(#sg1)"/>`;
  // plant
  const cx = 320;
  if (crop === 'host'){
    s += `<path d="M${cx} 78 C ${cx} 50, ${cx + droop * .3} 30, ${cx + droop} ${18 + droop * .6}" style="fill:none;stroke:${leaf};stroke-width:4"/>`;
    [[-1, 58], [1, 48], [-1, 38], [1, 30]].forEach(([d, y], i) => {
      const dy = y + droop * (.25 + i * .12);
      s += `<ellipse cx="${cx + d * 18 + droop * .2}" cy="${dy}" rx="17" ry="6" transform="rotate(${d * (18 + droop)} ${cx + d * 18} ${dy})" style="fill:${leaf}"/>`;
    });
    if (health > .55) s += `<circle cx="${cx + 12 + droop}" cy="${26 + droop * .6}" r="5" fill="#c0392b"/><circle cx="${cx - 10 + droop}" cy="${40 + droop * .6}" r="4" fill="#c0392b"/>`;
  } else {
    const col = crop === 'leg' ? '#4f9a3c' : '#9fb547';
    for (let i = -3; i <= 3; i++) s += `<path d="M${cx + i * 14} 78 q${i * 2} -25 ${i * 5} -46" style="fill:none;stroke:${col};stroke-width:3"/>`;
  }
  // roots
  s += `<g style="stroke:#e8d6b8;fill:none;stroke-width:2;opacity:.85"><path d="M320 78 C318 120 330 160 322 230"/><path d="M320 100 C290 120 270 150 240 170"/><path d="M321 110 C350 130 380 150 410 180"/><path d="M322 150 C300 170 290 200 280 230"/><path d="M323 160 C350 180 360 210 372 240"/></g>`;
  // nematode galls
  if (pops.nem > 30) for (let i = 0; i < Math.min(6, pops.nem / 15); i++) s += `<circle cx="${[300,260,360,395,288,366][i]}" cy="${[118,160,138,172,214,226][i]}" r="4" style="fill:#e8d6b8"/>`;
  PATH.forEach(p => {
    const n = Math.round(pops[p.k] / 100 * 16);
    const op = hi && hi !== p.k ? .25 : 1;
    s += `<g style="opacity:${op}">`;
    for (let i = 0; i < n; i++){
      const near = rnd() < .65, ang = rnd() * Math.PI;
      const x = near ? 320 + Math.cos(ang) * (40 + rnd() * 120) : 20 + rnd() * 600;
      const y = near ? 100 + rnd() * 150 : 92 + rnd() * 165;
      s += glyph(p.k, x.toFixed(1), y.toFixed(1), 1.1, p.c);
    }
    s += '</g>';
  });
  return s + '</svg>';
}
function sim1(){
  const ROT = {mono:['host'], rot:['host','leg','cer'], plus:['host','leg','cer']};
  const CROPN = {host:['พริก/มะเขือเทศ','chili/tomato'], leg:['ถั่ว','legume'], cer:['ข้าวโพด','maize']};
  function run(st){
    const seq = ROT[st.sys], hist = [], p = Object.assign({}, P0);
    for (let s = 1; s <= 12; s++){
      const crop = seq[(s - 1) % seq.length];
      PATH.forEach(q => {
        if (crop === 'host'){
          const r = 1 + (q.r - 1) * (st.sys === 'plus' ? q.sup : 1);
          p[q.k] = clamp(p[q.k] + (r - 1) * p[q.k] * (1 - p[q.k] / 100), 0, 100);
        } else {
          p[q.k] *= q.keep[crop === 'leg' ? 0 : 1] * (st.sys === 'plus' ? .9 : 1);
        }
      });
      const yld = crop === 'host' ? 100 * PATH.reduce((a, q) => a * (1 - q.w * p[q.k] / 100), 1) : null;
      hist.push({s, crop, p: Object.assign({}, p), yld});
    }
    return hist;
  }
  const pl = player(900);
  Sim('sim1', {sys:'mono', season:4, hi:''}, st => head(
      'ปลูกพืชเดิมซ้ำที่เดิม: เชื้อโรคในดินสะสมอย่างไร', 'Same crop, same place: how soil pathogens build up',
      'เลือกวิธีปลูก แล้วเลื่อนฤดูหรือกดเล่น ดูว่าเชื้อแต่ละกลุ่มเพิ่มหรือลดในดินและต้นพืชเป็นอย่างไร กดการ์ดเชื้อด้านล่างเพื่อเน้นตำแหน่งในภาพ',
      'Pick a system, then move the season slider or press play to see each pathogen group rise or fall in the soil and how the plant responds. Tap a pathogen card below to highlight it in the picture.') +
    `<div class="ctlrow">${seg('sys', [['mono','ปลูกพืชเดิมซ้ำ','Same crop every season'],['rot','หมุนเวียน (พืชหลัก→ถั่ว→ข้าวโพด)','Rotation (crop→legume→maize)'],['plus','หมุนเวียน + ปุ๋ยหมัก + ไตรโคเดอร์มา','Rotation + compost + Trichoderma']], st.sys)}
      <div class="row">${rng('season','ฤดูที่','Season',1,12,1,st.season)}<button type="button" class="btn2" data-act="play">▶ ${L('เล่น','Play')}</button></div></div>
    <div class="pane" data-o="scene"></div>
    <div class="kpi" data-o="kpi"></div>
    <div class="pane" data-o="chart"></div>
    <div class="legend3">${PATH.map(q => `<span><i style="background:${q.c}"></i>${L(...q.n)}</span>`).join('')}<span><i style="background:var(--leaf)"></i>${L('ผลผลิตพืชหลัก (%)','Main crop yield (%)')}</span></div>
    <h4 style="margin:4px 0 0">${L('แบ่งเป็นกลุ่มอะไร โครงสร้างต่างกันอย่างไร','Which groups, and how their structures differ')}</h4>
    <div class="cards2">${PATH.map(q => `<div data-pk="${q.k}" tabindex="0" role="button" aria-pressed="false">
      <svg viewBox="0 0 120 50" aria-hidden="true">${glyph(q.k, 60, 26, 2.6, q.c)}</svg>
      <h4>${L(...q.n)} <i style="font-weight:400;font-size:.78rem;color:var(--muted)">${q.sci}</i></h4>
      <dl><dt>${L('กลุ่ม','Group')}</dt><dd>${L(...q.grp)}</dd><dt>${L('ขนาด','Size')}</dt><dd>${L(...q.size)}</dd><dt>${L('โครงสร้าง','Structure')}</dt><dd>${L(...q.st)}</dd><dt>${L('อยู่รอด','Survival')}</dt><dd>${L(...q.live)}</dd><dt>${L('ทำลาย','Damage')}</dt><dd>${L(...q.hit)}</dd><dt>${L('คุม','Control')}</dt><dd>${L(...q.ctl)}</dd></dl></div>`).join('')}</div>
    <p class="note">${L('อัตราเพิ่มและการอยู่รอดของเชื้อเป็นค่าสัมพัทธ์เพื่ออธิบายแนวโน้ม','Growth and survival rates are relative values to show the trend')} ${INF()} ${L('ลักษณะโครงสร้างของเชื้อเป็นความรู้พื้นฐานโรคพืช','Pathogen structures are standard plant pathology')}<sup><a href="#r1">1</a></sup></p>`,
  (st, root, api) => {
    const hist = run(st), cur = hist[st.season - 1];
    setOut(root, 'season', `${st.season} · ${L(...CROPN[cur.crop])}`);
    const lastHost = [...hist.slice(0, st.season)].reverse().find(h => h.crop === 'host');
    const health = lastHost ? lastHost.yld / 100 : 1;
    setOut(root, 'scene', soilScene(cur.p, cur.crop === 'host' ? health : 1, cur.crop, st.hi));
    const tot = PATH.reduce((a, q) => a + cur.p[q.k], 0) / PATH.length;
    const top = PATH.reduce((a, q) => cur.p[q.k] > cur.p[a.k] ? q : a, PATH[0]);
    setOut(root, 'kpi', `<div>${L('ปริมาณเชื้อเฉลี่ยในดิน','Average pathogen load')}<b>${fmt(tot)} / 100</b></div>
      <div>${L('เชื้อที่มากที่สุด','Dominant pathogen')}<b style="color:${top.c}">${L(...top.n)}</b></div>
      <div>${L('ผลผลิตพืชหลักรอบล่าสุด','Latest main-crop yield')}<b>${lastHost ? fmt(lastHost.yld) + '%' : '–'}</b></div>`);
    const ser = PATH.map(q => ({c:q.c, pts:hist.map(h => [h.s, h.p[q.k]])}));
    ser.push({c:css('--leaf'), wd:3, dash:true, pts:hist.filter(h => h.yld != null).map(h => [h.s, h.yld])});
    setOut(root, 'chart', lineChart(ser, {xmax:12, ymax:100, marker:st.season, xticks:hist.map(h => [h.s, h.s]),
      bands:hist.filter(h => h.crop !== 'host').map(h => [h.s - .5, h.s + .5, css('--leaf')]), aria:L('กราฟเชื้อโรคตามฤดู','Pathogens by season')}));
    root.querySelectorAll('[data-pk]').forEach(c => { const on = c.dataset.pk === st.hi; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)) });
    const pb = root.querySelector('[data-act="play"]'); if (pb) pb.textContent = (pl.on ? '❚❚ ' + L('หยุด','Pause') : '▶ ' + L('เล่น','Play'));
    if (!root._wired){
      root._wired = true;
      root.addEventListener('click', e => {
        const c = e.target.closest('[data-pk]');
        if (c){ api.state.hi = api.state.hi === c.dataset.pk ? '' : c.dataset.pk; api.refresh(); return }
        if (e.target.closest('[data-act="play"]')){
          if (pl.on){ pl.stop(); api.refresh(); return }
          if (api.state.season >= 12) api.state.season = 1;
          pl.start(() => { api.state.season++; const r = root.querySelector('[data-k="season"]'); if (r) r.value = api.state.season; api.refresh(); return api.state.season < 12 }, api.refresh);
          api.refresh();
        }
      });
      root.addEventListener('keydown', e => { const c = e.target.closest('[data-pk]'); if (c && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); c.click() } });
    }
  });
}

/* ================= 2. Trichoderma: how long before, and what it does to each problem ================= */
const TARGETS = [
  {k:'pyt', n:['รากเน่า/กล้าเน่า (พิเทียม ไฟทอฟธอรา)','Root rot / damping-off (Pythium, Phytophthora)'], e:.85, c:'#2e86c1',
    how:['แย่งที่และอาหารที่ผิวรากได้ก่อน และสร้างเอนไซม์กลูคาเนสกับเซลลูเลสย่อยผนังราน้ำ','Gets to root-surface space and food first and makes glucanase and cellulase that digest water-mold walls']},
  {k:'fus', n:['เหี่ยวฟิวซาเรียม','Fusarium wilt'], e:.7, c:'#8e44ad',
    how:['พันรอบเส้นใยเชื้อโรค ปล่อยไคติเนสย่อยผนังไคติน แต่เชื้อที่เข้าท่อน้ำแล้วเข้าไม่ถึง','Coils around pathogen hyphae and releases chitinase on the chitin wall, but cannot reach fungus already inside the xylem']},
  {k:'scl', n:['โคนเน่า (สเคลอโรเทียม ไรซอคโทเนีย)','Stem-base rot (Sclerotium, Rhizoctonia)'], e:.8, c:'#a0522d',
    how:['เบียนเส้นใยและเม็ดสเคลอโรเทียมโดยตรง เป็นเป้าหมายที่ได้ผลดีที่สุดกลุ่มหนึ่ง','Parasitizes hyphae and sclerotia directly; one of its best targets']},
  {k:'ral', n:['เหี่ยวเขียว (แบคทีเรียราลสโตเนีย)','Bacterial wilt (Ralstonia)'], e:.2, c:'#c0392b',
    how:['ไม่ทำลายแบคทีเรียโดยตรง ช่วยได้เพียงผ่านภูมิต้านทานของพืช','Does not attack bacteria directly; helps only through the plant\'s induced resistance']},
  {k:'vir', n:['ไวรัส (ใบด่าง ใบหงิก)','Viruses (mosaic, leaf curl)'], e:.03, c:'#d35400',
    how:['แทบไม่มีผล ไวรัสอยู่ในเซลล์พืชและมากับแมลงพาหะ ต้องใช้ท่อนพันธุ์สะอาดและคุมแมลง','Almost no effect: viruses live inside plant cells and arrive with insect vectors. Use clean planting material and control vectors']},
  {k:'ins', n:['แมลงศัตรูพืช','Insect pests'], e:0, c:'#7f8c8d',
    how:['ไม่ใช่เป้าหมาย ใช้เชื้อราบิวเวอเรีย เมตาไรเซียม หรือศัตรูธรรมชาติแทน (หัวข้อ 9)','Not a target. Use Beauveria, Metarhizium or natural enemies instead (topic 9)']}
];
function sim2(){
  Sim('sim2', {lead:10, om:'hi', ph:'ok', tg:'pyt'}, st => head(
      'ต้องใส่ไตรโคเดอร์มาก่อนนานแค่ไหน และมันทำอะไรกับเชื้ออื่น', 'How early must Trichoderma go in, and what does it do to other organisms?',
      'เลื่อนจำนวนวันที่ใส่ไตรโคเดอร์มาก่อนเชื้อโรคมาถึงหรือก่อนย้ายปลูก เลือกตัวปัญหา แล้วดูว่ารากถูกยึดพื้นที่ไว้เท่าไร ภูมิต้านทานของพืชขึ้นทันหรือไม่',
      'Slide how many days before the pathogen arrives (or before transplanting) Trichoderma is applied, pick a problem organism, and see how much of the root it has claimed and whether the plant\'s resistance is up in time.') +
    `<div class="ctlrow">${rng('lead','ใส่ก่อนเชื้อโรคมา','Applied before pathogen arrives',0,30,1,st.lead)}
      ${seg('om', [['lo','อินทรียวัตถุต่ำ','Low organic matter'],['hi','ผสมปุ๋ยหมัก','Mixed with compost']], st.om)}
      ${seg('ph', [['ok','pH 5.5–7','pH 5.5–7'],['acid','ดินกรดจัด / แห้งจัด','Very acid / very dry']], st.ph)}</div>
    ${seg('tg', TARGETS.map(t => [t.k, ...t.n]), st.tg)}
    <div class="two"><div class="pane" data-o="root" style="padding:4px"></div><div><div data-o="chart"></div><div class="legend3"><span><i style="background:var(--leaf)"></i>${L('ไตรโคเดอร์มายึดราก','Trichoderma on roots')}</span><span><i style="background:var(--water)"></i>${L('ภูมิต้านทานพืช (ISR)','Plant resistance (ISR)')}</span><span><i style="background:var(--warn)"></i>${L('เชื้อโรค','Pathogen')}</span></div></div></div>
    <div class="kpi" data-o="kpi"></div>
    <p class="msg" data-o="msg"></p>
    <div class="cards2">${[
      ['แย่งพื้นที่และอาหาร','Competition for space and food','โตเร็ว ยึดผิวรากและกินน้ำตาลที่รากปล่อยออกมาก่อนเชื้อโรค','Grows fast, occupies the root surface and eats root sugars before pathogens do'],
      ['เบียนเชื้อรา (mycoparasitism)','Mycoparasitism','พันรอบเส้นใยเชื้อโรค ปล่อยเอนไซม์ไคติเนสและกลูคาเนสย่อยผนังเซลล์','Coils round pathogen hyphae and releases chitinase and glucanase to dissolve their walls'],
      ['สร้างสารยับยั้ง (antibiosis)','Antibiosis','ปล่อยสารต้านเชื้อ เช่น 6-pentyl-pyrone ที่มีกลิ่นมะพร้าว','Releases antifungal compounds such as coconut-scented 6-pentyl-pyrone'],
      ['กระตุ้นภูมิพืช (ISR)','Induced systemic resistance','รากรับสัญญาณแล้วเตรียมระบบป้องกันทั้งต้นผ่านฮอร์โมนจัสโมเนตและเอทิลีน ใช้เวลาหลายวันหลังยึดราก','Roots sense it and prime defenses across the whole plant via jasmonate and ethylene, days after colonizing'],
      ['ช่วยการเติบโต','Growth promotion','ละลายฟอสฟอรัส สร้างสารคล้ายออกซิน รากแตกแขนงมากขึ้น','Solubilizes phosphorus and makes auxin-like compounds, so roots branch more']
    ].map(([a,b,c,d]) => `<div><h4>${L(a,b)}</h4><span>${L(c,d)}</span></div>`).join('')}</div>
    <p class="note">${L('กลไกตาม Harman และคณะ','Mechanisms after Harman et al.')}<sup><a href="#r4">4</a></sup> ${L('เส้นเวลาการยึดรากและภูมิต้านทานเป็นค่าประมาณเพื่ออธิบาย','The colonization and resistance timelines are illustrative estimates')} ${INF()}</p>`,
  (st, root) => {
    const t = TARGETS.find(x => x.k === st.tg);
    const t50 = st.om === 'hi' ? 5 : 9, cap = st.ph === 'ok' ? 1 : .6;
    const C = d => d <= 0 ? 0 : cap / (1 + Math.exp(-(d - t50) / 1.8));
    const I = d => .85 * C(d - 4);
    const tp = st.lead, prot = t.e * (.6 * C(tp) + .4 * I(tp));
    setOut(root, 'lead', `${st.lead} ${L('วัน','days')}`);
    const days = 45, pts = n => Array.from({length: days + 1}, (_, d) => [d, n(d) * 100]);
    const pat = d => d < tp ? 0 : 100 * clamp((1 - prot) * (1 - Math.exp(-(d - tp) / 6)) * (1 + .3 * (1 - prot)), 0, 1);
    setOut(root, 'chart', lineChart([{c:css('--leaf'), pts:pts(C)}, {c:css('--water'), pts:pts(I)}, {c:css('--warn'), pts:Array.from({length: days + 1}, (_, d) => [d, pat(d)])}],
      {w:400, h:200, xmax:days, ymax:100, marker:tp, xticks:[[0, L('ใส่','apply')], [10, '10'], [20, '20'], [30, '30'], [45, L('45 วัน','45 d')]], aria:L('เส้นเวลาไตรโคเดอร์มา','Trichoderma timeline')}));
    // root zone picture at the moment the pathogen arrives
    const cov = C(tp), r = rand(3); let s = `<svg viewBox="0 0 300 200" role="img" aria-label="${L('บริเวณราก','Root zone')}"><rect width="300" height="200" rx="6" fill="#5a3b24"/>`;
    s += `<path d="M150 0 C150 60 140 110 150 200 M150 60 C110 80 80 110 50 150 M150 80 C190 100 220 130 260 160 M146 120 C120 150 110 170 100 200 M150 130 C175 150 190 175 200 200" style="stroke:#efe0c4;stroke-width:5;fill:none"/>`;
    const nG = Math.round(cov * 40), nP = Math.round((1 - prot) * (t.e > 0 ? 18 : 10));
    for (let i = 0; i < nG; i++){ const x = 40 + r() * 220, y = 10 + r() * 185; s += `<path d="M${x} ${y} q6 -6 12 0 t10 -2" style="stroke:#7ddc6a;stroke-width:1.6;fill:none"/>` }
    for (let i = 0; i < nP; i++){ const x = 30 + r() * 240, y = 20 + r() * 170;
      s += t.k === 'ral' ? `<rect x="${x}" y="${y}" width="7" height="3" rx="1.5" fill="${t.c}"/>` : t.k === 'vir' ? `<circle cx="${x}" cy="${y}" r="2.4" fill="${t.c}"/>` : t.k === 'ins' ? `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="${t.c}"/>` : `<path d="M${x} ${y} q5 5 10 0 t10 0" style="stroke:${t.c};stroke-width:2;fill:none"/>` }
    if (I(tp) > .3) s += `<path d="M150 4 C150 60 140 110 150 196" style="stroke:var(--water);stroke-width:2;fill:none;stroke-dasharray:4 4"/>`;
    s += `<text x="10" y="18" style="font:11px var(--body);fill:#fff">${L('วันที่เชื้อโรคมาถึง','Day the pathogen arrives')}: ${tp}</text></svg>`;
    setOut(root, 'root', s);
    const base = 70, dis = base * (1 - prot);
    setOut(root, 'kpi', `<div>${L('รากที่ไตรโคเดอร์มายึดแล้ว','Root surface colonized')}<b>${fmt(cov * 100)}%</b></div>
      <div>${L('ภูมิต้านทานพืช','Plant resistance level')}<b>${fmt(I(tp) * 100)}%</b></div>
      <div>${L('ต้นที่เป็นโรค (ไม่ใส่ = 70%)','Plants diseased (untreated = 70%)')}<b>${fmt(dis)}%</b></div>`);
    let m, cls;
    if (t.e < .1){ m = L(...t.how); cls = 'bad' }
    else if (tp < 3){ m = L('ใส่พร้อมกับที่เชื้อโรคมา ไตรโคเดอร์มายังยึดรากไม่ทัน ผลจึงน้อย ', 'Applied at the same time as the pathogen: Trichoderma has not claimed the root yet, so the effect is small. ') + L(...t.how); cls = 'bad' }
    else if (C(tp) < .6 * cap){ m = L(`ใส่ก่อน ${tp} วันยังน้อยไป ควรใส่ก่อนอย่างน้อย 7–14 วัน และผสมกับปุ๋ยหมักให้มีอาหาร `, `${tp} days ahead is still short. Apply at least 7–14 days ahead, mixed with compost so it has food. `) + L(...t.how); cls = '' }
    else { m = L('ไตรโคเดอร์มายึดรากได้ก่อนและภูมิต้านทานพืชขึ้นแล้ว ', 'Trichoderma got to the root first and the plant\'s resistance is up. ') + L(...t.how); cls = 'good' }
    if (st.ph !== 'ok') m += L(' ดินกรดจัดหรือแห้งจัดทำให้เชื้อเพิ่มจำนวนได้น้อย', ' Very acid or dry soil limits how far it can spread.');
    const msg = out(root, 'msg'); msg.className = 'msg ' + cls; msg.textContent = m;
  });
}

/* ================= 3. traditional vs machine, step by step, with example farms ================= */
const STEPS3 = [
  {n:['ตรวจดิน','Soil testing'],
   a:['ขุดดิน 15–20 จุดแบบซิกแซกด้วยจอบหรือสว่านมือ ลึก 0–15 ซม. คลุกรวม ผึ่งแห้ง แล้วส่งสถานีพัฒนาที่ดิน หรือใช้ชุดตรวจดินภาคสนามวัด pH N P K แบบเทียบสี','Dig 15–20 spots in a zigzag with a hoe or hand auger, 0–15 cm deep, mix, air-dry, then send to a Land Development station or use a field kit that reads pH, N, P, K by color'],
   m:['รถเจาะดินไฮดรอลิกเก็บตัวอย่างตามกริด GPS ทุก ~1 เฮกตาร์ ห้องแล็บวิเคราะห์ด้วยสเปกโตรมิเตอร์ ได้แผนที่ใส่ปุ๋ยแบบอัตราผันแปร','A hydraulic probe on a vehicle samples a GPS grid about every hectare, the lab analyzes by spectrometry, and the result is a variable-rate fertilizer map'],
   ha:1.5, hm:.15, ca:60, cm:150},
  {n:['เพิ่มอินทรียวัตถุ','Adding organic matter'],
   a:['กองปุ๋ยหมักจากฟางและมูลสัตว์ใช้สารเร่ง พด.1 กลับกองทุก 7–10 วัน ขนลงแปลงด้วยรถเข็น ไถกลบพืชปุ๋ยสดด้วยรถไถเดินตามหรือควาย','Build compost from straw and manure with a Por Dor 1 activator, turn every 7–10 days, cart it to the field, plough in green manure with a two-wheel tractor or buffalo'],
   m:['เครื่องหว่านปุ๋ยคอก รถตัดสับฟางกระจายคลุมแปลง หรือเครื่องอัดฟางก้อนแทนการเผา แล้วจานพรวนไถกลบ','A manure spreader, a straw chopper that spreads residue, or a baler instead of burning, then a disc harrow to incorporate'],
   ha:4, hm:.4, ca:400, cm:550},
  {n:['ปลูกหมุนเวียน','Crop rotation'],
   a:['หลังเกี่ยวข้าวหยอดถั่วเขียวหรือถั่วลิสงด้วยมือโดยใช้ความชื้นที่เหลือในดิน เก็บฝักด้วยมือ','After the rice harvest, dibble mung bean or peanut by hand using leftover soil moisture, pick pods by hand'],
   m:['เครื่องปลูกพ่วงรถไถหยอดเมล็ดเป็นแถว รถเกี่ยวนวดเปลี่ยนหัวเกี่ยวสำหรับถั่วและข้าวโพด','A tractor-drawn planter sows in rows; the combine swaps headers for beans and maize'],
   ha:3, hm:.3, ca:300, cm:450},
  {n:['คลุมดินและลดการไถ','Soil cover and less tillage'],
   a:['คลุมโคนด้วยฟาง ทำแปลงยกร่องถาวรไม่ไถใหม่ บนที่ลาดชันปลูกหญ้าแฝกและแถบพืชตามแนวระดับ','Mulch with straw by hand, permanent raised beds that are not re-dug, vetiver grass and contour strips on slopes'],
   m:['เครื่องปลูกแบบไม่ไถ (no-till drill) หยอดเมล็ดผ่านเศษพืชได้เลย ลูกกลิ้งล้มพืชคลุม (roller-crimper) ทำให้พืชคลุมเป็นวัสดุคลุมดิน','A no-till drill sows straight through residue; a roller-crimper flattens the cover crop into a mulch'],
   ha:3.5, hm:.25, ca:250, cm:350},
  {n:['เติมจุลินทรีย์','Adding microbes'],
   a:['ขยายเชื้อไตรโคเดอร์มาบนข้าวสุกในถุง 7 วัน คลุกปุ๋ยหมักหรือรำ แล้วหว่านรองก้นหลุม','Grow Trichoderma on cooked rice in bags for 7 days, mix into compost or bran, put it in planting holes'],
   m:['ผลิตในถังหมัก (fermenter) ควบคุมอุณหภูมิ เคลือบเมล็ด หรือปล่อยไปกับระบบน้ำหยด','Produced in a temperature-controlled fermenter, coated on seed, or delivered through drip lines'],
   ha:1, hm:.1, ca:80, cm:200}
];
const FARMS3 = [
  {t:'a', n:['สวนป่าเกษตรของวิบูลย์ เข็มเฉลิม ฉะเชิงเทรา','Wiboon Khemchalerm\'s forest garden, Chachoengsao'], d:['ปราชญ์ชาวบ้านที่เปลี่ยนไร่มันสำปะหลังเป็นป่ากินได้ ไม่ไถ คลุมดินด้วยใบไม้ พืชหลายชั้น','A farmer-sage who turned cassava land into an edible forest: no tillage, leaf-litter cover, many layers of plants']},
  {t:'a', n:['ทฤษฎีใหม่ โครงการวัดมงคลชัยพัฒนา สระบุรี','New Theory farming, Wat Mongkol Chaipattana project, Saraburi'], d:['แบ่งที่ดินเป็นสระน้ำ นาข้าว พืชผสม และที่อยู่อาศัย ใช้แรงงานครัวเรือนและปุ๋ยหมัก','Land split into pond, rice, mixed crops and homestead, using family labor and compost']},
  {t:'a', n:['หญ้าแฝกบนที่ลาดชัน กรมพัฒนาที่ดิน','Vetiver on slopes, Land Development Department'], d:['ปลูกแถบหญ้าแฝกตามแนวระดับเพื่อลดการชะล้างหน้าดิน ใช้แรงคนเป็นหลัก','Contour strips of vetiver grass to cut topsoil loss, planted mostly by hand']},
  {t:'m', n:['Rodale Institute Farming Systems Trial สหรัฐฯ','Rodale Institute Farming Systems Trial, USA'], d:['แปลงทดลองระยะยาวตั้งแต่ปี 1981 เทียบอินทรีย์กับเคมี ใช้ลูกกลิ้งล้มพืชคลุมและเครื่องปลูกไม่ไถ','Long-term trial since 1981 comparing organic and conventional, using a roller-crimper and no-till planting']},
  {t:'m', n:['ฟาร์มของ Gabe Brown นอร์ทดาโคตา สหรัฐฯ','Gabe Brown\'s farm, North Dakota, USA'], d:['ไม่ไถ ปลูกพืชคลุมหลายชนิดผสม และเลี้ยงสัตว์แทะเล็มหมุนเวียน ลดปุ๋ยเคมีลงมาก','No-till, multi-species cover crops and rotational grazing, with much less synthetic fertilizer']},
  {t:'m', n:['นาข้าวไทยที่ใช้รถเกี่ยวพร้อมเครื่องอัดฟาง','Thai rice farms using combines with straw balers'], d:['อัดฟางเป็นก้อนขายเป็นอาหารสัตว์หรือวัสดุเพาะเห็ดแทนการเผา ลดหมอกควัน','Straw is baled and sold for feed or mushroom growing instead of burned, cutting haze']}
];
function scene3(step, prog, mode){
  // field strip with a worker or tractor moving across; prog 0..1
  const W = 600, H = 110, x = 30 + prog * 520, done = 30 + prog * 520;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('ภาพการทำงานในแปลง','Field work picture')}"><rect x="20" y="50" width="560" height="44" rx="4" fill="#8a5a33"/>`;
  s += `<rect x="20" y="50" width="${done - 20}" height="44" rx="4" fill="${['#6d8f3b','#5b3a1f','#4f9a3c','#b9a46a','#3f7a35'][step]}"/>`;
  for (let i = 0; i < 14; i++){ const xx = 40 + i * 40; if (xx < done) s += `<path d="M${xx} 50 q-3 -10 0 -16 M${xx} 50 q4 -9 2 -14" style="stroke:#3f7a35;stroke-width:2;fill:none"/>` }
  if (mode === 'a') s += `<g transform="translate(${x} 20)"><circle cx="0" cy="0" r="6" fill="#e0b088"/><path d="M0 6 v20 M0 12 l-9 8 M0 12 l10 5 M0 26 l-6 14 M0 26 l6 14" style="stroke:var(--fg);stroke-width:3;fill:none;stroke-linecap:round"/><path d="M10 17 l8 22" style="stroke:#8a5a33;stroke-width:3"/></g>`;
  else s += `<g transform="translate(${x - 30} 22)"><rect x="0" y="6" width="40" height="18" rx="3" fill="#c0392b"/><rect x="22" y="-6" width="16" height="14" rx="2" fill="#922b21"/><circle cx="8" cy="28" r="9" fill="#222"/><circle cx="34" cy="30" r="7" fill="#222"/><rect x="-24" y="16" width="22" height="10" fill="#7f8c8d"/></g>`;
  return s + '</svg>';
}
function sim3(){
  const pl = player(60);
  Sim('sim3', {step:0, area:10, t:0}, st => head(
      'ขั้นตอนบำรุงดินที่ทำจริง: แบบดั้งเดิมกับเครื่องจักร', 'Soil-building steps in practice: traditional vs machinery',
      'เลือกขั้นตอน แล้วกดเริ่มเพื่อดูคนกับเครื่องจักรทำงานพื้นที่เท่ากันพร้อมกัน เทียบเวลา ค่าใช้จ่าย และข้อดีข้อเสีย',
      'Pick a step and press start to watch a person and a machine work the same area side by side, comparing time, cost, and pros and cons.') +
    `<div class="tabs2" data-o="tabs">${STEPS3.map((s, i) => `<button type="button" data-step="${i}" aria-pressed="${i === st.step}">${i + 1}. ${L(...s.n)}</button>`).join('')}</div>
    <div class="ctlrow">${rng('area','พื้นที่','Area',2,50,1,st.area)}<div class="row"><button type="button" class="btn2" data-act="go">▶ ${L('เริ่มทำงาน','Start work')}</button></div></div>
    <div class="two"><div><h4>${L('แบบดั้งเดิม (แรงคน สัตว์ เครื่องมือเล็ก)','Traditional (people, animals, small tools)')}</h4><div data-o="sa"></div><p data-o="ta"></p><div class="kpi" data-o="ka"></div></div>
      <div><h4>${L('เครื่องจักร','Machinery')}</h4><div data-o="sm"></div><p data-o="tm"></p><div class="kpi" data-o="km"></div></div></div>
    <p class="msg" data-o="msg"></p>
    <h4 style="margin:4px 0 0">${L('ตัวอย่างฟาร์มที่ใช้วิธีนี้','Example farms using these methods')}</h4>
    <div class="cards2">${FARMS3.map(f => `<div><span class="eyebrow" style="color:${f.t === 'a' ? 'var(--soil)' : 'var(--water)'}">${f.t === 'a' ? L('ดั้งเดิม','Traditional') : L('เครื่องจักร','Machinery')}</span><h4>${L(...f.n)}</h4><span>${L(...f.d)}</span></div>`).join('')}</div>
    <p class="note">${L('ชั่วโมงทำงานและค่าใช้จ่ายต่อไร่เป็นค่าประมาณสำหรับเทียบกัน','Hours and costs per rai are rough figures for comparison')} ${INF()} ${L('ข้อมูลตัวอย่างฟาร์ม','Example farm details')} ${UNV()} · ${L('หลักการบำรุงดิน','Soil principles')}<sup><a href="#r3">3</a></sup><sup><a href="#r6">6</a></sup></p>`,
  (st, root, api) => {
    const s = STEPS3[st.step], A = st.area;
    setOut(root, 'area', `${A} ${L('ไร่','rai')}`);
    const hA = s.ha * A, hM = s.hm * A, T = Math.max(hA, 1e-6);
    const pa = clamp(st.t / hA, 0, 1), pm = clamp(st.t / hM, 0, 1);
    setOut(root, 'sa', scene3(st.step, pa, 'a')); setOut(root, 'sm', scene3(st.step, pm, 'm'));
    setOut(root, 'ta', L(...s.a)); setOut(root, 'tm', L(...s.m));
    const dayA = hA / 8, dayM = hM / 8;
    setOut(root, 'ka', `<div>${L('เวลาทำงาน','Work time')}<b>${fmt(hA, 1)} ${L('ชม.','h')}</b>${fmt(dayA, 1)} ${L('วันแรงงาน','labor-days')}</div><div>${L('ค่าใช้จ่าย','Cost')}<b>${fmt(s.ca * A)} ฿</b></div>`);
    setOut(root, 'km', `<div>${L('เวลาทำงาน','Work time')}<b>${fmt(hM, 1)} ${L('ชม.','h')}</b>${fmt(dayM, 1)} ${L('วันแรงงาน','labor-days')}</div><div>${L('ค่าใช้จ่าย (รวมค่าจ้างรถ)','Cost (incl. machine hire)')}<b>${fmt(s.cm * A)} ฿</b></div>`);
    setOut(root, 'msg', st.t > 0 ? L(`ผ่านไป ${fmt(st.t, 1)} ชั่วโมง: เครื่องจักรเสร็จ ${fmt(pm * 100)}% แบบดั้งเดิมเสร็จ ${fmt(pa * 100)}%`, `${fmt(st.t, 1)} hours in: machine ${fmt(pm * 100)}% done, traditional ${fmt(pa * 100)}% done`) + ' · ' +
      L('เครื่องจักรเร็วกว่ามากแต่ต้องมีทุนหรือรถรับจ้าง และเข้าแปลงลาดชันหรือแปลงเล็กไม่ได้ แบบดั้งเดิมใช้แรงงานมากแต่เงินสดน้อยและทำได้ทุกที่', 'Machines are far faster but need capital or hire services and cannot work steep or tiny plots; traditional methods take much more labor but little cash and work anywhere')
      : L('กด "เริ่มทำงาน" เพื่อดูความเร็ว', 'Press "Start work" to compare speed'));
    root.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.step === st.step)));
    if (!root._wired){
      root._wired = true;
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-step]');
        if (b){ pl.stop(); api.state.step = +b.dataset.step; api.state.t = 0; api.refresh(); return }
        if (e.target.closest('[data-act="go"]')){
          api.state.t = 0; const S = STEPS3[api.state.step], end = S.ha * api.state.area, inc = end / 120;
          pl.start(() => { api.state.t = Math.min(end, api.state.t + inc); api.refresh(); return api.state.t < end });
        }
      });
      root.addEventListener('input', e => { if (e.target.dataset.k === 'area'){ pl.stop(); api.state.t = 0; api.refresh() } });
    }
  });
}

/* ================= 5. seed vs tissue culture route player ================= */
const ROUTES5 = {
  seed: [
    [['คัดพันธุ์หรือผสมพันธุ์','Select or cross varieties'], [6, 10, 'y'], ['ผสมพ่อแม่ คัดลูกหลายชั่วรุ่นจนลักษณะนิ่ง ทดสอบผลผลิตหลายพื้นที่','Cross parents and select over several generations until traits are stable; multi-site yield trials']],
    [['เมล็ดพันธุ์หลัก','Foundation seed'], [1, 1, 's'], ['นักปรับปรุงพันธุ์ผลิตเมล็ดบริสุทธิ์จำนวนน้อย','Breeders produce a small amount of pure seed']],
    [['แปลงขยายพันธุ์','Seed multiplication'], [2, 3, 's'], ['ขยายเป็นเมล็ดพันธุ์ขยายและพันธุ์จำหน่าย ถอนพันธุ์ปนออก','Multiplied into registered then certified seed, rogueing off-types']],
    [['ตรวจความงอกและความบริสุทธิ์','Germination and purity tests'], [3, 4, 'w'], ['สุ่มตัวอย่างทดสอบความงอก ความชื้น และพันธุ์ปน ก่อนรับรอง','Samples tested for germination, moisture and off-types before certification']],
    [['เกษตรกร','Farmers'], [1, 1, 's'], ['ปลูกหนึ่งฤดู ข้าวโพดลูกผสมต้องซื้อใหม่ทุกฤดู','Grown for a season; hybrid maize must be bought new every season']],
    [['โรงสี โรงงาน ผู้ส่งออก','Mills, factories, exporters'], [0, 0, ''], ['ผลผลิตเข้าสู่ตลาด','Harvest enters the market']]
  ],
  tissue: [
    [['เลือกต้นแม่ปลอดโรค','Disease-free mother plant'], [2, 4, 'w'], ['ตรวจไวรัสด้วยวิธีทางห้องแล็บ เช่น PCR หรือ ELISA','Checked for viruses with lab tests such as PCR or ELISA']],
    [['ฟอกฆ่าเชื้อชิ้นส่วน','Sterilize explants'], [1, 2, 'd'], ['ตัดยอดหรือตาข้าง ฟอกด้วยแอลกอฮอล์และสารฟอกขาว ในตู้ปลอดเชื้อ','Cut shoot tips or buds, sterilize with alcohol and bleach in a laminar-flow cabinet']],
    [['เพิ่มจำนวนยอดในอาหารวุ้น','Multiply shoots on agar'], [4, 6, 'w'], ['อาหารวุ้นมีน้ำตาล ธาตุอาหาร และฮอร์โมนไซโทไคนิน ยอดแตกเพิ่มราว 3–5 เท่าต่อรอบ ตัดแบ่งซ้ำหลายรอบ','Agar with sugar, nutrients and cytokinin; shoots multiply about 3–5× per cycle, subcultured repeatedly']],
    [['ชักนำราก','Induce roots'], [3, 4, 'w'], ['ย้ายลงอาหารที่มีออกซินให้ออกราก','Moved to an auxin medium to root']],
    [['อนุบาลในโรงเรือน','Harden off'], [4, 8, 'w'], ['ค่อยๆ ลดความชื้น ให้ต้นปรับตัวกับอากาศจริง','Humidity lowered step by step so plants adapt to open air']],
    [['แปลงขยายท่อนพันธุ์','Cutting multiplication'], [6, 12, 'm'], ['ปลูกขยายเป็นท่อนพันธุ์สะอาด เช่น มันสำปะหลัง อ้อย','Grown out into clean cuttings, e.g. cassava, sugarcane']],
    [['เกษตรกร','Farmers'], [0, 0, ''], ['ได้ต้นปลอดโรคและตรงพันธุ์','Get disease-free, true-to-type plants']]
  ]
};
function sim5(){
  const host = document.querySelector('#t5');
  if (!host || $('sim5')) return;
  const d = document.createElement('div'); d.className = 'sim'; d.id = 'sim5'; host.appendChild(d);
  const U = {y:['ปี','yr'], s:['ฤดู','season'], w:['สัปดาห์','wk'], d:['วัน','d'], m:['เดือน','mo']};
  const pl = player(1100);
  Sim('sim5', {route:'tissue', at:0, cyc:4}, st => head(
      'เดินตามเส้นทางต้นพันธุ์ทีละขั้น', 'Walk the planting-material route step by step',
      'เลือกเส้นทาง กดแต่ละขั้นหรือกดเล่น และในเส้นทางเนื้อเยื่อ ลองปรับจำนวนรอบการตัดแบ่งเพื่อดูว่าจากยอดเดียวได้ต้นกี่ต้น',
      'Pick a route, tap each step or press play. On the tissue route, change the number of subculture cycles to see how many plants one shoot becomes.') +
    `<div class="ctlrow">${seg('route', [['seed','เส้นทางเมล็ดพันธุ์','Seed route'],['tissue','เส้นทางเพาะเลี้ยงเนื้อเยื่อ','Tissue culture route']], st.route)}
      <div data-o="cycbox">${rng('cyc','จำนวนรอบตัดแบ่งยอด','Subculture cycles',1,8,1,st.cyc)}</div>
      <div class="row"><button type="button" class="btn2" data-act="play">▶ ${L('เล่นทีละขั้น','Play steps')}</button></div></div>
    <div class="flowp" data-o="flow"></div>
    <p class="msg" data-o="msg"></p>
    <div class="kpi" data-o="kpi"></div>
    <p class="note">${L('ระยะเวลาแต่ละขั้นเป็นช่วงที่พบทั่วไป','Durations are typical ranges')} ${INF()} ${L('ตัวอย่างโรคใบด่างมันสำปะหลัง','Cassava mosaic example')}<sup><a href="#r10">10</a></sup></p>`,
  (st, root, api) => {
    const R = ROUTES5[st.route]; if (st.at >= R.length) st.at = 0;
    setOut(root, 'cyc', `${st.cyc} ${L('รอบ','cycles')}`);
    out(root, 'cycbox').style.visibility = st.route === 'tissue' ? 'visible' : 'hidden';
    setOut(root, 'flow', R.map(([n, [a, b, u]], i) => `<button type="button" data-at="${i}" aria-pressed="${i === st.at}" class="${i < st.at ? 'done' : ''}">${i + 1}. ${L(...n)}${u ? `<small>${a === b ? a : a + '–' + b} ${L(...U[u])}</small>` : ''}</button>`).join('<span aria-hidden="true" style="align-self:center;color:var(--muted)">→</span>'));
    const [n, [a, b, u], txt] = R[st.at];
    setOut(root, 'msg', `<b>${L(...n)}</b> · ${L(...txt)}`);
    if (st.route === 'tissue'){
      const plants = Math.round(Math.pow(4, st.cyc)), weeks = 2 + 5 * st.cyc + 3.5 + 6;
      setOut(root, 'kpi', `<div>${L('จากยอดเดียว ได้ต้น (×4 ต่อรอบ)','Plants from one shoot (×4 per cycle)')}<b>${fmt(plants)}</b></div><div>${L('เวลาในแล็บและโรงอนุบาลโดยประมาณ','Approx. time in lab and nursery')}<b>${fmt(weeks)} ${L('สัปดาห์','weeks')}</b></div><div>${L('ข้อดี','Advantage')}<b style="font-size:.9rem">${L('ปลอดโรค ตรงพันธุ์','Disease-free, true to type')}</b></div>`);
    } else {
      setOut(root, 'kpi', `<div>${L('จากเริ่มผสมถึงเกษตรกร','From crossing to farmers')}<b>${L('ราว 8–14 ปี','about 8–14 years')}</b></div><div>${L('เมล็ด 1 กก. ข้าว ขยายได้ต่อฤดู','1 kg of rice seed multiplies per season')}<b>${L('~50–100 เท่า','~50–100×')}</b></div><div>${L('ข้อดี','Advantage')}<b style="font-size:.9rem">${L('ต้นทุนต่อต้นต่ำ เก็บรักษาง่าย','Cheap per plant, easy to store')}</b></div>`);
    }
    const pb = root.querySelector('[data-act="play"]'); if (pb) pb.textContent = pl.on ? '❚❚ ' + L('หยุด','Pause') : '▶ ' + L('เล่นทีละขั้น','Play steps');
    if (!root._wired){
      root._wired = true;
      root.addEventListener('click', e => {
        const b = e.target.closest('[data-at]');
        if (b){ pl.stop(); api.state.at = +b.dataset.at; api.refresh(); return }
        if (e.target.closest('[data-act="play"]')){
          if (pl.on){ pl.stop(); api.refresh(); return }
          api.state.at = 0; pl.start(() => { const n = ROUTES5[api.state.route].length; api.state.at++; if (api.state.at >= n){ api.state.at = n - 1; api.refresh(); return false } api.refresh(); return true }, api.refresh); api.refresh();
        }
      });
    }
  });
}

function init(){ sim1(); sim2(); sim3(); sim5() }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
