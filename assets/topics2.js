/* Simulations for soil-page topics 4–7: one year of lettuce in three systems (4, with seed route from 5),
   Tier 1 greenhouse gas for a rice field (6), and a 5-year transition budget (7). Needs topics.js (window.SIMK). */
(function(){
const K = window.SIMK; if (!K) return;
const {L, css, clamp, fmt, INF, UNV, head, seg, rng, chk, out, setOut, Sim, player, lineChart} = K;

/* ================= 4. one year of lettuce in soil, hydroponics and a plant factory ================= */
const SYS4 = [
  {k:'soil', c:'--soil', n:['ดิน แปลงเปิด','Open-field soil'], cyc:60, y:3.9, w:250, e:.31, other:15, prem:0, field:.12,
    st:[[['เพาะกล้าในถาด','Sow in trays'],0,.33],[['เตรียมแปลง ย้ายปลูก','Prepare bed, transplant'],.33,.38],[['โต: ให้น้ำ ปุ๋ย กำจัดวัชพืชและแมลง','Grow: water, fertilize, weed, scout pests'],.38,.92],[['เก็บเกี่ยว','Harvest'],.92,.97],[['คัด ล้าง แพ็ก ส่งตลาด','Sort, wash, pack, ship'],.97,1]]},
  {k:'hydro', c:'--water', n:['ไฮโดรโปนิกส์ (NFT)','Hydroponics (NFT)'], cyc:40, y:41, w:20, e:25, other:18, prem:1, field:.05,
    st:[[['เพาะเมล็ดในฟองน้ำ','Sow in sponge cubes'],0,.35],[['ย้ายลงราง NFT','Move to NFT channels'],.35,.4],[['โตในสารละลาย วัด EC และ pH ทุกวัน','Grow in nutrient film, check EC and pH daily'],.4,.93],[['เก็บเกี่ยวพร้อมราก','Harvest with roots'],.93,.97],[['แพ็ก ส่งตลาด','Pack and ship'],.97,1]]},
  {k:'pfal', c:'--leaf', n:['ระบบปิดแสงไฟ (โรงงานพืช)','Plant factory (LED)'], cyc:32, y:100, w:2, e:8, other:25, prem:1, field:.03,
    st:[[['เพาะเมล็ดใต้ไฟ LED','Sow under LED'],0,.3],[['ย้ายขึ้นชั้นปลูก','Move to growing racks'],.3,.35],[['โตใต้ไฟ 16 ชม. CO₂ ~1,000 ppm','Grow: 16 h light, CO₂ ~1,000 ppm'],.35,.94],[['เก็บเกี่ยว','Harvest'],.94,.97],[['แพ็ก ส่งตลาด','Pack and ship'],.97,1]]}
];
function lanes(day, sysList){
  const W = 640, H = 64 * sysList.length + 18;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('ความคืบหน้าการปลูกสามระบบ','Growing progress in three systems')}">`;
  sysList.forEach((S, i) => {
    const y0 = 8 + i * 64, col = css(S.c), cyc = S.cyc, inC = day % cyc, f = inC / cyc, done = Math.floor(day / cyc);
    s += `<text x="0" y="${y0 + 12}" style="font:600 12px var(--body);fill:${col}">${L(...S.n)}</text>`;
    s += `<text x="470" y="${y0 + 12}" text-anchor="end" style="font:11px var(--mono);fill:var(--muted)">${L('รอบที่','cycle')} ${done + 1} · ${L('วันที่','day')} ${Math.floor(inC)}/${cyc}</text>`;
    const bx = 0, bw = 470, by = y0 + 22;
    S.st.forEach(([n, a, b], j) => {
      const on = f >= a && f < b;
      s += `<rect x="${bx + a * bw}" y="${by}" width="${Math.max(1, (b - a) * bw - 1)}" height="16" rx="2" style="fill:${col};opacity:${on ? .95 : f >= b ? .45 : .15}"/>`;
    });
    s += `<line x1="${bx + f * bw}" x2="${bx + f * bw}" y1="${by - 3}" y2="${by + 19}" style="stroke:var(--fg);stroke-width:2"/>`;
    const cur = S.st.find(([, a, b]) => f >= a && f < b) || S.st[S.st.length - 1];
    s += `<text x="${bx}" y="${by + 32}" style="font:11.5px var(--body);fill:var(--fg)">${L(...cur[0])}</text>`;
    // plant
    const g = clamp((f - .05) / .9, .05, 1), r = 4 + 18 * g, px = 570, py = y0 + 40;
    if (S.k === 'soil') s += `<rect x="${px - 34}" y="${py + 6}" width="68" height="10" rx="2" fill="#8a5a33"/>`;
    else if (S.k === 'hydro') s += `<rect x="${px - 34}" y="${py + 6}" width="68" height="8" rx="4" style="fill:var(--water);opacity:.5"/>`;
    else s += `<rect x="${px - 34}" y="${py - 30}" width="68" height="4" fill="#e8b4f8"/><rect x="${px - 34}" y="${py + 6}" width="68" height="8" rx="2" style="fill:var(--line)"/>`;
    for (let k = 0; k < 7; k++){ const a = Math.PI * (k / 6); s += `<ellipse cx="${px + Math.cos(a) * r * .55}" cy="${py + 4 - Math.sin(a) * r * .5}" rx="${r * .45}" ry="${r * .25}" transform="rotate(${-a * 57 + 90} ${px + Math.cos(a) * r * .55} ${py + 4 - Math.sin(a) * r * .5})" style="fill:#6fbf4a;stroke:#3f7a35;stroke-width:.8"/>` }
  });
  return s + `<text x="0" y="${H - 2}" style="font:10.5px var(--mono);fill:var(--muted)">${L('วันที่ของปี','Day of year')}: ${day}</text></svg>`;
}
function sim4(){
  const pl = player(70);
  Sim('sim4', {day:45, gh:'net', ep:4.5, price:60, prem:30, ef:.5, area:500}, st => head(
      'ปลูกผักกาดหอมหนึ่งปีในสามระบบ ตั้งแต่เพาะเมล็ดจนส่งตลาด', 'One year of lettuce in three systems, from sowing to market',
      'กดเล่นเพื่อดูแต่ละระบบผ่านขั้นตอนเพาะกล้า ย้ายปลูก ดูแล เก็บเกี่ยว และส่งขายไปพร้อมกัน ตัวเลขด้านล่างสะสมตามวัน ปรับราคาไฟ ราคาผัก และชนิดโรงเรือนเพื่อดูว่าระบบไหนคุ้ม',
      'Press play to watch each system go through sowing, transplanting, growing, harvest and sale side by side. The figures below accumulate by day. Change electricity price, lettuce price and greenhouse type to see which system pays.') +
    `<div class="row">${rng('day','วันที่','Day',0,365,1,st.day)}<button type="button" class="btn2" data-act="play">▶ ${L('เล่นทั้งปี','Play the year')}</button></div>
    <div class="pane" data-o="lanes"></div>
    <div class="ctlrow">
      ${seg('gh', [['net','โรงเรือนมุ้งตาข่าย (ไทยทั่วไป)','Shade-net house (typical Thai)'],['clim','โรงเรือนคุมอากาศ (แบบงานวิจัยแอริโซนา)','Climate-controlled (Arizona study)']], st.gh)}
      ${rng('area','พื้นที่ปลูก','Growing area',100,1600,50,st.area)}
      ${rng('ep','ค่าไฟ','Electricity price',2,8,.1,st.ep)}
      ${rng('price','ราคาผักขายส่ง','Wholesale lettuce price',20,150,5,st.price)}
      ${rng('prem','ราคาพิเศษผักปลอดสาร (ไฮโดร/ระบบปิด)','Clean-produce premium (hydro/factory)',0,100,5,st.prem)}
      ${rng('ef','ค่าการปล่อย CO₂ ของไฟฟ้า','Grid CO₂ factor',.1,.8,.01,st.ef)}
    </div>
    <div class="tbl" style="margin-top:0" data-o="tab"></div>
    <p class="msg" data-o="msg"></p>
    <p class="note">${L('ผลผลิต น้ำ และพลังงานของดินกับโรงเรือนคุมอากาศมาจากงานผักกาดหอมที่แอริโซนา','Yield, water and energy for soil and the climate-controlled greenhouse come from the Arizona lettuce study')}<sup><a href="#r9">9</a></sup> ${L('ค่าของโรงเรือนมุ้งตาข่าย โรงงานพืช เงินลงทุน และต้นทุนอื่นเป็นค่าประมาณ','Shade-net house, plant factory, capital and other costs are estimates')} ${INF()}<sup><a href="#r8">8</a></sup> ${L('ผลผลิตโรงงานพืชคิดต่อพื้นที่พื้นห้องแบบหลายชั้น','Plant factory yield is per floor area with multiple layers')}</p>`,
  (st, root, api) => {
    const sys = SYS4.map(S => {
      const o = Object.assign({}, S);
      if (S.k === 'hydro' && st.gh === 'net'){ o.y = 25; o.e = 1.2; o.cap = 1000; o.n = ['ไฮโดรโปนิกส์ (NFT) มุ้งตาข่าย','Hydroponics (NFT), shade-net'] }
      else if (S.k === 'hydro'){ o.cap = 4000; o.n = ['ไฮโดรโปนิกส์ คุมอากาศ','Hydroponics, climate-controlled'] }
      if (S.k === 'soil') o.cap = 30; if (S.k === 'pfal') o.cap = 40000;
      return o;
    });
    setOut(root, 'day', String(st.day)); setOut(root, 'area', `${fmt(st.area)} ${L('ตร.ม.','m²')} (${fmt(st.area / 1600, 2)} ${L('ไร่','rai')})`);
    setOut(root, 'ep', `${fmt(st.ep, 1)} ฿/kWh`); setOut(root, 'price', `${st.price} ฿/kg`); setOut(root, 'prem', `+${st.prem}%`); setOut(root, 'ef', `${fmt(st.ef, 2)} kg/kWh`);
    setOut(root, 'lanes', lanes(st.day, sys));
    const frac = st.day / 365;
    const rows = sys.map(S => {
      const kgY = S.y * st.area, harvested = Math.floor(st.day / S.cyc) * S.cyc / 365 * kgY;
      const p = st.price * (1 + S.prem * st.prem / 100);
      const rev = kgY * p, energy = S.e * kgY, opex = energy * st.ep + S.other * kgY, margin = rev - opex, cap = S.cap * st.area;
      return {S, kgY, harvested, water: S.w * kgY / 1000, energy, co2: (S.e * st.ef + S.field) * kgY / 1000, co2kg: S.e * st.ef + S.field, rev, opex, margin, cap, pay: margin > 0 ? cap / margin : Infinity, cycles: 365 / S.cyc};
    });
    const best = (k, lo) => rows.reduce((a, r) => (lo ? r[k] < a[k] : r[k] > a[k]) ? r : a, rows[0]).S.k;
    const line = (lab, k, f, lo, bar) => {
      const mx = Math.max(...rows.map(r => Math.abs(r[k])).filter(isFinite)) || 1, b = best(k, lo);
      return `<tr><td>${lab}</td>${rows.map(r => `<td class="${r.S.k === b ? 'bestc' : ''}"><b style="${r.S.k === b ? 'color:var(--leaf)' : ''}">${f(r[k], r)}</b>${bar && isFinite(r[k]) ? `<span class="bar" style="width:${clamp(Math.abs(r[k]) / mx * 100, 2, 100)}%;background:${css(r.S.c)}"></span>` : ''}</td>`).join('')}</tr>`;
    };
    setOut(root, 'tab', `<table class="mtab"><thead><tr><th></th>${rows.map(r => `<th style="color:${css(r.S.c)}">${L(...r.S.n)}</th>`).join('')}</tr></thead><tbody>
      ${line(L('รอบปลูกต่อปี','Cycles per year'), 'cycles', v => fmt(v, 1))}
      ${line(L(`เก็บเกี่ยวแล้วถึงวันที่ ${st.day} (กก.)`, `Harvested by day ${st.day} (kg)`), 'harvested', v => fmt(v), false, true)}
      ${line(L('ผลผลิตทั้งปี (กก.)','Yield per year (kg)'), 'kgY', v => fmt(v), false, true)}
      ${line(L('น้ำทั้งปี (ลบ.ม.)','Water per year (m³)'), 'water', v => fmt(v, 1), true, true)}
      ${line(L('ไฟฟ้า/พลังงานทั้งปี (kWh)','Energy per year (kWh)'), 'energy', v => fmt(v), true, true)}
      ${line(L('CO₂e ต่อผัก 1 กก. (กก.)','CO₂e per kg lettuce (kg)'), 'co2kg', v => fmt(v, 2), true, true)}
      ${line(L('รายได้ทั้งปี (บาท)','Revenue per year (THB)'), 'rev', v => fmt(v), false, true)}
      ${line(L('ต้นทุนดำเนินงาน (บาท)','Operating cost (THB)'), 'opex', v => fmt(v), true, true)}
      ${line(L('กำไรก่อนค่าลงทุน (บาท/ปี)','Margin before capital (THB/yr)'), 'margin', v => (v < 0 ? '−' : '') + fmt(Math.abs(v)), false, true)}
      ${line(L('เงินลงทุนเริ่มต้น (บาท)','Up-front capital (THB)'), 'cap', v => fmt(v), true, true)}
      ${line(L('คืนทุน (ปี)','Payback (years)'), 'pay', v => isFinite(v) ? fmt(v, 1) : L('ไม่คืนทุน','never'), true)}
    </tbody></table>`);
    const pf = rows[2], hy = rows[1];
    let m = L(`ภายในวันที่ ${st.day} โรงงานพืชเก็บเกี่ยวไปแล้ว ${fmt(Math.floor(st.day / pf.S.cyc))} รอบ ไฮโดรโปนิกส์ ${fmt(Math.floor(st.day / 40))} รอบ ส่วนแปลงดิน ${fmt(Math.floor(st.day / 60))} รอบ `, `Harvests by day ${st.day}: plant factory ${fmt(Math.floor(st.day / pf.S.cyc))}, hydroponics ${fmt(Math.floor(st.day / 40))}, soil plot ${fmt(Math.floor(st.day / 60))}. `);
    m += pf.margin <= 0 ? L('ที่ราคานี้โรงงานพืชขาดทุนตั้งแต่ค่าไฟ ต้องขายผักราคาสูงหรือใช้ไฟถูก', 'At these prices the plant factory loses money on electricity alone; it needs premium prices or cheap power.')
      : L(`โรงงานพืชคืนทุนใน ~${fmt(pf.pay, 1)} ปี ระบบที่คืนทุนเร็วสุดคือ${L(...rows.find(r => r.S.k === best('pay', true)).S.n)}`, `The plant factory pays back in ~${fmt(pf.pay, 1)} years; the fastest payback is ${rows.find(r => r.S.k === best('pay', true)).S.n[1]}.`);
    if (st.gh === 'clim') m += L(' โรงเรือนคุมอากาศใช้พลังงานต่อกิโลกรัมสูงกว่าดินราว 80 เท่า ตามงานวิจัยที่แอริโซนา', ' The climate-controlled greenhouse uses about 80× more energy per kg than soil, as in the Arizona study.');
    setOut(root, 'msg', m);
    const pb = root.querySelector('[data-act="play"]'); if (pb) pb.textContent = pl.on ? '❚❚ ' + L('หยุด','Pause') : '▶ ' + L('เล่นทั้งปี','Play the year');
    if (!root._wired){
      root._wired = true;
      root.addEventListener('click', e => {
        if (!e.target.closest('[data-act="play"]')) return;
        if (pl.on){ pl.stop(); api.refresh(); return }
        if (api.state.day >= 365) api.state.day = 0;
        pl.start(() => { api.state.day = Math.min(365, api.state.day + 2); const r = root.querySelector('[data-k="day"]'); if (r) r.value = api.state.day; api.refresh(); return api.state.day < 365 }, api.refresh);
        api.refresh();
      });
    }
  });
}

/* ================= 6. Tier 1 greenhouse gas for one rice field, with a closed-chamber reading ================= */
function sim6(){
  // IPCC 2019 Refinement defaults: CH4 1.19 kg/ha/day continuous flooding; water regime scaling 1 / 0.71 / 0.55; N2O-N 0.4% of N for flooded rice
  // Residue burning EF (IPCC 2006 Vol 4 Table 2.5): CH4 2.7 g/kg dm, N2O 0.07 g/kg dm. GWP100 (AR5): CH4 28, N2O 265.
  Sim('sim6', {rai:10, days:100, water:'cf', N:15, straw:'burn', price:300}, st => head(
      'คำนวณก๊าซเรือนกระจกจากนาข้าวแบบ Tier 1 และอ่านค่าจากกล่องครอบ', 'Tier 1 greenhouse gas for a rice field, plus a closed-chamber reading',
      'ใส่พื้นที่ จำนวนวันขังน้ำ วิธีจัดการน้ำ ปุ๋ยไนโตรเจน และการจัดการฟาง แล้วดูก๊าซที่ปล่อยต่อฤดูและเครดิตคาร์บอนที่อาจได้ถ้าเปลี่ยนเป็นเปียกสลับแห้ง',
      'Enter area, flooded days, water management, nitrogen and straw handling, then see emissions per season and the carbon credit AWD might earn.') +
    `<div class="ctlrow">${rng('rai','พื้นที่','Area',1,100,1,st.rai)}${rng('days','จำนวนวันขังน้ำ','Flooded days',60,130,1,st.days)}${rng('N','ปุ๋ยไนโตรเจน','Nitrogen applied',0,30,1,st.N)}${rng('price','ราคาคาร์บอนเครดิต','Carbon credit price',50,1500,50,st.price)}</div>
    <div class="ctlrow">${seg('water', [['cf','ขังน้ำตลอด','Continuous flooding'],['sd','ระบายน้ำ 1 ครั้ง','Single drainage'],['awd','เปียกสลับแห้ง (AWD)','Alternate wetting and drying']], st.water)}
      ${seg('straw', [['burn','เผาฟาง','Burn straw'],['inc','ไถกลบฟาง','Plough straw in'],['bale','อัดฟางขาย','Bale and sell']], st.straw)}</div>
    <div class="two"><div><div data-o="bars"></div><div class="legend3"><span><i style="background:#2e86c1"></i>${L('มีเทนจากนาขังน้ำ','Methane from flooding')}</span><span><i style="background:#8e44ad"></i>${L('ไนตรัสออกไซด์จากปุ๋ย','N₂O from fertilizer')}</span><span><i style="background:#d35400"></i>${L('การเผาฟาง','Straw burning')}</span></div></div>
      <div><div data-o="chamber"></div><p class="note" data-o="chtxt"></p></div></div>
    <div class="kpi" data-o="kpi"></div>
    <div class="eq" data-o="eq"></div>
    <p class="note">${L('ค่าสัมประสิทธิ์ตามแนวทาง IPCC 2019','Factors from the IPCC 2019 Refinement')}<sup><a href="#r11">11</a></sup> ${L('(มีเทน 1.19 กก./เฮกตาร์/วัน ตัวคูณการจัดการน้ำ 1 / 0.71 / 0.55) ค่าการเผาฟาง ผลของการไถกลบฟาง และราคาเครดิตเป็นค่าประมาณ','(methane 1.19 kg/ha/day; water factors 1 / 0.71 / 0.55). Straw burning, straw incorporation effect and credit price are estimates')} ${INF()} ${L('งานภาคสนามพบเปียกสลับแห้งลดมีเทนราว 48%','Field work found AWD cuts methane about 48%')}<sup><a href="#r13">13</a></sup></p>`,
  (st, root) => {
    const ha = st.rai * .16, SFW = {cf:1, sd:.71, awd:.55}[st.water];
    const strawF = st.straw === 'inc' ? 1.3 : 1;  // fresh straw in the field raises methane
    const ch4 = 1.19 * SFW * strawF * st.days * ha;               // kg CH4
    const n2o = st.N * st.rai * .004 * 44 / 28;                  // kg N2O
    const strawDM = 650 * st.rai * .85, burnt = st.straw === 'burn' ? strawDM * .8 : 0;
    const bCH4 = burnt * 2.7 / 1000, bN2O = burnt * .07 / 1000;
    const e = {ch4: ch4 * 28, n2o: n2o * 265, burn: bCH4 * 28 + bN2O * 265};
    const tot = e.ch4 + e.n2o + e.burn;
    const base = 1.19 * strawF * st.days * ha * 28, awd = base * .55, cred = Math.max(0, (base - 1.19 * SFW * strawF * st.days * ha * 28)) / 1000;
    setOut(root, 'rai', `${st.rai} ${L('ไร่','rai')}`); setOut(root, 'days', `${st.days} ${L('วัน','days')}`); setOut(root, 'N', `${st.N} ${L('กก. N/ไร่','kg N/rai')}`); setOut(root, 'price', `${fmt(st.price)} ฿/tCO₂e`);
    const W = 360, H = 190, mx = Math.max(tot, 1);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('ก๊าซต่อฤดู','Emissions per season')}">`;
    const segs = [['ch4', '#2e86c1'], ['n2o', '#8e44ad'], ['burn', '#d35400']]; let x = 10;
    segs.forEach(([k, c]) => { const w = (W - 20) * e[k] / mx; s += `<rect x="${x}" y="40" width="${Math.max(0, w)}" height="40" fill="${c}"/>`; if (w > 40) s += `<text x="${x + w / 2}" y="65" text-anchor="middle" style="font:11px var(--mono);fill:#fff">${fmt(e[k] / tot * 100)}%</text>`; x += w });
    s += `<text x="10" y="28" style="font:600 13px var(--body);fill:var(--fg)">${L('รวม','Total')} ${fmt(tot / 1000, 1)} tCO₂e ${L('ต่อฤดู','per season')} · ${fmt(tot / st.rai)} kg/${L('ไร่','rai')}</text>`;
    // compare three water regimes
    [['cf', 1], ['sd', .71], ['awd', .55]].forEach(([k, f], i) => {
      const v = 1.19 * f * strawF * st.days * ha * 28 + e.n2o + e.burn, w = (W - 160) * v / Math.max(base + e.n2o + e.burn, 1);
      s += `<text x="10" y="${116 + i * 24}" style="font:11px var(--body);fill:var(--muted)">${[L('ขังตลอด','Flooded'), L('ระบาย 1 ครั้ง','1 drainage'), 'AWD'][i]}</text><rect x="100" y="${105 + i * 24}" width="${w}" height="14" rx="2" style="fill:${k === st.water ? 'var(--water)' : 'var(--line)'}"/><text x="${104 + w}" y="${116 + i * 24}" style="font:10.5px var(--mono);fill:var(--fg)">${fmt(v / 1000, 1)} t</text>`;
    });
    setOut(root, 'bars', s + '</svg>');
    // chamber: ppm rise over 0..30 min (chamber 1 m tall). 1 ppm CH4 ≈ 0.656 mg/m3
    const flux = 1.19 * SFW * strawF * 1e6 / 1e4 / 24;   // mg/m2/h
    const ppmH = flux / .656, pts = [0, 10, 20, 30].map(t => [t, 2 + ppmH * t / 60]);
    let c = `<svg viewBox="0 0 300 190" role="img" aria-label="${L('กล่องครอบวัดมีเทน','Methane chamber')}"><rect x="0" y="130" width="300" height="60" style="fill:var(--water);opacity:.25"/>`;
    c += `<rect x="20" y="40" width="90" height="100" rx="3" style="fill:none;stroke:var(--fg);stroke-width:2"/><rect x="14" y="128" width="102" height="8" style="fill:var(--muted)"/>`;
    for (let i = 0; i < 5; i++) c += `<path d="M${35 + i * 16} 130 q-3 -40 2 -70" style="stroke:#4f9a3c;stroke-width:2.5;fill:none"/>`;
    c += `<path d="M110 60 h20 v-30 h10" style="stroke:var(--fg);fill:none"/><circle cx="148" cy="30" r="8" style="fill:var(--surface);stroke:var(--fg)"/><text x="66" y="34" text-anchor="middle" style="font:10px var(--body);fill:var(--muted)">${L('กล่องครอบ','chamber')}</text>`;
    const X = t => 180 + t * 3.6, Y = p => 150 - (p - 2) / Math.max(ppmH * .5 + .5, 1) * 100;
    c += `<line x1="180" y1="150" x2="292" y2="150" style="stroke:var(--line)"/><line x1="180" y1="40" x2="180" y2="150" style="stroke:var(--line)"/>`;
    c += `<polyline points="${pts.map(([t, p]) => X(t) + ',' + Y(p)).join(' ')}" style="fill:none;stroke:#2e86c1;stroke-width:2"/>` + pts.map(([t, p]) => `<circle cx="${X(t)}" cy="${Y(p)}" r="4" fill="#2e86c1"/><text x="${X(t)}" y="166" text-anchor="middle" style="font:10px var(--mono);fill:var(--muted)">${t}</text>`).join('');
    c += `<text x="236" y="182" text-anchor="middle" style="font:10px var(--body);fill:var(--muted)">${L('นาที','minutes')}</text><text x="184" y="${Y(pts[3][1]) - 8}" style="font:10px var(--mono);fill:var(--fg)">${fmt(pts[3][1], 1)} ppm</text></svg>`;
    setOut(root, 'chamber', c);
    setOut(root, 'chtxt', L(`ในกล่องสูง 1 ม. มีเทนเพิ่มจาก ~2 ppm เป็น ${fmt(pts[3][1], 1)} ppm ใน 30 นาที ความชันนี้คิดเป็นฟลักซ์ ${fmt(flux, 1)} มก./ตร.ม./ชม. หรือ ${fmt(flux * 24 * 1.6, 0)} กรัม/ไร่/วัน`, `In a 1 m tall chamber, methane rises from ~2 ppm to ${fmt(pts[3][1], 1)} ppm in 30 minutes. That slope is a flux of ${fmt(flux, 1)} mg/m²/h, or ${fmt(flux * 24 * 1.6, 0)} g/rai/day`));
    setOut(root, 'kpi', `<div>${L('มีเทน','Methane')}<b>${fmt(ch4)} kg CH₄</b></div><div>${L('ไนตรัสออกไซด์','Nitrous oxide')}<b>${fmt(n2o, 1)} kg N₂O</b></div>
      <div>${L('ลดได้เทียบขังน้ำตลอด','Reduction vs continuous flooding')}<b>${fmt(cred, 2)} tCO₂e</b></div><div>${L('มูลค่าเครดิตโดยประมาณ','Approx. credit value')}<b>${fmt(cred * st.price)} ฿</b></div>`);
    setOut(root, 'eq', `CH₄ = 1.19 × ${SFW} × ${strawF} × ${st.days} ${L('วัน','d')} × ${fmt(ha, 2)} ha = ${fmt(ch4)} kg · N₂O = ${st.N} × ${st.rai} × 0.004 × 44/28 = ${fmt(n2o, 2)} kg · CO₂e = CH₄×28 + N₂O×265`);
  });
}

/* ================= 7. five-year transition: keep the old crop running while changing ================= */
function sim7(){
  Sim('sim7', {rai:20, share:20, buyer:true, bridge:false, test:true}, st => head(
      'เปลี่ยนผ่านทีละส่วน: รายได้ครัวเรือน 8 ปี', 'Change one part at a time: household income over 8 years',
      'ตัวอย่างครัวเรือนต้นน้ำปลูกข้าวโพด เลือกสัดส่วนพื้นที่ที่เปลี่ยนเป็นกาแฟหรือไม้ผลใต้ร่มไม้ทุกปีตั้งแต่ปีที่ 2 แล้วดูว่ารายได้ตกช่วงไหน และต้องมีตัวช่วยอะไร',
      'An upstream maize household. Choose how much land moves to shade coffee or fruit trees each year from year 2, and see when income dips and what support is needed.') +
    `<div class="ctlrow">${rng('rai','พื้นที่ทั้งหมด','Total land',5,50,1,st.rai)}${rng('share','เปลี่ยนต่อปี (ตั้งแต่ปีที่ 2)','Converted per year (from year 2)',0,40,5,st.share)}</div>
    <div class="ctlrow">${chk('test','ปีที่ 1: ตรวจดิน ใส่ปุ๋ยตามค่าวิเคราะห์ เลิกเผา','Year 1: soil test, fertilize by results, stop burning',st.test)}${chk('buyer','มีผู้รับซื้อแน่นอน (ราคากาแฟ/ผลไม้ไม่ตก)','Guaranteed buyer (coffee/fruit price holds)',st.buyer)}${chk('bridge','มีเงินทุนช่วงรอผลผลิต (ปีที่ 2–4)','Bridge funding while trees mature (years 2–4)',st.bridge)}</div>
    <div class="pane" data-o="chart"></div>
    <div class="legend3"><span><i style="background:var(--muted)"></i>${L('ปลูกข้าวโพดแบบเดิมต่อ','Keep growing maize')}</span><span><i style="background:var(--leaf)"></i>${L('เส้นทางเปลี่ยนผ่าน','Transition path')}</span></div>
    <div class="kpi" data-o="kpi"></div>
    <p class="msg" data-o="msg"></p>
    <p class="note">${L('ตัวเลขรายได้ต่อไร่เป็นค่าประมาณเพื่อดูรูปแบบ ไม่ใช่ข้อมูลน่าน: ข้าวโพดกำไร ~1,500 บาท/ไร่/ปี ค่าตั้งต้นกาแฟใต้ร่มไม้ ~6,000 บาท/ไร่ ให้ผลเต็มที่ปีที่ 5 ~8,000 บาท/ไร่/ปี','Per-rai figures are rough, to show the pattern, not Nan data: maize profit ~1,500 THB/rai/yr; shade coffee setup ~6,000 THB/rai; full yield from year 5, ~8,000 THB/rai/yr')} ${INF()}</p>`,
  (st, root) => {
    setOut(root, 'rai', `${st.rai} ${L('ไร่','rai')}`); setOut(root, 'share', `${st.share}%`);
    const Y = 8, maize = 1500 + (st.test ? 300 : 0), setup = 6000, ramp = [0, 0, .3, .7, 1, 1, 1, 1], tree = 8000 * (st.buyer ? 1 : .65);
    const base = [], path = [], conv = [];
    let converted = 0; const cohorts = [];
    for (let y = 1; y <= Y; y++){
      let add = 0;
      if (y >= 2){ add = Math.min(st.rai - converted, st.rai * st.share / 100); converted += add; cohorts.push([y, add]) }
      const m = (st.rai - converted) * (y === 1 ? maize : maize);
      const t = cohorts.reduce((a, [y0, ar]) => a + ar * tree * ramp[y - y0], 0);
      const cost = add * setup, bridge = st.bridge && y >= 2 && y <= 4 ? 25000 : 0;
      base.push([y, st.rai * 1500 / 1000]); path.push([y, (m + t - cost + bridge) / 1000]); conv.push(converted);
    }
    const all = base.concat(path).map(p => p[1]), lo = Math.min(0, ...all), hi = Math.max(...all) * 1.1;
    const shift = -lo;
    setOut(root, 'chart', lineChart([{c:css('--muted'), pts:base.map(([x, y]) => [x, y + shift]), dash:true}, {c:css('--leaf'), wd:3, pts:path.map(([x, y]) => [x, y + shift])}],
      {w:640, h:220, xmax:8.4, ymax:hi + shift, xticks:path.map(([x]) => [x, L('ปี ', 'Y') + x]), aria:L('รายได้ต่อปี','Income per year'), dots:path.map(([x, y]) => [x, y + shift, y < 0 ? css('--warn') : css('--leaf')])})
      .replace(/>(-?[\d,.]+)<\/text>/g, (m0, v) => { const n = parseFloat(v.replace(/,/g, '')); return isNaN(n) ? m0 : '>' + fmt(n - shift) + 'k</text>' }));
    const low = path.reduce((a, p) => p[1] < a[1] ? p : a), cum = (arr, n) => arr.slice(0, n).reduce((a, p) => a + p[1], 0);
    let cross = null; for (let n = 1; n <= Y; n++) if (cum(path, n) >= cum(base, n) && n > 1){ cross = n; break }
    setOut(root, 'kpi', `<div>${L('ปีที่รายได้ต่ำสุด','Lowest-income year')}<b>${L('ปี ','Year ') + low[0]}: ${fmt(low[1] * 1000)} ฿</b></div>
      <div>${L('พื้นที่เปลี่ยนแล้วปีที่ 8','Converted by year 8')}<b>${fmt(conv[Y - 1])} / ${st.rai} ${L('ไร่','rai')}</b></div>
      <div>${L('รายได้สะสมแซงแบบเดิมในปี','Cumulative income overtakes maize in')}<b>${cross ? L('ปี ','Year ') + cross : L('ยังไม่แซงใน 8 ปี','not within 8 years')}</b></div>
      <div>${L('รายได้ปีที่ 8','Year 8 income')}<b>${fmt(path[Y - 1][1] * 1000)} ฿</b></div>`);
    const msg = out(root, 'msg');
    if (low[1] < 0){ msg.className = 'msg bad'; msg.textContent = L('ครัวเรือนติดลบในช่วงที่ต้นไม้ยังไม่ให้ผล ถ้าไม่มีเงินทุนช่วงรอ ครัวเรือนมักกลับไปปลูกข้าวโพดเต็มพื้นที่ ลองลดสัดส่วนต่อปีหรือเปิดเงินทุนช่วงรอ', 'The household goes negative while trees are not yet bearing. Without bridge funding, families usually go back to full maize. Try a smaller yearly share or turn on bridge funding.') }
    else if (!st.buyer){ msg.className = 'msg'; msg.textContent = L('ไม่มีผู้รับซื้อแน่นอน รายได้จากไม้ผลและกาแฟต่ำกว่าที่คาดราวหนึ่งในสาม การเปลี่ยนผ่านคุ้มช้าลงมาก', 'Without a guaranteed buyer, coffee and fruit income is about a third lower, so the change pays off much later.') }
    else { msg.className = 'msg good'; msg.textContent = L('รายได้ไม่ติดลบระหว่างทาง และเมื่อต้นไม้ให้ผลเต็มที่ รายได้ต่อปีสูงกว่าข้าวโพด พร้อมลดการชะล้างหน้าดินและการเผาบนที่ลาดชัน', 'Income stays positive along the way, and once trees bear fully, yearly income beats maize, while slope erosion and burning drop.') }
  });
}

function init(){ sim4(); sim6(); sim7() }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
