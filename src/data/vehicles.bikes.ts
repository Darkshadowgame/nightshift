/* eslint-disable */
/**
 * UK motorbikes: stock specs for the vehicle picker. Dataset 2026-11-17.3 (batch 3: bike tuner stages, gaps, learner/A2 bikes, scooters, supermotos and adventure bikes; earlier: batch 2: 125/A2 bikes, more nakeds, sports and tourers, bike donor engines).
 *
 * Format (parsed by src/lib/vehicles.ts): "@Make", "=Model", then
 * "gen|engine|years|power|weight|torque|asp[|stages]". Power is as the maker quotes it:
 * p = PS (converted to bhp x0.986), b = bhp, k = kW (x1.341). Torque n = Nm, l = lb-ft, k = kg·m (JDM catalogues; x7.233 to lb-ft).
 * Weight kg: kerb for cars, wet for bikes; "d" = only a dry weight was published (+20 kg added).
 * asp: t turbo petrol, d diesel, n non-turbo, s supercharged, h hybrid (full, mild or plug-in), e fully electric. Stages: total power after
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
 *  - Honda CBF125: Honda's 2009 constructor data (moto-net.com) gives 8.3 kW (11.3 ch), 11.2 Nm and 128 kg "tous pleins faits" (fully fuelled). 1000PS gives the same 128 kg kerb and 11.2 Nm for 2009 and 2012. UK sales began December 2008 (Wikipedia), so the first UK model year is 2009. Wikipedia gives 2008-2015.
 *  - Honda CB125F 2015-2020 (the first CB125F, before the 2021 eSP redesign that is already in the file): Honda's European press release gives 7.8 kW, 10.2 Nm and 128 kg kerb. moto-data says 129 kg wet, so Honda's figure is used. Wikipedia says the 2021 model lost 11 kg, down to 117 kg, which agrees. The 2020 end year is from Wikipedia's 2021 redesign.
 *  - Honda Hornet 600 S (CB600FS, faired): motorcyclespecs 2002-03 page gives 71.1 kW, 65.6 Nm, 179 kg dry and 201 kg wet. Its 2000 page shows the same block. Power and torque are the same as the existing naked CB600F line, and the S is 3 kg heavier wet. Wikipedia says the S was introduced in 2000 and dropped in 2003, so it is 2000-2003, not 1999-2006.
 *  - Yamaha TZR125 (2RK, then 3PC from March 1989): moto-data's 1987-88 and 1989-90 pages and motorcyclespecs give 19.3 kW (26 hp), 1.8 kgf-m and 104 kg dry (122.7 kg wet). Those are full-power figures. UK learner bikes were sold restricted to 12 bhp, the same approach as the existing Aprilia RS 125 2-stroke line. The dry weight was used to match the TZR125R line; the 122.7 kg wet figure could be used instead. The classicmechanics feature gives the UK launch as March 1987 and says the basic model ended in late 1992 or early 1993, when the TZR125R replaced it.
 *  - Yamaha TZR125R (Italian-built "Belgarda", 1993-1996): moto-data and motorcyclespecs give 30 hp, 1.8 kgf-m and 121 kg dry. motorcyclespecs says the UK bike was 12 bhp restricted and dealer-derestrictable. The 1993-1996 years are from Visordown's UK review.
 *  - Yamaha TZR250 2MA: the German database says the 1KT (1986, 45 PS) was Japan-only and the 2MA (MY1987, 50 PS) was the international version. Wikipedia says the UK and Europe got the 2MA and that the later 3MA and 3XV were Japan-only (grey imports). The figures are moto-data 1987: 36.4 kW, 35.5 Nm, 128 kg dry and 140 kg wet. motorradundreisen gives 37 kW, 35.3 Nm and 144 kg fahrfertig. The 1988 end year assumes the 3MA replaced it in 1989.
 *  - Yamaha TZR250 3XV (grey import): moto-data 1991 gives 33.6 kW (45 hp), 40 Nm (3.8 kgf-m) and 126 kg dry. ja.wikipedia says 3XV power was cut to 40 PS from the 1993 model year, so the line covers only 1991-1992. 3MA and 1KT were not added (see OMISSIONS).
 *  - Triumph Street Triple S 660 A2: the A2 bike was sold at 35 kW. Triumph's 2020 media kit gives 35 kW (47.6 PS), 60 Nm and 168 kg dry, and says a dealer can derestrict it to 70 kW and 66 Nm. For 2017-2019, 1000PS's 2019 page gives 48 HP, 60 Nm and 168 kg dry. Motoplanete's 2017/2019 pages give 168 kg dry and "95 ch" (the derestricted figure). No Triumph 2017 spec sheet was reachable. The 2020-2022 years are the 1000PS listing years.
 *  - Triumph Thruxton R: moto-data 2016 gives 71.5 kW (96 hp), 111.9 Nm and 203.2 kg dry. motorcycle.com's launch spec gives 448 lb dry for the R and 454 lb (206 kg) dry for the base Thruxton 1200. So the existing base line's 203d is really the R's figure; hence the EDIT. Wikipedia's infobox only gives the 203 kg R figure for the whole range. The R ends in 2019 because the RS (already in the file) replaced it for 2020, although 1000PS also lists a 2020 Thruxton R model year.
 *  - Ducati Hypermotard: all figures are from moto-data. The 1100 (2007 and 2008 pages agree) is 69.3 kW, 102.9 Nm and 179 kg dry. Wikipedia gives 1100 S 177 kg; no S line was added. The 1100 Evo (2010 and 2012) is 69.9 kW and 172 kg dry; Wikipedia agrees on 95 bhp and 172 kg. The 796 (2010 and 2012) is 59.6 kW and 167 kg dry. Wikipedia says the 796 was introduced late 2009, so 2010 is the first model year. moto-data names the 821 the "Hypermotard 820" (2013 page: 80.9 kW, 89.2 Nm, 198 kg wet); the 939 replaced it in 2016. The 939 (2016 and 2018 pages agree) is 82 kW, 97.9 Nm and 204 kg wet. The 950 (2019) is 84 kW, 96 Nm and 200 kg wet; Wikipedia gives 176 kg dry where moto-data says 178.
 *  - Ducati Hypermotard 950 end year 2025: moto-data's 2023 index still lists the 950 RVE/SP, the 2024 and 2025 indexes list only the 698 Mono, and the 2026 index lists the Hypermotard V2 as the new model. The end year is therefore approximate.
 *  - Ducati Diavel Gen 1.5 (2015-2018): the moto-data 2015-16 page repeats the first-gen block (119 kW, 127.5 Nm, 239 kg wet). Wikipedia's text says 162 hp and 130.5 Nm. The 119 kW figure is consistent with 162 hp, but the torque conflicts. The 2018 end year is set by the 1260 arriving in 2019 (Wikipedia).
 *  - Ducati Diavel 1260 and 1260 S: moto-data's 2020 pages give identical figures for both (117 kW, 128.9 Nm, 214 kg dry, 244 kg wet). Wikipedia says the bike launched in 2019 in regular and S versions. The 2022 end year comes from moto-data's 2023 index, which lists the Diavel V4 instead; the 2022 index lists no Diavel.
 *  - BMW K1200S: de.wikipedia gives 123 kW (167 PS), 130 Nm and 248 kg Leergewicht, produced 2004 to August 2008. moto-data gives 124.5 kW and 129 Nm and labels the 248 kg "dry", which is wrong (it is BMW's road-ready figure). The de.wikipedia figures are used, with 2005 as the first UK model year (moto-data's first listing).
 *  - BMW K1200R: de.wikipedia gives 120 kW (163 PS), 127 Nm, 211 kg Trockengewicht and 237 kg "Leergewicht fahrfertig, vollgetankt" (road-ready with a full tank), produced 2005-2008. en.wikipedia agrees on 2005-2008, 127 Nm and 237 kg, and says the K1300R replaced it at the end of 2008. This resolves the earlier note that moto-data mislabels 237 kg as dry.
 *  - BMW R nineT: moto-data gives the 2014 and 2016-17 base bike as 81 kW, 119 Nm and 222 kg wet (208 kg dry). The 2017-2020 Euro 4 base bike (116 Nm) has only a "dry" 220 kg on moto-data and was not added, the same handling as the earlier batch. The Scrambler's 2016 page says 82 kW and 115 Nm, while the 2017 page says 81 kW, 116 Nm and 220 kg wet; the 2017 figures are used for 2016-2020. moto-data lists the Racer 2017-20 at 219 kg wet and the Urban G/S 2017-20 at 221 kg wet; there is no Racer in moto-data's 2021 index, so the Racer ends in 2020. The 2021 updates are 80 kW and 116 Nm, with the Pure at 219 kg wet and the Scrambler and Urban G/S at 223 kg wet. Wikipedia gives R nineT production as 2014-2023, which sets the 2023 end year.
 *  - KTM 990 Super Duke R 2008-2011: moto-data 2010 gives 96.9 kW (130 hp), 101.7 Nm and 186 kg dry. Wikipedia says power rose from 88 kW to 97 kW at 10,000 rpm for 2008-2011 and dates the R from 2008 in its intro (the section heading says 2007-2011). moto-data's 2008 R page repeats the base bike's 88 kW, so it was not used. The 2012-2013 combined R line already exists. The existing base line runs 2005-2012, which overlaps the 2012-2013 R line; it was left alone.
 *  - MV Agusta Brutale (older): years are the model years moto-data lists, following the existing MV note. The 1078 RR and 989 R also appear in moto-data's 2010-2012 indexes, although Wikipedia describes the 1090 RR and 990 R as the 2010 redesign. The 910 S is moto-data's 102.2 kW, 96 Nm and 185 kg dry (2005-06 and 2007-08 pages); Wikipedia says 101 kW (136 bhp). The 989 R is 102.9 kW, 123.5 Nm and 185 kg dry; Wikipedia says 106 kW (142 bhp). The 1078 RR is 113 kW, 117 Nm and 185 kg dry; Wikipedia says 115 kW. The 990 R is 102 kW, 106 Nm and 190 kg dry; Wikipedia says 104 kW. The 920 is 96 kW, 95 Nm and 190 kg dry, which matches Wikipedia's 96 kW, introduced 2011. The 1090 R (2012 page) is 106 kW, 115 Nm and 190 kg dry.
 *  - MV Agusta Brutale 1090 RR: torque is left empty. moto-data's 2010 and 2011 pages say 100 Nm @ 8,100 rpm, which looks wrong next to the 1078 RR (117 Nm) and the 1090 R (115 Nm). Power is 116.5 kW (158 hp) and weight 183 kg dry. moto-data's 2013 index also lists a 1090 RR, but it was not fetched, so the line ends at 2012.
 *  - Aprilia RSV Mille 1998-2000: moto-data's 1998, 1999 and 2000 pages all give 93.3 kW, 103 Nm, 189 kg dry and 220 kg wet. Wikipedia says the first (ME) Mille was made from 1998 to 2000 and gives a single 210 kg wet figure for the whole range. moto-data's 220 kg is used because it is per-year. The existing 2001-2003 line (215 kg) was left as is.
 *  - Aprilia RSV Mille R: 1999 and 2000 are 97.2 kW, 106 Nm and 183 kg dry. 2001-2003 is 101.3 kW and 107 Nm, with 189 kg dry on the 2001 and 2002 pages; the 2003 page says 185 kg dry, so the majority 189 kg is used. Wikipedia says the R was introduced in 1999.
 *  - Search budget for the session ran out part-way, so later lookups used known URL patterns (moto-data.net, bikez.com, Honda UK spec pages, Yamaha EU factsheet PDFs, lexmoto.com model pages). Yamaha factsheet PDFs were fetched with WebFetch and read with pdftotext.
 *  - Honda PCX125 2010-2011: power 7.3 kW / 11 Nm from bikez 2010 page (no weight there); 127 kg wet from bikez 2011 page. eSP 2012-2013 from bikez 2012 page (8.2 kW, 124.4 kg wet). bikez's 2014 page repeats the 2012 block (124.4 kg), its 2016 page says 130 kg, which is used for 2014-2017. bikez 2017 page (Euro 4) says 8.4 kW / 12 Nm. Wikipedia says the PCX125 launched in the UK in early 2010.
 *  - Honda Forza 125 2015-2017 and 2018-2020 are from bikez (no moto-data pages found). 2025- facelift: moto-data 2025 page and Honda UK agree (10.7 kW, 164 kg, 12.3 Nm). 2021-2024 from moto-data 2021 page.
 *  - Honda Forza 300: only the 2018-2020 shape (moto-data 182 kg wet; its 2017-18 page shows the same figures). The 2013-2017 Forza 300 was left out: bikez gives 201 kg "dry", which looks wrong.
 *  - Honda Forza 350: Honda UK 31.5 Nm used; moto-data 2025 page says 31.2 Nm. Start year 2021 from bikez listing (honda_forza_350_2021).
 *  - Honda SH125i 2020-: moto-data 2024 page 9.6 kW / 133.9 kg wet / 12 Nm; Honda UK shows 138 kg for the Smart Top Box version; bikez 2022 page says 9.4 kW, 133.9 kg (Euro 5). bikez's 2020 page repeats older 8.8 kW figures, so not used.
 *  - Honda CB500F 2013-2018: Bennetts 2013 test (47 bhp, 32 lb-ft, 192 kg wet = ABS model). bikez 2013 and 2016 pages: 34.3 kW, 43 Nm, 190 kg wet (non-ABS).
 *  - Honda CB500 Hornet (2024-) added as its own model: it replaced the CB500F; Honda UK 35 kW / 191 kg / 43 Nm. The existing CB500F line is open-ended ("2019-"); consider closing it at 2023 since the Hornet replaced it for 2024 (not changed here, no fetched page gave the exact end year).
 *  - Honda Africa Twin: CRF1000L manual 232 kg wet (DCT 242 kg) per moto-data; de.wikipedia gives 228 kg fully fuelled. CRF1100L 2020-2023 75 kW / 105 Nm / 226 kg from de.wikipedia (DCT +10 kg); bikez's 101 hp (73.7 kW) figure is US spec. 2024- update: Honda UK 75 kW / 112 Nm / 231 kg (base manual). Adventure Sports and DCT versions not listed as separate lines. Honda UK now also lists a CRF1150L (not researched).
 *  - Honda NC750X: moto-data gives one weight for manual/DCT up to 2020; 2021 and 2025 pages give manual 214/216 kg (DCT 224/226 kg). Manual figures used.
 *  - Honda CRF250L: moto-data 2012-13 and 2016 pages identical (17 kW, 147 kg). End year 2020 assumes the CRF300L (moto-data from 2021) replaced it.
 *  - Yamaha MT-03 660: years 2006-2014 from en.wikipedia ("produced from 2006 to 2014"); figures from moto-data (33.8 kW, 174.5 kg dry); Wikipedia's 36 kW / 56 Nm (2005 Telegraph) not used.
 *  - Yamaha XMAX 125: 2006-2013 moto-data dry 153 kg (2006-08, 2009-11 pages identical); 2014-2017 from Yamaha 2016 factsheet (169 kg; ABS 173 kg); moto-data 2014-15 page repeats the old 153 kg dry block. 2021- uses 2023 factsheet (9.0 kW, 11.2 Nm, 167 kg); 2021 factsheet says 9.0 kW, 11.0 Nm, 166 kg.
 *  - Yamaha XMAX 400: start year 2014 = first factsheet/bikez listing (it may have arrived for 2013). 2020 factsheet repeats 2018 figures; end year 2020 = last factsheet found.
 *  - Yamaha Tenere 700 (written without accent): 2019 factsheet 204 kg; 2025 factsheet 208 kg, same 54 kW / 68 Nm.
 *  - Yamaha WR125R/X: moto-data pages 2009-2015 identical; a new WR125R appears on moto-data for 2026 (not added).
 *  - Suzuki DR-Z400SM UK years 2005-2008 from Bennetts buying guide title; moto-data lists it to 2019 (US market). DR-Z4S/DR-Z4SM: Bennetts spec table gives 151 kg (S) / 154 kg (SM) kerb but its text contradicts; moto-data agrees with the table. Bennetts calls them 2025 models (title says 2026).
 *  - Suzuki V-Strom 650 2017-: Bennetts used-buyer guide (71 bhp, 46 lb-ft, 213 kg wet). moto-data 2019 and 2021-22 pages say 50.4 kW / 69 Nm, which looks wrong for torque, so not used. End year not verified (Bennetts says "2017 - current"); it may have ended 2023/24 when the V-Strom 800 arrived.
 *  - Suzuki V-Strom 1050 2020-2022: only the XT figures found (Bennetts: 106 bhp, 73.8 lb-ft, 247 kg kerb); moto-data 2020 base page has no power and 236 kg wet. 2023- moto-data (79 kW, 242 kg). V-Strom 1000 end year 2019 = last moto-data page.
 *  - KTM 690 SMC R / 690 Enduro R and Husqvarna 701s: moto-data figures; moto-data does not say whether its "dry" weight is KTM's "without fuel". 2008-2011 690 SMC is the 654cc (653.7cc) engine. 690 Enduro R 2009-2015: 2009-10 and 2014 pages both 46 kW / 150 kg wet. 690 SMC R 2019 page gives 54 kW with no rpm.
 *  - Husqvarna 701 Supermoto/Enduro 2021-: moto-data labels 156/155 kg as wet (earlier pages 145 kg dry).
 *  - KTM 890 Adventure: moto-data 2021 and 2023 pages identical (78.3 kW, 210 kg wet). The 2025 update was not checked.
 *  - BMW F 800 GS 2008-2017: moto-data 2008 and 2013 pages identical. F 850 GS: moto-data 95 hp / 70.8 kW (non-Brazil spec); end year 2023 assumed from the F 900 GS (2024) replacement.
 *  - Triumph Tiger Sport 660: 2022 bikez 81 hp (59.1 kW), 206.4 kg wet, 64 Nm; 2026 update from moto-data (70 kW, 211 kg, 68 Nm). End year 2025 for the first version assumes the 2026 update.
 *  - Vespa GTS 125 i-get 2017-: bikez 2021 GTS Super 125 says 10.1 kW / 160 kg dry; moto-data 2017 GTS 125 i-get says 9 kW / 11.1 Nm (no weight). bikez used because it has a weight. GTS 125 Super 2010-2016 years from bikez listings (2010-2015 pages).
 *  - Vespa GTS 300: 2017-2018 GTS 300 (moto-data gts-300-4v-abs-asr-2017) not fetched, so a gap; 2008-2011 GTS 300 ie also not added.
 *  - Vespa Primavera 125: moto-data 2015 and 2018 pages identical (7.8 kW, 115 kg dry). End year 2020 assumed (bikez 2023 page shows 8.0 kW Euro 5 bike, no weight).
 *  - SYM / Lexmoto / Piaggio Medley years are the bikez listing years (first year seen); end years not verified, so most are open.
 *  - Lexmoto: lexmoto.com spec pages give "Mass In Service" (treated as kerb/wet). LXR 125 uses bikez 2021 (8.8 kW, 9.6 Nm, 167 kg wet); current lexmoto.com E55 (Euro 5+) spec says 10.6 kW @ 9500, 11.5 Nm, 168 kg. Aura 125 and ZSB 125 figures are the current E55 specs; years from bikez listings (Aura 2023, ZSB 125 EFI 2024).
 *  - Kawasaki KLX125 end year 2014 = last moto-data page ("2014-"); UK sales may have run later.
 *  - Method: stage total = maker stock claim (existing line, its unit) + tuner's published GAIN for that product on that model, rounded to 0.1. SC-Project quotes gains as "hp"/"CV" (Italian maker; several pages write "CV"), treated as metric PS: added 1:1 to p-unit lines, x0.7355 for k-unit lines. If read as imperial hp the k figures move by <=0.05 kW and the p figures by <=0.1 PS.
 *  - Stage 1 = slip-on / end can (or slip-on + de-cat link/map). Stage 2 = full system (headers + silencer). SC-Project and Termignoni gains are the maker's own claimed delta vs OEM, mostly at a stated rpm (not always at peak); rpm noted per bike below.
 *  - Triumph Street Triple 675 2007-2012 (107p) and 675 R 2009-2012 (79k): SC-Project pair of Oval slip-ons (T02A, street legal), "+3,5 CV" (no rpm given); category fits Street Triple 675 2007-2012 / R.
 *  - Triumph Street Triple 675 R 2013-2016 (106p) and 675 2013-2016 (78k): SC-Project Conic slip-on (T13A, street legal) "+4,8 CV" (S1 slip-on same); category Street Triple 675 2013-2016 R/RX.
 *  - Triumph Street Triple 765 S/R/RS 2017-2019: SC-Project SC1-R slip-on (T18B, Euro 4 approved) +6,4 CV @8500 rpm, +5,4 Nm. Same gain added to S 113p, R 118p, RS 123p.
 *  - Triumph Street Triple 765 R/RS 2023-: Stage 2 = SC-Project 3-1 stainless full system with CR-T silencer (T28A-PC36CR/TR, racing only) +7,8 hp @10500 rpm, +5,3 Nm. Fitment category "Street Triple 765 R-RS (2023-2024) Euro 5"; the 2024-2026 Euro 5+ version (T28B) quotes the same +7,8 hp. Other SC full systems on the same bike: S1 +6.0 hp, SC1-S +5.0 hp; the Euro-5 approved SC1-X full system has no published gain.
 *  - Triumph Trident 660 2021-: Stage 2 = SC-Project 3-1 stainless full system with S1 titanium silencer (T26A-CDE41T) +2,6 hp @9750 rpm WITH dB-killer (+4,5 hp without dB-killer; the Euro 5 STR-1 full system claims only +1,2 hp). The with-dB-killer figure was used.
 *  - BMW S1000RR K46 2009-2011 / 2012-2014 (142k): SC-Project CR-T slip-on (B10A, racing) +3,1 hp @13500 rpm -> +2.3 kW. SC category is "S 1000 RR 2010-2014 - HP4"; 2009 is the existing line's first UK year.
 *  - BMW S1000RR K46 2015-2018 (146k): SC-Project CR-T slip-on for 2015-2016 (B20A) +3,4 hp @10500 rpm used (-> 148.5k). For 2017-2018 SC lists S1 (B25A) +4,9 hp @10700 and CR-T +4,6 hp @9850 (would give ~149.6k); the lower 2015-16 figure was used for the whole line.
 *  - BMW S1000RR K67 2019-2022 / 2023-: header note says Bennetts' dyno of an Akrapovic full system gave no peak gain, so no STAGE 2 is listed (still true). This edit adds only STAGE 1 = SC-Project SC1-R slip-on (Euro 4/5 approved) +1,3 hp @11500 rpm (near peak), -> +1.0 kW. Akrapovic's own Racing Line (Ti) 2021 page claims +7.8 kW (+10.6 PS) but at 8550 rpm, i.e. midrange, consistent with the Bennetts finding, so it was NOT used for a peak stage (https://www.akrapovic.com/en/moto/product/20686/BMW/S-1000-RR/2021?brandId=44&modelId=377&yearId=6203). Drop the K67 stage 1 if the lead prefers to keep the K67 lines stage-free.
 *  - BMW S1000R 2014-2016: SC CR-T (B09A) +2,7 hp @10500 -> 119.99 rounded to 120k. 2017-2020: SC S1 (B27A, Euro 4) +3,8 hp @9500 (CR-T / GP70-R +3,6 hp). 2021-: SC SC1-R (B39A, Euro 5) +1 hp @10000 (S1 +0,6 hp).
 *  - BMW M1000RR 2021-: SC SC1-R (B33D, Euro 5) +1,3 hp @11500; SC page title "BMW M 1000 RR 2020 2021 2022 2023 2024". Same figure as SC's S1000RR K67 slip-on.
 *  - BMW R1250GS 2019-2023: SC Adventure / SC1-R GT slip-on (B30A Euro 4 / B30B Euro 5) +2,9 hp @6000 rpm, +3,5 Nm; categories cover GS and GS Adventure 2019-2024.
 *  - KTM 1290 Super Duke R Gen2 2017-2019: SC SC1-R slip-on (KTM10B, Euro 4) +3,8 CV @9000 rpm (Conic +2,5 CV). Gen3 2020-2023: SC SC1-R (KTM16A Euro 4 2020 / KTM16B Euro 5 2021-2023) +6,9 hp @6750 rpm, +8,4 Nm @4250 (midrange; peak gain likely smaller).
 *  - KTM 790 Duke 2018-2020: SC SC1-R slip-on (KTM12A, Euro 4) +1,1 HP @7500 rpm.
 *  - Ducati Monster 821 2014-2017: SC CR-T slip-on (D14A, racing) +2,6 hp @6300 (street-legal Conic +2,4 hp). 2018-2020: SC CR-T (D25A, racing) +3,2 hp @5250 rpm (Euro 4 SC1-R +1,7 hp @8750). Both are low-rpm gains.
 *  - Ducati Monster 937 2021-: SC Twin CR-T slip-on (D37A, Euro 5 approved) +3,1 hp @9500 rpm.
 *  - Ducati Panigale V2 2020-2024: SC 2-1 HALF system (mid-pipe + S1 titanium silencer, D35A, racing) +5,7 hp @9750 rpm; listed as stage 1 because it keeps the OEM headers (not a full system).
 *  - Ducati 959 Panigale 2016-2019: Termignoni "Force" twin silencers (D169, EU homologated, page says MY 2016-2018) used WITH the Termignoni de-cat body D16909430IXX (MY 2016-2019) give "+6,27 CV a 11.000 rpm" -> 163.3p, stage 1 (silencers + de-cat on OEM headers).
 *  - Ducati Panigale V4 / V4 S 2018-2021: Termignoni pages give "MAX Gain" and "Pmax" deltas vs OEM; the Pmax (gain at peak power) figure was used, not the bigger MAX Gain. Stage 1 = Termignoni D184 pair of underbelly racing silencers on OEM headers, cat removed, with UP-MAP device + map (page: "Ducati Panigale V4 S,R (2018-2024)") Pmax +10,5 CV @13400 (MAX Gain +14,6 CV @14300). Stage 2 = Termignoni D200 complete system (stainless headers + RHT silencers, "per Panigale V4 e Streetfighter V4") Pmax +16,3 CV @13400 (MAX Gain +32,6 CV @14700). The D200 page gives no model years.
 *  - Ducati Streetfighter V4 / V4 S 2020-2024: Stage 1 = Termignoni D199 "Black Edition" underbelly silencers on OEM headers, cat removed, kit includes UP-MAP device: Pmax +11,31 CV @14000 (MAX Gain +18,84). Stage 2 = same Termignoni D200 complete system as the Panigale V4 (page lists a Streetfighter V4 spec): Pmax +16,3 CV @13400. No model years on these Termignoni pages.
 *  - Aprilia RS 660 2020-: Stage 2 = SC 2-1 stainless full system with SC1-R titanium silencer (A23A-AC90T, racing) +3,6 hp @9250 rpm (titanium Trofeo version same; titanium CR-T full system +2,9 hp). Euro 5 approved version has no published gain.
 *  - Aprilia RSV4 RR 2015-2020 (201p): SC SC1-R slip-on (A16B 2017 / A18A 2018-2020, racing) +4,2 hp @13400 rpm. SC's 2015-2016 RSV4 category had no published gain, so the figure is from the 2017-2020 fitment.
 *  - Aprilia RSV4 1100 2021-: Stage 1 = SC SC1-R slip-on (A27A, Euro 5 approved) +1,8 hp @13000 rpm. Stage 2 = SC 4-2-1 titanium full system with SC1-R 250 mm silencer (racing) +6,5 hp @8500 rpm WITH dB-killer (+9,8 hp @8700 without dB-killer); with-dB-killer figure used.
 *  - Aprilia Tuono V4 1100 RR 2015-2020 (175p): SC Oval slip-on (A07A, street legal, fitment Tuono V4 2015-2016 Factory/RR) +4,9 hp @7000 rpm. SC's 2017-2020 Tuono V4 1100 SC1-R page repeats the RSV4 figure (+4,2 hp @13400 rpm, above the Tuono's peak-power rpm), looks copy-pasted, not used.
 *  - Aprilia Tuono V4 1100 2021-: SC S1 slip-on (A27B, racing) +5,8 hp @7750 rpm. SC's Euro 5 SC1-R page repeats the RSV4's "+1,8 hp @13000 rpm" figure (likely copy-paste), not used.
 *  - All SC-Project figures were read from the product pages' "Power" attribute (or description) on shop.sc-project.com; all Termignoni figures from termignoni.it product pages (Italian "POTENZA [Cv], Delta vs a OEM").
 *  - Review (batch 3): stage 2 dropped for Fireblade SC82 / SP, ZX-10R 2016-2020 and 2021-, and Bandit 1250, because Akrapovic's "max gain" there is a midrange figure (e.g. +11.9 kW at 8100 rpm), not a peak-power gain. Their stage 1 figures stay.
 *  - All stage figures = maker's claimed stock power + Akrapovic's published "Max gain" for that product, in the stock unit (PS->HP(m), kW->kW), rounded to 0.1. Akrapovic's "Max gain" is the biggest difference at ANY rpm (the rpm is given), so on some bikes it is a midrange gain rather than a peak-power gain; the rpm is noted per line below.
 *  - Akrapovic product pages list a product under the LATEST model year it fits (e.g. "R6 2026"); year fit was taken from the model-year listing pages on akrapovic.com where fetched, otherwise noted.
 *  - Yamaha YZF-R1 2015-2019: stage 1 = Slip-On Line Ti S-Y10SO11-HAP (R1 2016, +1 HP(m) at 13550 rpm); stage 2 = Evolution Line Ti S-Y10E4-HX2T (R1 2019, +3.6 HP(m) at 13700 rpm; Dynojet map required). Page says both also fit the R1M.
 *  - Yamaha YZF-R1 2020-: stage 1 = Slip-On Line Ti S-Y10SO18-HAPLT (+1.5 HP(m) at 12400 rpm, listed on the R1 2021 product list); stage 2 = Racing Line Ti S-Y10R15-APLT (+9.8 HP(m) at 7250 rpm, a midrange gain; ECU remap recommended; not road-legal). Same parts listed as fitting the R1M.
 *  - Yamaha YZF-R6 2010-2016: stage 1 = Slip-On Ti S-Y6SO10-AHBT (+0.9 kW at 14450 rpm); stage 2 = Racing Line (Carbon) "10-" S-Y6R7-ZC (+4.7 kW at 8500 rpm, midrange). Not applied to the 2008-2009 line (the "10-" in the title suggests 2010 on).
 *  - Yamaha YZF-R6 2017-2020: Akrapovic lists these under "R6 2026" (the current R6 Race track bike shares the engine). Stage 1 = same slip-on S-Y6SO10-AHBT (+0.9 kW); stage 2 = Racing Line Ti S-Y6R9-APT (+7.8 kW at 12700 rpm; Dynojet map required). Its performance-graph PDF is a YZF-R6 dyno sheet dated 2017-06-28, so it was developed on the 2017 bike; fit to 2017-2020 not stated in words.
 *  - Yamaha MT-07 2014-2017: Racing Line Ti (2016 listing) +2 kW at 9250 rpm. 2018-2020: Racing Line Carbon (2020 listing, also listed for 2024/2026) +1.9 kW at 9100 rpm. 2021-2024 keeps the existing 2:55k (Akrapovic Racing Line Ti 2023/2024 = +1.1 kW, re-confirmed). 2025-: Racing Line Ti listed for "MT-07 2026" +1.9 kW at 9100 rpm (fit to the 2025 bike assumed from the 2025- generation; not road-legal).
 *  - Yamaha MT-09 2014-2016: Racing Line Ti (2016 listing) +5.4 HP(m) at 9900 rpm. 2017-2020: Racing Line Ti (2020 listing, needs cat P-KAT-057) +6.7 HP(m) at 10100 rpm. 2021-2023 existing 2:89k left as is (Ti Racing Line +1.5 kW re-confirmed; the Carbon Racing Line, not road-legal, claims +3.3 kW at 9600 rpm). 2024-: Racing Line Ti listed for MT-09 2026 (+1.5 kW at 10000 rpm; carbon version's fitting kit says MY 2024-2026).
 *  - Yamaha MT-10 2016-2021: stage 1 = Slip-On Ti S-Y10SO15-HAPT (+1 HP(m) at 9850 rpm); stage 2 = Racing Line Ti S-Y10R14-HX2T (+4.7 HP(m) at 11250 rpm, Dynojet map required). 2022-: Akrapovic has no full system for this gen; stage 1 = Slip-On Ti S-Y10SO20-HAPLT (+0.8 HP(m) at 11200 rpm); stage 2 = that slip-on + Optional Link Pipe/Collector Ti L-Y10SO19 (de-cat, ECU remap mandatory) +3.2 HP(m) at 10700 rpm.
 *  - Yamaha Tracer 9 / GT (2021-): Racing Line Ti listed for "Tracer 9 / GT / GT+ 2024" with a separate fitting kit for MY 2021-23; +1.5 kW at 10000 rpm (mapping needed). Same figure as the MT-09 2021- Ti system.
 *  - Honda Fireblade SC59 2012-2016: stage 1 = Slip-On Ti (CBR1000RR 2016 listing, +3.2 kW at 6400 rpm, midrange); stage 2 = Racing Line Ti 2016 (+6.4 kW at 6400 rpm, midrange; not road-legal). SC59 2008-2011 and SC59 SP not given stages: Akrapovic's 2013 slip-on (+3.4 kW at 6550 rpm) and a second 2016 Ti slip-on (+3.3 kW) could not be tied to those exact years/variants.
 *  - Honda Fireblade SC77 2017-2019 (and SP): stage 1 = Slip-On Ti 2019 (+1.1 kW at 7150 rpm; mapping required); stage 2 = Racing Line Ti 2019 (+4.9 kW at 7550 rpm; ECU remap with Rapid Bike map required).
 *  - Honda CBR1000RR-R SC82 (and SP): stage 1 = Slip-On Carbon (2023 listing, +1.1 kW at 3750 rpm); stage 2 = Racing Line Ti (2023 listing, also listed for 2026) +11.9 kW at 8100 rpm. That is a MIDRANGE gain filling the stock bike's mid-rpm dip, not a peak-power gain; Akrapovic's own peak with the system is 152.8 kW at 14300 rpm (their dyno, not comparable with Honda's 160 kW claim). Treat 2:171.9k with caution; the caller may prefer to drop stage 2 here.
 *  - Honda CBR600RR PC40 2007-2012: stage 1 = Slip-On Ti (2011 listing) +2.2 HP(m) at 14000 rpm. PC40 2013-2016: stage 1 = Slip-On Ti (2018 listing; last-year listing, fits the 2013-on bike) +3 HP(m) at 13900 rpm; stage 2 = Evolution Line Ti (2018) +6.4 HP(m) at 14000 rpm. 2024-: Slip-On Ti 2026 +1.4 HP(m) at 7600 rpm (no mapping needed); Evolution Line Ti 2026 +7.1 HP(m) at 14000 rpm (ECU remap mandatory).
 *  - Honda CB650R / CBR650R 2019-2023: stage 2 = Racing Line Ti (2020 listing, needs Akrapovic cat) +1.8 HP(m) at 6500 rpm. The later Racing Line Ti (2023 listing, presumably the 2021-2023 Euro 5 bikes, not road-legal) claims +4.6 HP(m) at 11100 rpm; the lower 2019-2020 figure was used because the line spans both.
 *  - Kawasaki ZX-10R 2011-2015: stage 1 = Slip-On Ti (2015 listing, part shown without link pipe) +1.7 HP(m) at 9400 rpm; stage 2 = Evolution Line Ti (2015) +8.9 HP(m) at 9130 rpm (not road-legal). A second 2015 Ti slip-on listing claims +8.4 HP(m), apparently with the optional link pipe, so not used for stage 1.
 *  - Kawasaki ZX-10R 2016-2020: stage 1 = Slip-On Ti (2020 listing) +1.2 HP(m) at 9800 rpm (ECU remap required); stage 2 = Racing Line Carbon (2020) +16.5 HP(m) at 6700 rpm - a MIDRANGE gain; Akrapovic's own peak with the system is 195.1 HP(m) at 13200 rpm on their dyno. Treat 2:216.5p with caution.
 *  - Kawasaki ZX-10R 2021-: products are listed under ZX-10R 2025 (a separate 2026 list exists for the Euro 5+ update). Stage 1 = Slip-On Ti +0.6 HP(m) at 10250 rpm; stage 2 = Evolution Line Carbon +11.1 HP(m) at 8550 rpm (midrange; ECU remap required). Fit to 2021-2024 bikes assumed from the 2025 listing.
 *  - Suzuki GSX-R1000 K9-L6: stage 1 = Slip-On Ti (GSX-R1000 2011 listing) +2.8 HP(m) at 12150 rpm; listing year 2011 = last year Akrapovic lists, assumed to cover the K9-L6 bike (same engine to 2016). L7-: Akrapovic lists L7-on parts under "GSX-R1000R 2025"; stage 1 = Slip-On Ti +2.4 HP(m) at 13100 rpm (mapping needed); stage 2 = Racing Line Ti +10.6 HP(m) at 9000 rpm (midrange; Rapid Bike map required; not road-legal). Same parts for GSX-R1000 and GSX-R1000R.
 *  - Suzuki GSX-R750: K8-L0 stage 1 = Slip-On Carbon (2010 listing) +4.6 HP(m) at 13200 rpm; L1- stage 1 = Slip-On Ti "GSX-R 750 11-" +5.6 HP(m) at 13200 rpm (not road-legal; carbon version +5.2).
 *  - Suzuki GSX-R600: K8-L0 stage 1 = Slip-On Carbon (2010) +3.1 HP(m) at 9280 rpm; L1- stage 1 = Slip-On Ti "GSX-R 600 11-" +2.8 HP(m) at 14000 rpm. No full-system gain figures are published for these (Evolution/Racing Line pages show no data table).
 *  - Suzuki Hayabusa Gen2 (both lines): Slip-On Ti (listed under Hayabusa 2017) +4.2 HP(m) at 10190 rpm. Gen2 Racing Line pages (2017) show no data table, so no stage 2. Gen3: Slip-On Ti (2024 listing) +1.6 HP(m) at 8700 rpm; Racing Line Ti (2024) +8.8 HP(m) at 9900 rpm (not road-legal).
 *  - Kawasaki ZX-6R 636 2019-2023: stage 1 = Slip-On Carbon (2020 listing) +1.9 HP(m) at 9000 rpm; stage 2 = Racing Line Carbon (2020 listing) +7.7 HP(m) at 13200 rpm (not road-legal). 2024-: Akrapovic's 2024 slip-on and 2026 Racing Line pages repeat exactly the same dyno data as the 2020 parts (+1.9 / +7.7 HP(m)), added to the lower 124 PS Euro 5 claim; treat with caution. 2013-2018 not given stages (its 2018 Evolution Line page has no data table).
 *  - Kawasaki Z900 2017-2019: added stage 1 = Slip-On Ti (2019 listing, road version) +3.1 HP(m) at 9750 rpm, no mapping needed. Existing 2:134p kept; Akrapovic's Optional Header (SS) page (2019) confirms +9 HP(m) at 10100 rpm with the slip-on. Z900 2020-: Slip-On Carbon (2024 listing) +1.2 HP(m) at 9650 rpm; fit to 2020-2023 assumed from the 2024 last-year listing. A separate 2019 Slip-On Carbon page (+0.9 HP(m), 64.8 kW peak) is for the A2 70 kW Z900 and was not used.
 *  - Kawasaki Z650 / Ninja 650: stage 2 = Akrapovic Racing Line Ti, road (EC-approved) version, +2 HP(m) at 8350-8600 rpm on both the 2017-2020/2017-2019 (2019 listing) and 2020/2021- (2023 listing) bikes. A non-road Racing Line Ti claims +4.2 HP(m) (2019, at 5250 rpm, midrange) / +3.4 HP(m) (2023); the road-legal figures were used.
 *  - Suzuki Bandit 1250 (GSF1250 2007-2016): stage 1 = Slip-On Carbon (2015 listing) +6 HP(m) at 8400 rpm; stage 2 = Racing Line Ti +14.8 HP(m) at 8700 rpm (not road-legal). Large figures, but Akrapovic's peak column shows 105.2 HP(m) with the slip-on vs 113.2 HP(m) with the full system on their dyno, consistent with the gains. Bandit 1200: Akrapovic's 2006 slip-on page has no data table, so no stage.
 *  - Suzuki SV650 2003-2009: Slip-On Ti (2006 listing) +3.1 HP(m) at 6100 rpm (midrange; not road-legal). SV650 2016-: Slip-On Carbon (2018 and 2024 listings, identical data) +1.1 HP(m) at 7200 rpm.
 *  - Suzuki GSX-S1000 2015-2020: Slip-On Ti (2016 and 2020 listings, same data) +1.5 kW at 11200 rpm. 2021-: Slip-On Ti (2024 listing) +1.9 kW at 10250 rpm. No full system offered by Akrapovic for these.
 *  - 125s: UK A1 learner bikes are capped at 11 kW, so any figure above 11k is a track/off-licence figure, and the gains are tiny. YZF-R125 2014-2018 and MT-125 2014-2019: Racing Line Ti (listed for R125 2016 and MT-125 2016) +0.2 kW at 9000 rpm. YZF-R125 2019-2022: Racing Line Ti (2020 listing, needs Akrapovic cat) +0.3 kW at 8850 rpm. Not added for R125 2023-, MT-125 2020- or XSR125 (no data table fetched/available).
 *  - Honda MSX125 2013-2016: stage 1 = Slip-On Carbon (2015 listing) +0.4 kW at 6900 rpm; stage 2 = Optional Header Ti with that slip-on +0.7 kW at 6900 rpm. MSX125 2017-2020: Racing Line Ti (2020 listing) +0.5 kW at 6800 rpm. MSX125 2021-: Optional Header (SS) with slip-on (2025 listing, mapping required) +0.8 kW at 8600 rpm.
 *  - Rounding: every NEW value is stock claim + gain exactly (to 0.1); trailing ".0" dropped (e.g. 88k, 70p).
 *  - Review (batch 3): Akrapovic gains of 0.2-0.3 kW on the YZF-R125 / MT-125 round to under 1 bhp, so those stages were not kept; the same for the 2013-2020 MSX125 (Grom) and the MT-10 2022- slip-on (+0.8 PS).
 *  - Batch 3 bike stage figures: Akrapovic (Japanese bikes; stock claim + Akrapovic 'max gain'), SC-Project and Termignoni (European bikes; Termignoni 'Pmax' gain at peak power used). Gains are the exhaust maker's own claims, often at a stated rpm below peak; no UK dyno-shop (Wayside, Racefit, Austin Racing) or ECU-flash-only figures were reached.
 *  - Batch 3 stage figures not found: Speed Triple 1050/1200 RS, Daytona 675, Monster 1200, Panigale V4 R, Streetfighter V2, 390/125/890 Duke R, 1290 Super Duke R Gen1, Tuono 660, Fireblade SC59 2008-11, ZX-6R 2013-18, older GSX-R/ZX-10R gens, newer 125s (R125 2023-, MT-125 2020-, CB125R).
 *  - Batch 3 bikes not added: Daytona 650 (moto-data figures identical to the 600, likely copied); TZR250 1KT/3MA and 1993-95 3XV; R nineT 2017-20 base/Pure (dry-only 220 kg); Thruxton R 2020+; Hypermotard SP/S; Brutale 750 S/910 R; NMAX 155; Forza 300 2013-17; Sinnis; Piaggio Liberty.
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
 *  https://moto-net.com/article/fiche-technique-honda-cbf-125-2009-donnees-constructeur.html
 *  https://www.1000ps.com/en-us/comparison/62983/honda-cbf-125-2009-vs-honda-cbf-125-2012
 *  https://en.wikipedia.org/wiki/Honda_CBF125
 *  https://powersportsbusiness.com/?p=30291
 *  https://www.moto-data.net/honda/cb-125f-2015-2017
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb600S_hornet_02.html
 *  https://www.motorcyclespecs.co.za/model/Honda/honda_cb600S_hornet_00.html
 *  https://en.wikipedia.org/wiki/Honda_Hornet
 *  https://www.moto-data.net/yamaha/tzr-125-1987-1988
 *  https://moto-data.net/yamaha/tzr-125-1989-1990
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_tzr125%20n%2087.htm
 *  https://classicmechanics.com/?p=3226
 *  https://www.moto-data.net/yamaha/tzr-125r-belgarda-1993-1994
 *  https://www.motorcyclespecs.co.za/model/yamaha/yamaha_tzr125r%2093.htm
 *  https://visordown.com/reviews/motorbike/tzr125-1993-1996-review
 *  https://moto-data.net/yamaha/tzr-250-1987
 *  https://www.motorradundreisen.de/motorraddatenbank/yamaha/tzr-250-26132.html
 *  https://en.wikipedia.org/wiki/Yamaha_TZR250
 *  https://www.moto-data.net/yamaha/tzr-250r-1991
 *  https://ja.wikipedia.org/wiki/ヤマハ・TZR
 *  https://www.1000ps.com/en-gb/model/9667/triumph-street-triple-s-a2/2019
 *  https://www.motoplanete.us/triumph/6547/660-STREET-TRIPLE-S--A2-2017/contact.html
 *  https://www.motoplanete.us/triumph/7479/660-Street-Triple-S--A2-2019/contact.html
 *  https://triumph-mediakits.com/en/news-articles/new-2020-street-triple-s.html
 *  https://moto-data.net/triumph/street-triple-s-a2-2020
 *  https://moto-data.net/triumph/thruxton-1200r-2016
 *  https://www.1000ps.com/en-gb/model/8445/triumph-thruxton-1200r/2016
 *  https://www.motorcycle.com/2016/03/08/manufacturers/triumph/2016-triumph-thruxton-thruxton-r-specs-released/
 *  https://www.moto-data.net/ducati/hypermotard-1100-2007
 *  https://www.moto-data.net/ducati/hypermotard-1100-2008
 *  https://www.moto-data.net/ducati/year:2009
 *  https://www.moto-data.net/ducati/hypermotard-1100-evo-2010
 *  https://www.moto-data.net/ducati/hypermotard-1100-evo-2012
 *  https://en.wikipedia.org/wiki/Ducati_Hypermotard
 *  https://www.moto-data.net/ducati/hypermotard-796-2010
 *  https://www.moto-data.net/ducati/hypermotard-796-2012
 *  https://www.moto-data.net/ducati/hypermotard-820-2013
 *  https://www.moto-data.net/ducati/year:2015
 *  https://www.moto-data.net/ducati/hypermotard-939-2016
 *  https://www.moto-data.net/ducati/hypermotard-939-2018
 *  https://www.moto-data.net/ducati/hypermotard-950-2019
 *  https://www.moto-data.net/ducati
 *  https://www.moto-data.net/ducati/diavel-2015-2016
 *  https://www.moto-data.net/ducati/diavel-1260-2020
 *  https://www.moto-data.net/ducati/year:2023
 *  https://www.moto-data.net/ducati/diavel-1260-s-2020
 *  https://de.wikipedia.org/wiki/BMW_K_1200_S
 *  https://www.moto-data.net/bmw/k-1200s-2005-2006
 *  https://de.wikipedia.org/wiki/BMW_K_1200_R
 *  https://en.wikipedia.org/wiki/BMW_K1200R
 *  https://www.moto-data.net/bmw/k-1200r-2005
 *  https://www.moto-data.net/bmw/r-ninet-2014
 *  https://www.moto-data.net/bmw/r-ninet-2016-2017
 *  https://www.moto-data.net/bmw/r-ninet-scrambler-2017
 *  https://www.moto-data.net/bmw/r-nine-t-scrambler-2016
 *  https://www.moto-data.net/bmw/r-ninet-racer-2017-2018
 *  https://www.moto-data.net/bmw/r-ninet-racer-2019-2020
 *  https://www.moto-data.net/bmw/year:2021
 *  https://www.moto-data.net/bmw/r-ninet-urban-gs-2017-2018
 *  https://www.moto-data.net/bmw/r-ninet-urban-gs-2019-2020
 *  https://www.moto-data.net/bmw/r-ninet-pure-2021
 *  https://www.moto-data.net/bmw/r-ninet-scrambler-2021
 *  https://www.moto-data.net/bmw/r-ninet-urban-gs-2021
 *  https://www.moto-data.net/ktm/990-super-duke-r-2010
 *  https://www.moto-data.net/ktm/990-super-duke-r-2008
 *  https://www.moto-data.net/mv-agusta/brutal-910s-2005-2006
 *  https://www.moto-data.net/mv-agusta/brutal-910s-2007-2008
 *  https://www.moto-data.net/mv-agusta/brutale-989r-2008-2009
 *  https://www.moto-data.net/mv-agusta/brutale-1078rr-2008
 *  https://www.moto-data.net/mv-agusta/brutale-1078rr-2009
 *  https://www.moto-data.net/mv-agusta/brutale-990r-2010
 *  https://www.moto-data.net/mv-agusta/brutale-990r-2011
 *  https://www.moto-data.net/mv-agusta/brutale-1090rr-2010
 *  https://www.moto-data.net/mv-agusta/brutale-1090rr-2011
 *  https://www.moto-data.net/mv-agusta/brutale-1090r-2012
 *  https://www.moto-data.net/mv-agusta/brutal-920-2011
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-1998
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-1999
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-2000
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-r-1999
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-r-2000
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-r-2001
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-r-2002
 *  https://www.moto-data.net/aprilia/rsv-1000-mille-r-2003
 *  https://bikez.com/motorcycles/honda_pcx_2010.php
 *  https://bikez.com/motorcycles/honda_pcx_2011.php
 *  https://bikez.com/motorcycles/honda_pcx_125_2012.php
 *  https://bikez.com/motorcycles/honda_pcx_125_2016.php
 *  https://bikez.com/motorcycles/honda_pcx125_2014.php
 *  https://www.moto-data.net/honda/pcx-125-2018-2020
 *  https://bikez.com/motorcycles/honda_forza_125______2015.php
 *  https://bikez.com/motorcycles/honda_forza_125_______2018.php
 *  https://www.moto-data.net/honda/nss-125-forza-2021
 *  https://www.moto-data.net/honda/nss-125-forza-2025
 *  https://www.honda.co.uk/motorcycles/range/scooter/forza-125/specifications-and-price.html
 *  https://www.moto-data.net/honda/nss-300-forza-2019-2020
 *  https://www.moto-data.net/honda/nss-300-forza-2017-2018
 *  https://www.honda.co.uk/motorcycles/range/scooter/forza-350/specifications-and-price.html
 *  https://www.moto-data.net/honda/forza-350-2025
 *  https://bikez.com/motorcycles/honda_sh125i_2013.php
 *  https://bikez.com/motorcycles/honda_sh125i______2017.php
 *  https://www.moto-data.net/honda/sh-125i-2024
 *  https://bikez.com/motorcycles/honda_sh125i_2022.php
 *  https://www.honda.co.uk/motorcycles/range/scooter/sh125i/specifications-and-price.html
 *  https://bennetts.co.uk/bikesocial/reviews/bikes/honda/hondas-2013-naked-cb500f-tested
 *  https://bikez.com/motorcycles/honda_cb500f_2016.php
 *  https://www.honda.co.uk/motorcycles/range/street/cb500-hornet/specifications-and-price.html
 *  https://www.moto-data.net/honda/crf-1000l-africa-twin-dct-2016
 *  https://www.moto-data.net/honda/crf-1000l-africa-twin-dct-2018
 *  https://de.wikipedia.org/wiki/Honda_CRF_1000_L_Africa_Twin
 *  https://de.wikipedia.org/wiki/Honda_CRF_1100_L_Africa_Twin
 *  https://bikez.com/motorcycles/honda_crf1100l_africa_twin_2023.php
 *  https://www.honda.co.uk/motorcycles/range/adventure/crf1100l-africa-twin/specifications-and-price.html
 *  https://www.moto-data.net/honda/xl750-transalp-2023
 *  https://www.moto-data.net/honda/nc-700x-dct-2012-2013
 *  https://www.moto-data.net/honda/nc-750x-dct-2014-2015
 *  https://www.moto-data.net/honda/nc-750x-dct-2016-2017
 *  https://www.moto-data.net/honda/nc-750x-dct-2021
 *  https://www.moto-data.net/honda/nc-750x-dct-2025
 *  https://www.moto-data.net/honda/crf-300l-2021
 *  https://www.moto-data.net/honda/crf-300l-2025
 *  https://www.moto-data.net/honda/crf-250l-2012-2013
 *  https://www.moto-data.net/honda/crf-250l-2016
 *  https://www.moto-data.net/yamaha/mt-03-2006-2007
 *  https://www.moto-data.net/yamaha/mt-03-2010
 *  https://en.wikipedia.org/wiki/Yamaha_MT-03
 *  https://www.moto-data.net/yamaha/nmax-125-2015-2017
 *  https://www.moto-data.net/yamaha/nmax-125-2018
 *  https://www.moto-data.net/yamaha/xmax-125-2006-2008
 *  https://www.moto-data.net/yamaha/xmax-125-2009-2011
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2016/XMAX125/Factsheets/2016-XMAX125_en.pdf
 *  https://www.moto-data.net/yamaha/xmax-125-2018
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2023/XMAX125/Factsheets/2023-XMAX125_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2021/XMAX125/Factsheets/2021-XMAX125_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2017/XMAX300/Factsheets/2017-XMAX300_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2021/XMAX300/Factsheets/2021-XMAX300_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2014/XMAX400/Factsheets/2014-XMAX400_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2018/XMAX400/Factsheets/2018-XMAX400_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2020/XMAX400/Factsheets/2020-XMAX400_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2019/XTZ700/Factsheets/2019-XTZ700_en.pdf
 *  https://cdn2.yamaha-motor.eu/prod/product-assets/2025/XTZ700/Factsheets/2025-XTZ700_en.pdf
 *  https://www.moto-data.net/yamaha/wr-125r-2009-2010
 *  https://www.moto-data.net/yamaha/wr-125r-2015
 *  https://www.moto-data.net/yamaha/wr-125x-2009-2010
 *  https://www.moto-data.net/kawasaki/klx-125-2010-2013
 *  https://www.moto-data.net/kawasaki/klx-125-2014
 *  https://bennetts.co.uk/bikesocial/reviews/bikes/suzuki/dr-z400-sm-2005-used
 *  https://www.moto-data.net/suzuki/dr-z-400sm-2005-2006
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/suzuki/dr-z4s-sm-2025-review
 *  https://www.moto-data.net/suzuki/dr-z4sm-2025
 *  https://www.moto-data.net/suzuki/dr-z4s-2025
 *  https://www.moto-data.net/suzuki/dl-650-v-strom-2004-2005
 *  https://www.moto-data.net/suzuki/dl-650-v-strom-2007-2008
 *  https://www.moto-data.net/suzuki/dl-650-v-strom-2011
 *  https://www.moto-data.net/suzuki/dl-650-v-strom-abs-2012-2013
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/suzuki/v-strom-dl650-2017-used
 *  https://www.moto-data.net/suzuki/dl-1000-v-strom-2014
 *  https://www.bennetts.co.uk/bikesocial/reviews/bikes/suzuki/suzuki-dl1050-v-strom-2020-review-price-spec
 *  https://www.moto-data.net/suzuki/dl-1050-v-strom-2023
 *  https://www.moto-data.net/ktm/690-smc-2008-2009
 *  https://www.moto-data.net/ktm/690-smc-r-2012-2013
 *  https://www.moto-data.net/ktm/690-smc-r-2014-2015
 *  https://www.moto-data.net/ktm/690-smc-r-2019
 *  https://www.moto-data.net/ktm/690-enduro-r-2009-2010
 *  https://www.moto-data.net/ktm/690-enduro-r-2014
 *  https://www.moto-data.net/ktm/690-enduro-r-2016
 *  https://www.moto-data.net/ktm/690-enduro-r-2019
 *  https://www.moto-data.net/ktm/890-adventure-2021
 *  https://www.moto-data.net/ktm/890-adventure-2023
 *  https://www.moto-data.net/husqvarna/svartpilen-401-2024
 *  https://www.moto-data.net/husqvarna/vitpilen-401-2022
 *  https://www.moto-data.net/husqvarna/701-vitpilen-2018-2019
 *  https://www.moto-data.net/husqvarna/sm-701-supermoto-2015-2016
 *  https://www.moto-data.net/husqvarna/sm-701-supermoto-2017-2018
 *  https://www.moto-data.net/husqvarna/sm-701-supermoto-2019
 *  https://www.moto-data.net/husqvarna/supermoto-701-2021
 *  https://www.moto-data.net/husqvarna/701-enduro-2016-2017
 *  https://www.moto-data.net/husqvarna/701-enduro-2018-2019
 *  https://www.moto-data.net/husqvarna/701-enduro-2021
 *  https://www.moto-data.net/bmw/f-800gs-2008
 *  https://www.moto-data.net/bmw/f-800gs-2013
 *  https://www.moto-data.net/bmw/f-850gs-2018
 *  https://www.moto-data.net/bmw/f-900gs-2024
 *  https://bikez.com/motorcycles/triumph_tiger_sport_660_2022.php
 *  https://www.moto-data.net/triumph/tiger-sport-660-2026
 *  https://bikez.com/motorcycles/vespa_gts_125_super_2013.php
 *  https://bikez.com/motorcycles/vespa_gts_super_125_2021.php
 *  https://www.moto-data.net/vespa/gts-125-i-get-2017
 *  https://www.moto-data.net/vespa/gts-300ie-super-abs-2012-2016
 *  https://www.moto-data.net/vespa/gts-300-hpe-super-2019
 *  https://www.moto-data.net/vespa/gts-300-gts-super-gts-supersport-gts-supertech-2023
 *  https://www.moto-data.net/vespa/gts-310-2025
 *  https://www.moto-data.net/vespa/primavera-125-2015
 *  https://www.moto-data.net/vespa/primavera-125-2018
 *  https://bikez.com/motorcycles/piaggio_medley_125_2018.php
 *  https://bikez.com/motorcycles/sym_symphony_st_125_2019.php
 *  https://bikez.com/motorcycles/sym_jet_14_125_ac_2019.php
 *  https://bikez.com/motorcycles/lexmoto_lxr_125_2021.php
 *  https://www.lexmoto.com/models/SY125-10-E55
 *  https://bikez.com/motorcycles/lexmoto_isca_125_2019.php
 *  https://www.lexmoto.com/models/LJ125T-18D-E55
 *  https://www.lexmoto.com/models/SK125-8A-E55
 *  https://shop.sc-project.com/en/brands/triumph/street-triple-675-2007-2012-r/t02a-12t-pair-of-oval-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/triumph/street-triple-675-2013-2016-r-rx/t13a-21a-conic-stainless-steel-exhaust
 *  https://shop.sc-project.com/en/brands/triumph/street-triple-765-2017-2019-s-r-rs/t18b-93t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/triumph/street-triple-765-2023-2024/t28a-c36cr-3-1-stainless-steel-full-exhaust-system-with-cr-t-carbon-exhaust-with-stoneguard-grid
 *  https://shop.sc-project.com/en/brands/triumph/street-triple-765-2023-2024
 *  https://shop.sc-project.com/en/brands/triumph/trident-660-2021-2023-2024/t26a-cde41t-3-1-stainless-steel-full-exhaust-system-with-s1-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-rr-2010-2014-hp4/b10a-38t-cr-t-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-rr-2015-2016/b20a-t36t-cr-t-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-rr-2017-2018/b25a-t41t-s1-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-rr-2019-2020-euro-4/b33a-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-rr-2020-2022-euro-5/b33b-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-rr-2023-2024/b33c-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-r-2014-2016/b09a-38t-cr-t-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-r-2017-2020/b27a-t41t-s1-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/s-1000-r-2021-2023-2024/b39a-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/m-1000-rr-2020-2023-2024/b33d-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/r-1250-gs-2019-2020-adventure-euro-4/b30a-86t-adventure-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/bmw/r-1250-gs-2020-2023-2024-adventure-euro-5/b30b-86t-adventure-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ktm/1290-super-duke-r-2017-2019/ktm10b-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ktm/1290-super-duke-r-2020-euro-4/ktm16a-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ktm/1290-super-duke-r-2021-2023-euro-5/ktm16b-90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ktm/790-duke-2018-2020/ktm12a-91t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ducati/monster-821-2014-2017/d14a-38t-cr-t-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ducati/monster-821-2018-2020/d25a-t38t-cr-t-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ducati/monster-937-2021-2023-2024-2025/d37a-d38tr-twin-cr-t-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/ducati/panigale-v2-2020-2023-2024/d35a-lt41t-2-1-half-system-with-s1-titanium-exhaust
 *  https://termignoni.it/our-exhaust/d16908040itc/
 *  https://termignoni.it/our-exhaust/d16909430ixx/
 *  https://termignoni.it/our-exhaust/panigale-v4-d18409400ina/
 *  https://termignoni.it/our-exhaust/ducati-panigale-v4-d18409400ita/
 *  https://termignoni.it/our-exhaust/ducati-panigale-v4-d20009400itc/
 *  https://termignoni.it/our-exhaust/ducati-streetfighter-v4-d19909440ina/
 *  https://termignoni.it/our-exhaust/ducati-streetfighter-v4-d20009400itc/
 *  https://shop.sc-project.com/en/brands/mufflers-and-exhaust-systems-for-aprilia-motorcycles-sc-project/rs-660-2020-2023-2024/a23a-ac90t-2-1-stainless-steel-full-exhaust-system-with-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/mufflers-and-exhaust-systems-for-aprilia-motorcycles-sc-project/rsv4-2017-rf-rr/a16b-t90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/mufflers-and-exhaust-systems-for-aprilia-motorcycles-sc-project/rsv4-2018-2020-rf-rr/a18a-t90t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/mufflers-and-exhaust-systems-for-aprilia-motorcycles-sc-project/rsv4-2021-2023-2024-factory/a27a-91t-sc1-r-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/mufflers-and-exhaust-systems-for-aprilia-motorcycles-sc-project/rsv4-2021-2023-2024-factory/a27a-tc90c-4-2-1-titanium-full-exhaust-system-with-sc1-r-carbon-exhaust-250-mm
 *  https://shop.sc-project.com/en/brands/mufflers-and-exhaust-systems-for-aprilia-motorcycles-sc-project/tuono-v4-2015-2016-factory-rr/a07a-01t-oval-titanium-exhaust
 *  https://shop.sc-project.com/en/brands/mufflers-and-exhaust-systems-for-aprilia-motorcycles-sc-project/tuono-v4-2021-2023-2024-factory/a27b-t41t-s1-titanium-exhaust
 *  https://www.akrapovic.com/en/moto/product/15579/Yamaha/R1/2016?brandId=41&modelId=327&yearId=4143
 *  https://www.akrapovic.com/en/moto/product/16820/Yamaha/R1/2019?brandId=41&modelId=327&yearId=5268
 *  https://www.akrapovic.com/en/moto/product/20740/Yamaha/R1/2021?brandId=41&modelId=327&yearId=6226
 *  https://www.akrapovic.com/en/moto/product/20738/Yamaha/R1/2021?brandId=41&modelId=327&yearId=6226
 *  https://www.akrapovic.com/en/moto/products/Yamaha/R1/2021?brandId=41&modelId=327&yearId=6226
 *  https://www.akrapovic.com/en/moto/product/15127/Yamaha/R6/2016?brandId=41&modelId=328&yearId=4147
 *  https://www.akrapovic.com/en/moto/product/13834/Yamaha/R6/2016?brandId=41&modelId=328&yearId=4147
 *  https://www.akrapovic.com/en/moto/product/20174/Yamaha/R6/2026?brandId=41&modelId=328&yearId=8461
 *  https://www.akrapovic.com/en/moto/product/20164/Yamaha/R6/2026?brandId=41&modelId=328&yearId=8461
 *  https://www.akrapovic.com/en/moto/product/14876/Yamaha/MT-07-FZ-07/2016?brandId=41&modelId=341&yearId=4125
 *  https://www.akrapovic.com/en/moto/product/14878/Yamaha/MT-07-FZ-07/2020?brandId=41&modelId=341&yearId=5860
 *  https://www.akrapovic.com/en/moto/product/22908/Yamaha/MT-07-FZ-07/2026?brandId=41&modelId=341&yearId=8453
 *  https://www.akrapovic.com/en/moto/product/14483/Yamaha/MT-09-FZ-09/2016?brandId=41&modelId=339&yearId=4126
 *  https://www.akrapovic.com/en/moto/product/17255/Yamaha/MT-09-FZ-09/2020?brandId=41&modelId=339&yearId=5861
 *  https://www.akrapovic.com/en/moto/product/22107/Yamaha/MT-09-FZ-09/2026?brandId=41&modelId=339&yearId=8454
 *  https://www.akrapovic.com/en/moto/product/16861/Yamaha/MT-10-FZ-10/2021?brandId=41&modelId=788&yearId=6319
 *  https://www.akrapovic.com/en/moto/product/16865/Yamaha/MT-10-FZ-10/2021?brandId=41&modelId=788&yearId=6319
 *  https://www.akrapovic.com/en/moto/product/21505/Yamaha/MT-10-FZ-10/2024?brandId=41&modelId=788&yearId=7466
 *  https://www.akrapovic.com/en/moto/product/21506/Yamaha/MT-10-FZ-10/2024?brandId=41&modelId=788&yearId=7466
 *  https://www.akrapovic.com/en/moto/product/21247/Yamaha/Tracer-9-GT-GT%2B/2024?brandId=41&modelId=1154&yearId=7583
 *  https://www.akrapovic.com/en/moto/products/x/x?brandId=41&modelId=1154&lineId=all
 *  https://www.akrapovic.com/en/moto/product/14909/Honda/CBR1000RR/2016?brandId=30&modelId=115&yearId=4054
 *  https://www.akrapovic.com/en/moto/product/11842/Honda/CBR1000RR/2016?brandId=30&modelId=115&yearId=4054
 *  https://www.akrapovic.com/en/moto/product/20187/Honda/CBR1000RR/2019?brandId=30&modelId=115&yearId=5281
 *  https://www.akrapovic.com/en/moto/product/20190/Honda/CBR1000RR/2019?brandId=30&modelId=115&yearId=5281
 *  https://www.akrapovic.com/en/moto/product/21095/Honda/CBR1000RR-R-Fireblade-SP/2023?brandId=30&modelId=1077&yearId=7026
 *  https://www.akrapovic.com/en/moto/product/21094/Honda/CBR1000RR-R-Fireblade-SP/2023?brandId=30&modelId=1077&yearId=7026
 *  https://www.akrapovic.com/en/moto/product/415/Honda/CBR600RR/2011?brandId=30&modelId=114&yearId=436
 *  https://www.akrapovic.com/en/moto/product/13716/Honda/CBR600RR/2018?brandId=30&modelId=114&yearId=4924
 *  https://www.akrapovic.com/en/moto/product/13718/Honda/CBR600RR/2018?brandId=30&modelId=114&yearId=4924
 *  https://www.akrapovic.com/en/moto/product/22203/Honda/CBR600RR/2026?brandId=30&modelId=114&yearId=8482
 *  https://www.akrapovic.com/en/moto/product/22261/Honda/CBR600RR/2026?brandId=30&modelId=114&yearId=8482
 *  https://www.akrapovic.com/en/moto/product/20810/Honda/CB650R/2020?brandId=30&modelId=1020&yearId=5800
 *  https://www.akrapovic.com/en/moto/product/20782/Honda/CB650R/2023?brandId=30&modelId=1020&yearId=7025
 *  https://www.akrapovic.com/en/moto/product/20810/Honda/CBR650R/2020?brandId=30&modelId=1019&yearId=5803
 *  https://www.akrapovic.com/en/moto/products/x/x?brandId=30&modelId=1019&lineId=all
 *  https://www.akrapovic.com/en/moto/product/630/Kawasaki/Ninja-ZX-10R/2015?brandId=31&modelId=160&yearId=3761
 *  https://www.akrapovic.com/en/moto/product/14829/Kawasaki/Ninja-ZX-10R/2015?brandId=31&modelId=160&yearId=3761
 *  https://www.akrapovic.com/en/moto/product/16482/Kawasaki/Ninja-ZX-10R/2020?brandId=31&modelId=160&yearId=5824
 *  https://www.akrapovic.com/en/moto/product/16405/Kawasaki/Ninja-ZX-10R/2020?brandId=31&modelId=160&yearId=5824
 *  https://www.akrapovic.com/en/moto/product/21273/Kawasaki/Ninja-ZX-10R/2025?brandId=31&modelId=160&yearId=7894
 *  https://www.akrapovic.com/en/moto/product/21275/Kawasaki/Ninja-ZX-10R/2025?brandId=31&modelId=160&yearId=7894
 *  https://www.akrapovic.com/en/moto/product/744/Suzuki/GSX-R1000R/2011?brandId=37&modelId=251&yearId=1308
 *  https://www.akrapovic.com/en/moto/product/20221/Suzuki/GSX-R1000R/2025?brandId=37&modelId=251&yearId=7827
 *  https://www.akrapovic.com/en/moto/product/20220/Suzuki/GSX-R1000R/2025?brandId=37&modelId=251&yearId=7827
 *  https://www.akrapovic.com/en/moto/product/966/Suzuki/GSX-R750/2010?brandId=37&modelId=248&yearId=1274
 *  https://www.akrapovic.com/en/moto/product/748/Suzuki/GSX-R750/2017?brandId=37&modelId=248&yearId=4674
 *  https://www.akrapovic.com/en/moto/product/967/Suzuki/GSX-R600/2010?brandId=37&modelId=247&yearId=1255
 *  https://www.akrapovic.com/en/moto/product/747/Suzuki/GSX-R600/2017?brandId=37&modelId=247&yearId=4680
 *  https://www.akrapovic.com/en/moto/product/862/Suzuki/GSX-1300R-Hayabusa/2017?brandId=37&modelId=252&yearId=4682
 *  https://www.akrapovic.com/en/moto/product/21240/Suzuki/GSX-1300R-Hayabusa/2024?brandId=37&modelId=252&yearId=7457
 *  https://www.akrapovic.com/en/moto/product/21241/Suzuki/GSX-1300R-Hayabusa/2024?brandId=37&modelId=252&yearId=7457
 *  https://www.akrapovic.com/en/moto/product/20532/Kawasaki/Ninja-ZX-6R/2020?brandId=31&modelId=166&yearId=5827
 *  https://www.akrapovic.com/en/moto/product/20535/Kawasaki/Ninja-ZX-6R/2020?brandId=31&modelId=166&yearId=5827
 *  https://www.akrapovic.com/en/moto/product/22144/Kawasaki/Ninja-ZX-6R/2024?brandId=31&modelId=166&yearId=7326
 *  https://www.akrapovic.com/en/moto/product/22035/Kawasaki/Ninja-ZX-6R/2026?brandId=31&modelId=166&yearId=8412
 *  https://www.akrapovic.com/en/moto/product/17290/Kawasaki/Z900/2019?brandId=31&modelId=850&yearId=5223
 *  https://www.akrapovic.com/en/moto/product/17293/Kawasaki/Z900/2019?brandId=31&modelId=850&yearId=5223
 *  https://www.akrapovic.com/en/moto/product/20880/Kawasaki/Z900/2024?brandId=31&modelId=850&yearId=7452
 *  https://www.akrapovic.com/en/moto/product/20029/Kawasaki/Z650/2019?brandId=31&modelId=838&yearId=5218
 *  https://www.akrapovic.com/en/moto/product/21321/Kawasaki/Z650/2023?brandId=31&modelId=838&yearId=7047
 *  https://www.akrapovic.com/en/moto/product/17279/Kawasaki/Ninja-650/2019?brandId=31&modelId=836&yearId=5298
 *  https://www.akrapovic.com/en/moto/product/21285/Kawasaki/Ninja-650/2023?brandId=31&modelId=836&yearId=7039
 *  https://www.akrapovic.com/en/moto/product/849/Suzuki/GSF-1250-BANDIT/2015?brandId=37&modelId=268&yearId=3708
 *  https://www.akrapovic.com/en/moto/product/846/Suzuki/GSF-1250-BANDIT/2015?brandId=37&modelId=268&yearId=3708
 *  https://www.akrapovic.com/en/moto/product/1024/Suzuki/SV-650/2006?brandId=37&modelId=256&yearId=1356
 *  https://www.akrapovic.com/en/moto/product/20123/Suzuki/SV-650/2018?brandId=37&modelId=256&yearId=4891
 *  https://www.akrapovic.com/en/moto/product/20388/Suzuki/SV-650/2024?brandId=37&modelId=256&yearId=7468
 *  https://www.akrapovic.com/en/moto/product/20180/Suzuki/GSX-S1000-1000GT-950/2020?brandId=37&modelId=763&yearId=5838
 *  https://www.akrapovic.com/en/moto/product/16281/Suzuki/GSX-S1000-1000GT-950/2016?brandId=37&modelId=763&yearId=4107
 *  https://www.akrapovic.com/en/moto/product/21355/Suzuki/GSX-S1000-1000GT-950/2024?brandId=37&modelId=763&yearId=7461
 *  https://www.akrapovic.com/en/moto/product/14945/Yamaha/R125/2016?brandId=41&modelId=325&yearId=4144
 *  https://www.akrapovic.com/en/moto/product/20640/Yamaha/R125/2020?brandId=41&modelId=325&yearId=5879
 *  https://www.akrapovic.com/en/moto/product/14945/Yamaha/MT-125/2016?brandId=41&modelId=686&yearId=4128
 *  https://www.akrapovic.com/en/moto/product/15125/Honda/MSX125-Grom/2015?brandId=30&modelId=673&yearId=3667
 *  https://www.akrapovic.com/en/moto/product/15099/Honda/MSX125-Grom/2015?brandId=30&modelId=673&yearId=3667
 *  https://www.akrapovic.com/en/moto/product/20646/Honda/MSX125-Grom/2020?brandId=30&modelId=673&yearId=5810
 *  https://www.akrapovic.com/en/moto/product/21479/Honda/MSX125-Grom/2025?brandId=30&modelId=673&yearId=7809
 */
export const BIKE_DATA = `
@Yamaha
=YZF-R1
4XV/5JJ|998cc inline-4|1998-2001|150p|177d|108n|n
5PW|998cc inline-4|2002-2003|152p|174d|105n|n
5VY|998cc inline-4|2004-2006|172p|172d|107n|n
4C8|998cc inline-4|2007-2008|180p|177d|113n|n
14B crossplane|998cc crossplane inline-4|2009-2014|182p|206|116n|n
2015-2019|998cc crossplane inline-4|2015-2019|200p|199|112n|n|1:201p,2:203.6p
2020-|998cc crossplane inline-4|2020-|200p|201|113n|n|1:201.5p,2:209.8p
=YZF-R1M
2015-2019|998cc crossplane inline-4|2015-2019|200p|200|112n|n|1:201p,2:203.6p
2020-|998cc crossplane inline-4|2020-|200p|202|113n|n|1:201.5p,2:209.8p
=YZF-R6
1999-2002|599cc inline-4|1999-2002|120p|169d|68n|n
2003-2005|599cc inline-4|2003-2005|124p|162d|68n|n
2006-2007|599cc inline-4|2006-2007|127p|161d|66n|n
2008-2009|599cc inline-4|2008-2009|94.9k|188|66n|n
2010-2016|599cc inline-4|2010-2016|91k|189|66n|n|1:91.9k,2:95.7k
2017-2020|599cc inline-4|2017-2020|87.1k|190|61.7n|n|1:88k,2:94.9k
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
2014-2017|689cc CP2|2014-2017|55k|179|68n|n|2:57k
2018-2020|689cc CP2|2018-2020|55k|182|68n|n|2:56.9k
2021-2024|689cc CP2|2021-2024|54k|184|67n|n|2:55k
2025-|689cc CP2|2025-|54k|183|67n|n|2:55.9k
=MT-09
2014-2016|847cc CP3|2014-2016|115p|188|87.5n|n|2:120.4p
2017-2020|847cc CP3|2017-2020|115p|193|87.5n|n|2:121.7p
2021-2023|890cc CP3|2021-2023|87.5k|189|93n|n|2:89k
2024-|890cc CP3|2024-|87.5k|193|93n|n|2:89k
=MT-10
2016-2021|998cc CP4|2016-2021|160p|210|111n|n|1:161p,2:164.7p
2022-|998cc CP4|2022-|166p|212|112n|n|2:169.2p
=Tracer 9
|890cc CP3|2021-|87.5k|213|93n|n|2:89k
GT|890cc CP3|2021-|87.5k|220|93n|n|2:89k
=XSR700
|689cc CP2|2016-2020|55k|186|68n|n
=XSR900
2016-2021|847cc CP3|2016-2021|115p|195|87.5n|n
2022-|890cc CP3|2022-|87.5k|193|93n|n
=XSR125
|125cc VVA single|2021-|11k|140|11.5n|n
=NMAX 125
|125cc single|2021-|9k|131|11.2n|n
2015-2020|125cc single|2015-2020|9k|127|11.7n|n
=MT-03
|321cc parallel twin|2016-|30.9k|167|29.6n|n
660|659cc single|2006-2014|33.8k|174.5d|58.4n|n
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
=TZR125
2RK/3PC|124cc 2-stroke single|1987-1992|19.3k|104d|1.8k|n
R|124cc 2-stroke single|1993-1996|30b|121d|1.8k|n
=TZR250
2MA|249cc 2-stroke parallel twin|1987-1988|36.4k|140|35.5n|n
3XV (JDM grey)|249cc 2-stroke V-twin|1991-1992|33.6k|126d|40n|n
=XMAX 125
2006-2013|125cc single|2006-2013|10.1k|153d|11.33n|n
2014-2017|125cc single|2014-2017|10.55k|169|11.94n|n
2018-2020|125cc single|2018-2020|10.5k|175|12n|n
2021-|125cc single|2021-|9k|167|11.2n|n
=XMAX 300
2017-2020|292cc single|2017-2020|20.6k|179|29n|n
2021-|292cc single|2021-|20.6k|180|29n|n
=XMAX 400
2014-2017|395cc single|2014-2017|23.18k|211|33.88n|n
2018-2020|395cc single|2018-2020|24.5k|210|36n|n
=Tenere 700
2019-2024|689cc parallel twin|2019-2024|54k|204|68n|n
2025-|689cc parallel twin|2025-|54k|208|68n|n
=WR125R
|125cc single|2009-2015|10.9k|133|12.2n|n
=WR125X
|125cc single|2009-2015|10.9k|137|12.2n|n
@Honda
=Fireblade
CBR900RR|893cc inline-4|1992-1995|124p|185d|88n|n
CBR900RR 919|918cc inline-4|1996-1997|128p|183d|91n|n
CBR929RR|929cc inline-4|2000-2001|152p|170d|103n|n
CBR954RR|954cc inline-4|2002-2003|150p|168d|105n|n
CBR1000RR SC57|998cc inline-4|2004-2005|126k|179d|115n|n
CBR1000RR SC57|998cc inline-4|2006-2007|126k|176d|115n|n
CBR1000RR SC59|999cc inline-4|2008-2011|131k|199|112n|n
CBR1000RR SC59|999cc inline-4|2012-2016|131k|200|112n|n|1:134.2k,2:137.4k
CBR1000RR SP SC59|999cc inline-4|2014-2016|133k|199|114n|n
CBR1000RR SC77|999cc inline-4|2017-2019|141k|196|114n|n|1:142.1k,2:145.9k
CBR1000RR SP SC77|999cc inline-4|2017-2019|141k|195|114n|n|1:142.1k,2:145.9k
CBR1000RR-R SC82|1000cc inline-4|2020-|160k|201|113n|n|1:161.1k
CBR1000RR-R SP SC82|1000cc inline-4|2020-|160k|201|113n|n|1:161.1k
CBR900RR 1998-1999|918cc inline-4|1998-1999|94.1k|180d|93n|n
=CBR600RR
PC37|599cc inline-4|2003-2004|117p|169d|66n|n
PC37|599cc inline-4|2005-2006|117p|163d|66n|n
PC40|599cc inline-4|2007-2012|120p|155d|66n|n|1:122.2p
PC40|599cc inline-4|2013-2016|120p|186|66n|n|1:123p,2:126.4p
2024-|599cc inline-4|2024-|121p|193|63n|n|1:122.4p,2:128.1p
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
|649cc inline-4|2019-2023|95p|208|64n|n|2:96.8p
=CB650R
|649cc inline-4|2019-2023|95p|202|64n|n|2:96.8p
=CB1000R
SC60|998cc inline-4|2008-2017|125p|217|99n|n
SC80|998cc inline-4|2018-|107k|212|104n|n
=CBR500R
|471cc parallel twin|2013-2018|35k|194|43n|n
|471cc parallel twin|2019-|35k|192|43n|n
=CB500F
|471cc parallel twin|2019-|35k|189|43n|n
2013-2018|471cc parallel twin|2013-2018|47b|192|32l|n
=CB125R
|125cc single|2018-2020|9.8k|126|10n|n
|125cc single|2021-|11k|130|11.6n|n
=Grom
MSX125|125cc single|2021-|7.4k|103|11n|n|2:8.2k
MSX125 2013-2016|125cc single|2013-2016|7.1k|101.7|10.9n|n
MSX125 2017-2020|125cc single|2017-2020|7.1k|103.8|10.9n|n
=CB125F
|125cc single|2021-|8.7k|117|11.2n|n
2015-2020|125cc single|2015-2020|7.8k|128|10.2n|n
=PCX125
|125cc single|2021-|9.2k|130|11.8n|n
2010-2011|125cc single|2010-2011|7.3k|127|11n|n
eSP 2012-2013|125cc single|2012-2013|8.2k|124.4|11.6n|n
2014-2017|125cc single|2014-2017|8.2k|130|11.6n|n
2018-2020|125cc single|2018-2020|9k|130|11.8n|n
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
CB600FS Hornet S|599cc inline-4|2000-2003|71.1k|201|65.6n|n
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
=CBF125
|125cc single|2009-2015|8.3k|128|11.2n|n
=Forza 125
2015-2017|125cc single|2015-2017|10.3k|162|12n|n
2018-2020|125cc single|2018-2020|10.8k|159|12.5n|n
2021-2024|125cc single|2021-2024|11k|161|12.2n|n
2025-|125cc single|2025-|10.7k|164|12.3n|n
=Forza 300
2018-2020|279cc single|2018-2020|18.4k|182|27.2n|n
=Forza 350
|330cc single|2021-|21.5k|186|31.5n|n
=SH125i
2013-2016|125cc single|2013-2016|9.5k|134|11.5n|n
2017-2019|125cc single|2017-2019|8.5k|134|11n|n
2020-|125cc single|2020-|9.6k|133.9|12n|n
=CB500 Hornet
|471cc parallel twin|2024-|35k|191|43n|n
=Africa Twin
CRF1000L|998cc parallel twin|2016-2019|70k|232|98n|n
CRF1100L|1084cc parallel twin|2020-2023|75k|226|105n|n
CRF1100L 2024|1084cc parallel twin|2024-|75k|231|112n|n
=XL750 Transalp
|755cc parallel twin|2023-|67.5k|208|75n|n
=NC750X
NC700X|670cc parallel twin|2012-2013|38.1k|218|62n|n
2014-2015|745cc parallel twin|2014-2015|40.3k|218|68n|n
2016-2020|745cc parallel twin|2016-2020|40.3k|220|68n|n
2021-2024|745cc parallel twin|2021-2024|43.1k|214|69n|n
2025-|745cc parallel twin|2025-|43.1k|216|69n|n
=CRF300L
|286cc single|2021-|20.1k|142|26.6n|n
=CRF250L
|249cc single|2012-2020|17k|147|22n|n
@Kawasaki
=ZX-10R
|998cc inline-4|2004-2005|175p|170d|115n|n
|998cc inline-4|2006-2007|175p|175d|115n|n
|998cc inline-4|2008-2010|188p|179d|113n|n
|998cc inline-4|2011-2015|200p|198|112n|n|1:201.7p,2:208.9p
|998cc inline-4|2016-2020|200p|206|113.5n|n|1:201.2p
|998cc inline-4|2021-|203p|207|114.9n|n|1:203.6p
=ZX-6R
636|636cc inline-4|2013-2018|131p|192|71n|n
636|636cc inline-4|2019-2023|130p|196|71n|n|1:131.9p,2:137.7p
636|636cc inline-4|2024-|124p|198|69n|n|1:125.9p,2:131.7p
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
|649cc parallel twin|2017-2019|68p|193|65.7n|n|2:70p
|649cc parallel twin|2020-|68p|193|64n|n|2:70p
=Z650
|649cc parallel twin|2017-2020|68p|187|65.7n|n|2:70p
|649cc parallel twin|2021-|68p|187|64n|n|2:70p
=Z900
|948cc inline-4|2017-2019|125p|210|98.6n|n|1:128.1p,2:134p
|948cc inline-4|2020-|125p|212|98.6n|n|1:126.2p
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
=KLX125
|125cc single|2010-2014|7.6k|112d|10n|n
@Suzuki
=GSX-R1000
K1-K2|988cc inline-4|2001-2002|160p|170d|110n|n
K3-K4|988cc inline-4|2003-2004|164p|168d|111n|n
K5-K6|999cc inline-4|2005-2006|178p|166d|118n|n
K7-K8|999cc inline-4|2007-2008|185p|172d|117n|n
K9-L6|999cc inline-4|2009-2016|185p|203|117n|n|1:187.8p
L7-|999cc inline-4|2017-|197p|203|117n|n|1:199.4p,2:207.6p
=GSX-R750
K6-K7|749cc inline-4|2006-2007|150p|163d|86n|n
K8-L0|749cc inline-4|2008-2010|150p|167d|86n|n|1:154.6p
L1-|749cc inline-4|2011-|150p|190|86n|n|1:155.6p
SRAD carb|749cc inline-4|1996-1997|93.3k|179d|80.5n|n
SRAD EFI|749cc inline-4|1998-1999|95.4k|178d|82.3n|n
Y-K3|749cc inline-4|2000-2003|141p|166d|84.3n|n
K4-K5|749cc inline-4|2004-2005|148p|163d|86.3n|n
=GSX-R600
K6-K7|599cc inline-4|2006-2007|125p|161d|67.7n|n
K8-L0|599cc inline-4|2008-2010|125p|165d|68.6n|n|1:128.1p
L1-|599cc inline-4|2011-|125.8p|187|69.6n|n|1:128.6p
SRAD|599cc inline-4|1997-2000|106p|174d|65.7n|n
K1-K3|599cc inline-4|2001-2003|115p|163d|67.6n|n
K4-K5|599cc inline-4|2004-2005|92.5k|193|69.6n|n
=GSX-R125
|125cc single|2017-|11k|134|11.5n|n
=Hayabusa
Gen1|1299cc inline-4|1999-2007|175p|215d|138n|n
Gen2|1340cc inline-4|2008-2012|197p|220d|155n|n|1:201.2p
Gen2 ABS|1340cc inline-4|2013-2020|197p|266|155n|n|1:201.2p
Gen3|1340cc inline-4|2021-|188p|264|149n|n|1:189.6p,2:196.8p
=SV650
1999-2002|645cc V-twin carb|1999-2002|70p|165d|62n|n
2003-2009|645cc V-twin EFI|2003-2009|72p|165d|64n|n|1:75.1p
2016-|645cc V-twin|2016-|76p|196|64n|n|1:77.1p
=GSX-S1000
|999cc inline-4|2015-2020|107k|209|106n|n|1:108.5k
|999cc inline-4|2021-|112k|214|106n|n|1:113.9k
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
GSF1250|1255cc liquid-cooled inline-4|2007-2016|100p|247|107n|n|1:106p
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
=DR-Z400SM
|398cc single|2005-2008|29.2k|146|39n|n
=DR-Z4SM
|398cc single|2025-|28k|154|37n|n
=DR-Z4S
|398cc single|2025-|28k|151|37n|n
=V-Strom 650
2004-2011|645cc V-twin|2004-2011|49k|220|63.1n|n
2012-2016|645cc V-twin|2012-2016|49k|214|60n|n
2017-|645cc V-twin|2017-|71b|213|46l|n
=V-Strom 1000
2014-2019|1037cc V-twin|2014-2019|73.9k|228|103n|n
=V-Strom 1050
XT 2020-2022|1037cc V-twin|2020-2022|106b|247|73.8l|n
2023-|1037cc V-twin|2023-|79k|242|100n|n
@Ducati
=Panigale V2
|955cc Superquadro V-twin|2020-2024|155p|200|104n|n|1:160.7p
=959 Panigale
|955cc Superquadro V-twin|2016-2019|157p|200|107n|n|1:163.3p
=899 Panigale
|898cc Superquadro V-twin|2014-2015|148p|193|99n|n
=1199 Panigale
|1198cc Superquadro V-twin|2012-2014|195p|188|132n|n
=1299 Panigale
|1285cc Superquadro V-twin|2015-2017|205p|191|145n|n
=Panigale V4
|1103cc Desmosedici Stradale V4|2018-2021|214p|198|124n|n|1:224.5p,2:230.3p
S|1103cc Desmosedici Stradale V4|2018-2021|214p|195|124n|n|1:224.5p,2:230.3p
=Panigale V4 R
|998cc Desmosedici Stradale R V4|2019-2022|221p|193|112n|n
=Monster 821
|821cc Testastretta V-twin|2014-2017|112p|206|89n|n|1:114.6p
|821cc Testastretta V-twin|2018-2020|109p|206|86n|n|1:112.2p
=Monster
937|937cc Testastretta V-twin|2021-|111p|188|93n|n|1:114.1p
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
|1103cc Desmosedici Stradale V4|2020-2024|208p|199|123n|n|1:219.3p,2:224.3p
S|1103cc Desmosedici Stradale V4|2020-2024|208p|198|123n|n|1:219.3p,2:224.3p
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
Gen 1.5|1198cc Testastretta 11 V-twin|2015-2018|119k|239|127.5n|n
1260|Testastretta DVT V-twin|2019-2022|117k|244|128.9n|n
1260 S|Testastretta DVT V-twin|2019-2022|117k|244|128.9n|n
=Hypermotard
1100|1078cc air-cooled V-twin|2007-2009|69.3k|179d|102.9n|n
1100 Evo|1078cc air-cooled V-twin|2010-2012|69.9k|172d|102.9n|n
796|803cc air-cooled V-twin|2010-2012|59.6k|167d|75.4n|n
821|821cc Testastretta V-twin|2013-2015|80.9k|198|89.2n|n
939|937cc Testastretta V-twin|2016-2018|82k|204|97.9n|n
950|937cc Testastretta V-twin|2019-2025|84k|200|96n|n
@Triumph
=Street Triple
675|675cc triple|2007-2012|107p|167d|69n|n|1:110.5p
675 R|675cc triple|2013-2016|106p|183|68n|n|1:110.8p
765 S|765cc triple|2017-2019|113p|166d|73n|n|1:119.4p
765 R|765cc triple|2017-2019|118p|166d|77n|n|1:124.4p
765 RS|765cc triple|2017-2019|123p|166d|77n|n|1:129.4p
765 RS|765cc triple|2020-2022|123p|166d|79n|n
765 R|765cc triple|2023-|120p|189|80n|n|2:127.8p
765 RS|765cc triple|2023-|130p|188|80n|n|2:137.8p
675 R 2009-2012|675cc triple|2009-2012|79k|189|69n|n|1:81.6k
675 2013-2016|675cc triple|2013-2016|78k|182|68n|n|1:81.5k
S 660 A2|660cc triple|2017-2019|35k|168d|60n|n
S 660 A2 2020-2022|660cc triple|2020-2022|35k|168d|60n|n
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
|660cc triple|2021-|81p|189|64n|n|2:83.6p
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
|1200cc parallel twin|2016-2019|97b|206d|112n|n
RS|1200cc parallel twin|2020-2023|77k|197d|111.9n|n
R|1200cc parallel twin|2016-2019|71.5k|203d|111.9n|n
=Tiger Sport 660
|660cc triple|2022-2025|59.1k|206.4|64n|n
2026|660cc triple|2026-|70k|211|68n|n
@BMW
=S1000RR
K46|999cc inline-4|2009-2011|142k|204|112n|n|1:144.3k
K46|999cc inline-4|2012-2014|142k|204|112n|n|1:144.3k
K46|999cc inline-4|2015-2018|146k|204|113n|n|1:148.5k
K67|999cc ShiftCam inline-4|2019-2022|152k|197|113n|n|1:153k
K67|999cc ShiftCam inline-4|2023-|154k|197|113n|n|1:155k
=S1000R
|999cc inline-4|2014-2016|118k|207|112n|n|1:120k
|999cc inline-4|2017-2020|121k|205|114n|n|1:123.8k
|999cc inline-4|2021-|121k|199|114n|n|1:121.7k
=M1000RR
|999cc ShiftCam inline-4|2021-|156k|192|113n|n|1:157k
=R1250GS
|1254cc ShiftCam boxer twin|2019-2023|100k|249|143n|n|1:102.1k
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
2014-2016|1170cc boxer twin|2014-2016|81k|222|119n|n
Scrambler|1170cc boxer twin|2016-2020|81k|220|116n|n
Racer|1170cc boxer twin|2017-2020|81k|219|116n|n
Urban G/S|1170cc boxer twin|2017-2020|81k|221|116n|n
Pure 2021-2023|1170cc boxer twin|2021-2023|80k|219|116n|n
Scrambler 2021-2023|1170cc boxer twin|2021-2023|80k|223|116n|n
Urban G/S 2021-2023|1170cc boxer twin|2021-2023|80k|223|116n|n
=R1250R
|1254cc ShiftCam boxer twin|2019-2023|100k|239|143n|n
=R1250RS
|1254cc ShiftCam boxer twin|2019-2023|100k|243|143n|n
=K1200S
|1157cc inline-4|2005-2008|123k|248|130n|n
=K1200R
|1157cc inline-4|2005-2008|120k|237|127n|n
=F800GS
2008-2017|798cc parallel twin|2008-2017|62.5k|207|80n|n
=F850GS
|853cc parallel twin|2018-2023|70.8k|229|92n|n
=F900GS
|895cc parallel twin|2024-|77k|219|93n|n
@KTM
=390 Duke
|373cc single|2013-2016|32k|139d|35n|n
|373cc single|2017-2023|32k|149d|37n|n
|399cc single|2024-|45p|165|39n|n
=790 Duke
|799cc LC8c parallel twin|2018-2020|77k|169d|87n|n|1:77.8k
=890 Duke R
|889cc LC8c parallel twin|2020-|89k|166d|99n|n
=1290 Super Duke R
Gen1|1301cc LC8 V-twin|2014-2016|132k|189d|144n|n
Gen2|1301cc LC8 V-twin|2017-2019|130k|195d|141n|n|1:132.8k
Gen3|1301cc LC8 V-twin|2020-2023|132k|189d|140n|n|1:137.1k
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
R 2008-2011|999cc LC8 V-twin|2008-2011|96.9k|186d|101.7n|n
=690 Duke
|654cc LC4 single|2008-2011|46k|148.5d|65n|n
2012-2015|690cc LC4 single|2012-2015|52.2k|149.5d|69.8n|n
2016-2018|690cc LC4 single|2016-2018|54.4k|148.5d|74n|n
=1290 Super Duke GT
|1301cc LC8 V-twin|2016-2023|129k|228|144n|n
=690 SMC R
690 SMC|654cc single|2008-2011|46k|139.5d|65n|n
2012-2018|690cc single|2012-2018|49k|139d|68n|n
2019-|693cc single|2019-|54k|147d|73.5n|n
=690 Enduro R
2009-2015|690cc single|2009-2015|46k|150|65n|n
2016-2018|690cc single|2016-2018|49k|140d|68n|n
2019-|693cc single|2019-|54k|146d|73.5n|n
=890 Adventure
|889cc parallel twin|2021-|78.3k|210|100n|n
@Aprilia
=RSV4
Factory|999cc V4|2009-2010|180p|179d|115n|n
RR|999cc V4|2015-2020|201p|180d|115n|n|1:205.2p
1100 Factory|1078cc V4|2019-2020|217p|199|122n|n
1100|1099cc V4|2021-|217p|202|125n|n|1:218.8p,2:223.5p
=Tuono V4
1100 RR|1077cc V4|2015-2020|175p|184d|121n|n|1:179.9p
1100|1077cc V4|2021-|175p|209|121n|n|1:180.8p
=Tuono 660
|659cc parallel twin|2021-|95p|183|67n|n
=RS 660
|659cc parallel twin|2020-|100p|183|67n|n|2:103.6p
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
1998-2000|998cc V-twin|1998-2000|93.3k|220|103n|n
R 1999-2000|998cc V-twin|1999-2000|97.2k|183d|106n|n
R|998cc V-twin|2001-2003|101.3k|189d|107n|n
=RSV1000R
2004-2005|998cc V-twin|2004-2005|102k|189d|107n|n
2006-2010|998cc V-twin|2006-2010|105.2k|189d|107n|n
=Tuono 1000
|998cc V-twin|2003-2005|94k|181d|101n|n
R|998cc V-twin|2006-2010|102k|185d|107n|n
@Husqvarna
=Svartpilen 401
|373cc single|2018-2023|32k|150d|37n|n
2024-|399cc single|2024-|33k|159d|39n|n
=Vitpilen 401
|373cc single|2018-2023|32k|151|37n|n
=Vitpilen 701
|693cc single|2018-2020|55k|157d|71n|n
=701 Supermoto
2015-2016|690cc single|2015-2016|49k|145d|68n|n
2017-2020|693cc single|2017-2020|55k|145d|71n|n
2021-|693cc single|2021-|55k|156|73n|n
=701 Enduro
2016-2017|690cc single|2016-2017|49k|145d|68n|n
2018-2020|693cc single|2018-2020|55k|145d|71n|n
2021-|693cc single|2021-|55k|155|73n|n
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
910 S|inline-4|2005-2008|102.2k|185d|96n|n
989 R|inline-4|2008-2012|102.9k|185d|123.5n|n
1078 RR|inline-4|2008-2012|113k|185d|117n|n
990 R|inline-4|2010-2012|102k|190d|106n|n
1090 RR|inline-4|2010-2012|116.5k|183d||n
1090 R|inline-4|2012|106k|190d|115n|n
920|inline-4|2011-2012|96k|190d|95n|n
=F4
|998cc inline-4|2013-2016|143.5k|191d|110.8n|n
@Vespa
=GTS 125
Super 2010-2016|124cc single|2010-2016|10.3k|151d|12n|n
i-get 2017-|125cc single|2017-|10.1k|160d|11.1n|n
=GTS 300
Super ie 2012-2016|278cc single|2012-2016|15.8k|158d|22.3n|n
hpe 2019-2022|278cc single|2019-2022|17.5k|148d|26n|n
2023-2024|278cc single|2023-2024|17.5k|157|26.7n|n
=GTS 310
|310cc single|2025-|18.4k|163|28.9n|n
=Primavera 125
|125cc single|2015-2020|7.8k|115d|10.4n|n
@Piaggio
=Medley 125
|125cc single|2017-2019|8.8k|132|11.5n|n
@SYM
=Symphony ST 125
|125cc single|2015-|7.1k|127d|8.6n|n
=Jet 14 125
|125cc single|2017-|7.3k|128d|9.2n|n
@Lexmoto
=LXR 125
|125cc single|2021-|8.8k|167|9.6n|n
=Isca 125
|125cc single|2019-|7.8k|130d|9n|n
=Aura 125
|125cc single|2023-|7.3k|137|8.6n|n
=ZSB 125
Euro 5+|125cc single|2024-|8.6k|125|9.6n|n
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
