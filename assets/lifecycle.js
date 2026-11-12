/* plants.html topics 9–10: three small animations, drawn as inline SVG with no external assets.
   1. #lc-plant   mung bean life cycle, day 0–75 (slider + play), loops back to a new seed.
   2. #lc-leaf    a bipinnate leaf (rain tree / ก้ามปู type) unfolding from a bud by water uptake.
   3. #lc-cells   a root tip: cells made by division at the tip, then stretched in the elongation zone.
   Motion starts only when a figure is on screen and never by itself under prefers-reduced-motion. */
(function(){
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(x){ return x < 0 ? 0 : x > 1 ? 1 : x }
  function s(d, a, b){ return clamp((d - a) / (b - a)) }
  function ease(x){ return x * x * (3 - 2 * x) }
  function mix(c1, c2, k){ // hex colours
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16), r = '#';
    [16, 8, 0].forEach(function(sh){
      var v = Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k);
      r += (v < 16 ? '0' : '') + v.toString(16);
    });
    return r;
  }
  function T(th, en){ return window.I18N ? I18N.t(th, en) : th }

  /* A play/pause loop bound to a range input. step(dt) returns nothing; the range is the clock. */
  function loop(fig, range, btn, max, perSec, draw){
    var playing = false, last = 0, visible = false;
    function frame(ts){
      if (!playing) return;
      if (last) {
        var v = +range.value + (ts - last) / 1000 * perSec;
        if (v > max) v = 0;
        range.value = v; draw(v);
      }
      last = ts; requestAnimationFrame(frame);
    }
    function set(p){
      playing = p; last = 0;
      btn.setAttribute('aria-pressed', String(p));
      btn.querySelector('.th').textContent = p ? 'หยุด' : 'เล่น';
      btn.querySelector('.en').textContent = p ? 'Pause' : 'Play';
      if (p) requestAnimationFrame(frame);
    }
    btn.addEventListener('click', function(){ set(!playing) });
    range.addEventListener('input', function(){ set(false); draw(+range.value) });
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting && !visible) { visible = true; set(true) }
          else if (!e.isIntersecting && visible) { visible = false; set(false) }
        });
      }, {threshold: .35}).observe(fig);
    }
    draw(+range.value);
  }

  /* ---------- 1. Mung bean life cycle ---------- */
  var STAGES = [
    {a: 0,  b: 1.5, th: 'เมล็ดดูดน้ำ พองตัว', en: 'Seed takes up water and swells'},
    {a: 1.5, b: 3.5, th: 'งอก: รากแรกเกิดแทงลงดิน', en: 'Germination: the first root pushes down'},
    {a: 3.5, b: 7, th: 'ต้นอ่อน: ลำต้นงอเป็นตะขอดันดิน แล้วใบเลี้ยงกาง', en: 'Seedling: a hooked stem pushes up, then the seed leaves open'},
    {a: 7,  b: 30, th: 'สร้างลำต้นและใบ ปมรากเริ่มตรึงไนโตรเจน', en: 'Stems and leaves grow; root nodules start fixing nitrogen'},
    {a: 30, b: 45, th: 'ออกดอก ผสมเกสรในดอกตัวเอง', en: 'Flowering, mostly self-pollinated'},
    {a: 45, b: 66, th: 'ติดฝัก เมล็ดสะสมแป้งและโปรตีน', en: 'Pods fill; seeds store starch and protein'},
    {a: 66, b: 75, th: 'ต้นแก่ ใบเหลือง ฝักแตก เมล็ดร่วง วงจรใหม่', en: 'Plant ages, leaves yellow, pods split, seeds fall: a new cycle'}
  ];
  var NODES = [ // height above ground (px), day the leaf starts, side, kind
    {y: 46, d: 6.5, side: 0, k: 'uni'},
    {y: 72, d: 11, side: 1, k: 'tri'},
    {y: 94, d: 15, side: -1, k: 'tri'},
    {y: 114, d: 19, side: 1, k: 'tri', fl: 1},
    {y: 132, d: 23, side: -1, k: 'tri', fl: 1},
    {y: 148, d: 27, side: 1, k: 'tri', fl: 1}
  ];
  var G = 228, X = 240; // ground line and stem x

  function leafColor(d, i){ return mix('#3f8a35', '#c9a93a', s(d, 62 - i, 71 - i)) }

  function leaflet(cx, cy, len, w, ang, fill){
    return '<ellipse cx="' + (cx + Math.cos(ang) * len / 2).toFixed(1) + '" cy="' + (cy + Math.sin(ang) * len / 2).toFixed(1) +
      '" rx="' + (len / 2).toFixed(1) + '" ry="' + w.toFixed(1) + '" transform="rotate(' + (ang * 180 / Math.PI).toFixed(1) + ' ' +
      (cx + Math.cos(ang) * len / 2).toFixed(1) + ' ' + (cy + Math.sin(ang) * len / 2).toFixed(1) + ')" fill="' + fill + '"/>';
  }

  function plantSVG(d){
    var o = [];
    // sky and soil
    o.push('<rect x="0" y="0" width="480" height="' + G + '" class="lc-sky"/>');
    o.push('<rect x="0" y="' + G + '" width="480" height="' + (340 - G) + '" class="lc-soil"/>');
    o.push('<path d="M0 ' + G + 'H480" class="lc-ground"/>');
    // sun
    o.push('<circle cx="430" cy="42" r="16" fill="#f2c14e" opacity=".9"/>');
    // water drops during imbibition
    if (d < 2.5) for (var k = 0; k < 4; k++) {
      var yy = 120 + ((d * 60 + k * 30) % 110);
      o.push('<path d="M' + (205 + k * 22) + ' ' + yy + 'q-4 7 0 9q4-2 0-9z" fill="#5fb7bf" opacity="' + (1 - s(d, 1.8, 2.5)).toFixed(2) + '"/>');
    }

    var seedY = G + 22;
    var swell = 1 + .3 * s(d, 0, 1.5);
    var hyp = 26 * ease(s(d, 3, 6.5));                          // hypocotyl above ground
    var h = hyp + 132 * Math.pow(s(d, 6.5, 40), .8);                     // whole stem above ground
    var hook = 1 - s(d, 4.6, 6.5);                               // hypocotyl hook straightens
    var stemTop = G - h;

    // roots
    var rl = 52 * ease(s(d, 1.5, 9)) + 34 * s(d, 9, 40);
    if (rl > 0) {
      o.push('<path d="M' + X + ' ' + seedY + 'q3 ' + (rl / 2).toFixed(1) + ' -2 ' + rl.toFixed(1) + '" class="lc-root"/>');
      for (var r = 0; r < 6; r++) {
        var ry = seedY + 10 + r * 11; if (ry > seedY + rl - 6) break;
        var rlen = 26 * s(d, 7 + r * 3, 22 + r * 3) * (1 - r * .08), dir = r % 2 ? -1 : 1;
        if (rlen > 1) {
          o.push('<path d="M' + X + ' ' + ry + 'q' + (dir * rlen * .6).toFixed(1) + ' 4 ' + (dir * rlen).toFixed(1) + ' ' + (10 + r).toFixed(1) + '" class="lc-root thin"/>');
          if (d > 14 + r * 2 && r < 4) o.push('<circle cx="' + (X + dir * rlen * .55).toFixed(1) + '" cy="' + (ry + 4).toFixed(1) + '" r="2.6" fill="#d78a8a"/>');
        }
      }
    }
    // meristem markers: shoot tip and root tip
    if (d >= 1.5 && d < 62) {
      var pulse = 2.5 + Math.sin(d * 6) * .8;
      o.push('<circle cx="' + (X - 2) + '" cy="' + (seedY + rl).toFixed(1) + '" r="' + pulse.toFixed(1) + '" class="lc-mer"/>');
    }

    // seed / seed coat
    if (d < 4.6) {
      o.push('<ellipse cx="' + X + '" cy="' + seedY + '" rx="' + (9 * swell).toFixed(1) + '" ry="' + (6.5 * swell).toFixed(1) + '" fill="#4f7a3a" stroke="#2e4a22"/>');
    } else if (d < 30) {
      o.push('<path d="M' + (X - 14) + ' ' + (seedY + 2) + 'q5 -7 10 -2" stroke="#6b5a3a" stroke-width="2" fill="none" opacity="' + (1 - s(d, 18, 30)).toFixed(2) + '"/>');
    }

    // stem: from seed up through the ground
    if (d >= 3) {
      var bend = 14 * hook;
      var cotX = X + bend, cotY = d < 6.5 ? stemTop + 12 * hook : G - hyp;
      if (h > 0.5) {
        o.push('<path d="M' + X + ' ' + seedY + 'L' + X + ' ' + (stemTop + (hook > 0 ? 6 : 0)).toFixed(1) +
          (hook > 0 ? 'q0 -8 ' + bend.toFixed(1) + ' ' + (4 + 8 * hook).toFixed(1) : '') + '" class="lc-stem" style="stroke-width:' + (3 + 2 * s(d, 10, 40)).toFixed(1) + '"/>');
      }
      // cotyledons: thick, open from the hook, shrink and drop after ~3 weeks
      var cs = 1 - s(d, 14, 22), open = ease(s(d, 4.8, 7));
      if (cs > 0 && h > 2) {
        var cx = d < 6.5 ? cotX : X, cy = d < 6.5 ? stemTop + 6 + 10 * hook : cotY;
        var fill = mix('#6c9a3c', '#c9b04a', s(d, 12, 20));
        // closed: both hang down from the hook; open: spread left and right, slightly up
        var a1 = Math.PI / 2 + (Math.PI / 2 + .25) * open, a2 = Math.PI / 2 - (Math.PI / 2 + .25) * open;
        o.push(leaflet(cx, cy, 15 * cs, 6 * cs, a1, fill));
        o.push(leaflet(cx, cy, 15 * cs, 6 * cs, a2, fill));
      }
    }

    // true leaves
    NODES.forEach(function(n, i){
      if (h < n.y - 2) return;
      var g = ease(s(d, n.d, n.d + 7)), drop = s(d, 70 - i, 74 - i);
      if (g <= 0) return;
      var ny = G - n.y, col = leafColor(d, i), sc = g * (1 - drop * .4);
      if (drop >= 1) {} // leaf has fallen; flowers and pods below still drawn
      else if (n.k === 'uni') {
        [-1, 1].forEach(function(sd){
          o.push(leaflet(X, ny, 30 * sc, 9 * sc, sd < 0 ? Math.PI + .35 : -.35, col));
        });
      } else {
        var pl = 26 * sc, px = X + n.side * pl, py = ny - pl * .45;
        o.push('<path d="M' + X + ' ' + ny + 'L' + px.toFixed(1) + ' ' + py.toFixed(1) + '" class="lc-pet"/>');
        var base = n.side > 0 ? -.35 : Math.PI + .35;
        o.push(leaflet(px, py, 30 * sc, 10 * sc, base, col));
        o.push(leaflet(px, py, 24 * sc, 8 * sc, base - .9, col));
        o.push(leaflet(px, py, 24 * sc, 8 * sc, base + .9, col));
      }
      // flowers and pods in the upper leaf axils
      if (n.fl) {
        var fx = X + n.side * 9, fy = ny - 6;
        var fg = s(d, 30 + i, 34 + i), fo = 1 - s(d, 44, 48);
        if (fg > 0 && fo > 0) for (var f = 0; f < 3; f++) {
          o.push('<circle cx="' + (fx + n.side * f * 5).toFixed(1) + '" cy="' + (fy - f * 4).toFixed(1) + '" r="' + (3.6 * fg).toFixed(1) +
            '" fill="#f4cf3a" stroke="#c99a16" stroke-width=".8" opacity="' + fo.toFixed(2) + '"/>');
        }
        var pg = ease(s(d, 42 + i, 55 + i));
        if (pg > 0) {
          var pc = mix('#5c9a3a', '#2e2a22', s(d, 58, 67));
          for (var p = 0; p < 3; p++) {
            var ang = (n.side > 0 ? .55 : Math.PI - .55) + (p - 1) * .3 * n.side + (n.side > 0 ? .35 : -.35) * s(d, 58, 68);
            var plen = 34 * pg, sx = fx + n.side * p * 3, sy = fy - p * 3;
            var split = s(d, 69, 71);
            o.push('<path d="M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + 'l' + (Math.cos(ang) * plen).toFixed(1) + ' ' + (Math.sin(ang) * plen).toFixed(1) +
              '" stroke="' + pc + '" stroke-width="' + (4.2 - split * 1.6).toFixed(1) + '" stroke-linecap="round" fill="none"/>');
            // falling seeds
            if (d > 69 && p < 2) {
              var fall = ease(s(d, 70 + p, 73.5 + p));
              var tx = sx + Math.cos(ang) * plen * .6, ty = sy + Math.sin(ang) * plen * .6;
              var gx = tx + n.side * 12 * fall, gy = ty + (G + 6 - ty) * fall;
              o.push('<ellipse cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" rx="3.2" ry="2.4" fill="#4f7a3a" stroke="#2e4a22" stroke-width=".6"/>');
            }
          }
        }
      }
    });
    if (d >= 3 && d < 62 && h > 8) {
      o.push('<circle cx="' + X + '" cy="' + (stemTop + (hook > 0 ? 12 * hook : 0)).toFixed(1) + '" r="' + (2.5 + Math.sin(d * 6 + 1) * .8).toFixed(1) + '" class="lc-mer"/>');
    }
    // labels
    o.push('<text x="16" y="' + (G - 8) + '" class="lc-lab">' + T('ผิวดิน', 'soil surface') + '</text>');
    if (d >= 1.5 && d < 62) o.push('<text x="16" y="326" class="lc-lab"><tspan class="lc-merk">●</tspan> ' + T('จุดที่เซลล์แบ่งตัว (เนื้อเยื่อเจริญปลายยอดและปลายราก)', 'where cells divide (shoot and root tips)') + '</text>');
    if (d > 14 && d < 70) o.push('<text x="300" y="300" class="lc-lab"><tspan fill="#d78a8a">●</tspan> ' + T('ปมราก', 'root nodules') + '</text>');
    return o.join('');
  }

  function initPlant(){
    var fig = document.getElementById('lc-plant'); if (!fig) return;
    var svg = fig.querySelector('svg'), range = fig.querySelector('input[type=range]'), btn = fig.querySelector('.lc-play');
    var dayEl = fig.querySelector('.lc-day'), list = fig.querySelectorAll('.lc-stages li');
    function draw(d){
      svg.innerHTML = plantSVG(d);
      dayEl.textContent = Math.floor(d);
      var cur = 0; STAGES.forEach(function(st, i){ if (d >= st.a) cur = i });
      list.forEach(function(li, i){ li.classList.toggle('on', i === cur) });
      range.setAttribute('aria-valuetext', T('วันที่ ', 'Day ') + Math.floor(d) + ': ' + T(STAGES[cur].th, STAGES[cur].en));
    }
    list.forEach(function(li, i){
      function go(){ range.value = STAGES[i].a + .01; range.dispatchEvent(new Event('input')) }
      li.addEventListener('click', go);
      li.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } });
    });
    loop(fig, range, btn, 75, 6, draw);
    window.addEventListener('langchange', function(){ draw(+range.value) });
  }

  /* ---------- 2. Bipinnate leaf unfolding ---------- */
  function leafSVG(u){
    var o = [], e = ease(u);
    var rachis = 70 + 110 * e;                       // main axis length
    var x0 = 40, y0 = 150;
    o.push('<rect width="480" height="230" class="lc-sky"/>');
    // twig and bud scales
    o.push('<path d="M0 ' + (y0 + 40) + 'Q20 ' + (y0 + 20) + ' ' + x0 + ' ' + y0 + '" class="lc-stem" style="stroke-width:5"/>');
    o.push('<ellipse cx="' + x0 + '" cy="' + y0 + '" rx="7" ry="5" fill="#8b6a3e"/>');
    var ang = -.42;
    var ex = x0 + Math.cos(ang) * rachis, ey = y0 + Math.sin(ang) * rachis;
    o.push('<path d="M' + x0 + ' ' + y0 + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '" class="lc-pet" style="stroke-width:2.6"/>');
    var col = mix('#9cc46a', '#3f8a35', e);
    for (var p = 0; p < 3; p++) {
      var t = .45 + p * .25, px = x0 + Math.cos(ang) * rachis * t, py = y0 + Math.sin(ang) * rachis * t;
      [-1, 1].forEach(function(sd){
        var pin = (12 + 70 * e) * (1 - p * .08);
        var pa = ang + sd * (.18 + 1.05 * e);          // pinna swings out from the axis
        var qx = px + Math.cos(pa) * pin, qy = py + Math.sin(pa) * pin;
        o.push('<path d="M' + px.toFixed(1) + ' ' + py.toFixed(1) + 'L' + qx.toFixed(1) + ' ' + qy.toFixed(1) + '" class="lc-pet" style="stroke-width:1.4"/>');
        for (var l = 1; l <= 6; l++) {
          var lt = l / 6.4, lx = px + Math.cos(pa) * pin * lt, ly = py + Math.sin(pa) * pin * lt;
          var size = (3 + 10 * e) * (1 - l * .04);
          [-1, 1].forEach(function(ls){
            var la = pa + ls * (.12 + 1.25 * ease(s(u, .25, 1)));  // leaflets open last
            o.push(leaflet(lx, ly, size, size * .38, la, col));
          });
        }
      });
    }
    o.push('<text x="16" y="218" class="lc-lab">' + T('ใบประกอบแบบขนนกสองชั้น: ใบย่อยถูกสร้างครบตั้งแต่อยู่ในตา แล้วจึงดูดน้ำกางออก', 'Bipinnate leaf: every leaflet already exists in the bud; it only takes up water and spreads') + '</text>');
    return o.join('');
  }
  function initLeaf(){
    var fig = document.getElementById('lc-leaf'); if (!fig) return;
    var svg = fig.querySelector('svg'), range = fig.querySelector('input[type=range]'), btn = fig.querySelector('.lc-play');
    var lab = fig.querySelector('.lc-day');
    function draw(v){
      var u = Math.min(v, 1); svg.innerHTML = leafSVG(u);
      lab.textContent = Math.round(u * 100);
      range.setAttribute('aria-valuetext', Math.round(u * 100) + '%');
    }
    loop(fig, range, btn, 1.25, .28, draw); // the extra .25 holds the open leaf on screen before looping
    window.addEventListener('langchange', function(){ draw(+range.value) });
  }

  /* ---------- 3. Root tip: division then elongation ---------- */
  function cellLen(age){ // px: small while dividing, stretched ~8x in the elongation zone, then fixed
    return 6 + 42 * ease(s(age, 6, 16));
  }
  function cellsSVG(time){
    var o = [], RATE = 1.4;                          // new cells per time unit at the tip
    o.push('<rect width="480" height="150" class="lc-soil"/>');
    var tipX = 452, y = 50, hgt = 34;
    // newest cell at the tip; walk back towards the base
    var n = Math.floor(time * RATE), frac = time * RATE - n, x = tipX;
    // root cap
    o.push('<path d="M' + tipX + ' ' + y + 'q24 ' + (hgt / 2) + ' 0 ' + hgt + 'z" fill="#c9a074" stroke="#7a4f2c" stroke-width="1"/>');
    for (var i = 0; i < 60 && x > 0; i++) {
      var age = (i + frac) / RATE, L = cellLen(age);
      var zone = age < 6 ? 0 : age < 16 ? 1 : 2;
      o.push('<rect x="' + (x - L).toFixed(1) + '" y="' + y + '" width="' + L.toFixed(1) + '" height="' + hgt + '" class="lc-cell z' + zone + '"/>');
      if (zone === 0 && ((n - i) % 3 === 0) && frac > .5) o.push('<path d="M' + (x - L / 2).toFixed(1) + ' ' + (y + 4) + 'v' + (hgt - 8) + '" stroke="#3f7a35" stroke-dasharray="2 2"/>');
      x -= L;
    }
    // zone labels: positions from the tip
    function zoneEnd(maxAge){ var xx = tipX; for (var i = 0; i < 80; i++){ var a = (i + frac) / RATE; if (a >= maxAge) break; xx -= cellLen(a) } return xx }
    var d1 = zoneEnd(6), d2 = zoneEnd(16);
    o.push('<path d="M' + d1.toFixed(1) + ' 96v12M' + d2.toFixed(1) + ' 96v12M' + tipX + ' 96v12" stroke="currentColor" opacity=".5"/>');
    o.push('<text x="' + ((tipX + d1) / 2).toFixed(1) + '" y="124" text-anchor="middle" class="lc-lab">' + T('แบ่งเซลล์', 'division') + '</text>');
    o.push('<text x="' + ((d1 + d2) / 2).toFixed(1) + '" y="124" text-anchor="middle" class="lc-lab">' + T('ยืดเซลล์ (ดูดน้ำ)', 'elongation (water uptake)') + '</text>');
    o.push('<text x="' + Math.max(8, d2 / 2 - 70).toFixed(1) + '" y="124" class="lc-lab">' + T('เซลล์โตเต็มที่ เริ่มมีขนราก', 'mature, root hairs') + '</text>');
    for (var hr = 0; hr < 12; hr++) { var hx = d2 - 12 - hr * 16; if (hx < 4) break; o.push('<path d="M' + hx + ' ' + y + 'l-3 -' + (10 + hr % 3 * 3) + 'M' + (hx - 6) + ' ' + (y + hgt) + 'l-3 ' + (10 + hr % 2 * 4) + '" stroke="#a37a52" stroke-width="1"/>') }
    o.push('<text x="16" y="24" class="lc-lab">' + T('ปลายราก (ขยายราว 40 เท่า) ปลายรากอยู่ทางขวา', 'Root tip (about 40× magnified), tip on the right') + '</text>');
    return o.join('');
  }
  function initCells(){
    var fig = document.getElementById('lc-cells'); if (!fig) return;
    var svg = fig.querySelector('svg'), range = fig.querySelector('input[type=range]'), btn = fig.querySelector('.lc-play');
    function draw(v){ svg.innerHTML = cellsSVG(v); range.setAttribute('aria-valuetext', v.toFixed(1)) }
    loop(fig, range, btn, 40, 1.6, draw);
    window.addEventListener('langchange', function(){ draw(+range.value) });
  }

  document.addEventListener('DOMContentLoaded', function(){ initPlant(); initLeaf(); initCells() });
})();
