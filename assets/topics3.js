/* Simulations for soil-page topics 8 (nutrient balance, fertilizer machines, root uptake, standards) and 9 (helpers vs customers in the field).
   Needs topics.js (window.SIMK). Relative teaching models, not field data. */
(function(){
const K = window.SIMK; if (!K) return;
const {L, css, clamp, fmt, INF, UNV, head, seg, rng, chk, out, setOut, Sim, player, rand, mixHex, lineChart} = K;

/* ================= 8. nutrients ================= */
const NUTS = [
  {k:'N', n:['ไนโตรเจน','Nitrogen'], mob:1, ph:[[4.5,.6],[5.5,.9],[6,1],[8,1],[8.5,.8]],
    lo:['ใบแก่เหลืองซีดทั้งใบก่อน ต้นแคระ','Older leaves turn pale yellow all over first; stunted'], hi:['ใบเขียวเข้ม อวบ ล้มง่าย แมลงปากดูดชอบ ผักใบสะสมไนเตรต','Dark, soft, lush leaves; lodging; attracts sap-suckers; nitrate builds up in leafy greens']},
  {k:'P', n:['ฟอสฟอรัส','Phosphorus'], mob:1, ph:[[4.5,.35],[5.5,.7],[6.2,1],[7,1],[7.5,.7],[8.5,.4]],
    lo:['ใบแก่สีม่วงอมแดง รากน้อย ออกดอกช้า','Purple-red older leaves, few roots, late flowering'], hi:['ไปขัดการดูดสังกะสีและเหล็ก','Blocks zinc and iron uptake']},
  {k:'K', n:['โพแทสเซียม','Potassium'], mob:1, ph:[[4.5,.6],[5.5,.9],[6,1],[8.5,1]],
    lo:['ขอบใบแก่ไหม้เป็นสีน้ำตาล ผลไม่หวาน ลำต้นอ่อน','Older leaf edges scorch brown, fruit not sweet, weak stems'], hi:['ไปขัดการดูดแมกนีเซียมและแคลเซียม','Blocks magnesium and calcium uptake']},
  {k:'Ca', n:['แคลเซียม','Calcium'], mob:0, ph:[[4.5,.35],[5.5,.65],[6.5,.95],[7,1],[8.5,1]],
    lo:['ยอดอ่อนไหม้ ผักกาดปลายใบไหม้ มะเขือเทศก้นผลเน่า','Young tips burn: lettuce tipburn, tomato blossom-end rot'], hi:['ไปขัดแมกนีเซียมและโพแทสเซียม ดินด่าง','Blocks magnesium and potassium; alkaline soil']},
  {k:'Mg', n:['แมกนีเซียม','Magnesium'], mob:1, ph:[[4.5,.35],[5.5,.65],[6.5,.95],[7,1],[8.5,1]],
    lo:['ใบแก่เหลืองระหว่างเส้นใบ เส้นใบยังเขียว','Yellowing between veins on older leaves, veins stay green'], hi:['ไปขัดแคลเซียมและโพแทสเซียม','Blocks calcium and potassium']},
  {k:'S', n:['กำมะถัน','Sulfur'], mob:0, ph:[[4.5,.8],[6,1],[8.5,1]],
    lo:['ใบอ่อนเหลืองซีดทั้งใบ','Young leaves pale yellow all over'], hi:['ดินเป็นกรดขึ้น','Acidifies soil']},
  {k:'Fe', n:['เหล็ก','Iron'], mob:0, ph:[[4.5,1],[6,1],[6.5,.8],[7,.55],[7.5,.35],[8.5,.15]],
    lo:['ใบอ่อนเหลืองระหว่างเส้นใบ ในดินด่างหรือปูนมาก','Young leaves yellow between veins, common in alkaline or limed soil'], hi:['ในนาขังน้ำดินกรด เหล็กเป็นพิษ ใบมีจุดสีน้ำตาลส้ม','In flooded acid paddies iron becomes toxic: orange-brown leaf spots']},
  {k:'Zn', n:['สังกะสี','Zinc'], mob:0, ph:[[4.5,1],[6,1],[6.5,.8],[7.5,.45],[8.5,.25]],
    lo:['ใบเล็ก ปล้องสั้นเป็นกระจุก ข้าวโพดใบขาวเป็นแถบ','Small leaves, short internodes in rosettes; white bands on maize leaves'], hi:['เป็นพิษต่อราก','Toxic to roots']},
  {k:'B', n:['โบรอน','Boron'], mob:0, ph:[[4.5,.8],[6,1],[7,1],[7.5,.7],[8.5,.45]],
    lo:['ยอดตาย ดอกร่วง ผลแตก ติดผลน้อย','Dead growing tips, flowers drop, fruit cracks, poor fruit set'], hi:['ช่วงพอดีแคบมาก เกินนิดเดียวใบไหม้','Very narrow safe range: a little too much burns leaves']}
];
const ANTAG = [ // [source, target, strength, th, en]
  ['K','Mg',.4,'โพแทสเซียมมากไปแย่งที่ตัวรับกับแมกนีเซียม','Too much K competes with Mg at uptake sites'],
  ['K','Ca',.2,'โพแทสเซียมมากไปลดการดูดแคลเซียม','Too much K lowers Ca uptake'],
  ['N','Ca',.2,'ไนโตรเจนรูปแอมโมเนียมมากไปลดการดูดแคลเซียมและโพแทสเซียม','Excess ammonium-N lowers Ca and K uptake'],
  ['N','K',.15,'',''],
  ['P','Zn',.45,'ฟอสฟอรัสมากไปจับสังกะสีและเหล็กเป็นสารที่พืชดูดไม่ได้','Excess P ties up Zn and Fe in forms roots cannot take'],
  ['P','Fe',.25,'',''],
  ['Ca','Mg',.25,'แคลเซียมมากไป (ใส่ปูนมาก) ลดแมกนีเซียมและโพแทสเซียม','Too much Ca (heavy liming) lowers Mg and K'],
  ['Ca','K',.15,'',''],
  ['Mg','Ca',.2,'แมกนีเซียมมากไปลดแคลเซียม','Too much Mg lowers Ca']
];
const lerp = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]){ const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0) } return pts[pts.length - 1][1] };

function nutModel(st){
  const sup = {}; NUTS.forEach(n => sup[n.k] = st['s' + n.k] / 100);
  if (st.crop === 'legume' && sup.P >= .7) sup.N = Math.max(sup.N, .95);   // rhizobia fix N when P is adequate
  const U = {}, why = {};
  NUTS.forEach(n => { U[n.k] = sup[n.k] * lerp(n.ph, st.ph); why[n.k] = [] });
  const acts = [];
  ANTAG.forEach(([s, t, str, th, en]) => {
    const ex = clamp((sup[s] - 1.2) / .8, 0, 1);
    if (ex > 0){ U[t] *= 1 - str * ex; why[t].push(s); if (th) acts.push(L(th, en)) }
  });
  const tr = st.air === 'humid' ? {Ca:.6, B:.65} : st.air === 'dry' ? {all:.75, Ca:.55, B:.55} : {};
  NUTS.forEach(n => { if (tr.all) U[n.k] *= tr.all; if (tr[n.k]) U[n.k] *= tr[n.k] });
  if (st.crop === 'rice' && st.ph < 5.5) U.Fe *= 1.6;   // flooded acid paddy releases Fe2+
  const lim = NUTS.reduce((a, n) => U[n.k] < U[a.k] ? n : a, NUTS[0]);
  const over = NUTS.filter(n => U[n.k] > 1.5);
  const tox = over.reduce((p, n) => p * (1 - clamp((U[n.k] - 1.5) * .5, 0, .5)), 1);
  const grow = clamp(Math.min(1, U[lim.k]) * tox, 0, 1);
  return {U, sup, lim, over, grow, acts, why};
}
function barrel(U, lim){
  const W = 320, H = 210, n = NUTS.length, sw = 26, x0 = 160 - n * sw / 2, base = 190, top = 30;
  const hh = v => clamp(v / 1.6, 0, 1) * (base - top);
  const level = clamp(Math.min(1, U[lim.k]) / 1.6, 0, 1) * (base - top);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('ถังไม้ของลีบิก','Liebig\'s barrel')}">`;
  s += `<line x1="${x0 - 6}" x2="${x0 + n * sw + 6}" y1="${base - hh(1)}" y2="${base - hh(1)}" style="stroke:var(--muted);stroke-dasharray:4 3"/><text x="${x0 + n * sw + 8}" y="${base - hh(1) + 4}" style="font:10px var(--mono);fill:var(--muted)">100%</text>`;
  NUTS.forEach((nt, i) => {
    const h = hh(U[nt.k]), isL = nt.k === lim.k, hi = U[nt.k] > 1.5;
    s += `<rect x="${x0 + i * sw + 1}" y="${base - h}" width="${sw - 2}" height="${h}" rx="2" style="fill:${isL ? css('--warn') : hi ? css('--soil') : '#b5895a'};stroke:#5a3b24;stroke-width:1"/>`;
    s += `<text x="${x0 + i * sw + sw / 2}" y="${base + 14}" text-anchor="middle" style="font:600 11px var(--mono);fill:${isL ? css('--warn') : css('--fg')}">${nt.k}</text>`;
  });
  s += `<rect x="${x0}" y="${base - level}" width="${n * sw}" height="${level}" style="fill:var(--water);opacity:.45"/>`;
  s += `<text x="160" y="16" text-anchor="middle" style="font:12px var(--body);fill:var(--fg)">${L('น้ำในถัง = การเติบโต ถูกจำกัดด้วยไม้ที่สั้นที่สุด','Water level = growth, set by the shortest stave')}</text>`;
  return s + '</svg>';
}
function plant8(m, crop){
  // older leaves low, younger leaves high; mobile-nutrient symptoms on old leaves, immobile on young
  const W = 200, H = 230, low = m.lim, U = m.U[low.k], def = U < .85, sev = clamp((.85 - U) / .6, 0, 1);
  const over = m.U.N > 1.4;
  const green = over ? '#2c6b2a' : '#4f9a3c';
  const sym = {N:'#d8d27a', P:'#8e4a8e', K:'#4f9a3c', Mg:'#4f9a3c', Ca:'#4f9a3c', S:'#cfd48a', Fe:'#4f9a3c', Zn:'#4f9a3c', B:'#4f9a3c'};
  const leafCol = (old) => { if (!def) return green; const hit = (low.mob === 1) === old; return hit ? mixHex('#4f9a3c', sym[low.k] === '#4f9a3c' ? '#4f9a3c' : sym[low.k], sev) : green };
  const ht = 60 + 120 * m.grow;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('ภาพพืชแสดงอาการ','Plant showing symptoms')}"><rect x="0" y="200" width="${W}" height="30" fill="#8a5a33"/>`;
  s += `<path d="M100 200 C100 ${200 - ht * .5} ${100 + (over ? 18 : 0)} ${200 - ht * .8} ${100 + (over ? 30 : 0)} ${200 - ht}" style="stroke:${green};stroke-width:4;fill:none"/>`;
  const nL = 6;
  for (let i = 0; i < nL; i++){
    const t = (i + 1) / (nL + 1), y = 200 - ht * t, side = i % 2 ? 1 : -1, old = i < 3, sz = (old ? 26 : 20) * (.6 + .4 * m.grow) * (low.k === 'Zn' && def && !old ? .55 : 1);
    const col = leafCol(old), cx = 100 + side * sz * .9 + (over ? 30 * t : 0);
    s += `<ellipse cx="${cx}" cy="${y}" rx="${sz}" ry="${sz * .38}" transform="rotate(${side * -20} ${cx} ${y})" style="fill:${col};stroke:#2d5a27;stroke-width:1"/>`;
    // interveinal pattern: veins stay green
    if (def && ((low.k === 'Mg' && old) || ((low.k === 'Fe' || low.k === 'Zn') && !old))) s += `<ellipse cx="${cx}" cy="${y}" rx="${sz * .85}" ry="${sz * .25}" transform="rotate(${side * -20} ${cx} ${y})" style="fill:#e6d84a;opacity:${.25 + .6 * sev}"/><line x1="${cx - sz}" y1="${y + side * sz * .35}" x2="${cx + sz}" y2="${y - side * sz * .35}" style="stroke:#2d6b27;stroke-width:1.4"/>`;
    // marginal scorch for K on old leaves
    if (def && low.k === 'K' && old) s += `<ellipse cx="${cx}" cy="${y}" rx="${sz}" ry="${sz * .38}" transform="rotate(${side * -20} ${cx} ${y})" style="fill:none;stroke:#8b4513;stroke-width:${2 + 4 * sev}"/>`;
    // tip burn for Ca / B on young leaves
    if (def && (low.k === 'Ca' || low.k === 'B') && !old) s += `<circle cx="${cx + side * sz * .85}" cy="${y - side * sz * .3}" r="${3 + 4 * sev}" fill="#6b3a1a"/>`;
  }
  if (crop === 'tomato') s += `<circle cx="${100 + (over ? 20 : 0) - 22}" cy="${200 - ht * .45}" r="10" fill="#d0342c"/>` + (def && low.k === 'Ca' ? `<circle cx="${100 + (over ? 20 : 0) - 22}" cy="${200 - ht * .45 + 7}" r="5" fill="#3a2414"/>` : '');
  if (crop === 'legume') for (let i = 0; i < 5; i++) s += `<circle cx="${80 + i * 10}" cy="${210 + (i % 2) * 6}" r="3.5" style="fill:${m.sup.P >= .7 ? '#e07a8a' : '#c9b8a8'}"/>`;
  if (def && low.k === 'B') s += `<path d="M${100 + (over ? 30 : 0) - 6} ${200 - ht - 4} l12 8 M${100 + (over ? 30 : 0) + 6} ${200 - ht - 4} l-12 8" style="stroke:#6b3a1a;stroke-width:2.5"/>`;
  return s + `<text x="100" y="224" text-anchor="middle" style="font:10.5px var(--body);fill:#fff">${L('ใบล่าง = ใบแก่ · ใบบน = ใบอ่อน','lower = old leaves · upper = young')}</text></svg>`;
}

const PROC = {
  N: {n:['ไนโตรเจน: ฮาเบอร์-บอช และยูเรีย','Nitrogen: Haber-Bosch and urea'], out:'46-0-0',
    u:[['อากาศ → แยกไนโตรเจน','Air → separate N₂','N₂ 78% ของอากาศ แยกด้วยการกลั่นอากาศเหลวหรือป้อนอากาศเข้าเตาโดยตรง','N₂ is 78% of air; separated by cryogenic distillation or fed with air into the reformer'],
       ['เตาปฏิรูปไอน้ำ','Steam reformer','CH₄ + H₂O → CO + 3H₂ ที่ ~700–1,000 °C ตัวเร่งนิกเกิล ใช้ก๊าซธรรมชาติทั้งเป็นวัตถุดิบและเชื้อเพลิง','CH₄ + H₂O → CO + 3H₂ at ~700–1,000 °C on a nickel catalyst; natural gas is both feed and fuel'],
       ['เปลี่ยน CO และแยก CO₂','Shift and CO₂ removal','CO + H₂O → CO₂ + H₂ แล้วดักเก็บ CO₂ ไว้ใช้ทำยูเรีย','CO + H₂O → CO₂ + H₂; the CO₂ is captured for urea'],
       ['เครื่องอัดก๊าซ','Compressor','อัดก๊าซ N₂ + 3H₂ ถึง ~150–300 บาร์ ใช้พลังงานมาก','Compresses N₂ + 3H₂ to ~150–300 bar; energy-hungry'],
       ['หอปฏิกิริยาฮาเบอร์-บอช','Haber-Bosch converter','N₂ + 3H₂ ⇌ 2NH₃ ที่ ~400–500 °C ตัวเร่งเหล็ก ผ่านแต่ละรอบได้แอมโมเนียราว 15–20% ก๊าซที่เหลือวนกลับ','N₂ + 3H₂ ⇌ 2NH₃ at ~400–500 °C on an iron catalyst; ~15–20% converts per pass, the rest is recycled'],
       ['ควบแน่นแอมโมเนีย','Ammonia condenser','ทำให้เย็นจน NH₃ กลายเป็นของเหลว แยกออกมา','Cooled until NH₃ liquefies and is drawn off'],
       ['หอสังเคราะห์ยูเรีย','Urea reactor','2NH₃ + CO₂ → NH₂COONH₄ → CO(NH₂)₂ + H₂O ที่ ~180–190 °C ~140–175 บาร์','2NH₃ + CO₂ → NH₂COONH₄ → CO(NH₂)₂ + H₂O at ~180–190 °C, ~140–175 bar'],
       ['หอพ่นเม็ด / เครื่องปั้นเม็ด','Prilling tower / granulator','ยูเรียหลอมเหลวหยดจากยอดหอให้แข็งตัวเป็นเม็ดกลม หรือพ่นเคลือบในถังหมุนให้เม็ดโตขึ้น','Molten urea drips down a tower and freezes into prills, or is sprayed onto growing granules in a drum']],
    eq:'N₂ + 3H₂ ⇌ 2NH₃ · 2NH₃ + CO₂ → CO(NH₂)₂ + H₂O'},
  P: {n:['ฟอสฟอรัส: กรดฟอสฟอริกแบบเปียก','Phosphorus: wet-process phosphoric acid'], out:'18-46-0 (DAP)',
    u:[['เหมืองหินฟอสเฟต','Phosphate rock mine','ขุดหินฟอสเฟต (อะพาไทต์) ส่วนใหญ่เป็นเหมืองเปิด','Phosphate rock (apatite) is mined, mostly open-pit'],
       ['บดละเอียด','Ball mill','บดให้ละเอียดเพื่อให้ทำปฏิกิริยากับกรดได้เร็ว','Ground fine so acid can react fast'],
       ['เผากำมะถันทำกรด','Sulfur burner → acid plant','S + O₂ → SO₂ → SO₃ → H₂SO₄ ความร้อนที่ได้ใช้ผลิตไอน้ำและไฟฟ้า','S + O₂ → SO₂ → SO₃ → H₂SO₄; the heat makes steam and power'],
       ['ถังย่อยด้วยกรด','Acid digester','Ca₅(PO₄)₃F + 5H₂SO₄ + 10H₂O → 3H₃PO₄ + 5CaSO₄·2H₂O + HF','Ca₅(PO₄)₃F + 5H₂SO₄ + 10H₂O → 3H₃PO₄ + 5CaSO₄·2H₂O + HF'],
       ['กรองแยกยิปซัม','Filter','แยกฟอสโฟยิปซัม (ผลพลอยได้ปริมาณมาก ต้องจัดการกองเก็บ) ได้กรดฟอสฟอริก','Removes phosphogypsum (a large by-product that must be stacked safely), leaving phosphoric acid'],
       ['ทำให้เข้มข้น','Evaporator','ระเหยน้ำออกให้กรดเข้มข้นขึ้น','Water evaporated to concentrate the acid'],
       ['ผสมแอมโมเนีย','Ammoniation','H₃PO₄ + NH₃ → MAP (11-52-0) หรือ + 2NH₃ → DAP (18-46-0)','H₃PO₄ + NH₃ → MAP (11-52-0), or + 2NH₃ → DAP (18-46-0)'],
       ['ปั้นเม็ด อบแห้ง','Granulate and dry','ปั้นเม็ดในถังหมุน อบแห้ง คัดขนาด','Granulated in a drum, dried and screened']],
    eq:'Ca₅(PO₄)₃F + 5H₂SO₄ → 3H₃PO₄ + 5CaSO₄ + HF'},
  K: {n:['โพแทสเซียม: แร่โพแทช','Potassium: potash ore'], out:'0-0-60 (MOP)',
    u:[['เหมืองใต้ดิน / ละลายแร่','Underground or solution mine','แร่ซิลไวไนต์ (KCl + NaCl) ลึกหลายร้อยเมตร ขุดหรือฉีดน้ำร้อนละลายแร่ขึ้นมา','Sylvinite (KCl + NaCl) hundreds of meters down, mined or dissolved with hot water and pumped up'],
       ['บดและคัด','Crush and screen','บดให้ผลึก KCl หลุดจาก NaCl','Crushed to free KCl crystals from NaCl'],
       ['ลอยแร่','Flotation','ใส่สารที่จับผิว KCl แล้วเป่าฟอง KCl ลอยขึ้น NaCl จมลง','A reagent coats KCl, air bubbles lift KCl up, NaCl sinks'],
       ['ตกผลึกด้วยความร้อน','Hot-leach crystallizer','อีกวิธี: ละลายในน้ำร้อนแล้วทำให้เย็น KCl ละลายน้อยลงเมื่อเย็นจึงตกผลึกออกมาก่อน','Alternative: dissolve hot, then cool; KCl solubility falls more than NaCl\'s, so KCl crystallizes'],
       ['อบแห้ง อัดเม็ด','Dry and compact','อบแห้ง อัดเป็นแผ่นแล้วบดเป็นเม็ดหยาบ','Dried, pressed into sheets and crushed to granules'],
       ['กากเกลือ','Salt tailings','NaCl ที่เหลือกองเก็บหรือคืนลงเหมือง ต้องกันการรั่วไหลลงน้ำ','Leftover NaCl is stacked or returned underground and must be kept out of water']],
    eq:'KCl·NaCl (sylvinite) → KCl (60% K₂O) + NaCl'},
  G: {n:['ปุ๋ยเม็ดผสม NPK','Granular compound NPK'], out:'15-15-15',
    u:[['ชั่งแม่ปุ๋ย','Weigh raw materials','ยูเรีย DAP โพแทช ฟิลเลอร์ ตามสูตร','Urea, DAP, potash and filler to the recipe'],
       ['ผสม','Mixer / pipe reactor','ผสมแห้ง หรือทำปฏิกิริยากรดกับแอมโมเนียในท่อ','Dry mixing, or acid–ammonia reaction in a pipe reactor'],
       ['ถังหมุนปั้นเม็ด','Rotary drum granulator','พ่นไอน้ำหรือน้ำสเลอรีให้ผงเกาะกันเป็นเม็ด','Steam or slurry makes the powder stick into granules'],
       ['อบแห้ง','Dryer','อบลมร้อนให้ความชื้นต่ำ เก็บได้ไม่จับก้อน','Hot air to low moisture so it stores without caking'],
       ['ตะแกรงคัดขนาด','Screens','เม็ด 2–4 มม. ไปต่อ เม็ดเล็กหรือใหญ่เกินบดแล้ววนกลับ','2–4 mm goes on; under- and oversize are crushed and recycled'],
       ['ทำให้เย็น เคลือบ','Cool and coat','เคลือบน้ำมันหรือผงกันจับตัว แล้วบรรจุกระสอบ','Coated with oil or powder against caking, then bagged']],
    eq:L('ทางเลือกราคาถูก: ปุ๋ยผสมคลุก (bulk blend) คือเอาเม็ดแม่ปุ๋ยขนาดใกล้กันมาคลุกรวม ถ้าขนาดต่างกันมากจะแยกชั้นในกระสอบ','Cheaper option: bulk blending, mixing straight granules of similar size; if sizes differ they segregate in the bag')},
  W: {n:['ปุ๋ยน้ำ / ไฮโดรโปนิกส์','Liquid / hydroponic'], out:'A + B',
    u:[['ถังละลายเกลือบริสุทธิ์','Dissolving tank','ใช้เกลือเกรดละลายน้ำ เช่น แคลเซียมไนเตรต โพแทสเซียมไนเตรต MKP ต้องละลายหมด ไม่มีตะกอน','Water-soluble grade salts, e.g. calcium nitrate, potassium nitrate, MKP; must dissolve fully'],
       ['ทำคีเลต','Chelation','จับเหล็กและจุลธาตุด้วยสารคีเลต (EDTA, DTPA, EDDHA) ให้ละลายอยู่ได้ที่ pH สูง EDDHA ทนด่างได้ดีที่สุด','Fe and micronutrients bound to chelates (EDTA, DTPA, EDDHA) so they stay dissolved; EDDHA holds up best at high pH'],
       ['ถัง A','Stock tank A','แคลเซียมไนเตรต + เหล็กคีเลต','Calcium nitrate + iron chelate'],
       ['ถัง B','Stock tank B','MKP, MgSO₄, K₂SO₄, จุลธาตุ แยกจาก A เพราะ Ca + SO₄ → ยิปซัม และ Ca + PO₄ → แคลเซียมฟอสเฟต ตกตะกอน','MKP, MgSO₄, K₂SO₄, micronutrients. Kept apart from A because Ca + SO₄ → gypsum and Ca + PO₄ → calcium phosphate precipitate'],
       ['ปั๊มผสมตามค่า EC/pH','EC/pH dosing pumps','เซนเซอร์วัดค่าการนำไฟฟ้าและ pH แล้วปล่อย A และ B ในสัดส่วนเท่ากัน ปรับกรดด่าง','Sensors read conductivity and pH, dose A and B equally and adjust acidity'],
       ['ระบบน้ำหยด / NFT','Drip / NFT','ส่งถึงรากทีละน้อยตลอดวัน','Delivered to roots little and often']],
    eq:'Ca²⁺ + SO₄²⁻ → CaSO₄↓ · 3Ca²⁺ + 2PO₄³⁻ → Ca₃(PO₄)₂↓'}
};
function procSVG(p, sel){
  const n = p.u.length, cols = 4, W = 640, bw = 140, bh = 46, gx = (W - cols * bw) / (cols - 1), rows = Math.ceil(n / cols), H = rows * 86 + 10;
  const pos = i => { const r = Math.floor(i / cols), c = r % 2 ? cols - 1 - i % cols : i % cols; return [c * (bw + gx), 10 + r * 86] };
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('แผนผังกระบวนการผลิต','Process flow diagram')}">`;
  let d = '';
  for (let i = 0; i < n; i++){ const [x, y] = pos(i); d += (i ? 'L' : 'M') + (x + bw / 2) + ' ' + (y + bh / 2) }
  s += `<path d="${d}" style="fill:none;stroke:var(--line);stroke-width:8;stroke-linejoin:round"/><path d="${d}" class="flowanim" style="fill:none;stroke:var(--water);stroke-width:4;stroke-linejoin:round"/>`;
  p.u.forEach(([th, en], i) => {
    const [x, y] = pos(i), on = i === sel;
    s += `<g class="unit" data-u="${i}" tabindex="0" role="button" aria-pressed="${on}"><rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" style="fill:${on ? 'var(--water)' : 'var(--surface)'};stroke:var(--water);stroke-width:${on ? 2 : 1.2}"/>`;
    s += `<foreignObject x="${x + 4}" y="${y + 2}" width="${bw - 8}" height="${bh - 4}"><div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font:600 11.5px/1.25 var(--body);color:${on ? 'var(--surface)' : 'var(--fg)'}">${i + 1}. ${L(th, en)}</div></foreignObject></g>`;
  });
  const [lx, ly] = pos(n - 1);
  s += `<text x="${lx + bw / 2}" y="${ly + bh + 18}" text-anchor="middle" style="font:600 12px var(--mono);fill:var(--leaf)">→ ${p.out}</text>`;
  return s + '</svg>';
}
const PLANTS8 = {
  rice: {n:['ข้าว (หญ้า ใบเลี้ยงเดี่ยว)','Rice (grass, monocot)'], pts:[
    ['มีช่องอากาศในราก (aerenchyma) ส่งออกซิเจนลงรากในดินขังน้ำ ผิวรากจึงมีคราบเหล็กสีส้ม','Air channels (aerenchyma) carry oxygen down to roots in flooded soil, so roots get an orange iron coating'],
    ['ในนาขังน้ำไนโตรเจนอยู่ในรูปแอมโมเนียม ข้าวดูดแอมโมเนียมได้ดีกว่าพืชไร่หลายชนิด','In flooded paddies N is ammonium, which rice takes up better than many upland crops'],
    ['ดูดซิลิคอนมากผ่านตัวขนส่ง Lsi1/Lsi2 ทำให้ลำต้นแข็ง ทนแมลงและโรคไหม้','Takes up lots of silicon via Lsi1/Lsi2 transporters, giving stiff stems and resistance to insects and blast'],
    ['ดูดเหล็กแบบหญ้า (Strategy II): ปล่อยสารไฟโทไซเดอโรฟอร์จับ Fe³⁺ แล้วดูดทั้งก้อน','Grass-type iron uptake (Strategy II): releases phytosiderophores that grab Fe³⁺, then takes up the whole complex']], root:'rice'},
  tomato: {n:['มะเขือเทศ (ใบเลี้ยงคู่)','Tomato (dicot)'], pts:[
    ['ดูดเหล็กแบบใบเลี้ยงคู่ (Strategy I): ปั๊ม H⁺ ทำให้ดินรอบรากเป็นกรด เปลี่ยน Fe³⁺ เป็น Fe²⁺ แล้วดูดผ่านตัวขนส่ง IRT1','Dicot iron uptake (Strategy I): pumps out H⁺ to acidify the root zone, reduces Fe³⁺ to Fe²⁺, then takes it up via IRT1'],
    ['แคลเซียมขึ้นไปกับกระแสน้ำที่คายออกทางใบเท่านั้น ผลคายน้ำน้อยจึงขาดแคลเซียมได้แม้ดินมีพอ (ก้นผลเน่า)','Calcium only travels with the transpiration stream; fruit transpire little, so they lack Ca even when soil has plenty (blossom-end rot)'],
    ['ชอบไนเตรตมากกว่าแอมโมเนียม แอมโมเนียมมากไปทำให้ขาดแคลเซียม','Prefers nitrate to ammonium; too much ammonium causes Ca deficiency']], root:'dicot'},
  legume: {n:['ถั่ว (ตรึงไนโตรเจน)','Legume (nitrogen-fixing)'], pts:[
    ['แบคทีเรียไรโซเบียมในปมรากตรึง N₂ จากอากาศด้วยเอนไซม์ไนโตรจีเนส ปมที่ทำงานมีสีชมพูจากเลกฮีโมโกลบิน','Rhizobia in root nodules fix N₂ with nitrogenase; working nodules are pink from leghemoglobin'],
    ['ต้องใช้โมลิบดีนัม เหล็ก และฟอสฟอรัสมากเพื่อทำงานนี้ และพืชต้องส่งน้ำตาลให้แบคทีเรีย','Needs molybdenum, iron and plenty of phosphorus for this, and the plant pays the bacteria in sugar'],
    ['ถ้าใส่ไนโตรเจนมาก พืชจะสร้างปมน้อยลง','High nitrogen fertilizer makes the plant form fewer nodules']], root:'legume'},
  tree: {n:['กาแฟ ไม้ผล (ไมคอร์ไรซา)','Coffee, fruit trees (mycorrhizal)'], pts:[
    ['ราไมคอร์ไรซาแบบอาร์บัสคูลาร์ยื่นเส้นใยออกไปไกลกว่ารากหลายเท่า ดูดฟอสฟอรัสและสังกะสีมาแลกกับน้ำตาลจากพืช','Arbuscular mycorrhizal fungi reach far beyond the roots, trading phosphorus and zinc for plant sugars'],
    ['รากฝอยดูดอาหารอยู่ตื้นใต้วัสดุคลุมดิน รากลึกหาน้ำ จึงควรใส่ปุ๋ยใต้ทรงพุ่มไม่ใช่ชิดโคน','Feeder roots are shallow under the mulch, deep roots find water, so fertilize under the canopy edge, not at the trunk'],
    ['ดูดธาตุตามจังหวะแตกใบ ออกดอก ติดผล (ดูตารางไม้ผลด้านบน)','Uptake follows leaf flush, flowering and fruit fill (see the fruit tree row above)']], root:'myco'},
  hydro: {n:['ผักกาดหอมไฮโดรโปนิกส์','Hydroponic lettuce'], pts:[
    ['รากแช่ในสารละลาย ธาตุอาหารมาถึงรากด้วยการไหลของน้ำเป็นหลัก ไม่ต้องรอการแพร่ในดิน','Roots sit in solution; nutrients mostly arrive with water flow, no slow diffusion through soil'],
    ['ต้องมีออกซิเจนละลายพอ ถ้าน้ำร้อนหรือนิ่ง รากขาดออกซิเจนและดูดอาหารไม่ได้ เชื้อพิเทียมเข้าง่าย','Needs enough dissolved oxygen; warm or still water starves roots of O₂ and lets Pythium in'],
    ['ไม่มีดินช่วยกันชน ค่า EC และ pH ที่ผิดจะเห็นผลในไม่กี่วัน','No soil buffer: wrong EC or pH shows within days']], root:'hydro'}
};
// share of supply reaching the root surface: [mass flow, diffusion, interception] (approx. after Barber)
const PATHS8 = {N:[80,19,1], P:[5,93,2], K:[10,88,2], Ca:[70,0,30], Mg:[80,5,15], S:[95,0,5], Fe:[40,50,10], Zn:[30,60,10], B:[90,5,5]};
function rootSVG(type, nut){
  const W = 640, H = 210;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('ภาพตัดรากและเส้นทางของธาตุ','Root cross-section and nutrient path')}">`;
  s += `<rect width="${W}" height="${H}" rx="6" style="fill:${type === 'hydro' ? '#cfe6ee' : '#a9805a'}"/>`;
  const zones = [['ดิน / สารละลาย','Soil / solution',0,150,null],['ขนราก ผิวราก','Root hair, epidermis',150,230,'#f2e3c6'],['คอร์เทกซ์','Cortex',230,400,'#e9d6b0'],['เอนโดเดอร์มิส (แถบแคสพาเรียน)','Endodermis (Casparian strip)',400,450,'#c9a46e'],['ท่อน้ำ (ไซเลม) → ใบ','Xylem → leaves',450,640,'#d8ecd0']];
  zones.forEach(([th, en, a, b, c]) => { if (c) s += `<rect x="${a}" y="30" width="${b - a}" height="150" style="fill:${c}"/>`; s += `<text x="${(a + b) / 2}" y="20" text-anchor="middle" style="font:11px var(--body);fill:${type === 'hydro' || !c ? '#1f2a24' : 'var(--fg)'}">${L(th, en)}</text>` });
  for (let i = 0; i < 5; i++){ for (let j = 0; j < 3; j++) s += `<rect x="${236 + i * 33}" y="${36 + j * 48}" width="29" height="44" rx="10" style="fill:none;stroke:#b08a5a"/>` }
  s += `<rect x="420" y="30" width="8" height="150" fill="#5a3b24"/>`;
  for (let j = 0; j < 4; j++) s += `<circle cx="${520 + (j % 2) * 50}" cy="${60 + j * 32}" r="13" style="fill:none;stroke:#3f7a35;stroke-width:3"/>`;
  if (type === 'rice') for (let j = 0; j < 3; j++) s += `<ellipse cx="${300}" cy="${58 + j * 48}" rx="22" ry="14" style="fill:#fff;stroke:#b08a5a"/>`;
  if (type === 'legume') s += `<circle cx="190" cy="190" r="16" fill="#e07a8a"/><text x="210" y="196" style="font:10px var(--body);fill:#fff">${L('ปมราก','nodule')}</text>`;
  if (type === 'myco') s += `<path d="M150 60 C110 40 70 70 20 50 M150 120 C100 140 60 110 10 140 M150 160 C120 175 80 170 40 190" style="stroke:#f4f1de;stroke-width:2;fill:none;stroke-dasharray:6 3"/><text x="20" y="44" style="font:10px var(--body);fill:#fff">${L('เส้นใยไมคอร์ไรซา','mycorrhizal hyphae')}</text>`;
  if (type === 'dicot') s += `<text x="160" y="196" style="font:11px var(--mono);fill:#fff">H⁺ → · Fe³⁺→Fe²⁺</text>`;
  // animated ions: apoplast path (stops at strip, crosses membrane) and symplast path
  const col = '#2e86c1';
  const p1 = 'M20 70 L240 70 L415 70 L432 70 L600 70', p2 = 'M20 130 L160 130 L250 120 L400 120 L460 120 L600 120';
  s += `<path d="${p1}" style="fill:none;stroke:${col};stroke-width:1.5;stroke-dasharray:3 4;opacity:.6"/><path d="${p2}" style="fill:none;stroke:#8e44ad;stroke-width:1.5;stroke-dasharray:3 4;opacity:.6"/>`;
  s += '<g class="ions">';
  for (let i = 0; i < 5; i++){ s += `<circle r="5" style="fill:${col};offset-path:path('${p1}');animation-delay:${-i * .8}s"/><circle r="5" style="fill:#8e44ad;offset-path:path('${p2}');animation-delay:${-i * .8 - .4}s"/>` }
  s += `</g><text x="24" y="62" style="font:600 11px var(--mono);fill:#fff">${nut}</text>`;
  return s + '</svg>';
}
const STD8 = [
  ['ไทย: พ.ร.บ.ปุ๋ย พ.ศ. 2518 และฉบับแก้ไข','Thailand: Fertilizer Act B.E. 2518 (1975) and amendments','ปุ๋ยเคมี ปุ๋ยอินทรีย์ และปุ๋ยชีวภาพต้องขึ้นทะเบียนกับกรมวิชาการเกษตร ผู้ผลิตและผู้ขายต้องมีใบอนุญาต','Chemical, organic and bio-fertilizers must be registered with the Department of Agriculture; makers and sellers need licenses'],
  ['ฉลากต้องรับรองปริมาณธาตุ','Labels must guarantee nutrient content','ระบุสูตร N-P₂O₅-K₂O และธาตุรองที่รับรอง ถ้าตรวจพบต่ำกว่าที่ระบุเกินเกณฑ์ถือเป็นปุ๋ยปลอมหรือปุ๋ยผิดมาตรฐาน','States the guaranteed N-P₂O₅-K₂O grade and secondary nutrients; testing below the label beyond the tolerance counts as fake or substandard'],
  ['มาตรฐานปุ๋ยอินทรีย์','Organic fertilizer standards','กำหนดอินทรียวัตถุขั้นต่ำ ความชื้น ความย่อยสลายสมบูรณ์ (C/N) และค่าโลหะหนักสูงสุด เช่น แคดเมียม ตะกั่ว ปรอท สารหนู','Set minimum organic matter, moisture, maturity (C/N), and maximum heavy metals such as cadmium, lead, mercury and arsenic'],
  ['สหภาพยุโรป: ระเบียบ (EU) 2019/1009','EU: Fertilising Products Regulation (EU) 2019/1009','ผลิตภัณฑ์ที่ติดเครื่องหมาย CE ต้องผ่านเกณฑ์สารปนเปื้อน เช่น จำกัดแคดเมียมในปุ๋ยฟอสเฟต','CE-marked products must meet contaminant limits, e.g. a cap on cadmium in phosphate fertilizers'],
  ['ระบบคุณภาพโรงงาน','Plant quality systems','โรงงานปุ๋ยใหญ่ใช้ ISO 9001 (คุณภาพ) ISO 14001 (สิ่งแวดล้อม) และวัดการปล่อยแอมโมเนีย ฝุ่น ฟลูออไรด์','Large plants use ISO 9001 (quality), ISO 14001 (environment) and monitor ammonia, dust and fluoride emissions'],
  ['เกรดปุ๋ยละลายน้ำ','Water-soluble grades','ปุ๋ยสำหรับน้ำหยดและไฮโดรโปนิกส์ต้องละลายหมด ไม่มีสารไม่ละลาย โซเดียมและคลอไรด์ต่ำ','Fertigation and hydroponic grades must dissolve completely, with no insolubles and low sodium and chloride'],
  ['การใช้ปุ๋ยในแปลง: GAP','On-farm use: GAP','มาตรฐาน GAP ให้บันทึกชนิด ปริมาณ วันใส่ปุ๋ย และเก็บปุ๋ยแยกจากผลผลิต','GAP requires records of fertilizer type, amount and date, and storage away from produce']
];
function sim8(){
  const pl = player(1500);
  const S0 = {tab:'bal', crop:'tomato', ph:6.2, air:'ok', proc:'N', unit:0, plant:'rice', nut:'P'};
  NUTS.forEach(n => S0['s' + n.k] = 100);
  Sim('sim8', S0, st => head(
      'ธาตุอาหาร: สัดส่วน ปฏิกิริยากับพืช การผลิต และการดูดซึม', 'Nutrients: ratios, plant response, manufacture and uptake',
      'แบ่งเป็น 4 แท็บ: ปรับสัดส่วนธาตุแล้วดูพืชตอบสนอง ดูเครื่องจักรที่ผลิตปุ๋ยแต่ละชนิด ดูเส้นทางที่รากดูดธาตุในพืชแต่ละแบบ และมาตรฐานการผลิต',
      'Four tabs: change nutrient ratios and watch the plant respond, see the machines that make each fertilizer, follow how roots take up nutrients in different plants, and production standards.') +
    `<div class="tabs2" data-o="tabs">${[['bal','สัดส่วนธาตุกับพืช','Nutrient balance'],['mac','เครื่องจักรผลิตปุ๋ย','Fertilizer machines'],['upt','การดูดซึมของราก','Root uptake'],['std','มาตรฐานการผลิต','Production standards']].map(([v, a, b]) => `<button type="button" data-tab="${v}" aria-pressed="${v === st.tab}">${L(a, b)}</button>`).join('')}</div>
    <div data-pane="bal">
      <div class="lab2"><div class="lab2-ctl">
        ${seg('crop', [['rice','ข้าว','Rice'],['leafy','ผักใบ','Leafy'],['tomato','มะเขือเทศ','Tomato'],['legume','ถั่ว','Legume']], st.crop)}
        ${rng('ph','pH','pH',4.5,8.5,.1,st.ph)}
        ${seg('air', [['ok','อากาศปกติ','Normal'],['humid','ชื้นมาก คายน้ำน้อย','Very humid'],['dry','แล้ง','Drought']], st.air)}
        <div class="nut">${NUTS.map(n => `<label>${n.k}</label><input type="range" data-k="s${n.k}" min="0" max="200" step="5" value="${st['s' + n.k]}" aria-label="${L(...n.n)}"><b data-o="s${n.k}"></b>`).join('')}</div>
        <p class="mini">${L('ค่าที่ให้ = % ของที่พืชต้องการ','Supply = % of what the crop needs')}</p>
        <button type="button" class="btn2" data-act="reset">${L('รีเซ็ตเป็น 100%','Reset to 100%')}</button>
      </div><div class="lab2-out">
        <div class="two"><div class="pane" data-o="plant" style="padding:4px"></div><div class="pane" data-o="barrel" style="padding:4px"></div></div>
        <div class="kpi" data-o="kpi"></div>
        <p class="msg" data-o="msg"></p>
        <div class="avail" data-o="avail"></div>
      </div></div>
      <h4 style="margin:12px 0 4px">${L('ทำไมพืชดูดมากหรือน้อยเกินไป','Why plants take up too much or too little')}</h4>
      <div class="cards2">${[
        ['pH ของดิน','Soil pH','กำหนดว่าธาตุอยู่ในรูปละลายน้ำหรือไม่ ดินกรดฟอสฟอรัสถูกเหล็กและอะลูมิเนียมจับ ดินด่างเหล็ก สังกะสี โบรอนละลายน้อย','Decides whether a nutrient is dissolved. Acid soil locks P with Fe and Al; alkaline soil leaves Fe, Zn and B insoluble'],
        ['ธาตุแย่งกัน','Competing ions','ไอออนประจุเดียวกันแย่งตัวขนส่งที่ผิวราก เช่น K⁺ กับ Mg²⁺ และ Ca²⁺ ใส่ตัวหนึ่งมากอีกตัวขาดได้','Ions of the same charge compete for root transporters (K⁺ vs Mg²⁺ and Ca²⁺); overdo one and another runs short'],
        ['น้ำและการคายน้ำ','Water and transpiration','Ca และ B เดินทางไปกับน้ำที่ใบคายออก อากาศชื้นจัดหรือแล้งจัดทำให้ยอดและผลขาดได้','Ca and B ride the water that leaves transpire; very humid or very dry air starves tips and fruit'],
        ['ออกซิเจนและอุณหภูมิราก','Root oxygen and temperature','รากใช้พลังงานดูดธาตุ ดินขังน้ำหรือน้ำร้อนทำให้รากขาดออกซิเจน ดูดได้น้อย','Roots spend energy on uptake; waterlogging or warm solution starves them of oxygen'],
        ['ตัวขนส่งเลือกได้','Selective transporters','เยื่อหุ้มเซลล์มีโปรตีนขนส่งเฉพาะธาตุ พืชปรับจำนวนตามความต้องการ แต่บางธาตุพืชดูดเกินความต้องการ (เช่น K และไนเตรตในที่แสงน้อย)','Membranes have nutrient-specific transporters the plant adjusts to demand, but some are taken up in excess (K, and nitrate in low light)'],
        ['จุลินทรีย์รอบราก','Root-zone microbes','ไมคอร์ไรซาและแบคทีเรียช่วยละลาย P และตรึง N ดินที่ไม่มีอินทรียวัตถุจึงดูดได้น้อยกว่าแม้ใส่ปุ๋ยเท่ากัน','Mycorrhizae and bacteria free up P and fix N, so soil without organic matter delivers less from the same fertilizer']
      ].map(([a, b, c, d]) => `<div><h4>${L(a, b)}</h4><span>${L(c, d)}</span></div>`).join('')}</div>
    </div>
    <div data-pane="mac">
      <div class="tabs2">${Object.entries(PROC).map(([k, p]) => `<button type="button" data-proc="${k}" aria-pressed="${k === st.proc}">${L(...p.n)}</button>`).join('')}</div>
      <div class="row" style="margin-top:8px"><button type="button" class="btn2" data-act="walk">▶ ${L('เดินตามสายการผลิต','Walk the line')}</button></div>
      <div class="pane" data-o="proc"></div>
      <p class="msg" data-o="unit"></p>
      <div class="eq" data-o="eq"></div>
      <div class="two"><div><h4>${L('ปุ๋ยเม็ด','Granular')}</h4><ul><li>${L('ทำจากแม่ปุ๋ยปั้นเม็ดหรือคลุก ขนส่งและเก็บง่าย ต้นทุนต่อธาตุต่ำ','Granulated or blended; easy to ship and store; low cost per nutrient')}</li><li>${L('ละลายช้าตามความชื้นดิน สูญเสียไปกับน้ำไหลบ่าและอากาศได้มาก','Dissolves slowly with soil moisture; larger losses to runoff and air')}</li><li>${L('เหมาะกับนาข้าว พืชไร่ หว่านครั้งละมาก','Suits rice and field crops, applied in big doses')}</li></ul></div>
        <div><h4>${L('ปุ๋ยน้ำ / ละลายน้ำ','Liquid / soluble')}</h4><ul><li>${L('ต้องใช้เกลือบริสุทธิ์และคีเลต ราคาต่อธาตุสูงกว่า','Needs pure salts and chelates; higher cost per nutrient')}</li><li>${L('ให้ทีละน้อยตรงเวลาที่พืชต้องการ ประสิทธิภาพการใช้สูงกว่า','Given little and often when the crop needs it; higher use efficiency')}</li><li>${L('ต้องแยกถัง A/B และมีระบบน้ำหยดหรือไฮโดรโปนิกส์','Needs A/B tanks and a drip or hydroponic system')}</li></ul></div></div>
    </div>
    <div data-pane="upt">
      <div class="tabs2">${Object.entries(PLANTS8).map(([k, p]) => `<button type="button" data-plant="${k}" aria-pressed="${k === st.plant}">${L(...p.n)}</button>`).join('')}</div>
      ${seg('nut', NUTS.map(n => [n.k, n.k, n.k]), st.nut)}
      <div class="pane" data-o="root"></div>
      <p class="note">${L('จุดสีฟ้า: เดินในช่องว่างระหว่างเซลล์ แต่ถูกแถบแคสพาเรียนกั้น ต้องผ่านเยื่อหุ้มเซลล์ด้วยโปรตีนขนส่งซึ่งเป็นจุดที่พืชเลือกได้ · จุดสีม่วง: เข้าเซลล์ตั้งแต่ผิวรากแล้วส่งต่อเซลล์ถึงเซลล์','Blue dots travel between cells but are stopped by the Casparian strip and must cross a membrane through transporter proteins, which is where the plant chooses · Purple dots enter a cell at the root surface and pass cell to cell')}</p>
      <div class="two"><div><h4>${L('ธาตุมาถึงผิวรากอย่างไร','How the nutrient reaches the root')}</h4><div class="avail" data-o="paths"></div><p class="note">${L('การไหลของน้ำ = ธาตุมากับน้ำที่พืชดูด · การแพร่ = ธาตุเคลื่อนจากที่เข้มข้นไปหาผิวรากที่ถูกดูดจนจาง · รากชน = รากงอกไปเจอเอง','Mass flow = carried by water the plant draws in · Diffusion = moves from rich soil toward the depleted root surface · Interception = the root grows into it')} ${INF()}</p></div>
        <div><h4 data-o="pname"></h4><ul data-o="ppts"></ul></div></div>
    </div>
    <div data-pane="std"><div class="cards2">${STD8.map(([a, b, c, d]) => `<div><h4>${L(a, b)}</h4><span>${L(c, d)}</span></div>`).join('')}</div><p class="note">${L('สรุปจากกฎหมายและมาตรฐานที่ใช้กันทั่วไป','Summarized from commonly used laws and standards')} ${UNV()} ${L('ควรตรวจฉบับล่าสุดกับกรมวิชาการเกษตรก่อนใช้','Check the latest versions with the Department of Agriculture before relying on them')}</p></div>
    <p class="note">${L('ความเป็นประโยชน์ตาม pH อิง Truog','pH availability after Truog')}<sup><a href="#r24">24</a></sup> ${L('อาการขาดธาตุและการเคลื่อนย้ายในพืชอิง Marschner','Deficiency symptoms and mobility after Marschner')}<sup><a href="#r25">25</a></sup> ${L('สภาวะในกระบวนการผลิตเป็นช่วงทั่วไปในอุตสาหกรรม','Process conditions are typical industry ranges')} ${INF()}</p>`,
  (st, root, api) => {
    root.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== st.tab);
    root.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === st.tab)));
    if (st.tab === 'bal'){
      const m = nutModel(st);
      setOut(root, 'ph', st.ph.toFixed(1));
      NUTS.forEach(n => setOut(root, 's' + n.k, st['s' + n.k] + '%'));
      setOut(root, 'plant', plant8(m, st.crop));
      setOut(root, 'barrel', barrel(m.U, m.lim));
      setOut(root, 'kpi', `<div>${L('การเติบโตสัมพัทธ์','Relative growth')}<b>${fmt(m.grow * 100)}%</b></div><div>${L('ธาตุที่จำกัด','Limiting nutrient')}<b style="color:var(--warn)">${L(...m.lim.n)}</b></div><div>${L('ธาตุที่ดูดเกิน','Taken up in excess')}<b>${m.over.length ? m.over.map(n => n.k).join(', ') : '–'}</b></div>`);
      const lim = m.lim, u = m.U[lim.k];
      let msg = u < .85 ? L(`ขาด${lim.n[0]}: ${lim.lo[0]} `, `${lim.n[1]} short: ${lim.lo[1]}. `) + (lim.mob ? L('ธาตุนี้เคลื่อนย้ายในพืชได้ พืชดึงจากใบแก่ไปใบอ่อน อาการจึงเริ่มที่ใบล่าง', 'This nutrient is mobile, so the plant moves it from old to young leaves and symptoms start low.') : L('ธาตุนี้เคลื่อนย้ายในพืชไม่ได้ อาการจึงเริ่มที่ยอดและใบอ่อน', 'This nutrient is immobile, so symptoms start at the tip and young leaves.'))
        : L('ธาตุทุกตัวพอ การเติบโตถูกจำกัดด้วยปัจจัยอื่น ', 'Every nutrient is adequate; something else limits growth. ');
      if (m.why[lim.k].length && u < .85) msg += L(` สาเหตุส่วนหนึ่งมาจาก${m.why[lim.k].map(k => NUTS.find(n => n.k === k).n[0]).join(' ')}ที่มากเกินไป ไม่ใช่เพราะใส่${lim.n[0]}น้อย`, ` Part of the cause is too much ${m.why[lim.k].join(', ')}, not too little ${lim.k}.`);
      if (lerp(lim.ph, st.ph) < .7 && u < .85) msg += L(` และ pH ${st.ph.toFixed(1)} ทำให้${lim.n[0]}ละลายน้อย`, ` And pH ${st.ph.toFixed(1)} keeps ${lim.k} poorly soluble.`);
      m.over.forEach(n => { msg += ' ' + L(`${n.n[0]}เกิน: ${n.hi[0]}`, `${n.n[1]} excess: ${n.hi[1]}.`) });
      if (st.crop === 'legume') msg += ' ' + L(m.sup.P >= .7 ? 'ปมรากทำงาน (สีชมพู) จึงได้ไนโตรเจนจากอากาศ' : 'ฟอสฟอรัสไม่พอ ปมรากทำงานน้อย', m.sup.P >= .7 ? 'Nodules are working (pink), so N comes from the air.' : 'Not enough P, so nodules barely work.');
      if (st.crop === 'leafy' && m.U.N > 1.3) msg += ' ' + L('ผักใบสะสมไนเตรตในใบ ควรลดไนโตรเจนก่อนเก็บเกี่ยว', 'Leafy greens store nitrate; cut N before harvest.');
      const msgEl = out(root, 'msg'); msgEl.className = 'msg ' + (u < .85 || m.over.length ? 'bad' : 'good'); msgEl.textContent = msg;
      setOut(root, 'avail', `<p class="mini" style="margin:0">${L('ที่พืชดูดได้จริง (หลังผล pH ธาตุแย่งกัน และการคายน้ำ)','Actually taken up (after pH, competition and transpiration)')}</p>` + NUTS.map(n => { const v = m.U[n.k]; return `<div class="arow"><span>${n.k} ${L(...n.n)}</span><div class="b"><i class="${v < .85 ? 'lo' : v > 1.5 ? 'hi' : ''}" style="width:${clamp(v / 1.6 * 100, 1, 100)}%"></i></div><span>${fmt(v * 100)}%</span></div>` }).join('') +
        (m.acts.length ? `<p class="mini" style="margin:4px 0 0">${L('ธาตุที่แย่งกันตอนนี้: ','Competition happening now: ')}${m.acts.join(' · ')}</p>` : ''));
    }
    if (st.tab === 'mac'){
      const p = PROC[st.proc]; if (st.unit >= p.u.length) st.unit = 0;
      root.querySelectorAll('[data-proc]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.proc === st.proc)));
      setOut(root, 'proc', procSVG(p, st.unit));
      const u = p.u[st.unit]; setOut(root, 'unit', `<b>${st.unit + 1}. ${L(u[0], u[1])}</b> · ${L(u[2], u[3])}`);
      setOut(root, 'eq', p.eq);
      const wb = root.querySelector('[data-act="walk"]'); if (wb) wb.textContent = pl.on ? '❚❚ ' + L('หยุด','Pause') : '▶ ' + L('เดินตามสายการผลิต','Walk the line');
    }
    if (st.tab === 'upt'){
      const P = PLANTS8[st.plant];
      root.querySelectorAll('[data-plant]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plant === st.plant)));
      setOut(root, 'root', rootSVG(P.root, st.nut));
      let pp = PATHS8[st.nut]; if (st.plant === 'hydro') pp = [90, 5, 5];
      setOut(root, 'paths', [[L('การไหลของน้ำ','Mass flow'), pp[0]], [L('การแพร่','Diffusion'), pp[1]], [L('รากชน','Interception'), pp[2]]].map(([a, v]) => `<div class="arow"><span>${a}</span><div class="b"><i style="width:${v}%"></i></div><span>${v}%</span></div>`).join('') + (st.plant === 'tree' && (st.nut === 'P' || st.nut === 'Zn') ? `<p class="mini">${L('ไมคอร์ไรซาเพิ่มพื้นที่ดูดฟอสฟอรัสและสังกะสีได้หลายเท่า','Mycorrhizae multiply the area that supplies P and Zn')}</p>` : ''));
      setOut(root, 'pname', L(...P.n));
      setOut(root, 'ppts', P.pts.map(([a, b]) => `<li>${L(a, b)}</li>`).join(''));
    }
    if (!root._wired){
      root._wired = true;
      root.addEventListener('click', e => {
        const t = e.target.closest('[data-tab],[data-proc],[data-plant],[data-u],[data-act]'); if (!t) return;
        const s = api.state;
        if (t.dataset.tab){ pl.stop(); s.tab = t.dataset.tab }
        else if (t.dataset.proc){ pl.stop(); s.proc = t.dataset.proc; s.unit = 0 }
        else if (t.dataset.plant) s.plant = t.dataset.plant;
        else if (t.dataset.u != null){ pl.stop(); s.unit = +t.dataset.u }
        else if (t.dataset.act === 'reset'){ NUTS.forEach(n => { s['s' + n.k] = 100; const r = root.querySelector(`[data-k="s${n.k}"]`); if (r) r.value = 100 }) }
        else if (t.dataset.act === 'walk'){
          if (pl.on){ pl.stop() } else { s.unit = 0; pl.start(() => { s.unit++; if (s.unit >= PROC[s.proc].u.length){ s.unit = PROC[s.proc].u.length - 1; api.refresh(); return false } api.refresh(); return true }, api.refresh) }
        }
        api.refresh();
      });
      root.addEventListener('keydown', e => { const u = e.target.closest('[data-u]'); if (u && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); api.state.unit = +u.dataset.u; api.refresh() } });
    }
  });
}

/* ================= 9. helpers vs customers in the field ================= */
const GROUPS9 = {
  rice: [
    {k:'hop', h:0, c:'#b9770e', n:['เพลี้ยกระโดด','Planthoppers'], r:.09, cap:100, x0:8},
    {k:'rat', h:0, c:'#6e4b3a', n:['หนู','Rats'], r:.03, cap:60, x0:10},
    {k:'snl', h:0, c:'#c39bd3', n:['หอยเชอรี่','Apple snails'], r:.04, cap:70, x0:12},
    {k:'nat', h:1, c:'#1e8449', n:['แมงมุม แตนเบียน มวน','Spiders, wasps, mirid bugs'], r:.05, cap:70, x0:20},
    {k:'owl', h:1, c:'#7f8c8d', n:['นกแสก','Barn owls'], r:0, cap:10, x0:0},
    {k:'wrm', h:1, c:'#cd6155', n:['ไส้เดือน สัตว์ในดิน','Earthworms, soil fauna'], r:.02, cap:80, x0:25},
    {k:'dck', h:1, c:'#f4d03f', n:['เป็ด ปลา','Ducks, fish'], r:0, cap:15, x0:0}
  ],
  orchard: [
    {k:'fly', h:0, c:'#b9770e', n:['แมลงวันผลไม้','Fruit flies'], r:.08, cap:100, x0:6},
    {k:'mea', h:0, c:'#d5d8dc', n:['เพลี้ยแป้ง (มดเลี้ยงไว้)','Mealybugs (ant-tended)'], r:.06, cap:80, x0:8},
    {k:'rat', h:0, c:'#6e4b3a', n:['หนู กระรอก','Rats, squirrels'], r:.03, cap:50, x0:8},
    {k:'nat', h:1, c:'#1e8449', n:['ด้วงเต่า แมลงช้าง แตนเบียน','Ladybirds, lacewings, wasps'], r:.05, cap:70, x0:18},
    {k:'ant', h:1, c:'#c0392b', n:['มดแดง','Weaver ants'], r:.02, cap:40, x0:0},
    {k:'bee', h:1, c:'#f1c40f', n:['ผึ้ง ชันโรง','Bees, stingless bees'], r:.03, cap:60, x0:15},
    {k:'owl', h:1, c:'#7f8c8d', n:['นกแสก','Barn owls'], r:0, cap:10, x0:0}
  ]
};
function run9(st){
  const G = GROUPS9[st.land], D = 120, p = {}, hist = [];
  G.forEach(g => p[g.k] = g.x0);
  if (st.owl) p.owl = 8; if (st.duck && st.land === 'rice') p.dck = 12; if (st.bee && st.land === 'orchard') p.bee = 45; if (st.weaver && st.land === 'orchard') p.ant = 30;
  const sprayDays = [30, 50, 70].slice(0, st.spray), Nboost = (st.highN ? 1.5 : 1) * (1 + .2 * st.spray);  // resistance and resurgence after broad-spectrum sprays
  for (let d = 0; d <= D; d++){
    const pest = st.land === 'rice' ? 'hop' : 'fly', pest2 = st.land === 'rice' ? 'snl' : 'mea';
    const enemyCap = 70 * (st.flower ? 1.35 : 1) * (st.om ? 1.1 : 1);
    // natural enemies follow prey
    p.nat += p.nat * (.05 * (p[pest] + p[pest2]) / 60 - .025) * (1 - p.nat / enemyCap) + (st.flower ? .4 : .15);
    p[pest] += p[pest] * (G.find(g => g.k === pest).r * Nboost * (st.resist ? .6 : 1)) * (1 - p[pest] / 100) - .0012 * p.nat * p[pest] - (p.ant ? .0015 * p.ant * p[pest] : 0) - (p.dck ? .002 * p.dck * p[pest] : 0);
    p[pest2] += p[pest2] * G.find(g => g.k === pest2).r * (1 - p[pest2] / 80) - (p.dck ? .006 * p.dck * p[pest2] : 0) - .0004 * p.nat * p[pest2];
    p.rat += p.rat * .03 * (1 - p.rat / 60) - (p.owl ? .012 * p.owl * p.rat / 10 : 0);
    if (p.wrm != null) p.wrm += p.wrm * .02 * (1 - p.wrm / (st.om ? 90 : 45));
    if (p.bee != null && !st.bee) p.bee += p.bee * .01 * (1 - p.bee / (st.flower ? 40 : 25));
    if (sprayDays.includes(d)){
      p[pest] *= .4; if (st.land === 'orchard') p[pest2] *= .5;   // insecticide does not kill snails
      p.nat *= .1; if (p.bee != null) p.bee *= .4; if (p.ant) p.ant *= .3;
    }
    G.forEach(g => p[g.k] = clamp(p[g.k], .3, 100));
    if (d === 0 && !st.owl) p.owl = 0;
    const helpers = G.filter(g => g.h).reduce((a, g) => a + p[g.k], 0), cust = G.filter(g => !g.h).reduce((a, g) => a + p[g.k], 0);
    hist.push({d, p: Object.assign({}, p), helpers, cust});
  }
  const W = st.land === 'rice' ? {hop:.5, rat:.15, snl:.15} : {fly:.5, mea:.15, rat:.1};
  const dmg = Object.entries(W).reduce((a, [k, w]) => a + w * hist.reduce((s, h) => s + h.p[k], 0) / hist.length, 0);
  let yld = 100 - dmg;
  if (st.land === 'orchard') yld *= .55 + .45 * clamp((hist[60].p.bee || 0) / 40, 0, 1);
  return {hist, yld: clamp(yld, 5, 100), sprayDays};
}
function sim9(){
  let raf = null, dots = [];
  Sim('sim9', {land:'rice', spray:0, flower:false, owl:false, duck:false, bee:false, weaver:false, om:false, resist:false, highN:false, day:90}, st => head(
      'ผู้ช่วยกับลูกค้าในแปลง: จัดการแบบไหนผู้ช่วยมากกว่า', 'Helpers and customers in the field: which management tips the balance?',
      'เลือกนาข้าวหรือสวนผลไม้ ลองพ่นยาออกฤทธิ์กว้าง ปลูกดอกไม้ ทำรังนกแสก เลี้ยงเป็ดหรือชันโรง แล้วดูว่าจำนวนผู้ช่วยกับลูกค้า (ศัตรูพืช) เปลี่ยนไปตลอดฤดูอย่างไร',
      'Pick a rice paddy or an orchard. Try broad-spectrum sprays, flower strips, owl boxes, ducks or stingless bees, and watch how helpers and customers (pests) change through the season.') +
    `<div class="ctlrow">${seg('land', [['rice','นาข้าว','Rice paddy'],['orchard','สวนลำไย/มะม่วง','Longan/mango orchard']], st.land)}${rng('spray','พ่นยาออกฤทธิ์กว้าง','Broad-spectrum sprays',0,3,1,st.spray)}${rng('day','ดูวันที่','View day',0,120,1,st.day)}</div>
    <div class="ctlrow">${chk('flower','ปลูกดอกไม้คันนา/ขอบแปลง','Flower strips on bunds and edges',st.flower)}${chk('owl','ทำรังนกแสก','Barn owl boxes',st.owl)}${chk('duck','เลี้ยงเป็ดหรือปลาในนา (นาข้าว)','Ducks or fish in the paddy (rice)',st.duck)}${chk('bee','เลี้ยงชันโรง (สวน)','Stingless bee hives (orchard)',st.bee)}${chk('weaver','รักษารังมดแดง (สวน)','Keep weaver ant nests (orchard)',st.weaver)}${chk('om','เพิ่มอินทรียวัตถุ','Add organic matter',st.om)}${chk('resist','พันธุ์ต้านทาน','Resistant variety',st.resist)}${chk('highN','ใส่ไนโตรเจนมากเกิน','Too much nitrogen',st.highN)}</div>
    <canvas class="fieldcv" width="640" height="200" data-o="cv" aria-label="${L('ภาพสัตว์ในแปลง','Animals in the field')}"></canvas>
    <div class="legend3" data-o="leg"></div>
    <div data-o="chart"></div>
    <div class="legend3"><span><i style="background:var(--leaf)"></i>${L('ผู้ช่วยรวม','All helpers')}</span><span><i style="background:var(--warn)"></i>${L('ลูกค้า (ศัตรูพืช) รวม','All customers (pests)')}</span><span><i style="background:var(--muted)"></i>${L('วันพ่นยา','Spray days')}</span></div>
    <div class="kpi" data-o="kpi"></div>
    <p class="msg" data-o="msg"></p>
    <p class="note">${L('แบบจำลองสัมพัทธ์ อิงหลักว่าการพ่นยาแบบไม่เลือกทำลายศัตรูธรรมชาติจนศัตรูพืชกลับมาระบาด','Relative model, built on the finding that blanket spraying kills natural enemies and lets pests resurge')}<sup><a href="#r2">2</a></sup> ${L('บทบาทผู้ผสมเกสรและมดแดง','Pollinator and weaver ant roles')}<sup><a href="#r18">18</a></sup><sup><a href="#r20">20</a></sup> ${INF()}</p>`,
  (st, root) => {
    const G = GROUPS9[st.land], r = run9(st), h = r.hist[st.day];
    setOut(root, 'spray', `${st.spray} ${L('ครั้ง','times')}`); setOut(root, 'day', String(st.day));
    setOut(root, 'leg', G.map(g => `<span><i style="background:${g.c};height:10px;width:10px;border-radius:50%"></i>${g.h ? '' : '⚠ '}${L(...g.n)} ${fmt(h.p[g.k] || 0)}</span>`).join(''));
    setOut(root, 'chart', lineChart([{c:css('--leaf'), wd:3, pts:r.hist.filter(x => x.d % 2 === 0).map(x => [x.d, x.helpers])}, {c:css('--warn'), wd:3, pts:r.hist.filter(x => x.d % 2 === 0).map(x => [x.d, x.cust])}],
      {w:640, h:180, xmax:120, ymax:Math.max(100, ...r.hist.map(x => Math.max(x.helpers, x.cust))) * 1.05, marker:st.day, xticks:[0, 30, 60, 90, 120].map(x => [x, x]), bands:r.sprayDays.map(d => [d - 1, d + 1, css('--muted')]), aria:L('ผู้ช่วยกับลูกค้าตามวัน','Helpers vs customers by day')}));
    const ratio = h.helpers / Math.max(h.cust, 1);
    const extra = (st.duck && st.land === 'rice' ? 2500 : 0) + (st.bee && st.land === 'orchard' ? 3000 : 0);
    setOut(root, 'kpi', `<div>${L('ผู้ช่วย : ลูกค้า วันที่ ','Helpers : customers, day ') + st.day}<b>${fmt(ratio, 1)} : 1</b></div><div>${L('ผลผลิตโดยประมาณ','Estimated yield')}<b>${fmt(r.yld)}%</b></div><div>${L('รายได้เสริม (เป็ด/น้ำผึ้ง) ต่อไร่','Extra income (ducks/honey) per rai')}<b>${fmt(extra)} ฿</b></div>`);
    const m = out(root, 'msg');
    if (st.spray >= 2 && !st.flower){ m.className = 'msg bad'; m.textContent = L('พ่นยาหลายรอบ ศัตรูธรรมชาติตายมากกว่าศัตรูพืช ศัตรูพืชฟื้นตัวเร็วกว่าและกลับมาระบาดหนักหลังพ่น', 'Repeated spraying kills natural enemies harder than pests; pests recover faster and resurge after each spray.') }
    else if (ratio >= 1.5){ m.className = 'msg good'; m.textContent = L('ผู้ช่วยมากกว่าลูกค้า ศัตรูพืชถูกคุมไว้ต่ำกว่าระดับเศรษฐกิจโดยไม่ต้องพ่นยา', 'Helpers outnumber customers and keep pests below the economic threshold without spraying.') }
    else { m.className = 'msg'; m.textContent = L('ยังสมดุลก้ำกึ่ง ลองปลูกดอกไม้ที่ขอบแปลง ทำรังนกแสก หรือเลี้ยงเป็ด', 'The balance is close. Try flower strips, owl boxes or ducks.') }
    if (st.highN) m.textContent += ' ' + L('ไนโตรเจนมากทำให้ใบอ่อนนุ่ม ศัตรูพืชเพิ่มเร็วขึ้น', 'Excess nitrogen makes leaves soft and pests multiply faster.');
    // animated dots
    const cv = out(root, 'cv'); const ctx = cv.getContext('2d'); const rnd = rand(11);
    dots = [];
    G.forEach(g => { const n = Math.round((h.p[g.k] || 0) / 100 * 22); for (let i = 0; i < n; i++) dots.push({c:g.c, h:g.h, x:rnd() * 640, y:30 + rnd() * 160, vx:(rnd() - .5) * (g.k === 'owl' ? 3 : 1.2), vy:(rnd() - .5) * .8, s:g.k === 'owl' ? 7 : g.k === 'dck' ? 6 : g.k === 'rat' ? 5 : 3.2}) });
    const bg = css('--bg');
    function draw(){
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 200);
      ctx.fillStyle = st.land === 'rice' ? 'rgba(46,134,193,.15)' : 'rgba(138,90,51,.18)'; ctx.fillRect(0, 150, 640, 50);
      ctx.strokeStyle = '#4f9a3c'; ctx.lineWidth = 2;
      for (let x = 12; x < 640; x += st.land === 'rice' ? 22 : 90){ ctx.beginPath(); if (st.land === 'rice'){ ctx.moveTo(x, 190); ctx.quadraticCurveTo(x - 4, 150, x + 2, 120) } else { ctx.moveTo(x + 20, 190); ctx.lineTo(x + 20, 110); ctx.arc(x + 20, 85, 32, 0, Math.PI * 2) } ctx.stroke() }
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy; if (d.x < 0 || d.x > 640) d.vx *= -1; if (d.y < 20 || d.y > 195) d.vy *= -1;
        ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2); ctx.fill();
        if (!d.h){ ctx.strokeStyle = '#222'; ctx.lineWidth = .8; ctx.stroke() }
      });
      ctx.fillStyle = css('--fg'); ctx.font = '12px sans-serif'; ctx.fillText((L('วันที่ ', 'Day ')) + st.day, 8, 16);
    }
    cancelAnimationFrame(raf);
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function loop(){ draw(); if (!reduce && document.body.contains(cv)) raf = requestAnimationFrame(loop) })();
  });
}

function init(){ sim8(); sim9() }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
