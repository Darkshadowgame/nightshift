/* eslint-disable */
/**
 * UK motorbikes: stock specs for the vehicle picker. Dataset 2026-11-17.2 (batch 2: 125/A2 bikes, more nakeds, sports and tourers, bike donor engines).
 *
 * Format (parsed by src/lib/vehicles.ts): "@Make", "=Model", then
 * "gen|engine|years|power|weight|torque|asp[|stages]". Power is as the maker quotes it:
 * p = PS (converted to bhp x0.986), b = bhp, k = kW (x1.341). Torque n = Nm, l = lb-ft.
 * Weight kg: kerb for cars, wet for bikes; "d" = only a dry weight was published (+20 kg added).
 * asp: t turbo petrol, d diesel, n non-turbo, s supercharged, h hybrid or electric. Stages: total power after
 * a tuner's stage for that exact variant. "@@ENGINES": make|code|label|power|torque|asp swap donors.
 *
 * Notes:
 *  - Power as quoted by maker/UK press (p=PS, b=bhp, k=kW). Weight = wet/kerb unless "d" (dry only).
 *  - Kawasaki power figures are without ram air. KTM "d" weights are KTM's "without fuel" figures.
 *  - Units and figures are claimed crank figures, not dyno.
 *  - Yamaha MT-07: Stage 2 (full system) = Akrapovic Racing Line titanium full system (+1.1 kW claimed)
 *  - Yamaha MT-09: Stage 2 (full system) = Akrapovic Racing Line titanium full system (+1.5 kW claimed)
 *  - Kawasaki Z900: Stage 2 (full system) = Akrapovic full system (headers + silencer), +9 hp claimed
 *  - BMW S1000RR: Bennetts dyno: Akrapovic full system gave +11bhp midrange but no peak gain, so no stage listed
 *  - Yamaha YZF-R125 2008-2013: 11 kW / 12.2 Nm / 138 kg Leergewicht from de.wikipedia (RE06); moto-data.net lists 12.6 kW / 15 Nm / 136 kg wet for the same bike, which is above the 11 kW learner limit, so the 11 kW figure was used.
 *  - Yamaha MT-03 (321cc): moto-data gives identical 30.9 kW / 167 kg wet for 2016-17 and 2020-, so one line. Not the 2006-2014 660cc MT-03.
 *  - Honda CBR125R: torque 10.6 Nm per moto-data; Wikipedia gives 10.4 Nm claimed. Carb (2004-06) and FI (2007-10) bikes share the same quoted figures. 2011-2016 years per Wikipedia generations.
 *  - Honda MSX125 (Grom) first gens: years follow moto-data page splits (2013-14 + 2015-16 = 101.7 kg; 2017-18 + 2019-20 "Grom" = 103.8 kg). Honda UK confirms "since 2013".
 *  - Honda CBR250R: EU claim 19.4 kW / 23.8 Nm from de.wikipedia; moto-data's 17.7 kW is the rear-wheel figure (per en.wikipedia), so not used. Years 2011-2013 per en.wikipedia (EU/US production).
 *  - Honda CB300R: moto-data 2018-19 figures (22.7 kW, 143 kg wet); en.wikipedia quotes 23.1 kW claimed. End year 2020 = last moto-data page with these figures (a 2022 page shows 22.9 kW / 144 kg, likely non-UK spec).
 *  - Honda Rebel 500 / CL500 / NX500: current Honda UK kerb weights and kW. Early (2017-18) Rebel 500 is listed at 185 kg wet by moto-data; the current 191 kg figure is used for the whole run.
 *  - Honda CB500X: power/torque/wet weights per Wikipedia (CB500 series article "Honda CB500X"); replaced by the NX500 for 2024.
 *  - Kawasaki Ninja 500 / Z500 / Eliminator 500: Kawasaki UK "curb mass" and EU 33.4 kW (A2) figures. moto-data's 38 kW is the US spec and was not used.
 *  - Kawasaki Z300: moto-data quotes 28.3 kW (38 hp); Ninja 300 29 kW. Both as quoted.
 *  - Suzuki GSX-S125: 133 kg wet per Suzuki's own digital archive (2017); moto-data's 2024 page says 135 kg.
 *  - KTM 125 Duke 2012-2016 and RC 125 2014-2021: moto-data dry weights (d). 125 Duke 2017-2023: power from moto-data, weight/torque from KTM UK 2023 spec page ("without fuel" 143 kg, so d).
 *  - KTM 125 Duke 2024- and 390 Duke 2024-: KTM UK 2025/2026 spec pages label 154 kg / 165 kg "weight fully fueled", but the 2024 pages labelled the same numbers "without fuel". Written as wet (current label).
 *  - KTM 390 Adventure 2020-2024: power from moto-data 2020 page, 37 Nm and 161 kg "without fuel" from KTM UK 2024 page (moto-data says 35.3 Nm, 158 kg dry). 390 Adventure X 2025-: KTM UK 176 kg fully fuelled.
 *  - KTM RC 390 2022-2024: 32 kW from moto-data, 158 kg without fuel / 37 Nm from KTM UK 2023 page. End year 2024 = last KTM UK spec page found (RC 390 no longer in KTM UK range).
 *  - KTM 125 Duke start year: earliest moto-data listing is MY2012; KTM launched the bike in 2011 (not verified in this session, so 2012 used).
 *  - Aprilia RS 125 2-stroke 2006-2010: 21 kW / 19 Nm is the full-power claim (moto-data 2008 page; Wikipedia agrees on 21 kW). UK learner bikes were sold/registered restricted to 11 kW. Weight: moto-data 142 kg wet; Wikipedia gives 137 kg wet / 127 kg dry.
 *  - Aprilia RS4 125 / RS 125 4-stroke 2011-2020 and Tuono 125 2017-2020: moto-data 11.7 kW and 122 kg dry (the RS4 was renamed RS 125 in 2019 per Wikipedia). 2021- Euro 5 bikes: 11 kW, 144 kg wet.
 *  - Royal Enfield: power, torque and kerb weight from Royal Enfield UK tech-spec PDFs (Interceptor 217 kg, Continental GT 212 kg, Super Meteor 241 kg, Hunter 181 kg, Meteor 191 kg, Himalayan 411 199 kg "weight in running order") and Himalayan 450 PDF (196 kg kerb with 90% fuel). Indian site lists Interceptor 218 kg / CGT 214 kg.
 *  - Royal Enfield years per Wikipedia (Interceptor 2018-; CGT 650 introduced Nov 2017, on sale 2018; Himalayan 411 2016-2023, 452cc 2023-; Hunter 2022-; Meteor 2020-; Super Meteor "released in 2022"). UK sales of the Himalayan 411 began later than 2016.
 *  - Harley-Davidson: EU/UK figures (kW, Nm, "weight in running order") from harley-davidson.com/gb 2026 pages. Sportster S torque originally 127 Nm (moto-data 2021); Nightster 2022 launch spec was 67 kW / 218 kg (moto-data). Street Bob 117 years start 2025 (earliest verified listing; it may have arrived for MY2024).
 *  - Many older-bike figures are from motorcyclespecs.co.za model pages; where that site repeats an earlier year's spec block on a later page (stale copy), the later page was not used (see OMITTED / per-line notes below).
 *  - Kawasaki ZX-6R: power is without ram air. 636 C (2005-06) wet 185 kg per motorcyclespecs (dry 164 kg); Wikipedia text quotes 98 kW, table 100 kW with ram air.
 *  - Kawasaki ZX-6R J: years 2000-2002 from Wikipedia spec heading; figures from motorcyclespecs 2001 page (its "2000" page repeats the 1998-99 G spec).
 *  - Kawasaki Z1000 2003-2009: Wikipedia per-generation figures (kW and curb weight); motorcyclespecs repeats the 2003 block for 2007-09 so it was not used for that generation.
 *  - Kawasaki Z750 2007-2012: only dry weight (207 kg) found; Wikipedia infobox agrees on 77.7 kW / 78 Nm.
 *  - Kawasaki ZX-9R / ZX-12R: dry weights used to match the existing C and A lines; motorcyclespecs also lists wet 242 kg (B), 202 kg (E) and 245 kg (ZX-12R).
 *  - Kawasaki Z900RS: motorcyclespecs lists 210 kg wet for 2018-19 and 215 kg for 2020-22; 2025 assumed last year before the 2026 update (85 kW page).
 *  - Suzuki GSX-R600 SRAD/K1 and GSX-R750 2000-2005: maker figures from the Suzuki global digital archive. Its SRAD GSX-R750 entries are the 77 PS Japanese-market spec, so SRAD 750 uses motorcyclespecs (UK/EU 93.3/95.4 kW).
 *  - Suzuki GSX-R600 K4-K5: 92.5 kW is quoted "with maximum RAM air" (motorcyclespecs).
 *  - Suzuki SV1000/TL1000R/GSX1400: Suzuki global archive only has 93-100 PS Japanese-market figures; UK/EU figures used (SV1000 89 kW = maker claim per Wikipedia; motorcyclespecs says 90.9 kW).
 *  - Suzuki TL1000S: motorcyclespecs 91.1 kW; Wikipedia 93 kW (citation needed). Years 1997-2001 from Wikipedia.
 *  - Suzuki Bandit 650 (2007-2016, liquid-cooled): Wikipedia says 63 kW and 14 kg heavier than the air-cooled bike; motorcyclespecs 2009-10 page 62.5 kW / 215 kg dry (its 2007-08 page repeats the air-cooled 201 kg dry).
 *  - Suzuki Bandit 600: existing GSF600 1995-2004 line already covers the 2000 restyle (no separate figures found), so nothing added.
 *  - Honda CBR900RR 1998-99: motorcyclespecs 1998 page 94.1 kW (1999 page says 95.6 kW); engine label kept as 918cc to match existing 919 line.
 *  - Honda CBR1100XX: Wikipedia 1997 223 kg / 1999 225 kg dry; power 112 kW and torque from motorcyclespecs (its 2007 page lists 152 hp / 119 Nm, not used).
 *  - Honda Hornet 600 1998-2006: same claimed figures on all motorcyclespecs pages for 1998-2006 (incl. 2003 facelift), so one line.
 *  - Honda VFR800: Wikipedia wet weights and power; torque left empty for 1998-2013 (Wikipedia 75.1 Nm vs motorcyclespecs 82 Nm, column unclear).
 *  - Honda CB1300 SC54: 2005-2017 years are motorcyclespecs model pages (largely Japanese-market years); UK sales ended earlier.
 *  - Honda CBR600F F4i: 2001 motorcyclespecs page gives 198 kg wet, 2002-2006 pages 193 kg.
 *  - Honda CB1000 Hornet: Honda UK spec page (111.6 kW / 211 kg; SP 115.6 kW / 212 kg); 2025 launch year from motorcyclespecs SP page.
 *  - Yamaha FZ1 2006-2015: Wikipedia text gives "150 bhp" and wet 220/221 kg; motorcyclespecs gives 108 kW. Same figures cover FZ1 (naked) and FZ1 Fazer.
 *  - Yamaha FZ6: Wikipedia says the S2 models were still sold in Europe in 2010.
 *  - Yamaha YZF600R: motorcyclespecs 72.9 kW; Wikipedia 75.0 kW. Europe 1996-2003 per Wikipedia.
 *  - Yamaha Tracer 900: Yamaha EU factsheets 2017/2018/2020 (2017 = MT-09 Tracer 210 kg; 2018 redesign 214 kg; GT 215 kg); 2015 launch per Wikipedia.
 *  - Already present and left alone: Speed Triple 1050/1200 RS, Street Triple 675 (2007-2012), 675 R (2013-2016) and 765, Trident 660, 1199/1299 Panigale, Panigale V2, Monster 821/937/1200, S1000R, F900R, 790/890 Duke, 1290/1390 Super Duke R, RSV4/Tuono V4.
 *  - Most figures come from moto-data.net, which copies maker claims. Its "hp" is ambiguous, so its kW figure is used (k). Weights are wet where it gives one, otherwise dry (d).
 *  - moto-data.net labels some BMW road-ready weights as "dry" (K1200R 237 kg, R nineT 2017 220 kg). Those lines were left out instead of being flagged dry.
 *  - Ducati 1098/1098 S: Wikipedia's infobox gives the family as 2007-2009. The 1098 R ran into 2009 and the 1198 replaced the base and S models for 2009.
 *  - Ducati 916: Wikipedia gives 85 kW, 91 Nm and 194.5 kg dry. moto-data gives 83.8 kW, 90 Nm and 198 kg dry. The moto-data figures are used.
 *  - Ducati 748 Biposto: years and 73 kW are from Wikipedia ("Strada, Biposto 1995-1999"), with 202 kg dry. Torque 75 Nm is from moto-data's 1999-2000 page, which gives 72.1 kW.
 *  - Ducati 848 (2008-2010): Wikipedia says 92 kW (125 PS). Ducati and moto-data say 134 hp (98.5 kW); 98.5k is used.
 *  - Ducati 1198: Wikipedia's table says 126.8 kW and 123 Nm. moto-data says 125 kW and 131.4 Nm (Ducati's 170 hp, 97 lb-ft); moto-data is used.
 *  - Ducati Monster S4R: German Wikipedia gives 2004-2006, but moto-data lists a 2003 S4R, so 2003-2006 is used. The 1100 Evo is 73.5 kW (100 hp) as claimed; its EC certificate says 69.9 kW.
 *  - Ducati Streetfighter 1098: kerb weights (199 base, 197 S) are from Wikipedia's dry/kerb table. Wikipedia's text says the base model was dropped after 2011.
 *  - Ducati Diavel: the first-gen figures are for 2011-2014. Wikipedia says the "Gen 1.5" arrived in 2015 with 162 hp and 130.5 Nm.
 *  - Triumph Speed Triple T509: moto-data says wet 206 kg and dry 196 kg. The wet figure is used as published.
 *  - Triumph Daytona 955i: Wikipedia says the 2002 engine raised power to 149 hp. moto-data's 2001 and 2004 pages both show 110 kW/147 hp, so the 147 hp engine is dated from 2001.
 *  - Triumph Daytona 600: years are from the Wikipedia infobox (2002-2004). Sales began for the 2003 model year.
 *  - Triumph Street Triple 675 (2013-2016): the 2014 moto-data page gives 182 kg wet. The 2016 page gives 188 kg wet and 168 kg dry.
 *  - Triumph Tiger 1050: the Wikipedia figures (113 bhp, 100 Nm, 198 kg dry) are used. moto-data gives 85 kW and 98 Nm.
 *  - BMW K1300S: Wikipedia gives 175 hp (130 kW) and 258 kg wet. moto-data gives 127 kW and 254 kg wet; moto-data is used.
 *  - BMW S1000XR: Wikipedia says 160 hp for the first generation. moto-data's 2016 and 2017 pages both give 121 kW/165 hp, which is used.
 *  - KTM 990 Super Duke R (2007-2011): Wikipedia says 132 hp, moto-data says 88 kW. It was left out. The 2012-2013 R (125 hp, 92 kW) is the combined model.
 *  - KTM 690 Duke (2016-2018): the years are from Wikipedia's table column, and the model may have run into 2019.
 *  - KTM 1290 Super Duke GT: 2016-2023 is the range of years moto-data lists it for.
 *  - MV Agusta: years are the model years that moto-data.net lists (F3 675 2012-2018, F3 800 2013-2017, Brutale 675/800/1090 to 2016). The 800s changed for 2017-2018.
 *  - Aprilia RSV1000R (2006-2010): moto-data's 2006 page says 107 kW/143 hp. Its 2008 and 2010 pages say 105.2 kW/143 hp, which is used.
 *  - Aprilia Tuono 1000 R: moto-data's 2006 page gives 185 kg dry and its 2010 page 181 kg. Wikipedia agrees with 185 kg.
 *  - Bikes: claimed figures from moto-data.net / Yamaha press release / Wikipedia (Hayabusa Gen3 from Suzuki 2021 press release via Wikipedia). ZZR1400 2006 torque omitted because moto-data's Nm and lb-ft figures disagree (136 Nm vs 113.5 lb-ft); ram-air power is 197 hp.
 *  - GSX-R1000 K9: moto-data 136.1 kW / 117 Nm; Wikipedia table 137 kW / 103.7 Nm (likely measured). moto-data used.
 *
 * Sources checked (a sample; other figures are manufacturer figures as commonly quoted):
 *  https://en.wikipedia.org/wiki/Yamaha_YZF-R1
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_r1%2002.htm
 *  https://global.yamaha-motor.com/news/2014/1104/yzf-r1.html
 *  https://en.wikipedia.org/wiki/Yamaha_YZF-R6
 *  https://motorcyclespecs.co.za/model/yamaha/yamaha_r6
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2018/YZF600R6/Factsheets/2018-YZF600R6_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2019/YZF600R6/Factsheets/2019-YZF600R6_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2019/YZF/Factsheets/2019-YZF-R125_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2021/YZF-R125/Factsheets/2021-YZF-R125_en.pdf
 *  https://2wheelshero.com/products/akrapovic-s-y7r8-hegeht-1-yamaha-mt-07-fz-07-2021-exhaust-system-racing-line-titanium
 *  https://www.moto-data.net/yamaha/mt-07-2025
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2022/MT09/Factsheets/2022-MT09_en-GB.pdf
 *  https://www.silverstonemotor.com/en/pot-d-echappement-moto/12239-akrapovic-yamaha-mt-09-2021-racing-full-system-titanium-silencer-ce-approved-1810-2863.html
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2025/MT09A/Factsheets/2025-MT09A_en.pdf
 *  https://global.honda/en/CBR/history/stories/1992/
 *  https://www.moto-data.net/honda/cbr-900rr-fireblade-cbr929rr-2001/m:amp
 *  https://www.motorcyclenews.com:443/bike-reviews/honda/cbr1000rr-fireblade/2004
 *  https://www.torquepedia.com/honda/cbr1000rr/2004
 *  https://www.autocar.co.uk/1000-super-sports-petrol-manual-178-ps
 *  https://www.1000ps.com/en-gb/comparison/50223/honda-cbr1000rr-fireblade-sp-2017-vs-honda-cbr1000rr-fireblade-2017
 *  https://www.honda.co.uk/motorcycles/range/super-sport/cbr1000rr-r-fireblade/specifications-and-price.html
 *  https://moto-data.net/honda/cbr1000rr-r-fireblade-sp-2024
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/honda/cbr600rr-2007-review-used
 *  https://www.torquepedia.com/honda/cb1000r/2016
 *  https://www.moto-data.net/honda/cb-1000r-2018
 *  https://en.wikipedia.org/wiki/Kawasaki_Ninja_ZX-10R
 *  https://motorcyclenews.com/bike-reviews/kawasaki/zx-10r/2008
 *  https://motorcyclespecs.co.za/model/kawasaki/kawasaki_zx10R
 *  https://rideapart.com/articles/north-american-2011-kawasaki-zx-10r-loses-20-hp-slower-than-s1000rr
 *  https://www.motorcyclenews.com:443/bike-reviews/kawasaki/zx-10r/2021
 *  https://mcnews.com.au/?p=431964
 *  https://www.revzilla.com/motorcycle/akrapovic-exhaust-headers-kawasaki-z900-2017-2019
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/sports_080.php
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/sports_081.php
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/sports_082.php
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/sports_078.php
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/ss4_045.php
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsx750f_97.htm
 *  https://moto-data.net/suzuki/gsx-750f-katana-2004-2005/m:amp
 *  https://suzukicycles.org/GSX-series/GSX750F-numbers.shtml
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/suzuki/suzuki-gsf600ns-1995-2004-buying-guide
 *  https://en.enduro.team/Suzuki_GSF650_Bandit
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/ss4_029.php
 *  https://www.suzukicycles.org/Bandit-series/GSF1200-Bandit.shtml
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/suzuki/suzuki-gsf1200-bandit
 *  https://www.bikesales.com.au/editorial/details/suzuki-bandit-14285/
 *  https://ridermagazine.com/?p=51768
 *  https://www.motorcycle.com/product/compare/24715
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/triumph/street-triple-765-2023-review
 *  https://triumph-mediakits.com/en/news-articles/the-new-2023-street-triple-765-range-race-powered-naked-sports-perfection.html
 *  https://www.bikesales.com.au/editorial/details/launch-2011-triumph-speed-triple-23539/
 *  https://moto-data.net/triumph/speed-triple-2011/m:amp
 *  https://www.bikesales.com.au/editorial/details/launch-2016-triumph-speed-triple-56445/
 *  https://www.moto-data.net/triumph/speed-triple-2016
 *  https://www.motorcycledb.com/Triumph_Bonneville_T100_2017/46632
 *  https://www.motorcycle.com/specs/triumph/standard/2016/bonneville-t120/base/detail.html
 *  https://bennetts.co.uk/bikesocial/reviews/bikes/bmw/bmw-s1000rr-2015-uk-first-test
 *  https://www.moto-data.net/bmw/s-1000rr-2015
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/long-term-test-bikes/bmw-long-term-test-bikes/2019-bmw-s1000rr-performance-testing
 *  https://1000ps.com/en-gb/model/7347/ktm-1290-super-duke-r/2015
 *  https://www.moto-data.net/ktm/1290-super-duke-r-2017
 *  https://www.ktm.com/en-dk/models/naked-bike/2023-ktm-1290-superduker/technical-specifications.html
 *  https://motorcyclespecs.co.za/model/aprilia/Aprilia-tuono-v4-1100-factory-2019.html
 *  https://de.wikipedia.org/wiki/Yamaha_YZF-R125
 *  https://en.wikipedia.org/wiki/Yamaha_YZF-R125
 *  https://www.moto-data.net/yamaha/yzf-r-125-2008
 *  https://www.moto-data.net/yamaha/mt-03-fz-03-2016-2017
 *  https://www.moto-data.net/yamaha/mt-03-2020
 *  https://www.moto-data.net/honda/cbr-125r-2004
 *  https://www.moto-data.net/honda/cbr-125r-2008
 *  https://www.moto-data.net/honda/cbr-125r-2011
 *  https://en.wikipedia.org/wiki/Honda_CBR125R
 *  https://www.moto-data.net/honda/msx-125-2013-2014
 *  https://www.moto-data.net/honda/msx-125-2015-2016
 *  https://www.moto-data.net/honda/msx-125-grom-2017-2018
 *  https://www.honda.co.uk/motorcycles/range/125cc/msx125/overview.html
 *  https://en.wikipedia.org/wiki/Honda_CBR250R_(2011)
 *  https://de.wikipedia.org/wiki/Honda_CBR_250_R
 *  https://www.moto-data.net/honda/cbr-250r-2011-2012
 *  https://www.moto-data.net/honda/cb-300r-2018-2019
 *  https://www.moto-data.net/honda/cb-300r-2022
 *  https://en.wikipedia.org/wiki/Honda_CB300R
 *  https://en.wikipedia.org/wiki/Honda_CB500X
 *  https://www.honda.co.uk/motorcycles/range/adventure/nx500/specifications-and-price.html
 *  https://www.moto-data.net/honda/nx-500-2024
 *  https://www.honda.co.uk/motorcycles/range/street/cmx500-rebel/specifications-and-price.html
 *  https://www.moto-data.net/honda/rebel-500-abs-2017-2018
 *  https://www.honda.co.uk/motorcycles/range/street/cl500/specifications-and-price.html
 *  https://www.moto-data.net/honda/cl-500-2023
 *  https://www.moto-data.net/kawasaki/ninja-300-2013
 *  https://en.wikipedia.org/wiki/Kawasaki_Ninja_300
 *  https://www.moto-data.net/kawasaki/z-300-2015-2016
 *  https://www.moto-data.net/kawasaki/z-300-2017-2018
 *  https://www.moto-data.net/kawasaki/z-400-2019
 *  https://www.moto-data.net/kawasaki/ninja-500-se-krt-2024
 *  https://www.moto-data.net/kawasaki/eliminator-450-2024
 *  https://www.kawasaki.co.uk/en/Motorcycles/Supersport_Sport/Ninja_500_2025.html
 *  https://www.kawasaki.co.uk/en/Motorcycles/Supernaked/Z500_2025.html
 *  https://www.kawasaki.co.uk/en/Motorcycles/Urban_Cruiser/eliminator_500_2025.html
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/ss4_075.php
 *  https://www.moto-data.net/suzuki/gsx-s-125-2024
 *  https://www.moto-data.net/ktm/125-duke-2013
 *  https://www.moto-data.net/ktm/125-duke-2014-2016
 *  https://www.moto-data.net/ktm/125-duke-2017
 *  https://www.moto-data.net/ktm/125-duke-2021
 *  https://www.ktm.com/en-gb/models/naked-bike/2023-ktm-125-duke/technical-specifications.html
 *  https://www.ktm.com/en-gb/models/naked-bike/2026-ktm-125-duke/technical-specifications.html
 *  https://www.ktm.com/en-gb/models/naked-bike/2024-ktm-125-duke/technical-specifications.html
 *  https://www.moto-data.net/ktm/rc-125-2014-2015
 *  https://www.moto-data.net/ktm/rc-125-2020-2021
 *  https://www.ktm.com/en-gb/models/naked-bike/2025-ktm-390-duke/technical-specifications.html
 *  https://www.ktm.com/en-gb/models/naked-bike/2026-ktm-390-duke/technical-specifications.html
 *  https://www.ktm.com/en-gb/models/naked-bike/2024-ktm-390-duke/technical-specifications.html
 *  https://www.moto-data.net/ktm/rc-390-2022
 *  https://www.ktm.com/en-gb/models/supersport/2023-ktm-rc-390/technical-specifications.html
 *  https://www.moto-data.net/ktm/390-adventure-2020
 *  https://www.ktm.com/en-gb/models/travel/2024-ktm-390-adventure/technical-specifications.html
 *  https://www.ktm.com/en-gb/models/adventure/2027-ktm-390-adventurex/technical-specifications.html
 *  https://en.wikipedia.org/wiki/KTM_390_series
 *  https://www.moto-data.net/aprilia/rs-125-r-2008
 *  https://en.wikipedia.org/wiki/Aprilia_RS125
 *  https://www.moto-data.net/aprilia/rs4-125-2011
 *  https://www.moto-data.net/aprilia/rs4-125-2017-2018
 *  https://www.moto-data.net/aprilia/rs-125-2021
 *  https://www.moto-data.net/aprilia/touno-125-2017-2018
 *  https://www.moto-data.net/aprilia/tuono-125-2021
 *  https://www.royalenfield.com/uk/en/motorcycles/interceptor/
 *  https://www.royalenfield.com/content/dam/royal-enfield/united-kingdom/motorcycles/technical-specifications/royal-enfield-interceptor-650-tech-specs-uk-english.pdf
 *  https://www.royalenfield.com/content/dam/royal-enfield/united-kingdom/motorcycles/technical-specifications/royal-enfield-continental-gt-tech-specs-uk-english.pdf
 *  https://www.royalenfield.com/content/dam/royal-enfield/united-kingdom/motorcycles/technical-specifications/royal-enfield-super-meteor-650-tech-specs-uk-english.pdf
 *  https://www.royalenfield.com/content/dam/royal-enfield/united-kingdom/motorcycles/technical-specifications/royal-enfield-hntr-350-tech-specs-uk-english.pdf
 *  https://www.royalenfield.com/content/dam/royal-enfield/united-kingdom/motorcycles/technical-specifications/royal-enfield-meteor-350-tech-specs-uk-english.pdf
 *  https://www.royalenfield.com/content/dam/royal-enfield/united-kingdom/motorcycles/technical-specifications/royal-enfield-himalayan-technical-specifications-english.pdf
 *  https://www.royalenfield.com/content/dam/open-pdf/royal-enfield-himalayan-450-technical-specifications-english-2026.pdf
 *  https://www.royalenfield.com/in/en/motorcycles/interceptor/
 *  https://www.royalenfield.com/in/en/motorcycles/continental-gt/
 *  https://www.royalenfield.com/in/en/motorcycles/new-himalayan/
 *  https://www.royalenfield.com/in/en/motorcycles/hunter-350/
 *  https://www.royalenfield.com/in/en/motorcycles/meteor/
 *  https://en.wikipedia.org/wiki/Royal_Enfield_Interceptor_650
 *  https://en.wikipedia.org/wiki/Royal_Enfield_Continental_GT
 *  https://en.wikipedia.org/wiki/Royal_Enfield_Himalayan
 *  https://en.wikipedia.org/wiki/Royal_Enfield_Hunter_350
 *  https://en.wikipedia.org/wiki/Royal_Enfield_Meteor
 *  https://www.harley-davidson.com/gb/en/motorcycles/sportster-s.html
 *  https://www.harley-davidson.com/gb/en/motorcycles/nightster.html
 *  https://www.harley-davidson.com/gb/en/motorcycles/street-bob.html
 *  https://www.moto-data.net/harley-davidson/harley-davidson-sportster-s-2021
 *  https://www.moto-data.net/harley-davidson/harley-davidson-sportster-975-nightster-2022
 *  https://www.moto-data.net/harley-davidson/harley-davidson-softail-street-bob-117-2025
 *  https://en.wikipedia.org/wiki/Harley-Davidson_Sportster
 *  https://en.wikipedia.org/wiki/Kawasaki_Ninja_ZX-6R
 *  https://en.wikipedia.org/wiki/Kawasaki_Z1000
 *  https://en.wikipedia.org/wiki/Kawasaki_Z750
 *  https://en.wikipedia.org/wiki/Suzuki_GSX-R600
 *  https://en.wikipedia.org/wiki/Suzuki_GSX-R750
 *  https://en.wikipedia.org/wiki/Suzuki_Bandit_series
 *  https://en.wikipedia.org/wiki/Suzuki_GSX1400
 *  https://en.wikipedia.org/wiki/Suzuki_SV1000
 *  https://en.wikipedia.org/wiki/Suzuki_TL1000S
 *  https://en.wikipedia.org/wiki/Honda_CBR1100XX
 *  https://en.wikipedia.org/wiki/Honda_VFR800
 *  https://en.wikipedia.org/wiki/Honda_VTR1000F
 *  https://en.wikipedia.org/wiki/Yamaha_FZ1
 *  https://en.wikipedia.org/wiki/Yamaha_FZ6
 *  https://en.wikipedia.org/wiki/Yamaha_XJ6
 *  https://en.wikipedia.org/wiki/Yamaha_YZF600R
 *  https://en.wikipedia.org/wiki/Yamaha_MT-09
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/ss4_032.php
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/ss4_028.php
 *  https://www.globalsuzuki.com/motorcycle/smgs/digital-archive/2_bike/sports_079.php
 *  https://www.honda.co.uk/motorcycles/range/street/cb1000-hornet/specifications-and-price.html
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2017/MT09TR/Factsheets/2017-MT09TR_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2018/MT09TR/Factsheets/2018-MT09TR_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2018/MT09TRGT/Factsheets/2018-MT09TRGT_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2020/MT09TR/Factsheets/2020-MT09TR_en.pdf
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2095.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2098.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2001.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx636%2002.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2005.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2007.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2008.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2009.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx6r%2012.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_z750%2004.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_z750%2006.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_z750%2007.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_z750%2011.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r%2094.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r%2095.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r_96.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r_97.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r%2000.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r%2001.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r%2002.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx9r%2003.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx12r%2002.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_zx12r%2005.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_er-6%2006.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_er-6%2011.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_er-6%2012.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_er-6_16.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_versys.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_versys%2014.htm
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_versys_650_15.html
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_versys_650_17.html
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_versys%20650_lt_21.html
 *  https://www.motorcyclespecs.co.za/model/kawasaki/Kawasaki_Z900RS_18.html
 *  https://www.motorcyclespecs.co.za/model/kawasaki/Kawasaki_Z900RS_19.html
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_z900rs_20.html
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki_z900rs_22.html
 *  https://www.motorcyclespecs.co.za/model/kawasaki/kawasaki-z900rs-2026.html
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxR600%2097.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxr600%2099.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxR600%2003.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxR600%2004.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxR600%2005.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxr750%2096.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxr750%2097.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxr750%2098.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsxr750%2099.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_sv1000n%2003.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_sv1000s%2007.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_tl1000s%2097.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_tl1000r%2098.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_tl1000r%2002.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_gsx1400.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_bandit_650%2007.htm
 *  https://www.motorcyclespecs.co.za/model/suzu/suzuki_bandit_650%2009.htm
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr900rr_98.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr900rr_99.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr1100xx_96.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr1100xx_99.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr1100xx_07.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb600f_hornet_98.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb600f_06.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb600_hornet_07.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb600_hornet_13.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb900_hornet_02.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb900_hornet_07.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda-cb1000sp-2025.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_vfr800f_98.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_vfr800_14.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb1300_03.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb1300_05.htm
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb1300_14.htm
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_vtr1000f_98.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_vtr1000f_%2005.htm
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_rc51_sp1.htm
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_rc51_sp1_01.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_rc51_sp2.htm
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_rc51_sp2_06.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f3_95.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f3_96.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f3_97.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f3_98.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f4_99.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f4_00.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f4_01.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f4_02.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cbr600f4i_06.html
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fz1%20fazer%2006.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fz1%20fazer%2015.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fzs1000%2001.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fzs1000%2005.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fz6_fazer%2004.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fz6_naked%2004.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fz6s2%20fazer%2007.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fz6%2009.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xj6_naked%2009.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xj6_15.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xj6_diversion.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xj6_diversion%2013.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xj600_diver%20f%2010.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xj600_diver_f_15.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_yzf600r%2096.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_yzf600r%2002.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fzs600_fazer%2098.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_fzs600_fazer%2003.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xjr1300%2099.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xjr1300%2006.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xjr1300_07.htm
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_xjr1300_15.htm
 *  https://en.wikipedia.org/wiki/Ducati_916
 *  https://en.wikipedia.org/wiki/Ducati_999
 *  https://en.wikipedia.org/wiki/Ducati_1098
 *  https://en.wikipedia.org/wiki/Ducati_Monster
 *  https://de.wikipedia.org/wiki/Ducati_Monster
 *  https://en.wikipedia.org/wiki/Ducati_748
 *  https://en.wikipedia.org/wiki/Ducati_749
 *  https://en.wikipedia.org/wiki/Ducati_996
 *  https://en.wikipedia.org/wiki/Ducati_998
 *  https://en.wikipedia.org/wiki/Ducati_848
 *  https://en.wikipedia.org/wiki/Ducati_1198
 *  https://en.wikipedia.org/wiki/Ducati_Streetfighter
 *  https://en.wikipedia.org/wiki/Ducati_Multistrada
 *  https://en.wikipedia.org/wiki/Ducati_Diavel
 *  https://www.moto-data.net/ducati/year:1995
 *  https://www.moto-data.net/ducati/year:1999
 *  https://www.moto-data.net/ducati/year:2000
 *  https://www.moto-data.net/ducati/year:2001
 *  https://www.moto-data.net/ducati/year:2002
 *  https://www.moto-data.net/ducati/year:2003
 *  https://www.moto-data.net/ducati/year:2005
 *  https://www.moto-data.net/ducati/year:2006
 *  https://www.moto-data.net/ducati/year:2008
 *  https://www.moto-data.net/ducati/year:2010
 *  https://www.moto-data.net/ducati/year:2012
 *  https://www.moto-data.net/ducati/916-1995
 *  https://www.moto-data.net/ducati/748-biposto-1999-2000
 *  https://www.moto-data.net/ducati/996-biposto-1999
 *  https://www.moto-data.net/ducati/998-2002-2003
 *  https://www.moto-data.net/ducati/749-2003
 *  https://www.moto-data.net/ducati/999-2003
 *  https://www.moto-data.net/ducati/999-s-2003
 *  https://www.moto-data.net/ducati/999-2005
 *  https://www.moto-data.net/ducati/999-2006
 *  https://www.moto-data.net/ducati/848-2008
 *  https://www.moto-data.net/ducati/848-evo-2010
 *  https://www.moto-data.net/ducati/1098-2008
 *  https://www.moto-data.net/ducati/1098-s-2008
 *  https://www.moto-data.net/ducati/1198-testastretta-evoluzione-2010
 *  https://www.moto-data.net/ducati/1198s-testastretta-evoluzione-2010
 *  https://www.moto-data.net/ducati/monster-s4-2003
 *  https://www.moto-data.net/ducati/monster-s4r-2003
 *  https://www.moto-data.net/ducati/monster-s4rs-testastretta-2006
 *  https://www.moto-data.net/ducati/monster-696-2010
 *  https://www.moto-data.net/ducati/monster-796-2012
 *  https://www.moto-data.net/ducati/monster-1100-2010
 *  https://www.moto-data.net/ducati/monster-1100-evo-2012
 *  https://www.moto-data.net/ducati/streetfighter-2010
 *  https://www.moto-data.net/ducati/streetfighter-848-2012
 *  https://www.moto-data.net/ducati/multistrada-1200-2010
 *  https://www.moto-data.net/ducati/diavel-2012
 *  https://en.wikipedia.org/wiki/Triumph_Speed_Triple
 *  https://en.wikipedia.org/wiki/Triumph_Daytona_955i
 *  https://en.wikipedia.org/wiki/Triumph_Street_Triple
 *  https://en.wikipedia.org/wiki/Triumph_Tiger_800
 *  https://en.wikipedia.org/wiki/Triumph_Thruxton
 *  https://en.wikipedia.org/wiki/Triumph_Tiger_1050
 *  https://en.wikipedia.org/wiki/Triumph_Tiger_Explorer
 *  https://en.wikipedia.org/wiki/Triumph_Daytona_600
 *  https://www.moto-data.net/triumph/year:1998
 *  https://www.moto-data.net/triumph/year:1999
 *  https://www.moto-data.net/triumph/year:2001
 *  https://www.moto-data.net/triumph/year:2004
 *  https://www.moto-data.net/triumph/year:2006
 *  https://www.moto-data.net/triumph/year:2010
 *  https://www.moto-data.net/triumph/year:2012
 *  https://www.moto-data.net/triumph/year:2014
 *  https://www.moto-data.net/triumph/year:2016
 *  https://www.moto-data.net/triumph/year:2018
 *  https://www.moto-data.net/triumph/year:2020
 *  https://www.moto-data.net/triumph/year:2023
 *  https://www.moto-data.net/triumph/year:2024
 *  https://www.moto-data.net/triumph/speed-triple-t509-1998
 *  https://www.moto-data.net/triumph/speed-triple-955i-1999
 *  https://www.moto-data.net/triumph/speed-triple-955i-2001-2002
 *  https://www.moto-data.net/triumph/speed-triple-955i-se-2004
 *  https://www.moto-data.net/triumph/daytona-t595-1998
 *  https://www.moto-data.net/triumph/daytona-955i-1999
 *  https://www.moto-data.net/triumph/daytona-955i-2001
 *  https://www.moto-data.net/triumph/daytona-955i-2004
 *  https://www.moto-data.net/triumph/daytona-600-2004
 *  https://www.moto-data.net/triumph/street-triple-r-2012
 *  https://www.moto-data.net/triumph/street-triple-675-2014
 *  https://www.moto-data.net/triumph/street-triple-2016
 *  https://www.moto-data.net/triumph/tiger-800-2012
 *  https://www.moto-data.net/triumph/tiger-900-2020
 *  https://www.moto-data.net/triumph/tiger-900-gt-pro-2024
 *  https://www.moto-data.net/triumph/tiger-1050-2010
 *  https://www.moto-data.net/triumph/tiger-explorer-2012
 *  https://www.moto-data.net/triumph/tiger-explorer-xr-2016-2017
 *  https://www.moto-data.net/triumph/thruxton-1200rs-2020
 *  https://en.wikipedia.org/wiki/BMW_K1300S
 *  https://en.wikipedia.org/wiki/BMW_K1300R
 *  https://en.wikipedia.org/wiki/BMW_S1000XR
 *  https://en.wikipedia.org/wiki/BMW_R_nineT
 *  https://www.moto-data.net/bmw/year:2009
 *  https://www.moto-data.net/bmw/year:2019
 *  https://www.moto-data.net/bmw/year:2023
 *  https://www.moto-data.net/bmw/year:2024
 *  https://www.moto-data.net/bmw/k-1300-s-2012
 *  https://www.moto-data.net/bmw/k-1300-r-2012
 *  https://www.moto-data.net/bmw/s-1000xr-2016
 *  https://www.moto-data.net/bmw/s-1000xr-2017
 *  https://www.moto-data.net/bmw/s-1000xr-2021
 *  https://www.moto-data.net/bmw/s-1000xr-2024
 *  https://www.moto-data.net/bmw/r-ninet-2021
 *  https://www.moto-data.net/bmw/r-1250r-2021
 *  https://www.moto-data.net/bmw/r-1250rs-2021
 *  https://en.wikipedia.org/wiki/KTM_990_Super_Duke
 *  https://en.wikipedia.org/wiki/KTM_690_Duke
 *  https://www.moto-data.net/ktm/year:2005
 *  https://www.moto-data.net/ktm/year:2012
 *  https://www.moto-data.net/ktm/year:2015
 *  https://www.moto-data.net/ktm/year:2016
 *  https://www.moto-data.net/ktm/year:2023
 *  https://www.moto-data.net/ktm/990-super-duke-2005
 *  https://www.moto-data.net/ktm/990-super-duke-2012
 *  https://www.moto-data.net/ktm/990-super-duke-r-2012
 *  https://www.moto-data.net/ktm/690-duke-2008
 *  https://www.moto-data.net/ktm/690-duke-2012
 *  https://www.moto-data.net/ktm/690-duke-2017
 *  https://www.moto-data.net/ktm/1290-super-duke-gt-2017
 *  https://en.wikipedia.org/wiki/MV_Agusta_F3
 *  https://en.wikipedia.org/wiki/MV_Agusta_Brutale_series
 *  https://www.moto-data.net/mv-agusta/year:2012
 *  https://www.moto-data.net/mv-agusta/year:2013
 *  https://www.moto-data.net/mv-agusta/year:2015
 *  https://www.moto-data.net/mv-agusta/year:2016
 *  https://www.moto-data.net/mv-agusta/year:2017
 *  https://www.moto-data.net/mv-agusta/f3-675-2013
 *  https://www.moto-data.net/mv-agusta/f3-800-2017
 *  https://www.moto-data.net/mv-agusta/brutale-675-2013
 *  https://www.moto-data.net/mv-agusta/brutale-675-2016
 *  https://www.moto-data.net/mv-agusta/brutal-800-abs-2013
 *  https://www.moto-data.net/mv-agusta/brutal-800-abs-2016
 *  https://www.moto-data.net/mv-agusta/brutale-1090-2013
 *  https://www.moto-data.net/mv-agusta/brutale-1090-2016
 *  https://www.moto-data.net/mv-agusta/f4-2013
 *  https://en.wikipedia.org/wiki/Aprilia_RSV_Mille
 *  https://en.wikipedia.org/wiki/Aprilia_Tuono
 *  https://www.moto-data.net/aprilia/year:2001
 *  https://www.moto-data.net/aprilia/year:2003
 *  https://www.moto-data.net/aprilia/year:2004
 *  https://www.moto-data.net/aprilia/year:2005
 *  https://www.moto-data.net/aprilia/year:2006
 *  https://www.moto-data.net/aprilia/year:2008
 *  https://www.moto-data.net/aprilia/year:2010
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-2001
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-2003
 *  https://www.moto-data.net/aprilia/rsv-1000r-2004
 *  https://www.moto-data.net/aprilia/rsv-1000r-2005
 *  https://www.moto-data.net/aprilia/rsv-1000r-2006
 *  https://www.moto-data.net/aprilia/rsv-1000r-2008
 *  https://www.moto-data.net/aprilia/rsv-1000r-2010
 *  https://www.moto-data.net/aprilia/tuono-1000-2004
 *  https://www.moto-data.net/aprilia/tuono-1000-2006
 *  https://www.moto-data.net/aprilia/tuono-1000-r-2010
 *  https://en.wikipedia.org/wiki/Suzuki_Hayabusa
 *  https://en.wikipedia.org/wiki/Kawasaki_Ninja_ZX-12R
 *  https://en.wikipedia.org/wiki/Honda_CBR1000RR
 *  https://www.moto-data.net/yamaha/yzf-1000-r1-2015
 *  https://www.moto-data.net/honda/cbr-1000rr-fireblade-2017
 *  https://www.moto-data.net/honda/cbr-1000rr-fireblade-2004
 *  https://www.moto-data.net/suzuki/gsx-r-1000-2009
 *  https://www.moto-data.net/kawasaki/zzr-1400-ninja-zx-14-2006
 */
export const BIKE_DATA = `
@Yamaha
=YZF-R1
4XV/5JJ|998cc inline-4|1998-2001|150p|177d|108n|n
5PW|998cc inline-4|2002-2003|152p|174d|105n|n
5VY|998cc inline-4|2004-2006|172p|172d|107n|n
4C8|998cc inline-4|2007-2008|180p|177d|113n|n
14B crossplane|998cc crossplane inline-4|2009-2014|182p|206|116n|n
2015-2019|998cc crossplane inline-4|2015-2019|200p|199|112n|n
2020-|998cc crossplane inline-4|2020-|200p|201|113n|n
=YZF-R1M
2015-2019|998cc crossplane inline-4|2015-2019|200p|200|112n|n
2020-|998cc crossplane inline-4|2020-|200p|202|113n|n
=YZF-R6
1999-2002|599cc inline-4|1999-2002|120p|169d|68n|n
2003-2005|599cc inline-4|2003-2005|124p|162d|68n|n
2006-2007|599cc inline-4|2006-2007|127p|161d|66n|n
2008-2009|599cc inline-4|2008-2009|94.9k|188|66n|n
2010-2016|599cc inline-4|2010-2016|91k|189|66n|n
2017-2020|599cc inline-4|2017-2020|87.1k|190|61.7n|n
=R7
|689cc CP2|2022-|54k|188|67n|n
=YZF-R3
|321cc parallel twin|2015-|42p|169|29.6n|n
=YZF-R125
2014-2018|125cc single|2014-2018|11k|140|12.4n|n
2019-2022|125cc VVA single|2019-2022|11k|144|11.5n|n
2023-|125cc VVA single|2023-|11k|144|11.5n|n
2008-2013|125cc single|2008-2013|11k|138|12.2n|n
=MT-125
2014-2019|125cc single|2014-2019|11k|138|12.4n|n
2020-|125cc VVA single|2020-|11k|140|11.5n|n
=MT-07
2014-2017|689cc CP2|2014-2017|55k|179|68n|n
2018-2020|689cc CP2|2018-2020|55k|182|68n|n
2021-2024|689cc CP2|2021-2024|54k|184|67n|n|2:55k
2025-|689cc CP2|2025-|54k|183|67n|n
=MT-09
2014-2016|847cc CP3|2014-2016|115p|188|87.5n|n
2017-2020|847cc CP3|2017-2020|115p|193|87.5n|n
2021-2023|890cc CP3|2021-2023|87.5k|189|93n|n|2:89k
2024-|890cc CP3|2024-|87.5k|193|93n|n
=MT-10
2016-2021|998cc CP4|2016-2021|160p|210|111n|n
2022-|998cc CP4|2022-|166p|212|112n|n
=Tracer 9
|890cc CP3|2021-|87.5k|213|93n|n
GT|890cc CP3|2021-|87.5k|220|93n|n
=XSR700
|689cc CP2|2016-2020|55k|186|68n|n
=XSR900
2016-2021|847cc CP3|2016-2021|115p|195|87.5n|n
2022-|890cc CP3|2022-|87.5k|193|93n|n
=XSR125
|125cc VVA single|2021-|11k|140|11.5n|n
=NMAX 125
|125cc single|2021-|9k|131|11.2n|n
=MT-03
|321cc parallel twin|2016-|30.9k|167|29.6n|n
=FZ1
2006-2009|998cc inline-4|2006-2009|150b|220|106n|n
2010-2015|998cc inline-4|2010-2015|150b|221|106n|n
=FZS1000 Fazer
|998cc inline-4|2001-2005|104.3k|230|105.9n|n
=FZ6
N|599cc inline-4|2004-2010|72k|180d|63.1n|n
Fazer|599cc inline-4|2004-2006|72k|187d|63.1n|n
Fazer S2|599cc inline-4|2007-2010|72k|186d|63.1n|n
=XJ6
N|600cc inline-4|2009-2015|57k|205|59.7n|n
Diversion|600cc inline-4|2009-2013|57k|211|59.7n|n
Diversion F|600cc inline-4|2010-2016|57k|216.8|59.7n|n
=YZF600R Thundercat
|599cc inline-4|1996-2003|72.9k|210|65.7n|n
=FZS600 Fazer
|599cc inline-4|1998-2003|69.3k|205|61.2n|n
=XJR1300
carb|1251cc air-cooled inline-4|1999-2006|77.3k|240|98n|n
EFI|1251cc air-cooled inline-4|2007-2016|77.3k|240|108n|n
=Tracer 900
MT-09 Tracer|847cc CP3|2015-2017|84.6k|210|87.5n|n
2018-2020|847cc CP3|2018-2020|84.6k|214|87.5n|n
GT|847cc CP3|2018-2020|84.6k|215|87.5n|n
@Honda
=Fireblade
CBR900RR|893cc inline-4|1992-1995|124p|185d|88n|n
CBR900RR 919|918cc inline-4|1996-1997|128p|183d|91n|n
CBR929RR|929cc inline-4|2000-2001|152p|170d|103n|n
CBR954RR|954cc inline-4|2002-2003|150p|168d|105n|n
CBR1000RR SC57|998cc inline-4|2004-2005|126k|179d|115n|n
CBR1000RR SC57|998cc inline-4|2006-2007|126k|176d|115n|n
CBR1000RR SC59|999cc inline-4|2008-2011|131k|199|112n|n
CBR1000RR SC59|999cc inline-4|2012-2016|131k|200|112n|n
CBR1000RR SP SC59|999cc inline-4|2014-2016|133k|199|114n|n
CBR1000RR SC77|999cc inline-4|2017-2019|141k|196|114n|n
CBR1000RR SP SC77|999cc inline-4|2017-2019|141k|195|114n|n
CBR1000RR-R SC82|1000cc inline-4|2020-|160k|201|113n|n
CBR1000RR-R SP SC82|1000cc inline-4|2020-|160k|201|113n|n
CBR900RR 1998-1999|918cc inline-4|1998-1999|94.1k|180d|93n|n
=CBR600RR
PC37|599cc inline-4|2003-2004|117p|169d|66n|n
PC37|599cc inline-4|2005-2006|117p|163d|66n|n
PC40|599cc inline-4|2007-2012|120p|155d|66n|n
PC40|599cc inline-4|2013-2016|120p|186|66n|n
2024-|599cc inline-4|2024-|121p|193|63n|n
=CBR600F
|599cc inline-4|2011-2013|102p|206|64n|n
F3|598cc inline-4|1995-1996|74.6k|206|63.7n|n
F3 1997-1998|598cc inline-4|1997-1998|76.5k|206|66n|n
F4|599cc inline-4|1999-2000|81k|168d|65n|n
F4i|599cc inline-4|2001-2006|81k|193|65n|n
=CBR650F
|649cc inline-4|2014-2016|87p|211|63n|n
|649cc inline-4|2017-2018|91p|208|64n|n
=CBR650R
|649cc inline-4|2019-2023|95p|208|64n|n
=CB650R
|649cc inline-4|2019-2023|95p|202|64n|n
=CB1000R
SC60|998cc inline-4|2008-2017|125p|217|99n|n
SC80|998cc inline-4|2018-|107k|212|104n|n
=CBR500R
|471cc parallel twin|2013-2018|35k|194|43n|n
|471cc parallel twin|2019-|35k|192|43n|n
=CB500F
|471cc parallel twin|2019-|35k|189|43n|n
=CB125R
|125cc single|2018-2020|9.8k|126|10n|n
|125cc single|2021-|11k|130|11.6n|n
=Grom
MSX125|125cc single|2021-|7.4k|103|11n|n
MSX125 2013-2016|125cc single|2013-2016|7.1k|101.7|10.9n|n
MSX125 2017-2020|125cc single|2017-2020|7.1k|103.8|10.9n|n
=CB125F
|125cc single|2021-|8.7k|117|11.2n|n
=PCX125
|125cc single|2021-|9.2k|130|11.8n|n
=Hornet 750
|755cc parallel twin|2023-|92p|190|75n|n
=CBR125R
2004-2010|125cc single|2004-2010|10k|127|10.6n|n
2011-2016|125cc single|2011-2016|10k|137|10.6n|n
=CBR250R
|249cc single|2011-2013|19.4k|161|23.8n|n
=CB300R
|286cc single|2018-2020|22.7k|143|27n|n
=CB500X
2013-2018|471cc parallel twin|2013-2018|35k|192|43n|n
2019-2023|471cc parallel twin|2019-2023|35k|195|43n|n
=NX500
|471cc parallel twin|2024-|35k|199|43n|n
=Rebel 500
|471cc parallel twin|2017-|34k|191|43.3n|n
=CL500
|471cc parallel twin|2023-|34k|191|43.3n|n
=CBR1100XX Blackbird
carb|1137cc inline-4|1997-1998|112k|223d|124n|n
EFI|1137cc inline-4|1999-2007|112k|225d|124n|n
=Hornet 600
CB600F|599cc inline-4|1998-2006|71.1k|198|65.6n|n
CB600F 2007-2013|599cc inline-4|2007-2013|75k|173d|63.5n|n
=Hornet 900
CB900F|919cc inline-4|2002-2007|81k|194d|92n|n
=CB1000 Hornet
|999cc inline-4|2025-|111.6k|211|104n|n
SP|999cc inline-4|2025-|115.6k|212|107n|n
=VFR800
VFR800Fi|782cc V4|1998-2001|81k|226||n
VTEC|782cc V4 VTEC|2002-2013|80k|242||n
VFR800F|782cc V4 VTEC|2014-2021|77.9k|239|75.1n|n
=CB1300
SC54|1284cc inline-4|2003-2004|83.2k|246|117n|n
SC54 2005-2017|1284cc inline-4|2005-2017|83.2k|234d|117n|n
=VTR1000F Firestorm
|996cc V-twin|1997-2005|80.2k|209|97n|n
=VTR1000 SP
SP-1|999cc V-twin|2000-2001|100k|196d|105n|n
SP-2|999cc V-twin|2002-2006|100k|194d|105n|n
@Kawasaki
=ZX-10R
|998cc inline-4|2004-2005|175p|170d|115n|n
|998cc inline-4|2006-2007|175p|175d|115n|n
|998cc inline-4|2008-2010|188p|179d|113n|n
|998cc inline-4|2011-2015|200p|198|112n|n
|998cc inline-4|2016-2020|200p|206|113.5n|n
|998cc inline-4|2021-|203p|207|114.9n|n
=ZX-6R
636|636cc inline-4|2013-2018|131p|192|71n|n
636|636cc inline-4|2019-2023|130p|196|71n|n
636|636cc inline-4|2024-|124p|198|69n|n
F|598cc inline-4|1995-1997|76.5k|187d|63.7n|n
G|598cc inline-4|1998-1999|78.1k|203|65n|n
J|599cc inline-4|2000-2002|81k|171d|66n|n
636 A1P|636cc inline-4|2002|86k|174d|68.8n|n
636 C|636cc inline-4|2005-2006|96k|185|70.5n|n
P|599cc inline-4|2007-2008|91.9k|190|66n|n
R|599cc inline-4|2009-2012|94.1k|191|66.7n|n
=ZX-4RR
|399cc inline-4|2023-|77p|188|39n|n
=Ninja 400
|399cc parallel twin|2018-2023|45p|168|38n|n
=Ninja 650
|649cc parallel twin|2017-2019|68p|193|65.7n|n
|649cc parallel twin|2020-|68p|193|64n|n
=Z650
|649cc parallel twin|2017-2020|68p|187|65.7n|n
|649cc parallel twin|2021-|68p|187|64n|n
=Z900
|948cc inline-4|2017-2019|125p|210|98.6n|n|2:134p
|948cc inline-4|2020-|125p|212|98.6n|n
=Z1000
|1043cc inline-4|2010-2013|138p|218|110n|n
|1043cc inline-4|2014-|142p|221|111n|n
2003-2006|953cc inline-4|2003-2006|93.4k|221|95.6n|n
2007-2009|953cc inline-4|2007-2009|92k|228|98.7n|n
=H2
|998cc supercharged inline-4|2015-|231p|238|141.7n|s
=H2 SX
|998cc supercharged inline-4|2018-2021|200p|256|137n|s
SE|998cc supercharged inline-4|2022-|200p|267|137n|s
=ZX-9R
C|899cc inline-4|1998-1999|143p|183d|101n|n
1994-1995|899cc inline-4|1994-1995|103.6k|216d|94n|n
1996-1997|899cc inline-4|1996-1997|105.1k|216d|94n|n
2000-2001|899cc inline-4|2000-2001|105k|183d|101n|n
2002-2003|899cc inline-4|2002-2003|105k|186d|101n|n
=ZX-12R
A|1199cc inline-4|2000-2001|178p|210d|134n|n
2002-2005|1199cc inline-4|2002-2005|131k|210d|134n|n
=ZZR1400
|1352cc inline-4|2006-2011|190p|215d|154n|n
|1441cc inline-4|2012-|200p|268|162.5n|n
=Ninja 125
|125cc single|2019-|11k|148|11.7n|n
=Z125
|125cc single|2019-|11k|146|11.7n|n
=Ninja 300
|296cc parallel twin|2013-2017|29k|172|27n|n
=Z300
|296cc parallel twin|2015-2018|28.3k|168|26.9n|n
=Z400
|399cc parallel twin|2019-2023|33.4k|167|38n|n
=Ninja 500
|451cc parallel twin|2024-|33.4k|171|42.6n|n
=Z500
|451cc parallel twin|2024-|33.4k|167|42.6n|n
=Eliminator 500
|451cc parallel twin|2024-|33.4k|176|42.6n|n
=Z750
2004-2006|748cc inline-4|2004-2006|81k|195d|75n|n
2007-2012|748cc inline-4|2007-2012|77.7k|207d|78n|n
=ER-6n
2006-2011|649cc parallel twin|2006-2011|53k|196|66n|n
2012-2016|649cc parallel twin|2012-2016|53k|204|66n|n
=Versys 650
2007-2014|649cc parallel twin|2007-2014|47k|181d|61n|n
2015-2016|649cc parallel twin|2015-2016|51k|216|64n|n
2017-2021|649cc parallel twin|2017-2021|51k|217|64n|n
=Z900RS
2018-2019|948cc inline-4|2018-2019|82k|210|98n|n
2020-2025|948cc inline-4|2020-2025|82k|215|98n|n
2026-|948cc inline-4|2026-|85k|216|98n|n
@Suzuki
=GSX-R1000
K1-K2|988cc inline-4|2001-2002|160p|170d|110n|n
K3-K4|988cc inline-4|2003-2004|164p|168d|111n|n
K5-K6|999cc inline-4|2005-2006|178p|166d|118n|n
K7-K8|999cc inline-4|2007-2008|185p|172d|117n|n
K9-L6|999cc inline-4|2009-2016|185p|203|117n|n
L7-|999cc inline-4|2017-|197p|203|117n|n
=GSX-R750
K6-K7|749cc inline-4|2006-2007|150p|163d|86n|n
K8-L0|749cc inline-4|2008-2010|150p|167d|86n|n
L1-|749cc inline-4|2011-|150p|190|86n|n
SRAD carb|749cc inline-4|1996-1997|93.3k|179d|80.5n|n
SRAD EFI|749cc inline-4|1998-1999|95.4k|178d|82.3n|n
Y-K3|749cc inline-4|2000-2003|141p|166d|84.3n|n
K4-K5|749cc inline-4|2004-2005|148p|163d|86.3n|n
=GSX-R600
K6-K7|599cc inline-4|2006-2007|125p|161d|67.7n|n
K8-L0|599cc inline-4|2008-2010|125p|165d|68.6n|n
L1-|599cc inline-4|2011-|125.8p|187|69.6n|n
SRAD|599cc inline-4|1997-2000|106p|174d|65.7n|n
K1-K3|599cc inline-4|2001-2003|115p|163d|67.6n|n
K4-K5|599cc inline-4|2004-2005|92.5k|193|69.6n|n
=GSX-R125
|125cc single|2017-|11k|134|11.5n|n
=Hayabusa
Gen1|1299cc inline-4|1999-2007|175p|215d|138n|n
Gen2|1340cc inline-4|2008-2012|197p|220d|155n|n
Gen2 ABS|1340cc inline-4|2013-2020|197p|266|155n|n
Gen3|1340cc inline-4|2021-|188p|264|149n|n
=SV650
1999-2002|645cc V-twin carb|1999-2002|70p|165d|62n|n
2003-2009|645cc V-twin EFI|2003-2009|72p|165d|64n|n
2016-|645cc V-twin|2016-|76p|196|64n|n
=GSX-S1000
|999cc inline-4|2015-2020|107k|209|106n|n
|999cc inline-4|2021-|112k|214|106n|n
=GSX-S750
|749cc inline-4|2017-|114p|213|81n|n
=GSX-8S
|776cc parallel twin|2023-|83p|202|78n|n
=GSX750F
Katana|749cc oil-cooled inline-4|1998-2006|92b|227|66n|n
=Bandit 600
GSF600|599cc air/oil-cooled inline-4|1995-2004|77b|196d|54n|n
=Bandit 650
GSF650|656cc air/oil-cooled inline-4|2005-2006|57k|201d|59n|n
GSF650 liquid-cooled|656cc liquid-cooled inline-4|2007-2016|62.5k|215d|64n|n
=Bandit 1200
GSF1200|1157cc air/oil-cooled inline-4|1996-2000|97p|208d|96n|n
GSF1200S|1157cc air/oil-cooled inline-4|1996-2000|97p|214d|96n|n
GSF1200|1157cc air/oil-cooled inline-4|2001-2006|100p|214d|93n|n
GSF1200S|1157cc air/oil-cooled inline-4|2001-2006|100p|218d|93n|n
=Bandit 1250
GSF1250|1255cc liquid-cooled inline-4|2007-2016|100p|247|107n|n
=GSX-S125
|125cc single|2017-|11k|133|11n|n
=SV1000
N|996cc V-twin|2003-2007|89k|208|102n|n
S|996cc V-twin|2003-2007|89k|208|102n|n
=TL1000S
|996cc V-twin|1997-2001|91.1k|211|103n|n
=TL1000R
|996cc V-twin|1998-2002|98.4k|228|106n|n
=GSX1400
|1402cc oil-cooled inline-4|2001-2008|106b|228d|126n|n
@Ducati
=Panigale V2
|955cc Superquadro V-twin|2020-2024|155p|200|104n|n
=959 Panigale
|955cc Superquadro V-twin|2016-2019|157p|200|107n|n
=899 Panigale
|898cc Superquadro V-twin|2014-2015|148p|193|99n|n
=1199 Panigale
|1198cc Superquadro V-twin|2012-2014|195p|188|132n|n
=1299 Panigale
|1285cc Superquadro V-twin|2015-2017|205p|191|145n|n
=Panigale V4
|1103cc Desmosedici Stradale V4|2018-2021|214p|198|124n|n
S|1103cc Desmosedici Stradale V4|2018-2021|214p|195|124n|n
=Panigale V4 R
|998cc Desmosedici Stradale R V4|2019-2022|221p|193|112n|n
=Monster 821
|821cc Testastretta V-twin|2014-2017|112p|206|89n|n
|821cc Testastretta V-twin|2018-2020|109p|206|86n|n
=Monster
937|937cc Testastretta V-twin|2021-|111p|188|93n|n
M600|600cc air-cooled V-twin|1994-2001|39k|174d|50n|n
M750|750cc air-cooled V-twin|1996-2001|47k|178d|61n|n
M900|900cc air-cooled V-twin|1993-1999|59k|184d|76n|n
S4|916cc Desmoquattro V-twin|2001-2003|74k|193d|92n|n
S4R|996cc Desmoquattro V-twin|2003-2006|83.4k|193d|95.5n|n
S4Rs|998cc Testastretta V-twin|2006-2008|95.7k|177d|103.9n|n
696|696cc air-cooled V-twin|2008-2014|58.8k|185|69n|n
796|803cc air-cooled V-twin|2010-2014|64k|187|78.5n|n
1100|1078cc air-cooled V-twin|2009-2010|69.8k|169d|102.9n|n
1100 Evo|1078cc air-cooled V-twin|2011-2013|73.5k|188|103n|n
=Monster 1200
|1198cc Testastretta V-twin|2014-2016|135p|209|118n|n
S|1198cc Testastretta V-twin|2014-2016|145p|207|125n|n
=Streetfighter V4
|1103cc Desmosedici Stradale V4|2020-2024|208p|199|123n|n
S|1103cc Desmosedici Stradale V4|2020-2024|208p|198|123n|n
=Streetfighter V2
|955cc Superquadro V-twin|2022-2024|153p|200|101n|n
=Scrambler Icon
|803cc air-cooled L-twin|2015-2022|75p|186|68n|n
=916
|916cc Desmoquattro V-twin|1994-1998|83.8k|198d|90n|n
=748
Biposto|748cc Desmoquattro V-twin|1995-1999|73k|202d|75n|n
=996
|996cc Desmoquattro V-twin|1999-2001|82.3k|198d|93n|n
=998
|998cc Testastretta V-twin|2002-2003|89.7k|198d|97n|n
=749
|748cc Testastretta V-twin|2003-2006|76k|199d|77n|n
=999
2003-2004|998cc Testastretta V-twin|2003-2004|90.4k|199d|102n|n
S|998cc Testastretta V-twin|2003-2004|100k|199d|106n|n
2005-2006|998cc Testastretta V-twin|2005-2006|102k|186d|108.9n|n
=848
|848cc Testastretta Evoluzione V-twin|2008-2010|98.5k|168d|96n|n
Evo|848cc Testastretta Evoluzione V-twin|2011-2013|103k|194|98n|n
=1098
|1099cc Testastretta Evoluzione V-twin|2007-2008|119.3k|173d|122.4n|n
S|1099cc Testastretta Evoluzione V-twin|2007-2008|119.3k|171d|122.4n|n
=1198
|1198cc Testastretta Evoluzione V-twin|2009-2011|125k|171d|131.4n|n
S|1198cc Testastretta Evoluzione V-twin|2009-2010|125k|169d|131.4n|n
=Streetfighter
1098|1099cc Testastretta Evoluzione V-twin|2009-2011|115.6k|199|119n|n
1098 S|1099cc Testastretta Evoluzione V-twin|2009-2013|115.6k|197|119n|n
848|849cc Testastretta 11 V-twin|2012-2015|97k|199|93.5n|n
=Multistrada
1200|1198cc Testastretta 11 V-twin|2010-2014|110.3k|217|118.7n|n
=Diavel
|1198cc Testastretta 11 V-twin|2011-2014|119k|239|127.5n|n
@Triumph
=Street Triple
675|675cc triple|2007-2012|107p|167d|69n|n
675 R|675cc triple|2013-2016|106p|183|68n|n
765 S|765cc triple|2017-2019|113p|166d|73n|n
765 R|765cc triple|2017-2019|118p|166d|77n|n
765 RS|765cc triple|2017-2019|123p|166d|77n|n
765 RS|765cc triple|2020-2022|123p|166d|79n|n
765 R|765cc triple|2023-|120p|189|80n|n
765 RS|765cc triple|2023-|130p|188|80n|n
675 R 2009-2012|675cc triple|2009-2012|79k|189|69n|n
675 2013-2016|675cc triple|2013-2016|78k|182|68n|n
=Speed Triple
1050|1050cc triple|2005-2010|131p|189d|105n|n
1050|1050cc triple|2011-2015|135p|214|111n|n
1050 S|1050cc triple|2016-2020|140p|192d|112n|n
1050 R|1050cc triple|2016-2020|140p|189d|112n|n
1200 RS|1160cc triple|2021-|180p|198|125n|n
T509|885cc triple|1997-1998|80.5k|206|84n|n
955i 1999-2000|955cc triple|1999-2000|80.2k|223|97n|n
955i 2001-2004|955cc triple|2001-2004|89.5k|189d|100n|n
=Daytona 675
|675cc triple|2006-2012|125p|165d|72n|n
|675cc triple|2013-2017|128p|184|74n|n
=Daytona 660
|660cc triple|2024-|95p|201|69n|n
=Trident 660
|660cc triple|2021-|81p|189|64n|n
=Bonneville T100
|900cc parallel twin|2017-|55p|213d|80n|n
=Bonneville T120
|1200cc parallel twin|2016-|80p|224d|105n|n
=Daytona 955i
T595|955cc triple|1997-1998|94.9k|214|100n|n
1999-2000|955cc triple|1999-2000|94.8k|198d|100n|n
2001-2006|955cc triple|2001-2006|110k|188d|100n|n
=Daytona 600
|599cc inline-4|2002-2004|81.6k|165d|68n|n
=Tiger 800
|799cc triple|2010-2014|69.1k|209.6|79n|n
=Tiger 900
|888cc triple|2020-2023|70k|192d|87n|n
=Tiger 1050
|1050cc triple|2007-2012|113b|198d|100n|n
=Tiger Explorer
1200|1215cc triple|2012-2015|101k|259|121n|n
1200 XR|1215cc triple|2016-2017|101k|244d|123n|n
=Thruxton 1200
|1200cc parallel twin|2016-2019|97b|203d|112n|n
RS|1200cc parallel twin|2020-2023|77k|197d|111.9n|n
@BMW
=S1000RR
K46|999cc inline-4|2009-2011|142k|204|112n|n
K46|999cc inline-4|2012-2014|142k|204|112n|n
K46|999cc inline-4|2015-2018|146k|204|113n|n
K67|999cc ShiftCam inline-4|2019-2022|152k|197|113n|n
K67|999cc ShiftCam inline-4|2023-|154k|197|113n|n
=S1000R
|999cc inline-4|2014-2016|118k|207|112n|n
|999cc inline-4|2017-2020|121k|205|114n|n
|999cc inline-4|2021-|121k|199|114n|n
=M1000RR
|999cc ShiftCam inline-4|2021-|156k|192|113n|n
=R1250GS
|1254cc ShiftCam boxer twin|2019-2023|100k|249|143n|n
=R1300GS
|1300cc boxer twin|2024-|107k|237|149n|n
=F900R
|895cc parallel twin|2020-|77k|211|92n|n
=K1300S
|1298cc inline-4|2008-2016|127k|254|140n|n
=K1300R
|1298cc inline-4|2009-2015|127k|243|140n|n
=S1000XR
2015-2019|999cc inline-4|2015-2019|121k|228|112n|n
2020-2023|999cc inline-4|2020-2023|121k|226|114n|n
2024-|999cc inline-4|2024-|126.8k|227|112n|n
=R nineT
|1170cc boxer twin|2021-2023|80k|221|116n|n
=R1250R
|1254cc ShiftCam boxer twin|2019-2023|100k|239|143n|n
=R1250RS
|1254cc ShiftCam boxer twin|2019-2023|100k|243|143n|n
@KTM
=390 Duke
|373cc single|2013-2016|32k|139d|35n|n
|373cc single|2017-2023|32k|149d|37n|n
|399cc single|2024-|45p|165|39n|n
=790 Duke
|799cc LC8c parallel twin|2018-2020|77k|169d|87n|n
=890 Duke R
|889cc LC8c parallel twin|2020-|89k|166d|99n|n
=1290 Super Duke R
Gen1|1301cc LC8 V-twin|2014-2016|132k|189d|144n|n
Gen2|1301cc LC8 V-twin|2017-2019|130k|195d|141n|n
Gen3|1301cc LC8 V-twin|2020-2023|132k|189d|140n|n
=1390 Super Duke R
|1350cc LC8 V-twin|2024-|140k|200d|145n|n
=RC 390
|373cc single|2014-2016|32k|147d|35n|n
2022-2024|373cc single|2022-2024|32k|158d|37n|n
=125 Duke
2012-2016|125cc single|2012-2016|11.3k|127d|12n|n
2017-2023|125cc single|2017-2023|11.3k|143d|12n|n
2024-|125cc single|2024-|15p|154|11.5n|n
=RC 125
|125cc single|2014-2021|10.9k|135d|11.8n|n
=390 Adventure
|373cc single|2020-2024|32k|161d|37n|n
X|399cc single|2025-|45p|176|39n|n
=990 Super Duke
|999cc LC8 V-twin|2005-2012|88k|186d|100n|n
R|999cc LC8 V-twin|2012-2013|92k|186d|100n|n
=690 Duke
|654cc LC4 single|2008-2011|46k|148.5d|65n|n
2012-2015|690cc LC4 single|2012-2015|52.2k|149.5d|69.8n|n
2016-2018|690cc LC4 single|2016-2018|54.4k|148.5d|74n|n
=1290 Super Duke GT
|1301cc LC8 V-twin|2016-2023|129k|228|144n|n
@Aprilia
=RSV4
Factory|999cc V4|2009-2010|180p|179d|115n|n
RR|999cc V4|2015-2020|201p|180d|115n|n
1100 Factory|1078cc V4|2019-2020|217p|199|122n|n
1100|1099cc V4|2021-|217p|202|125n|n
=Tuono V4
1100 RR|1077cc V4|2015-2020|175p|184d|121n|n
1100|1077cc V4|2021-|175p|209|121n|n
=Tuono 660
|659cc parallel twin|2021-|95p|183|67n|n
=RS 660
|659cc parallel twin|2020-|100p|183|67n|n
=RS 457
|457cc parallel twin|2024-|47.6p|175|43.5n|n
=RS 125
2-stroke|125cc 2-stroke single|2006-2010|21k|142|19n|n
RS4 125|125cc 4-stroke single|2011-2020|11.7k|122d|11n|n
2021-|125cc 4-stroke single|2021-|11k|144|11.2n|n
=Tuono 125
2017-2020|125cc single|2017-2020|11.7k|122d|11n|n
2021-|125cc single|2021-|11k|144|11.2n|n
=RSV Mille
|998cc V-twin|2001-2003|93.3k|215|103n|n
=RSV1000R
2004-2005|998cc V-twin|2004-2005|102k|189d|107n|n
2006-2010|998cc V-twin|2006-2010|105.2k|189d|107n|n
=Tuono 1000
|998cc V-twin|2003-2005|94k|181d|101n|n
R|998cc V-twin|2006-2010|102k|185d|107n|n
@Husqvarna
=Svartpilen 401
|373cc single|2018-2023|32k|150d|37n|n
@Royal Enfield
=Interceptor 650
|648cc parallel twin|2018-|34.9k|217|52.3n|n
=Continental GT 650
|648cc parallel twin|2018-|34.9k|212|52.3n|n
=Himalayan
411|411cc single|2016-2023|17.88k|199|32n|n
450|452cc single|2023-|29.44k|196|40n|n
=Hunter 350
|349cc single|2022-|14.87k|181|27n|n
=Meteor 350
|349cc single|2020-|14.87k|191|27n|n
=Super Meteor 650
|648cc parallel twin|2022-|34.6k|241|52.3n|n
@Harley-Davidson
=Sportster S
|1252cc Revolution Max V-twin|2021-|90k|228|125n|n
=Nightster
|975cc Revolution Max V-twin|2022-|66k|220|95n|n
=Street Bob
117|1923cc Milwaukee-Eight V-twin|2025-|68k|293|156n|n
@MV Agusta
=F3
675|675cc triple|2012-2018|94.2k|173d|71n|n
800|798cc triple|2013-2017|108.8k|173d|88n|n
=Brutale
675|675cc triple|2012-2016|84.5k|163d|71n|n
800|798cc triple|2013-2016|92k|167d|81n|n
1090|1078cc inline-4|2013-2016|106k|183d|115n|n
=F4
|998cc inline-4|2013-2016|143.5k|191d|110.8n|n
@@ENGINES
Suzuki|GSX-R1000 K5|999cc inline-4 (GSX-R1000 K5/K6)|178p|118n|n
Suzuki|GSX-R1100 oil-cooled|1052cc oil-cooled inline-4 (GSX-R1100 1986-88)|130p|101n|n
Suzuki|GSX-R1100 oil-cooled 1127|1127cc oil-cooled inline-4 (GSX-R1100 1989-92)|138p|112n|n
Suzuki|Hayabusa Gen1|1299cc inline-4 (GSX1300R 1999-2007)|175p|138n|n
Suzuki|Hayabusa Gen2|1340cc inline-4 (GSX1300R 2008-20)|197p|155n|n
Suzuki|Bandit 1200|GSF1200 1157cc air/oil-cooled inline-4 (1996-2000)|97p|96n|n
Suzuki|Bandit 1250|GSF1250 1255cc liquid-cooled inline-4|100p|107n|n
Suzuki|GSX-R750 K6|749cc inline-4 (GSX-R750 K6/K7)|150p|86n|n
Honda|CBR900RR 919|918cc inline-4 (Fireblade 1996-97)|128p|91n|n
Honda|CBR1000RR SC59|999cc inline-4 (Fireblade 2008)|131k|112n|n
Honda|CBR600RR PC40|599cc inline-4 (CBR600RR 2007)|120p|66n|n
Yamaha|R1 5VY|998cc inline-4 (YZF-R1 2004)|172p|107n|n
Yamaha|R1 14B|998cc crossplane inline-4 (YZF-R1 2009)|182p|116n|n
Yamaha|R6 2008|599cc inline-4 (YZF-R6 2008)|94.9k|66n|n
Kawasaki|ZX-10R 2011|998cc inline-4 (ZX-10R 2011)|200p|112n|n
Suzuki|Hayabusa Gen3|1340cc inline-4 (GSX1300R 2021-)|140k|150n|n
Suzuki|GSX-R1000 K9|999cc inline-4 (GSX-R1000 K9/L0/L1 2009-11)|136.1k|117n|n
Kawasaki|ZX-12R|1199cc inline-4 (ZX-12R 2000, no ram air)|133.1k|137n|n
Kawasaki|ZZR1400 2006|1352cc inline-4 (ZZR1400 / ZX-14 2006, no ram air)|187b||n
Yamaha|R1 2015|998cc crossplane inline-4 (YZF-R1 2015 Europe)|200p|112.4n|n
Honda|CBR1000RR SC57|998cc inline-4 (Fireblade 2004)|126.4k|115n|n
Honda|CBR1000RR SC77|999cc inline-4 (Fireblade 2017)|141k|114n|n
`;
