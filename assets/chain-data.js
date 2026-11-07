/* Value-chain data for value-chain.html. Every text is a [Thai, English] pair.
   stages: the main line from field to first saleable product, with typical machines at three business sizes:
     s = household / community enterprise, m = cooperative / SME, l = industrial plant.
   lines: by-product or derivative lines that can be added. mass = % of the raw crop the line captures,
     v = added value index (relative, for comparison only), min = smallest size that can usually run it,
     capex = 1–4 (rough investment class), feeds = downstream industries that use the output as feedstock.
   Mass shares are typical textbook figures, not yet checked against a single source; value indices are illustrative. */
window.CHAIN = {
crops: [
{ id:'rice', n:['ข้าว','Rice'], raw:['ข้าวเปลือก','paddy'], icon:'🌾',
  stages:[
    [['เตรียมดินและปลูก','Land prep and planting'], {s:['รถไถเดินตาม, หว่านมือ/เครื่องหยอด','Two-wheel tractor, hand broadcast / seeder'], m:['รถไถ 4 ล้อ, เครื่องปักดำ, โดรนหว่าน','Four-wheel tractor, transplanter, seeding drone'], l:['รถไถ GPS ปรับระดับเลเซอร์, เครื่องปักดำแถวกว้าง','GPS tractor with laser leveling, wide-row transplanter']}],
    [['เก็บเกี่ยว','Harvest'], {s:['เคียว + เครื่องนวดเล็ก หรือจ้างรถเกี่ยว','Sickle + small thresher, or hired combine'], m:['รถเกี่ยวนวดข้าว (combine)','Combine harvester'], l:['รถเกี่ยวนวดพร้อมแผนที่ผลผลิต','Combine with yield mapping']}],
    [['ลดความชื้นและเก็บ','Drying and storage'], {s:['ลานตาก, ยุ้งฉาง','Drying yard, granary'], m:['เครื่องอบแบบกะ (batch dryer), ไซโล','Batch dryer, silo'], l:['เครื่องอบต่อเนื่อง, ไซโลควบคุมอุณหภูมิ','Continuous dryer, temperature-controlled silos']}],
    [['สีข้าว','Milling'], {s:['โรงสีชุมชน 1–5 ตัน/วัน','Community mill, 1–5 t/day'], m:['โรงสี 20–100 ตัน/วัน + เครื่องคัดสี','20–100 t/day mill + color sorter'], l:['โรงสี 300+ ตัน/วัน, ขัดมัน, คัดสีหลายชั้น','300+ t/day mill, polishing, multi-stage color sorting']}],
    [['บรรจุและขาย','Packing and sale'], {s:['ถุงสุญญากาศ, ขายตรง/ออนไลน์','Vacuum bags, direct or online sales'], m:['เครื่องบรรจุอัตโนมัติ, ตราสินค้ากลุ่ม','Automatic bagging, group brand'], l:['สายบรรจุส่งออก, ตรวจสอบย้อนกลับ','Export packing line, traceability']}]
  ],
  main:{ n:['ข้าวสาร (รวมปลายข้าว)','Milled rice (incl. brokens)'], mass:62, v:10 },
  lines:[
    {id:'husk', n:['แกลบ → เชื้อเพลิงชีวมวล','Husk → biomass fuel'], mass:20, v:1.2, min:'m', capex:2, mach:['เตาเผาแกลบ/หม้อไอน้ำ, เครื่องอัดแท่ง','Husk furnace/boiler, briquetting press'], feeds:['โรงไฟฟ้าชีวมวล, ความร้อนในโรงอบ','Biomass power plants, heat for dryers']},
    {id:'ash', n:['ขี้เถ้าแกลบ → ซิลิกา','Rice-husk ash → silica'], mass:3, v:2.5, min:'l', capex:4, mach:['เตาเผาควบคุมอุณหภูมิ, ถังสกัดด่าง','Temperature-controlled kiln, alkali extraction tanks'], feeds:['ยางรถยนต์, ปูนซีเมนต์, วัสดุก่อสร้าง','Tires, cement, building materials']},
    {id:'bran', n:['รำข้าว → น้ำมันรำข้าว','Bran → rice bran oil'], mass:8, v:3, min:'l', capex:3, mach:['เครื่องสกัดตัวทำละลาย/บีบเย็น, เครื่องทำให้รำคงตัว','Solvent or cold-press extractor, bran stabilizer'], feeds:['น้ำมันพืช, แกมมาโอรีซานอล (เครื่องสำอาง อาหารเสริม), อาหารสัตว์','Cooking oil, gamma-oryzanol (cosmetics, supplements), animal feed']},
    {id:'broken', n:['ปลายข้าว → แป้งและเส้น','Broken rice → flour and noodles'], mass:10, v:2, min:'m', capex:2, mach:['เครื่องโม่แป้งเปียก/แห้ง, เครื่องทำเส้น','Wet/dry flour mill, noodle line'], feeds:['เส้นก๋วยเตี๋ยว ขนม แป้งไร้กลูเตน, เบียร์','Rice noodles, snacks, gluten-free flour, brewing']},
    {id:'straw', n:['ฟางข้าว → เห็ด/อาหารสัตว์/ไบโอชาร์','Straw → mushrooms / feed / biochar'], mass:0, v:1.5, min:'s', capex:1, mach:['เครื่องอัดฟางก้อน, โรงเรือนเห็ด, เตาเผาไบโอชาร์','Straw baler, mushroom house, biochar kiln'], feeds:['เห็ดฟาง, อาหารโค, ปรับปรุงดิน แทนการเผา','Straw mushrooms, cattle feed, soil amendment instead of burning'], note:['ฟางเก็บจากแปลง ไม่ได้มาจากข้าวเปลือก น้ำหนักใกล้เคียงข้าวเปลือก','Straw comes from the field, not the paddy; roughly equal in weight to the grain']}
  ]},
{ id:'cane', n:['อ้อย','Sugarcane'], raw:['อ้อย','cane'], icon:'🎋',
  stages:[
    [['ปลูก','Planting'], {s:['ปลูกด้วยแรงคน, รถไถเล็ก','Hand planting, small tractor'], m:['เครื่องปลูกอ้อยท่อน','Billet planter'], l:['เครื่องปลูกพร้อมใส่ปุ๋ยแบบแปรผัน','Planter with variable-rate fertilizing']}],
    [['ตัด','Harvest'], {s:['ตัดมือ (มักเผาใบก่อน)','Hand cutting (often burned first)'], m:['รถตัดอ้อยสด เช่าร่วมกัน','Shared green-cane harvester'], l:['รถตัดอ้อยสด + รถขนพ่วง','Green-cane harvester + in-field haulers']}],
    [['หีบสกัดน้ำอ้อย','Crushing'], {s:['เครื่องหีบน้ำอ้อยสด (ขายน้ำอ้อย/น้ำตาลอ้อยพื้นบ้าน)','Juice press (fresh juice, traditional jaggery)'], m:['โรงน้ำตาลทรายแดงขนาดเล็ก','Small non-centrifugal sugar plant'], l:['ชุดลูกหีบ 4–6 ชุด','4–6 roller mill tandem']}],
    [['ต้มเคี่ยวและตกผลึก','Evaporation and crystallization'], {s:['กระทะเคี่ยวเปิด','Open pans'], m:['หม้อต้มหลายชั้น','Multiple-effect evaporator'], l:['หม้อเคี่ยวสุญญากาศ, เครื่องปั่นแยก','Vacuum pans, centrifuges']}],
    [['บรรจุและขาย','Packing and sale'], {s:['น้ำตาลอ้อยก้อน/ผง ขายตลาดท้องถิ่น','Jaggery blocks or powder, local markets'], m:['ตราสินค้าน้ำตาลธรรมชาติ','Natural-sugar brand'], l:['ไซโลน้ำตาล, ท่าเรือส่งออก','Sugar silos, export port']}]
  ],
  main:{ n:['น้ำตาล','Sugar'], mass:11, v:10 },
  lines:[
    {id:'bagasse', n:['ชานอ้อย → ไฟฟ้าและไอน้ำ','Bagasse → power and steam'], mass:28, v:2.5, min:'l', capex:4, mach:['หม้อไอน้ำแรงดันสูง, กังหันไอน้ำ (cogeneration)','High-pressure boiler, steam turbine (cogeneration)'], feeds:['ไฟฟ้าขายเข้าระบบ, ไอน้ำใช้ในโรงงาน','Grid electricity, process steam']},
    {id:'pulp', n:['ชานอ้อย → เยื่อกระดาษ/บรรจุภัณฑ์','Bagasse → pulp and packaging'], mass:10, v:3, min:'l', capex:4, mach:['เครื่องแยกไส้, ถังต้มเยื่อ, เครื่องขึ้นรูปภาชนะ','Depither, pulp digester, molded-fiber former'], feeds:['จานชามย่อยสลายได้, กระดาษ','Compostable tableware, paper']},
    {id:'molasses', n:['กากน้ำตาล → เอทานอล','Molasses → ethanol'], mass:4.5, v:3, min:'l', capex:4, mach:['ถังหมัก, หอกลั่น, เครื่องแยกน้ำ','Fermenters, distillation columns, dehydration unit'], feeds:['แก๊สโซฮอล์, แอลกอฮอล์อุตสาหกรรม, ยีสต์, ผงชูรส','Gasohol, industrial alcohol, yeast, MSG']},
    {id:'plastic', n:['น้ำตาล → พลาสติกชีวภาพ (PLA)','Sugar → bioplastic (PLA)'], mass:3, v:6, min:'l', capex:4, mach:['ถังหมักกรดแลคติก, เครื่องพอลิเมอไรซ์','Lactic acid fermenters, polymerization reactor'], feeds:['บรรจุภัณฑ์ เส้นใย การพิมพ์ 3 มิติ','Packaging, fibers, 3D printing']},
    {id:'cake', n:['กากตะกอน + น้ำกากส่า → ปุ๋ยอินทรีย์','Filter cake + vinasse → organic fertilizer'], mass:3.5, v:0.8, min:'m', capex:2, mach:['ลานหมักปุ๋ย, เครื่องกลับกอง','Compost yard, windrow turner'], feeds:['ปุ๋ยกลับสู่ไร่อ้อย','Fertilizer back to the cane fields']}
  ]},
{ id:'cassava', n:['มันสำปะหลัง','Cassava'], raw:['หัวมันสด','fresh roots'], icon:'🥔',
  stages:[
    [['ปลูก','Planting'], {s:['ปักท่อนมือ','Hand-planted stakes'], m:['เครื่องปลูกมันติดรถไถ','Tractor-mounted planter'], l:['เครื่องปลูก + ระบบน้ำหยดใต้ดิน','Planter + subsurface drip']}],
    [['ขุด','Harvest'], {s:['ถอนมือ, เหล็กงัด','Hand pulling, lever bar'], m:['ผานขุดมันติดรถไถ','Tractor root lifter'], l:['รถขุดและเก็บหัวมัน','Lifting-and-collecting harvester']}],
    [['ล้างปอกและหั่น','Washing, peeling, chipping'], {s:['หั่นมือ ตากลาน (มันเส้น)','Hand chipping, yard drying (chips)'], m:['เครื่องสับมัน, ลานตาก, เครื่องอัดเม็ด','Chipper, drying yard, pellet mill'], l:['ถังล้างหมุน, เครื่องโม่ขูด','Rotary washer, rasper']}],
    [['สกัดแป้ง','Starch extraction'], {s:['—','—'], m:['—','—'], l:['เครื่องแยกกาก (extractor), เครื่องปั่นเหวี่ยงแยกแป้ง','Extractors, starch separators (centrifuges)']}],
    [['อบแห้งและบรรจุ','Drying and packing'], {s:['มันเส้นใส่กระสอบ','Chips in sacks'], m:['มันอัดเม็ดส่งออก','Export pellets'], l:['เครื่องอบแบบลมร้อน (flash dryer), ไซโลแป้ง','Flash dryer, starch silos']}]
  ],
  main:{ n:['แป้งมันดิบ (หรือมันเส้น)','Native starch (or chips)'], mass:24, v:10 },
  lines:[
    {id:'mod', n:['แป้งดัดแปร','Modified starch'], mass:6, v:4, min:'l', capex:3, mach:['ถังปฏิกรณ์เคมี/เอนไซม์, เครื่องอบ','Chemical/enzyme reactors, dryer'], feeds:['กระดาษ สิ่งทอ อาหารแปรรูป กาว','Paper, textiles, processed food, adhesives']},
    {id:'sweet', n:['กลูโคสไซรัป/ซอร์บิทอล','Glucose syrup / sorbitol'], mass:6, v:3.5, min:'l', capex:4, mach:['ถังย่อยด้วยเอนไซม์, เครื่องระเหย, เครื่องไฮโดรจิเนต','Enzyme hydrolysis tanks, evaporators, hydrogenation unit'], feeds:['ขนม เครื่องดื่ม ยาสีฟัน ยา','Confectionery, drinks, toothpaste, pharmaceuticals']},
    {id:'etoh', n:['มันเส้น → เอทานอล','Chips → ethanol'], mass:10, v:2.5, min:'l', capex:4, mach:['ถังหมัก, หอกลั่น','Fermenters, distillation'], feeds:['แก๊สโซฮอล์ E20/E85','Gasohol E20/E85']},
    {id:'pulp', n:['กากมัน → อาหารสัตว์','Cassava pulp → animal feed'], mass:12, v:0.8, min:'m', capex:1, mach:['เครื่องบีบน้ำ, ลานตาก/เครื่องอบ','Dewatering press, yard or dryer'], feeds:['อาหารโค สุกร','Cattle and pig feed']},
    {id:'biogas', n:['น้ำเสียแป้ง → ก๊าซชีวภาพ','Starch wastewater → biogas'], mass:0, v:1.5, min:'l', capex:3, mach:['บ่อหมักแบบปิด (UASB/covered lagoon), เครื่องยนต์ก๊าซ','Covered lagoon or UASB digester, gas engine'], feeds:['ความร้อนแทนน้ำมันเตาในโรงอบ, ไฟฟ้า','Heat to replace fuel oil in dryers, electricity'], note:['ใช้น้ำเสีย ไม่ได้ใช้น้ำหนักหัวมัน','Uses wastewater, not root mass']}
  ]},
{ id:'palm', n:['ปาล์มน้ำมัน','Oil palm'], raw:['ทะลายปาล์มสด','fresh fruit bunches'], icon:'🌴',
  stages:[
    [['ปลูกและดูแล','Planting and care'], {s:['ปลูกมือ, ใส่ปุ๋ยมือ','Hand planting and fertilizing'], m:['รถพ่นปุ๋ย, วิเคราะห์ใบ','Fertilizer spreader, leaf analysis'], l:['โดรนสำรวจสุขภาพต้น, ใส่ปุ๋ยตามแผนที่','Drone canopy survey, map-based fertilizing']}],
    [['ตัดทะลาย','Harvesting bunches'], {s:['เคียวด้ามยาว','Long-pole sickle'], m:['เคียวไฟฟ้า, รถเก็บทะลาย','Motorized cutter, bunch collector'], l:['รถตัดและขนในสวน','Mechanized cutting and in-field transport']}],
    [['นึ่งและแยกลูก','Sterilizing and threshing'], {s:['ลานเท ขายเข้าโรงงาน','Collection ramp, sell to mill'], m:['โรงสกัดขนาดเล็ก (ปาล์มน้ำมันรวม)','Mini mill (mixed oil)'], l:['หม้อนึ่งไอน้ำ, เครื่องตีทะลาย','Steam sterilizers, thresher']}],
    [['หีบน้ำมัน','Pressing'], {s:['—','—'], m:['เครื่องหีบสกรู','Screw press'], l:['เครื่องหีบสกรู, เครื่องแยกน้ำมัน (clarifier)','Screw presses, clarifier']}],
    [['กลั่นน้ำมัน','Refining'], {s:['—','—'], m:['ขายน้ำมันดิบให้โรงกลั่น','Sell crude oil to refinery'], l:['ฟอกสี กำจัดกลิ่น แยกส่วน','Bleaching, deodorizing, fractionation']}]
  ],
  main:{ n:['น้ำมันปาล์มดิบ (CPO)','Crude palm oil (CPO)'], mass:19, v:10 },
  lines:[
    {id:'kernel', n:['เมล็ดในปาล์ม → น้ำมันเมล็ดใน (PKO)','Kernel → palm kernel oil (PKO)'], mass:5, v:2.5, min:'l', capex:3, mach:['เครื่องกะเทาะ, เครื่องหีบเมล็ดใน','Nut cracker, kernel press'], feeds:['สบู่ ผงซักฟอก เครื่องสำอาง, กากเป็นอาหารสัตว์','Soap, detergent, cosmetics; cake to feed']},
    {id:'bio', n:['CPO → ไบโอดีเซล','CPO → biodiesel'], mass:4, v:2, min:'l', capex:4, mach:['ถังทรานส์เอสเทอริฟิเคชัน','Transesterification reactor'], feeds:['ดีเซลผสม B7/B10, กลีเซอรีน','B7/B10 diesel blend, glycerin']},
    {id:'oleo', n:['โอลีโอเคมี','Oleochemicals'], mass:4, v:4, min:'l', capex:4, mach:['เครื่องแยกกรดไขมัน, หอกลั่น','Fat splitting, distillation'], feeds:['เครื่องสำอาง ยา หล่อลื่น','Cosmetics, pharmaceuticals, lubricants']},
    {id:'efb', n:['ทะลายเปล่า → วัสดุคลุมดิน/ปุ๋ยหมัก','Empty bunches → mulch and compost'], mass:22, v:0.6, min:'m', capex:1, mach:['เครื่องสับทะลาย, ลานหมัก','Bunch shredder, compost yard'], feeds:['กลับคืนสวนปาล์ม, เพาะเห็ด','Back to the plantation, mushroom growing']},
    {id:'fiber', n:['เส้นใยและกะลา → เชื้อเพลิง','Fiber and shell → fuel'], mass:19, v:0.8, min:'l', capex:2, mach:['หม้อไอน้ำชีวมวล','Biomass boiler'], feeds:['ไอน้ำในโรงสกัด, ถ่านกัมมันต์จากกะลา','Mill steam, activated carbon from shell']},
    {id:'pome', n:['น้ำเสีย (POME) → ก๊าซชีวภาพ','Mill effluent (POME) → biogas'], mass:0, v:1.5, min:'l', capex:3, mach:['บ่อหมักแบบปิด, เครื่องยนต์ก๊าซ','Covered digester, gas engine'], feeds:['ไฟฟ้า ลดก๊าซมีเทน','Electricity, lower methane'], note:['ใช้น้ำเสีย ไม่ได้ใช้น้ำหนักทะลาย','Uses effluent, not bunch mass']}
  ]},
{ id:'rubber', n:['ยางพารา','Rubber'], raw:['น้ำยางสด','field latex'], icon:'🌳',
  stages:[
    [['กรีดยาง','Tapping'], {s:['มีดกรีด, ถ้วยรับน้ำยาง','Tapping knife, cups'], m:['มีดกรีดไฟฟ้า, กรีดถี่ต่ำ+สารเร่ง','Electric tapping knife, low-frequency tapping'], l:['ระบบติดตามต้นยางด้วยเซนเซอร์','Sensor-tracked trees']}],
    [['รวบรวม','Collection'], {s:['ถังเก็บน้ำยาง, ใส่แอมโมเนีย','Latex cans, ammonia'], m:['จุดรับซื้อสหกรณ์ วัดเปอร์เซ็นต์เนื้อยาง','Cooperative buying point with DRC testing'], l:['รถขนน้ำยางแช่เย็น','Chilled latex tankers']}],
    [['แปรรูปขั้นต้น','Primary processing'], {s:['ตะกง, เครื่องรีดแผ่น (ยางแผ่นดิบ)','Coagulation pans, sheet rollers (unsmoked sheet)'], m:['โรงอบยางแผ่นรมควัน (RSS)','Ribbed-smoked-sheet smokehouse'], l:['เครื่องปั่นน้ำยางข้น / สายผลิตยางแท่ง (STR)','Latex centrifuge / block rubber (STR) line']}],
    [['คัดเกรดและบรรจุ','Grading and packing'], {s:['ขายแผ่นที่ตลาดกลาง','Sell sheets at the central market'], m:['คัดเกรด RSS 1–5','RSS grades 1–5'], l:['อัดก้อน 35 กก. ห่อฟิล์ม ตรวจคุณภาพ','35 kg bales, film-wrapped, lab tested']}],
    [['ส่งโรงงานปลายน้ำ','To downstream plants'], {s:['—','—'], m:['ขายให้ผู้ส่งออก','Sell to exporters'], l:['โรงงานยางล้อ ถุงมือ','Tire and glove factories']}]
  ],
  main:{ n:['ยางแผ่น/ยางแท่ง/น้ำยางข้น','Sheets / block rubber / concentrated latex'], mass:33, v:10 },
  lines:[
    {id:'glove', n:['น้ำยางข้น → ถุงมือ ถุงยางอนามัย','Concentrated latex → gloves, condoms'], mass:15, v:8, min:'l', capex:4, mach:['สายจุ่มแม่พิมพ์ (dipping line), เตาอบ','Dipping lines, curing ovens'], feeds:['การแพทย์ อาหาร ห้องปฏิบัติการ','Medical, food, laboratories']},
    {id:'goods', n:['ยางแผ่น → ผลิตภัณฑ์ชุมชน','Sheet rubber → community products'], mass:5, v:4, min:'m', capex:2, mach:['เครื่องบดผสมยาง, แม่พิมพ์อัดร้อน','Two-roll mill, hot-press molds'], feeds:['หมอน ที่นอน แผ่นปูพื้น พื้นรองเท้า','Pillows, mattresses, mats, soles']},
    {id:'road', n:['ยาง → ถนนยางพารา/แผ่นยางกันกระแทก','Rubber → rubberized roads and fenders'], mass:8, v:2, min:'l', capex:3, mach:['เครื่องผสมยางมะตอย','Asphalt-rubber mixer'], feeds:['งานถนน ท่าเรือ','Roads, ports']},
    {id:'wood', n:['ไม้ยางหมดอายุ → เฟอร์นิเจอร์/แผ่นไม้','End-of-life trees → furniture and boards'], mass:0, v:3, min:'m', capex:3, mach:['โรงเลื่อย, เตาอบไม้, เครื่องอัด MDF','Sawmill, kiln, MDF press'], feeds:['เฟอร์นิเจอร์ส่งออก, ชีวมวล','Export furniture, biomass'], note:['ได้จากต้นยางอายุ 25 ปีขึ้นไป ไม่ได้มาจากน้ำยาง','From trees 25+ years old, not from latex']},
    {id:'serum', n:['หางน้ำยาง → ยางสกิม/ปุ๋ย','Latex serum → skim rubber / fertilizer'], mass:3, v:0.6, min:'l', capex:2, mach:['ถังจับตัว, บ่อบำบัด','Coagulation tanks, treatment ponds'], feeds:['ยางเกรดรอง, ปุ๋ยน้ำ','Low-grade rubber, liquid fertilizer']}
  ]},
{ id:'corn', n:['ข้าวโพดเลี้ยงสัตว์','Feed maize'], raw:['เมล็ดข้าวโพด','grain'], icon:'🌽',
  stages:[
    [['ปลูก','Planting'], {s:['หยอดมือบนที่ลาด (มักเผาแปลง)','Hand dibbling on slopes (often burned)'], m:['เครื่องหยอดเมล็ด ไม่ไถพรวน','No-till seeder'], l:['เครื่องปลูกความแม่นยำสูง GPS','GPS precision planter']}],
    [['เก็บเกี่ยว','Harvest'], {s:['หักฝักมือ, เครื่องกะเทาะ','Hand picking, sheller'], m:['รถเก็บเกี่ยวข้าวโพด','Corn combine'], l:['รถเก็บเกี่ยวพร้อมวัดความชื้น','Combine with moisture sensing']}],
    [['ลดความชื้น','Drying'], {s:['ลานตาก','Drying yard'], m:['เครื่องอบ, ตรวจอะฟลาทอกซิน','Dryer, aflatoxin test'], l:['ไซโลอบต่อเนื่อง','Continuous dryer silos']}],
    [['โรงอาหารสัตว์','Feed mill'], {s:['เครื่องบดผสมเล็ก','Small grinder-mixer'], m:['โรงอาหารสัตว์สหกรณ์','Cooperative feed mill'], l:['โรงอาหารสัตว์อัดเม็ด','Pelleted feed mill']}],
    [['ปศุสัตว์และอาหาร','Livestock and food'], {s:['ไก่ไข่/สุกรหลังบ้าน','Backyard layers or pigs'], m:['ฟาร์มเครือข่าย','Network farms'], l:['ฟาร์มพันธสัญญา, โรงชำแหละ, ส่งออกไก่','Contract farms, slaughterhouses, chicken exports']}]
  ],
  main:{ n:['เมล็ดข้าวโพดแห้ง/อาหารสัตว์','Dry grain / animal feed'], mass:100, v:10 },
  lines:[
    {id:'wet', n:['โม่เปียก → แป้งข้าวโพด, น้ำเชื่อม','Wet milling → corn starch, syrups'], mass:66, v:4, min:'l', capex:4, mach:['ถังแช่, เครื่องแยกจมูก, ไฮโดรไซโคลน','Steep tanks, germ separators, hydrocyclones'], feeds:['อาหาร เครื่องดื่ม กระดาษ, น้ำมันจากจมูก','Food, drinks, paper, germ oil']},
    {id:'etoh', n:['เอทานอล + กากส่า (DDGS)','Ethanol + distillers grains (DDGS)'], mass:30, v:2.5, min:'l', capex:4, mach:['โรงบด, ถังหมัก, หอกลั่น, เครื่องอบกาก','Hammer mill, fermenters, distillation, DDGS dryer'], feeds:['เชื้อเพลิง, อาหารสัตว์โปรตีนสูง','Fuel, high-protein feed']},
    {id:'cob', n:['ซังข้าวโพด → ชีวมวล/เฟอร์ฟิวรัล','Cobs → biomass / furfural'], mass:15, v:1, min:'m', capex:2, mach:['เครื่องอัดแท่ง, ถังปฏิกรณ์กรด','Briquetter, acid reactor'], feeds:['เชื้อเพลิงโรงงาน, เคมีภัณฑ์','Factory fuel, chemicals'], note:['ซังมาจากฝัก ไม่ใช่เมล็ด','Cobs come from the ear, not the grain']},
    {id:'stover', n:['ต้นและใบ → อาหารหยาบหมัก (ไม่เผา)','Stalks and leaves → silage (no burning)'], mass:0, v:1.2, min:'s', capex:1, mach:['เครื่องสับ, ถุงหมัก','Chopper, silage bags'], feeds:['โคเนื้อ โคนม ลดหมอกควัน','Beef and dairy cattle, less haze'], note:['เก็บจากแปลง','Collected from the field']}
  ]},
{ id:'coffee', n:['กาแฟอะราบิกา','Arabica coffee'], raw:['ผลกาแฟสด (เชอร์รี)','fresh cherries'], icon:'☕',
  stages:[
    [['ปลูกใต้ร่มไม้','Shade growing'], {s:['ปลูกใต้ป่า วนเกษตร','Under forest, agroforestry'], m:['แปลงรวมกลุ่ม + เรือนเพาะชำ','Group plots + nursery'], l:['สวนขนาดใหญ่ + ระบบน้ำ','Estate with irrigation']}],
    [['เก็บผลสุก','Picking ripe cherries'], {s:['เก็บมือเฉพาะผลแดง','Hand-pick red cherries only'], m:['เก็บมือ + เครื่องลอยน้ำคัดผล','Hand-picking + flotation sorting'], l:['เครื่องเขย่าต้น (ที่ราบ)','Mechanical harvester (flat land)']}],
    [['แปรรูปผลสด','Cherry processing'], {s:['ตากแห้งทั้งผล (natural) บนแคร่','Natural drying on raised beds'], m:['เครื่องสีเปลือกสด, ถังหมัก (washed/honey)','Pulper, fermentation tanks (washed/honey)'], l:['สายแปรรูปเปียก + เครื่องอบ','Wet mill + mechanical dryers']}],
    [['สีกะลาและคัด','Hulling and grading'], {s:['ครกตำ/เครื่องสีเล็ก','Mortar or small huller'], m:['เครื่องสีกะลา, ตะแกรงคัดขนาด','Huller, screen grader'], l:['เครื่องคัดสี, คัดความหนาแน่น','Optical sorter, density table']}],
    [['คั่วและขาย','Roasting and sale'], {s:['คั่วกระทะ ขายในชุมชน','Pan roasting, local sales'], m:['เครื่องคั่ว 5–15 กก., คัปปิ้งให้คะแนน','5–15 kg roaster, cupping scores'], l:['โรงคั่วอุตสาหกรรม, กาแฟสำเร็จรูป','Industrial roastery, instant coffee']}]
  ],
  main:{ n:['สารกาแฟ (green bean)','Green coffee'], mass:18, v:10 },
  lines:[
    {id:'spec', n:['กาแฟพิเศษ + ตรา GI/เรื่องเล่าต้นน้ำ','Specialty grade + GI and headwater story'], mass:6, v:6, min:'m', capex:2, mach:['ห้องคัปปิ้ง, เครื่องวัดความชื้น/ค่ากิจกรรมน้ำ','Cupping lab, moisture and water-activity meters'], feeds:['ร้านกาแฟพิเศษ ผู้ส่งออก','Specialty cafés, exporters']},
    {id:'cascara', n:['เปลือกผลสด → ชาคาสคาร่า','Cherry pulp → cascara tea'], mass:8, v:2, min:'s', capex:1, mach:['แคร่ตาก/ตู้อบลมร้อน','Drying racks or hot-air cabinet'], feeds:['เครื่องดื่ม ไซรัป','Drinks, syrups']},
    {id:'compost', n:['เปลือกและเมือก → ปุ๋ยหมัก/ก๊าซชีวภาพ','Pulp and mucilage → compost / biogas'], mass:30, v:0.5, min:'s', capex:1, mach:['บ่อหมัก, ถังก๊าซชีวภาพเล็ก','Compost pit, small biogas tank'], feeds:['กลับสู่แปลง ลดน้ำเสียลงห้วย','Back to the plots, less wastewater in streams']},
    {id:'grounds', n:['กากกาแฟ → วัสดุ/เครื่องสำอาง','Spent grounds → materials and cosmetics'], mass:0, v:1.5, min:'m', capex:2, mach:['เครื่องอบแห้ง, เครื่องสกัดน้ำมัน','Dryer, oil extractor'], feeds:['สครับ, วัสดุผสม, เพาะเห็ด','Scrubs, composites, mushroom substrate'], note:['เก็บจากร้านกาแฟปลายทาง','Collected back from cafés']}
  ]},
{ id:'durian', n:['ทุเรียน','Durian'], raw:['ผลทุเรียน','whole fruit'], icon:'🍈',
  stages:[
    [['ดูแลสวน','Orchard care'], {s:['ตัดแต่ง ผสมเกสรมือ','Pruning, hand pollination'], m:['ระบบน้ำ + เซนเซอร์ความชื้น','Irrigation + soil moisture sensors'], l:['สถานีอากาศ, โดรนพ่นชีวภัณฑ์','Weather stations, drones spraying biologicals']}],
    [['ตัดผล','Harvest'], {s:['นับวันหลังดอกบาน, เคาะฟังเสียง','Days after bloom, tapping'], m:['วัดน้ำหนักแห้งเนื้อ (dry matter)','Pulp dry-matter testing'], l:['เครื่องวัดความสุกแบบ NIR','NIR ripeness scanner']}],
    [['คัดและบรรจุ','Grading and packing'], {s:['คัดมือ ขายแผง','Hand grading, roadside stalls'], m:['ล้ง/โรงคัดบรรจุ GMP','Packing house (GMP)'], l:['สายคัด บรรจุ ติด QR ย้อนกลับ','Grading line, QR traceability']}],
    [['ความเย็น','Cold chain'], {s:['—','—'], m:['ห้องเย็น','Cold room'], l:['ตู้คอนเทนเนอร์แช่เย็น, รถไฟลาว–จีน','Reefer containers, Laos–China railway']}],
    [['แปรรูป','Processing'], {s:['ทุเรียนกวน ทอด','Durian paste, chips'], m:['แช่แข็ง IQF','IQF freezing'], l:['อบแห้งเยือกแข็ง (freeze-dry)','Freeze-drying']}]
  ],
  main:{ n:['ทุเรียนสด/เนื้อ','Fresh fruit / pulp'], mass:28, v:10 },
  lines:[
    {id:'frozen', n:['เนื้อแช่แข็ง/ฟรีซดราย','Frozen and freeze-dried pulp'], mass:8, v:5, min:'m', capex:3, mach:['เครื่องแช่แข็ง IQF, ตู้ฟรีซดราย','IQF freezer, freeze dryer'], feeds:['ขนม ไอศกรีม ส่งออกนอกฤดู','Desserts, ice cream, off-season exports']},
    {id:'husk', n:['เปลือก → เส้นใย/บรรจุภัณฑ์/ไบโอชาร์','Husk → fiber, packaging, biochar'], mass:55, v:1, min:'m', capex:2, mach:['เครื่องสับ, เครื่องขึ้นรูป, เตาไบโอชาร์','Shredder, molding press, biochar kiln'], feeds:['ภาชนะ วัสดุดูดซับ ปรับปรุงดิน','Containers, absorbents, soil amendment']},
    {id:'seed', n:['เมล็ด → แป้ง/อาหารสัตว์','Seeds → flour / feed'], mass:15, v:0.8, min:'m', capex:2, mach:['เครื่องต้ม อบ บด','Boiler, dryer, mill'], feeds:['แป้งพื้นบ้าน, อาหารสัตว์','Traditional flour, feed']},
    {id:'tour', n:['สวน → ท่องเที่ยวเกษตร','Orchard → agritourism'], mass:0, v:3, min:'s', capex:1, mach:['ที่พัก ทางเดิน ระบบจอง','Lodging, trails, booking'], feeds:['เทศกาลผลไม้ ลับแล','Fruit festivals, Laplae'], note:['รายได้ไม่ได้มาจากน้ำหนักผล','Income not tied to fruit mass']}
  ]}
],
sizes: [['s',['ครัวเรือน/วิสาหกิจชุมชน','Household / community enterprise']],['m',['สหกรณ์/SME','Cooperative / SME']],['l',['โรงงานอุตสาหกรรม','Industrial plant']]]
};
