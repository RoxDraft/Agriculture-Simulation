/* 3D view for game.html: the same farm as the 2D map, drawn with three.js (r128, loaded on first use).
   It reads the game state on every redraw and animates activity the game reports through __game.on():
   water piped to plots, harvests trucked to the store, processing, deliveries to the industries east of the farm,
   fertilizer, spraying and smoke from burning. Plants ease toward their new size each day, so running time shows growth. */
(function(){
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const VIEW_KEY = 'agrisim.game.view';
let G, D, THREE, ready = false, loading = false, visible = false;
let renderer, scene, camera, el, raf = 0, clock, lastLang = '';
const plotsG = [], packets = [], floaters = [], puffs = [];
let ground, farmGround, waterGroup, buildingsGroup, industryGroup, floodPlane, rain, sun, hemi, pondWater, selRing;
const cam = { theta:-0.62, phi:0.92, r:92, tx:12, tz:2 };

const W = (x, y) => [x / 10 - 38, y / 10 - 16.5];             // 2D map px → world x, z
const STORE = () => { const z = G.S.pond.cap || D.ZONES[G.S.zone].water.kind === 'pond' ? 172 : 62; return W(53, z) };
const ROAD_Z = 20.5;
const COLORS = { harvest:0xd9a93a, water:0x3d8fd0, process:0x9a5b2b, deliver:0x2f8a4f, sell:0x8a8f96, burn:0x555555, fert:0xf2f2f2 };

/* ---------- loading ---------- */
function loadThree(cb){
  if (window.THREE) { THREE = window.THREE; return cb() }
  if (loading) return; loading = true;
  const s = document.createElement('script'); s.src = THREE_URL; s.async = true;
  s.onload = () => { THREE = window.THREE; loading = false; cb() };
  s.onerror = () => { loading = false; el.querySelector('.f3msg').textContent = G.t('โหลด three.js ไม่สำเร็จ ต้องต่ออินเทอร์เน็ตเพื่อดูแบบ 3 มิติ', 'Could not load three.js; the 3D view needs an internet connection'); };
  document.head.appendChild(s);
}

/* ---------- helpers ---------- */
function hslToColor(str){ const m = str.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/); const c = new THREE.Color(); if (m) c.setHSL(+m[1] / 360, +m[2] / 100, +m[3] / 100); return c }
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim() }
function textSprite(text, o){
  o = o || {}; const fs = o.fs || 44, pad = 14, cv = document.createElement('canvas'), x = cv.getContext('2d');
  x.font = `600 ${fs}px "IBM Plex Sans Thai", system-ui, sans-serif`;
  const w = Math.ceil(x.measureText(text).width) + pad * 2, h = fs + pad * 1.6;
  cv.width = w; cv.height = h; x.font = `600 ${fs}px "IBM Plex Sans Thai", system-ui, sans-serif`;
  if (o.bg !== null) { x.fillStyle = o.bg || 'rgba(20,30,25,.78)'; roundRect(x, 0, 0, w, h, h / 2.6); x.fill() }
  x.fillStyle = o.color || '#fff'; x.textBaseline = 'middle'; x.fillText(text, pad, h / 2 + 2);
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthTest:o.depthTest !== false }));
  const s = (o.scale || 1) * 0.045; sp.scale.set(w * s, h * s, 1); sp.renderOrder = 10;
  return sp;
}
function roundRect(x, a, b, w, h, r){ x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath() }
function disposeTree(o){ o.traverse(n => { if (n.geometry && !n.geometry.userData.shared) n.geometry.dispose(); if (n.material) { [].concat(n.material).forEach(m => { if (m.map) m.map.dispose(); if (!m.userData.shared) m.dispose() }) } }) }
function clear(g){ while (g.children.length) { const c = g.children.pop(); disposeTree(c) } }
const shared = {};
function geo(k, make){ if (!shared[k]) { shared[k] = make(); shared[k].userData.shared = true } return shared[k] }
function mat(k, make){ if (!shared['m' + k]) { shared['m' + k] = make(); shared['m' + k].userData.shared = true } return shared['m' + k] }
const std = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness:0.85, metalness:0 }, extra || {}));

/* ---------- scene ---------- */
function init(){
  el = document.getElementById('farm3d');
  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.querySelector('.f3canvas').appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 2, 0.5, 600);
  hemi = new THREE.HemisphereLight(0xdfefff, 0x4a3a28, 0.75); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff3dc, 1.05); sun.position.set(-40, 70, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-80, right:100, top:55, bottom:-55, near:10, far:200 }); sun.shadow.bias = -0.0005;
  scene.add(sun);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 140), std(0x9fb48a)); ground.rotation.x = -Math.PI / 2; ground.position.set(30, -0.05, 4); ground.receiveShadow = true; scene.add(ground);
  farmGround = new THREE.Mesh(new THREE.PlaneGeometry(78, 35), std(0xb7c99c)); farmGround.rotation.x = -Math.PI / 2; farmGround.position.y = 0; farmGround.receiveShadow = true; scene.add(farmGround);
  // road from the farm to the industrial area
  const road = new THREE.Mesh(new THREE.PlaneGeometry(132, 3), std(0x6d6a63)); road.rotation.x = -Math.PI / 2; road.position.set(27, 0.03, ROAD_Z); road.receiveShadow = true; scene.add(road);
  for (let i = 0; i < 30; i++) { const d = new THREE.Mesh(geo('dash', () => new THREE.PlaneGeometry(1.6, 0.18)), mat('dash', () => std(0xeeeeee))); d.rotation.x = -Math.PI / 2; d.position.set(-36 + i * 4, 0.05, ROAD_Z); scene.add(d) }
  waterGroup = new THREE.Group(); buildingsGroup = new THREE.Group(); industryGroup = new THREE.Group(); scene.add(waterGroup, buildingsGroup, industryGroup);
  for (let i = 0; i < 8; i++) { const g = new THREE.Group(); g.userData = { key:'', plot:i }; plotsG.push(g); scene.add(g) }
  floodPlane = new THREE.Mesh(new THREE.PlaneGeometry(90, 45), std(0x4a90b8, { transparent:true, opacity:0.55, roughness:0.2 })); floodPlane.rotation.x = -Math.PI / 2; floodPlane.visible = false; scene.add(floodPlane);
  selRing = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(G.PW / 10 + 0.6, 0.9, G.PH / 10 + 0.6)), new THREE.LineBasicMaterial({ color:0x0f4c6e })); scene.add(selRing);
  // trees around the farm, more of them upstream
  const tg = new THREE.Group(); scene.add(tg); tg.name = 'trees';
  // rain
  const N = 2500, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = -45 + Math.random() * 130; pos[i * 3 + 1] = Math.random() * 45; pos[i * 3 + 2] = -30 + Math.random() * 60 }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  rain = new THREE.Points(rg, new THREE.PointsMaterial({ color:0xaed4f0, size:0.35, transparent:true, opacity:0.75 })); rain.visible = false; scene.add(rain);
  clock = new THREE.Clock();
  bindControls();
  G.on(onEvent);
  window.addEventListener('resize', resize);
  ready = true; build(); resize(); loop();
}
function resize(){
  if (!renderer || !visible) return;
  const w = el.clientWidth, h = Math.max(320, Math.min(620, Math.round(w * 0.6)));
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}

/* static parts that depend on zone and language */
function build(){
  const S = G.S, z = D.ZONES[S.zone], T = G.T, t = G.t;
  lastLang = I18N.lang + S.zone + Object.keys(S.owned).join() + S.pond.cap + S.plots.filter(p => p.open).length;
  clear(waterGroup); clear(buildingsGroup); clear(industryGroup);
  const tg = scene.getObjectByName('trees'); clear(tg);
  const wk = z.water.kind, waterMat = mat('water', () => std(0x3d84b0, { roughness:0.15, metalness:0.1, transparent:true, opacity:0.88 }));
  // terrain feel: slope zone tilts into hills behind the farm
  ground.material.color.set(wk === 'pond' ? 0x8fa67a : wk === 'river' ? 0xa9bb8c : 0x9fb48a);
  if (z.slope) for (let i = 0; i < 6; i++) { const h = new THREE.Mesh(new THREE.ConeGeometry(14 + i * 2, 14 + (i % 3) * 5, 7), std(0x6f8f5a)); h.position.set(-50 + i * 22, 0, -38 - (i % 2) * 8); h.receiveShadow = true; tg.add(h) }
  const nTrees = z.slope ? 80 : 30;
  for (let i = 0; i < nTrees; i++) {
    const x = -55 + Math.random() * 150, zz = -50 + Math.random() * 20;
    if (Math.abs(zz) < 20 && x > -40 && x < 40) continue;
    const tr = new THREE.Group(), s = 0.8 + Math.random() * 0.8;
    const tk = new THREE.Mesh(geo('trunk', () => new THREE.CylinderGeometry(0.2, 0.3, 2, 6)), mat('trunk', () => std(0x6b4a2e))); tk.position.y = 1;
    const cr = new THREE.Mesh(geo('crown', () => new THREE.IcosahedronGeometry(1.6, 0)), mat('crown', () => std(0x3f6f3a))); cr.position.y = 3; cr.castShadow = true;
    tr.add(tk, cr); tr.scale.setScalar(s); tr.position.set(x, 0, zz); tg.add(tr);
  }
  // water source
  if (wk === 'canal') { const c = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 36), waterMat); const [x] = W(107, 0); c.position.set(x, 0.05, 0); waterGroup.add(c); addLabel(waterGroup, t('คลองชลประทาน', 'Irrigation canal'), x, 3, -15) }
  if (wk === 'river') {
    const pts = [[80, -10], [70, 80], [95, 160], [75, 240], [100, 330], [90, 420]].map(([x, y]) => { const [a, b] = W(x, y); return new THREE.Vector3(a, 0.05, b) });
    const curve = new THREE.CatmullRomCurve3(pts); const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 2.2, 6), waterMat); tube.scale.y = 0.15; waterGroup.add(tube);
    addLabel(waterGroup, t('แม่น้ำน่าน', 'Nan River'), W(60, 0)[0], 3, -15);
  }
  if (wk === 'pond') {
    const pts = [[0, 250], [60, 290], [110, 330], [130, 400]].map(([x, y]) => { const [a, b] = W(x, y); return new THREE.Vector3(a, 0.05, b) });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.9, 6), waterMat); tube.scale.y = 0.2; waterGroup.add(tube);
    addLabel(waterGroup, t('ลำห้วย', 'Creek'), W(20, 260)[0], 2.5, W(20, 260)[1]);
  }
  if (S.pond.cap) {
    const [x, zz] = W(64, 75), bed = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.2, 7), std(0x8d7f6a)); bed.position.set(x, -0.5, zz); waterGroup.add(bed);
    pondWater = new THREE.Mesh(new THREE.BoxGeometry(9, 1, 6.4), waterMat.clone()); pondWater.position.set(x, 0, zz); waterGroup.add(pondWater);
    addLabel(waterGroup, t('สระ', 'Pond'), x, 2.6, zz - 4.6);
  } else pondWater = null;
  // store and owned processing sheds
  const [sx, sz] = STORE();
  buildingsGroup.add(barn(sx, sz, 7, 4.4, 0xb9643a, 0x6d3f26));
  addLabel(buildingsGroup, t('โกดัง', 'Store'), sx, 6.6, sz);
  Object.keys(D.PROCS).filter(k => S.owned[k]).forEach((k, i) => {
    const [x, zz] = W(34 + (i % 2) * 40, 253 + Math.floor(i / 2) * 44);
    const b = barn(x, zz, 3.4, 2.6, 0x7d8a83, 0x4b5550); b.add(chimney()); buildingsGroup.add(b);
    addLabel(buildingsGroup, T(D.PROCS[k].n), x, 5, zz, 0.7);
  });
  // industries east along the road: one building per buyer, plus the middleman yard and hired processing
  industryGroup.userData.pos = {};
  const list = D.BUYERS.map(b => [b.id, T(b.n)]).concat([['middle', t('พ่อค้าคนกลาง', 'Middleman')], ['toll', t('รับจ้างแปรรูป', 'Hired processing')]]);
  list.forEach(([id, name], i) => {
    const col = Math.floor(i / 5), row = i % 5, x = 52 + col * 17, zz = -17 + row * 8.6;
    const big = ['power', 'sugar', 'etoh', 'starch', 'feed'].includes(id);
    const b = barn(x, zz, big ? 7 : 5.2, big ? 4.2 : 3, id === 'middle' ? 0x8a8f96 : id === 'toll' ? 0x9a5b2b : 0xb8b2a4, 0x5e6266);
    if (big) b.add(chimney(2.2, 6));
    industryGroup.add(b); industryGroup.userData.pos[id] = [x, zz];
    addLabel(industryGroup, name, x, big ? 9.4 : 6.4, zz, 0.95);
  });
  addLabel(industryGroup, t('เขตอุตสาหกรรมรอบลุ่มน้ำ', 'Industries around the basin'), 69, 15, -22, 1.4, 'rgba(15,76,110,.85)');
  lastPlotKeys.fill('');
}
function barn(x, z, w, h, wall, roof){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.7), std(wall)); body.position.y = h / 2; body.castShadow = body.receiveShadow = true;
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.62, h * 0.5, 4, 1), std(roof)); r.rotation.y = Math.PI / 4; r.scale.z = 0.7; r.position.y = h + h * 0.25; r.castShadow = true;
  g.add(body, r); g.position.set(x, 0, z); return g;
}
function chimney(dx, h){ const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, h || 4, 8), std(0x8a8a8a)); c.position.set(dx || 1, (h || 4) / 2 + 1, 0); c.castShadow = true; c.name = 'chimney'; return c }
function addLabel(group, text, x, y, z, scale, bg){ const s = textSprite(text, { scale:scale || 0.8, bg }); s.position.set(x, y, z); group.add(s); return s }

/* ---------- plots and plants ---------- */
const lastPlotKeys = new Array(8).fill('');
function plantParts(id){
  // returns [{geo, mat, place(i, p, ripe) → [x,y,z, sx,sy,sz, rotY]}] for each repeated part
  const G2 = (k, f) => geo(k, f), M = (k, c, e) => mat(k, () => std(c, e));
  if (id === 'rice') return [{ g:G2('rice', () => new THREE.ConeGeometry(0.28, 1.2, 5).translate(0, 0.6, 0)), m:r => M(r ? 'riceR' : 'riceG', r ? 0xd2ad3c : 0x5d9b3c) }];
  if (id === 'corn') return [
    { g:G2('stalk', () => new THREE.CylinderGeometry(0.07, 0.1, 2.6, 5).translate(0, 1.3, 0)), m:r => M(r ? 'stalkR' : 'stalkG', r ? 0xb9a35a : 0x4f8a3a) },
    { g:G2('leaf', () => new THREE.SphereGeometry(0.5, 6, 4).scale(1.4, 0.12, 0.35).translate(0.6, 1.2, 0)), m:r => M(r ? 'leafR' : 'leafG', r ? 0xa8a050 : 0x3f8a3a), spin:true },
    { g:G2('ear', () => new THREE.CylinderGeometry(0.13, 0.13, 0.55, 6).translate(0.18, 1.35, 0)), m:r => M(r ? 'earR' : 'earG', r ? 0xe0b040 : 0xcfd36a), from:0.5 } ];
  if (id === 'cassava') return [
    { g:G2('cstem', () => new THREE.CylinderGeometry(0.06, 0.08, 1.6, 5).translate(0, 0.8, 0)), m:() => M('cstem', 0x7a5a3a) },
    { g:G2('ccrown', () => new THREE.IcosahedronGeometry(0.7, 0).translate(0, 1.7, 0)), m:() => M('ccrown', 0x3f8a3a, { flatShading:true }) } ];
  if (id === 'cane') return [
    { g:G2('cane', () => { const g = new THREE.CylinderGeometry(0.09, 0.11, 3.4, 5); g.translate(0, 1.7, 0); return g }), m:r => M(r ? 'caneR' : 'caneG', r ? 0x8b8f3a : 0x5d8f3a), multi:3 },
    { g:G2('tuft', () => new THREE.ConeGeometry(0.9, 1.2, 6).rotateX(Math.PI).translate(0, 3.6, 0)), m:() => M('tuft', 0x3f8a3a) } ];
  if (id === 'coffee') return [
    { g:G2('bush', () => new THREE.SphereGeometry(0.75, 8, 6).scale(1, 1.25, 1).translate(0, 0.95, 0)), m:() => M('bush', 0x2f6b3a) },
    { g:G2('berry', () => new THREE.SphereGeometry(0.12, 5, 4)), m:() => M('berry', 0xc0392b), berries:true } ];
  return [];
}
function buildPlot(i){
  const S = G.S, pl = S.plots[i], g = plotsG[i], [x0, y0] = G.plotXY(i), PW = G.PW / 10, PH = G.PH / 10;
  const [cx, cz] = W(x0 + G.PW / 2, y0 + G.PH / 2);
  const c = pl.crop, cr = c && D.CROPS[c.id];
  const ripe = c ? G.ready(pl) : false;
  const est = cr && cr.perennial && c.age < cr.first;
  const p = c ? (cr.perennial ? (est ? 0.3 + 0.7 * c.age / cr.first : 1) : Math.min(1, G.progress(pl))) : 0;
  const key = [pl.open, c ? c.id : '-', ripe, pl.tilled, !!pl.residue].join('|');
  g.userData.target = Math.max(0.12, Math.min(1, p * 1.25));
  g.position.set(cx, 0, cz);
  if (key === lastPlotKeys[i]) return;
  lastPlotKeys[i] = key; clear(g); g.userData.plants = [];
  if (!pl.open) {
    const m = new THREE.Mesh(geo('lockbox', () => new THREE.BoxGeometry(PW, 0.15, PH)), mat('lock', () => std(0xc7cfc3, { transparent:true, opacity:0.6 }))); m.position.y = 0.08; g.add(m);
    const s = textSprite(G.t('ยังไม่ได้เช่า', 'not rented'), { scale:0.7 }); s.position.y = 1.4; g.add(s); g.userData.soil = null; return;
  }
  const bund = new THREE.Mesh(geo('bund', () => new THREE.BoxGeometry(PW + 0.7, 0.5, PH + 0.7)), mat('bund', () => std(0x8f7653))); bund.position.y = 0.2; bund.receiveShadow = true; g.add(bund);
  const soil = new THREE.Mesh(geo('soil', () => new THREE.BoxGeometry(PW, 0.5, PH)), std(0x8a5a35)); soil.position.y = 0.3; soil.receiveShadow = true; g.add(soil); g.userData.soil = soil;
  if (pl.tilled && !c) for (let r = 0; r < 9; r++) { const f = new THREE.Mesh(geo('furrow', () => new THREE.BoxGeometry(PW - 0.8, 0.12, 0.35)), mat('furrow', () => std(0x5e3b20))); f.position.set(0, 0.58, -PH / 2 + 0.8 + r * (PH - 1.6) / 8); g.add(f) }
  if (pl.residue) {
    const im = new THREE.InstancedMesh(geo('straw', () => new THREE.BoxGeometry(0.8, 0.08, 0.12)), mat('straw', () => std(0xd8c27a)), 70), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let k = 0; k < 70; k++) { e.set(0, Math.random() * 3.14, 0); q.setFromEuler(e); m4.compose(new THREE.Vector3((Math.random() - 0.5) * (PW - 1), 0.6, (Math.random() - 0.5) * (PH - 1)), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(k, m4) }
    g.add(im);
  }
  const water = new THREE.Mesh(geo('pw', () => new THREE.BoxGeometry(PW - 0.1, 1, PH - 0.1)), std(0x4a90b8, { transparent:true, opacity:0.55, roughness:0.1 })); water.visible = false; g.add(water); g.userData.water = water;
  if (c) {
    const cols = c.id === 'rice' ? 9 : c.id === 'cane' ? 6 : c.id === 'coffee' ? 4 : 6, rows = c.id === 'rice' ? 7 : c.id === 'coffee' ? 3 : 5;
    const pts = []; for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) pts.push([-PW / 2 + 0.9 + k * (PW - 1.8) / (cols - 1) + (Math.random() - 0.5) * 0.25, -PH / 2 + 1 + r * (PH - 2) / (rows - 1) + (Math.random() - 0.5) * 0.25, Math.random() * 6.28]);
    plantParts(c.id).forEach(part => {
      if (part.from && p < part.from) return;
      if (part.berries && !ripe) return;
      const n = pts.length * (part.multi || (part.spin ? 3 : part.berries ? 8 : 1));
      const im = new THREE.InstancedMesh(part.g, part.m(ripe), n); im.castShadow = true; im.receiveShadow = true;
      im.userData = { pts, part, n };
      g.add(im); g.userData.plants.push(im);
    });
    g.userData.cur = g.userData.cur || 0.1;
    placePlants(g, g.userData.cur);
  }
}
function placePlants(g, s){
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  g.userData.plants.forEach(im => {
    const { pts, part } = im.userData; let k = 0;
    pts.forEach(([x, z, rot]) => {
      const reps = part.multi || (part.spin ? 3 : part.berries ? 8 : 1);
      for (let j = 0; j < reps; j++) {
        if (part.berries) { const a = rot + j * 0.8, h = 0.5 + (j % 4) * 0.35; e.set(0, 0, 0); v.set(x + Math.cos(a) * 0.7 * s, (0.3 + h) * s + 0.55, z + Math.sin(a) * 0.7 * s); sc.setScalar(1) }
        else if (part.multi) { e.set(0, rot, (j - 1) * 0.08); v.set(x + (j - 1) * 0.25, 0.55, z + ((j % 2) - 0.5) * 0.25); sc.set(1, s, 1) }
        else if (part.spin) { e.set(0, rot + j * 2.1, 0); v.set(x, 0.55 + (j - 1) * 0.5 * s, z); sc.set(s, s, s) }
        else { e.set(0, rot, 0); v.set(x, 0.55, z); sc.set(Math.max(0.35, s), s, Math.max(0.35, s)) }
        q.setFromEuler(e); m4.compose(v, q, sc); im.setMatrixAt(k++, m4);
      }
    });
    im.instanceMatrix.needsUpdate = true;
  });
}
function updatePlots(){
  const S = G.S, z = D.ZONES[S.zone];
  S.plots.forEach((pl, i) => {
    buildPlot(i);
    const g = plotsG[i];
    if (!pl.open || !g.userData.soil) return;
    g.userData.soil.material.color.copy(hslToColor(soilStyle(pl, z)));
    const w = g.userData.water, depth = pl.pond;
    w.visible = depth > 2; if (w.visible) { const h = Math.min(1.4, depth / 120); w.scale.y = h; w.position.y = 0.55 + h / 2; w.material.opacity = Math.min(0.75, 0.25 + depth / 200) }
    // badges
    if (g.userData.badge) { g.remove(g.userData.badge); disposeTree(g.userData.badge); g.userData.badge = null }
    let b = '';
    if (pl.crop) { const cr = D.CROPS[pl.crop.id], rel = pl.w / z.awc; if (G.ready(pl)) b += '✓ '; if (cr.pond ? pl.pond <= 0 && rel < 0.7 : rel < 0.4) b += '💧'; if (pl.crop.pest > 40) b += '🐛'; if (pl.N < 4 && !G.ready(pl)) b += ' N' }
    const name = `${i + 1}${pl.crop ? ' · ' + G.T(D.CROPS[pl.crop.id].n).replace(/\s*\(.*\)/, '') : ''}${b ? '  ' + b : ''}`;
    const s = textSprite(name, { scale:0.8, bg: G.ready(pl) ? 'rgba(47,107,69,.9)' : undefined }); s.position.set(0, pl.crop ? 4.6 : 2, -G.PH / 20 + 0.6); g.add(s); g.userData.badge = s;
  });
  const [x0, y0] = G.plotXY(S.sel), [cx, cz] = W(x0 + G.PW / 2, y0 + G.PH / 2); selRing.position.set(cx, 0.45, cz);
}
function soilStyle(pl, z){ const wet = Math.max(0, Math.min(1, pl.w / z.awc)), om = Math.max(0, Math.min(1, (pl.om - 0.8) / 2.5)); return `hsl(${28 - om * 4} ${34 + om * 8}% ${52 - om * 20 - wet * 14}%)` }

/* ---------- activity animation ---------- */
function plotCenter(i){ const [x0, y0] = G.plotXY(i); return W(x0 + G.PW / 2, y0 + G.PH / 2) }
function sourcePos(){ const S = G.S, wk = D.ZONES[S.zone].water.kind; if (S.pond.cap && (wk === 'pond' || S.quotaUsed === 0)) return W(64, 75); return wk === 'canal' ? W(107, 120) : wk === 'river' ? W(85, 150) : W(64, 75) }
function truck(color, label){
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo('tbody', () => new THREE.BoxGeometry(2.2, 1.1, 1.3)), std(color)); body.position.set(-0.3, 0.9, 0); body.castShadow = true;
  const cab = new THREE.Mesh(geo('tcab', () => new THREE.BoxGeometry(0.9, 1, 1.25)), mat('tcab', () => std(0xeeeeee))); cab.position.set(1.3, 0.85, 0);
  g.add(body, cab);
  [[-1, .65], [-1, -.65], [1.2, .65], [1.2, -.65]].forEach(([x, z]) => { const w = new THREE.Mesh(geo('wheel', () => new THREE.CylinderGeometry(0.32, 0.32, 0.25, 8).rotateX(Math.PI / 2)), mat('wheel', () => std(0x222222))); w.position.set(x, 0.32, z); g.add(w) });
  if (label) { const s = textSprite(label, { scale:0.55 }); s.position.y = 2.6; g.add(s) }
  return g;
}
function route(pts, obj, dur, done){ scene.add(obj); packets.push({ pts:pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), obj, t:0, dur, done }) }
function roadTo(from, to){ return [from, [from[0], ROAD_Z], [to[0], ROAD_Z], [to[0], to[1] + 3]] }
function float(text, x, y, z, color){ const s = textSprite(text, { scale:0.7, bg:color || 'rgba(47,107,69,.92)' }); s.position.set(x, y, z); scene.add(s); floaters.push({ s, t:0 }) }
function particles(n, color, from, to, size, dur, rise){
  const geom = new THREE.BufferGeometry(), arr = new Float32Array(n * 3); geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const pts = new THREE.Points(geom, new THREE.PointsMaterial({ color, size, transparent:true, opacity:0.9, depthWrite:false }));
  const seeds = Array.from({ length:n }, () => [Math.random(), (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]);
  scene.add(pts); puffs.push({ pts, seeds, from, to, t:0, dur, rise });
}
function onEvent(type, d){
  if (!ready) return;
  const S = G.S, store = STORE(), ind = industryGroup.userData.pos || {}, name = k => G.T(D.ITEMS[k].n);
  const tn = v => (v >= 10 ? v.toFixed(1) : v.toFixed(2)) + G.t(' ตัน', ' t');
  if (type === 'water') { const [sx, sz] = sourcePos(), [px, pz] = plotCenter(d.plot); particles(60, COLORS.water, [sx, 0.8, sz], [px, 0.8, pz], 0.55, 1.6, 0); float(`💧 ${Math.round(d.m3)} ${G.t('ลบ.ม.', 'm³')}`, px, 4, pz, 'rgba(31,111,160,.9)') }
  if (type === 'harvest') { const [px, pz] = plotCenter(d.plot); float(`+${tn(d.t)} ${name(d.item)}`, px, 6, pz); route([[px, pz], [px, ROAD_Z - 2.5], [store[0], ROAD_Z - 2.5], store], truck(COLORS.harvest), 3.2) }
  if (type === 'process') {
    const pr = D.PROCS[d.proc];
    if (d.toll) { const to = ind.toll || [60, 0]; route(roadTo(store, to), truck(COLORS.process, `${name(pr.input)} ${tn(d.t)}`), 4.2, () => route([[to[0], to[1] + 3], [to[0], ROAD_Z], [store[0], ROAD_Z], store], truck(COLORS.deliver, G.t('ผลผลิตแปรรูปกลับคลัง', 'Processed goods back to store')), 4.2)) }
    else { const i = Object.keys(D.PROCS).filter(k => S.owned[k]).indexOf(d.proc), to = W(34 + (i % 2) * 40, 253 + Math.floor(i / 2) * 44); particles(40, 0xbbbbbb, [to[0] + 1, 5, to[1]], [to[0] + 2, 12, to[1] - 2], 0.9, 2.2, 1) }
  }
  if (type === 'deliver') { const to = ind[d.buyer] || [60, 0]; route(roadTo(store, to), truck(COLORS.deliver, `${name(d.item)} ${tn(d.t)}`), 5, () => float(G.t('ส่งถึงแล้ว ✓', 'Delivered ✓'), to[0], 8, to[1])) }
  if (type === 'sell') { const to = ind.middle || [60, 0]; route(roadTo(store, to), truck(COLORS.sell, `${name(d.item)} ${tn(d.t)}`), 5) }
  if (type === 'fert') { const [px, pz] = plotCenter(d.plot); particles(80, d.kind === 'lime' ? 0xf5f5f0 : d.kind === 'manure' ? 0x5a3a20 : 0xffffff, [px, 6, pz], [px, 0.6, pz], 0.35, 1.4, 0) }
  if (type === 'spray' || type === 'bio') { const [px, pz] = plotCenter(d.plot); particles(90, type === 'spray' ? 0xd8f0a0 : 0x8fd08f, [px, 3, pz], [px, 2, pz], 0.6, 1.8, 0.5) }
  if (type === 'burn') { const [px, pz] = plotCenter(d.plot); particles(120, 0x777777, [px, 0.8, pz], [px + 6, 16, pz - 4], 1.4, 4, 1); particles(50, 0xff8a2a, [px, 0.6, pz], [px, 2, pz], 0.7, 1.6, 1); float(`🔥 PM2.5 ${Math.round(d.t * 10)} ${G.t('กก.', 'kg')}`, px, 6, pz, 'rgba(178,69,42,.92)') }
}
function tick(dt){
  for (let i = packets.length - 1; i >= 0; i--) {
    const p = packets[i]; p.t += dt / p.dur; const n = p.pts.length - 1, f = Math.min(0.9999, p.t) * n, k = Math.floor(f), a = p.pts[k], b = p.pts[k + 1], u = f - k;
    p.obj.position.lerpVectors(a, b, u); p.obj.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
    if (p.t >= 1) { scene.remove(p.obj); disposeTree(p.obj); packets.splice(i, 1); if (p.done) p.done() }
  }
  for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.t += dt / 2.6; f.s.position.y += dt * 1.2; f.s.material.opacity = Math.min(1, 3 * (1 - f.t)); if (f.t >= 1) { scene.remove(f.s); disposeTree(f.s); floaters.splice(i, 1) } }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]; p.t += dt / p.dur; const arr = p.pts.geometry.attributes.position.array;
    p.seeds.forEach(([d, sx, sz], j) => { const u = Math.max(0, Math.min(1, p.t * 1.6 - d * 0.6)); arr[j * 3] = p.from[0] + (p.to[0] - p.from[0]) * u + sx * (p.rise ? 2.5 * u : 1.6); arr[j * 3 + 1] = p.from[1] + (p.to[1] - p.from[1]) * u + (p.rise ? 0 : Math.sin(u * Math.PI) * 2); arr[j * 3 + 2] = p.from[2] + (p.to[2] - p.from[2]) * u + sz * (p.rise ? 2.5 * u : 1.6) });
    p.pts.geometry.attributes.position.needsUpdate = true; p.pts.material.opacity = 0.9 * (1 - Math.max(0, p.t - 0.6) / 0.4);
    if (p.t >= 1) { scene.remove(p.pts); p.pts.geometry.dispose(); p.pts.material.dispose(); puffs.splice(i, 1) }
  }
  // plants ease toward today's size
  plotsG.forEach(g => { if (!g.userData.plants || !g.userData.plants.length) return; const tgt = g.userData.target || 0.2, cur = g.userData.cur || 0.1; if (Math.abs(tgt - cur) > 0.002) { g.userData.cur = cur + (tgt - cur) * Math.min(1, dt * 3); placePlants(g, g.userData.cur) } });
  if (rain.visible) { const a = rain.geometry.attributes.position.array; for (let i = 1; i < a.length; i += 3) { a[i] -= dt * 40; if (a[i] < 0) a[i] += 45 } rain.geometry.attributes.position.needsUpdate = true }
  buildingsGroup.children.forEach(b => { const c = b.getObjectByName('chimney'); if (c && G.S.queue && Object.keys(G.S.queue).length && Math.random() < dt * 2) particles(6, 0xcccccc, [b.position.x + 1, 5.5, b.position.z], [b.position.x + 3, 11, b.position.z - 2], 0.8, 2, 1) });
}

/* ---------- per-day update from the game ---------- */
function update(){
  if (!ready) return;
  const S = G.S; if (!S) return;
  const sig = I18N.lang + S.zone + Object.keys(S.owned).join() + S.pond.cap + S.plots.filter(p => p.open).length;
  if (sig !== lastLang) build();
  updatePlots();
  const wx = G.weather(S.day), m = G.monthOf(S.day), dry = [1, 2, 3, 4, 12].includes(m);
  rain.visible = wx.rain > 0; rain.geometry.setDrawRange(0, Math.min(2500, 150 + wx.rain * 60)); rain.material.opacity = Math.min(0.85, 0.35 + wx.rain / 60);
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.getAttribute('data-theme') !== 'light';
  const sky = new THREE.Color(wx.rain > 15 ? 0x9aa8b2 : wx.rain > 0 ? 0xb9c8d2 : 0xcfe6f5); if (dark) sky.multiplyScalar(0.35);
  scene.background = sky; scene.fog = new THREE.Fog(sky, 120, 260);
  sun.intensity = (wx.rain > 15 ? 0.45 : wx.rain > 0 ? 0.75 : 1.1) * (dark ? 0.7 : 1);
  farmGround.material.color.set(dry ? 0xc9c08f : 0xb2c897);
  floodPlane.visible = S.flood > 0; if (floodPlane.visible) floodPlane.position.set(0, Math.min(1.6, S.flood / 250) * (S.up.dike ? 0.5 : 1), 0);
  if (pondWater) { const f = S.pond.cap ? S.pond.v / S.pond.cap : 0; pondWater.scale.y = Math.max(0.05, f); pondWater.position.y = -1 + f * 1 }
  const info = el.querySelector('.f3info'); if (info) info.textContent = `${G.dstr(S.day)} · ${wx.rain > 0 ? '🌧 ' + wx.rain + G.t(' มม.', ' mm') : '☀ ' + G.t('ไม่มีฝน', 'no rain')}${S.flood > 0 ? ' · 🌊 ' + G.t('น้ำหลาก', 'flood') : ''}`;
}

/* ---------- camera controls ---------- */
function placeCam(){
  cam.phi = Math.max(0.25, Math.min(1.42, cam.phi)); cam.r = Math.max(22, Math.min(190, cam.r));
  camera.position.set(cam.tx + cam.r * Math.sin(cam.phi) * Math.sin(cam.theta), cam.r * Math.cos(cam.phi), cam.tz + cam.r * Math.sin(cam.phi) * Math.cos(cam.theta));
  camera.lookAt(cam.tx, 0, cam.tz);
}
function bindControls(){
  const c = renderer.domElement, ptrs = new Map(); let moved = 0, pinch = 0, panMode = false;
  c.style.touchAction = 'none';
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; panMode = e.button === 2 || e.shiftKey; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]) } });
  c.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; const [px, py] = ptrs.get(e.pointerId), dx = e.clientX - px, dy = e.clientY - py; ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) cam.r *= pinch / d; pinch = d; return }
    if (panMode) { const s = cam.r / 600; cam.tx -= (dx * Math.cos(cam.theta) + dy * Math.sin(cam.theta)) * s; cam.tz -= (-dx * Math.sin(cam.theta) + dy * Math.cos(cam.theta)) * s }
    else { cam.theta -= dx * 0.006; cam.phi -= dy * 0.005 }
  });
  const up = e => { ptrs.delete(e.pointerId); pinch = 0; if (moved < 6 && e.type === 'pointerup') pick(e) };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('contextmenu', e => e.preventDefault());
  c.addEventListener('wheel', e => { e.preventDefault(); cam.r *= Math.exp(e.deltaY * 0.001) }, { passive:false });
  el.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.cam;
    if (v === 'reset') Object.assign(cam, { theta:-0.62, phi:0.92, r:92, tx:12, tz:2 });
    if (v === 'top') Object.assign(cam, { theta:0, phi:0.26, r:80, tx:5, tz:2 });
    if (v === 'plot') { const [x, z] = plotCenter(G.S.sel); Object.assign(cam, { r:30, tx:x, tz:z, phi:1.0 }) }
    if (v === 'chain') Object.assign(cam, { theta:-0.15, phi:0.78, r:110, tx:24, tz:0 });
  }));
}
function pick(e){
  const r = renderer.domElement.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera);
  const hit = rc.intersectObjects(plotsG, true)[0]; if (!hit) return;
  let o = hit.object; while (o && !plotsG.includes(o)) o = o.parent;
  if (o) G.select(o.userData.plot);
}
function loop(){
  cancelAnimationFrame(raf);
  if (!visible) return;
  const dt = Math.min(0.05, clock.getDelta());
  tick(dt); placeCam(); renderer.render(scene, camera);
  raf = requestAnimationFrame(loop);
}

/* ---------- view switch ---------- */
function setView(v){
  visible = v === '3d';
  document.getElementById('farm').toggleAttribute('hidden', visible); el.hidden = !visible;
  const leg = document.querySelector('.fieldcard > .note'); if (leg) leg.hidden = visible;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  try { localStorage.setItem(VIEW_KEY, v) } catch (e) {}
  if (!visible) { cancelAnimationFrame(raf); return }
  if (!ready) loadThree(() => { el.querySelector('.f3msg').hidden = true; init(); update() });
  else { resize(); update(); clock.getDelta(); loop() }
}
document.addEventListener('DOMContentLoaded', () => {
  G = window.__game; D = window.GAME_DATA; el = document.getElementById('farm3d');
  window.Farm3D = { update };
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  let v = '2d'; try { v = localStorage.getItem(VIEW_KEY) || '2d' } catch (e) {}
  try { const q = new URLSearchParams(location.search).get('view'); if (q === '3d' || q === '2d') v = q } catch (e) {}
  // wait until a game exists (setup screen first)
  const start = () => { if (G.S && !document.getElementById('game').hidden) setView(v); else setTimeout(start, 300) };
  start();
});
})();
