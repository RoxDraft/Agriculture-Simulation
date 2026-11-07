/* Data for game.html ("Plot to Plant"). Every text is a [Thai, English] pair.
   Units: 1 plot = 2 rai (3,200 m²). Nutrients are plant-available kg per rai. Water in mm over the plot (1 mm on 1 rai = 1.6 m³).
   Numbers are rounded textbook / Thai-market levels used to make the game behave realistically.
   They are labelled "inferred" in the page: good enough to compare choices, not to plan an investment. */
window.GAME_DATA = (function(){
const RAI = 2;            // rai per plot
const M3_PER_MM = 1.6 * RAI;

/* Monthly climate of the Nan basin (approximate): rain mm/month, rain days, reference ET mm/day. Index 0 = January. */
const CLIMATE = {
  rain:  [6, 12, 35, 85, 185, 165, 225, 285, 225, 95, 22, 6],
  days:  [1, 2, 4, 8, 16, 18, 21, 23, 19, 10, 3, 1],
  et0:   [3.3, 4.0, 4.8, 5.2, 4.8, 4.2, 3.9, 3.8, 3.8, 3.7, 3.4, 3.1]
};

/* Three zones along one river, upstream to downstream (from the Nan basin page). */
const ZONES = {
  up: { n:['ต้นน้ำ · ที่สูงน่าน','Headwaters · Nan highlands'], alt:'600–1,000 m',
    soil:['ร่วนปนทราย ลาดชัน ~25%','Sandy loam on ~25% slopes'], awc:100, buffer:900, sand:true,
    start:{ph:5.0, om:2.6, N:6, P:2.5, K:30},
    rainMul:1.15, slope:true, flood:false,
    water:{ kind:'pond', n:['สระเก็บน้ำในไร่ + ลำห้วย','Farm pond + creek'], cap:1260, start:700, creek:8, cost:0 },
    risk:['ดินถูกชะล้างเมื่อฝนหนักบนดินเปล่า, หน้าแล้งน้ำน้อย, หมอกควันถ้าเผา','Erosion when heavy rain hits bare soil, little water in the dry season, haze if fields are burnt'],
    note:['ต้นน้ำเสียป่าให้ไร่ข้าวโพด ตะกอนและปุ๋ยที่หลุดจากแปลงไหลลงไปถึงคนปลายน้ำ','Forest here was cleared for maize; sediment and fertilizer that leave your plots reach people downstream'] },
  mid: { n:['กลางน้ำ · เขตชลประทานใต้เขื่อน','Midstream · irrigated land below the dam'], alt:'60–120 m',
    soil:['ร่วนเหนียว ที่ราบ','Clay loam on flat land'], awc:140, buffer:1500, sand:false,
    start:{ph:6.0, om:1.6, N:6, P:3, K:40},
    rainMul:1.0, slope:false, flood:false,
    water:{ kind:'canal', n:['คลองชลประทาน (มีโควตา)','Irrigation canal (quota)'], wet:90, dry:18, cost:0.25 },
    risk:['หน้าแล้ง (ม.ค.–เม.ย.) กรมชลประทานลดน้ำในคลอง ทำนาปรังได้จำกัด','In the dry season (Jan–Apr) the canal quota is cut, so dry-season rice is limited'],
    note:['ใช้น้ำจากเขื่อนร่วมกับคนทั้งลุ่มน้ำ ทุก ลบ.ม. ที่ใช้คือน้ำที่ปลายน้ำไม่ได้ใช้','You share dam water with the whole basin; every m³ you take is not available downstream'] },
  low: { n:['ปลายน้ำ · ที่ลุ่มพิจิตร–นครสวรรค์','Downstream · Phichit–Nakhon Sawan lowland'], alt:'20–35 m',
    soil:['ดินเหนียว ที่ลุ่มต่ำ','Heavy clay in low-lying land'], awc:160, buffer:2200, sand:false,
    start:{ph:6.5, om:1.3, N:6, P:3.5, K:55},
    rainMul:0.95, slope:false, flood:true,
    water:{ kind:'river', n:['สูบจากแม่น้ำ (ค่าน้ำมัน)','Pump from the river (fuel cost)'], wet:160, dry:45, cost:1.2 },
    risk:['น้ำหลาก ส.ค.–ต.ค. พืชไร่ที่จมน้ำเกิน 3 วันเสียหาย','Floods Aug–Oct; field crops under water for over 3 days are damaged'],
    note:['ปลายน้ำรับทั้งน้ำหลากและตะกอนจากต้นน้ำ ปลูกข้าวให้เกี่ยวก่อนน้ำมา','Downstream gets the floods and the sediment from upstream; time rice so it is cut before the water comes'] }
};

/* Crops. days = to maturity; win = days a ripe crop can wait before losses; ymax = t/rai of the raw product in a good year;
   suit = yield factor per zone; npk = plant uptake kg per t of raw product; kc = crop coefficient [early, peak, late];
   pond = grows in standing water; wlog = days of waterlogging tolerated; resid = residue t per t product. */
const CROPS = {
  rice: { n:['ข้าว (ไม่ไวแสง)','Rice (non-photoperiod)'], raw:'paddy', icon:'🌾', chain:'rice',
    days:120, win:15, ymax:0.85, suit:{up:0.6, mid:1, low:1}, npk:[17,3.2,17], ph:[5.5,6.5], kc:[1.05,1.2,0.9],
    pond:true, wlog:99, seed:450, harvest:600, resid:{item:'straw', t:0.9},
    pest:{ n:['เพลี้ยกระโดดสีน้ำตาล','Brown planthopper'], base:0.9, months:[6,7,8,9,10] },
    plant:{ root:['รากฝอย ลึก 20–30 ซม. มีช่องอากาศในลำต้นส่งออกซิเจนลงรากที่จมน้ำ','Fibrous roots 20–30 cm deep; air channels in the stem carry oxygen down to roots under water'],
      stem:['ลำต้นเป็นปล้องกลวง แตกกอ (หน่อ) 10–30 ต้นต่อกอ','Hollow jointed stems; each hill tillers into 10–30 shoots'],
      leaf:['ใบแคบยาว สังเคราะห์แสงแบบ C3','Long narrow leaves, C3 photosynthesis'],
      part:['เมล็ดในรวง (ข้าวเปลือก = แกลบหุ้มข้าวกล้อง)','Grains on the panicle (paddy = husk around brown rice)'],
      people:['ข้าวเลี้ยงคนในชุมชนก่อน ส่วนเกินขายโรงสี ฟางเลี้ยงวัวและเพาะเห็ด','Rice feeds the household first, the surplus goes to the mill, straw feeds cattle and mushroom beds'],
      env:['นาน้ำขังปล่อยมีเทน การเผาฟางทำให้เกิดหมอกควัน','Flooded paddies emit methane; burning straw causes haze'] } },
  corn: { n:['ข้าวโพดเลี้ยงสัตว์','Feed maize'], raw:'cornWet', icon:'🌽', chain:'corn',
    days:110, win:20, ymax:1.15, suit:{up:0.9, mid:1, low:0.85}, npk:[24,4.5,20], ph:[5.8,7.0], kc:[0.5,1.2,0.6],
    pond:false, wlog:3, seed:900, harvest:500, resid:{item:'stover', t:0.8},
    pest:{ n:['หนอนกระทู้ข้าวโพดลายจุด','Fall armyworm'], base:0.8, months:[5,6,7,8,9] },
    plant:{ root:['รากฝอยลึกถึง 1 ม. มีรากค้ำที่โคนต้น','Fibrous roots down to 1 m, with brace roots at the base'],
      stem:['ลำต้นตรงเป็นข้อปล้อง ไม่แตกกอ','Single upright jointed stalk, no tillers'],
      leaf:['ใบกว้าง สังเคราะห์แสงแบบ C4 ใช้น้ำคุ้มกว่าข้าว','Broad leaves, C4 photosynthesis, more crop per drop than rice'],
      part:['เมล็ดบนฝัก (ช่อดอกเพศเมีย) ช่อดอกเพศผู้อยู่ยอด','Kernels on the ear (female flower); the tassel on top is male'],
      people:['ส่งโรงงานอาหารสัตว์ เป็นรายได้หลักของไร่บนที่สูง','Goes to feed mills; the main cash crop of highland farms'],
      env:['ปลูกบนเขาโดยไม่คลุมดินทำให้ดินพัง เผาตอซังทำให้เกิด PM2.5','On hills without cover it erodes the soil; burning stubble makes PM2.5'] } },
  cassava: { n:['มันสำปะหลัง','Cassava'], raw:'roots', icon:'🍠', chain:'cassava',
    days:300, early:240, win:60, ymax:5.5, suit:{up:0.9, mid:1, low:0.75}, npk:[4.5,0.9,6.5], ph:[4.8,7.0], kc:[0.4,1.0,0.7],
    pond:false, wlog:3, seed:1200, harvest:1600, resid:{item:null, t:0},
    pest:{ n:['เพลี้ยแป้งมันสำปะหลัง','Cassava mealybug'], base:0.6, months:[1,2,3,4,11,12] },
    plant:{ root:['รากสะสมอาหาร (หัวมัน) พองออกจากรากฝอย เก็บแป้ง 20–30%','Storage roots swell from fibrous roots and hold 20–30% starch'],
      stem:['ลำต้นเป็นไม้พุ่ม ตัดท่อนปักชำปลูกรุ่นต่อไป','Woody shrub stem; cuttings are planted for the next crop'],
      leaf:['ใบเป็นแฉก ทิ้งใบเมื่อแล้งแต่หัวยังอยู่ได้','Lobed leaves that drop in drought while the roots survive'],
      part:['หัวมันสด ต้องส่งโรงงานภายใน 2–3 วันก่อนเสีย','Fresh roots, which rot within 2–3 days of digging'],
      people:['ลานมันในหมู่บ้านรับซื้อและตากมันเส้น โรงแป้งจ้างแรงงานท้องถิ่น','Village chip yards buy and dry chips; starch plants employ local people'],
      env:['ปลูกซ้ำโดยไม่คืนอินทรียวัตถุทำให้ดินจืด น้ำเสียโรงแป้งทำไบโอแก๊สได้','Repeated cropping without organic matter wears out soil; starch wastewater can make biogas'] } },
  cane: { n:['อ้อย','Sugarcane'], raw:'cane', icon:'🎋', chain:'cane',
    days:330, win:90, ymax:14, suit:{up:0.55, mid:1, low:0.95}, npk:[1.2,0.3,1.8], ph:[5.5,7.5], kc:[0.5,1.25,0.75],
    pond:false, wlog:5, seed:3500, harvest:0, cutPerT:220, ratoon:0.85, resid:{item:'trash', t:0.12},
    pest:{ n:['หนอนกออ้อย','Sugarcane stem borer'], base:0.5, months:[3,4,5,6,7] },
    plant:{ root:['รากฝอยแผ่กว้าง ตออ้อยแตกหน่อใหม่หลังตัด (อ้อยตอ)','Spreading fibrous roots; the stool regrows after cutting (ratoon)'],
      stem:['ลำต้นเก็บน้ำตาลซูโครสในเนื้อ 12–15%','The stalk stores 12–15% sucrose'],
      leaf:['ใบยาว C4 ใบแห้งที่เหลือ (ใบอ้อย) ขายเป็นเชื้อเพลิงได้','Long C4 leaves; the dry trash can be sold as fuel'],
      part:['ลำอ้อย ส่งโรงงานในฤดูหีบ ธ.ค.–เม.ย. เท่านั้น','Stalks, delivered only in the crushing season, Dec–Apr'],
      people:['ชาวไร่ส่งตามโควตาโรงงาน จ้างแรงงานตัดอ้อยในหมู่บ้าน','Growers deliver on mill quotas and hire village cutters'],
      env:['เผาอ้อยก่อนตัดเร็วกว่าแต่โรงงานหักราคาและเกิดฝุ่น','Burning before cutting is quicker, but mills cut the price and it makes dust'] } },
  coffee: { n:['กาแฟอาราบิก้า (ไม้ยืนต้น)','Arabica coffee (perennial)'], raw:'cherry', icon:'☕', chain:'coffee',
    perennial:true, first:730, days:365, ripe:[11,12,1], win:60, ymax:0.55, suit:{up:1, mid:0.15, low:0.05},
    npk:[22,3,24], ph:[5.0,6.5], kc:[0.9,1.0,0.95], pond:false, wlog:3, seed:18000, harvest:2500,
    resid:{item:null, t:0},
    pest:{ n:['มอดเจาะผลกาแฟ','Coffee berry borer'], base:0.4, months:[10,11,12,1] },
    plant:{ root:['รากแก้วสั้น รากแขนงหนาแน่นในดินชั้นบน ชอบดินร่วนมีอินทรียวัตถุ','Short taproot with dense surface feeder roots; likes loose, organic soil'],
      stem:['ไม้พุ่มยืนต้น อายุ 20+ ปี ให้ผลครั้งแรกราวปีที่ 3','Woody perennial for 20+ years, first crop around year 3'],
      leaf:['ใบมันหนา ชอบร่มเงาบางส่วน ปลูกใต้ไม้ป่าได้','Glossy leaves, likes partial shade, can grow under forest trees'],
      part:['ผลเชอร์รีสุกแดง ต้องแปรรูปภายในวันที่เก็บ','Ripe red cherries, processed the same day they are picked'],
      people:['ปลูกใต้ร่มไม้แทนข้าวโพดช่วยให้ป่าต้นน้ำกลับมา ขายเป็นกาแฟพิเศษได้ราคาสูง','Grown under trees instead of maize it helps the headwater forest return and sells as specialty coffee'],
      env:['เปลือกและน้ำล้างผลถ้าปล่อยลงห้วยทำน้ำเน่า ควรหมักเป็นปุ๋ย','Pulp and wash water foul streams if dumped; compost them instead'] } }
};

/* Items in the store. spoil = share lost per day in store. */
const ITEMS = {
  paddy:  { n:['ข้าวเปลือก','Paddy'], spoil:0.0005 },
  rice:   { n:['ข้าวสาร','Milled rice'], spoil:0.0003 },
  broken: { n:['ปลายข้าว','Broken rice'], spoil:0.0005 },
  bran:   { n:['รำข้าว','Rice bran'], spoil:0.006 },
  husk:   { n:['แกลบ','Rice husk'], spoil:0 },
  straw:  { n:['ฟางอัดก้อน','Baled straw'], spoil:0.001 },
  cornWet:{ n:['ข้าวโพดเมล็ดชื้น (~25%)','Wet maize grain (~25%)'], spoil:0.012 },
  corn:   { n:['ข้าวโพดแห้ง (14.5%)','Dry maize (14.5%)'], spoil:0.0005 },
  stover: { n:['ต้นข้าวโพดหมัก','Maize silage'], spoil:0.002 },
  roots:  { n:['หัวมันสด','Fresh cassava roots'], spoil:0.06 },
  chips:  { n:['มันเส้น','Cassava chips'], spoil:0.0005 },
  cane:   { n:['ลำอ้อย','Cane stalks'], spoil:0.03 },
  trash:  { n:['ใบอ้อยอัดก้อน','Baled cane trash'], spoil:0.001 },
  cherry: { n:['ผลกาแฟสด','Coffee cherries'], spoil:0.25 },
  green:  { n:['สารกาแฟ','Green coffee'], spoil:0.0002 },
  cascara:{ n:['คาสคาร่า (เปลือกตากแห้ง)','Cascara (dried husk)'], spoil:0.0005 }
};

/* Processing. out = t of each item per t of input (by mass, rest is moisture or loss). line = the value-chain line it maps to.
   own = cost to build (THB), cap = t input per day, run = THB per t when you own it, toll = THB per t to hire someone else's. */
const PROCS = {
  mill:  { n:['โรงสีข้าวชุมชน','Community rice mill'], input:'paddy', out:{rice:0.52, broken:0.10, bran:0.08, husk:0.20},
           own:150000, cap:1.5, run:350, toll:1100, crop:'rice', lines:['husk','bran','broken'] },
  dryer: { n:['เครื่องอบลดความชื้นข้าวโพด','Maize grain dryer'], input:'cornWet', out:{corn:0.88},
           own:120000, cap:4, run:280, toll:450, crop:'corn', lines:[] },
  chip:  { n:['เครื่องสับมัน + ลานตาก','Cassava chipper + drying yard'], input:'roots', out:{chips:0.40},
           own:70000, cap:6, run:160, toll:300, crop:'cassava', lines:['etoh','pulp'] },
  wet:   { n:['โรงแปรรูปกาแฟแบบเปียก + ลานตาก','Wet coffee mill + drying beds'], input:'cherry', out:{green:0.18, cascara:0.08},
           own:110000, cap:0.6, run:2500, toll:5000, crop:'coffee', lines:['spec','cascara','compost'], compost:0.3 }
};

/* Buyers. Each buys items at a base price (THB per t). season = months it buys (1–12), empty = all year.
   feeds links to a value-chain line [crop, line id] so the order card can say what the buyer turns it into. */
const BUYERS = [
  { id:'millco', n:['โรงสีเอกชน / ท่าข้าว','Private rice mill / paddy yard'], buys:{paddy:9500}, feeds:null },
  { id:'rshop',  n:['ผู้ค้าส่งข้าวสาร','Milled-rice wholesaler'], buys:{rice:19000}, feeds:null },
  { id:'noodle', n:['โรงงานเส้นก๋วยเตี๋ยว','Rice-noodle factory'], buys:{broken:12500}, feeds:['rice','broken'] },
  { id:'bran',   n:['โรงงานน้ำมันรำข้าว','Rice bran oil plant'], buys:{bran:8500}, feeds:['rice','bran'] },
  { id:'power',  n:['โรงไฟฟ้าชีวมวล','Biomass power plant'], buys:{husk:1300, trash:1100}, feeds:['rice','husk'] },
  { id:'feed',   n:['โรงงานอาหารสัตว์','Feed mill'], buys:{corn:9800, cornWet:7600, chips:7000, bran:7800, broken:11000}, feeds:null },
  { id:'dairy',  n:['สหกรณ์โคนม / ฟาร์มโคเนื้อ','Dairy co-op / beef farm'], buys:{straw:1600, stover:1900}, feeds:['corn','stover'] },
  { id:'mush',   n:['ฟาร์มเห็ดฟาง','Straw-mushroom farm'], buys:{straw:1900}, feeds:['rice','straw'] },
  { id:'starch', n:['โรงงานแป้งมันสำปะหลัง','Cassava starch plant'], buys:{roots:2700}, feeds:['cassava','mod'] },
  { id:'etoh',   n:['โรงงานเอทานอล','Ethanol plant'], buys:{chips:7400}, feeds:['cassava','etoh'] },
  { id:'sugar',  n:['โรงงานน้ำตาล','Sugar mill'], buys:{cane:1150}, season:[12,1,2,3,4], feeds:['cane','bagasse'] },
  { id:'roast',  n:['โรงคั่ว / ผู้ส่งออกกาแฟ','Coffee roaster / exporter'], buys:{green:185000, cherry:24000}, feeds:['coffee','spec'] },
  { id:'cafe',   n:['ผู้ผลิตเครื่องดื่ม','Drinks maker'], buys:{cascara:60000}, feeds:['coffee','cascara'] }
];

/* Inputs. Prices per kg (THB). n,p,k as fraction of element (P2O5 and K2O converted). lime = kg CaCO3 equivalent per kg. */
const INPUTS = {
  urea:  { n:['ยูเรีย 46-0-0','Urea 46-0-0'], kg:20, price:16, N:0.46, P:0, K:0, acid:1.8 },
  dap:   { n:['18-46-0','DAP 18-46-0'], kg:15, price:20, N:0.18, P:0.20, K:0, acid:1.0 },
  mop:   { n:['0-0-60','Potash 0-0-60'], kg:15, price:17, N:0, P:0, K:0.50, acid:0 },
  npk:   { n:['15-15-15','NPK 15-15-15'], kg:30, price:19, N:0.15, P:0.065, K:0.125, acid:0.8 },
  manure:{ n:['ปุ๋ยคอก/ปุ๋ยหมัก','Manure / compost'], kg:1000, price:2.2, N:0.015, P:0.005, K:0.01, om:0.08, slow:true },
  lime:  { n:['โดโลไมท์','Dolomite lime'], kg:200, price:2, N:0, P:0, K:0, lime:1.0 }
};

/* Investments that change how the farm works. */
const UPGRADES = {
  pond:   { n:['ขุดสระเพิ่ม 1,260 ลบ.ม.','Dig a 1,260 m³ pond'], cost:28000, d:['เก็บน้ำฝนไว้ใช้หน้าแล้ง','Stores rain for the dry season'] },
  drip:   { n:['ระบบน้ำหยด (ทุกแปลง)','Drip irrigation (all plots)'], cost:45000, d:['น้ำถึงราก 90% แทน 60%','90% of water reaches roots instead of 60%'] },
  sensor: { n:['เซนเซอร์ความชื้น + ตั้งเวลา','Moisture sensors + timer'], cost:24000, d:['ให้น้ำเองเมื่อดินแห้งกว่า 45%','Waters automatically when soil drops below 45%'] },
  solar:  { n:['ปั๊มโซลาร์เซลล์','Solar pump'], cost:65000, d:['ค่าสูบน้ำเหลือ 0','Pumping costs nothing'] },
  contour:{ n:['แถบหญ้าแฝกตามแนวระดับ','Vetiver contour strips'], cost:9000, d:['ลดดินพังบนที่ลาด 70%','Cuts erosion on slopes by 70%'] },
  dike:   { n:['คันดินกันน้ำรอบแปลง','Earth dikes around plots'], cost:40000, d:['น้ำหลากเข้าแปลงน้อยลง 70%','Keeps 70% of floodwater out'] },
  land:   { n:['เช่าที่เพิ่ม 2 แปลง (4 ไร่)','Rent 2 more plots (4 rai)'], cost:16000, d:['ค่าเช่า 2,000 บาท/ไร่/ปี จ่ายครั้งเดียวในเกมนี้','About 2,000 THB/rai/yr, paid once in this game'] }
};

const OPS = { plow:500, spray:180, bio:140, bale:300, burnN:0.9 };

return { RAI, M3_PER_MM, CLIMATE, ZONES, CROPS, ITEMS, PROCS, BUYERS, INPUTS, UPGRADES, OPS };
})();
