/* 100-year history data for value-chain.html. Text is [Thai, English].
   src: 'ok' = checked against the cited page on 6 Nov 2026; 'unv' = general knowledge, not yet checked against a source. */
window.CHAIN_HIST = {
eras: ['1920s','1950s','1970s','1990s','2010s','2020s'],
// Problems the site explains elsewhere, with relative weight per era (0 = minor, 3 = dominant). Author's judgement: inferred.
problems: [
  {n:['ผลผลิตต่ำ ขาดพันธุ์และปุ๋ย','Low yields, no improved seed or fertilizer'], w:[3,3,2,1,1,1], why:['ก่อนการปฏิวัติเขียว ปัญหาหลักคือผลผลิตต่อไร่ หลังมีพันธุ์ใหม่และปุ๋ยเคมีจึงลดลง','Before the Green Revolution the main issue was yield per area; it fell after new varieties and synthetic fertilizer']},
  {n:['โรคสะสมจากปลูกซ้ำ (เชิงเดี่ยว)','Disease build-up from monoculture'], w:[1,1,2,3,3,3], why:['ยิ่งปลูกพืชพันธุ์เดียวกันกว้างและถี่ขึ้น เชื้อในดินยิ่งสะสม','The wider and more often one variety is grown, the more soil pathogens build up']},
  {n:['แมลงดื้อยาและระบาดซ้ำ','Pest resistance and resurgence'], w:[0,1,3,3,2,2], why:['ใช้ยาฆ่าแมลงหนักช่วง 1970–1990 เกิดเพลี้ยกระโดดระบาดในเอเชีย ต่อมาใช้ IPM บางส่วน แต่ปริมาณสารเคมีโลกยังเพิ่มเป็นสองเท่าตั้งแต่ 1990','Heavy insecticide use in 1970–1990 drove planthopper outbreaks in Asia; IPM spread partly, but world pesticide use still doubled since 1990']},
  {n:['ธาตุอาหารไม่สมดุล/ปุ๋ยเกิน','Nutrient imbalance / excess fertilizer'], w:[0,1,2,3,3,2], why:['ปุ๋ยไนโตรเจนถูกลงมาก ใช้เกินจนน้ำเสียและดินเป็นกรด ปี 2022 ราคาปุ๋ยพุ่งทำให้เริ่มใช้แม่นยำขึ้น','Cheap nitrogen led to overuse, polluted water and acid soils; the 2022 price spike pushed more precise use']},
  {n:['ดินเสื่อม อินทรียวัตถุต่ำ','Soil degradation, low organic matter'], w:[2,2,2,3,3,3], why:['ไถพรวนและเผาตอซังต่อเนื่องทำให้ดินเสื่อมสะสม','Continuous tillage and stubble burning degrade soil cumulatively']},
  {n:['น้ำท่วม–แล้งรุนแรงขึ้น','Floods and droughts worsening'], w:[1,1,2,2,3,3], why:['ป่าต้นน้ำหายและสภาพอากาศเปลี่ยน','Lost headwater forest and climate change']},
  {n:['หมอกควันจากการเผา','Haze from burning'], w:[0,0,1,2,3,3], why:['ข้าวโพดบนที่สูงและการเผาอ้อยขยายตัว','Upland maize and cane burning expanded']},
  {n:['ราคาผันผวน อำนาจต่อรองต่ำ','Price swings, weak bargaining power'], w:[2,2,2,3,3,3], why:['ผู้ซื้อกลางน้ำและปลายน้ำรวมตัวเป็นรายใหญ่ ส่วนแบ่งของเกษตรกรในเงินอาหารลดลง','Mid- and downstream buyers consolidated; the farmer share of food spending fell']},
  {n:['แรงงานเกษตรสูงวัย','Aging farm workforce'], w:[0,0,1,2,3,3], why:['คนรุ่นใหม่ย้ายเข้าเมือง','Young people moved to cities']},
  {n:['สารตกค้างและมาตรฐานผู้ซื้อ','Residues and buyer standards'], w:[0,0,1,2,3,3], why:['ห้างและผู้นำเข้าเริ่มกำหนด GAP การตรวจย้อนกลับ และกฎป่าไม้','Retailers and importers began requiring GAP, traceability and deforestation rules']}
],
// How the producer-to-consumer chain changed, by region.
regions: [
  {n:['สหรัฐฯ','United States'], t:['จากฟาร์มครอบครัวขายตลาดท้องถิ่น สู่ฟาร์มใหญ่ใช้เครื่องจักร ขายผ่านผู้ค้าเมล็ดพืชและห้างใหญ่ ส่วนแบ่งของฟาร์มในเงินที่ผู้บริโภคจ่ายเหลือ 11.8 เซนต์ต่อดอลลาร์ในปี 2024','From family farms selling locally to large mechanized farms selling through grain traders and big retailers. The farm share of consumer food spending was 11.8 cents per dollar in 2024'], src:'ok'},
  {n:['ยุโรป','Europe'], t:['นโยบายเกษตรร่วม (CAP) อุดหนุนการผลิต แล้วเปลี่ยนเป็นจ่ายตามการดูแลสิ่งแวดล้อม ห้างค้าปลีกตั้งมาตรฐาน EurepGAP ที่ใช้ทั่วโลก','The Common Agricultural Policy subsidized output, then shifted to paying for environmental care. Retailers set the EurepGAP standard used worldwide'], src:'unv'},
  {n:['บราซิล','Brazil'], t:['Embrapa ปรับดินกรดของเซอราโดด้วยปูนและพันธุ์ใหม่ จนบราซิลกลายเป็นผู้ส่งออกถั่วเหลืองรายใหญ่ แต่ตามมาด้วยแรงกดดันเรื่องการบุกรุกป่า','Embrapa made the acid Cerrado soils productive with lime and new varieties, turning Brazil into a leading soybean exporter, followed by deforestation pressure'], src:'unv'},
  {n:['อินเดีย','India'], t:['การปฏิวัติเขียวในปัญจาบเพิ่มข้าวสาลีและข้าว ส่วน Operation Flood สร้างสหกรณ์นมทั่วประเทศ ให้เกษตรกรรายเล็กเป็นเจ้าของห่วงโซ่เอง','The Green Revolution in Punjab raised wheat and rice output; Operation Flood built dairy cooperatives nationwide, so smallholders own their chain'], src:'unv'},
  {n:['จีน','China'], t:['ระบบความรับผิดชอบครัวเรือน (1978) คืนสิทธิ์การผลิตให้ครอบครัว ต่อมาเกิดหมู่บ้านเถาเป่าที่ขายผลผลิตออนไลน์ทั้งหมู่บ้าน','The household responsibility system (1978) returned production decisions to families; later, Taobao villages sold produce online as whole villages'], src:'unv'},
  {n:['ญี่ปุ่น','Japan'], t:['สหกรณ์ JA รวบรวม คัดเกรด และจัดหาปัจจัยการผลิต สถานีริมทาง Michi-no-Eki ให้เกษตรกรขายตรงพร้อมชื่อผู้ปลูก','JA cooperatives collect, grade and supply inputs; Michi-no-Eki roadside stations let farmers sell directly under their own names'], src:'unv'},
  {n:['ไทย','Thailand'], t:['สัดส่วนเกษตรใน GDP ลดจาก 36.4% (1960) เหลือ 8.6% (2020) ห่วงโซ่เปลี่ยนจากพ่อค้าคนกลางและโรงสี สู่เกษตรพันธสัญญา บริษัทอาหารครบวงจร ห้างสมัยใหม่ และการส่งออกผลไม้ทางรางไปจีน','Agriculture fell from 36.4% of GDP (1960) to 8.6% (2020). The chain moved from middlemen and rice mills to contract farming, integrated food companies, modern retail, and fruit exports to China by rail'], src:'ok'},
  {n:['แอฟริกาตะวันออก','East Africa'], t:['M-Pesa ทำให้เกษตรกรรายเล็กรับเงิน กู้ และซื้อปัจจัยผ่านมือถือได้ ลดบทบาทคนกลางในบางสินค้า','M-Pesa let smallholders receive payments, borrow and buy inputs by phone, cutting middlemen out of some chains'], src:'unv'}
],
// Tipping points: who changed research, production or markets.
tips: [
  {y:1913, k:'res', who:['BASF (เยอรมนี)','BASF (Germany)'], what:['โรงงานแรกผลิตแอมโมเนียด้วยกระบวนการฮาเบอร์–บอช ทำให้ปุ๋ยไนโตรเจนสังเคราะห์ราคาถูกลง','First plant making ammonia by the Haber–Bosch process, making synthetic nitrogen fertilizer cheap'], src:'unv'},
  {y:1926, k:'res', who:['Henry A. Wallace / Hi-Bred Corn (Pioneer)','Henry A. Wallace / Hi-Bred Corn (Pioneer)'], what:['บริษัทเมล็ดข้าวโพดลูกผสมเชิงพาณิชย์ เกษตรกรต้องซื้อเมล็ดใหม่ทุกปี จุดเริ่มอุตสาหกรรมเมล็ดพันธุ์','Commercial hybrid corn seed; farmers buy new seed every year, the start of the seed industry'], src:'unv'},
  {y:1943, k:'res', who:['มูลนิธิร็อกกีเฟลเลอร์ + รัฐบาลเม็กซิโก (Norman Borlaug)','Rockefeller Foundation + Mexican government (Norman Borlaug)'], what:['โครงการวิจัยข้าวสาลีที่นำไปสู่พันธุ์เตี้ยให้ผลผลิตสูง และ CIMMYT','Wheat research program that led to high-yield semi-dwarf varieties and CIMMYT'], src:'unv'},
  {y:1947, k:'res', who:['J.I. Rodale (Rodale Institute)','J.I. Rodale (Rodale Institute)'], what:['สถาบันวิจัยเกษตรอินทรีย์ ต่อมาทดลองเทียบอินทรีย์กับเคมีระยะยาวตั้งแต่ 1981','Organic farming research institute; long-term organic vs conventional trial from 1981'], src:'unv'},
  {y:1960, k:'res', who:['มูลนิธิฟอร์ดและร็อกกีเฟลเลอร์ (IRRI)','Ford and Rockefeller Foundations (IRRI)'], what:['ตั้งสถาบันวิจัยข้าวนานาชาติ ปล่อยพันธุ์ IR8 ปี 1966 จุดเริ่มปฏิวัติเขียวในเอเชีย','Founded the International Rice Research Institute; released IR8 in 1966, starting Asia’s Green Revolution'], src:'unv'},
  {y:1969, k:'prod', who:['โครงการหลวง (ไทย)','Royal Project (Thailand)'], what:['เปลี่ยนการปลูกฝิ่นบนดอยเป็นผักผลไม้เมืองหนาว พร้อมระบบรับซื้อและตราสินค้า','Replaced opium on highlands with temperate vegetables and fruit, with buying and a brand'], src:'unv'},
  {y:1970, k:'mkt', who:['Verghese Kurien / NDDB (Operation Flood, อินเดีย)','Verghese Kurien / NDDB (Operation Flood, India)'], what:['ขยายสหกรณ์นมแบบ Amul ทั่วประเทศ เกษตรกรรายเล็กเป็นเจ้าของโรงงานและตราสินค้า','Spread Amul-style dairy cooperatives nationwide; smallholders own the plants and the brand'], src:'unv'},
  {y:1971, k:'res', who:['CGIAR','CGIAR'], what:['เครือข่ายศูนย์วิจัยเกษตรนานาชาติ แบ่งปันพันธุ์และผลวิจัยเป็นสาธารณะ','Network of international agricultural research centers sharing varieties and research publicly'], src:'unv'},
  {y:1972, k:'mkt', who:['IFOAM','IFOAM'], what:['สหพันธ์เกษตรอินทรีย์นานาชาติ วางมาตรฐานที่กลายเป็นตลาดอินทรีย์','International organic federation; set the standards that became the organic market'], src:'unv'},
  {y:1973, k:'res', who:['Embrapa (บราซิล)','Embrapa (Brazil)'], what:['วิจัยปรับดินเซอราโดและพันธุ์ถั่วเหลืองเขตร้อน','Research on Cerrado soils and tropical soybean varieties'], src:'unv'},
  {y:1975, k:'prod', who:['เครือเจริญโภคภัณฑ์ (CP)','Charoen Pokphand (CP) Group'], what:['ทศวรรษ 1970 เริ่มเลี้ยงไก่เนื้อแบบพันธสัญญา บริษัทให้พันธุ์ อาหาร และรับซื้อ เกิดห่วงโซ่ครบวงจร (ปีโดยประมาณ)','In the 1970s began contract broiler farming: the company supplies chicks and feed and buys the birds, an integrated chain (approximate year)'], src:'unv'},
  {y:1978, k:'pol', who:['ชาวบ้านเสี่ยวกัง / รัฐบาลจีน','Xiaogang villagers / Chinese government'], what:['ระบบความรับผิดชอบครัวเรือน ผลผลิตเพิ่มเร็วหลังคืนสิทธิ์ให้ครอบครัว','Household responsibility system; output rose fast once families decided'], src:'unv'},
  {y:1988, k:'mkt', who:['Max Havelaar (เนเธอร์แลนด์)','Max Havelaar (Netherlands)'], what:['ฉลาก Fairtrade แรก (กาแฟเม็กซิโก) จ่ายราคาขั้นต่ำและพรีเมียมให้กลุ่มผู้ปลูก','First Fairtrade label (Mexican coffee), with a minimum price and premium for grower groups'], src:'unv'},
  {y:1994, k:'prod', who:['ในหลวงรัชกาลที่ 9 (ทฤษฎีใหม่)','King Bhumibol (New Theory)'], what:['แบ่งที่ดินเป็นสระ นา พืชผสม และที่อยู่ ลดความเสี่ยงจากพืชเดียว ต่อยอดเป็นโคก หนอง นา','Split land into pond, paddy, mixed crops and home to cut single-crop risk; later Khok Nong Na'], src:'unv'},
  {y:1996, k:'res', who:['Monsanto และบริษัทเมล็ดพันธุ์','Monsanto and seed companies'], what:['พืช GM เชิงพาณิชย์รุ่นแรก (ถั่วเหลืองทนไกลโฟเสต ข้าวโพด Bt) เมล็ดพันธุ์รวมกับสารเคมีเป็นแพ็กเกจ','First commercial GM crops (glyphosate-tolerant soybean, Bt corn); seed and chemicals sold as a package'], src:'unv'},
  {y:1997, k:'mkt', who:['ห้างค้าปลีกยุโรป (EurepGAP → GLOBALG.A.P.)','European retailers (EurepGAP → GLOBALG.A.P.)'], what:['ผู้ซื้อปลายน้ำกำหนดมาตรฐานฟาร์มเอง ผู้ส่งออกทั่วโลกต้องปรับตาม','Downstream buyers set their own farm standard; exporters worldwide had to comply'], src:'unv'},
  {y:2004, k:'mkt', who:['RSPO','RSPO'], what:['มาตรฐานปาล์มน้ำมันยั่งยืนจากผู้ซื้อ ผู้ผลิต และองค์กรสิ่งแวดล้อม','Sustainable palm oil standard set by buyers, producers and NGOs'], src:'unv'},
  {y:2007, k:'mkt', who:['Safaricom / Vodafone (M-Pesa)','Safaricom / Vodafone (M-Pesa)'], what:['เงินผ่านมือถือในเคนยา เปิดทางให้สินเชื่อและประกันพืชผลรายย่อย','Mobile money in Kenya, opening up micro-credit and crop insurance'], src:'unv'},
  {y:2015, k:'prod', who:['DJI และผู้ผลิตโดรนเกษตร','DJI and ag-drone makers'], what:['โดรนพ่นสาร (Agras MG-1) ราคาที่รายเล็กจ้างใช้ได้ เกิดอาชีพรับจ้างพ่นในเอเชีย','Spraying drones (Agras MG-1) affordable as a service, creating spray-for-hire jobs in Asia'], src:'unv'},
  {y:2017, k:'mkt', who:['Dow–DuPont, ChemChina–Syngenta, Bayer–Monsanto','Dow–DuPont, ChemChina–Syngenta, Bayer–Monsanto'], what:['การควบรวม 2017–2018 เหลือสี่บริษัท (Bayer, Corteva, Syngenta Group, BASF) ที่ครองยอดขายเมล็ดพันธุ์และสารเคมีส่วนใหญ่','Mergers in 2017–2018 left four firms (Bayer, Corteva, Syngenta Group, BASF) with most seed and agrochemical sales'], src:'unv'},
  {y:2020, k:'pol', who:['คณะกรรมการวัตถุอันตราย (ไทย)','Hazardous Substances Committee (Thailand)'], what:['ห้ามใช้พาราควอตและคลอร์ไพริฟอส ผลักดันตลาดสารชีวภัณฑ์','Banned paraquat and chlorpyrifos, pushing the market for biologicals'], src:'unv'},
  {y:2021, k:'mkt', who:['รถไฟลาว–จีน','Laos–China Railway'], what:['เส้นทางรางใหม่ส่งผลไม้ไทยไปจีน ทุเรียนกลายเป็นสินค้าส่งออกผลไม้หลัก','A new rail route for Thai fruit to China; durian became the leading fruit export'], src:'unv'},
  {y:2023, k:'pol', who:['สหภาพยุโรป (EUDR)','European Union (EUDR)'], what:['กฎหมายสินค้าปลอดการทำลายป่า ผู้ส่งออกยาง ปาล์ม กาแฟ โกโก้ ต้องพิสูจน์พิกัดแปลง','Deforestation-free products law: rubber, palm, coffee and cocoa exporters must prove plot coordinates'], src:'unv'}
],
kinds: {res:['วิจัย','Research'], prod:['การผลิต','Production'], mkt:['ตลาด','Market'], pol:['นโยบาย','Policy']},
// Verified figures (checked 6 Nov 2026)
facts: [
  {n:['ส่วนแบ่งของฟาร์มในเงินอาหาร 1 ดอลลาร์ (สหรัฐฯ)','Farm share of each US food dollar'], v:[['2022','14.9¢'],['2023','12.1¢'],['2024','11.8¢']], note:['การตลาด แปรรูป ขนส่ง ค้าปลีก และร้านอาหาร ได้ส่วนที่เหลือ (ราว 88¢ ในปี 2024)','Marketing, processing, transport, retail and food service take the rest (about 88¢ in 2024)'], ref:1},
  {n:['สัดส่วนเกษตรใน GDP ไทย','Agriculture share of Thailand’s GDP'], v:[['1960','36.4%'],['1993','8.0%'],['2020','8.6%']], note:['เศรษฐกิจโตเร็วกว่าภาคเกษตร แม้ผลผลิตเกษตรจะเพิ่ม','The economy grew faster than farming, even as farm output rose'], ref:4},
  {n:['การใช้สารกำจัดศัตรูพืชทั่วโลก','World pesticide use'], v:[['2022','3.70 Mt'],['1990→2022','×2']], note:['ต่อพื้นที่เพาะปลูกเพิ่ม 94%','Up 94% per area of cropland'], ref:3},
  {n:['ความเข้มข้นตลาดเมล็ดพันธุ์','Seed market concentration'], v:[['2018–20','Corteva + Bayer > 50%']], note:['ของยอดขายเมล็ดข้าวโพด ถั่วเหลือง ฝ้ายในสหรัฐฯ','of US corn, soybean and cotton seed sales'], ref:2}
],
// Market capitalisation read on 6 Nov 2026 (companiesmarketcap.com, delayed prices)
caps: [
  {n:'Walmart', seg:['ค้าปลีก','Retail'], v:1013},
  {n:'Nestlé', seg:['แปรรูปอาหาร','Food processing'], v:272},
  {n:'Deere & Company', seg:['เครื่องจักรเกษตร','Farm machinery'], v:179}
]
};
