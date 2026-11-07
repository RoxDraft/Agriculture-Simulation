/* "Plot to Plant": a farm-management game with a daily soil, water and crop model.
   State lives in S and is saved in this browser (localStorage). Everything is redrawn from S after each action or day. */
(function(){
const D = window.GAME_DATA, CH = window.CHAIN;
const {RAI, M3_PER_MM, CLIMATE, ZONES, CROPS, ITEMS, PROCS, BUYERS, INPUTS, UPGRADES, OPS} = D;
const KEY = 'agrisim.game.v1';
const START = Date.UTC(2026, 4, 1);           // day 0 = 1 May 2026, start of the rainy season
const START_CASH = 80000;
const $ = id => document.getElementById(id);
let LANG = null;                                   // set while writing a log line in both languages
const cur = () => LANG || I18N.lang;
const T = p => (cur() === 'en' ? p[1] : p[0]);
const t = (th, en) => (cur() === 'en' ? en : th);
const fmt = (n, d = 0) => Number(n).toLocaleString(cur() === 'en' ? 'en-US' : 'th-TH', {minimumFractionDigits:d, maximumFractionDigits:d});
const baht = n => fmt(Math.round(n)) + t(' บาท', ' THB');
const tons = n => (n >= 10 ? fmt(n, 1) : n >= 1 ? fmt(n, 2) : fmt(n, 3)) + t(' ตัน', ' t');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- random numbers: weather is a pure function of (seed, day) so the forecast is honest ---------- */
function hash(a){ a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296 }
const rnd = (...k) => hash(k.reduce((s, v) => Math.imul(s ^ (v | 0), 2654435761) + 0x9E3779B9 | 0, S ? S.seed : 7));
let rngN = 0; const rand = () => rnd(S.day, 99991, rngN++);

/* ---------- dates ---------- */
const MTH = [['ม.ค.','Jan'],['ก.พ.','Feb'],['มี.ค.','Mar'],['เม.ย.','Apr'],['พ.ค.','May'],['มิ.ย.','Jun'],['ก.ค.','Jul'],['ส.ค.','Aug'],['ก.ย.','Sep'],['ต.ค.','Oct'],['พ.ย.','Nov'],['ธ.ค.','Dec']];
const dateOf = d => new Date(START + d * 864e5);
const monthOf = d => dateOf(d).getUTCMonth() + 1;
function dstr(d, short){
  const x = dateOf(d), m = MTH[x.getUTCMonth()];
  return cur() === 'en' ? `${x.getUTCDate()} ${m[1]}${short ? '' : ' ' + x.getUTCFullYear()}` : `${x.getUTCDate()} ${m[0]}${short ? '' : ' ' + (x.getUTCFullYear() + 543)}`;
}

/* ---------- weather ---------- */
function weather(d){
  const x = dateOf(d), m = x.getUTCMonth(), dim = new Date(Date.UTC(x.getUTCFullYear(), m + 1, 0)).getUTCDate();
  const yr = 0.75 + 0.5 * rnd(x.getUTCFullYear(), 31337);              // dry or wet year
  const z = ZONES[S.zone], p = CLIMATE.days[m] / dim, mean = CLIMATE.rain[m] / Math.max(1, CLIMATE.days[m]);
  let rain = 0;
  if (rnd(d, 1) < p * (0.6 + 0.4 * yr)) rain = -Math.log(1 - rnd(d, 2) * 0.999) * mean * yr * z.rainMul;
  return { rain: Math.round(rain), et0: CLIMATE.et0[m] * (0.85 + 0.3 * rnd(d, 3)) * (rain > 5 ? 0.7 : 1) };
}
function forecast(d){ const w = weather(d), k = d - S.day, err = k <= 1 ? 0 : (rnd(d, 4) - 0.5) * 0.25 * k; return Math.max(0, Math.round(w.rain * (1 + err))) }

/* ---------- state ---------- */
let S = null;
function newPlot(i, z){ const s = ZONES[z].start; return { id:i, open:i < 6, ph:s.ph, om:s.om, N:s.N, P:s.P, K:s.K, w:ZONES[z].awc * 0.6, pond:0, tilled:false, crop:null, residue:null } }
function newGame(zone){
  S = { v:1, zone, seed:(Math.random() * 1e9) | 0, day:0, cash:START_CASH, loan:0, rep:0,
    plots:[0,1,2,3,4,5,6,7].map(i => newPlot(i, zone)), store:{}, queue:{}, owned:{}, up:{},
    pond:{cap: ZONES[zone].water.kind === 'pond' ? ZONES[zone].water.cap : 0, v: ZONES[zone].water.kind === 'pond' ? ZONES[zone].water.start : 0},
    quotaUsed:0, flood:0, rainHist:[], px:{}, orders:[], nextId:1, compost:0,
    env:{ nWater:0, nAir:0, sed:0, burnt:0, water:0, spray:0, jobs:0, byGen:0, byUsed:0, delivered:0, spoiled:0 },
    led:{ inc:0, exp:0, cat:{} }, goals:{}, log:[], sel:0, harvests:[] };
  Object.keys(ITEMS).forEach(k => S.px[k] = 1);
  for (let i = 0; i < 3; i++) makeOrder(true);
  log(() => t(`เริ่มไร่ที่${T(ZONES[zone].n)} มีเงินทุน ${baht(START_CASH)} และที่ดิน 6 แปลง (12 ไร่)`, `Started a farm in the ${T(ZONES[zone].n)} with ${baht(START_CASH)} and 6 plots (12 rai)`), 'ok');
  save();
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) {} }
function load(){ try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1 && ZONES[s.zone]) return s } catch (e) {} return null }

const listeners = [];                              // the 3D view listens here to animate activity
function emit(type, d){ listeners.forEach(f => { try { f(type, d) } catch (e) {} }) }
function log(fn, kind){ const m = {}; ['th','en'].forEach(l => { LANG = l; m[l] = typeof fn === 'function' ? fn() : fn }); LANG = null; S.log.unshift({d:S.day, m, k:kind || ''}); if (S.log.length > 80) S.log.length = 80 }
function pay(n, cat){ S.cash -= n; S.led.exp += n; S.led.cat[cat] = (S.led.cat[cat] || 0) - n }
function earn(n, cat){ S.cash += n; S.led.inc += n; S.led.cat[cat] = (S.led.cat[cat] || 0) + n }
function afford(n){ if (S.cash >= n) return true; toast(t(`เงินไม่พอ ต้องใช้ ${baht(n)} (กู้ ธ.ก.ส. ได้ในแท็บการเงิน)`, `Not enough cash: ${baht(n)} needed (you can borrow in the Finance tab)`), 'bad'); return false }
function addStore(k, q){ S.store[k] = (S.store[k] || 0) + q }

/* ---------- crop model helpers ---------- */
const U = p => 1 / (1 + Math.exp(-9 * (p - 0.42)));                     // cumulative nutrient uptake curve
const U0 = U(0), U1 = U(1), Un = p => (U(clamp(p, 0, 1)) - U0) / (U1 - U0);
function progress(pl){ const c = pl.crop, cr = CROPS[c.id]; if (cr.perennial) return c.age < cr.first ? c.age / cr.first : seasonP(c); return c.age / cr.days }
function seasonP(c){ return clamp(c.sAge / 280, 0, 1) }               // perennial: this season's fruit, counted from 1 February
function stageOf(pl){
  const c = pl.crop, cr = CROPS[c.id];
  if (cr.perennial && c.age < cr.first) return ['ต้นกล้ากำลังตั้งตัว (ยังไม่ให้ผล)', 'Young trees establishing (no crop yet)'];
  if (ready(pl)) return ['พร้อมเก็บเกี่ยว', 'Ready to harvest'];
  const p = progress(pl);
  return p < 0.1 ? ['งอกและตั้งตัว','Germinating and establishing'] : p < 0.45 ? ['เจริญทางลำต้นและใบ','Vegetative growth'] : p < 0.75 ? ['ออกดอก สร้างผลผลิต (ไวต่อการขาดน้ำที่สุด)','Flowering and yield formation (most sensitive to drought)'] : ['สุกแก่ สะสมแป้ง/น้ำตาล','Ripening and filling'];
}
function ready(pl){
  const c = pl.crop; if (!c) return false; const cr = CROPS[c.id];
  if (cr.perennial) return c.age >= cr.first && cr.ripe.includes(monthOf(S.day)) && !c.picked;
  return c.age >= (cr.early || cr.days);
}
function kc(pl){
  if (!pl.crop) return pl.residue ? 0.25 : 0.35;
  const cr = CROPS[pl.crop.id], p = cr.perennial ? 0.6 : progress(pl);
  return p < 0.15 ? cr.kc[0] : p < 0.75 ? cr.kc[0] + (cr.kc[1] - cr.kc[0]) * Math.min(1, (p - 0.15) / 0.25) : cr.kc[2];
}
function cover(pl){ if (!pl.crop) return pl.residue ? 0.4 : 0; const cr = CROPS[pl.crop.id]; return cr.perennial ? 0.8 : clamp(progress(pl) / 0.4, 0, 0.95) }
function factors(pl){
  const c = pl.crop, cr = CROPS[c.id], z = S.zone;
  const W = c.wc ? c.ws / c.wc : 1;
  const FLOOR = [0.35, 0.5, 0.6];   // yield left when a nutrient is missing entirely (N hurts most, K least)
  const nut = i => c.dem[i] > 0.01 ? FLOOR[i] + (1 - FLOOR[i]) * clamp(c.got[i] / c.dem[i], 0, 1) : 1;
  const ph = c.phn ? c.phs / c.phn : pl.ph, [lo, hi] = cr.ph;
  const P = ph < lo ? 1 - 0.2 * (lo - ph) : ph > hi ? 1 - 0.2 * (ph - hi) : 1;
  let age = 1;
  if (cr.early) age = clamp(0.62 + 0.38 * (c.age - cr.early) / (cr.days - cr.early), 0.62, 1 + Math.min(0.12, Math.max(0, c.age - cr.days) / 600));
  const ratoon = c.ratoon ? Math.pow(cr.ratoon, c.ratoon) : 1;
  return { W:clamp(W, 0.05, 1), N:nut(0), P:nut(1), K:nut(2), pH:clamp(P, 0.4, 1), pest:1 - c.loss, suit:cr.suit[z], age, ratoon };
}
function yieldOf(pl){
  const f = factors(pl), cr = CROPS[pl.crop.id];
  return cr.ymax * f.suit * f.W * Math.min(f.N, f.P, f.K) * f.pH * f.pest * f.age * f.ratoon * RAI;
}
function limiting(f){
  const L = [['W', t('น้ำ','water')], ['N', t('ไนโตรเจน','nitrogen')], ['P', t('ฟอสฟอรัส','phosphorus')], ['K', t('โพแทสเซียม','potassium')], ['pH', 'pH'], ['pest', t('ศัตรูพืช','pests')]];
  return L.reduce((a, b) => f[b[0]] < f[a[0]] ? b : a);
}

/* ---------- water ---------- */
function allowance(){ const w = ZONES[S.zone].water; if (w.kind === 'pond') return w.creek; return [1,2,3,4].includes(monthOf(S.day)) ? w.dry : w.wet }
function waterLeft(){ return Math.max(0, allowance() - S.quotaUsed) + S.pond.v }
function pumpCost(){ return S.up.solar ? 0.05 : ZONES[S.zone].water.kind === 'pond' ? 0.4 : ZONES[S.zone].water.cost }
function takeWater(m3){
  const a = Math.max(0, allowance() - S.quotaUsed), fromA = Math.min(a, m3), fromP = Math.min(S.pond.v, m3 - fromA);
  S.quotaUsed += fromA; S.pond.v -= fromP; return fromA + fromP;
}
function irrigate(pl, mm, auto){
  const cr = pl.crop && CROPS[pl.crop.id], flood = cr && cr.pond;
  const eff = flood ? 0.7 : S.up.drip ? 0.9 : 0.6, need = mm / eff * M3_PER_MM;
  const got = takeWater(need); if (got < 1) { if (!auto) toast(t('วันนี้ไม่มีน้ำเหลือให้สูบแล้ว (โควตาหรือสระหมด)', 'No water left today (quota or pond used up)'), 'bad'); return 0 }
  const cost = got * pumpCost(); pay(cost, 'water'); S.env.water += got; emit('water', {plot:pl.id, m3:got});
  let add = got / M3_PER_MM * eff, z = ZONES[S.zone];
  const room = z.awc - pl.w; if (add <= room) pl.w += add; else { pl.w = z.awc; if (flood) pl.pond = Math.min(150, pl.pond + add - room) }
  if (!auto) log(() => t(`แปลง ${pl.id + 1}: ให้น้ำ ${fmt(got)} ลบ.ม. ถึงรากราว ${fmt(add)} มม.`, `Plot ${pl.id + 1}: irrigated ${fmt(got)} m³, about ${fmt(add)} mm reached the roots`));
  return got;
}

/* ---------- one day ---------- */
function step(){
  rngN = 0;
  const z = ZONES[S.zone], wx = weather(S.day), m = monthOf(S.day), evs = [];
  S.rainHist.push(wx.rain); if (S.rainHist.length > 12) S.rainHist.shift();
  // ponds collect runoff from about 0.3 ha and lose evaporation
  if (S.pond.cap) S.pond.v = clamp(S.pond.v + wx.rain * 3000 * 0.25 / 1000 - wx.et0 * 0.4, 0, S.pond.cap);
  // flooding in the lowland
  if (z.flood) {
    const r = S.rainHist.reduce((a, b) => a + b, 0);
    if (!S.flood && [8,9,10].includes(m) && r > 165) { S.flood = 450; evs.push(t('🌊 น้ำหลากเข้าที่ลุ่ม!', '🌊 Floodwater is entering the lowland!')); log(() => t('น้ำหลากจากต้นน้ำเข้าท่วมที่ลุ่ม', 'Flood from upstream is covering the lowland'), 'bad') }
    else S.flood = Math.max(0, S.flood - 30);
  }
  S.quotaUsed = 0;
  S.plots.forEach(pl => { if (pl.open) dayPlot(pl, wx, m, evs) });
  // store spoilage and processing queues
  Object.keys(S.store).forEach(k => { const lost = S.store[k] * ITEMS[k].spoil; if (lost > 0) { S.store[k] -= lost; S.env.spoiled += lost } if (S.store[k] < 0.0005) delete S.store[k] });
  Object.keys(S.queue).forEach(k => {
    const pr = PROCS[k], q = S.queue[k]; if (!q) return;
    const tt = Math.min(q, pr.cap); runProc(k, tt, pr.run); S.queue[k] -= tt;
    if (S.queue[k] < 0.001) { delete S.queue[k]; evs.push(t(`${T(pr.n)} แปรรูปเสร็จแล้ว`, `${T(pr.n)} finished its batch`)) }
  });
  if (S.loan) S.loan *= 1 + 0.07 / 365;
  // prices drift weekly; harvest gluts lower farm-gate prices
  if (S.day % 7 === 0) Object.keys(S.px).forEach(k => S.px[k] = clamp(S.px[k] * (0.97 + 0.06 * rand()), 0.85, 1.18));
  // orders
  S.orders = S.orders.filter(o => { if (o.due < S.day) { log(() => t(`คำสั่งซื้อจาก${T(byId(o.buyer).n)} หมดเวลา`, `Order from ${T(byId(o.buyer).n)} expired`), 'warn'); return false } return true });
  if (S.orders.length < 6 && rand() < 0.22) makeOrder();
  S.day++;
  if (S.day % 5 === 0) save();
  return evs;
}
function dayPlot(pl, wx, m, evs){
  const z = ZONES[S.zone], c = pl.crop, cr = c && CROPS[c.id];
  let rain = wx.rain;
  // runoff and erosion on slopes
  if (z.slope && rain > 0) {
    const cov = cover(pl), run = rain * (0.1 + 0.25 * (1 - cov)) * (S.up.contour ? 0.5 : 1);
    rain -= run;
    if (rain > 30) {
      const soil = (wx.rain - 30) * 0.03 * (1 - cov) * (pl.tilled ? 1.6 : 1) * (S.up.contour ? 0.3 : 1);
      pl.om = Math.max(0.3, pl.om - soil * 0.004); pl.P = Math.max(0, pl.P - soil * 0.25); S.env.sed += soil * RAI;
    }
  }
  pl.w += rain;
  if (S.flood > 0) pl.pond = Math.max(pl.pond, S.flood * (S.up.dike ? 0.3 : 1));
  // automatic watering with sensors
  if (S.up.sensor && c) {
    if (cr.pond) { if (pl.pond < 20 && progress(pl) < 0.85) irrigate(pl, 40, true) }
    else if (pl.w / z.awc < 0.45 && !ready(pl)) irrigate(pl, 25, true);
  }
  // evapotranspiration: standing water first, then the root zone
  let et = wx.et0 * kc(pl);
  const fromPond = Math.min(pl.pond, et); pl.pond -= fromPond; et -= fromPond;
  pl.w = Math.max(0, pl.w - et * (pl.w / z.awc < 0.3 ? pl.w / z.awc / 0.3 : 1));
  // drainage and leaching
  if (pl.w > z.awc) {
    const ex = pl.w - z.awc; pl.w = z.awc;
    if (cr && cr.pond) { pl.pond = Math.min(150, pl.pond + ex) }
    else {
      const leach = pl.N * Math.min(0.5, ex / (z.awc * (z.sand ? 1.2 : 3)));
      pl.N -= leach; S.env.nWater += leach * RAI;
      if (!z.sand && ex > 25) pl.pond += ex * 0.3;
    }
  }
  if (pl.pond > 0) pl.pond = Math.max(0, pl.pond - (cr && cr.pond ? (z.sand ? 8 : 3) : 35));
  // soil organic matter: decomposition feeds nitrogen
  const moist = clamp(pl.w / z.awc, 0.2, 1);
  pl.N += pl.om * 0.0114 * moist * (pl.tilled ? 1.4 : 1);
  pl.P += pl.om * 0.0012 * moist;                    // organic P and slow release from the soil's fixed pool
  pl.K += z.sand ? 0.01 : 0.025;                      // potassium weathering out of clay minerals
  pl.om = Math.max(0.3, pl.om * (1 - (pl.tilled ? 0.05 : 0.03) / 365 * moist));
  pl.ph -= (z.sand ? 0.15 : 0.08) / 365;
  if (pl.ph < 5.3 || pl.ph > 7.6) pl.P *= 0.998;   // phosphorus locked up in very acid or alkaline soil
  if (!c) return;
  // crop growth
  c.age++;
  if (cr.perennial) {   // a new fruiting season starts every 1 February; unpicked cherries from the last one are lost
    const dt = dateOf(S.day);
    if (dt.getUTCMonth() === 1 && dt.getUTCDate() === 1) { c.sAge = 0; c.picked = false; c.told = false; c.ws = c.wc = 0; c.dem = [0,0,0]; c.got = [0,0,0]; c.phs = c.phn = 0; c.loss = 0 }
    else c.sAge = (c.sAge || 0) + 1;
  }
  const p = progress(pl), est = cr.perennial && c.age < cr.first;
  // waterlogging
  if (cr.pond ? pl.pond > 250 : pl.pond > 20) {   // rice survives standing water but not a week fully submerged
    c.wlog = (c.wlog || 0) + 1;
    if (c.wlog > (cr.pond ? 7 : cr.wlog) && !est && !cr.perennial && p < 0.9) { evs.push(t(`แปลง ${pl.id + 1}: ${T(cr.n)} จมน้ำนานเกินไป ตายหมด`, `Plot ${pl.id + 1}: ${T(cr.n)} drowned`)); log(() => t(`แปลง ${pl.id + 1}: ${T(cr.n)} ตายเพราะน้ำขัง ${c.wlog} วัน`, `Plot ${pl.id + 1}: ${T(cr.n)} died after ${c.wlog} days under water`), 'bad'); pl.crop = null; pl.residue = null; return }
  } else c.wlog = 0;
  // water stress, weighted toward flowering
  const rel = pl.w / z.awc;
  let wf = cr.pond ? (pl.pond > 0 ? 1 : rel >= 0.8 ? 0.9 : Math.max(0.05, rel / 0.8 * 0.9)) : (rel >= 0.5 ? 1 : Math.max(0.05, rel / 0.5));
  if (!cr.pond && pl.pond > 20) wf = Math.min(wf, 0.3);
  if (!est && !ready(pl)) { const wt = p > 0.45 && p < 0.75 ? 2.2 : 1; c.ws += wf * wt; c.wc += wt }
  // nutrient uptake follows an S-curve toward the target yield
  if (!est && !ready(pl)) {
    const p0 = cr.perennial ? clamp((c.sAge - 1) / 280, 0, 1) : (c.age - 1) / cr.days;
    const share = Un(p) - Un(p0), target = cr.ymax * cr.suit[S.zone];
    ['N','P','K'].forEach((k, i) => { const d = cr.npk[i] * target * share * (0.6 + 0.4 * wf), g = Math.min(pl[k], d); pl[k] -= g; c.dem[i] += d; c.got[i] += g });
    c.phs += pl.ph; c.phn++;
  }
  // pests and natural enemies
  const inSeason = cr.pest.months.includes(m) ? 1 : 0.25;
  c.pest = c.pest * 0.965 + cr.pest.base * inSeason * (1 + Math.max(0, pl.N - 18) / 15) * (1 - c.en / 140) * (est ? 0.3 : 1);
  c.en = Math.min(100, c.en + 0.35 + (S.env.spray && c.sprayed ? 0 : 0.15));
  if (c.pest > 40) c.loss = Math.min(0.6, c.loss + (c.pest - 40) / 5000);
  if (c.pest > 50 && !c.pestWarned) { c.pestWarned = true; evs.push(t(`แปลง ${pl.id + 1}: ${T(cr.pest.n)} ระบาด`, `Plot ${pl.id + 1}: ${T(cr.pest.n)} outbreak`)) }
  if (c.pest < 30) c.pestWarned = false;
  // ripe crops left too long lose yield
  if (!cr.perennial && c.age > cr.days + cr.win) c.loss = Math.min(0.8, c.loss + 0.006);
  if (ready(pl) && !c.told) { c.told = true; evs.push(t(`แปลง ${pl.id + 1}: ${T(cr.n)} พร้อมเก็บเกี่ยว`, `Plot ${pl.id + 1}: ${T(cr.n)} is ready to harvest`)) }
}

/* ---------- plot actions ---------- */
function plow(pl){
  const cost = OPS.plow * RAI; if (!afford(cost)) return;
  pay(cost, 'ops');
  if (pl.residue) { incorporate(pl); }
  if (pl.crop) log(() => t(`แปลง ${pl.id + 1}: ไถรื้อ${T(CROPS[pl.crop.id].n)}ทิ้ง`, `Plot ${pl.id + 1}: ploughed out the ${T(CROPS[pl.crop.id].n)}`), 'warn');
  pl.crop = null; pl.tilled = true; S.env.jobs += 0.3 * RAI;
  log(() => t(`แปลง ${pl.id + 1}: เตรียมดิน (${baht(cost)})`, `Plot ${pl.id + 1}: prepared the soil (${baht(cost)})`));
}
function incorporate(pl){
  const r = pl.residue, perRai = r.t / RAI;
  pl.om += perRai * 0.035; pl.K += perRai * 9; pl.N += perRai * 2;
  log(() => t(`แปลง ${pl.id + 1}: ไถกลบเศษพืช ${tons(r.t)} อินทรียวัตถุเพิ่ม`, `Plot ${pl.id + 1}: ploughed in ${tons(r.t)} of residue, organic matter up`), 'ok');
  S.env.byUsed += r.t; pl.residue = null;
}
function plant(pl, id){
  const cr = CROPS[id], cost = cr.seed * RAI;
  if (!pl.tilled) { toast(t('ต้องเตรียมดินก่อนปลูก', 'Prepare the soil before planting'), 'bad'); return }
  if (!afford(cost)) return;
  pay(cost, 'seed');
  pl.crop = { id, age:0, sAge:0, ws:0, wc:0, dem:[0,0,0], got:[0,0,0], phs:0, phn:0, pest:2, en:30, loss:0, ratoon:0 };
  pl.tilled = false; pl.residue = null; S.env.jobs += (id === 'cane' ? 3 : id === 'coffee' ? 6 : 1) * RAI;
  S.goals.plant = true;
  log(() => t(`แปลง ${pl.id + 1}: ปลูก${T(cr.n)} (${baht(cost)})`, `Plot ${pl.id + 1}: planted ${T(cr.n)} (${baht(cost)})`), 'ok');
}
function fertilize(pl, k){
  const f = INPUTS[k], z = ZONES[S.zone];
  let kg = f.kg * RAI, cost = kg * f.price, fromCompost = 0;
  if (k === 'manure' && S.compost > 0) { fromCompost = Math.min(S.compost, kg / 1000); cost -= fromCompost * 1000 * f.price; S.compost -= fromCompost }
  if (!afford(cost)) return;
  pay(cost, 'fert'); emit('fert', {plot:pl.id, kind:k});
  const per = f.kg;
  if (f.N) {
    let n = per * f.N, lossShare = 0;
    if (k === 'urea' || k === 'npk') lossShare = pl.pond > 0 || pl.w / z.awc < 0.3 ? 0.35 : 0.2;   // ammonia volatilisation
    if (f.slow) lossShare = 0.8;                                                                   // most compost N comes slowly through organic matter
    pl.N += n * (1 - lossShare); if (!f.slow) S.env.nAir += n * lossShare * RAI;
  }
  if (f.P) pl.P += per * f.P * (f.slow ? 0.6 : 1);
  if (f.K) pl.K += per * f.K * (f.slow ? 0.6 : 1);
  if (f.om) pl.om += f.om * per / 1000;
  if (f.lime) pl.ph += per * f.lime / z.buffer;
  if (f.acid) pl.ph -= per * f.N * f.acid / z.buffer;
  S.env.jobs += (f.slow ? 1 : 0.1) * RAI;
  log(() => t(`แปลง ${pl.id + 1}: ใส่${T(f.n)} ${fmt(per)} กก./ไร่ (${baht(cost)})${fromCompost ? ` ใช้ปุ๋ยหมักของไร่เอง ${tons(fromCompost)}` : ''}`, `Plot ${pl.id + 1}: applied ${T(f.n)} ${fmt(per)} kg/rai (${baht(cost)})${fromCompost ? `, using ${tons(fromCompost)} of your own compost` : ''}`));
}
function protect(pl, bio){
  const c = pl.crop, cost = (bio ? OPS.bio : OPS.spray) * RAI; if (!afford(cost)) return;
  pay(cost, 'pest');
  if (bio) { c.en = Math.min(100, c.en + 35); c.pest *= 0.8 }
  else { c.pest *= 0.15; c.en *= 0.1; c.sprayed = true; S.env.spray++ }
  emit(bio ? 'bio' : 'spray', {plot:pl.id});
  log(() => bio ? t(`แปลง ${pl.id + 1}: ปล่อยแตนเบียน/ใช้ชีวภัณฑ์`, `Plot ${pl.id + 1}: released parasitoids / bio-control`) : t(`แปลง ${pl.id + 1}: พ่นสารฆ่าแมลง (ศัตรูธรรมชาติตายด้วย)`, `Plot ${pl.id + 1}: sprayed insecticide (natural enemies die too)`), bio ? 'ok' : 'warn');
}
function harvest(pl){
  if (!ready(pl)) return;
  const c = pl.crop, cr = CROPS[c.id], f = factors(pl), y = yieldOf(pl);
  const cost = cr.cutPerT ? y * cr.cutPerT : cr.harvest * RAI;
  if (!afford(cost)) return;
  pay(cost, 'harvest');
  addStore(cr.raw, y); emit('harvest', {plot:pl.id, crop:c.id, item:cr.raw, t:y});
  const lim = limiting(f);
  S.harvests.unshift({ d:S.day, plot:pl.id, crop:c.id, y, perRai:y / RAI, f, lim:lim[0] }); if (S.harvests.length > 20) S.harvests.length = 20;
  S.env.jobs += (c.id === 'cassava' ? 8 : c.id === 'coffee' ? 12 : c.id === 'cane' ? y / 1.5 / RAI : 0.6) * RAI;
  S.goals.harvest = true;
  log(() => t(`แปลง ${pl.id + 1}: เก็บ${T(cr.n)}ได้ ${tons(y)} (${fmt(y / RAI * 1000)} กก./ไร่) ปัจจัยจำกัดหลักคือ${limiting(f)[1]}`, `Plot ${pl.id + 1}: harvested ${tons(y)} of ${T(cr.n)} (${fmt(y / RAI * 1000)} kg/rai); the main limit was ${limiting(f)[1]}`), 'ok');
  if (cr.resid.item) { pl.residue = { item:cr.resid.item, t:y * cr.resid.t }; S.env.byGen += pl.residue.t }
  if (cr.perennial) { c.picked = true }
  else if (cr.ratoon) { c.ratoon++; c.age = 0; c.ws = c.wc = 0; c.dem = [0,0,0]; c.got = [0,0,0]; c.phs = c.phn = 0; c.loss = 0; c.told = false; c.pest = 2;
    log(() => t(`แปลง ${pl.id + 1}: ตออ้อยแตกหน่อใหม่ (อ้อยตอ ${c.ratoon}) ผลผลิตจะลดลงราว 15% ต่อรอบ`, `Plot ${pl.id + 1}: the cane stool regrows (ratoon ${c.ratoon}); expect about 15% less each round`)) }
  else { pl.crop = null }
}
function residue(pl, how){
  const r = pl.residue; if (!r) return;
  if (how === 'burn') {
    const perRai = r.t / RAI; pl.K += perRai * 7; pl.om = Math.max(0.3, pl.om - 0.01);
    S.env.burnt += r.t; S.goals.burnt = true; pl.residue = null; emit('burn', {plot:pl.id, t:r.t});
    log(() => t(`แปลง ${pl.id + 1}: เผาเศษพืช ${tons(r.t)} เกิดฝุ่น PM2.5 ราว ${fmt(r.t * 10)} กก.`, `Plot ${pl.id + 1}: burned ${tons(r.t)} of residue, about ${fmt(r.t * 10)} kg of PM2.5`), 'bad');
  } else if (how === 'bale') {
    const cost = r.t * OPS.bale; if (!afford(cost)) return; pay(cost, 'ops');
    addStore(r.item, r.t); S.env.byUsed += r.t; S.env.jobs += r.t * 0.5; pl.residue = null;
    log(() => t(`แปลง ${pl.id + 1}: อัดก้อน${T(ITEMS[r.item].n)} ${tons(r.t)} เข้าคลัง`, `Plot ${pl.id + 1}: baled ${tons(r.t)} of ${T(ITEMS[r.item].n)} into the store`), 'ok');
  } else if (how === 'mulch') { incorporate(pl) }
}

/* ---------- processing ---------- */
function runProc(k, q, perT){
  const pr = PROCS[k];
  pay(q * perT, 'process'); emit('process', {proc:k, t:q, toll:perT === pr.toll});
  Object.entries(pr.out).forEach(([it, r]) => addStore(it, q * r));
  if (pr.compost) S.compost += q * pr.compost;
  const by = Object.entries(pr.out).filter(([it]) => !['rice','corn','chips','green'].includes(it)).reduce((a, [, r]) => a + r * q, 0);
  S.env.byGen += by; S.env.byUsed += by; S.env.jobs += q * (k === 'wet' ? 6 : 1);
  S.goals.process = true;
}
function processNow(k, toll){
  const pr = PROCS[k], have = S.store[pr.input] || 0; if (have < 0.001) return;
  if (toll) {
    const cost = have * pr.toll; if (!afford(cost)) return;
    S.store[pr.input] = 0; delete S.store[pr.input];
    runProc(k, have, pr.toll);
    log(() => t(`จ้าง${T(pr.n)}แปรรูป ${tons(have)} ค่าจ้าง ${baht(cost)}`, `Paid a ${T(pr.n)} to process ${tons(have)} for ${baht(cost)}`), 'ok');
  } else {
    S.queue[k] = (S.queue[k] || 0) + have; delete S.store[pr.input];
    log(() => t(`ส่ง ${tons(have)} เข้า${T(pr.n)}ของไร่ ใช้เวลาราว ${Math.ceil(S.queue[k] / pr.cap)} วัน`, `Sent ${tons(have)} into your ${T(pr.n)}, about ${Math.ceil(S.queue[k] / pr.cap)} days`));
  }
}

/* ---------- market and orders ---------- */
const byId = id => BUYERS.find(b => b.id === id);
function buyersOf(item, m){ return BUYERS.filter(b => b.buys[item] && (!b.season || b.season.includes(m))) }
function bestPrice(item){
  const m = monthOf(S.day), bs = buyersOf(item, m); if (!bs.length) return 0;
  let p = Math.max(...bs.map(b => b.buys[item])) * S.px[item];
  if ((item === 'paddy' || item === 'rice') && [11,12].includes(m)) p *= 0.92;
  if ((item === 'cornWet' || item === 'corn') && [9,10].includes(m)) p *= 0.93;
  return p;
}
const spotPrice = item => bestPrice(item) * 0.86;
function sellSpot(item){
  const q = S.store[item] || 0, p = spotPrice(item);
  if (!p) { toast(t('ตอนนี้ไม่มีผู้รับซื้อ (นอกฤดู)', 'Nobody buys this right now (out of season)'), 'bad'); return }
  earn(q * p, 'sales'); delete S.store[item]; emit('sell', {item, t:q, buyer:'middle'});
  if (!['paddy','cornWet','corn','roots','cane','cherry','rice','chips','green'].includes(item)) S.goals.byprod = true;
  log(() => t(`ขาย${T(ITEMS[item].n)} ${tons(q)} ให้พ่อค้าคนกลาง ได้ ${baht(q * p)}`, `Sold ${tons(q)} of ${T(ITEMS[item].n)} to a middleman for ${baht(q * p)}`));
}
const QTY = { paddy:[1.5,5], rice:[0.4,2], broken:[0.1,0.5], bran:[0.08,0.4], husk:[0.3,1.5], straw:[0.8,3], cornWet:[1.5,6], corn:[1,5], stover:[1,4],
  roots:[6,18], chips:[2,8], cane:[15,50], trash:[1,4], cherry:[0.3,1], green:[0.04,0.15], cascara:[0.02,0.08] };
function possibleItems(){
  const s = new Set(Object.keys(S.store));
  S.plots.forEach(pl => { if (pl.crop) { const cr = CROPS[pl.crop.id]; s.add(cr.raw); if (cr.resid.item) s.add(cr.resid.item); Object.values(PROCS).forEach(pr => { if (pr.input === cr.raw) Object.keys(pr.out).forEach(o => s.add(o)) }) } });
  if (s.size < 3) { const z = S.zone; Object.values(CROPS).filter(c => c.suit[z] >= 0.85).forEach(c => s.add(c.raw)) }
  return [...s].filter(k => QTY[k]);
}
function makeOrder(first){
  const items = possibleItems(), m = monthOf(S.day);
  for (let tries = 0; tries < 6; tries++) {
    const item = items[Math.floor(rnd(S.day, S.nextId, tries, 5) * items.length)];
    const bs = BUYERS.filter(b => b.buys[item] && (!b.season || b.season.includes(m) || b.season.includes(((m + 0) % 12) + 1)));
    if (!bs.length) continue;
    const b = bs[Math.floor(rnd(S.day, S.nextId, tries, 6) * bs.length)], [lo, hi] = QTY[item];
    const qty = Math.round((lo + (hi - lo) * rnd(S.day, S.nextId, 7)) * 100) / 100;
    const price = Math.round(b.buys[item] * S.px[item] * (1.04 + 0.14 * rnd(S.day, S.nextId, 8)) * (1 + Math.min(0.1, S.rep * 0.005)) / 10) * 10;
    S.orders.push({ id:S.nextId++, buyer:b.id, item, qty, price, due:S.day + (first ? 60 : 18) + Math.floor(rnd(S.day, S.nextId, 9) * 30), rep:1 + (price * qty > 20000 ? 1 : 0) });
    return;
  }
}
function fulfil(o){
  if ((S.store[o.item] || 0) + 1e-6 < o.qty) return;
  S.store[o.item] -= o.qty; if (S.store[o.item] < 0.0005) delete S.store[o.item];
  earn(o.qty * o.price, 'orders'); S.rep += o.rep; S.env.delivered += o.qty; emit('deliver', {item:o.item, t:o.qty, buyer:o.buyer});
  S.goals.orders = (S.goals.orders || 0) + 1;
  if (!['paddy','cornWet','corn','roots','cane','cherry','rice','chips','green'].includes(o.item)) S.goals.byprod = true;
  S.orders = S.orders.filter(x => x !== o);
  log(() => t(`ส่ง${T(ITEMS[o.item].n)} ${tons(o.qty)} ให้${T(byId(o.buyer).n)} ได้ ${baht(o.qty * o.price)} ชื่อเสียง +${o.rep}`, `Delivered ${tons(o.qty)} of ${T(ITEMS[o.item].n)} to the ${T(byId(o.buyer).n)} for ${baht(o.qty * o.price)}, reputation +${o.rep}`), 'ok');
}
function feedsText(b){
  if (!b.feeds || !CH) return '';
  const crop = CH.crops.find(c => c.id === b.feeds[0]); const line = crop && crop.lines.find(l => l.id === b.feeds[1]);
  return line ? `${T(line.n)}: ${T(line.feeds)}` : '';
}

/* ---------- drawing the farm ---------- */
const PW = 132, PH = 118, GX = 14, GY = 16;
function plotXY(i){ const col = i % 4, row = Math.floor(i / 4); return [150 + col * (PW + GX), 40 + row * (PH + GY)] }
function soilFill(pl){
  const z = ZONES[S.zone], wet = clamp(pl.w / z.awc, 0, 1), om = clamp((pl.om - 0.8) / 2.5, 0, 1);
  const l = 62 - om * 22 - wet * 14, s = 34 + om * 8;
  return `hsl(${28 - om * 4} ${s}% ${l}%)`;
}
function plantGlyph(id, p, x, y, ripe, s){
  s = s || 1; const g = Math.max(0.25, Math.min(1, p * 1.4));
  const green = ripe ? (id === 'rice' ? '#c9a227' : id === 'corn' ? '#b99a3b' : '#4f8a3a') : p > 0.75 && id === 'rice' ? '#a8a43a' : '#3f8a3a';
  const h = (id === 'cane' ? 30 : id === 'corn' ? 26 : id === 'coffee' ? 18 : id === 'cassava' ? 20 : 13) * g * s;
  if (id === 'rice') return `<path d="M${x} ${y}v${-h}M${x} ${y}l${-4 * s * g} ${-h * 0.85}M${x} ${y}l${4 * s * g} ${-h * 0.85}M${x} ${y}l${-7 * s * g} ${-h * 0.6}M${x} ${y}l${7 * s * g} ${-h * 0.6}" stroke="${green}" stroke-width="${1.3 * s}" fill="none" stroke-linecap="round"/>` + (p > 0.55 ? `<path d="M${x} ${y - h}q${5 * s} ${2 * s} ${6 * s} ${7 * s}" stroke="${ripe ? '#d9b23a' : '#9bb04a'}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>` : '');
  if (id === 'corn') return `<path d="M${x} ${y}v${-h}M${x} ${y - h * 0.35}l${-8 * s * g} ${-6 * s * g}M${x} ${y - h * 0.55}l${8 * s * g} ${-6 * s * g}M${x} ${y - h * 0.8}l${-7 * s * g} ${-4 * s * g}" stroke="${green}" stroke-width="${1.6 * s}" fill="none" stroke-linecap="round"/>` + (p > 0.5 ? `<ellipse cx="${x + 2.5 * s}" cy="${y - h * 0.5}" rx="${2 * s}" ry="${4.5 * s}" fill="${ripe ? '#d9a93a' : '#cfd36a'}"/>` : '') + (p > 0.45 ? `<path d="M${x} ${y - h}l-2 -4M${x} ${y - h}l2 -4" stroke="#b9a35a" stroke-width="1"/>` : '');
  if (id === 'cassava') return `<path d="M${x} ${y}v${-h}" stroke="#7a5a3a" stroke-width="${1.5 * s}"/>` + [-1, 0, 1].map(k => `<path d="M${x} ${y - h}l${k * 6 * s * g} ${-5 * s * g}" stroke="#3f8a3a" stroke-width="${2.2 * s}" stroke-linecap="round"/>`).join('') + `<path d="M${x} ${y - h * 0.6}l${-6 * s * g} ${-2 * s}M${x} ${y - h * 0.6}l${6 * s * g} ${-2 * s}" stroke="#3f8a3a" stroke-width="${2 * s}" stroke-linecap="round"/>`;
  if (id === 'cane') return `<path d="M${x - 2 * s} ${y}v${-h}M${x + 2 * s} ${y}v${-h * 0.9}" stroke="${ripe ? '#8b8f3a' : '#5d8f3a'}" stroke-width="${1.8 * s}"/><path d="M${x} ${y - h}q${-9 * s} ${2 * s} ${-12 * s} ${8 * s}M${x} ${y - h}q${9 * s} ${2 * s} ${12 * s} ${8 * s}" stroke="#3f8a3a" stroke-width="${1.3 * s}" fill="none"/>`;
  if (id === 'coffee') return `<ellipse cx="${x}" cy="${y - h * 0.55}" rx="${8 * s * g}" ry="${h * 0.55}" fill="#2f6b3a"/>` + (ripe ? [[-3, -0.5], [3, -0.4], [0, -0.7], [-4, -0.25], [4, -0.65]].map(([dx, dy]) => `<circle cx="${x + dx * s}" cy="${y + h * dy}" r="${1.6 * s}" fill="#c0392b"/>`).join('') : '');
  return '';
}
function drawFarm(){
  const z = ZONES[S.zone], svg = $('farm');
  let h = '';
  // backdrop: water source on the left
  h += `<rect x="0" y="0" width="760" height="330" fill="var(--g-grass)"/>`;
  if (z.slope) for (let i = 0; i < 9; i++) h += `<path d="M120 ${30 + i * 34}q300 ${-18 + i * 2} 640 ${8}" stroke="var(--g-contour)" fill="none" stroke-width="1"/>`;
  const wk = z.water.kind;
  if (wk === 'canal') h += `<rect x="96" y="0" width="22" height="330" fill="var(--g-water)"/><text x="107" y="165" class="glab" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 107 165)" fill="#fff" style="fill:#fff">${t('คลองชลประทาน','canal')}</text>`;
  if (wk === 'river') h += `<path d="M60 0c40 80-20 150 30 210s-10 90 10 120h40c-20-30 30-60-10-120s10-130-30-210z" fill="var(--g-water)"/><text x="40" y="320" class="glab">${t('แม่น้ำน่าน','Nan River')}</text>`;
  if (wk === 'pond' || S.pond.cap) {
    const f = S.pond.cap ? S.pond.v / S.pond.cap : 0;
    h += `<rect x="16" y="40" width="96" height="70" rx="16" fill="var(--g-pondbed)"/><rect x="16" y="${40 + 70 * (1 - f)}" width="96" height="${70 * f}" rx="${f > 0.2 ? 16 : 4}" fill="var(--g-water)"/>`;
    h += `<text x="64" y="128" class="glab" text-anchor="middle">${t('สระ','pond')} ${fmt(S.pond.v)}/${fmt(S.pond.cap)} ${t('ลบ.ม.','m³')}</text>`;
  }
  if (wk === 'pond') h += `<path d="M0 250q40 20 60 45t50 35" stroke="var(--g-water)" stroke-width="5" fill="none"/><text x="70" y="262" class="glab">${t('ลำห้วย','creek')}</text>`;
  // buildings
  h += `<g transform="translate(18 ${wk === 'pond' || S.pond.cap ? 150 : 40})"><rect width="70" height="44" fill="var(--g-barn)" rx="3"/><path d="M-4 0l39-18 39 18z" fill="var(--g-roof)"/><text x="35" y="60" class="glab" text-anchor="middle">${t('โกดัง','store')}</text></g>`;
  Object.keys(PROCS).filter(k => S.owned[k]).forEach((k, i) => {
    h += `<g transform="translate(${18 + (i % 2) * 40} ${240 + Math.floor(i / 2) * 44})"><rect width="32" height="26" rx="3" fill="var(--g-shed)"/><rect x="20" y="-10" width="6" height="12" fill="var(--g-shed)"/>${S.queue[k] ? `<circle cx="23" cy="-14" r="4" fill="#bbb" opacity=".8"/>` : ''}<title>${esc(T(PROCS[k].n))}</title></g>`;
  });
  // plots
  S.plots.forEach((pl, i) => {
    const [x, y] = plotXY(i), sel = S.sel === i;
    h += `<g class="plot${sel ? ' on' : ''}" data-plot="${i}" tabindex="0" role="button" aria-label="${esc(t('แปลง ', 'Plot ') + (i + 1))}">`;
    if (!pl.open) {
      h += `<rect x="${x}" y="${y}" width="${PW}" height="${PH}" rx="4" fill="url(#hatch)" stroke="var(--g-line)" stroke-dasharray="4 3"/><text x="${x + PW / 2}" y="${y + PH / 2 + 4}" class="glab" text-anchor="middle">${t('ยังไม่ได้เช่า','not rented')}</text></g>`;
      return;
    }
    h += `<rect x="${x}" y="${y}" width="${PW}" height="${PH}" rx="4" fill="${soilFill(pl)}" stroke="${sel ? 'var(--sel)' : 'var(--g-bund)'}" stroke-width="${sel ? 3 : 4}"/>`;
    if (pl.tilled && !pl.crop) for (let r = 0; r < 7; r++) h += `<path d="M${x + 8} ${y + 14 + r * 15}h${PW - 16}" stroke="rgba(60,35,15,.35)" stroke-width="2"/>`;
    if (pl.residue) for (let r = 0; r < 18; r++) h += `<path d="M${x + 10 + (r * 37) % (PW - 20)} ${y + 12 + (r * 23) % (PH - 20)}l7 -3" stroke="#c9b06a" stroke-width="2"/>`;
    if (pl.pond > 2) h += `<rect x="${x + 2}" y="${y + 2}" width="${PW - 4}" height="${PH - 4}" rx="3" fill="var(--g-water)" opacity="${clamp(pl.pond / 120, 0.18, 0.7)}"/>`;
    if (pl.crop) {
      const cr = CROPS[pl.crop.id], est = cr.perennial && pl.crop.age < cr.first;
      const p = cr.perennial ? (est ? 0.3 + 0.7 * pl.crop.age / cr.first : 1) : Math.min(1, progress(pl)), rp = ready(pl);
      const cols = cr.perennial || pl.crop.id === 'cassava' ? 5 : 6, rows = 4;
      for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) h += plantGlyph(pl.crop.id, p, x + 14 + cc * ((PW - 28) / (cols - 1)), y + 32 + r * 25, rp, 0.85);
    }
    // badges
    const b = [];
    if (pl.crop) {
      const c = pl.crop, cr = CROPS[c.id], rel = pl.w / ZONES[S.zone].awc;
      if (ready(pl)) b.push(['✓', '#2f6b45']);
      if ((cr.pond ? pl.pond <= 0 && rel < 0.7 : rel < 0.4) && !(cr.perennial && false)) b.push(['💧', '#a1561b']);
      if (c.pest > 40) b.push(['🐛', '#a1561b']);
      if (pl.N < 4 && !ready(pl)) b.push(['N', '#a1561b']);
      if (!cr.pond && pl.pond > 20) b.push(['≋', '#1f6f78']);
    } else if (pl.residue) b.push(['⋯', '#7a5a3a']);
    h += `<rect x="${x}" y="${y}" width="${PW}" height="18" rx="4" fill="rgba(0,0,0,.42)"/><text x="${x + 6}" y="${y + 13}" class="gtag">${i + 1} · ${pl.crop ? esc(T(CROPS[pl.crop.id].n).replace(/\s*\(.*\)/, '')) : pl.residue ? t('มีเศษพืช', 'residue') : pl.tilled ? t('ไถแล้ว', 'tilled') : t('ว่าง', 'idle')}</text>`;
    b.forEach(([s, col], k) => h += `<circle cx="${x + PW - 10 - k * 18}" cy="${y + PH - 10}" r="8" fill="#fff" stroke="${col}" stroke-width="1.5"/><text x="${x + PW - 10 - k * 18}" y="${y + PH - 6.5}" text-anchor="middle" style="font:700 9.5px var(--f-mono);fill:${col}">${s}</text>`);
    h += `</g>`;
  });
  if (S.flood > 0) h += `<rect x="0" y="0" width="760" height="330" fill="var(--g-water)" opacity=".12" pointer-events="none"/>`;
  svg.innerHTML = `<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--g-grass)"/><path d="M0 0v8" stroke="var(--g-line)" stroke-width="2"/></pattern></defs>` + h;
}

/* ---------- panels ---------- */
function bar(v, max, cls, label, val, hint){
  const w = clamp(v / max * 100, 0, 100);
  return `<div class="gbar ${cls || ''}"${hint ? ` title="${esc(hint)}"` : ''}><span>${label}</span><i><b style="width:${w}%"></b></i><em>${val}</em></div>`;
}
function renderHUD(){
  const wx = weather(S.day), z = ZONES[S.zone];
  $('hDate').textContent = dstr(S.day);
  $('hDay').textContent = t(`วันที่ ${S.day + 1} ของเกม`, `game day ${S.day + 1}`);
  $('hCash').textContent = baht(S.cash); $('hCash').classList.toggle('neg', S.cash < 0);
  $('hLoan').textContent = S.loan ? t(`หนี้ ธ.ก.ส. ${baht(S.loan)}`, `BAAC loan ${baht(S.loan)}`) : t('ไม่มีหนี้', 'no debt');
  $('hRep').textContent = S.rep;
  $('hWater').textContent = `${fmt(waterLeft())} ${t('ลบ.ม.', 'm³')}`;
  $('hWaterSrc').textContent = T(z.water.n);
  let fc = '';
  for (let k = 0; k < 7; k++) {
    const d = S.day + k, r = k === 0 ? wx.rain : forecast(d), ic = r >= 30 ? '⛈' : r >= 8 ? '🌧' : r > 0 ? '🌦' : '☀';
    fc += `<li${k === 0 ? ' class="today"' : ''}><small>${k === 0 ? t('วันนี้', 'today') : dstr(d, true)}</small><span aria-hidden="true">${ic}</span><b>${r} ${t('มม.', 'mm')}</b></li>`;
  }
  $('hFc').innerHTML = fc;
  $('hFlood').hidden = !(S.flood > 0);
}
function renderPanel(){
  const pl = S.plots[S.sel], z = ZONES[S.zone], el = $('panel');
  if (!pl.open) {
    el.innerHTML = `<h3>${t('แปลง ', 'Plot ')}${pl.id + 1}</h3><p class="note">${t('แปลงนี้ยังไม่ได้เช่า เช่าเพิ่มได้ในแท็บ "ลงทุน"', 'Not rented yet. Rent it in the Invest tab.')}</p>`;
    return;
  }
  const c = pl.crop, cr = c && CROPS[c.id];
  let h = `<div class="phead"><h3>${t('แปลง ', 'Plot ')}${pl.id + 1} <small>· ${RAI} ${t('ไร่', 'rai')}</small></h3>`;
  h += `<span class="tag">${c ? esc(T(stageOf(pl))) : pl.residue ? t('มีเศษพืชรอจัดการ', 'residue to deal with') : pl.tilled ? t('ไถแล้ว พร้อมปลูก', 'tilled, ready to plant') : t('แปลงว่าง', 'idle')}</span></div>`;
  // soil
  const rel = pl.w / z.awc;
  h += `<div class="soilbox"><div class="eyebrow">${t('ดินและน้ำ', 'Soil and water')}</div>`;
  h += bar(rel, 1, rel < 0.4 ? 'warn' : rel > 0.95 ? 'blue' : 'blue', t('ความชื้นดิน', 'Soil moisture'), `${fmt(rel * 100)}%`, t('สัดส่วนของน้ำที่พืชใช้ได้ในเขตราก', 'Share of plant-available water in the root zone'));
  if (pl.pond > 1) h += bar(pl.pond, 150, 'blue', t('น้ำขังบนผิวดิน', 'Standing water'), `${fmt(pl.pond)} ${t('มม.', 'mm')}`);
  h += bar(pl.N, 60, pl.N < 8 ? 'warn' : '', t('ไนโตรเจน (N)', 'Nitrogen (N)'), `${fmt(pl.N, 1)} ${t('กก./ไร่', 'kg/rai')}`, t('สร้างใบและโปรตีน', 'builds leaves and protein'));
  h += bar(pl.P, 20, pl.P < 3 ? 'warn' : '', t('ฟอสฟอรัส (P)', 'Phosphorus (P)'), `${fmt(pl.P, 1)} ${t('กก./ไร่', 'kg/rai')}`, t('ราก ดอก และพลังงานในเซลล์', 'roots, flowers and cell energy'));
  h += bar(pl.K, 80, pl.K < 12 ? 'warn' : '', t('โพแทสเซียม (K)', 'Potassium (K)'), `${fmt(pl.K, 1)} ${t('กก./ไร่', 'kg/rai')}`, t('ลำเลียงแป้งและน้ำตาล ทนแล้ง', 'moves starch and sugar, drought tolerance'));
  const okph = cr ? pl.ph >= cr.ph[0] && pl.ph <= cr.ph[1] : pl.ph >= 5.5 && pl.ph <= 7;
  h += bar(pl.ph - 3.5, 5, okph ? '' : 'warn', 'pH', fmt(pl.ph, 2) + (cr ? ` (${t('พืชนี้ชอบ', 'crop likes')} ${cr.ph[0]}–${cr.ph[1]})` : ''));
  h += bar(pl.om, 4, pl.om < 1.5 ? 'warn' : '', t('อินทรียวัตถุ', 'Organic matter'), `${fmt(pl.om, 2)}%`, t('อุ้มน้ำ ปลดปล่อย N ช้าๆ', 'holds water, releases N slowly'));
  h += `</div>`;
  // crop
  if (c) {
    const est = cr.perennial && c.age < cr.first;
    const f = factors(pl);
    h += `<div class="cropbox"><div class="eyebrow">${T(cr.n)} · ${t('อายุ', 'age')} ${c.age} ${t('วัน', 'days')}${c.ratoon ? ` · ${t('อ้อยตอ', 'ratoon')} ${c.ratoon}` : ''}</div>`;
    if (est) h += `<p class="note">${t(`ให้ผลครั้งแรกเมื่ออายุราว ${cr.first} วัน (อีก ${cr.first - c.age} วัน) ระหว่างนี้ต้องดูแลน้ำและดิน`, `First crop at about ${cr.first} days (${cr.first - c.age} to go); keep water and soil right meanwhile`)}</p>`;
    else {
      const y = yieldOf(pl), lim = limiting(f);
      h += `<div class="proj"><span>${t('ผลผลิตคาดการณ์ถ้าเก็บตอนนี้/ตอนสุก', 'Projected yield')}</span><b>${tons(y)}</b><small>${fmt(y / RAI * 1000)} ${t('กก./ไร่', 'kg/rai')} · ${t('ศักยภาพในโซนนี้', 'potential here')} ${fmt(cr.ymax * cr.suit[S.zone] * 1000)}</small></div>`;
      h += `<div class="facs">` + [['W', t('น้ำ', 'Water')], ['N', 'N'], ['P', 'P'], ['K', 'K'], ['pH', 'pH'], ['pest', t('แมลง', 'Pests')]].map(([k, l]) => `<span class="${k === lim[0] && f[k] < 0.97 ? 'lim' : ''}"><i style="--v:${f[k]}"></i>${l}<b>${fmt(f[k] * 100)}%</b></span>`).join('') + `</div>`;
      h += `<p class="note">${t('ผลผลิตถูกจำกัดด้วยปัจจัยที่ต่ำสุด (กฎขั้นต่ำของลีบิก) ตอนนี้คือ', 'Yield is held back by the scarcest factor (Liebig’s law of the minimum); right now that is')} <b>${lim[1]}</b>${!cr.perennial ? t(` · สุกเมื่อ ${cr.days} วัน`, ` · ripe at ${cr.days} days`) : ''}</p>`;
    }
    h += bar(c.pest, 100, c.pest > 40 ? 'warn' : '', T(cr.pest.n), fmt(c.pest), t('ดัชนีความหนาแน่นศัตรูพืช เกิน 40 เริ่มเสียหาย', 'pest pressure index; damage starts above 40'));
    h += bar(c.en, 100, 'leaf', t('ศัตรูธรรมชาติ', 'Natural enemies'), fmt(c.en));
    h += `</div>`;
  }
  // actions
  h += `<div class="acts">`;
  const btn = (act, label, cost, dis, cls) => `<button type="button" data-act="${act}" class="${cls || ''}"${dis ? ' disabled' : ''}>${label}${cost != null ? `<small>${cost}</small>` : ''}</button>`;
  if (!c) {
    if (pl.residue) {
      const r = pl.residue;
      h += `<div class="agroup"><div class="eyebrow">${t('เศษพืช', 'Residue')} ${tons(r.t)} · ${T(ITEMS[r.item].n)}</div>`;
      h += btn('res:mulch', t('ไถกลบ คืนอินทรียวัตถุ', 'Plough in (adds organic matter)'), baht(OPS.plow * RAI));
      h += btn('res:bale', t('อัดก้อนขายเป็นวัตถุดิบ', 'Bale it as feedstock'), baht(r.t * OPS.bale));
      h += btn('res:burn', t('เผาทิ้ง (เร็ว ฟรี แต่เกิดฝุ่น)', 'Burn it (fast, free, smoky)'), '0', false, 'bad');
      h += `</div>`;
    }
    if (!pl.tilled) h += btn('plow', t('เตรียมดิน / ไถ', 'Prepare soil / plough'), baht(OPS.plow * RAI));
    else {
      h += `<div class="agroup"><div class="eyebrow">${t('ปลูก', 'Plant')}</div>`;
      Object.entries(CROPS).forEach(([id, k]) => {
        const s = k.suit[S.zone];
        h += btn('plant:' + id, `${k.icon} ${T(k.n)}`, `${baht(k.seed * RAI)} · ${t('เหมาะ', 'fit')} ${fmt(s * 100)}%`, false, s < 0.5 ? 'dim' : '');
      });
      h += `</div>`;
    }
  } else {
    if (ready(pl)) h += btn('harvest', `${t('เก็บเกี่ยว', 'Harvest')} ${cr.icon}`, cr.cutPerT ? t(`ค่าตัด ${cr.cutPerT} บาท/ตัน`, `cutting ${cr.cutPerT} THB/t`) : baht(cr.harvest * RAI), false, 'go');
    h += `<div class="agroup"><div class="eyebrow">${t('น้ำ', 'Water')} · ${t('เหลือวันนี้', 'left today')} ${fmt(waterLeft())} ${t('ลบ.ม.', 'm³')}</div>`;
    h += btn('water:25', cr.pond ? t('ขังน้ำเพิ่ม 25 มม.', 'Add 25 mm to the paddy') : t('ให้น้ำ 25 มม.', 'Irrigate 25 mm'), `≈${fmt(25 / (cr.pond ? 0.7 : S.up.drip ? 0.9 : 0.6) * M3_PER_MM)} ${t('ลบ.ม.', 'm³')}`);
    h += btn('water:50', cr.pond ? t('ขังน้ำเพิ่ม 50 มม.', 'Add 50 mm to the paddy') : t('ให้น้ำ 50 มม.', 'Irrigate 50 mm'), `≈${fmt(50 / (cr.pond ? 0.7 : S.up.drip ? 0.9 : 0.6) * M3_PER_MM)} ${t('ลบ.ม.', 'm³')}`);
    h += `</div>`;
    h += `<div class="agroup"><div class="eyebrow">${t('ศัตรูพืช', 'Pests')}</div>`;
    h += btn('bio', t('ชีวภัณฑ์ / ปล่อยแตนเบียน', 'Bio-control / parasitoids'), baht(OPS.bio * RAI), false, 'ok');
    h += btn('spray', t('พ่นสารฆ่าแมลง', 'Spray insecticide'), baht(OPS.spray * RAI));
    h += `</div>`;
  }
  h += `<div class="agroup"><div class="eyebrow">${t('ปุ๋ยและปรับปรุงดิน', 'Fertilizer and soil')}</div>`;
  Object.entries(INPUTS).forEach(([k, f]) => {
    let cost = f.kg * RAI * f.price; if (k === 'manure' && S.compost > 0) cost -= Math.min(S.compost, f.kg * RAI / 1000) * 1000 * f.price;
    h += btn('fert:' + k, `${T(f.n)} ${fmt(f.kg)} ${t('กก./ไร่', 'kg/rai')}`, baht(cost));
  });
  h += `</div>`;
  if (c) h += btn('plow', cr.perennial || cr.ratoon ? t('รื้อแปลง / ไถทิ้ง', 'Clear the plot') : t('ไถทิ้ง', 'Plough out'), baht(OPS.plow * RAI), false, 'bad');
  h += `</div>`;
  el.innerHTML = h;
  renderPlant(pl);
}
function renderPlant(pl){
  const el = $('plantcard'), id = pl.crop ? pl.crop.id : null;
  if (!id) { el.innerHTML = `<p class="note">${t('เลือกแปลงที่มีพืชเพื่อดูโครงสร้างของพืช ความสัมพันธ์กับคน และสิ่งแวดล้อม', 'Select a plot with a crop to see the plant’s structure and how it connects to people and the environment.')}</p>`; return }
  const cr = CROPS[id], P = cr.plant;
  const part = { rice:[118, 44], corn:[128, 80], cassava:[110, 170], cane:[100, 100], coffee:[120, 80] }[id];
  let svg = `<svg viewBox="0 0 220 210" class="plantsvg" role="img" aria-label="${esc(T(cr.n))}"><rect x="0" y="130" width="220" height="80" fill="var(--g-soil)"/><path d="M0 130h220" stroke="var(--g-line)"/>`;
  // roots
  if (id === 'cassava') svg += `<path d="M110 130l-6 30M110 130l8 34M110 130l-24 22M110 130l26 22" stroke="#8a6a4a" stroke-width="2"/><ellipse cx="90" cy="160" rx="7" ry="18" transform="rotate(30 90 160)" fill="#b07a4a"/><ellipse cx="128" cy="166" rx="7" ry="20" transform="rotate(-25 128 166)" fill="#b07a4a"/><ellipse cx="108" cy="172" rx="6" ry="17" fill="#b07a4a"/>`;
  else if (id === 'coffee') svg += `<path d="M110 130v50M110 140l-30 12M110 140l30 12M110 150l-20 22M110 150l22 20" stroke="#8a6a4a" stroke-width="2"/>`;
  else for (let k = -5; k <= 5; k++) svg += `<path d="M110 130q${k * 4} 20 ${k * 9} ${id === 'corn' ? 60 : 36}" stroke="#8a6a4a" stroke-width="1.2" fill="none"/>`;
  svg += `<g transform="translate(110 130) scale(3.6) translate(-110 -130)">${plantGlyph(id, 1, 110, 130, true, 1)}</g>`;
  svg += `<circle cx="${part[0]}" cy="${part[1]}" r="14" fill="none" stroke="var(--sel)" stroke-width="2" stroke-dasharray="4 3"/>`;
  svg += `</svg>`;
  el.innerHTML = `<div class="plantgrid">${svg}<dl>
    <dt>${t('ราก', 'Roots')}</dt><dd>${T(P.root)}</dd><dt>${t('ลำต้น', 'Stem')}</dt><dd>${T(P.stem)}</dd>
    <dt>${t('ใบ', 'Leaves')}</dt><dd>${T(P.leaf)}</dd><dt>${t('ส่วนที่เก็บเกี่ยว (วงประ)', 'Harvested part (dashed circle)')}</dt><dd>${T(P.part)}</dd>
    <dt>${t('คนในพื้นที่', 'Local people')}</dt><dd>${T(P.people)}</dd><dt>${t('สิ่งแวดล้อม', 'Environment')}</dt><dd>${T(P.env)}</dd></dl></div>`;
}
function renderStore(){
  const m = monthOf(S.day);
  let h = `<div class="scroll"><table class="gt"><thead><tr><th>${t('สินค้า', 'Item')}</th><th>${t('ในคลัง', 'In store')}</th><th>${t('เสื่อม/วัน', 'Loss/day')}</th><th>${t('ราคาขายทันที', 'Spot price')}</th><th></th></tr></thead><tbody>`;
  const ks = Object.keys(S.store).filter(k => S.store[k] > 0.0005);
  if (!ks.length) h += `<tr><td colspan="5" class="note">${t('คลังว่าง เก็บเกี่ยวหรืออัดก้อนเศษพืชเพื่อเริ่ม', 'The store is empty. Harvest or bale residue to start.')}</td></tr>`;
  ks.forEach(k => {
    const sp = spotPrice(k), proc = Object.entries(PROCS).find(([, p]) => p.input === k);
    h += `<tr><th>${T(ITEMS[k].n)}</th><td class="num">${tons(S.store[k])}</td><td class="num${ITEMS[k].spoil > 0.02 ? ' bad' : ''}">${fmt(ITEMS[k].spoil * 100, ITEMS[k].spoil < 0.01 ? 2 : 0)}%</td><td class="num">${sp ? baht(sp) + t('/ตัน', '/t') : t('ไม่มีคนซื้อตอนนี้', 'no buyer now')}</td><td class="btns">`;
    if (proc) {
      const [pk, pr] = proc;
      if (S.owned[pk]) h += `<button type="button" data-act="proc:${pk}">${t('แปรรูปเอง', 'Process')}<small>${pr.run} ${t('บ./ตัน', 'THB/t')}</small></button>`;
      h += `<button type="button" data-act="toll:${pk}">${t('จ้างแปรรูป', 'Hire processing')}<small>${pr.toll} ${t('บ./ตัน', 'THB/t')}</small></button>`;
    }
    h += `<button type="button" data-act="sell:${k}"${sp ? '' : ' disabled'}>${t('ขายพ่อค้าคนกลาง', 'Sell to middleman')}<small>${sp ? baht(sp * S.store[k]) : '–'}</small></button></td></tr>`;
  });
  h += `</tbody></table></div>`;
  if (S.compost > 0.01) h += `<p class="note">${t(`ปุ๋ยหมักจากเปลือกกาแฟของไร่เอง ${tons(S.compost)} ใช้แทนปุ๋ยคอกได้ฟรี`, `Your own coffee-pulp compost: ${tons(S.compost)}, used free in place of bought manure`)}</p>`;
  // facilities
  h += `<h3>${t('โรงแปรรูป', 'Processing')}</h3><div class="pgrid">`;
  Object.entries(PROCS).forEach(([k, pr]) => {
    const outs = Object.entries(pr.out).map(([it, r]) => `${T(ITEMS[it].n)} ${fmt(r * 100)}%`).join(' · ');
    const crop = CH && CH.crops.find(c => c.id === pr.crop);
    const lines = crop ? pr.lines.map(l => crop.lines.find(x => x.id === l)).filter(Boolean) : [];
    h += `<div class="pcard"><b>${T(pr.n)}</b><small>${T(ITEMS[pr.input].n)} → ${outs}</small>
      <small>${t('กำลังผลิต', 'capacity')} ${pr.cap} ${t('ตัน/วัน', 't/day')} · ${t('ค่าดำเนินการ', 'running')} ${pr.run} ${t('บ./ตัน', 'THB/t')}</small>
      ${lines.length ? `<details><summary>${t('ต่อยอดไปอุตสาหกรรมไหน (จากหน้าห่วงโซ่)', 'Where it goes next (from the value-chain page)')}</summary><ul>${lines.map(l => `<li><b>${T(l.n)}</b>: ${T(l.feeds)}</li>`).join('')}</ul></details>` : ''}
      ${S.owned[k] ? `<span class="tag ok">${t('มีแล้ว', 'owned')}${S.queue[k] ? ` · ${t('กำลังแปรรูป', 'running')} ${tons(S.queue[k])}` : ''}</span>` : `<button type="button" data-act="build:${k}">${t('สร้าง', 'Build')}<small>${baht(pr.own)}</small></button>`}</div>`;
  });
  h += `</div><p class="note">${t('อ้อยไม่มีโรงแปรรูประดับไร่ เพราะโรงงานน้ำตาลต้องหีบหลายพันตันต่อวัน ชาวไร่จึงส่งลำอ้อยสดเข้าโรงงานในฤดูหีบ ธ.ค.–เม.ย. ', 'Cane has no farm-scale plant: sugar mills crush thousands of tonnes a day, so growers deliver fresh stalks during the Dec–Apr crushing season. ')}<a href="value-chain.html">${t('ดูห่วงโซ่เต็มสาย', 'See the full chain')}</a></p>`;
  $('tab-store').innerHTML = h;
}
function renderOrders(){
  let h = `<p class="note">${t('อุตสาหกรรมรอบลุ่มน้ำสั่งวัตถุดิบ ราคาสูงกว่าขายพ่อค้าคนกลาง ส่งของแล้วได้ชื่อเสียง ชื่อเสียงสูงทำให้ได้ราคาดีขึ้น', 'Industries around the basin order feedstock at better prices than the middleman. Delivered orders build reputation, and reputation brings better prices.')}</p><div class="ogrid">`;
  if (!S.orders.length) h += `<p class="note">${t('ยังไม่มีคำสั่งซื้อ ข้ามวันเพื่อรอ', 'No orders yet; advance a few days')}</p>`;
  S.orders.slice().sort((a, b) => a.due - b.due).forEach(o => {
    const b = byId(o.buyer), have = S.store[o.item] || 0, ok = have + 1e-6 >= o.qty, left = o.due - S.day, ft = feedsText(b);
    h += `<div class="ocard${ok ? ' can' : ''}"><div class="eyebrow">${T(b.n)}</div><b>${T(ITEMS[o.item].n)} ${tons(o.qty)}</b>
      <span class="num">${baht(o.price)}${t('/ตัน', '/t')} · ${t('รวม', 'total')} ${baht(o.price * o.qty)}</span>
      <small>${t('ภายใน', 'within')} ${left} ${t('วัน', 'days')} (${dstr(o.due, true)}) · ${t('ในคลัง', 'have')} ${tons(have)}</small>
      ${ft ? `<small class="feeds">${t('เอาไปทำ: ', 'Turns it into: ')}${esc(ft)}</small>` : ''}
      <button type="button" data-act="order:${o.id}"${ok ? '' : ' disabled'}>${t('ส่งของ', 'Deliver')}</button></div>`;
  });
  h += `</div>`;
  $('tab-orders').innerHTML = h;
}
function renderInvest(){
  let h = `<div class="pgrid">`;
  Object.entries(UPGRADES).forEach(([k, u]) => {
    if (k === 'contour' && !ZONES[S.zone].slope) return;
    if (k === 'dike' && !ZONES[S.zone].flood) return;
    const done = k === 'land' ? S.plots.every(p => p.open) : k === 'pond' ? false : S.up[k];
    h += `<div class="pcard"><b>${T(u.n)}</b><small>${T(u.d)}</small>${k === 'pond' && S.pond.cap ? `<small>${t('ความจุตอนนี้', 'capacity now')} ${fmt(S.pond.cap)} ${t('ลบ.ม.', 'm³')}</small>` : ''}${done ? `<span class="tag ok">${t('มีแล้ว', 'done')}</span>` : `<button type="button" data-act="up:${k}">${t('ลงทุน', 'Invest')}<small>${baht(u.cost)}</small></button>`}</div>`;
  });
  h += `</div><h3>${t('การเงิน', 'Finance')}</h3><div class="fin">
    <div><span>${t('รายรับสะสม', 'Income so far')}</span><b>${baht(S.led.inc)}</b></div><div><span>${t('รายจ่ายสะสม', 'Spending so far')}</span><b>${baht(S.led.exp)}</b></div>
    <div><span>${t('หนี้', 'Debt')}</span><b>${baht(S.loan)}</b></div><div><span>${t('ความมั่งคั่งสุทธิ', 'Net worth')}</span><b>${baht(S.cash - S.loan)}</b></div></div>
    <div class="btnrow"><button type="button" data-act="loan:50000">${t('กู้ ธ.ก.ส. 50,000 บาท', 'Borrow 50,000 THB from BAAC')}<small>${t('ดอกเบี้ย 7%/ปี', '7% a year')}</small></button>
    <button type="button" data-act="repay"${S.loan > 0 ? '' : ' disabled'}>${t('ชำระหนี้', 'Repay')}<small>${baht(Math.min(S.loan, Math.max(0, S.cash)))}</small></button></div>`;
  const cats = Object.entries(S.led.cat).sort((a, b) => a[1] - b[1]);
  const CN = { water:['ค่าน้ำ/สูบน้ำ','Water and pumping'], ops:['เตรียมดิน อัดฟาง','Tillage and baling'], seed:['เมล็ด/ท่อนพันธุ์','Seed and planting stock'], fert:['ปุ๋ยและปรับดิน','Fertilizer and soil'], pest:['จัดการศัตรูพืช','Pest control'], harvest:['เก็บเกี่ยว','Harvest'], process:['แปรรูป','Processing'], invest:['ลงทุน','Investment'], sales:['ขายพ่อค้าคนกลาง','Middleman sales'], orders:['ส่งอุตสาหกรรม','Industry orders'], loan:['เงินกู้','Loans'] };
  if (cats.length) h += `<div class="scroll"><table class="gt"><tbody>${cats.map(([k, v]) => `<tr><th>${T(CN[k] || [k, k])}</th><td class="num ${v < 0 ? 'bad' : 'okc'}">${baht(v)}</td></tr>`).join('')}</tbody></table></div>`;
  $('tab-invest').innerHTML = h;
}
function renderEnv(){
  const e = S.env, z = ZONES[S.zone], open = S.plots.filter(p => p.open);
  const omAvg = open.reduce((a, p) => a + p.om, 0) / open.length, ph = open.reduce((a, p) => a + p.ph, 0) / open.length;
  const byShare = e.byGen > 0 ? e.byUsed / e.byGen : 0;
  const card = (label, val, note, cls) => `<div class="ecard ${cls || ''}"><span>${label}</span><b>${val}</b><small>${note}</small></div>`;
  let h = `<p class="note">${T(z.note)}</p><div class="egrid">`;
  h += card(t('ไนโตรเจนหลุดลงน้ำ', 'Nitrogen washed to streams'), `${fmt(e.nWater, 1)} ${t('กก.', 'kg')}`, t('ไหลไปปลายน้ำ ทำให้สาหร่ายบูม', 'flows downstream and feeds algal blooms'), e.nWater > 40 ? 'bad' : '');
  h += card(t('ไนโตรเจนระเหยเป็นแอมโมเนีย', 'Nitrogen lost as ammonia'), `${fmt(e.nAir, 1)} ${t('กก.', 'kg')}`, t('ใส่ยูเรียตอนดินแห้งหรือมีน้ำขังเสียมากขึ้น', 'urea on dry or flooded soil loses more'));
  if (z.slope) h += card(t('ดินถูกชะล้าง', 'Soil eroded'), tons(e.sed), t('ตะกอนลงห้วย อ่างตื้นเขิน', 'silts up streams and reservoirs'), e.sed > 5 ? 'bad' : '');
  h += card(t('เผาเศษพืช', 'Residue burned'), tons(e.burnt), t(`ฝุ่น PM2.5 ราว ${fmt(e.burnt * 10)} กก.`, `about ${fmt(e.burnt * 10)} kg of PM2.5`), e.burnt > 0 ? 'bad' : 'ok');
  h += card(t('น้ำที่สูบใช้', 'Water pumped'), `${fmt(e.water)} ${t('ลบ.ม.', 'm³')}`, z.water.kind === 'pond' ? t('จากสระและห้วยในไร่', 'from your pond and creek') : t('น้ำที่คนปลายน้ำไม่ได้ใช้', 'water people downstream did not get'));
  h += card(t('พ่นสารฆ่าแมลง', 'Insecticide sprays'), `${e.spray} ${t('ครั้ง', 'times')}`, t('ฆ่าศัตรูธรรมชาติด้วย แมลงศัตรูมักกลับมาหนักกว่าเดิม', 'kills natural enemies too; pests often bounce back harder'), e.spray > 3 ? 'bad' : '');
  h += card(t('ผลพลอยได้ที่ใช้ประโยชน์', 'By-products put to use'), `${fmt(byShare * 100)}%`, t(`${tons(e.byUsed)} จาก ${tons(e.byGen)}`, `${tons(e.byUsed)} of ${tons(e.byGen)}`), byShare > 0.7 ? 'ok' : '');
  h += card(t('ส่งวัตถุดิบให้อุตสาหกรรม', 'Feedstock delivered to industry'), tons(e.delivered), t('ผ่านคำสั่งซื้อ', 'through orders'));
  h += card(t('การจ้างงานในหมู่บ้าน', 'Village jobs'), `${fmt(e.jobs)} ${t('แรงงาน-วัน', 'person-days')}`, t('เก็บเกี่ยว ตัดอ้อย เก็บกาแฟ แปรรูป', 'harvesting, cane cutting, coffee picking, processing'), 'ok');
  h += card(t('ของเสียในคลัง', 'Spoiled in store'), tons(e.spoiled), t('หัวมัน ผลกาแฟ อ้อย เสียเร็ว', 'cassava, coffee cherries and cane spoil fast'), e.spoiled > 2 ? 'bad' : '');
  h += card(t('อินทรียวัตถุเฉลี่ย', 'Average organic matter'), `${fmt(omAvg, 2)}%`, t(`เริ่มต้น ${z.start.om}% · pH เฉลี่ย ${fmt(ph, 2)}`, `started at ${z.start.om}% · average pH ${fmt(ph, 2)}`), omAvg >= z.start.om ? 'ok' : 'bad');
  h += `</div>`;
  // harvest history
  if (S.harvests.length) {
    h += `<h3>${t('ประวัติการเก็บเกี่ยว', 'Harvest history')}</h3><div class="scroll"><table class="gt"><thead><tr><th>${t('วันที่', 'Date')}</th><th>${t('แปลง', 'Plot')}</th><th>${t('พืช', 'Crop')}</th><th>${t('กก./ไร่', 'kg/rai')}</th><th>${t('ปัจจัยจำกัด', 'Main limit')}</th></tr></thead><tbody>`;
    const LN = { W:t('น้ำ', 'water'), N:'N', P:'P', K:'K', pH:'pH', pest:t('แมลง', 'pests') };
    S.harvests.forEach(r => h += `<tr><td>${dstr(r.d, true)}</td><td>${r.plot + 1}</td><td>${T(CROPS[r.crop].n)}</td><td class="num">${fmt(r.perRai * 1000)}</td><td>${LN[r.lim]} ${fmt(r.f[r.lim] * 100)}%</td></tr>`);
    h += `</tbody></table></div>`;
  }
  $('tab-env').innerHTML = h;
}
function renderLog(){
  $('tab-log').innerHTML = `<ol class="glog">${S.log.map(l => `<li class="${l.k}"><time>${dstr(l.d, true)}</time>${esc(typeof l.m === 'string' ? l.m : l.m[I18N.lang])}</li>`).join('')}</ol>`;
}
const GOALS = [
  ['plant', ['ปลูกพืชรุ่นแรก', 'Plant your first crop']],
  ['harvest', ['เก็บเกี่ยวครั้งแรก', 'Bring in a first harvest']],
  ['process', ['แปรรูปผลผลิตเป็นวัตถุดิบ', 'Process a harvest into feedstock']],
  ['orders', ['ส่งของตามคำสั่งซื้ออุตสาหกรรม 3 ครั้ง', 'Fill 3 industry orders'], 3],
  ['byprod', ['ขายผลพลอยได้ (แกลบ รำ ฟาง ต้นข้าวโพด ใบอ้อย คาสคาร่า)', 'Sell a by-product (husk, bran, straw, stover, cane trash, cascara)']],
  ['om', ['เพิ่มอินทรียวัตถุเฉลี่ยให้สูงกว่าตอนเริ่ม 0.3%', 'Raise average organic matter 0.3% above the start']],
  ['year', ['ครบ 1 ปีโดยไม่เผา และมีเงินมากกว่าทุนเริ่มต้น', 'Finish a year with no burning and more money than you started with']]
];
function renderGoals(){
  const open = S.plots.filter(p => p.open), om = open.reduce((a, p) => a + p.om, 0) / open.length;
  if (om >= ZONES[S.zone].start.om + 0.3) S.goals.om = true;
  if (S.day >= 365 && !S.goals.burnt && S.cash - S.loan > START_CASH) S.goals.year = true;
  $('goals').innerHTML = GOALS.map(([k, n, need]) => {
    const v = S.goals[k], done = need ? (v || 0) >= need : !!v;
    return `<li class="${done ? 'done' : ''}">${done ? '✓' : '○'} ${T(n)}${need && !done ? ` (${v || 0}/${need})` : ''}</li>`;
  }).join('');
}
function renderAll(){
  if (!S) return;
  renderHUD(); drawFarm(); renderPanel(); renderGoals();
  if (window.Farm3D) window.Farm3D.update();
  const tab = document.querySelector('.gtabs [aria-selected="true"]').dataset.tab;
  ({store:renderStore, orders:renderOrders, invest:renderInvest, env:renderEnv, log:renderLog})[tab]();
  $('ordCount').textContent = S.orders.filter(o => (S.store[o.item] || 0) + 1e-6 >= o.qty).length || '';
}

/* ---------- toasts and time ---------- */
let toastT = null;
function toast(msg, kind){ const el = $('toast'); el.textContent = msg; el.className = 'toast show ' + (kind || ''); clearTimeout(toastT); toastT = setTimeout(() => el.className = 'toast', 3200) }
let timer = null;
function advance(n){
  let evs = [];
  for (let i = 0; i < n; i++) { evs = evs.concat(step()); if (evs.length && n > 1) break }
  if (evs.length) toast(evs.slice(0, 2).join(' · '), 'ev');
  renderAll();
  return evs.length;
}
function setAuto(on){
  clearInterval(timer); timer = null;
  $('bAuto').setAttribute('aria-pressed', String(!!on));
  $('bAuto').innerHTML = on ? t('⏸ หยุด', '⏸ Pause') : t('▶ เดินเวลา', '▶ Run');
  if (on) timer = setInterval(() => { if (advance(1)) { setAuto(false); save() } }, 380);
}

/* ---------- events ---------- */
function act(a){
  const [k, v] = a.split(':'), pl = S.plots[S.sel];
  switch (k) {
    case 'plow': if (pl.crop && !confirm(t('ไถทิ้งพืชที่ปลูกอยู่?', 'Plough out the standing crop?'))) return; plow(pl); break;
    case 'plant': plant(pl, v); break;
    case 'water': irrigate(pl, +v); break;
    case 'fert': fertilize(pl, v); break;
    case 'spray': protect(pl, false); break;
    case 'bio': protect(pl, true); break;
    case 'harvest': harvest(pl); break;
    case 'res': if (v === 'mulch') { const c = OPS.plow * RAI; if (!afford(c)) return; pay(c, 'ops'); pl.tilled = true } residue(pl, v); break;
    case 'proc': processNow(v, false); break;
    case 'toll': processNow(v, true); break;
    case 'sell': sellSpot(v); break;
    case 'order': fulfil(S.orders.find(o => o.id === +v)); break;
    case 'build': { const pr = PROCS[v]; if (!afford(pr.own)) return; pay(pr.own, 'invest'); S.owned[v] = true; log(() => t(`สร้าง${T(pr.n)}`, `Built a ${T(pr.n)}`), 'ok'); break }
    case 'up': {
      const u = UPGRADES[v]; if (!afford(u.cost)) return; pay(u.cost, 'invest');
      if (v === 'pond') { S.pond.cap += 1260 } else if (v === 'land') { S.plots.forEach(p => p.open = true) } else S.up[v] = true;
      log(() => t(`ลงทุน: ${T(u.n)}`, `Invested: ${T(u.n)}`), 'ok'); break;
    }
    case 'loan': S.loan += 50000; S.cash += 50000; S.led.cat.loan = (S.led.cat.loan || 0) + 50000; log(() => t('กู้ ธ.ก.ส. 50,000 บาท', 'Borrowed 50,000 THB from BAAC')); break;
    case 'repay': { const r = Math.min(S.loan, Math.max(0, S.cash)); S.loan -= r; S.cash -= r; S.led.cat.loan = (S.led.cat.loan || 0) - r; if (S.loan < 1) S.loan = 0; log(() => t(`ชำระหนี้ ${baht(r)}`, `Repaid ${baht(r)}`)); break }
  }
  save(); renderAll();
}
function startScreen(){
  $('setup').hidden = false; $('game').hidden = true;
  $('zonePick').innerHTML = Object.entries(ZONES).map(([k, z]) => `<button type="button" class="zcard" data-zone="${k}">
    <span class="eyebrow">${z.alt}</span><b>${T(z.n)}</b>
    <small><b>${t('ดิน', 'Soil')}:</b> ${T(z.soil)} · pH ${z.start.ph} · OM ${z.start.om}%</small>
    <small><b>${t('น้ำ', 'Water')}:</b> ${T(z.water.n)}</small>
    <small><b>${t('ความเสี่ยง', 'Risks')}:</b> ${T(z.risk)}</small></button>`).join('');
}
function startGame(){ $('setup').hidden = true; $('game').hidden = false; setAuto(false); renderAll() }

document.addEventListener('DOMContentLoaded', () => {
  S = load();
  $('zonePick').addEventListener('click', e => { const b = e.target.closest('[data-zone]'); if (b) { newGame(b.dataset.zone); startGame() } });
  $('farm').addEventListener('click', e => { const g = e.target.closest('[data-plot]'); if (g) { S.sel = +g.dataset.plot; renderAll(); if (innerWidth < 900) $('panel').scrollIntoView({behavior:'smooth', block:'start'}) } });
  $('farm').addEventListener('keydown', e => { const g = e.target.closest('[data-plot]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); S.sel = +g.dataset.plot; renderAll(); const n = document.querySelector(`[data-plot="${S.sel}"]`); n && n.focus() } });
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act) });
  $('b1').addEventListener('click', () => advance(1));
  $('b7').addEventListener('click', () => advance(7));
  $('bAuto').addEventListener('click', () => setAuto(!timer));
  $('bNew').addEventListener('click', () => { if (confirm(t('เริ่มเกมใหม่? ความคืบหน้าเดิมจะหายไป', 'Start a new game? Current progress will be lost.'))) { setAuto(false); try { localStorage.removeItem(KEY) } catch (e) {} S = null; startScreen() } });
  document.querySelectorAll('.gtabs [role="tab"]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.gtabs [role="tab"]').forEach(x => { x.setAttribute('aria-selected', String(x === b)); $('tab-' + x.dataset.tab).hidden = x !== b });
    renderAll();
  }));
  window.addEventListener('langchange', () => { if (S) { renderAll(); setAuto(!!timer) } else startScreen() });
  if (S) startGame(); else startScreen();
});
window.__game = { get S(){ return S }, advance, act, ready, progress, cover, weather, monthOf, dstr, plotXY, PW, PH, T, t,
  on: f => listeners.push(f), select: i => { S.sel = i; renderAll() } };
})();
