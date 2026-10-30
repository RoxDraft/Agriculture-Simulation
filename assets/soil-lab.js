/* Interactive sections 10–13 of the soil page: root chemistry lab, pest/predator sim, cultivation eras, breeding, growth durations. */
(function(){
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const store = {get(k,d){try{const v=localStorage.getItem('soil.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem('soil.'+k,JSON.stringify(v))}catch(e){}}};
function seg(id, cb){ const box = $(id); box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; [...box.children].forEach(x => x.setAttribute('aria-pressed', x === b)); cb(b.dataset.v) }) }
function setSeg(id, v){ [...$(id).children].forEach(x => x.setAttribute('aria-pressed', x.dataset.v === v)) }
const lerp = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]){ const [x0,y0] = pts[i-1], [x1,y1] = pts[i]; return y0 + (y1-y0)*(x-x0)/(x1-x0) } return pts[pts.length-1][1] };

/* ================= 10. root chemistry lab ================= */
const NUT = [['N','ไนโตรเจน'],['P','ฟอสฟอรัส'],['K','โพแทสเซียม'],['Ca','แคลเซียม'],['Mg','แมกนีเซียม'],['Fe','เหล็ก']];
// relative availability vs pH (after Truog 1946)
const PHC = {
  N:[[4,.4],[5,.65],[6,1],[8,1],[9,.6]], P:[[4,.2],[5,.45],[6,.95],[7,1],[7.5,.75],[8,.5],[9,.3]],
  K:[[4,.45],[5,.7],[6,1],[9,1]], Ca:[[4,.3],[5,.55],[6,.9],[6.5,.97],[7,1],[8.5,1],[9,.85]],
  Mg:[[4,.3],[5,.55],[6,.9],[6.5,.97],[7,1],[8.5,1],[9,.8]], Fe:[[4,1],[6,1],[6.5,.8],[7,.55],[7.5,.35],[8,.2],[9,.12]]
};
const FE_CHELATE = [[4,1],[6.5,1],[7,.8],[7.5,.55],[8,.35],[9,.2]];
const CROPS = {rice:{n:'ข้าว',t:[25,33],flood:true}, lettuce:{n:'ผักกาดหอม',t:[15,24]}, tomato:{n:'มะเขือเทศ',t:[20,28],fruit:true}};
const C = Object.assign({env:'soil', crop:'lettuce', ph:6.3, w:55, t:22, sup:{N:100,P:100,K:100,Ca:100,Mg:100,Fe:100}}, store.get('lab', {}));

function buildNut(){
  $('cNut').innerHTML = NUT.map(([k,n]) => `<label for="s${k}">${n}</label><input id="s${k}" type="range" min="0" max="150" step="5" value="${C.sup[k]}"><b id="v${k}"></b>`).join('');
  NUT.forEach(([k]) => $('s'+k).addEventListener('input', e => { C.sup[k] = +e.target.value; lab() }));
  const note = document.createElement('p'); note.className = 'mini'; note.style.gridColumn = '1/-1'; note.textContent = 'ปุ๋ยที่ให้ เป็น % ของที่พืชต้องการ'; $('cNut').prepend(note);
}
function model(){
  const soil = C.env === 'soil', crop = CROPS[C.crop];
  let ws = 1, an = 0;
  if (soil){ ws = C.w < 25 ? .3 + .7*C.w/25 : 1; an = C.w > 75 ? (C.w-75)/25 : 0 }
  else an = C.w < 35 ? (35-C.w)/35 : 0;
  // flooding pulls soil pH toward neutral (Ponnamperuma 1972)
  const effPH = soil && an > 0 ? C.ph + (6.8 - C.ph)*an*.7 : C.ph;
  const [t0,t1] = crop.t, tempF = Math.max(.2, 1 - .06*Math.max(0, t0 - C.t, C.t - t1));
  const av = {};
  NUT.forEach(([k]) => {
    const curve = k === 'Fe' && !soil ? FE_CHELATE : PHC[k];
    let v = C.sup[k]/100 * lerp(curve, effPH);
    if (k === 'Fe' && soil) v *= 1 + 2*an;
    av[k] = v;
  });
  const al = soil && effPH < 5 ? 1 - (5 - effPH)*.35 : 1;
  const mean = NUT.reduce((s,[k]) => s + C.sup[k], 0)/NUT.length;
  const salt = !soil && mean > 125 ? 1 - (mean-125)/100 : soil && mean > 135 ? 1 - (mean-135)/120 : 1;
  const feTox = av.Fe > 1.7 ? Math.max(.5, 1 - (av.Fe-1.7)*.5) : 1;
  const nutF = Math.min(...NUT.map(([k]) => Math.min(1, av[k])));
  const lim = NUT.reduce((a,[k]) => av[k] < av[a] ? k : a, 'N');
  const factors = [['ธาตุอาหาร ('+NUT.find(n=>n[0]===lim)[1]+')', nutF], ['น้ำ', ws], ['ออกซิเจนที่ราก', 1 - an*(crop.flood && soil ? .1 : .7)], ['อุณหภูมิ', tempF], ['อะลูมิเนียมเป็นพิษ', al], ['ความเค็มของปุ๋ย', salt], ['เหล็กเป็นพิษ', feTox]];
  let g = factors.reduce((p,[,v]) => p*v, 1) * (C.env === 'closed' ? 1.15 : 1);
  const worst = factors.reduce((a,b) => b[1] < a[1] ? b : a);
  return {soil, crop, ws, an, effPH, tempF, av, al, salt, feTox, g, worst, mean};
}
function lab(){
  const m = model(), soil = m.soil;
  store.set('lab', C);
  $('vPH').textContent = C.ph.toFixed(1) + (soil && m.an > 0 ? ` (หลังน้ำขัง ~${m.effPH.toFixed(1)})` : '');
  $('lW').textContent = soil ? 'น้ำในดิน' : 'ออกซิเจนละลายในสารละลาย';
  $('vW').textContent = soil ? (C.w < 25 ? 'แห้ง' : C.w > 75 ? 'ขังน้ำ' : 'ชื้นพอดี') + ` ${C.w}%` : `${C.w}%`;
  $('vT').textContent = `${C.t} °C (เหมาะกับ${m.crop.n} ${m.crop.t[0]}–${m.crop.t[1]} °C)`;
  NUT.forEach(([k]) => $('v'+k).textContent = C.sup[k] + '%');
  $('vGrow').textContent = Math.round(m.g*100) + '%';
  $('gGrow').style.width = Math.min(100, m.g/1.15*100) + '%';
  $('limit').textContent = m.worst[1] < .98 ? `ตัวจำกัดหลักตอนนี้: ${m.worst[0]} ตามกฎปัจจัยจำกัด พืชโตได้เท่าที่ปัจจัยที่ขาดมากที่สุดยอมให้` : 'ไม่มีปัจจัยใดจำกัดชัดเจน' + (C.env === 'closed' ? ' ระบบปิดเติม CO₂ ทำให้โตเร็วกว่าปกติ' : '');
  $('avail').innerHTML = '<p class="mini" style="margin:0">ธาตุที่อยู่ในรูปที่รากดูดได้ (% ของที่พืชต้องการ) หลังผ่านผลของ pH และน้ำขัง</p>' + NUT.map(([k,n]) => { const v = m.av[k]*100, cls = v < 70 ? 'lo' : v > 130 ? 'hi' : '';
    return `<div class="arow"><span>${n} (${k})</span><span class="b"><i class="${cls}" style="width:${Math.min(100, v/1.5)}%"></i></span><span>${Math.round(v)}</span></div>` }).join('');
  reactions(m); symptoms(m); plant(m);
}
function reactions(m){
  const R = [], soil = m.soil, ph = m.effPH;
  const add = (cls, title, eq, txt) => R.push(`<div class="${cls}"><b>${title}</b><code>${eq}</code>${txt}</div>`);
  add('good', 'สังเคราะห์แสงที่ใบ', '6CO₂ + 6H₂O + แสง → C₆H₁₂O₆ + 6O₂', C.env === 'closed' ? 'ระบบปิดเติม CO₂ เป็นราว 800–1,000 ppm ปฏิกิริยานี้จึงเร็วขึ้น' : 'ต้นทางของพลังงานทั้งหมดในพืช');
  if (m.an < .3) add('good', 'รากหายใจ', 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP', 'รากใช้พลังงานนี้ปั๊มไอออนธาตุอาหารเข้าเซลล์ ถ้าขาด O₂ การดูดธาตุอาหารจะลดลง');
  if (C.t > 35) add('bad', 'อากาศร้อนเกิน', 'RuBisCO + O₂ → การหายใจแสง (photorespiration)', 'ข้าว ผักกาดหอม มะเขือเทศเป็นพืช C3 เมื่อร้อน ปากใบปิด เอนไซม์จับ O₂ แทน CO₂ เสียพลังงานเปล่า');
  if (soil){
    if (m.an < .3) add('', 'ไนตริฟิเคชันโดยแบคทีเรีย', 'NH₄⁺ + 2O₂ → NO₃⁻ + 2H⁺ + H₂O', 'เปลี่ยนแอมโมเนียมเป็นไนเตรตที่พืชดูดง่าย แต่ปล่อย H⁺ ทำให้ดินเป็นกรดขึ้นทีละน้อยเมื่อใส่ปุ๋ยแอมโมเนียมนานๆ');
    add('', 'ยูเรียสลายตัว', 'CO(NH₂)₂ + H₂O → 2NH₃ + CO₂', 'เอนไซม์ยูรีเอสในดินทำงานภายในไม่กี่วันหลังใส่ปุ๋ย 46-0-0');
    if (ph > 7.5) add('bad', 'ไนโตรเจนระเหย', 'NH₄⁺ ⇌ NH₃↑ + H⁺', 'ดินด่างดันสมดุลไปทางแก๊สแอมโมเนีย ควรฝังกลบปุ๋ยแทนการหว่านผิวดิน');
    if (ph < 5.5){
      add('bad', 'อะลูมิเนียมละลายออกมา', 'Al(OH)₃ + 3H⁺ → Al³⁺ + 3H₂O', 'Al³⁺ ทำลายปลายราก รากสั้นและหนา');
      add('bad', 'ฟอสเฟตถูกตรึง', 'Al³⁺ + H₂PO₄⁻ + 2H₂O → Al(OH)₂H₂PO₄↓ + 2H⁺', 'ใส่ฟอสเฟตไปมากแต่พืชได้ใช้น้อย');
      add('good', 'แก้ด้วยปูน', 'CaCO₃ + 2H⁺ → Ca²⁺ + H₂O + CO₂', 'ใส่ปูนมาร์ลหรือโดโลไมต์เพื่อยกค่า pH และได้แคลเซียมเพิ่ม');
    }
    if (ph > 7.3){
      add('bad', 'ฟอสเฟตตกตะกอนกับแคลเซียม', '3Ca²⁺ + 2PO₄³⁻ → Ca₃(PO₄)₂↓', 'ดินด่างหรือดินปูน ฟอสฟอรัสละลายน้อยลง');
      add('bad', 'เหล็กไม่ละลาย', 'Fe³⁺ + 3OH⁻ → Fe(OH)₃↓', 'ใบอ่อนเหลืองซีด แม้ในดินมีเหล็กมาก');
      add('good', 'แก้ด้วยกำมะถัน', '2S + 3O₂ + 2H₂O → 2H₂SO₄ (จุลินทรีย์)', 'ผงกำมะถันค่อยๆ ลด pH บริเวณราก');
    }
    if (m.an > .2){
      add('bad', 'ดีไนตริฟิเคชัน', '2NO₃⁻ + 10e⁻ + 12H⁺ → N₂↑ + 6H₂O', 'ดินขาดออกซิเจน แบคทีเรียใช้ไนเตรตแทน O₂ ปุ๋ยไนโตรเจนหายไปในอากาศ บางส่วนเป็น N₂O ซึ่งเป็นก๊าซเรือนกระจก (หัวข้อ 6)');
      add('', 'เหล็กถูกรีดิวซ์', 'Fe(OH)₃ + 3H⁺ + e⁻ → Fe²⁺ + 3H₂O', 'ทำให้ pH ของดินกรดขยับเข้าหาเป็นกลาง ฟอสเฟตที่จับกับเหล็กหลุดออกมา แต่ถ้า Fe²⁺ มากเกินจะเป็นพิษ');
    }
    if (m.an > .5){
      add('bad', 'เกิดมีเทน', 'CH₃COOH → CH₄↑ + CO₂', 'อาร์เคียในนาน้ำขังผลิตมีเทน นาเปียกสลับแห้งลดได้ (หัวข้อ 6)');
      add('bad', 'ซัลเฟตกลายเป็นไฮโดรเจนซัลไฟด์', 'SO₄²⁻ + 8e⁻ + 10H⁺ → H₂S + 4H₂O', 'กลิ่นไข่เน่า เป็นพิษต่อราก ทำให้รากดำ');
      if (!(m.crop.flood)) add('bad', 'รากหมักแทนหายใจ', 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂', 'ได้ ATP น้อยกว่าการหายใจปกติมาก เอทานอลสะสมทำให้รากตาย');
      else add('good', 'ข้าวส่งอากาศลงราก', 'O₂ (ใบ) → ช่องอากาศ aerenchyma → ราก', 'ข้าวสร้างท่ออากาศในลำต้น รอบรากจึงยังมีออกซิเจน ทนน้ำขังได้');
    }
  } else {
    add('', 'แยกถัง A และ B', 'Ca²⁺ + SO₄²⁻ → CaSO₄↓ · Ca²⁺ + HPO₄²⁻ → CaHPO₄↓', 'ถ้าผสมแม่ปุ๋ยเข้มข้นในถังเดียว แคลเซียมจะตกตะกอนกับซัลเฟตและฟอสเฟต จึงแยกถังแล้วค่อยเจือจางรวมกัน');
    add('', 'รากเปลี่ยน pH ของสารละลาย', 'รากดูด NO₃⁻ → ปล่อย OH⁻ / HCO₃⁻', 'pH ของสารละลายค่อยๆ สูงขึ้น ต้องวัดและเติมกรดปรับทุกวันหรือทุกไม่กี่วัน ช่วงที่เหมาะคือราว 5.5–6.5');
    if (C.ph > 6.8) add('bad', 'ธาตุตกตะกอนในถัง', 'Fe³⁺, Ca²⁺, PO₄³⁻ → ตะกอน', 'pH สูงทำให้เหล็กและฟอสเฟตตกตะกอน ใช้เหล็กคีเลตชนิดทนด่าง (เช่น Fe-EDDHA) ช่วยได้');
    if (m.an > .2) add('bad', 'ออกซิเจนในน้ำต่ำ', 'O₂ ละลายน้อยลงเมื่อน้ำร้อน', `น้ำ ${C.t} °C เก็บ O₂ ได้น้อย รากเสี่ยงเน่าจากเชื้อพิเทียม ต้องเติมอากาศหรือทำให้น้ำเย็นลง`);
    if (m.mean > 125) add('bad', 'สารละลายเข้มข้นเกิน (EC สูง)', 'แรงดันออสโมติกภายนอก > ภายในราก', 'รากดูดน้ำยาก ใบไหม้ที่ขอบ');
  }
  $('rx').innerHTML = R.join('');
}
function symptoms(m){
  const S = [], v = k => m.av[k];
  if (v('N') < .7) S.push('<b>ขาดไนโตรเจน:</b> ใบล่างเหลืองทั้งใบก่อน เพราะพืชย้ายไนโตรเจนจากใบแก่ไปเลี้ยงใบอ่อน');
  if (v('N') > 1.3) S.push('<b>ไนโตรเจนมากเกิน:</b> ใบเขียวเข้มอวบ แมลงปากดูดชอบ (ลองในหัวข้อ 11) ข้าวล้มง่าย ผักสะสมไนเตรต');
  if (v('P') < .7) S.push('<b>ขาดฟอสฟอรัส:</b> ใบเขียวเข้มอมม่วง ต้นแคระ รากน้อย ออกดอกช้า');
  if (v('K') < .7) S.push('<b>ขาดโพแทสเซียม:</b> ขอบใบแก่ไหม้เป็นสีน้ำตาล ผลไม่หวาน ลำต้นอ่อน');
  if (v('Ca') < .7) S.push(m.crop.fruit ? '<b>ขาดแคลเซียม:</b> ก้นผลมะเขือเทศเน่าดำ เพราะแคลเซียมเคลื่อนย้ายในพืชไม่ได้' : '<b>ขาดแคลเซียม:</b> ปลายใบอ่อนไหม้ (tipburn) พบบ่อยในผักกาดหอมที่โตเร็ว');
  if (v('Mg') < .7) S.push('<b>ขาดแมกนีเซียม:</b> ใบแก่เหลืองระหว่างเส้นใบ เส้นใบยังเขียว');
  if (v('Fe') < .7) S.push('<b>ขาดเหล็ก:</b> ใบอ่อนเหลืองซีดระหว่างเส้นใบ เพราะเหล็กเคลื่อนย้ายไม่ได้');
  if (m.feTox < 1) S.push('<b>เหล็กเป็นพิษ:</b> ใบมีจุดสีน้ำตาลส้ม (bronzing) พบในนาดินกรดน้ำขัง');
  if (m.al < 1) S.push('<b>อะลูมิเนียมเป็นพิษ:</b> รากสั้น หนา ปลายรากเสีย พืชจึงขาดธาตุอื่นตามไปด้วย');
  if (m.ws < 1) S.push('<b>ขาดน้ำ:</b> ใบเหี่ยว ปากใบปิด การสังเคราะห์แสงลด');
  if (m.an > .3 && !(m.crop.flood && m.soil)) S.push('<b>รากขาดออกซิเจน:</b> รากสีน้ำตาลดำ ใบเหี่ยวทั้งที่น้ำมาก');
  if (m.salt < 1) S.push('<b>ปุ๋ยเข้มข้นเกิน:</b> ขอบใบไหม้ ดูดน้ำยาก');
  if (m.tempF < .9) S.push(C.t > m.crop.t[1] ? `<b>ร้อนเกิน:</b> ${C.crop === 'lettuce' ? 'ผักกาดหอมแทงช่อดอกเร็วและมีรสขม' : C.crop === 'tomato' ? 'ดอกร่วง เกสรเป็นหมัน ติดผลน้อย' : 'เกสรข้าวเป็นหมัน เมล็ดลีบ'}` : '<b>เย็นเกิน:</b> โตช้า ดูดฟอสฟอรัสได้น้อย');
  $('sym').innerHTML = (S.length ? S : ['ใบเขียวสม่ำเสมอ ไม่มีอาการผิดปกติ']).map(s => `<li>${s}</li>`).join('');
}
function plant(m){
  const v = k => m.av[k], g = Math.max(.25, Math.min(1.1, m.g));
  const green = css('--leaf') || '#3f7a35', yellow = '#d8c24a', pale = '#c9d77a', purple = '#6a4f86', brown = '#8a4b22';
  const H = 150*g, base = 170, cx = 110;
  const leaf = (x, y, ang, len, fill, opts={}) => {
    const r = ang*Math.PI/180, ex = x + Math.cos(r)*len, ey = y - Math.sin(r)*len*.6;
    const mx = (x+ex)/2, my = (y+ey)/2, nx = -Math.sin(r)*len*.22, ny = -Math.cos(r)*len*.22;
    let s = `<path d="M${x} ${y}Q${mx+nx} ${my+ny} ${ex} ${ey}Q${mx-nx} ${my-ny} ${x} ${y}Z" fill="${fill}" stroke="${opts.edge||'none'}" stroke-width="${opts.edge?2.2:0}"/>`;
    s += `<path d="M${x} ${y}L${ex} ${ey}" stroke="${opts.vein||'rgba(0,0,0,.18)'}" stroke-width="${opts.vein?1.6:.8}"/>`;
    if (opts.tip) s += `<circle cx="${ex}" cy="${ey}" r="3.5" fill="${brown}"/>`;
    if (opts.spots) s += `<circle cx="${mx}" cy="${my}" r="1.8" fill="${brown}"/><circle cx="${(mx+ex)/2}" cy="${(my+ey)/2}" r="1.5" fill="${brown}"/>`;
    return s;
  };
  let old = green, oldOpt = {}, young = green, youngOpt = {};
  if (v('P') < .7) old = young = purple;
  if (v('N') < .7) old = yellow;
  if (v('Mg') < .7){ old = yellow; oldOpt.vein = green }
  if (v('K') < .7 || m.salt < 1) oldOpt.edge = brown;
  if (v('Fe') < .7){ young = pale; youngOpt.vein = green }
  if (v('Ca') < .7 && !m.crop.fruit) youngOpt.tip = true;
  if (m.feTox < 1) oldOpt.spots = true;
  if (v('N') > 1.3){ old = young = '#2a5a24' }
  const wilt = m.ws < .8 || (m.an > .3 && !(m.crop.flood && m.soil)) ? -18 : 0;
  const rootCol = m.an > .4 && !(m.crop.flood && m.soil) ? brown : '#e9e0c8', rootLen = m.al < 1 ? 22 : 45;
  let s = `<rect x="0" y="${base}" width="220" height="90" fill="${m.soil ? 'var(--soil)' : 'var(--water)'}" opacity=".25"/>`;
  if (m.soil && m.an > 0) s += `<rect x="0" y="${base-8}" width="220" height="8" fill="var(--water)" opacity="${.15+m.an*.4}"/>`;
  for (let i = -3; i <= 3; i++) s += `<path d="M${cx} ${base}q${i*6} ${rootLen*.5} ${i*12} ${rootLen*(1-Math.abs(i)*.08)}" stroke="${rootCol}" stroke-width="2" fill="none"/>`;
  s += `<path d="M${cx} ${base}L${cx} ${base-H}" stroke="${old}" stroke-width="4"/>`;
  const levels = [[.18, old, oldOpt],[.42, old, oldOpt],[.66, young, youngOpt],[.88, young, youngOpt]];
  levels.forEach(([f, col, o], i) => { const y = base - H*f, len = (i < 2 ? 58 : 44)*Math.max(.6, g); s += leaf(cx, y, 20 + wilt, len, col, o) + leaf(cx, y, 160 - wilt, len, col, o) });
  if (m.crop.fruit && g > .4){ const y = base - H*.55; [[-26,0],[24,8]].forEach(([dx,dy]) => { s += `<circle cx="${cx+dx}" cy="${y+dy}" r="9" fill="#d4482b"/>`; if (v('Ca') < .7) s += `<circle cx="${cx+dx}" cy="${y+dy+6}" r="4" fill="#3a2414"/>` }) }
  if (C.crop === 'rice' && g > .4) s += `<path d="M${cx} ${base-H}q14 -6 22 8" stroke="#c9a227" stroke-width="3" fill="none"/>`;
  $('plant').innerHTML = s;
}
function initLab(){
  buildNut();
  setSeg('cEnv', C.env); setSeg('cCrop', C.crop);
  $('cPH').value = C.ph; $('cW').value = C.w; $('cT').value = C.t;
  seg('cEnv', v => { C.env = v; if (v !== 'soil' && C.w < 40) { C.w = 70; $('cW').value = 70 } lab() });
  seg('cCrop', v => { C.crop = v; lab() });
  $('cPH').addEventListener('input', e => { C.ph = +e.target.value; lab() });
  $('cW').addEventListener('input', e => { C.w = +e.target.value; lab() });
  $('cT').addEventListener('input', e => { C.t = +e.target.value; lab() });
  lab();
}

/* ================= 11. pest / natural enemy sim ================= */
const P = Object.assign({N:1, spray:0, flower:false, resist:false, bio:false, day:80}, store.get('pest', {}));
const SPRAY_DAYS = [25,40,55,70];
function simulate(){
  const K = 60, out = [], sprays = SPRAY_DAYS.slice(0, P.spray); let p = 1.5, e = 1.2, D = 0, res = 0;
  for (let d = 0; d <= 110; d++){
    if (sprays.includes(d)){ p *= .25; e *= .08; res = 18 }
    if (P.bio && (d === 30 || d === 50)) p *= .5;
    const r = .13*P.N*(P.resist ? .6 : 1)*(res > 0 ? 1.25 : 1); if (res > 0) res--;
    const pred = .045*p*e/(1 + .02*p), imm = P.flower ? .12 : .03, m = P.flower ? .035 : .05;
    p = Math.max(.05, p + r*p*(1 - p/K) - pred);
    e = Math.max(.02, e + .22*pred - m*e + imm);
    D += Math.pow(p/K, 1.5)*.03;
    out.push({p, e, D});
  }
  return {out, sprays, yield: Math.max(0, 1 - D)*({0.8:.85, 1:1, 1.35:1.05}[P.N])};
}
function pest(){
  store.set('pest', P);
  $('vSpray').textContent = P.spray ? `${P.spray} ครั้ง (วันที่ ${SPRAY_DAYS.slice(0,P.spray).join(', ')})` : 'ไม่พ่น';
  $('vDay').textContent = P.day;
  const R = simulate(), cv = $('pChart'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = 220;
  cv.width = W*dpr; cv.height = H*dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr); x.clearRect(0,0,W,H);
  const l = 34, r = 8, t = 10, b = 22, max = 60, X = d => l + (W-l-r)*d/110, Y = v => t + (H-t-b)*(1 - Math.min(v,max)/max);
  x.strokeStyle = css('--line'); x.fillStyle = css('--muted'); x.font = '10px ' + css('--mono'); x.lineWidth = 1;
  [0,20,40,60].forEach(v => { x.beginPath(); x.moveTo(l, Y(v)); x.lineTo(W-r, Y(v)); x.stroke(); x.fillText(v, 6, Y(v)+3) });
  [0,30,60,90,110].forEach(d => { x.textAlign = d === 110 ? 'right' : d ? 'center' : 'left'; x.fillText('วัน ' + d, X(d), H-6) }); x.textAlign = 'left';
  x.setLineDash([3,3]); x.strokeStyle = css('--muted');
  R.sprays.forEach(d => { x.beginPath(); x.moveTo(X(d), t); x.lineTo(X(d), H-b); x.stroke() }); x.setLineDash([]);
  x.fillStyle = css('--warn'); x.globalAlpha = .12; x.fillRect(l, Y(40), W-l-r, Y(25)-Y(40)); x.globalAlpha = 1;
  x.fillStyle = css('--muted'); x.fillText('ระดับเศรษฐกิจ (สมมติ)', l+4, Y(40)+11);
  const line = (k, col, scale=1) => { x.strokeStyle = col; x.lineWidth = 2.2; x.beginPath(); R.out.forEach((o,d) => d ? x.lineTo(X(d), Y(o[k]*scale)) : x.moveTo(X(d), Y(o[k]*scale))); x.stroke() };
  line('e', css('--leaf'), 4); line('p', css('--warn'));
  x.strokeStyle = css('--fg'); x.lineWidth = 1; x.beginPath(); x.moveTo(X(P.day), t); x.lineTo(X(P.day), H-b); x.stroke();
  const o = R.out[P.day], dmg = Math.min(1, o.D*1.6), hop = o.p/60;
  $('field').innerHTML = Array.from({length:96}, (_, i) => { const n = (Math.sin(i*12.9898)*43758.5453) % 1, rr = Math.abs(n);
    const burnt = rr < Math.min(.95, dmg + (hop > .6 ? .3 : 0)); return `<i style="background:${burnt ? '#b08a4a' : rr < dmg + .15 ? '#9fb35a' : css('--leaf')}"></i>` }).join('');
  const peak = Math.max(...R.out.map(o => o.p));
  $('pKpi').innerHTML = `<div>ผลผลิตที่เหลือ<b>${Math.round(R.yield*100)}%</b></div><div>เพลี้ยสูงสุด (ตัว/กอ)<b>${peak.toFixed(1)}</b></div><div>ศัตรูธรรมชาติวันที่ ${P.day}<b>${(o.e).toFixed(1)}</b></div><div>ค่ายาและแรงพ่น<b>${P.spray*150 + (P.bio?120:0)} ฿/ไร่</b></div>`;
}
function initPest(){
  setSeg('pN', String(P.N)); $('pSpray').value = P.spray; $('pDay').value = P.day;
  ['pFlower','pResist','pBio'].forEach(id => $(id).checked = P[id.slice(1).toLowerCase()]);
  seg('pN', v => { P.N = +v; pest() });
  $('pSpray').addEventListener('input', e => { P.spray = +e.target.value; pest() });
  $('pDay').addEventListener('input', e => { P.day = +e.target.value; pest() });
  ['pFlower','pResist','pBio'].forEach(id => $(id).addEventListener('change', e => { P[id.slice(1).toLowerCase()] = e.target.checked; pest() }));
  window.addEventListener('resize', pest); pest();
}

/* ================= 12. cultivation eras + breeding ================= */
const SHORT = ['พันธุ์','ดิน','ปลูก','น้ำ ปุ๋ย','ศัตรูพืช','เก็บเกี่ยว','ขาย'];
const STEPS = ['เตรียมพันธุ์','เตรียมดิน','ปลูก','น้ำและปุ๋ย','ศัตรูพืช','เก็บเกี่ยว','หลังเก็บเกี่ยวและขาย'];
const ERAS = [
  {n:'ดั้งเดิม', y:'ก่อนราว พ.ศ. 2500', s:[
    'เก็บเมล็ดจากแปลงตัวเองทุกปี เลือกรวงที่สวย หมู่บ้านหนึ่งมีข้าวพื้นเมืองหลายสิบพันธุ์ แต่ละพันธุ์เข้ากับดินและน้ำของที่นั้น',
    'ไถด้วยควายหรือวัว ที่สูงทำไร่หมุนเวียน ถางและเผาแล้วปล่อยให้ป่าฟื้นหลายปีก่อนกลับมาปลูกใหม่',
    'ตกกล้าแล้วปักดำด้วยมือ ใช้แรงลงแขกช่วยกันทั้งหมู่บ้าน',
    'พึ่งน้ำฝนและเหมืองฝาย ปุ๋ยคือมูลสัตว์และตอซัง',
    'พึ่งศัตรูธรรมชาติ ความหลากหลายของพันธุ์ช่วยลดการระบาด ใช้สมุนไพรไล่แมลงบ้าง',
    'เกี่ยวด้วยเคียว ตากในแปลง นวดด้วยแรงควายหรือฟาดกับแคร่',
    'เก็บไว้กินในยุ้งเป็นหลัก แลกเปลี่ยนหรือขายส่วนเกินในตลาดท้องถิ่น'], m:{labor:95, yield:35, chem:2, data:5, capital:10}},
  {n:'ปฏิวัติเขียว', y:'ราว พ.ศ. 2503–2530', s:[
    'ใช้พันธุ์ปรับปรุงที่ต้นเตี้ย ตอบสนองต่อปุ๋ย ไม่ไวแสง ปลูกได้หลายรอบ ซื้อเมล็ดพันธุ์จากหน่วยงานหรือบริษัท',
    'รถไถเดินตามและแทรกเตอร์เข้ามาแทนควาย',
    'เริ่มหว่านน้ำตมแทนปักดำเพื่อลดแรงงาน',
    'เขื่อนและคลองชลประทานทำให้ปลูกนาปรังได้ ใส่ปุ๋ยเคมีสูตรตายตัวตามคำแนะนำทั่วไป',
    'ยาฆ่าแมลงออกฤทธิ์กว้างตามปฏิทิน ทำให้เพลี้ยกลับมาระบาด (ลองในหัวข้อ 11)',
    'เครื่องนวดและต่อมารถเกี่ยวนวด',
    'ขายข้าวเปลือกให้โรงสีและพ่อค้าคนกลาง ราคาขึ้นกับตลาดโลก'], m:{labor:55, yield:65, chem:90, data:15, capital:45}},
  {n:'ยั่งยืนและทฤษฎีใหม่', y:'ราว พ.ศ. 2535 เป็นต้นมา', s:[
    'กลับมาอนุรักษ์และคัดพันธุ์พื้นเมือง ศูนย์ข้าวชุมชนผลิตเมล็ดพันธุ์ดีเอง',
    'ไถกลบตอซังแทนเผา ปลูกพืชปุ๋ยสด แบ่งพื้นที่เป็นสระ นา สวน ที่อยู่ ตามแนวเกษตรทฤษฎีใหม่',
    'ปลูกผสมผสานและหมุนเวียน',
    'ตรวจดินแล้วใส่ปุ๋ยตามค่าวิเคราะห์ ใช้ปุ๋ยหมักและจุลินทรีย์ (หัวข้อ 2–3) นาเปียกสลับแห้ง',
    'การจัดการศัตรูพืชแบบผสมผสาน (IPM) สำรวจแปลงก่อนตัดสินใจพ่น ใช้ชีวภัณฑ์',
    'รถเกี่ยวนวดรับจ้าง',
    'กลุ่มเกษตรกร ตลาดสีเขียว มาตรฐาน GAP และอินทรีย์'], m:{labor:60, yield:60, chem:40, data:30, capital:35}},
  {n:'เกษตรแม่นยำ', y:'ราว พ.ศ. 2555 เป็นต้นมา', s:[
    'เมล็ดพันธุ์รับรองที่ตรวจความงอก พันธุ์ที่คัดด้วยเครื่องหมายดีเอ็นเอ',
    'ปรับระดับพื้นนาด้วยเลเซอร์ ทำให้น้ำท่วมสม่ำเสมอและใช้น้ำน้อยลง',
    'รถดำนาหรือโดรนหว่าน',
    'เซนเซอร์ระดับน้ำ แผนที่ดาวเทียมบอกจุดที่ข้าวโตไม่ดี ใส่ปุ๋ยเฉพาะจุดด้วยอัตราแปรผัน',
    'โดรนพ่นเฉพาะจุดที่พบโรค แอปพยากรณ์การระบาดจากอากาศ',
    'รถเกี่ยวนวดที่มีเครื่องวัดผลผลิตรายจุด',
    'ขายผ่านแพลตฟอร์ม ตรวจสอบย้อนกลับด้วย QR ถึงแปลง'], m:{labor:20, yield:80, chem:45, data:75, capital:70}},
  {n:'อัตโนมัติและระบบปิด', y:'ราว พ.ศ. 2563 เป็นต้นมา', s:[
    'ต้นกล้าจากเนื้อเยื่อหรือเมล็ดที่ผ่านการคัดด้วยจีโนม ผลิตในห้องควบคุม',
    'ไม่ใช้ดินในโรงงานผลิตพืช หรือใช้หุ่นยนต์เตรียมแปลงในไร่',
    'หุ่นยนต์ย้ายกล้า เรียงถาดปลูกหลายชั้น',
    'คอมพิวเตอร์คุมสูตรธาตุอาหาร pH EC แสง LED อุณหภูมิ และ CO₂ ตลอด 24 ชั่วโมง (หัวข้อ 10)',
    'ระบบปิดกันแมลงเข้า ใช้กล้องและ AI ตรวจโรคแต่เนิ่นๆ แทบไม่ใช้สารเคมี',
    'หุ่นยนต์เก็บเกี่ยวตามขนาดที่ตั้งไว้ ทุกวันตลอดปี',
    'ส่งตรงห้างและร้านอาหารด้วยสัญญาซื้อล่วงหน้า วางแผนผลิตตามคำสั่งซื้อ'], m:{labor:5, yield:100, chem:5, data:100, capital:100}}
];
const MK = [['labor','แรงงานต่อไร่'],['yield','ผลผลิตต่อพื้นที่'],['chem','สารเคมีกำจัดศัตรูพืช'],['data','การใช้ข้อมูล'],['capital','เงินลงทุน']];
const E = {era: store.get('era', 0), step: 0, timer: null};
function wheel(){
  const era = ERAS[E.era], cx = 160, cy = 160, R = 118, n = STEPS.length;
  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="16"/>`;
  STEPS.forEach((st, i) => {
    const a0 = -Math.PI/2 + i*2*Math.PI/n, a1 = a0 + 2*Math.PI/n - .05, on = i === E.step;
    const p = a => [cx + R*Math.cos(a), cy + R*Math.sin(a)];
    const [x0,y0] = p(a0), [x1,y1] = p(a1), am = (a0+a1)/2, [lx,ly] = [cx + (R-36)*Math.cos(am), cy + (R-36)*Math.sin(am) + 4];
    s += `<g tabindex="0" role="button" data-i="${i}" aria-label="${st}"><path d="M${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}" stroke="${on ? 'var(--water)' : 'var(--soil)'}" stroke-opacity="${on ? 1 : .35}" stroke-width="${on ? 22 : 16}" fill="none"/>
      <text x="${lx}" y="${ly}" text-anchor="middle" style="font:${on?600:400} 11px var(--body);fill:var(--fg)">${i+1}. ${SHORT[i]}</text></g>`;
  });
  s += `<text x="${cx}" y="${cy-4}" text-anchor="middle" style="font:700 15px var(--display);fill:var(--fg)">${era.n}</text><text x="${cx}" y="${cy+16}" text-anchor="middle" style="font:11px var(--body);fill:var(--muted)">${era.y}</text>`;
  $('wheel').innerHTML = s;
  [...$('wheel').querySelectorAll('g')].forEach(g => { const go = () => { stop(); E.step = +g.dataset.i; wheel() }; g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go() } }) });
  $('eraYears').textContent = `${era.n} · ${era.y} · ขั้นที่ ${E.step+1} จาก ${n}`;
  $('stepName').textContent = STEPS[E.step];
  $('stepTxt').textContent = era.s[E.step];
  $('eraBars').innerHTML = MK.map(([k,nm]) => `<div class="arow"><span>${nm}</span><span class="b"><i class="${k==='chem'&&era.m[k]>60?'lo':''}" style="width:${era.m[k]}%"></i></span><span>${era.m[k]}</span></div>`).join('');
  [...$('eraTabs').children].forEach((b,i) => b.setAttribute('aria-pressed', i === E.era));
}
function stop(){ if (E.timer){ clearInterval(E.timer); E.timer = null; $('playBtn').textContent = '▶ เล่นฤดูปลูก' } }
function initEra(){
  $('eraTabs').innerHTML = ERAS.map(e => `<button>${e.n}</button>`).join('');
  [...$('eraTabs').children].forEach((b,i) => b.addEventListener('click', () => { E.era = i; store.set('era', i); wheel() }));
  $('playBtn').addEventListener('click', () => {
    if (E.timer) return stop();
    $('playBtn').textContent = '■ หยุด'; E.step = -1;
    const tick = () => { E.step++; if (E.step >= STEPS.length){ E.step = 0; if (++E.era >= ERAS.length){ E.era = 0; stop() } } wheel() };
    tick(); E.timer = setInterval(tick, 2200);
  });
  wheel();
}
const BREED = [
  {n:'คัดเลือกโดยเกษตรกร', yr:[10,50], how:'เลือกเก็บเมล็ดจากต้นที่ดีที่สุดทุกปี ลักษณะที่ต้องการค่อยๆ สะสมขึ้น', ex:'ข้าวพื้นเมืองนับพันพันธุ์ในไทย ข้าวไร่ของชุมชนบนที่สูงในน่าน'},
  {n:'คัดพันธุ์บริสุทธิ์', yr:[6,10], how:'เก็บตัวอย่างพันธุ์จากหลายท้องที่ ปลูกเทียบกัน คัดสายต้นที่ดีที่สุดแล้วขยายให้ตรงพันธุ์', ex:'ข้าวขาวดอกมะลิ 105 คัดจากตัวอย่างที่เก็บจากฉะเชิงเทรา ช่วงต้นทศวรรษ 2490 แล้วรับรองเป็นพันธุ์แนะนำ'},
  {n:'ผสมข้ามพันธุ์', yr:[8,12], how:'ผสมพ่อแม่ที่มีลักษณะดีต่างกัน แล้วคัดลูกหลานหลายชั่วรุ่นจนลักษณะคงที่ ใช้เวลานานเพราะปลูกได้ปีละ 1–2 รุ่น', ex:'ข้าวพันธุ์ กข ส่วนใหญ่ของกรมการข้าว'},
  {n:'ลูกผสม F1', yr:[6,10], how:'ผสมสายพันธุ์แท้สองสาย ลูกรุ่นแรกแข็งแรงและให้ผลผลิตสูง (heterosis) แต่ถ้าเก็บเมล็ดไปปลูกต่อ ลักษณะจะกระจาย จึงต้องซื้อเมล็ดใหม่ทุกฤดู', ex:'ข้าวโพดเลี้ยงสัตว์และผักหลายชนิดที่ขายในไทย (หัวข้อ 5)'},
  {n:'กลายพันธุ์ด้วยรังสี', yr:[6,10], how:'ฉายรังสีแกมมาให้เมล็ดเกิดการกลายพันธุ์แบบสุ่ม แล้วคัดต้นที่มีลักษณะใหม่ที่ต้องการ', ex:'ข้าวเหนียว กข6 และข้าวหอม กข15 ได้จากการฉายรังสีข้าวขาวดอกมะลิ 105'},
  {n:'เครื่องหมายดีเอ็นเอ (MAS)', yr:[4,6], how:'ตรวจดีเอ็นเอของต้นกล้าตั้งแต่ยังเล็กว่ามียีนที่ต้องการหรือไม่ ไม่ต้องรอดูลักษณะตอนโตเต็มที่ จึงคัดได้เร็วและแม่นขึ้น', ex:'ข้าวหอมมะลิที่เพิ่มยีนทนน้ำท่วมโดยยังคงความหอม'},
  {n:'ปลูกเร่งรุ่น (speed breeding)', yr:[3,5], how:'ปลูกในห้องที่เปิดไฟ 20–22 ชั่วโมงต่อวัน ให้พืชออกดอกเร็ว ได้หลายรุ่นต่อปี ใช้ร่วมกับวิธีอื่น', ex:'ใช้ในโรงงานผลิตพืชหรือห้องควบคุม (หัวข้อ 4)'},
  {n:'ดัดแปลงพันธุกรรม (GMO)', yr:[10,15], how:'ใส่ยีนจากสิ่งมีชีวิตอื่นเข้าไปในพืช ใช้เวลาไม่นานในห้องแล็บ แต่การทดสอบความปลอดภัยและการขออนุญาตใช้เวลานาน', ex:'ไทยเคยพัฒนามะละกอต้านไวรัสใบด่างจุดวงแหวน แต่ยังไม่อนุญาตให้ปลูกเชิงพาณิชย์'},
  {n:'แก้ไขยีน (CRISPR)', yr:[3,6], how:'ตัดหรือแก้ยีนเดิมของพืชอย่างแม่นยำ โดยไม่ต้องใส่ยีนจากสิ่งมีชีวิตอื่น หลายประเทศแยกกฎหมายออกจาก GMO', ex:'งานวิจัยข้าวและพืชผักหลายชนิด ข้อกำหนดในไทยควรตรวจกับประกาศล่าสุดของกระทรวงเกษตรฯ'}
];
function breed(i){
  store.set('breed', i);
  [...$('brTabs').children].forEach((b,j) => b.setAttribute('aria-pressed', i === j));
  const b = BREED[i], max = 50;
  $('brBox').innerHTML = `<p><strong>${b.n}</strong> · ใช้เวลาราว ${b.yr[0]}–${b.yr[1]} ปี <span class="inf">อนุมาน</span></p>
    <div class="arow" style="grid-template-columns:4em 1fr 4em"><span>0 ปี</span><span class="b" style="height:12px"><i style="left:${b.yr[0]/max*100}%;width:${(b.yr[1]-b.yr[0])/max*100}%;background:var(--water)"></i></span><span>${max} ปี</span></div>
    <p>${b.how}</p><p><b>ตัวอย่าง:</b> ${b.ex}</p>`;
}
function initBreed(){
  $('brTabs').innerHTML = BREED.map(b => `<button>${b.n}</button>`).join('');
  [...$('brTabs').children].forEach((b,i) => b.addEventListener('click', () => breed(i)));
  breed(store.get('breed', 4));
}

/* ================= 13. growth durations ================= */
const STAGE_COL = {seed:'#b9a37a', veg:'var(--leaf)', flower:'#d9a3c7', fruit:'var(--warn)', harvest:'var(--soil)', wait:'var(--line)'};
const STAGE_N = {seed:'งอก/กล้า', veg:'เติบโตทางใบและต้น', flower:'ออกดอก/ผสมเกสร', fruit:'สร้างเมล็ด ผล หรือหัว', harvest:'ช่วงเก็บเกี่ยว', wait:'ยังไม่ให้ผล'};
const GROW = {
  d:{unit:'วัน', max:225, rows:[
    ['ผักบุ้งจีน',[['seed',0,7],['veg',7,25],['harvest',25,30]]],
    ['คะน้า',[['seed',0,10],['veg',10,45],['harvest',45,55]]],
    ['ผักกาดหอม (ดิน)',[['seed',0,20],['veg',20,55],['harvest',55,65]]],
    ['แตงกวา',[['seed',0,10],['veg',10,30],['flower',30,40],['harvest',40,70]]],
    ['ถั่วเขียว',[['seed',0,10],['veg',10,35],['flower',35,45],['fruit',45,60],['harvest',60,70]]],
    ['ข้าวโพดหวาน',[['seed',0,12],['veg',12,45],['flower',45,52],['fruit',52,70],['harvest',70,75]]],
    ['ข้าวไม่ไวแสง (เช่น กข41)',[['seed',0,25],['veg',25,60],['flower',60,85],['fruit',85,112],['harvest',112,120]]],
    ['ข้าวโพดเลี้ยงสัตว์',[['seed',0,15],['veg',15,55],['flower',55,65],['fruit',65,112],['harvest',112,120]]],
    ['มะเขือเทศ (นับจากเพาะ)',[['seed',0,25],['veg',25,50],['flower',50,70],['fruit',70,95],['harvest',95,150]]],
    ['พริก (นับจากเพาะ)',[['seed',0,30],['veg',30,60],['flower',60,90],['harvest',90,200]]]
  ]},
  m:{unit:'เดือน', max:14, rows:[
    ['มะละกอ',[['seed',0,1.5],['veg',1.5,5],['flower',5,6],['fruit',6,9],['harvest',9,14]]],
    ['มันสำปะหลัง',[['seed',0,1],['veg',1,3],['fruit',3,8],['harvest',8,12]]],
    ['กล้วยน้ำว้า',[['seed',0,1],['veg',1,7.5],['flower',7.5,8.5],['fruit',8.5,11],['harvest',11,12]]],
    ['อ้อย',[['seed',0,1.5],['veg',1.5,9],['fruit',9,11],['harvest',11,13]]]
  ]},
  y:{unit:'ปี', max:25, rows:[
    ['ชา (เก็บยอด)',[['wait',0,3],['harvest',3,25]]],
    ['กาแฟอะราบิกา',[['seed',0,1],['wait',1,3],['harvest',3,25]]],
    ['ปาล์มน้ำมัน',[['wait',0,3],['harvest',3,25]]],
    ['ลำไย (กิ่งตอน)',[['wait',0,3.5],['harvest',3.5,25]]],
    ['มะม่วง (กิ่งเสียบ)',[['wait',0,3.5],['harvest',3.5,25]]],
    ['ทุเรียน (กิ่งเสียบ)',[['wait',0,5],['harvest',5,25]]],
    ['ยางพารา (เปิดกรีด)',[['wait',0,7],['harvest',7,25]]],
    ['ไม้สัก (สวนป่า ตัดได้)',[['wait',0,18],['harvest',18,25]]]
  ]}
};
const FRUIT_NOTE = {'กาแฟอะราบิกา':'ดอกบานถึงผลสุก 7–9 เดือน','ทุเรียน (กิ่งเสียบ)':'ดอกบานถึงเก็บเกี่ยว ~4 เดือน (หมอนทอง)','ลำไย (กิ่งตอน)':'ดอกบานถึงเก็บ ~5–6 เดือน','มะม่วง (กิ่งเสียบ)':'ดอกบานถึงเก็บ ~3.5–4 เดือน','ยางพารา (เปิดกรีด)':'กรีดได้ราว 20–25 ปี','ปาล์มน้ำมัน':'ตัดทะลายทุก 2–3 สัปดาห์','ชา (เก็บยอด)':'เก็บยอดทุก 1–1.5 เดือน'};
function growth(k){
  store.set('gtab', k); setSeg('gTabs', k);
  const G = GROW[k], W = 720, lw = 190, rowH = 26, top = 18, H = top + G.rows.length*rowH + 10, X = v => lw + (W-lw-10)*v/G.max;
  const ticks = k === 'd' ? [0,30,60,90,120,150,180] : k === 'm' ? [0,2,4,6,8,10,12,14] : [0,5,10,15,20,25];
  let s = ticks.map(t => `<line x1="${X(t)}" x2="${X(t)}" y1="${top-4}" y2="${H-6}" stroke="var(--line)"/><text x="${X(t)}" y="11" text-anchor="middle" style="font:10px var(--mono);fill:var(--muted)">${t}</text>`).join('');
  G.rows.forEach(([n, segs], i) => {
    const y = top + i*rowH;
    s += `<text x="${lw-8}" y="${y+15}" text-anchor="end" style="font:12px var(--body);fill:var(--fg)">${n}</text>`;
    segs.forEach(([st,a,b]) => s += `<rect x="${X(a)}" y="${y+4}" width="${Math.max(1, X(b)-X(a)-1)}" height="15" rx="2" fill="${STAGE_COL[st]}"><title>${n} · ${STAGE_N[st]} ${a}–${b} ${G.unit}</title></rect>`);
    const end = segs[segs.length-1];
    if (k !== 'y') s += `<text x="${X(end[2])+4}" y="${y+15}" style="font:10.5px var(--mono);fill:var(--muted)">${segs.find(z => z[0]==='harvest')?.[1] ?? ''}–${end[2]}</text>`;
    else if (FRUIT_NOTE[n]) s += `<text x="${X(end[1])+6}" y="${y+15}" style="font:10.5px var(--body);fill:var(--surface)">${FRUIT_NOTE[n]}</text>`;
  });
  $('gChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="ระยะการเติบโตของพืช หน่วย${G.unit}">${s}</svg><p class="mini" style="margin:6px 0 0">หน่วย: ${G.unit}${k==='y' ? ' · นับจากปลูกต้นกล้าหรือกิ่งพันธุ์ในแปลง ช่วงเก็บเกี่ยวยาวต่อไปอีกหลายปี' : ' · ตัวเลขท้ายแถบคือช่วงเก็บเกี่ยว'}</p>`;
  const used = new Set(G.rows.flatMap(r => r[1].map(z => z[0])));
  $('gLeg').innerHTML = Object.keys(STAGE_N).filter(z => used.has(z)).map(z => `<span><i style="background:${STAGE_COL[z]}"></i>${STAGE_N[z]}</span>`).join('');
}
// photoperiod: day 0 = 1 June
const MON = ['มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.','ม.ค.'], MSTART = [0,30,61,92,122,153,183,214];
const dstr = d => { let i = 0; while (i < MSTART.length-1 && d >= MSTART[i+1]) i++; return `${d - MSTART[i] + 1} ${MON[i]}` };
function photo(){
  const p = +$('cPlant').value, FLOWER = 143; // ~22 Oct
  const ps = {flower: Math.max(FLOWER, p + 45), harvest: Math.max(FLOWER, p + 45) + 30}, ns = {flower: p + 85, harvest: p + 115};
  $('vPlant').textContent = dstr(p);
  const W = 640, l = 150, X = d => l + (W-l-10)*d/240;
  const bar = (y, n, f, h, c) => `<text x="${l-8}" y="${y+13}" text-anchor="end" style="font:12px var(--body);fill:var(--fg)">${n}</text>
    <rect x="${X(p)}" y="${y}" width="${X(f)-X(p)}" height="18" rx="2" fill="var(--leaf)"/><rect x="${X(f)}" y="${y}" width="${X(h)-X(f)}" height="18" rx="2" fill="${c}"/>
    <text x="${X(h)+4}" y="${y+13}" style="font:10.5px var(--mono);fill:var(--muted)">${h-p} วัน</text>`;
  $('photo').innerHTML = MSTART.map((m,i) => `<line x1="${X(m)}" x2="${X(m)}" y1="16" y2="125" stroke="var(--line)"/><text x="${X(m)+2}" y="12" style="font:10px var(--body);fill:var(--muted)">${MON[i]}</text>`).join('')
    + `<line x1="${X(FLOWER)}" x2="${X(FLOWER)}" y1="16" y2="125" stroke="var(--warn)" stroke-dasharray="3 3"/><text x="${X(FLOWER)+3}" y="140" style="font:10px var(--body);fill:var(--warn)">กลางวันสั้นพอ ข้าวไวแสงออกดอก</text>`
    + bar(30, 'หอมมะลิ 105 (ไวแสง)', ps.flower, ps.harvest, 'var(--warn)') + bar(78, 'ข้าวไม่ไวแสง', ns.flower, ns.harvest, 'var(--soil)')
    + `<text x="${l}" y="162" style="font:10px var(--body);fill:var(--muted)">เขียว = ต้นกล้าถึงก่อนออกดอก · ส้ม/น้ำตาล = ออกดอกถึงเก็บเกี่ยว</text>`;
  const veg = ps.flower - p;
  $('photoTxt').textContent = `ตกกล้า ${dstr(p)}: หอมมะลิ 105 จะออกดอกราว ${dstr(ps.flower)} และเก็บเกี่ยวราว ${dstr(ps.harvest)} รวม ${ps.harvest - p} วัน ส่วนข้าวไม่ไวแสงเก็บเกี่ยวราว ${dstr(ns.harvest)} ` +
    (veg < 70 ? 'ถ้าปลูกช้ามาก ข้าวไวแสงมีเวลาสร้างต้นและแตกกอสั้น ผลผลิตจะลดลง' : veg > 120 ? 'ถ้าปลูกเร็วมาก ต้นข้าวไวแสงจะสูงและแตกกอนาน เสี่ยงล้ม แต่ก็ยังรอออกดอกปลายตุลาคมเหมือนเดิม' : 'ช่วงนี้เป็นช่วงปลูกปกติของนาปีภาคอีสานและภาคเหนือ');
}
function initGrowth(){
  seg('gTabs', growth); growth(store.get('gtab', 'd'));
  $('cPlant').addEventListener('input', photo); photo();
}

initLab(); initPest(); initEra(); initBreed(); initGrowth();
const rerender = () => { lab(); pest(); wheel(); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rerender);
})();
