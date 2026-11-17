/* eslint-disable */
/**
 * UK cars and vans: stock specs for the vehicle picker. Dataset 2026-11-17.3 (batch 3: EV type, JDM kg·m torque, gaps, EVs; everyday cars are in vehicles.everyday.ts; earlier: batch 2: JDM, modern classics, vans, EVs, more bikes, donors, tuner stages).
 *
 * Format (parsed by src/lib/vehicles.ts): "@Make", "=Model", then
 * "gen|engine|years|power|weight|torque|asp[|stages]". Power is as the maker quotes it:
 * p = PS (converted to bhp x0.986), b = bhp, k = kW (x1.341). Torque n = Nm, l = lb-ft, k = kg·m (JDM catalogues; x7.233 to lb-ft).
 * Weight kg: kerb for cars, wet for bikes; "d" = only a dry weight was published (+20 kg added).
 * asp: t turbo petrol, d diesel, n non-turbo, s supercharged, h hybrid (full, mild or plug-in), e fully electric. Stages: total power after
 * a tuner's stage for that exact variant. "@@ENGINES": make|code|label|power|torque|asp swap donors.
 *
 * Notes:
 *  - Batch 3: fully electric lines use asp e (was h); h is kept for full, mild and plug-in hybrids. EV tune "stages" in the app are the maker's
 *    own paid power unlock (stage 1, only where a maker figure is published) and then chassis work, with no assumed power gain.
 *  - Batch 3: JDM catalogue torque in kg·m is written with the k suffix (e.g. 37k) and converted x7.233 to lb-ft by the parser.
 *  - Power units: p = PS, b = bhp. Torque = standard (non-overboost) figure unless noted in gen label.
 *  - Weights: manufacturer/UK press kerb figures; van weights are typical SWB panel van kerb.
 *  - Stage figures: CSC Motors pages quote metric hp on PS baseline (written p); Wayside quotes bhp/hp at flywheel (written b).
 *  - Weights are kerb weights as quoted by maker / UK press (DIN, no driver, where known). "d" = dry weight as quoted.
 *  - Tuner stage figures are totals after the tune as published by the named tuner; "p" used where the tuner's
 *  - figure is based on the PS rating.
 *  - Honda Civic Type R: EK9 = JDM only (grey import)
 *  - Honda Civic Type R: CSC Motors (UK tuner) stage 1; CSC labels the figures "BHP" but they are PS-based (310 stock)
 *  - Honda Integra Type R: DC5 = JDM import
 *  - Toyota GR Yaris: Forge Motorsport stage 1 "over 310bhp/405Nm", stage 2 320bhp/420Nm
 *  - Toyota Supra: JDM grey imports (Japanese quoted figures)
 *  - Toyota GR Supra: Litchfield stage 1 440bhp/450lbft, stage 2 475bhp/470lbft (3.0 A90)
 *  - Toyota MR2: JDM turbo (grey import)
 *  - Toyota Yaris: JDM grey imports (Japanese quoted figures)
 *  - Subaru Impreza: 22B = JDM (16 officially imported to UK)
 *  - Subaru Impreza WRX STI: ND Auto Repairs (UK remapper) 2008 2.5T STI 300hp -> 330hp stage 1
 *  - Subaru BRZ: Gen 2 (2022-) was not sold in the UK - omitted
 *  - Mitsubishi Lancer Evolution: JDM Evo IX GSR (grey import); ND Auto Repairs stage 1 280 -> 320
 *  - Nissan GT-R: Litchfield stages 1/2/3 = 590/610/615bhp (page does not state model year)
 *  - Nissan Skyline: JDM quoted figures (grey imports; R33 GT-R V-Spec also sold in UK in 1997)
 *  - BMW M135i: CSC Motors stage 1 (CSC labels hp as "BHP"; PS-based)
 *  - BMW M140i: Wayside Performance B58: stage 1 420-435bhp, stage 2 440-455bhp (lower figures used)
 *  - BMW M2: Evolve stage 1 "+20-25hp", stage 2 (catless downpipe) "+30-35hp" over 370hp stock (lower figures used)
 *  - BMW 335i: Evolve 335i N54 remap "a realistic 370bhp"
 *  - BMW 335i: Nforcd 335i N55 stage 1 400bhp / stage 2 420bhp
 *  - BMW M3: Evolve S55 stage 1 "+65-70hp", stage 2 (catless downpipes) "+80-90hp" over 431hp (lower figures used)
 *  - Mercedes A45: CSC Motors stage 1 (PS-based "BHP")
 *  - Hyundai i30 N: Forge Motorsport: Gen1 stage 1 300bhp/440Nm, stage 2 320bhp/460Nm; facelift stage 1 340bhp/460Nm
 *  - Caterham Seven: Caterham quotes dry weights; figures as published by Caterham / UK press
 *  - Nissan Silvia / 180SX / Skyline / Stagea / Laurel / Cefiro / 300ZX (JDM lines): JDM grey imports, Japanese catalogue figures (carsensor.net); weights are the 5MT car where a manual existed, otherwise the AT car
 *  - Toyota Chaser / Mark II / Cresta / Verossa / Aristo / Soarer / Altezza / Starlet / Corolla Levin / Celica JDM / Supra MA70-JZA70: JDM grey imports (Japanese quoted figures)
 *  - Torque: batch 2 left it empty where the only source quoted kg-m; batch 3 fills these from the same carsensor grade pages as kg·m (k suffix, x7.233 to lb-ft). Nm figures for S13/S14 engines come from the Wikipedia Silvia page; 180SX shares those engines (SR20DET 274n, CA18DET 225n, SR20DE 178n) - the Wikipedia SR20DET page gives 275 Nm instead
 *  - Toyota Chaser JZX90 Tourer V: torque 362.8 Nm taken from the 221616.com Mark II/Cresta JZX90 Tourer V pages (same 1JZ-GTE rating, 37 kg-m on carsensor Chaser page)
 *  - Nissan Laurel C33 / Cefiro A31: RB20DET quoted at 205 PS in these cars (Skyline R32 GTS-t is 215 PS)
 *  - Nissan Laurel C35 Neo: 1450 kg is the 1998 Club S turbo; the 1999-2002 Club S turbo Type X is 1460 kg
 *  - Nissan Stagea / Laurel turbo lines: several are 4AT-only grades (Stagea 25t RS Four 1997-98, RS V, all Laurel turbos)
 *  - Nissan Skyline R34 25GT-t saloon: weight is the 1998-99 catalogue figure; R34 25GT / 2.0 GT weights are 1998-99 coupe figures
 *  - Nissan 300ZX Euro 2+2: auto-data.net 283 hp / 1644 kg / 375 Nm (page does not state market); UK sale years 1990-1994 from Wikipedia (UK/Europe got 2+2 twin turbo only)
 *  - Toyota Aristo JZS147: weight is 1991-93 catalogue; Aristo turbo grades are 4AT only
 *  - Toyota Altezza RS200: 6MT 1340 kg (1998-2000 catalogue); the 5AT RS200 is 1330 kg
 *  - Toyota Celica ST185 GT-Four JDM: weight from the 1989-90 catalogue (1991-93 page lists no weight); ST205 JDM 1380 kg early, 1390 kg 1997-99
 *  - Toyota Cresta JZX100 Roulant G: 4AT only; weight from 1996-97 catalogue
 *  - Toyota Starlet EP82 GT: 830 kg (1989-90) and 860 kg (1994-95) catalogue figures
 *  - Lexus IS200: auto-data.net 1360 kg; cars-data.com gives 1355 kg (manual)
 *  - Suggested corrections to EXISTING lines (carsensor JDM catalogue, 5MT): Silvia "S13 K's 2.0 SR20DET" weight 1150 (file has 1220); Silvia "S15 Spec-R" 1240 (file 1250); Skyline "R32 GTS-t" Type M coupe 1260 (file 1300); Skyline "R33 GTS-t" GTS25t Type M coupe 1360 (file 1340); Skyline "R34 GT-T" 25GT turbo coupe 1410 (file 1400); 180SX "RPS13" 1991-93 Type II 1190 / 1994-95 Type X 1210 / 1996-97 Type X 1220 (file 1230). Chaser JZX100 Tourer V 1470 kg and S15 Spec-S 1200 kg confirmed
 *  - Honda/Mazda/Mitsubishi/Subaru/Daihatsu JDM lines: grey imports, Japanese catalogue figures (carsensor.net catalogue, MT grade where listed). Where the Japanese catalogue only gives kg-m, batch 3 writes it with the k suffix.
 *  - Honda Integra Type R: DC2 JDM 200 PS (UK/Euro DC2 190 PS line already present). JDM DC5 late (2004-06) catalogue says 1190 kg vs existing 1180 kg line.
 *  - Honda Civic: EG6 SiR-II weight from 1991-92 catalogue (1993-95 catalogue 1040 kg); EK4 SiR weight from 1995-96 MT catalogue.
 *  - Honda Prelude: BB4 weight from 1991-92 catalogue (1994-96 catalogue 1230 kg); carsensor lists Type S within the 1996-2000 BB6 period.
 *  - Honda CR-X Del Sol: SiR figures from the 1995-98 catalogue only.
 *  - Mazda Eunos Roadster: JDM NA (figures differ from UK MX-5 NA: 1.6 120 PS/940 kg vs 115 PS/955 kg; 1.8 130 PS/980 kg vs 131 PS/990 kg). Years are the verified catalogue periods only.
 *  - Mazda RX-7 FC "Euro" lines: ultimatespecs (market not stated; European-spec site). Its 1990 Turbo II page wrongly labels aspiration as NA.
 *  - Mazda RX-7 FD Type RS 280: 1999-2000 catalogue gives 32 kg-m only (Spirit R page gives 314 Nm for same rating); batch 3 writes the catalogue's 32 kg·m (32k).
 *  - Mitsubishi GTO: JDM grey import; torque in Nm from Wikipedia (417 Nm series 1, 427 Nm from 1993). Series-1 weight from 1990-91 catalogue; facelift weight from 1993-95 catalogue.
 *  - Mitsubishi 3000GT: UK/Euro twin-turbo 286 PS (Wikipedia); ultimatespecs weights 1730 kg (1992-95) and 1690 kg (1995-99), but it lists aspiration as single turbo/NA.
 *  - Mitsubishi Lancer Evolution: carsensor gives Evo VI as 1360 kg (existing line says 1365 kg). Evo III-V torque from Wikipedia.
 *  - Subaru Legacy: BE5 RSK early weight from Dec 1998-Apr 1999 catalogue; late (2001-03) 5MT catalogue 1460 kg. BL5 2.0GT 5MT is 280 PS (auto 260 PS).
 *  - Daihatsu Copen: UK 0.66 turbo 68 PS (ultimatespecs + Wikipedia). Torque conflicts (ultimatespecs 110 Nm, Wikipedia UK 100 Nm) so left empty. 1.3 end year from Wikipedia (Daihatsu left Europe in 2011).
 *  - Most figures from ultimatespecs.com per-version spec pages (power quoted there as HP/PS/kW; PS written as p). Years are the page's production range unless noted.
 *  - Ford Escort RS2000 Mk6: ultimatespecs gives 1995-1997; Wikipedia says RS2000 production ended June 1996, so 1996 used.
 *  - Ford Escort RS Turbo Series 1: ultimatespecs kerb weight 861 kg looks light next to Series 2 (965 kg); kept as published, worth a check against a period road test.
 *  - Ford Escort XR3i Mk5 1.8 16v: ultimatespecs lists 131 PS; Wikipedia (and Ford) quote 130 PS, so 130p used. Weight/torque from ultimatespecs.
 *  - Ford Fiesta RS1800: ultimatespecs labels it "1.8 XR2i / RS" (1.8 16v Zetec 130 PS, 1992-1994) = the RS1800.
 *  - Ford Racing Puma: 155 PS and 162 Nm from the Wikipedia Puma engine table (155 PS also stated on German Wikipedia); 1,174 kg is Wikipedia's figure for "the standard car" in the Racing Puma section; years 1999-2001 from Wikipedia.
 *  - Ford Sierra XR4x4: UK cars were 5-door; Mk2 5-door figures used (2.9 cat version 146 PS per ultimatespecs).
 *  - Ford Sierra RS Cosworth: existing 3-door and Sapphire 4x4 lines checked OK; RS500 and Sapphire 2WD added.
 *  - VW Corrado: German Wikipedia technical data (power PS, torque, Leergewicht). UK VR6 was the 2.9 190 PS; the 1.8 16v (1989-1992) is omitted for lack of a weight.
 *  - VW Golf Mk4 V5: years from Wikipedia engine table (1998-2000), power/torque/weight from ultimatespecs 3-door page.
 *  - VW Polo G40: "Compressor" (G-Lader supercharger) per ultimatespecs.
 *  - Peugeot 106 GTi existing line: ultimatespecs gives 925 kg and 145 Nm (dataset has 950 kg / 142 Nm). 106 Rallye Ph1 existing: ultimatespecs gives 101 PS, 816 kg, 108 Nm (dataset 100p/825/111n).
 *  - Peugeot 306 GTi-6: same figures on ultimatespecs Ph1 (1996-1997) and Ph2 (1997-2001) pages, merged.
 *  - Renault Clio Williams: ultimatespecs Phase 1 page (1993-1994, 178 Nm) = Williams 1; Phase 2 page (1994-1996, 175 Nm) covers Williams 2/3; Wikipedia also quotes 175 Nm.
 *  - Renault Clio V6: Wikipedia figures (Phase 1 1,355 kg, Phase 2 1,400 kg).
 *  - MG ZT: years from Wikipedia engine table (ZT 190 2001-2005; ZT 260 V8 2003-2005); weights/torque from ultimatespecs.
 *  - MG F Trophy 160: ultimatespecs lists "F 160" for 2001 only; it is the 160 PS VVC (Trophy 160 SE).
 *  - Rover 220 Coupe Turbo: ultimatespecs years 1993-1994 (model range page); the Turbo Coupe is often quoted from 1992.
 *  - Mercedes 190E 2.3-16: production years per Wikipedia (09.1984-06.1988); ultimatespecs says 1983-1988.
 *  - Vauxhall Astra GTE 16v and Cavalier GSi 2000 / Turbo 4x4: figures from the identical Opel Kadett E GSi 16v and Vectra A 2000 / 2.0i Turbo 4x4 pages (ultimatespecs). Wikipedia: GTE 16v made 156 PS without a cat, 6 PS less with one; 150 PS (cat) used.
 *  - Vauxhall Nova GSi: the Nova GTE was renamed GSi; figures for 1.6 GSi.
 *  - Vauxhall Astra G Coupe Turbo: ultimatespecs gives 2000-2006.
 *  - Most figures in this batch are from auto-data.net variant pages; auto-data "Hp" is metric hp, so written as p. Where auto-data gives a kerb-weight range, the lower figure is used.
 *  - VW/Audi/Cupra/BMW/Mercedes PHEVs and EVs: power and torque are system figures; PHEVs asp h, EVs asp e (moved from h in batch 3). Mercedes C43 W206 is a 48V mild hybrid (electric turbo), written as t.
 *  - EV battery sizes in the engine label are the figures each maker usually advertises: usable for VW ID/Cupra Born (58/77/79 kWh); gross for Kia, Hyundai, MG, Mini, Polestar.
 *  - Hyundai Ioniq 5 N: 609 PS / 740 Nm normally, 650 PS / 770 Nm with N Grin Boost (Wikipedia). Kerb weight 2205-2235 kg (Wikipedia). Years start from auto-data production start (March 2024); Wikipedia says introduced 2023.
 *  - Kia EV6 GT: start year 2022 from Wikipedia ("released 4 October 2022"); auto-data gives 2021 for the whole EV6 range.
 *  - Ford Mustang S550: auto-data European-style figures (421/317 Hp, WLTP data). Ford US quotes 435 hp / 310 hp (Wikipedia). S650 GT 446 / Dark Horse 453 are the 2024 Euro-6 figures (WLTP data on page).
 *  - Ford Ranger Raptor: pickup double-cab kerb weights. Mk1 is the 2.0 bi-turbo diesel; Mk2 3.0 V6 is the petrol (UK also had a 2.0 EcoBlue 210 Hp Mk2 Raptor from 2023, not added).
 *  - Audi RS4 B9 facelift / RS Q3 / Arteon R Shooting Brake: auto-data shows no end of production, so they are written as still on sale even though some have since been replaced.
 *  - Audi RS5 B9 pre-facelift: auto-data lists only 2017-2018 production for the Coupe; the facelift Coupe starts 2020.
 *  - Audi RS6: all lines are the Avant (the only RS6 body sold since C7).
 *  - BMW M135 F70: UK gets 300 PS; auto-data also lists a 317 Hp version (other markets).
 *  - Skoda Kodiaq vRS: kerb weights are the low end of auto-data ranges (Mk1 BiTDI 1805-1923 kg; facelift TSI 1719-1797 kg); 7-seat cars are heavier.
 *  - Alpine A110: Alpine UK naming is Pure/Legende (252), S, GT and R; the 252 PS base car continued after 2021, but auto-data lists only the 2017-2021 version.
 *  - Mini Electric: F56 Cooper SE battery 32.6 kWh gross (28.9 net). J01 = new 2024 Mini Cooper E/SE.
 *  - Van weights: auto-data.net L1H1 (SWB, low roof) panel van pages or cars-data.com L1H1 / "short" panel van pages; where auto-data gives a kerb range (e.g. 1397-1419) the lower figure is used
 *  - VW Transporter T4: auto-data.net L1H1 panel van figures (metric hp = PS); T4 "facelift" = 1996-2003 long-nose shape
 *  - VW Transporter T5 3.2 V6: auto-data gives 1900-2100 kg for the L1H1 Tiptronic van (lower figure used); a 2003-2009 petrol
 *  - VW Transporter T5 2.5 TDI 130/174: already in dataset as 2003-2009; auto-data.net lists both as 2003-2006 (not changed, flag for review)
 *  - VW Transporter T7: auto-data.net L1H1 panel van; 2.0 TDI 170 is automatic-only (weight for the auto FWD van)
 *  - VW Caddy Mk3 facelift: cars-data.com 2010-2015 van (short wheelbase) figures; Mk4 = auto-data "Panel Van IV"; Mk5 = auto-data "Cargo V" (auto-data shows Cargo V 2020-2026, facelift from 2026)
 *  - VW Amarok: double cab pickup kerb weights (auto-data.net); 2.0 BiTDI weight is for the 4MOTION manual; 3.0 V6 weights are 4MOTION auto; 258 PS weight is the lower figure of 2180-2260
 *  - Ford Transit Custom Mk1 2.2 TDCi: cars-data.com L1H1 SWB panel van; cars-data gives the generation as 2012-2018 (the 2.2 was replaced by the 2.0 EcoBlue in 2016 per existing data; flag years for review)
 *  - Ford Transit Custom Mk2: cars-data.com L1H1 van; the van page shows 2023-2024 but the same-generation Kombi is listed "2023-present", so written as 2023-; 150/170 weights are Limited trim
 *  - Ford Transit Connect: auto-data.net Panel Van L1 (SWB) figures, lower end of the kerb range
 *  - Mercedes Vito W639 facelift and W447: cars-data.com "short" (compact) panel van; years are cars-data generation ranges (W447 2014-2024 incl. 2020 facelift); 122 CDI V6 and 119 CDI are automatic
 *  - Mercedes Vito W447 111 CDI: cars-data states 230 Nm (same as the 109 CDI), which looks wrong, so torque left blank
 *  - Mercedes eVito: cars-data.com eVito Van long (no compact body), 41 kWh battery; asp e (electric)
 *  - Renault Trafic Mk3: cars-data lists all 1.6 dCi under 2014-2019; 115/140 are model-year 2014 engines, 95/120/125/145 model-year 2016 engines; Energy 125/140/145 = twin-turbo
 *  - Renault Trafic Mk3 facelift 2.0 dCi 145: cars-data quotes 146 hp (107 kW)
 *  - Vauxhall Vivaro: figures from cars-data.com Opel Vivaro (identical van, Opel badge); Opel quotes the 2.0 CDTi as 114 hp (Vauxhall sells it as "115")
 *  - Citroen Berlingo Mk2 (B9): cars-data.com van, standard (non-XL) length
 *  - Engines: US-market donors (RSX/Civic Si/TSX, Corvette, Mazdaspeed, US WRX, E36 M3 S52) use SAE hp / lb-ft as quoted (b, l); labels say "US".
 *  - Honda B16A EF9 / Toyota 1ZZ-FE etc.: JDM PS figure used where the source gives it (Wikipedia engine pages).
 *  - Toyota 3S-GTE Gen3 (MR2 SW20 Rev3 JDM 245 PS) already present; ST205 figure on Wikipedia looked inconsistent so not added.
 *  - Toyota 1ZZ-FE: Wikipedia quotes "140 bhp (142 PS)" for the Japanese MR-S; kept 140b as written.
 *  - Nissan SR20DET GTi-R: Wikipedia gives 284 Nm in the Japan spec table and 280 Nm in prose; spec table used. European GTi-R is 220 PS.
 *  - Nissan RB20DET R32 GTS-t: Skyline article gives 265 Nm, RB engine article 264 Nm; car article used.
 *  - Nissan CA18DET: S13 Silvia JDM is 175 PS / 225 Nm (Silvia article); the UK/Europe 200SX figure (169 PS / 228 Nm) used.
 *  - Mazda MX-5 BP engines: UK figures from Wikipedia's UK spec tables, quoted in kW there.
 *  - VW AAA VR6: Golf Mk3 table says 176 PS / 235 Nm; VR6 article says 128 kW (172 hp). Golf table used.
 *  - VW BYD (Edition 30) and BMN codes are matched by output on Wikipedia, not stated beside the figure.
 *  - BMW S52B32: Wikipedia table 325 Nm (240 lb-ft), prose 320 Nm; US 240 hp / 240 lb-ft as tabled.
 *  - BMW M57D30TU in E46 330d auto was software-limited to 390 Nm (Wikipedia).
 *  - Vauxhall Z22SE: Wikipedia lists it as GM L61; 147 hp figure from the Astra entry, no torque given.
 *  - Subaru EJ20G code: Wikipedia EJ page assigns EJ20G to early GC8 WRX/Turbo; UK Turbo 2000 figure (208 hp) from the Impreza GC8 article.
 *  - Method: every stage figure is from the CSC Motors page listed in SOURCES. Each page was fetched (raw HTML); the stock "orig" value on the page equals the dataset power for every line. Stage 1 is the figure visible to WebFetch; stages 2-4 are in the same page's stage selector data (hidden tabs). 12 pages spot-checked with WebFetch matched exactly (Scirocco R, S3 8Y, RS3 8Y, M3 G80 Comp, A35, Civic FL5, 991.2 Carrera, T6 84, Puma ST, Megane RS 280, Octavia vRS Mk4, Cooper S F56).
 *  - All lines: CSC Motors stages (CSC labels hp as "BHP"; PS-based, so p). CSC shows a single estimate per stage (no ranges).
 *  - VW Golf GTI Mk5 Pirelli: CSC has no Pirelli page; uses the Golf GTI Edition 30 230hp page (same 2.0 TFSI 230PS).
 *  - VW Golf GTD Mk7: CSC 2012-2016 page (stage 2 230); the 2017 facelift page gives stage 2 235.
 *  - VW Transporter T6 Euro 6: CSC stage 1 for 84PS (175) is higher than for 102PS (150) - as published by CSC.
 *  - VW Transporter T6.1: CSC 2019 pages (90hp, 150hp). 199PS BiTDI omitted (CSC lists 198hp).
 *  - Audi TTS Mk2: CSC TT-S page (300/320); CSC's TT-range page for the same engine also lists stages 3/4 (370/400) - not used.
 *  - Ford Fiesta ST150: CSC files it under "Mk5 2001-2008" (2.0 16v ST 150hp).
 *  - Renault Clio RS: 172 Cup / 182 Trophy use the 172hp / 182hp CSC pages (same F4R output). Clio IV 200 Turbo uses the Ph1 2012-2016 page (Ph2 page: stage 1 230, stage 2 240).
 *  - Renault Megane RS: R26.R uses CSC "R26R 230hp" page; R26 (same 230hp) left without stages as CSC names only the R26.R.
 *  - Mini Cooper F56 1.5: CSC F56 LCI (2018-) page.
 *  - Honda Civic Type R FL5: CSC page title says 320hp but its stock figure is 329 (GPF, 2023).
 *  - BMW 340i F30 LCI: CSC page is "340i xDrive 326hp" (same B58 326PS).
 *  - BMW M235i F22: CSC m235i-326hp-9033 page (a second CSC M235i page uses a 306 baseline - not used).
 *  - BMW 320d E90: CSC E9x 2005-2010 177hp page.
 *  - Porsche 911 991.2 Carrera: CSC page covers "Carrera / 4 370hp". 991.2 Carrera S: "Carrera S / 4S 420hp" page.
 *  - Porsche Cayman 987.1 S: CSC page lists stage 3 equal to stage 2 (315) - stage 3 dropped.
 *  - Mercedes C63 W205: CSC 2014-2018 pages (476: 575/590, C63 S: 570); CSC 2018- pages give 570 / 560.
 *  - Mercedes C43 W205: 367 (2014-2018) and 390 (2018-) CSC pages.
 *  - EVs (Ioniq 5 N, EV6 GT, MG4 XPower, Cupra Born, ID.3/ID.4 GTX, Mini Electric, Polestar 2, eVito) use asp h (electrified);
 *    power is the normal (non-boost) maker figure. Tesla omitted: Tesla publishes no power outputs and third-party figures conflict.
 *  - Polestar 2 Performance Software Upgrade (maker-sold OTA, MY21-23 Long range Dual motor): Polestar UK news page says "power from 300 kW (402 bhp) to 350 kW (469 bhp)" and torque 660 -> 680 Nm. Written as 1:350k (kW is exact; = 476 PS). The 408 PS stock figure in the file is 300 kW.
 *  - Polestar 2 MY24 (facelift, Jan 2023 production) Long range Dual motor: Polestar UK specifications page says "Performance software upgrade (increases power up to 350 kW / 476 hp, requires Long range Dual motor version)" and that it "is also available for Long range Dual motor variants without the Performance pack". Stock 310 kW / 421 hp, so stage 1 = 350k. The Performance pack car is already 350 kW, so no stage on that line.
 *  - Polestar 2 MY24 weights are the low end of the Polestar UK ranges (SR single 1,949-2,042; LR single 2,009-2,081; LR dual 2,108-2,185; Performance pack 2,105-2,182 kg). The Polestar UK page says 70 kWh for the Standard range battery; auto-data says 69 kWh gross. Years start 2023 from the auto-data production start; neither page gives an end year.
 *  - Polestar 2 MY21-23 single motor: auto-data figures (Standard Range 64 kWh Apr 2021-Mar 2022; Long Range 78 kWh Apr 2021-Jan 2023). These are pre-facelift FWD cars.
 *  - VW ID.3 Pro / Pro S power upgrade (maker-sold, UK): Auto Express (Aug 2025) says VW UK's configurator lists the ID.3 Pro and Pro S at 201 bhp, with an optional paid upgrade to "the car's full potential of 228bhp", torque 265 -> 310 Nm (GBP 16.50/month, GBP 165/year or GBP 649 lifetime). The VW newsroom release confirms 150 -> 170 kW (231 PS) by "function-on-demand" outside Germany (German Pro S has 170 kW as standard). Stage written as 1:228b from the UK figure.
 *  - VW ID.3 Pro / Pro S torque conflict: cars-data (Dutch-market pages, 204 hp 150 kW) gives 310 Nm stock; Auto Express says the UK MY25 car is 265 Nm stock (310 Nm only after the upgrade). The paid upgrade only applies to MY2025-on cars (ecomento/motor1 coverage, not fetched), while the line covers 2023-on, so 310 Nm (cars-data) was kept for the line. If you want the line to describe the MY25 upgradeable car, use 265n instead.
 *  - VW ID.3 Pro S: cars-data lists 77 kWh (2023 model, 1,862 kg) and 79 kWh (2025 model, 1,857 kg) versions of the same 204 hp car; written as one 77 kWh line with the 77 kWh car's weight. Pro is the 59 kWh (2024 model) page, 1,715 kg. Battery sizes are VW usable figures, same as the existing ID lines.
 *  - Cupra Born: no paid power upgrade found. The 204 -> 231 PS "e-Boost" was a factory option (Activator button), not a software purchase, and MY2025 cars reportedly got 231 PS as standard (search snippets only). Not added.
 *  - Kia: the Kia Connect Store "Boost" upgrade is for the EV9 (not in the dataset) and reportedly Germany-only (search snippets only). No published power figure for a Kia/Hyundai/MG/Mini EV power upgrade was found.
 *  - VW Polo GTI Edition 25: VW UK news gives 152 kW (207 PS) and 320 Nm (2,500-car limited run, 2023). Weight 1,297 kg is the Auto Express UK "minimum kerbweight"; cars-data gives 1,272 kg. UK press figure used. Years: cars-data model year 2023; ADAC (not fetched) suggests a 06/23-11/23 build, so written as 2023.
 *  - Rover 25 GTi: Wikipedia says the 25 launched in 1999 with i/iE/iS/iL/GTi trims and "the Rover 25 GTi was discontinued" in summer 2001 when the MG ZR arrived. The 160 PS 1.8 VVC was the MG ZR 160 engine (already in the dataset), not the Rover 25 GTi. The GTi used the 145 PS 1.8 VVC; figures from auto-data "1.8 i 16V (145 Hp)", whose engine code is K18 VVC (1,090 kg, 174 Nm). No 2003-2005 Rover 25 GTi 160 exists in any source fetched.
 *  - Ford Escort RS2000 Mk5: ultimatespecs has two Escort V RS 2000i pages: 1991-1992 (1,096 kg, already in the file) and 1992-1995 (FWD, 1,135 kg, same 150 PS / 190 Nm). Added as "Mk5 facelift". Wikipedia confirms the Sept 1992 facelift and the RS2000 4x4 that came with it.
 *  - Ford Transit Custom MS-RT (Mk1 facelift): Auto Express "2.0 EcoBlue 185ps Low Roof MS-RT Van" lists 185 bhp (title 185 PS), 6-speed manual, minimum kerb weight 1,967 kg, no torque. Torque left empty because the Ford EcoBlue tech-spec PDF returned HTTP 503. Years 2019-2023: the 185 hp EcoBlue first appears as a 2019 model on cars-data and that van generation ends in 2023. No source gave the MS-RT launch year itself.
 *  - Ford E-Transit Custom MS-RT (Mk2): ms-rt.com gives "210KW / 285PS". cars-data's L1H1 MS-RT van page has 2,117 kg and a 2023 model year, but it lists system power as 218 hp, which conflicts with the 286hp in its own title. Torque conflicts (cars-data 415 Nm; Auto Express double-cab van 630 Nm), so it is left empty. Auto Express gives 2,541 kg for the double-cab van; the panel-van figure is used.
 *  - Ford Transit Custom Mk2 MS-RT diesel (ms-rt.com: 2.0 EcoBlue 150 PS 6MT and 170 PS 8AT) uses the same engines as the existing Mk2 150/170 lines. No MS-RT-specific weight was found, so not added.
 *  - Mercedes Vito W639 facelift: cars-data's 2010 van range has only 110/113/116/122 CDI, which are all already in the file, so no missing facelift engines were found.
 *  - Vauxhall Vivaro A (2001-2006): neither auto-data nor cars-data has a panel van page for this period, so figures are from auto-data's Opel Vivaro A "Tour" (9-seat minibus) pages. 1,927 kg is the minibus kerb weight, heavier than a panel van. auto-data names the engines 1.9 DI 82 / 1.9 DTI 101 (F9Q 762 / F9Q 760); Vauxhall sold them as 1.9 CDTi/DTi. An auto-data "1.9 DI 120 Hp / 190 Nm" entry looks wrong and was skipped.
 *  - Vauxhall Vivaro A 2.0 CDTi 90/115: auto-data's Opel Vivaro A facelift pages only cover the 2.0 CDTi DPF from Apr 2010 to Nov 2013 (114 Hp 300 Nm; the file has 290 Nm from cars-data, so this is a conflict, not changed). No page covered the 2006-2010 non-DPF 2.0 CDTi, so the existing 2011-2014 lines were not extended.
 *  - MG4 / Ioniq 5 / EV6 / i4 / 500e / Renault 5 / Corsa Electric: auto-data figures (auto-data "Hp" = PS, so p), using the lower figure where a kerb range is given (Ioniq 5 58 kWh 1,830-1,910; 72.6 RWD 1,910-1,990; 72.6 AWD 2,020-2,100; 77.4 RWD 1,905-2,002; 77.4 AWD 2,025-2,115; EV6 58 kWh 1,800-1,890; 77.4 RWD 1,910-2,000; AWD 2,015-2,105). Years follow auto-data production dates (Ioniq 5 77.4 kWh production started Dec 2021, so UK cars are 2022-on).
 *  - MG4 trim naming: auto-data calls them Standard / Long / Extended Range. In the UK these are roughly SE (51 kWh), Trophy Long Range (64 kWh) and Trophy Extended Range (77 kWh).
 *  - BMW i4 LCI M50: auto-data gives a July 2024 start with no end; the M60 that replaces it starts in July 2025, so the M50 LCI is probably 2024-2025. No maker power upgrade for the i4 was found (BMW quotes the M50's power without a boost figure on auto-data).
 *  - Vauxhall Corsa-e (2019-2023): auto-data gives no weight, so the cars-data Opel Corsa-e page (1,455 kg, 260 Nm, same 100 kW car) was used.
 *  - Torque unit k = kg·m (kgf·m) as printed in the Japanese catalogue; the parser converts x7.233 to lb-ft. Used only where the carsensor page gives kg·m alone; where it prints N·m (newer catalogues, e.g. Forester STi II 309 N·m) the n figure is used.
 *  - All carsensor figures are the 5MT grade where a manual existed (weights as in the existing lines); Stagea RS Four / RS V, Laurel turbos, Aristo JZS147 and Soarer UZZ31 are 4AT-only grades.
 *  - Torque edits: each kg·m figure is from the same carsensor grade page already used for that line (listed in the file header SOURCES), checked against power and weight on the page.
 *  - Toyota Soarer JZZ30 2.5GT-T (1994-2001): 37 kg·m from the 1994-95 catalogue; the 1999-2001 catalogue gives 38.5 kg·m @2400 (VVT-i 1JZ), so the line could be split later.
 *  - Integra Type R DC2: 96-spec 18.5 kg·m @7500; 98-spec and 00-spec 19 kg·m @6200 (carsensor and ja.wikipedia agree).
 *  - Mazda RX-7 FD Type RS 280 (1999-2000): page gives 32 kg·m only, so 32k used (Spirit R page later prints 314 N·m for the same rating).
 *  - Nissan R33 GTS25t Type M saloon and R34 25GT-t saloon torque from the skyline (saloon) pages; coupe pages show the same figures (30 / 35 kg·m).
 *  - Integra Type R DB8 (4-door): carsensor has no 4-door Type R grade, so ja.wikipedia (infobox and engine section) used: 200 PS, torque 18.5 -> 19.0 kgf·m (96 spec -> 98 spec), 4-door weight given only as a 1,100-1,130 kg range, so the lower 1100 is used for both spec lines. 98/00-spec merged (Wikipedia: 00spec performance unchanged from 98spec).
 *  - Prelude BA8 JDM 2.2 Si (F22B): 1991-92 5MT 1210 kg; 1994-96 5MT 1220 kg. Lower/early figure used.
 *  - Prelude Mk4 UK lines: ultimatespecs (market not stated, European-spec site, like the existing RX-7 FC Euro lines). The 2.2 VTEC page is the 4WS car (the only 2.2 VTEC Euro page listed); ultimatespecs also lists BA8 160 PS and BB1 200 PS "Si" pages, which are the JDM cars.
 *  - Supra MA70 UK lines: ultimatespecs 3.0i (204 PS, 1514 kg, 254 Nm, 1986-1993) and 3.0i Turbo (235 PS, 1611 kg, 344 Nm, 1988-1993); market not stated. Wikipedia A70 powertrain table lists both 7M-GE and 7M-GTE MA70 for Europe. UK sale years not separately verified.
 *  - Celica ST185 GT-Four UK: ultimatespecs 2.0i Turbo 4WD (204 PS, 275 Nm, 1468 kg, 1990-1994). Wikipedia (citing a Toyota GB 1990 brochure) confirms only the 2.0 GT-i 16 and GT-Four were sold officially in the UK.
 *  - Subaru Impreza GC8 WRX STi JDM: carsensor "impreza_sti" catalogue, WRX STi sedan 5MT grades. Version V and VI have identical figures (280 PS / 36 kg·m / 1270 kg) so are merged. Type RA versions (lighter) not added.
 *  - Subaru Forester SF5 JDM: early S/tb 5MT 250 PS (1997-98); later S/tb and S/tb-STi are 240 PS 4AT; STi II Type M 5MT 250 PS / 309 N·m / 1410 kg (Dec 2000 - Jan 2002).
 *  - Subaru Forester UK 2.0 S-Turbo: ultimatespecs gives 1380 kg for 1998-2000 and 1330 kg for 2000-2002 (lighter facelift kept as published). Engine code not given on the page, so written "2.0 turbo".
 *  - Subaru Legacy Mk1 UK 2.0 Turbo 4WD: ultimatespecs 200 PS / 260 Nm / 1365 kg, page years 1991-1995; Wikipedia says the 2.0 turbo reached Europe and the UK in 1992 (manual only), so 1992 start used.
 *  - Subaru Legacy UK turbo petrols beyond Mk1: Wikipedia 2nd/3rd/4th gen articles describe no officially UK-sold turbo petrol Legacy (2nd gen GT/B-Spec in the UK only as grey import; 4th gen Europe got the 2.0D turbodiesel). ultimatespecs Legacy II/III/IV lists only NA petrols (and 3.0R).
 *  - Nissan Silvia S14 Autech Version K's MF-T: 250 PS / 28 kg·m / 1260 kg 5MT, catalogue period June 1996 - Dec 1998.
 *  - Nissan 300ZX Z32 later JDM periods: all 280 PS / 39.6 kg·m; weights are the 5MT car per catalogue period (Aug 1992-Sep 1994, Oct 1994-Sep 1998, Oct 1998-Aug 2000). From Oct 1994 the 2-seater is sold as "Version S". Oct 1994-Dec 1996 and Jan 1997-Sep 1998 periods have the same figures, so merged.
 *  - Method: carsensor and ultimatespecs pages were fetched with curl (raw HTML) and the spec-table cells parsed directly; Wikipedia via WebFetch and raw wikitext.
 *  - Batch 3 not added (no fetched source or doubtful figures): VW Golf R 333 (not sold in the UK, no weight); Rover 25 GTi 160 (2003-05); Escort RS2000 4x4; Transit Custom MS-RT 187 PS and early 130/170; Mercedes Vito W639 pre-facelift (identical 1,820 kg on every page) and 2003-05 engines; Mazda RX-7 FC UK Turbo II (only the existing Euro lines); Subaru Legacy GT UK after Mk1 (grey import only); Tesla (no maker power figures).
 *  - Batch 3 maker power unlocks: Polestar 2 Long Range Dual Motor Performance Software Upgrade 350 kW (stage 1 on MY21-23 and MY24 lines); VW ID.3 Pro / Pro S paid upgrade 150 -> 170 kW (228 bhp). No published-figure upgrade found for Cupra Born, Mini, Kia, Hyundai or MG.
 *
 * Sources checked (a sample; other figures are manufacturer figures as commonly quoted):
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-7-2012-2016/golf-2-0-tsi-gti-220hp-5756
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-7-2012-2016/golf-gti-2-0-tsi-performance-230hp-5782
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-7-2012-2016/golf-2-0-tsi-gti-clubsport-265hp-5758
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-7-2017/golf-2-0-tsi-gti-230hp-5770
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-7-2017/golf-gti-2-0-tsi-performance-245hp-5783
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-7-2017/golf-gti-2-0-tsi-tcr-290hp-8989
 *  https://www.evo.co.uk/volkswagen/golf-gti/203192/volkswagen-golf-gti-mk8-review-the-quintessential-hot-hatchback-but-is
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-8-2020/golf-gti-clubsport-45-8854
 *  https://www.pistonheads.com/news/ph-driven/2024-volkswagen-golf-gti-mk8-5--ph-review/48939
 *  https://parkers.co.uk/volkswagen/golf/gti/review
 *  https://en.wikipedia.org/wiki/Volkswagen_Golf_R
 *  https://wayside-performance.co.uk/pages/mk7-golf-r-ea888-gen-3-mqb-tuning-guide
 *  https://www.goodwood.com/grr/road/news/volkswagen-unveils-new-320ps-golf-r/
 *  https://www.encycarpedia.com/volkswagen/21-golf-r-hatch
 *  https://wayside-performance.co.uk/pages/mk8-golf-r-tuning-guide-stage-1-stage-1-stage-2-wayside-performance
 *  https://www.goodwood.com/grr/car-reviews/volkswagen/golf-r/
 *  https://www.encycarpedia.com/volkswagen/24-golf-r-hatch
 *  https://cars-data.com/en/volkswagen/polo/6r-2009-hatchback-8083/1-4-tsi-gti--57413/specs
 *  https://cars-data.com/en/volkswagen/polo/2014-hatchback-facelift-8078/1-8-tsi-gti-83162--83162/specs
 *  https://autotijd.be/en/weight/volkswagen/polo/gti-20-tsi-200-hp-898
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/polo/2017/polo-2-0-tsi-gti-200hp-5989
 *  https://www.autodata1.com/en/car/compare/volkswagen-polo-vi-facelift-2021-gti-20-tsi-207-hp-dsg
 *  https://www.evo.co.uk/volkswagen/vw-up-gti/20852/volkswagen-up-gti-2017-2023-review-a-modern-day-mk1-golf-gti
 *  https://www.topgear.com/car-reviews/volkswagen/up/10-115ps-gti-3dr/spec
 *  https://www.ultimatespecs.com/car-specs/Volkswagen/M10573/Transporter-T61
 *  https://www.autoplenum.de/auto/vw/t6-1/transporter-2019/2-0-tdi-bmt-199-ps
 *  https://zeperfs.com/en/fiche66-audi-s3.htm
 *  https://carsart.net/en/cars/audi/s3/sportback-8pa/2000cc-tfsi-265hp-quattro
 *  https://carsart.net/ar/cars/audi/s3/8v/2000cc-tfsi-300hp-quattro
 *  https://wayside-performance.co.uk/pages/audi-s3-8v-tuning-guide
 *  https://carsart.net/ar/cars/audi/s3/sedan-8y/2000cc-tfsi-310hp-quattro-s-tronic
 *  https://www.auto-data.net/en/audi-s3-sedan-8y-facelift-2024-2.0-tfsi-333hp-quattro-s-tronic-51544
 *  https://wayside-performance.co.uk/pages/audi-s3-8y-tuning-guide-stage-1-stage-1-stage-2-wayside-performance
 *  https://www.cscmotors.com/remapping-stats/Audi/rs3/8v-mk1-2015-2016/rs3-2-5-tfsi-367hp-839
 *  https://www.cscmotors.com/remapping-stats/Audi/rs3/8v-mk2-2017-2019/rs3-2-5-tfsi-400hp-840
 *  https://zeperfs.com/en/duel69-63.htm
 *  https://www.auto-motor-und-sport.de/marken-modelle/audi/rs-4/b5/
 *  https://www.topgear.com/car-reviews/audi/rs4-tfsi-quattro-5dr-s-tronic/spec
 *  https://vehiclescore.co.uk/car-bhp-check/audi/tt
 *  https://www.audi-mediacenter.com/en/the-audi-tt-rs-2924/at-a-glance-2932
 *  https://zeperfs.com/en/fiche2811-audi-tt-ii-rs.htm
 *  https://autotijd.be/en/weight/audi/tt-coupe/rs-400-hp-awd-1023
 *  https://parkers.co.uk/seat/leon/cupra-r-2002/specs
 *  https://fastestlaps.com/models/seat-leon-cupra-r
 *  https://zeperfs.com/en/fiche3035-seat-leon-ii-cupra-r.htm
 *  https://www.topgear.com/car-reviews/seat/leon-cupra/20-tsi-cupra-r-265-5dr/spec
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/5f-mk1-2012-2017/leon-2-0-tfsi-280hp-5169
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/5f-mk1-2012-2017/leon-2-0-tfsi-290hp-5170
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/5f-mk2-2017-2020/leon-2-0-tsi-cupra-300hp-5180
 *  https://www.skoda.co.uk/news/details/skoda-celebrates-25-years-of-vrs
 *  https://auth.autoexpress.co.uk/skoda/octavia/359578/skoda-octavia-vrs-mk1-2000-2006-icon-review
 *  https://www.carexpert.co.nz/skoda/octavia/2008/vrs/powertrain-and-performance
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/2013-2016/octavia-2-0-tsi-rs-220hp-5300
 *  https://www.dev.honestjohn.co.uk/skoda/octavia/vrs/2013
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/2017/octavia-2-0-tsi-rs-245hp-5316
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/2013-2016/octavia-2-0-tdi-cr-184hp-5299
 *  https://www.pistonheads.com/news/ph-buying-guides/skoda-octavia-vrs-mk4--ph-used-buying-guide/48774
 *  https://zeperfs.com/en/fiche1293-ford-fiesta-v-st.htm
 *  https://wayside-performance.co.uk/pages/mk7-ford-fiesta-st180-tuning-guide-stage-1-to-stage-3
 *  https://www.completecar.ie/amp/car_news/6208/.html
 *  https://www.autoexpress.co.uk/ford/fiesta/95970/new-ford-fiesta-st200-2016-review
 *  https://wayside-performance.co.uk/pages/mk8-fiesta-st-tuning-guide-stage-1-2-1-5-ecoboost-wayside-performance
 *  https://auto-data.net/en/ford-fiesta-viii-mk8-facelift-2022-3-door-st-1.5-ecoboost-200hp-44511
 *  https://wayside-performance.co.uk/pages/mk2-ford-focus-st225-tuning-guide
 *  https://wayside-performance.co.uk/pages/mk3-focus-st250-tuning-guide-stage-1-stage-2-wayside-performance
 *  https://www.mountunestore.com/collections/mk3-focus-st/products/focus-c346st-mtune-275-power-upgrade-package
 *  https://wayside-performance.co.uk/pages/mk3-focus-st-diesel-tuning-guide-stage-1-stage-2-wayside-performance
 *  https://wayside-performance.co.uk/pages/mk4-focus-st-tuning-guide-stage-1-stage-1-stage-2
 *  https://retrocaricons.com/article/Focus_RS_Mk_1_128
 *  https://www.encycarpedia.com/ford/03-focus-rs-hatch
 *  https://www.evo.co.uk/ford/focus-rs/14840/ford-focus-rs-mk2-used-prices-and-specs
 *  https://www.cscmotors.com/remapping-stats/Ford/focus/2004-2010/focus-rs-305hp-2333
 *  https://www.evo.co.uk/ford/focus-rs/6842/ford-focus-rs500-review
 *  https://www.cscmotors.com/remapping-stats/Ford/focus/2004-2010/focus-rs500-350hp-2335
 *  https://australiancar.reviews/_pdfs/Ford_FocusRS_LZ_Specifications_201601.pdf
 *  https://wayside-performance.co.uk/pages/mk3-focus-rs-tuning-guide-stage-1-stage-2-wayside-performance
 *  https://wwwqa.media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Transit/FordTransitEcoBlue_TechSpecs_EU.pdf
 *  https://www.autoexpress.co.uk/ford/transit-custom/prices-specs/51487/2.0-ecoblue-185ps-low-roof-ms-rt-van
 *  https://www.wikiwand.com/en/Ford_Escort_RS_Cosworth
 *  https://zeperfs.com/en/fiche508-ford-escort-v-rs-cosworth.htm
 *  https://stage1-www.vauxhall.co.uk/content/dam/vauxhall/Home/PDFs/historical-brochures/discounted-models/vxr/VXR_May_2008.pdf
 *  https://wayside-performance.co.uk/pages/corsa-d-vxr-tuning
 *  https://manualshive.com/en/manual/vauxhall/corsa-vxr/3837186?page=21
 *  https://www.pistonheads.com/news/ph-buying-guides/ph/31986
 *  https://www.automotivepowertraintechnologyinternational.com/uncategorized/redeveloped-1-6-liter-turbo-gives-new-corsa-vxr-205ps-and-280nm.html
 *  https://wayside-performance.co.uk/pages/corsa-e-vxr
 *  https://www.autoexpress.co.uk/vauxhall/corsa/104488/new-vauxhall-corsa-gsi-2018-review
 *  https://autocar.co.uk/node/87757
 *  https://www.topgear.com/car-reviews/vauxhall/astra/20t-16v-vxr-3dr/spec
 *  https://www.encycarpedia.com/vauxhall/05-astra-gtc-opc-vxr-coupe
 *  https://wayside-performance.co.uk/pages/astra-h-vxr-tuning
 *  https://www.auto-data.net/en/vauxhall-astra-mk-vi-gtc-vxr-2.0i-280hp-25316
 *  https://wayside-performance.co.uk/pages/astra-j-vxr-tuning-guide
 *  https://www.topgear.com/car-reviews/vauxhall/astra/16t-16v-200-sri-vx-line-5dr/spec
 *  https://en.wikipedia.org/wiki/Renault_Clio_RS
 *  https://www.parkers.co.uk/renault/clio/renaultsport-2001/trim-renaultsport-172/specs
 *  https://vehiclescore.co.uk/car-bhp-check/renault/clio
 *  https://www.evo.co.uk/renault/clio/6210/renault-sport-clio-mk3-197200-2006-2012-review-a-more-grown-up-but-still-fun-clio
 *  https://www.autocar.co.uk/node/49410
 *  https://www.honestjohn.co.uk/renault/clio/renaultsport
 *  https://www.australiancar.reviews/?p=54240
 *  https://phildev.lapmeta.com/de/model/849
 *  https://www.autocar.co.uk/node/24005
 *  https://www.cscmotors.com/remapping-stats/Renault/megane/3-ph1-2008-2012/megane-rs-2-0t-265hp-4771
 *  https://australiancar.reviews/_pdfs/Renault_MeganeRS275Trophy_X95III_Specifications_201406.pdf
 *  https://www.cscmotors.com/remapping-stats/Renault/megane/3-ph3-2013-2015/megane-rs-2-0t-275hp-4790
 *  https://www.shelbournemotors.com/renault/news/new-renault-mgane-rs-trophy---harnessing-even-more-technology-to-boost-sports-performance/
 *  https://insurance.goodwood.com/buyers-guide/peugeot-205/
 *  https://supercarnostalgia.com/blog/peugeot-205-gti-16
 *  https://www.encycarpedia.com/peugeot/87-205-gti-1-9-hatch
 *  https://www.cscmotors.com/remapping-stats/Peugeot/208/2012-2015/208-gti-1-6-thp-200hp-4210
 *  https://www.cscmotors.com/remapping-stats/Peugeot/208/2015-2019/208-gti-1-6-e-thp-207hp-4221
 *  https://www.auto-data.net/en/citroen-ds-3-phase-i-racing-1.6-t-207hp-40480
 *  https://www.auto-motor-und-sport.de/test/citroen-ds3-racing/technische-daten/
 *  https://www.pistonheads.com/features/ph-buying-guides/mini-cooper-s-r53--ph-buying-guide/29901
 *  https://www.rushmagazine.co.uk/rush-radars/r53-mini-jcw-gp
 *  https://zeperfs.com/en/fiche1896-mini-cooper-s-jcw.htm
 *  https://www.encycarpedia.com/mini/13-john-cooper-works-gp-compacte
 *  https://www.ultimatespecs.com/car-specs/Mini/70809/Mini-Mini-F56-John-Cooper-Works.html
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper-s/f56-2014-2018/cooper-s-2-0t-jcw-231hp-3734
 *  https://www.autoexpress.co.uk/abarth/500/prices-specs/75460/1.4-t-jet-145-3dr
 *  https://www.cscmotors.com/remapping-stats/Fiat/500-595-695/2015/500-595-695-abarth-1-4-t-jet-145hp-1672
 *  https://www.media.stellantis.com/uploads/em/2016/ABARTH/Schde_tecniche/160607_Abarth_595_Technical-Specs_ENG.pdf
 *  https://autoexpress.co.uk/abarth/500/prices-specs/75462/1.4-t-jet-165-turismo-3dr
 *  https://www.cscmotors.com/remapping-stats/Fiat/500-595-695/2015/500-595-695-abarth-595-turismo-1-4-t-jet-165hp-1682
 *  https://www.fiat.co.za/content/dam/fiat/za/brochure/Abarth-595.pdf
 *  https://www.cscmotors.com/remapping-stats/Fiat/500-595-695/2015/500-595-695-abarth-595-competizione-1-4-t-jet-180hp-1674
 *  https://www.carexpert.co.nz/alfa-romeo/giulia/quadrifoglio/features-and-specs
 *  https://zeperfs.com/en/fiche3413-alfa-romeo-giulietta-iii-1750-qv.htm
 *  https://cdn2.evo.co.uk/alfa-romeo/giulietta/qv
 *  https://nocache.media.stellantis.com/uploads/uk/UK/2014/ALFA_ROMEO/TECH_SPECS/140609_AR_GiuliettaQV_TechSpec.pdf
 *  https://en.wikipedia.org/wiki/Honda_Civic_Type_R
 *  https://www.cscmotors.com/remapping-stats/Honda/civic/9th-2013-2016/civic-2-0-t-type-r-310hp-2797
 *  https://www.cscmotors.com/remapping-stats/Honda/civic/10th-2017-2020/civic-2-0t-type-r-320hp-2807
 *  https://zeperfs.com/en/fiche3138-honda-civic-1-6-vti.htm
 *  https://carmagazine.co.uk/car-reviews/honda/integra-type-r-1998
 *  https://rushmagazine.co.uk/honda-integra-type-r-dc2-buyers-guide
 *  https://www.rushmagazine.co.uk/post/honda-s2000-buying-guide
 *  https://www.jdmbuysell.com/learn/honda/s2000/ap1/
 *  https://www.parkers.co.uk:443/toyota/yaris/gr-yaris/review/
 *  https://autotijd.be/en/weight/toyota/gr-yaris/16-turbo-manual-awd-5343
 *  https://forgemotorsport.co.uk/Toyota_Yaris_GR_Remap--product--2814.html
 *  https://autoexpress.co.uk/toyota/yaris/gr-yaris/engines
 *  https://www.parkers.co.uk/toyota/gr86/coupe-2022/specs
 *  https://media.toyota.co.uk/vehicles/supra-archive-1993/
 *  https://www.carthrottle.com/news/why-toyota-supra-turbo-another-90s-hero-car
 *  https://www.litchfieldmotors.com/toyota/supra
 *  https://auto-data.net/en/toyota-celica-t23-1.8-vt-i-16v-143hp-3124
 *  https://www.parkers.co.uk/toyota/celica/coupe-1999/engine-18-vvt-i-(190ps)-petrol/specs/
 *  https://media.toyota.co.uk/?p=50889
 *  https://www.fensport.co.uk/parts/toyota/mr2/mk2-2-0-gt-rev-2-sw20-3s-ge/
 *  https://media.toyota.co.uk/?p=35296
 *  https://en.wikipedia.org/wiki/Subaru_Impreza_(first_generation)
 *  https://en.wikipedia.org/wiki/Subaru_Impreza_(third_generation)
 *  https://ndautorepairs.co.uk/remapping/subaru-impreza-2008-2-5t-wrx-sti-300hp/
 *  https://en.wikipedia.org/wiki/Subaru_Impreza_WRX_STI
 *  https://en.wikipedia.org/wiki/Mitsubishi_Lancer_Evolution
 *  https://www.pistonheads.com/news/general-pistonheads/evo-vii-viii-viii-mr-ix-market-watch/29870
 *  https://www.pistonheads.com/road-tests/mitsubishi/evo-viii-fq-300/7002
 *  https://www.evo.co.uk/mitsubishi/6273/mitsubishi-evo
 *  https://www.pistonheads.com/news/ph-buying-guides/mitsubishi-lancer-evo-ix-ph-used-buying-guide/49066
 *  https://www.andrewnoakes.com/blog/mitsubishi-evo-ix-fq340.html
 *  https://ndautorepairs.co.uk/remapping/mitsubishi-lancer-evo-ix-2-0-turbo-280hp/
 *  https://www.parkers.co.uk/mitsubishi/lancer-evo/evo-x-2008/engine-20-petrol/specs/
 *  https://www.pistonheads.com/news/ph-buying-guides/mitsubishi-evo-x-ph-used-buying-guide/44530
 *  https://paultan.org/2009/05/28/new-lancer-evo-x-fq-400-with-525nm-of-torque
 *  https://en.wikipedia.org/wiki/Nissan_370Z
 *  https://en.wikipedia.org/wiki/Nissan_GT-R
 *  https://www.litchfieldmotors.com/nissan-gtr/stage-upgrades
 *  https://en.wikipedia.org/wiki/Nissan_Skyline_GT-R
 *  https://www.autoexpress.co.uk/nissan/104944/nissan-200sxsilvia-s14-buying-guide-and-review-1995-2000
 *  https://parkers.co.uk/nissan/200-sx/review/engines
 *  https://en.autogidas.lt/auto-katalogas/nissan/200-sx/1.8-turbo-1989-1992-k3307
 *  https://en.wikipedia.org/wiki/Nissan_Silvia
 *  https://www.ultimatespecs.com/car-specs/Mazda/7613/Mazda-RX-7-FD-Twin-Turbo.html
 *  https://www.google.co.uk/amp/s/www.evo.co.uk/mazda/rx-7%3famp
 *  https://en.wikipedia.org/wiki/Mazda_RX-8
 *  https://www.cscmotors.com/remapping-stats/BMW/1-series/f2x-lci-2015-2019/m135i-320hp-7870
 *  https://wayside-performance.co.uk/pages/bmw-b58-tuning-guide-m140i-m240i-340i-440i-more-wayside-performance
 *  https://www.encycarpedia.com/bmw/24-m240i-xdrive-koupe
 *  https://en.wikipedia.org/wiki/BMW_M2
 *  https://precision-sport.com/products/evolve-ecu-remap-performance-upgrade-bmw-f87-m2
 *  https://precision-sport.com/products/evolve-ecu-stage-2-remap-performance-upgrade-and-evolve-r-with-catless-downpipe-bmw-f87-m2
 *  https://www.evolveautomotive.co.uk/products/evolve-remap-and-evolve-r-bmw-3-series-e90-e91-e92-e93-335i-n54
 *  https://www.nforcd.com/products/performance-m-remap-software-335i-n55-stage-1-400bhp-stage-2-420bhp
 *  https://en.wikipedia.org/wiki/BMW_M3
 *  https://precision-sport.com/products/evolve-ecu-remap-performance-upgrade-bmw-f80-m3-f82-f83-m4
 *  https://precision-sport.com/products/evolve-ecu-stage-2-remap-performance-upgrade-with-catless-downpipes-bmw-f80-m3-f82-f83-m4
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-amg-a-45-360hp-4matic-amg-speedshift-dct-18632
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-facelift-2015-amg-a-45-381hp-4matic-7g-dct-23381
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/a-class/w176-2012-2015/a45-amg-360hp-3349
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/a-class/w177-2018/a45-amg-s-421hp-3371
 *  https://vehiclescore.co.uk/cars/mercedes-benz/c-class/w204-2007-2014/6-2-petrol-457ps-petrol/c63-amg-automatic-saloon
 *  https://www.encycarpedia.com/mercedes/10-c-63-amg-performance-package-saloon
 *  https://www.automobile.at/magazin/36487
 *  https://zeperfs.com/en/fiche5720-mercedes-c-63-amg-s.htm
 *  https://rushmagazine.co.uk/rush-radars/rush-radar-hyundai-i20-n
 *  https://www.dev.honestjohn.co.uk/hyundai/i30/n
 *  https://www.forgemotorsport.co.uk/Hyundai_i30N_i30N_Facelift_Kona_N_Remap_Stage_1_and_2_Available--product--1757.html
 *  https://cdn.uc.assets.prezly.com/de277550-9cc4-4278-9e71-b237625a0554/-/inline/no/KonaN-TechSpecs_ENG.pdf
 *  https://www.topgear.com/car-reviews/kia/stinger/33-t-gdi-gt-s-5dr-auto/spec
 *  https://en.wikipedia.org/wiki/Porsche_996
 *  https://en.wikipedia.org/wiki/Porsche_997
 *  https://en.wikipedia.org/wiki/Porsche_991
 *  https://en.wikipedia.org/wiki/Porsche_992
 *  https://en.wikipedia.org/wiki/Porsche_Cayman
 *  https://en.wikipedia.org/wiki/Lotus_Elise
 *  https://en.wikipedia.org/wiki/Lotus_Exige
 *  https://www.evo.co.uk/caterham/7/caterham-seven-engine-and-gearbox
 *  https://www.encycarpedia.com/top/highest-torque-caterhams
 *  https://www.autocar.co.uk/car-review/caterham/seven-620s/specs
 *  https://www.carkeys.co.uk/car-reviews/2018-ford-mustang-gt-review
 *  https://www.honestjohn.co.uk/ford/mustang/2015/
 *  https://en.wikipedia.org/wiki/Nissan_SR20DET
 *  https://en.wikipedia.org/wiki/Nissan_RB_engine
 *  https://en.wikipedia.org/wiki/Nissan_300ZX
 *  https://www.carsensor.net/catalog/nissan/silvia/
 *  https://www.carsensor.net/catalog/nissan/silvia/F001/
 *  https://www.carsensor.net/catalog/nissan/silvia/F001/M001G001/
 *  https://www.carsensor.net/catalog/nissan/silvia/F001/M001G017/
 *  https://www.carsensor.net/catalog/nissan/silvia/F001/M002G009/
 *  https://www.carsensor.net/catalog/nissan/silvia/F001/M002G001/
 *  https://www.carsensor.net/catalog/nissan/silvia/F002/
 *  https://www.carsensor.net/catalog/nissan/silvia/F002/M001G005/
 *  https://www.carsensor.net/catalog/nissan/silvia/F002/M003G005/
 *  https://www.carsensor.net/catalog/nissan/silvia/F002/M001G011/
 *  https://www.carsensor.net/catalog/nissan/silvia/F003/
 *  https://www.carsensor.net/catalog/nissan/silvia/F003/M001G005/
 *  https://www.carsensor.net/catalog/nissan/silvia/F003/M001G011/
 *  https://www.carsensor.net/catalog/nissan/180sx/
 *  https://www.carsensor.net/catalog/nissan/180sx/F001/
 *  https://www.carsensor.net/catalog/nissan/180sx/F001/M001G001/
 *  https://www.carsensor.net/catalog/nissan/180sx/F001/M002G001/
 *  https://www.carsensor.net/catalog/nissan/180sx/F001/M003G001/
 *  https://www.carsensor.net/catalog/nissan/180sx/F001/M005G001/
 *  https://www.carsensor.net/catalog/nissan/180sx/F001/M005G009/
 *  https://www.carsensor.net/catalog/nissan/skyline/
 *  https://www.carsensor.net/catalog/nissan/skyline/F002/
 *  https://www.carsensor.net/catalog/nissan/skyline/F002/M001G006/
 *  https://www.carsensor.net/catalog/nissan/skyline/F002/M001G002/
 *  https://www.carsensor.net/catalog/nissan/skyline/F003/
 *  https://www.carsensor.net/catalog/nissan/skyline/F003/M001G003/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F001/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F001/M001G001/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F001/M001G005/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F001/M002G003/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F002/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F002/M001G001/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F002/M001G004/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F003/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F003/M001G001/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F003/M001G003/
 *  https://www.carsensor.net/catalog/nissan/skyline_coupe/F003/M001G005/
 *  https://www.carsensor.net/catalog/nissan/stagea/
 *  https://www.carsensor.net/catalog/nissan/stagea/F001/
 *  https://www.carsensor.net/catalog/nissan/stagea/F001/M002G009/
 *  https://www.carsensor.net/catalog/nissan/stagea/F001/M003G001/
 *  https://www.carsensor.net/catalog/nissan/stagea/F001/M003G004/
 *  https://www.carsensor.net/catalog/nissan/stagea/F001/M002G012/
 *  https://www.carsensor.net/catalog/nissan/stagea/F001/M003G021/
 *  https://www.carsensor.net/catalog/nissan/laurel/
 *  https://www.carsensor.net/catalog/nissan/laurel/F001/
 *  https://www.carsensor.net/catalog/nissan/laurel/F001/M001G001/
 *  https://www.carsensor.net/catalog/nissan/laurel/F002/
 *  https://www.carsensor.net/catalog/nissan/laurel/F002/M002G014/
 *  https://www.carsensor.net/catalog/nissan/laurel/F003/
 *  https://www.carsensor.net/catalog/nissan/laurel/F003/M001G011/
 *  https://www.carsensor.net/catalog/nissan/laurel/F003/M002G015/
 *  https://www.carsensor.net/catalog/nissan/laurel/F003/M004G010/
 *  https://www.carsensor.net/catalog/nissan/cefiro/
 *  https://www.carsensor.net/catalog/nissan/cefiro/F001/
 *  https://www.carsensor.net/catalog/nissan/cefiro/F001/M001G014/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M001G007/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M001G011/
 *  https://auto-data.net/en/nissan-300-zx-z32-3.0-twin-turbo-283hp-534
 *  https://www.carsensor.net/catalog/toyota/chaser/
 *  https://www.carsensor.net/catalog/toyota/chaser/F002/
 *  https://www.carsensor.net/catalog/toyota/chaser/F002/M001G002/
 *  https://www.carsensor.net/catalog/toyota/chaser/F003/
 *  https://www.carsensor.net/catalog/toyota/chaser/F003/M001G001/
 *  https://221616.com/catalog/toyota/markii/200010_200411/
 *  https://221616.com/catalog/toyota/markii/200010_200411/1008664/
 *  https://221616.com/catalog/toyota/markii/200010_200411/1011700/
 *  https://221616.com/catalog/toyota/markii/199609_200010/
 *  https://221616.com/catalog/toyota/markii/199609_200010/1001095/
 *  https://221616.com/catalog/toyota/markii/199210_199609/
 *  https://221616.com/catalog/toyota/markii/199210_199609/1001121/
 *  https://221616.com/catalog/toyota/cresta/
 *  https://221616.com/catalog/toyota/cresta/199609_200106/
 *  https://221616.com/catalog/toyota/cresta/199609_200106/1001207/
 *  https://221616.com/catalog/toyota/cresta/199210_199609/
 *  https://221616.com/catalog/toyota/cresta/199210_199609/1001257/
 *  https://www.carsensor.net/catalog/toyota/verossa/
 *  https://www.carsensor.net/catalog/toyota/verossa/F001M002/list.html
 *  https://www.carsensor.net/catalog/toyota/verossa/F001/M002G001/
 *  https://www.carsensor.net/catalog/toyota/aristo/
 *  https://www.carsensor.net/catalog/toyota/aristo/F001/
 *  https://www.carsensor.net/catalog/toyota/aristo/F001/M001G001/
 *  https://www.carsensor.net/catalog/toyota/aristo/F002/
 *  https://www.carsensor.net/catalog/toyota/aristo/F002/M001G001/
 *  https://www.carsensor.net/catalog/toyota/aristo/F002/M003G001/
 *  https://www.carsensor.net/catalog/toyota/soarer/
 *  https://www.carsensor.net/catalog/toyota/soarer/F002/
 *  https://www.carsensor.net/catalog/toyota/soarer/F002/M001G006/
 *  https://www.carsensor.net/catalog/toyota/soarer/F002/M003G008/
 *  https://www.carsensor.net/catalog/toyota/soarer/F002/M007G006/
 *  https://www.carsensor.net/catalog/toyota/soarer/F002/M003G003/
 *  https://www.carsensor.net/catalog/toyota/altezza/
 *  https://www.carsensor.net/catalog/toyota/altezza/F001/
 *  https://www.carsensor.net/catalog/toyota/altezza/F001/M001G001/
 *  https://www.carsensor.net/catalog/toyota/altezza/F001/M001G003/
 *  https://www.carsensor.net/catalog/toyota/starlet/
 *  https://www.carsensor.net/catalog/toyota/starlet/F001/
 *  https://www.carsensor.net/catalog/toyota/starlet/F001/M001G001/
 *  https://www.carsensor.net/catalog/toyota/starlet/F001/M005G001/
 *  https://www.carsensor.net/catalog/toyota/corolla_levin/
 *  https://www.carsensor.net/catalog/toyota/corolla_levin/F003/
 *  https://www.carsensor.net/catalog/toyota/corolla_levin/F003/M001G001/
 *  https://www.carsensor.net/catalog/toyota/corolla_levin/F003/M001G004/
 *  https://www.carsensor.net/catalog/toyota/corolla_levin/F004/
 *  https://www.carsensor.net/catalog/toyota/corolla_levin/F004/M001G003/
 *  https://www.carsensor.net/catalog/toyota/corolla_levin/F004/M003G001/
 *  https://www.carsensor.net/catalog/toyota/celica/
 *  https://www.carsensor.net/catalog/toyota/celica/F001/
 *  https://www.carsensor.net/catalog/toyota/celica/F001/M001G013/
 *  https://www.carsensor.net/catalog/toyota/celica/F001/M003G011/
 *  https://www.carsensor.net/catalog/toyota/celica/F002/
 *  https://www.carsensor.net/catalog/toyota/celica/F002/M001G009/
 *  https://www.carsensor.net/catalog/toyota/celica/F002/M004G007/
 *  https://www.carsensor.net/catalog/toyota/supra/
 *  https://www.carsensor.net/catalog/toyota/supra/F001/
 *  https://www.carsensor.net/catalog/toyota/supra/F001/M003G005/
 *  https://www.carsensor.net/catalog/toyota/supra/F001/M003G006/
 *  https://www.carsensor.net/catalog/toyota/supra/F001/M005G006/
 *  https://auto-data.net/en/lexus-is-i-xe10-200-155hp-5929
 *  https://cars-data.com/en/lexus/is/xe10/200-18426--18426/specs
 *  https://en.wikipedia.org/wiki/Honda_Integra_Type_R
 *  https://ja.wikipedia.org/wiki/ホンダ・インテグラタイプR
 *  https://en.wikipedia.org/wiki/Mitsubishi_GTO
 *  https://en.wikipedia.org/wiki/Mitsubishi_FTO
 *  https://en.wikipedia.org/wiki/Mazda_RX-7
 *  https://en.wikipedia.org/wiki/Daihatsu_Copen
 *  https://www.carsensor.net/catalog/honda/integra_r/F001/
 *  https://www.carsensor.net/catalog/honda/integra_r/F001/M001G001/
 *  https://www.carsensor.net/catalog/honda/integra_r/F001/M003G001/
 *  https://www.carsensor.net/catalog/honda/integra_r/F001/M004G001/
 *  https://www.carsensor.net/catalog/honda/integra_r/F002/M003G001/
 *  https://www.carsensor.net/catalog/honda/integra/F003/M003G001/
 *  https://www.carsensor.net/catalog/honda/civic_type_r/F003/
 *  https://www.carsensor.net/catalog/honda/civic_type_r/F003/M001G001/
 *  https://www.carsensor.net/catalog/honda/civic/F002/M001G009/
 *  https://www.carsensor.net/catalog/honda/civic/F002/M003G009/
 *  https://www.carsensor.net/catalog/honda/civic/F003/M001G009/
 *  https://www.carsensor.net/catalog/honda/accord/F003/M004G014/
 *  https://www.carsensor.net/catalog/honda/accord/F003/M005G014/
 *  https://www.carsensor.net/catalog/honda/accord/F004/
 *  https://www.carsensor.net/catalog/honda/accord/F004/M001G008/
 *  https://www.carsensor.net/catalog/honda/accord/F004/M004G007/
 *  https://www.carsensor.net/catalog/honda/prelude/F002/M001G005/
 *  https://www.carsensor.net/catalog/honda/prelude/F002/M004G006/
 *  https://www.carsensor.net/catalog/honda/prelude/F003/M001G005/
 *  https://www.carsensor.net/catalog/honda/prelude/F003/M001G007/
 *  https://www.carsensor.net/catalog/honda/prelude/F003/M001G013/
 *  https://www.carsensor.net/catalog/honda/beat/F001/M001G001/
 *  https://www.carsensor.net/catalog/honda/cr-x_delsol/F001/M003G005/
 *  https://www.ultimatespecs.com/car-specs/Honda/7850/Honda-Accord-VI-(EU)-Type-R.html
 *  https://www.carsensor.net/catalog/mazda/savanna_rx-7/F001/M001G003/
 *  https://www.carsensor.net/catalog/mazda/savanna_rx-7/F001/M002G003/
 *  https://www.carsensor.net/catalog/mazda/rx-7/F001/M003G002/
 *  https://www.carsensor.net/catalog/mazda/rx-7/F001/M001G001/
 *  https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G007/
 *  https://www.carsensor.net/catalog/mazda/roadster/F001/M001G001/
 *  https://www.carsensor.net/catalog/mazda/roadster/F001/M005G001/
 *  https://www.ultimatespecs.com/car-specs/Mazda/7612/Mazda-RX-7-FC-Turbo-II.html
 *  https://www.ultimatespecs.com/car-specs/Mazda/7611/Mazda-RX-7-FC-Turbo-II.html
 *  https://www.ultimatespecs.com/car-specs/Mazda/1233/Mazda-3-MPS-23-MZR-DISI-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Mazda/11233/Mazda-3-II-MPS-5p-23-DISI-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Mazda/878/Mazda-6-Sedan-MPS-23-DISI-Turbo.html
 *  https://www.carsensor.net/catalog/mitsubishi/gto/F001/
 *  https://www.carsensor.net/catalog/mitsubishi/gto/F001/M001G001/
 *  https://www.carsensor.net/catalog/mitsubishi/gto/F001/M004G001/
 *  https://www.carsensor.net/catalog/mitsubishi/gto/F001/M004G004/
 *  https://www.carsensor.net/catalog/mitsubishi/gto/F001/M008G001/
 *  https://www.ultimatespecs.com/car-specs/Mitsubishi/6900/Mitsubishi-3000GT-30-V6.html
 *  https://www.ultimatespecs.com/car-specs/Mitsubishi/6899/Mitsubishi-3000GT-30-V6.html
 *  https://www.carsensor.net/catalog/mitsubishi/fto/F001/M001G001/
 *  https://www.carsensor.net/catalog/mitsubishi/fto/F001/M003G007/
 *  https://www.carsensor.net/catalog/mitsubishi/lancer_evolution/F001/M003G001/
 *  https://www.carsensor.net/catalog/mitsubishi/lancer_evolution/F002/M001G001/
 *  https://www.carsensor.net/catalog/mitsubishi/lancer_evolution/F002/M002G001/
 *  https://www.carsensor.net/catalog/mitsubishi/lancer_evolution/F002/M003G001/
 *  https://www.carsensor.net/catalog/mitsubishi/lancer_evolution/F002/M004G001/
 *  https://www.carsensor.net/catalog/mitsubishi/galant/F003/M001G009/
 *  https://www.carsensor.net/catalog/subaru/legacy_b4/F001/M001G001/
 *  https://www.carsensor.net/catalog/subaru/legacy_b4/F001/M004G001/
 *  https://www.carsensor.net/catalog/subaru/legacy_b4/F001/M004G002/
 *  https://www.carsensor.net/catalog/subaru/legacy_b4/F002/M001G001/
 *  https://www.carsensor.net/catalog/subaru/legacy_b4/F002/M001G002/
 *  https://www.carsensor.net/catalog/subaru/legacy_touring_wgn/F003/M001G003/
 *  https://www.carsensor.net/catalog/subaru/forester/F002/M003G010/
 *  https://www.carsensor.net/catalog/daihatsu/copen/F001/M001G001/
 *  https://www.carsensor.net/catalog/daihatsu/copen/F001/M001G002/
 *  https://www.ultimatespecs.com/car-specs/Daihatsu/4827/Daihatsu-Copen-07.html
 *  https://www.ultimatespecs.com/car-specs/Daihatsu/4826/Daihatsu-Copen-13-16v.html
 *  https://en.wikipedia.org/wiki/Ford_Escort_RS2000
 *  https://en.wikipedia.org/wiki/Volkswagen_Corrado
 *  https://de.wikipedia.org/wiki/VW_Corrado
 *  https://en.wikipedia.org/wiki/Mercedes-Benz_190E_2.3-16
 *  https://de.wikipedia.org/wiki/Mercedes-Benz_W_201
 *  https://www.ultimatespecs.com/car-specs/Mercedes-Benz/M67/W201
 *  https://www.ultimatespecs.com/car-specs/Mercedes-Benz/265/Mercedes-Benz-W201-190-E-23-16.html
 *  https://www.ultimatespecs.com/car-specs/Mercedes-Benz/1972/Mercedes-Benz-W201-190-E-25-16-Evolution-II.html
 *  https://www.ultimatespecs.com/car-specs/Mercedes-Benz/2222/Mercedes-Benz-W201-190E-25-16-Cat.html
 *  https://www.ultimatespecs.com/car-specs/Mercedes-Benz/264/Mercedes-Benz-W201-190-E.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7106/Ford-Escort-V-RS-2000i.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7115/Ford-Escort-VI-RS-2000i.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7085/Ford-Escort-III-16-RS-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7088/Ford-Escort-IV-16-RS-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Ford/248/Ford-Escort-III-16-XR3i.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7090/Ford-Escort-IV-16-XR3i.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7098/Ford-Escort-V-18-XR3i.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7099/Ford-Escort-V-18-XR3i.html
 *  https://www.ultimatespecs.com/car-specs/Ford/244/Ford-Fiesta-2-XR-2.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7142/Ford-Fiesta-3-16-RS-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7145/Ford-Fiesta-3-16-XR2i.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7143/Ford-Fiesta-3-18-XR2i---RS.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7262/Ford-Puma-17i-16v.html
 *  https://en.wikipedia.org/wiki/Ford_Puma_(sport_compact)
 *  https://de.wikipedia.org/wiki/Ford_Puma_’98
 *  https://www.ultimatespecs.com/car-specs/Ford/14947/Ford-Sierra-Mk-I-3-door-Cosworth-RS500.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7311/Ford-Sierra-Mk-II-4-door-Sapphire-20-RS-Cosworth.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7309/Ford-Sierra-Mk-II-5-door-28i-XR4x4.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7310/Ford-Sierra-Mk-II-5-door-29i-XR4x4-Kat.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7165/Ford-Focus-1-3-door-ST-170.html
 *  https://www.ultimatespecs.com/car-specs/Ford/7077/Ford-Capri-Mk-III-28-Injection.html
 *  https://www.ultimatespecs.com/car-specs/Volkswagen/3097/Volkswagen-Golf-3-28-VR6.html
 *  https://www.ultimatespecs.com/car-specs/Volkswagen/43974/Volkswagen-Golf-4-3-doors-28-V6-204HP-4Motion.html
 *  https://www.ultimatespecs.com/car-specs/Volkswagen/41984/Volkswagen-Golf-4-3-doors-GTI-23-VR5-150HP.html
 *  https://en.wikipedia.org/wiki/Volkswagen_Golf_Mk4
 *  https://www.ultimatespecs.com/car-specs/Volkswagen/2912/Volkswagen-Lupo-16-16v-GTI.html
 *  https://www.ultimatespecs.com/car-specs/Volkswagen/3012/Volkswagen-Polo-2F-86C-Coupe-G40.html
 *  https://www.ultimatespecs.com/car-specs/Peugeot/2188/Peugeot-306-GTI.html
 *  https://www.ultimatespecs.com/car-specs/Peugeot/2195/Peugeot-306-GTI.html
 *  https://en.wikipedia.org/wiki/Peugeot_306
 *  https://www.ultimatespecs.com/car-specs/Peugeot/2066/Peugeot-106-Rallye-13i.html
 *  https://www.ultimatespecs.com/car-specs/Peugeot/2073/Peugeot-106-Rallye-16.html
 *  https://www.ultimatespecs.com/car-specs/Peugeot/2068/Peugeot-106-XSi-16.html
 *  https://www.ultimatespecs.com/car-specs/Peugeot/2072/Peugeot-106-GTI-16-16v.html
 *  https://www.ultimatespecs.com/car-specs/Peugeot/1236/Peugeot-309-19-GTi-8v.html
 *  https://www.ultimatespecs.com/car-specs/Renault/6375/Renault-Super-5-GT-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Renault/1234/Renault-Super-5-GT-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Renault/6405/Renault-Clio-1-Phase-1-Williams.html
 *  https://www.ultimatespecs.com/car-specs/Renault/6411/Renault-Clio-1-Phase-2-Williams-16v.html
 *  https://www.ultimatespecs.com/car-specs/Renault/6406/Renault-Clio-1-Phase-1-18-16v.html
 *  https://en.wikipedia.org/wiki/Renault_Clio_Williams
 *  https://en.wikipedia.org/wiki/Renault_Clio_V6_Renault_Sport
 *  https://www.ultimatespecs.com/car-specs/MG/6852/MG-ZR-160.html
 *  https://www.ultimatespecs.com/car-specs/MG/6851/MG-ZR-105.html
 *  https://en.wikipedia.org/wiki/MG_ZR
 *  https://www.ultimatespecs.com/car-specs/MG/6870/MG-ZS-180.html
 *  https://www.ultimatespecs.com/car-specs/MG/6879/MG-ZT-190.html
 *  https://www.ultimatespecs.com/car-specs/MG/6873/MG-ZT-260.html
 *  https://en.wikipedia.org/wiki/MG_ZT
 *  https://www.ultimatespecs.com/car-specs/MG/6845/MG-F-18i.html
 *  https://www.ultimatespecs.com/car-specs/MG/6843/MG-F-18i-VVC.html
 *  https://www.ultimatespecs.com/car-specs/MG/6842/MG-F-160.html
 *  https://www.ultimatespecs.com/car-specs/MG/6849/MG-TF-135.html
 *  https://www.ultimatespecs.com/car-specs/MG/6847/MG-TF-160.html
 *  https://www.ultimatespecs.com/car-specs/Rover/5940/Rover-200-II-Coupe-220-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Rover/6007/Rover-Mini-Cooper.html
 *  https://www.ultimatespecs.com/car-specs/BMW/1501/BMW-E30-3-Series-325i.html
 *  https://www.ultimatespecs.com/car-specs/BMW/1502/BMW-E30-3-Series-325i-Kat.html
 *  https://www.ultimatespecs.com/car-specs/BMW/1478/BMW-E30-3-Series-318is.html
 *  https://www.ultimatespecs.com/car-specs/BMW/37913/BMW-E36-3-Series-Coupe-318is-.html
 *  https://www.ultimatespecs.com/car-specs/BMW/160/BMW-E36-3-Series-Sedan-323i.html
 *  https://www.ultimatespecs.com/car-specs/BMW/142410/BMW-E36-3-Series-Coupe-328i.html
 *  https://www.ultimatespecs.com/car-specs/BMW/4992/BMW-E46-3-Series-Coupe-325Ci.html
 *  https://www.ultimatespecs.com/car-specs/BMW/4990/BMW-E46-3-Series-Coupe-330Ci.html
 *  https://www.ultimatespecs.com/car-specs/BMW/41242/BMW-E36-3-Series-Compact-323ti.html
 *  https://www.ultimatespecs.com/car-specs/BMW/180/BMW-E39-5-Series-540i.html
 *  https://www.ultimatespecs.com/car-specs/Vauxhall/71341/Vauxhall-Nova-13-SR.html
 *  https://www.ultimatespecs.com/car-specs/Vauxhall/71347/Vauxhall-Nova-16-GSI.html
 *  https://www.ultimatespecs.com/car-specs/Opel/3397/Opel-Kadett-E-20-GSi-20SEH.html
 *  https://www.ultimatespecs.com/car-specs/Opel/3398/Opel-Kadett-E-20-GSi-16v.html
 *  https://en.wikipedia.org/wiki/Opel_Kadett_E
 *  https://www.ultimatespecs.com/car-specs/Vauxhall/109126/Vauxhall-Calibra-20i-16v.html
 *  https://www.ultimatespecs.com/car-specs/Vauxhall/109123/Vauxhall-Calibra-20i-Turbo-4x4.html
 *  https://www.ultimatespecs.com/car-specs/Vauxhall/109124/Vauxhall-Calibra-25i-V6.html
 *  https://www.ultimatespecs.com/car-specs/Vauxhall/71313/Vauxhall-Astra-mk4-Coupe-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Opel/3507/Opel-Vectra-A-2000.html
 *  https://www.ultimatespecs.com/car-specs/Opel/3495/Opel-Vectra-A-20i-Turbo-4x4.html
 *  https://www.auto-data.net/en/volkswagen-golf-viii-variant-r-2.0-tsi-320hp-4motion-dsg-43837
 *  https://www.auto-data.net/en/volkswagen-golf-viii-variant-facelift-2024-r-2.0-tsi-333hp-4motion-dsg-52150
 *  https://www.auto-data.net/en/volkswagen-golf-viii-gte-1.4-tsi-245hp-ehybrid-dsg-41337
 *  https://www.auto-data.net/en/volkswagen-golf-viii-facelift-2024-gte-1.5-tsi-272hp-ehybrid-dsg-51779
 *  https://www.auto-data.net/en/volkswagen-golf-viii-facelift-2024-gti-edition-50-2.0-tsi-325hp-dsg-55683
 *  https://www.auto-data.net/en/volkswagen-t-roc-i-r-2.0-tsi-300hp-4motion-dsg-37737
 *  https://www.auto-data.net/en/volkswagen-t-roc-i-facelift-2022-r-2.0-tsi-300hp-opf-4motion-dsg-45887
 *  https://www.auto-data.net/en/volkswagen-arteon-facelift-2020-r-2.0-tsi-320hp-4motion-dsg-41896
 *  https://www.auto-data.net/en/volkswagen-arteon-shooting-brake-facelift-2020-r-2.0-tsi-320hp-4motion-dsg-41897
 *  https://www.auto-data.net/en/volkswagen-tiguan-ii-facelift-2020-r-2.0-tsi-320hp-4motion-dsg-41760
 *  https://www.auto-data.net/en/volkswagen-id.3-facelift-2023-gtx-84-kwh-286hp-51903
 *  https://www.auto-data.net/en/volkswagen-id.3-facelift-2023-gtx-performance-84-kwh-326hp-52414
 *  https://www.auto-data.net/en/volkswagen-id.4-gtx-82-kwh-299hp-4motion-43344
 *  https://www.auto-data.net/en/volkswagen-id.4-gtx-82-kwh-340hp-4motion-50075
 *  https://www.auto-data.net/en/audi-rs3-sportback-8y-facelift-2024-2.5-tfsi-400hp-quattro-s-tronic-52529
 *  https://www.auto-data.net/en/audi-rs4-avant-b9-facelift-2019-2.9-tfsi-v6-450hp-quattro-tiptronic-37741
 *  https://www.auto-data.net/en/audi-rs4-avant-b9-facelift-2019-edition-25-years-2.9-tfsi-v6-470hp-quattro-tiptronic-51964
 *  https://www.auto-data.net/en/audi-rs5-coupe-ii-f5-2.9-tfsi-450hp-quattro-tiptronic-29518
 *  https://www.auto-data.net/en/audi-rs5-coupe-ii-f5-facelift-2020-2.9-tfsi-v6-450hp-quattro-tiptronic-38244
 *  https://www.auto-data.net/en/audi-rs6-avant-c7-4.0-tfsi-v8-560hp-quattro-tiptronic-19126
 *  https://www.auto-data.net/en/audi-rs6-avant-c7-facelift-2014-4.0-tfsi-v8-560hp-quattro-tiptronic-46206
 *  https://www.auto-data.net/en/audi-rs6-avant-c7-facelift-2014-4.0-tfsi-v8-performance-605hp-quattro-tiptronic-22440
 *  https://www.auto-data.net/en/audi-rs6-avant-c8-4.0-tfsi-v8-600hp-mild-hybrid-quattro-tiptronic-cod-37659
 *  https://www.auto-data.net/en/audi-rs6-avant-c8-performance-4.0-tfsi-v8-630hp-mild-hybrid-quattro-tiptronic-46941
 *  https://www.auto-data.net/en/audi-rsq3-f3-2.5-tfsi-400hp-quattro-s-tronic-37743
 *  https://www.auto-data.net/en/audi-rsq3-sportback-2.5-tfsi-400hp-quattro-s-tronic-37742
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f40-m135i-306hp-xdrive-steptronic-37177
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f40-m135i-306hp-xdrive-steptronic-42485
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f70-m135-300hp-xdrive-steptronic-dct-51934
 *  https://www.auto-data.net/en/bmw-m3-g80-competition-3.0-510hp-m-xdrive-m-steptronic-43388
 *  https://www.auto-data.net/en/bmw-m3-g80-cs-3.0-550hp-m-xdrive-m-steptronic-47312
 *  https://www.auto-data.net/en/bmw-m3-g80-lci-facelift-2024-competition-3.0-530hp-m-xdrive-m-steptronic-51870
 *  https://www.auto-data.net/en/bmw-m3-touring-g81-competition-3.0-510hp-m-steptronic-m-xdrive-46015
 *  https://www.auto-data.net/en/bmw-m3-touring-g81-lci-facelift-2024-competition-3.0-530hp-m-xdrive-m-steptronic-51871
 *  https://www.auto-data.net/en/bmw-m3-touring-g81-lci-facelift-2024-cs-3.0-550hp-m-xdrive-m-steptronic-53597
 *  https://www.auto-data.net/en/bmw-m4-g82-competition-3.0-510hp-m-xdrive-m-steptronic-43389
 *  https://www.auto-data.net/en/bmw-m4-g82-lci-facelift-2024-competition-3.0-530hp-m-xdrive-m-steptronic-51081
 *  https://www.auto-data.net/en/bmw-m4-g82-lci-facelift-2024-cs-3.0-550hp-m-xdrive-m-steptronic-51684
 *  https://www.auto-data.net/en/bmw-m5-g90-4.4-v8-727hp-plug-in-hybrid-m-xdrive-m-steptronic-52105
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-330e-292hp-plug-in-hybrid-steptronic-37654
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-amg-c-43-408hp-eq-boost-4matic-amg-speedshift-mct-9g-45710
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-amg-c-43-421hp-eq-boost-4matic-amg-speedshift-mct-9g-52979
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-amg-c-63-s-e-performance-680hp-plug-in-hybrid-4matic-amg-speedshift-mct-9g-46524
 *  https://www.auto-data.net/en/mercedes-benz-cla-coupe-c118-amg-cla-35-306hp-4matic-amg-speedshift-dct-7g-36973
 *  https://www.auto-data.net/en/mercedes-benz-cla-coupe-c118-facelift-2023-amg-cla-35-306hp-mild-hybrid-4matic-amg-speedshift-dct-8g-47291
 *  https://www.auto-data.net/en/mercedes-benz-gla-h247-amg-gla-45-s-421hp-4matic-dct-39250
 *  https://www.auto-data.net/en/mercedes-benz-gla-h247-amg-gla-35-306hp-4matic-dct-38235
 *  https://www.auto-data.net/en/mercedes-benz-gla-h247-facelift-2023-amg-gla-45-s-421hp-4matic-amg-speedshift-dct-8g-51785
 *  https://www.auto-data.net/en/ford-mustang-vi-gt-5.0-ti-vct-v8-421hp-22129
 *  https://www.auto-data.net/en/ford-mustang-vi-2.3-ecoboost-317hp-22130
 *  https://www.auto-data.net/en/ford-mustang-vi-facelift-2017-mach-1-5.0-ti-vct-v8-460hp-43518
 *  https://www.auto-data.net/en/ford-mustang-vii-gt-5.0-v8-446hp-51123
 *  https://www.auto-data.net/en/ford-mustang-vii-dark-horse-5.0-v8-453hp-51124
 *  https://en.wikipedia.org/wiki/Ford_Mustang_(sixth_generation)
 *  https://www.auto-data.net/en/ford-ranger-iii-double-cab-facelift-2019-raptor-2.0-ecoblue-213hp-4x4-automatic-37769
 *  https://www.auto-data.net/en/ford-ranger-iv-double-cab-raptor-3.0-ecoboost-v6-292hp-e-4wd-automatic-46825
 *  https://www.auto-data.net/en/cupra-formentor-vz5-2.5-tsi-390hp-4drive-dsg-44952
 *  https://www.auto-data.net/en/cupra-formentor-facelift-2024-vz5-2.5-tsi-390hp-4drive-dsg-55857
 *  https://www.auto-data.net/en/cupra-formentor-vz-2.0-tsi-310hp-4drive-dsg-41174
 *  https://www.auto-data.net/en/cupra-formentor-facelift-2024-2.0-tsi-333hp-4drive-dsg-53214
 *  https://www.auto-data.net/en/cupra-ateca-2.0-tsi-300hp-4drive-dsg-34448
 *  https://www.auto-data.net/en/cupra-ateca-facelift-2020-2.0-tsi-300hp-4drive-dsg-41192
 *  https://www.auto-data.net/en/cupra-born-62-kwh-204hp-electric-43458
 *  https://www.auto-data.net/en/cupra-born-e-boost-62-kwh-231hp-electric-45438
 *  https://www.auto-data.net/en/cupra-born-e-boost-82-kwh-231hp-electric-45441
 *  https://www.auto-data.net/en/cupra-born-vz-84-kwh-326hp-electric-52046
 *  https://www.auto-data.net/en/cupra-leon-facelift-2024-2.0-tsi-300hp-dsg-53235
 *  https://www.auto-data.net/en/cupra-leon-facelift-2024-1.5-tsi-272hp-e-hybrid-dsg-53237
 *  https://www.auto-data.net/en/skoda-kodiaq-i-rs-2.0-bitdi-240hp-4x4-dsg-35004
 *  https://www.auto-data.net/en/skoda-kodiaq-i-facelift-2021-rs-2.0-tsi-245hp-4x4-dsg-43763
 *  https://www.auto-data.net/en/skoda-superb-iii-2.0-tsi-280hp-4x4-dsg-21858
 *  https://www.auto-data.net/en/skoda-superb-iii-facelift-2019-2.0-tsi-280hp-4x4-dsg-44958
 *  https://www.auto-data.net/en/hyundai-i30-iii-fastback-n-2.0-t-gdi-250hp-34455
 *  https://www.auto-data.net/en/hyundai-i30-iii-fastback-n-performance-2.0-t-gdi-275hp-34461
 *  https://www.auto-data.net/en/hyundai-i30-iii-fastback-facelift-2020-n-performance-2.0-t-gdi-280hp-43367
 *  https://en.wikipedia.org/wiki/Hyundai_Ioniq_5_N
 *  https://www.auto-data.net/en/hyundai-ioniq-5-facelift-2024-n-84-kwh-650hp-electric-awd-49033
 *  https://en.wikipedia.org/wiki/Kia_EV6
 *  https://www.auto-data.net/en/kia-ev6-gt-long-range-77.4-kwh-585hp-awd-42616
 *  https://www.auto-data.net/en/honda-civic-xi-2.0-i-mmd-184hp-ehev-e-cvt-46986
 *  https://www.auto-data.net/en/alpine-a110-2017-1.8-252hp-automatic-32274
 *  https://www.auto-data.net/en/alpine-a110-2017-s-1.8-292hp-automatic-37288
 *  https://www.auto-data.net/en/alpine-a110-2017-s-1.8-300hp-dct-45125
 *  https://www.auto-data.net/en/alpine-a110-2017-gt-1.8-300hp-dct-45124
 *  https://www.auto-data.net/en/alpine-a110-2017-r-1.8-300hp-dct-48449
 *  https://www.auto-data.net/en/peugeot-308-ii-phase-i-2013-gti-1.6-thp-250hp-21915
 *  https://www.auto-data.net/en/peugeot-308-ii-phase-i-2013-gti-1.6-thp-270hp-21905
 *  https://www.auto-data.net/en/mini-hatch-f66-3-door-jcw-2.0-231hp-steptronic-53767
 *  https://www.auto-data.net/en/mini-electric-cooper-se-f56-32.6-kwh-184hp-37608
 *  https://www.auto-data.net/en/mini-electric-j01-cooper-se-54.2-kwh-218hp-51185
 *  https://www.auto-data.net/en/mini-electric-j01-jcw-54.2-kwh-258hp-54295
 *  https://www.auto-data.net/en/abarth-500e-42-kwh-155hp-electric-48786
 *  https://www.auto-data.net/en/mg-mg4-ev-i-64-kwh-435hp-xpower-awd-49032
 *  https://www.auto-data.net/en/polestar-2-78-kwh-408hp-long-range-dual-motor-awd-36263
 *  https://www.auto-data.net/en/polestar-2-facelift-2023-82-kwh-421hp-long-range-dual-motor-awd-47317
 *  https://www.auto-data.net/en/polestar-2-facelift-2023-82-kwh-476hp-long-range-dual-motor-with-performance-pack-awd-47318
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-facelift-1996-panel-van-2.5-tdi-102hp-l1h1-50418
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-facelift-1996-panel-van-generation-9741
 *  https://www.auto-data.net/en/volkswagen-transporter-model-3317
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-panel-van-generation-9740
 *  https://www.auto-data.net/en/volkswagen-transporter-t5-panel-van-generation-9665
 *  https://www.auto-data.net/en/volkswagen-transporter-t7-panel-van-generation-10125
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-panel-van-1.9-d-61hp-l1h1-50396
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-panel-van-1.9-td-68hp-l1h1-50397
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-panel-van-2.4-d-78hp-l1h1-50398
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-facelift-1996-panel-van-2.5-tdi-88hp-l1h1-50423
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-facelift-1996-panel-van-2.4-d-78hp-l1h1-50419
 *  https://www.auto-data.net/en/volkswagen-transporter-t4-facelift-1996-panel-van-1.9-td-68hp-l1h1-50420
 *  https://www.auto-data.net/en/volkswagen-transporter-t5-panel-van-3.2-v6-235hp-tiptronic-l1h1-49900
 *  https://www.auto-data.net/en/volkswagen-transporter-t7-panel-van-2.0-tdi-110hp-l1h1-52380
 *  https://www.auto-data.net/en/volkswagen-transporter-t7-panel-van-2.0-tdi-150hp-l1h1-52383
 *  https://www.auto-data.net/en/volkswagen-transporter-t7-panel-van-2.0-tdi-170hp-automatic-l1h1-52377
 *  https://www.auto-data.net/en/volkswagen-caddy-model-900
 *  https://www.auto-data.net/en/volkswagen-caddy-panel-van-iv-2.0-tdi-102hp-28473
 *  https://www.auto-data.net/en/volkswagen-caddy-panel-van-iv-2.0-tdi-150hp-28475
 *  https://www.auto-data.net/en/volkswagen-caddy-cargo-v-generation-7962
 *  https://www.auto-data.net/en/volkswagen-caddy-cargo-v-2.0-tdi-102hp-41990
 *  https://www.auto-data.net/en/volkswagen-caddy-cargo-v-2.0-tdi-122hp-41991
 *  https://www.auto-data.net/en/volkswagen-caddy-iii-generation-1892
 *  https://www.auto-data.net/en/volkswagen-caddy-iii-1.9-tdi-105hp-8861
 *  https://www.auto-data.net/en/volkswagen-caddy-iii-2.0-sdi-70hp-8862
 *  https://www.auto-data.net/en/volkswagen-caddy-iii-2.0-tdi-140hp-50628
 *  https://cars-data.com/en/volkswagen/caddy
 *  https://cars-data.com/en/volkswagen/caddy/2010-van
 *  https://cars-data.com/en/volkswagen/caddy/2004
 *  https://cars-data.com/en/volkswagen/caddy/2010-van/l1h1-1-6-tdi-102hp-66096--66096
 *  https://cars-data.com/en/volkswagen/caddy/2010-van/l1h1-1-6-tdi-102hp-66096--66096/specs
 *  https://cars-data.com/en/volkswagen/caddy/2010-van/l1h1-2-0-tdi-140hp-66103--66103
 *  https://cars-data.com/en/volkswagen/caddy/2010-van/l1h1-2-0-tdi-140hp-66103--66103/specs
 *  https://www.auto-data.net/en/volkswagen-amarok-model-2044
 *  https://www.auto-data.net/en/volkswagen-amarok-i-double-cab-generation-4342
 *  https://www.auto-data.net/en/volkswagen-amarok-i-double-cab-facelift-2016-generation-5211
 *  https://www.auto-data.net/en/volkswagen-amarok-i-double-cab-2.0-tdi-180hp-4motion-20560
 *  https://www.auto-data.net/en/volkswagen-amarok-i-double-cab-facelift-2016-3.0-v6-tdi-204hp-4motion-automatic-27099
 *  https://www.auto-data.net/en/volkswagen-amarok-i-double-cab-facelift-2016-3.0-v6-tdi-224hp-4motion-automatic-27100
 *  https://www.auto-data.net/en/volkswagen-amarok-i-double-cab-facelift-2016-3.0-v6-tdi-258hp-4motion-automatic-37808
 *  https://cars-data.com/en/ford/transit-custom
 *  https://cars-data.com/en/ford/transit-custom/2012-van
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579
 *  https://cars-data.com/en/ford/transit-custom/2012-van/l1h1-250-100hp-base--73964
 *  https://cars-data.com/en/ford/transit-custom/2012-van/l1h1-250-100hp-base--73964/specs
 *  https://cars-data.com/en/ford/transit-custom/2012-van/l1h1-270-125hp-ambiente--69680
 *  https://cars-data.com/en/ford/transit-custom/2012-van/l1h1-270-125hp-ambiente--69680/specs
 *  https://cars-data.com/en/ford/transit-custom/2012-van/l1h1-270-155hp-ambiente--69681
 *  https://cars-data.com/en/ford/transit-custom/2012-van/l1h1-270-155hp-ambiente--69681/specs
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-110hp-trend--108103
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-110hp-trend--108103/specs
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-136hp-trend-108106--108106
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-136hp-trend-108106--108106/specs
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-150hp-limited--108108
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-150hp-limited--108108/specs
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-170hp-limited--108109
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4579/l1h1-2-0-ecoblue-170hp-limited--108109/specs
 *  https://www.auto-data.net/en/ford-transit-connect-model-3536
 *  https://www.auto-data.net/en/ford-transit-connect-i-facelift-2006-panel-van-l1h1-generation-10344
 *  https://www.auto-data.net/en/ford-transit-connect-i-facelift-2009-panel-van-l1h1-generation-10308
 *  https://www.auto-data.net/en/ford-transit-connect-ii-panel-van-l1-generation-10292
 *  https://www.auto-data.net/en/ford-transit-connect-ii-facelift-2018-panel-van-l1-generation-10286
 *  https://www.auto-data.net/en/ford-transit-connect-i-facelift-2006-panel-van-l1h1-1.8-tdci-110hp-53546
 *  https://www.auto-data.net/en/ford-transit-connect-i-facelift-2006-panel-van-l1h1-1.8-tdci-90hp-53545
 *  https://www.auto-data.net/en/ford-transit-connect-i-facelift-2006-panel-van-l1h1-1.8-tdci-75hp-53544
 *  https://www.auto-data.net/en/ford-transit-connect-ii-panel-van-l1-1.6-tdci-95hp-53286
 *  https://www.auto-data.net/en/ford-transit-connect-ii-panel-van-l1-1.6-tdci-115hp-53289
 *  https://www.auto-data.net/en/ford-transit-connect-ii-panel-van-l1-1.5-tdci-100hp-53296
 *  https://www.auto-data.net/en/ford-transit-connect-ii-panel-van-l1-1.5-tdci-120hp-53294
 *  https://www.auto-data.net/en/ford-transit-connect-ii-panel-van-l1-1.0-ecoboost-100hp-53290
 *  https://www.auto-data.net/en/ford-transit-connect-ii-facelift-2018-panel-van-l1-1.5-ecoblue-100hp-53241
 *  https://www.auto-data.net/en/ford-transit-connect-ii-facelift-2018-panel-van-l1-1.5-ecoblue-120hp-53243
 *  https://www.auto-data.net/en/mercedes-benz-vito-model-1385
 *  https://cars-data.com/en/mercedes-benz/vito
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van
 *  https://cars-data.com/en/mercedes-benz/vito/2019
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-110-cdi--65828
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-110-cdi--65828/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-113-cdi--65827
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-113-cdi--65827/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-116-cdi--65829
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-116-cdi--65829/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-122-cdi--65830
 *  https://cars-data.com/en/mercedes-benz/vito/2010-van/short-122-cdi--65830/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-109-cdi-88042--88042
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-109-cdi-88042--88042/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-111-cdi-88044--88044
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-111-cdi-88044--88044/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-114-cdi-99164--99164/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-116-cdi-99165--99165/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-119-cdi-99166--99166/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2014-van/short-119-cdi-80611--80611/specs
 *  https://cars-data.com/en/mercedes-benz/vito/2019/evito-long-98375--98375/specs
 *  https://www.auto-data.net/en/renault-trafic-model-1956
 *  https://www.auto-data.net/en/renault-trafic-ii-phase-i-generation-3932
 *  https://www.auto-data.net/en/renault-trafic-ii-phase-ii-generation-4313
 *  https://www.auto-data.net/en/renault-trafic-ii-phase-i-1.9-dci-100hp-l1h1-20313
 *  https://www.auto-data.net/en/renault-trafic-ii-phase-i-1.9-dci-82hp-l1h1-20344
 *  https://cars-data.com/en/renault/trafic
 *  https://cars-data.com/en/renault/trafic/2011-van
 *  https://cars-data.com/en/renault/trafic/2014
 *  https://cars-data.com/en/renault/trafic/2019
 *  https://cars-data.com/en/renault/trafic/2011-van/l1h1-t27-2-0-dci-90--66396
 *  https://cars-data.com/en/renault/trafic/2011-van/l1h1-t27-2-0-dci-90--66396/specs
 *  https://cars-data.com/en/renault/trafic/2011-van/l1h1-t27-2-0-dci-115-66397--66397
 *  https://cars-data.com/en/renault/trafic/2011-van/l1h1-t27-2-0-dci-115-66397--66397/specs
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-95-comfort--87675
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-95-comfort--87675/specs
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-120-comfort--87682
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-120-comfort--87682/specs
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-energy-dci-125-comfort--87686
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-energy-dci-125-comfort--87686/specs
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-energy-dci-145-comfort--87687
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-energy-dci-145-comfort--87687/specs
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-115-comfort--78677
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-115-comfort--78677/specs
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-140-comfort--78684
 *  https://cars-data.com/en/renault/trafic/2014/l1h1-t29-dci-140-comfort--78684/specs
 *  https://cars-data.com/en/renault/trafic/2019/l1h1-dci-120-comfort--97971
 *  https://cars-data.com/en/renault/trafic/2019/l1h1-dci-120-comfort--97971/specs
 *  https://cars-data.com/en/renault/trafic/2019/l1h1-dci-145-comfort-97972--97972
 *  https://cars-data.com/en/renault/trafic/2019/l1h1-dci-145-comfort-97972--97972/specs
 *  https://cars-data.com/en/renault/trafic/2019/l1h1-dci-170-comfort-97974--97974
 *  https://cars-data.com/en/renault/trafic/2019/l1h1-dci-170-comfort-97974--97974/specs
 *  https://www.auto-data.net/en/vauxhall-vivaro-model-2679
 *  https://cars-data.com/en/opel/vivaro
 *  https://cars-data.com/en/opel/vivaro/2011-van
 *  https://cars-data.com/en/opel/vivaro/2014-van
 *  https://cars-data.com/en/opel/vivaro/2019-van
 *  https://cars-data.com/en/opel/vivaro/2011-van/l1h1-2700-2-0-cdti-90--66327
 *  https://cars-data.com/en/opel/vivaro/2011-van/l1h1-2700-2-0-cdti-90--66327/specs
 *  https://cars-data.com/en/opel/vivaro/2011-van/l1h1-2700-2-0-cdti-114--66329
 *  https://cars-data.com/en/opel/vivaro/2011-van/l1h1-2700-2-0-cdti-114--66329/specs
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-95-selection--86495
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-95-selection--86495/specs
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-120-selection--86500
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-120-selection--86500/specs
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-biturbo-125-ecoflex-edition--86503
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-biturbo-125-ecoflex-edition--86503/specs
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-biturbo-145-ecoflex-edition--86505
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-biturbo-145-ecoflex-edition--86505/specs
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-115-selection--78612
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-115-selection--78612/specs
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-biturbo-140-ecoflex-edition--78629
 *  https://cars-data.com/en/opel/vivaro/2014-van/l1h1-2700-1-6-cdti-biturbo-140-ecoflex-edition--78629/specs
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-1-5-diesel-100hp-edition--98482
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-1-5-diesel-100hp-edition--98482/specs
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-1-5-diesel-120hp-edition--98483
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-1-5-diesel-120hp-edition--98483/specs
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-2-0-diesel-122hp-edition--98484
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-2-0-diesel-122hp-edition--98484/specs
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-2-0-diesel-150hp-edition--98486
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-2-0-diesel-150hp-edition--98486/specs
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-2-0-diesel-180hp-edition--98479
 *  https://cars-data.com/en/opel/vivaro/2019-van/l1h1-2-0-diesel-180hp-edition--98479/specs
 *  https://cars-data.com/en/citroen/berlingo
 *  https://cars-data.com/en/citroen/berlingo/b9-2008-van
 *  https://cars-data.com/en/citroen/berlingo/b9-2008-van/1-6-hdi-75-club--66195
 *  https://cars-data.com/en/citroen/berlingo/b9-2008-van/1-6-hdi-75-club--66195/specs
 *  https://cars-data.com/en/citroen/berlingo/b9-2008-van/1-6-e-hdi-90-club-66196--66196
 *  https://cars-data.com/en/citroen/berlingo/b9-2008-van/1-6-e-hdi-90-club-66196--66196/specs
 *  https://en.wikipedia.org/wiki/Honda_B_engine
 *  https://en.wikipedia.org/wiki/Honda_K_engine
 *  https://en.wikipedia.org/wiki/Honda_H_engine
 *  https://en.wikipedia.org/wiki/Honda_D_engine
 *  https://en.wikipedia.org/wiki/Toyota_S_engine
 *  https://en.wikipedia.org/wiki/Toyota_A_engine
 *  https://en.wikipedia.org/wiki/Toyota_ZZ_engine
 *  https://en.wikipedia.org/wiki/Toyota_JZ_engine
 *  https://en.wikipedia.org/wiki/Nissan_SR_engine
 *  https://en.wikipedia.org/wiki/Nissan_CA_engine
 *  https://en.wikipedia.org/wiki/Nissan_VQ_engine
 *  https://en.wikipedia.org/wiki/Nissan_Skyline_(R34)
 *  https://en.wikipedia.org/wiki/Nissan_350Z
 *  https://en.wikipedia.org/wiki/Nissan_Pulsar_GTI-R
 *  https://en.wikipedia.org/wiki/Nissan_Primera
 *  https://en.wikipedia.org/wiki/Mazda_B_engine
 *  https://en.wikipedia.org/wiki/Mazda_Wankel_engine
 *  https://en.wikipedia.org/wiki/Mazda_L_engine
 *  https://en.wikipedia.org/wiki/Mazda_MX-5_(NA)
 *  https://en.wikipedia.org/wiki/Mazda_MX-5_(NB)
 *  https://en.wikipedia.org/wiki/Ford_Zetec_engine
 *  https://en.wikipedia.org/wiki/Ford_Sigma_engine
 *  https://en.wikipedia.org/wiki/Ford_EcoBoost_engine
 *  https://en.wikipedia.org/wiki/Ford_Focus_(first_generation)
 *  https://en.wikipedia.org/wiki/Ford_Focus_(third_generation)
 *  https://en.wikipedia.org/wiki/GM_Family_II_engine
 *  https://en.wikipedia.org/wiki/GM_Ecotec_engine
 *  https://en.wikipedia.org/wiki/LS_based_GM_small-block_engine
 *  https://en.wikipedia.org/wiki/Chevrolet_Corvette_(C7)
 *  https://en.wikipedia.org/wiki/Chevrolet_Corvette_(C4)
 *  https://en.wikipedia.org/wiki/Subaru_EJ_engine
 *  https://en.wikipedia.org/wiki/Subaru_FA_engine
 *  https://en.wikipedia.org/wiki/Subaru_Impreza_(second_generation)
 *  https://en.wikipedia.org/wiki/VR6_engine
 *  https://en.wikipedia.org/wiki/Volkswagen_Golf_Mk3
 *  https://en.wikipedia.org/wiki/Volkswagen_Golf_Mk5
 *  https://en.wikipedia.org/wiki/Volkswagen_Golf_Mk6
 *  https://en.wikipedia.org/wiki/Volkswagen_Golf_Mk7
 *  https://en.wikipedia.org/wiki/Audi_S4
 *  https://en.wikipedia.org/wiki/BMW_M50
 *  https://en.wikipedia.org/wiki/BMW_M52
 *  https://en.wikipedia.org/wiki/BMW_S52
 *  https://en.wikipedia.org/wiki/BMW_S58
 *  https://en.wikipedia.org/wiki/BMW_M57
 *  https://www.cscmotors.com/remapping-stats/Alfa-Romeo/giulia/2016/giulia-2-9-v6-quadrifoglio-510hp-79
 *  https://www.cscmotors.com/remapping-stats/Alfa-Romeo/giulietta/2010-2014/giulietta-1-750-tbi-quadrifogilio-verde-84
 *  https://www.cscmotors.com/remapping-stats/Alfa-Romeo/giulietta/2014-2016/giulietta-1-750-tbi-quadrifogilio-verde-92
 *  https://www.cscmotors.com/remapping-stats/Alfa-Romeo/giulietta/2016/giulietta-1-750-tbi-240hp-99
 *  https://www.cscmotors.com/remapping-stats/Audi/rs3/2021/rs3-2-5-tfsi-400hp-9109
 *  https://www.cscmotors.com/remapping-stats/Audi/rs3/8p-2011-2014/rs3-2-5-tfsi-340hp-838
 *  https://www.cscmotors.com/remapping-stats/Audi/rs4/2017/rs4-2-9-v6-bi-turbo-450hp-844
 *  https://www.cscmotors.com/remapping-stats/Audi/rs4/b5-2001/rs4-2-7-v6-biturbo-380hp-841
 *  https://www.cscmotors.com/remapping-stats/Audi/rs4/b7-2004-2008/rs4-4-2-fsi-v8-420hp-842
 *  https://www.cscmotors.com/remapping-stats/Audi/rs4/b8-2012-2017/rs4-4-2-fsi-450hp-843
 *  https://www.cscmotors.com/remapping-stats/Audi/s1/2014/s1-2-0-tfsi-231hp-857
 *  https://www.cscmotors.com/remapping-stats/Audi/s3/1996-2003-s3-8l/s3-1-8t-20v-210hp-858
 *  https://www.cscmotors.com/remapping-stats/Audi/s3/1996-2003-s3-8l/s3-1-8t-20v-225hp-859
 *  https://www.cscmotors.com/remapping-stats/Audi/s3/2008-2012-s3-8p/s3-2-0-tfsi-265hp-860
 *  https://www.cscmotors.com/remapping-stats/Audi/s3/2020-s3-8y/s3-2-0-tfsi-310hp-8948
 *  https://www.cscmotors.com/remapping-stats/Audi/s4/b5-2000/s4-2-7t-265hp-863
 *  https://www.cscmotors.com/remapping-stats/Audi/s4/b6-2001-2004/s4-4-2-v8-344hp-864
 *  https://www.cscmotors.com/remapping-stats/Audi/s4/b7-2004-2008/s4-4-2-v8-344hp-865
 *  https://www.cscmotors.com/remapping-stats/Audi/s4/b8-2008-2016/s4-3-0-tfsi-333hp-866
 *  https://www.cscmotors.com/remapping-stats/Audi/s4/b9-mk-1-2016-2018/s4-3-0-tfsi-354hp-867
 *  https://www.cscmotors.com/remapping-stats/Audi/s4/b9-mk-2-2019/s4-3-0-tdi-v6-347hp-868
 *  https://www.cscmotors.com/remapping-stats/Audi/tt-r-s/2014-2018-8s/tt-rs-2-5-tfsi-rs-400hp-912
 *  https://www.cscmotors.com/remapping-stats/Audi/tt-r-s/tt-rs-all/tt-rs-2-5-tfsi-rs-340hp-911
 *  https://www.cscmotors.com/remapping-stats/Audi/tt-r-s/tt-rs-all/tt-rs-2-5-tfsi-rs-plus-360hp-913
 *  https://www.cscmotors.com/remapping-stats/Audi/tt-s/2006-2014-8j/tt-s-2-0-tfsi-272hp-914
 *  https://www.cscmotors.com/remapping-stats/Audi/tt-s/2014-2018-8s/tt-s-2-0-tfsi-310hp-916
 *  https://www.cscmotors.com/remapping-stats/Audi/tt/1998-2006-8n/tt-1-8t-20v-225hp-896
 *  https://www.cscmotors.com/remapping-stats/Audi/tt/1998-2006-8n/tt-3-2-v6-250hp-897
 *  https://www.cscmotors.com/remapping-stats/Audi/tt/2006-2014-8j/tt-2-0-tfsi-200hp-900
 *  https://www.cscmotors.com/remapping-stats/Audi/tt/2014-2018-8s/tt-2-0-tfsi-230hp-908
 *  https://www.cscmotors.com/remapping-stats/BMW/1-series/e8x-lci-2007-2011/120d-177hp-930
 *  https://www.cscmotors.com/remapping-stats/BMW/1-series/f2x-2011-2015/120d-184hp-947
 *  https://www.cscmotors.com/remapping-stats/BMW/1-series/f2x-lci-2015-2019/120d-190hp-960
 *  https://www.cscmotors.com/remapping-stats/BMW/2-series/f2x-2013/m235i-326hp-9033
 *  https://www.cscmotors.com/remapping-stats/BMW/3-series/e46-1998-2005/320d-150hp-1034
 *  https://www.cscmotors.com/remapping-stats/BMW/3-series/e9x-2005-2010/320d-177hp-1052
 *  https://www.cscmotors.com/remapping-stats/BMW/3-series/f3x-2011-2015/320d-184hp-1099
 *  https://www.cscmotors.com/remapping-stats/BMW/3-series/f3x-lci-06-2015-2019/320d-190hp-1113
 *  https://www.cscmotors.com/remapping-stats/BMW/3-series/f3x-lci-06-2015-2019/340i-xdrive-326hp-1128
 *  https://www.cscmotors.com/remapping-stats/BMW/3-series/g2x-2019/320d-190hp-1130
 *  https://www.cscmotors.com/remapping-stats/BMW/3-series/g2x-2019/m340i-374hp-1134
 *  https://www.cscmotors.com/remapping-stats/BMW/m2/f87-2016/m2-3-0-biturbo-competition-410hp-1340
 *  https://www.cscmotors.com/remapping-stats/BMW/m3/G8x-2021-present/m3-competition-510hp-9052
 *  https://www.cscmotors.com/remapping-stats/BMW/m3/e46-1998-2005/m3-343hp-1343
 *  https://www.cscmotors.com/remapping-stats/BMW/m3/e46-1998-2005/m3-csl-360hp-1344
 *  https://www.cscmotors.com/remapping-stats/BMW/m3/e90-2005-2011/m3-4-0-v8-420hp-1345
 *  https://www.cscmotors.com/remapping-stats/BMW/m3/f80-2011/bmw-m3-cs-460hp-8835
 *  https://www.cscmotors.com/remapping-stats/BMW/m3/f80-2011/m3-competition-450hp-1347
 *  https://www.cscmotors.com/remapping-stats/BMW/m4/f82-f83-2014/m4-3-0-competition-450hp-1349
 *  https://www.cscmotors.com/remapping-stats/BMW/m4/f82-f83-2014/m4-3-0-cs-460hp-1350
 *  https://www.cscmotors.com/remapping-stats/BMW/m4/f82-f83-2014/m4-3-0-gts-500hp-1351
 *  https://www.cscmotors.com/remapping-stats/Ford/fiesta/mk5-2001-2008/fiesta-2-0i-16v-st-150hp-2222
 *  https://www.cscmotors.com/remapping-stats/Ford/fiesta/mk7-2013-2017/fiesta-st200-1-6t-200hp-2267
 *  https://www.cscmotors.com/remapping-stats/Ford/focus/1998-2005/focus-2-0i-16v-turbo-rs-215hp-2310
 *  https://www.cscmotors.com/remapping-stats/Ford/puma/2019/puma-1-5-t-ecoboost-200hp-7210
 *  https://www.cscmotors.com/remapping-stats/Honda/civic/11th-2022/civic-2-0t-type-r-320hp-8862
 *  https://www.cscmotors.com/remapping-stats/Honda/civic/8th-2006-2012/civic-2-0-type-r-i-vtec-201hp-2787
 *  https://www.cscmotors.com/remapping-stats/Hyundai/i30/2017/i30-2-0-t-gdi-n-250hp-2880
 *  https://www.cscmotors.com/remapping-stats/Kia/ceed/2018/ceed-1-6-t-gdi-gt-204hp-3048
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/a-class/w176-2015-2018/a45-amg-2-0t-381hp-3359
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/a-class/w177-2018/a35-amg-306hp-3369
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/c-class/w204-2007-2010/c63-amg-457hp-3448
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/c-class/w204-2007-2010/c63-amg-ppp-487hp-3449
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/c-class/w205-2014-2018/c43-amg-367hp-3484
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/c-class/w205-2014-2018/c63-amg-476hp-3486
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/c-class/w205-2014-2018/c63-amg-s-510hp-3487
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/c-class/w205-2018/c43-amg-390hp-3496
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/cla/c117-2013-2016/cla-45-amg-360hp-3524
 *  https://www.cscmotors.com/remapping-stats/Mercedes-Benz/cla/c117-2016-2019/cla-45-amg-381hp-3533
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper-s/f56-2014-2018/cooper-s-2-0t-192hp-3733
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper-s/r53-2002-2007/cooper-s-1-6t-163hp-3720
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper-s/r56-2007-2014/cooper-s-1-6t-175hp-3725
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper-s/r56-2007-2014/cooper-s-1-6t-184hp-3727
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper-s/r56-2007-2014/cooper-s-1-6t-gp2-218hp-3728
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper-s/r56-2007-2014/cooper-s-1-6t-jcw-211hp-3730
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper/f56-lci-2018/cooper-1-5t-136hp-3718
 *  https://www.cscmotors.com/remapping-stats/Mini/cooper/r53-2002-2007/cooper-s-1-6t-gp-218hp-3721
 *  https://www.cscmotors.com/remapping-stats/Mitsubishi/lancer-evo/x/lancer-evo-2-0-turbo-295hp-3870
 *  https://www.cscmotors.com/remapping-stats/Nissan/370z/all/370z-3-7-v6-328hp-3908
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/1996-2004-986/boxster-2-5i-204hp-7071
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/1996-2004-986/boxster-2-7i-220hp-7073
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/1996-2004-986/boxster-2-7i-228hp-7074
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/1996-2004-986/boxster-3-2i-252hp-7075
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/1996-2004-986/boxster-3-2i-260hp-7076
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/2005-2011-987/boxster-2-7i-240hp-7078
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/2005-2011-987/boxster-s-3-2i-280hp-7081
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/2005-2011-987/boxster-s-3-4i-310hp-7083
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/2011-2016-981/boxster-2-7i-265hp-7086
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/2011-2016-981/boxster-s-3-4i-315hp-7089
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/2016-718/boxster-2-0t-300hp-7090
 *  https://www.cscmotors.com/remapping-stats/Porsche/boxster/2016-718/boxster-s-2-5t-350hp-7092
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/1997-2006-996/911-3-4i-300hp-7027
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/1997-2006-996/911-3-6i-320hp-7028
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/1997-2006-996/carrera-911-3-6i-turbo-420hp-7034
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2004-2011-997/911-carrera-3-6i-325hp-7039
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2004-2011-997/911-carrera-3-6i-345hp-7040
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2004-2011-997/911-carrera-s-3-8i-355hp-7043
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2004-2011-997/911-carrera-s-3-8i-385hp-7044
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2011-2015-991/911-3-8i-turbo-520hp-7054
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2011-2015-991/911-3-8i-turbo-s-560hp-7055
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2011-2015-991/911-carrera-3-4i-350hp-7057
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2011-2015-991/911-carrera-s-3-8i-400hp-7058
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2016-2018-991-2/911-3-0t-carrera-4-370hp-7060
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2016-2018-991-2/911-3-0t-carrera-s-4s-420hp-7062
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2019-992/911-3-0-carrera-385hp-7068
 *  https://www.cscmotors.com/remapping-stats/Porsche/carrera/2019-992/911-3-0-carrera-s-450hp-7070
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2006-2013-987/cayman-2-7i-245hp-7131
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2006-2013-987/cayman-2-9i-265hp-7133
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2006-2013-987/cayman-3-4i-295hp-7134
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2006-2013-987/cayman-r-3-4i-330hp-7135
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2006-2013-987/cayman-s-3-4i-320hp-7137
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2013-2015-981/cayman-2-7i-275hp-7139
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2013-2015-981/cayman-3-4i-325hp-7140
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2013-2015-981/cayman-gt4-3-8i-385hp-7141
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2013-2015-981/cayman-gts-3-4i-340hp-7142
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2016-718/cayman-2-0t-300hp-7144
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2016-718/cayman-gt4-4-0-420hp-7145
 *  https://www.cscmotors.com/remapping-stats/Porsche/cayman/2016-718/cayman-s-2-5t-350hp-7147
 *  https://www.cscmotors.com/remapping-stats/Renault/clio/2-2001-2005/clio-rs-2-0i-16v-172hp-4590
 *  https://www.cscmotors.com/remapping-stats/Renault/clio/2-2001-2005/clio-rs-2-0i-16v-182hp-4591
 *  https://www.cscmotors.com/remapping-stats/Renault/clio/3-2005-2012/clio-rs-2-0i-16v-197hp-4603
 *  https://www.cscmotors.com/remapping-stats/Renault/clio/4-ph1-2012-2016/clio-rs-1-6t-200hp-4611
 *  https://www.cscmotors.com/remapping-stats/Renault/clio/4-ph2-2016/clio-rs-trophy-1-6t-220hp-4618
 *  https://www.cscmotors.com/remapping-stats/Renault/megane/2-2002-2008/megane-rs-2-0-turbo-225hp-4754
 *  https://www.cscmotors.com/remapping-stats/Renault/megane/2-2002-2008/megane-rs-2-0-turbo-r26r-230hp-4755
 *  https://www.cscmotors.com/remapping-stats/Renault/megane/3-ph1-2008-2012/megane-rs-2-0t-250hp-4770
 *  https://www.cscmotors.com/remapping-stats/Renault/megane/4-2016/megane-rs-1-8-turbo-280hp-4804
 *  https://www.cscmotors.com/remapping-stats/Renault/megane/4-2016/megane-rs-trophy-1-8-turbo-300hp-4805
 *  https://www.cscmotors.com/remapping-stats/Seat/ibiza/2002-2008-6l/ibiza-1-8t-20v-180hp-5081
 *  https://www.cscmotors.com/remapping-stats/Seat/ibiza/2002-2008-6l/ibiza-cupra-1-9-tdi-160hp-5086
 *  https://www.cscmotors.com/remapping-stats/Seat/ibiza/2008-2015-6j/ibiza-1-4-tsi-180hp-cave-5096
 *  https://www.cscmotors.com/remapping-stats/Seat/ibiza/2015-2017-6j/ibiza-1-8-tsi-cupra-192hp-5115
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/1m-2000-2006/leon-1-8t-20v-210hp-5126
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/1m-2000-2006/leon-1-8t-20v-225hp-5127
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/1p-2005-2012/leon-2-0-tfsi-240hp-5148
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/1p-2005-2012/leon-2-0-tfsi-265hp-5149
 *  https://www.cscmotors.com/remapping-stats/Seat/leon/5f-mk1-2012-2017/leon-2-0-tfsi-265hp-5168
 *  https://www.cscmotors.com/remapping-stats/Skoda/fabia/2000-2007/fabia-1-9-tdi-130hp-5219
 *  https://www.cscmotors.com/remapping-stats/Skoda/fabia/2007-2014/fabia-1-4-tsi-rs-180hp-cave-5228
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/1997-2004/octavia-1-8t-20v-180hp-5268
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/2004-2012/octavia-2-0-tfsi-rs-200hp-5287
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/2013-2016/octavia-2-0-tsi-rs-edition-230hp-5301
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/2020/octavia-2-0-tdi-cr-200hp-8979
 *  https://www.cscmotors.com/remapping-stats/Skoda/octavia/2020/octavia-2-0-tsi-rs-245hp-8988
 *  https://www.cscmotors.com/remapping-stats/Vauxhall/astra/k-2015/astra-1-6-turbo-200hp-6286
 *  https://www.cscmotors.com/remapping-stats/Vauxhall/corsa/e-2015-2019/corsa-1-4-turbo-150hp-6338
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-3-1991-1997/golf-2-0i-16v-gti-150hp-5682
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-3-1991-1997/golf-2-0i-8v-gti-115hp-5683
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-4-1997-2003/golf-gti-1-8t-20v-150hp-5772
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-4-1997-2003/golf-gti-1-8t-20v-180hp-5773
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-5-2003-2008/golf-2-0-tfsi-gti-200hp-5717
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-5-2003-2008/golf-gti-2-0-tfsi-edition-30-230hp-5776
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-5-2003-2008/golf-r32-250hp-5720
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-6-2009-2012/golf-2-0-tdi-cr-gtd-170hp-5732
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-6-2009-2012/golf-2-0-tsi-gti-210hp-5733
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-6-2009-2012/golf-2-0-tsi-gti-edition-35-235hp-5734
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-6-2009-2012/golf-2-0-tsi-r-270hp-5735
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-7-2012-2016/golf-2-0-tdi-cr-gtd-184hp-5755
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/golf/golf-8-2020/golf-gtd-2-0-200hp-8855
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/polo/2005-2009-9n3/polo-1-8-t-gti-150hp-5956
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/polo/2009-2014-6r/polo-gti-1-4-tsi-180hp-5971
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/polo/2014-2017-6c/polo-1-8-tsi-gti-192hp-5983
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/scirocco/2008-2014/scirocco-2-0-tsi-200hp-5997
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/scirocco/2008-2014/scirocco-2-0-tsi-r-265hp-5999
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/scirocco/2014/scirocco-2-0-tsi-220hp-6004
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/T6-2019/transporter-multivan-2-0-tdi-150hp-8867
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/T6-2019/transporter-multivan-2-0-tdi-90hp-8865
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t5-2003-2009/transporter-multivan-1-9-tdi-105hp-6140
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t5-2003-2009/transporter-multivan-2-5-tdi-130hp-6142
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t5-2003-2009/transporter-multivan-2-5-tdi-174hp-6143
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t5-2009-2015/transporter-multivan-2-0-tdi-cr-102hp-6144
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t5-2009-2015/transporter-multivan-2-0-tdi-cr-140hp-6146
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t5-2009-2015/transporter-multivan-2-0-tdi-cr-180hp-6147
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t5-2009-2015/transporter-multivan-2-0-tdi-cr-84hp-6148
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t6-2015/transporter-multivan-2-0-tdi-cr-eur-6-102hp-6151
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t6-2015/transporter-multivan-2-0-tdi-cr-eur-6-150hp-6153
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t6-2015/transporter-multivan-2-0-tdi-cr-eur-6-204hp-6154
 *  https://www.cscmotors.com/remapping-stats/Volkswagen/transporter-multivan/t6-2015/transporter-multivan-2-0-tdi-cr-eur-6-84hp-6155
 *  https://www.forgemotorsport.co.uk/Hyundai_i30N_i30N_Facelift_Kona_N_Remap_Stage_1_and_2_Available--product--1757.html (checked, Kona N not given explicitly - not used)
 *  https://www.forgemotorsport.co.uk/Hyundai_i20N_Remap_Stage_1_Stage_2--product--2796.html (checked, no figures on page - not used)
 *  https://www.autoexpress.co.uk/volkswagen/polo/prices-specs/103603/2.0-tsi-gti-edition-25-5dr-dsg
 *  https://www.volkswagen.co.uk/en/life/news/polo-gti-edition-25.html
 *  https://cars-data.com/en/volkswagen/polo/2021/2-0-tsi-gti-edition-25--107463/specs
 *  https://cars-data.com/en/volkswagen/id-3/2023/59kwh-204hp-pro--109189/specs
 *  https://autoexpress.co.uk/volkswagen/367566/forget-netflix-volkswagen-locks-horsepower-behind-paid-subscription
 *  https://cars-data.com/en/volkswagen/id-3/2023/77kwh-204hp-pro-s--107177/specs
 *  https://cars-data.com/en/volkswagen/id-3/2023/79kwh-204hp-pro-s-limited-edition--110655/specs
 *  https://www.volkswagen-newsroom.com/en/press-releases/major-upgrade-for-the-id3-pre-sales-launch-with-pro-s-model-18359
 *  https://www.ultimatespecs.com/car-specs/Ford/7097/Ford-Escort-V-RS-2000i.html
 *  https://cars-data.com/en/ford/transit-custom/2018/l1h1-290-185hp-sport--97873/specs
 *  https://ms-rt.com/model/ford-transit-custom-ms-rt
 *  https://cars-data.com/en/ford/transit-custom/2023-van-4578/e-transit-custom-l1h1-286hp-ms-rt--108118/specs
 *  https://www.auto-data.net/en/opel-vivaro-a-tour-1.9-di-82hp-26197
 *  https://www.auto-data.net/en/opel-vivaro-a-tour-1.9-dti-101hp-26214
 *  https://www.auto-data.net/en/opel-vivaro-a-tour-2.5-cdti-135hp-26290
 *  https://www.auto-data.net/en/opel-vivaro-a-facelift-2006-2.5-cdti-146hp-26791
 *  https://cars-data.com/en/opel/corsa/f-2019-hatchback-6371/11kw-launch-edition--97808/specs
 *  https://www.auto-data.net/en/vauxhall-corsa-f-e-50-kwh-136hp-39161
 *  https://www.auto-data.net/en/vauxhall-corsa-f-facelift-2023-50-kwh-136hp-electric-50977
 *  https://www.auto-data.net/en/vauxhall-corsa-f-facelift-2023-51-kwh-156hp-electric-50978
 *  https://www.auto-data.net/en/rover-25-rf-1.8-i-16v-145hp-11586
 *  https://en.wikipedia.org/wiki/Rover_25
 *  https://www.auto-data.net/en/polestar-2-64-kwh-224hp-standard-range-single-motor-45809
 *  https://www.auto-data.net/en/polestar-2-78-kwh-231hp-long-range-single-motor-45810
 *  https://www.polestar.com/uk/polestar-2/specifications/
 *  https://www.auto-data.net/en/polestar-2-facelift-2023-69-kwh-272hp-standard-range-single-motor-47315
 *  https://www.auto-data.net/en/polestar-2-facelift-2023-82-kwh-299hp-long-range-single-motor-47316
 *  https://www.auto-data.net/en/mg-mg4-ev-i-51-kwh-170hp-standard-range-46259
 *  https://www.auto-data.net/en/mg-mg4-ev-i-64-kwh-204hp-long-range-46260
 *  https://www.auto-data.net/en/mg-mg4-ev-i-77-kwh-245hp-extended-range-54116
 *  https://www.auto-data.net/en/hyundai-ioniq-5-standard-range-58-kwh-170hp-electric-42367
 *  https://www.auto-data.net/en/hyundai-ioniq-5-long-range-72.6-kwh-218hp-electric-42369
 *  https://www.auto-data.net/en/hyundai-ioniq-5-long-range-72.6-kwh-305hp-electric-awd-42370
 *  https://www.auto-data.net/en/hyundai-ioniq-5-77.4-kwh-228hp-electric-44595
 *  https://www.auto-data.net/en/hyundai-ioniq-5-77.4-kwh-325hp-electric-awd-44596
 *  https://www.auto-data.net/en/kia-ev6-standard-range-58-kwh-170hp-42614
 *  https://www.auto-data.net/en/kia-ev6-long-range-77.4-kwh-229hp-42612
 *  https://www.auto-data.net/en/kia-ev6-long-range-77.4-kwh-325hp-awd-42613
 *  https://www.auto-data.net/en/bmw-i4-g26-83.9-kwh-340hp-edrive40-43562
 *  https://www.auto-data.net/en/bmw-i4-g26-m50-83.9-kwh-544hp-xdrive-43563
 *  https://www.auto-data.net/en/bmw-i4-g26-lci-facelift-2024-m50-83.9-kwh-544hp-xdrive-51924
 *  https://www.auto-data.net/en/bmw-i4-g26-lci-facelift-2024-m60-83.9-kwh-601hp-xdrive-54427
 *  https://www.auto-data.net/en/fiat-500-332-e-42-kwh-118hp-42059
 *  https://www.auto-data.net/en/fiat-500-332-e-23.8-kwh-95hp-42058
 *  https://www.auto-data.net/en/renault-5-e-tech-electric-52-kwh-150hp-electric-51291
 *  https://www.auto-data.net/en/renault-5-e-tech-electric-40-kwh-122hp-electric-51290
 *  https://www.polestar.com/uk/news/polestar-2-performance-software-upgrade/
 *  https://ja.wikipedia.org/wiki/%E3%83%9B%E3%83%B3%E3%83%80%E3%83%BB%E3%82%A4%E3%83%B3%E3%83%86%E3%82%B0%E3%83%A9%E3%82%BF%E3%82%A4%E3%83%97R
 *  https://www.carsensor.net/catalog/honda/prelude/F002/M001G001/
 *  https://www.carsensor.net/catalog/honda/prelude/F002/M004G001/
 *  https://www.ultimatespecs.com/car-specs/Honda/7987/Honda-Prelude-IV-20i.html
 *  https://www.ultimatespecs.com/car-specs/Honda/7986/Honda-Prelude-IV-23i.html
 *  https://www.ultimatespecs.com/car-specs/Honda/7984/Honda-Prelude-IV-22i-VTEC-185HP-4WS-BB1.html
 *  https://www.ultimatespecs.com/car-specs/Toyota/5399/Toyota-Supra-MK3-30i.html
 *  https://en.wikipedia.org/wiki/Toyota_Supra
 *  https://www.ultimatespecs.com/car-specs/Toyota/5398/Toyota-Supra-MK3-30i-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Toyota/5246/Toyota-Celica-T180-20i-Turbo-4WD.html
 *  https://en.wikipedia.org/wiki/Toyota_Celica
 *  https://www.carsensor.net/catalog/subaru/impreza_sti/F001/M001G001/
 *  https://www.carsensor.net/catalog/subaru/impreza_sti/F001/M002G001/
 *  https://www.carsensor.net/catalog/subaru/impreza_sti/F001/M003G001/
 *  https://www.carsensor.net/catalog/subaru/impreza_sti/F001/M004G001/
 *  https://www.carsensor.net/catalog/subaru/impreza_sti/F001/M005G001/
 *  https://www.carsensor.net/catalog/subaru/impreza_sti/F001/M006G001/
 *  https://www.carsensor.net/catalog/subaru/forester/F001/M001G003/
 *  https://www.carsensor.net/catalog/subaru/forester/F001/M004G011/
 *  https://www.ultimatespecs.com/car-specs/Subaru/5724/Subaru-Forester-I-20-S-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Subaru/5726/Subaru-Forester-I-20-S-Turbo.html
 *  https://www.ultimatespecs.com/car-specs/Subaru/5764/Subaru-Legacy-I-20-Turbo-4WD.html
 *  https://en.wikipedia.org/wiki/Subaru_Legacy_(first_generation)
 *  https://www.carsensor.net/catalog/nissan/silvia/F002/M003G033/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M002G007/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M003G007/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M002G011/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M003G013/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M004G004/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M005G002/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M004G011/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M005G009/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M006G002/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M006G009/
 *  https://www.carsensor.net/catalog/nissan/fairlady_z/F002/M006G011/
 */
export const CAR_DATA = `
@Volkswagen
=Golf GTI
Mk1|1.6 8v|1979-1982|110p|810|140n|n
Mk1|1.8 8v|1982-1984|112p|860|153n|n
Mk2|1.8 8v|1984-1991|112p|920|157n|n
Mk2 16v|1.8 16v|1986-1991|139p|960|168n|n
Mk3|2.0 8v|1991-1997|115p|1110|166n|n|1:125p
Mk3 16v|2.0 16v|1993-1997|150p|1170|180n|n|1:165p
Mk4|1.8T 20v|1998-2004|150p|1270|210n|t|1:190p,2:210p
Mk4 25th Anniversary|1.8T 20v|2002-2003|180p|1290|235n|t|1:210p,2:220p
Mk4 GTI TDI|1.9 TDI 150|2001-2004|150p|1300|320n|d
Mk5|2.0 TFSI|2004-2009|200p|1336|280n|t|1:240p,2:260p,3:300p
Mk5 Edition 30|2.0 TFSI|2006-2007|230p|1340|300n|t|1:300p,2:320p,3:350p,4:370p
Mk5 Pirelli|2.0 TFSI|2007-2008|230p|1340|300n|t|1:300p,2:320p,3:350p,4:370p
Mk6|2.0 TSI|2009-2013|210p|1318|280n|t|1:260p,2:275p,3:330p
Mk6 Edition 35|2.0 TSI|2011-2012|235p|1350|300n|t|1:300p,2:320p,3:370p,4:400p
Mk7|2.0 TSI|2013-2017|220p|1351|350n|t|1:300p,2:320p
Mk7 Performance|2.0 TSI|2013-2017|230p|1351|350n|t|1:300p,2:320p
Mk7 Clubsport|2.0 TSI|2016-2017|265p|1375|350n|t|1:365p
Mk7 Clubsport S|2.0 TSI|2016-2017|310p|1360|380n|t
Mk7.5|2.0 TSI|2017-2020|230p|1364|350n|t|1:300p,2:320p,3:380p
Mk7.5 Performance|2.0 TSI|2017-2020|245p|1373|370n|t|1:300p,2:320p,3:370p
Mk7.5 TCR|2.0 TSI|2019-2020|290p|1410|370n|t|1:350p,2:390p
Mk8|2.0 TSI|2020-2024|245p|1429|370n|t
Mk8 Clubsport|2.0 TSI|2021-2024|300p|1463|400n|t|1:380p,2:400p,3:430p
Mk8.5|2.0 TSI|2024-|265p|1446|370n|t
Mk8.5 Clubsport|2.0 TSI|2024-|300p|1490|400n|t
=Golf R
Mk4 R32|3.2 VR6|2002-2004|241p|1477|320n|n
Mk5 R32|3.2 VR6|2005-2009|250p|1510|320n|n|1:270p
Mk6|2.0 TSI|2010-2013|270p|1446|350n|t|1:310p,2:330p,3:370p
Mk7|2.0 TSI|2014-2017|300p|1476|380n|t|1:370b,2:410b
Mk7.5|2.0 TSI|2017-2018|310p|1495|380n|t|1:370b,2:410b
Mk7.5 WLTP|2.0 TSI|2018-2020|300p|1505|400n|t|1:370b,2:410b
Mk8|2.0 TSI|2021-2024|320p|1551|420n|t|1:400b,1p:430b
Mk8 20 Years|2.0 TSI|2022-2023|333p|1551|420n|t
Mk8.5|2.0 TSI|2024-|333p|1548|420n|t
Mk8 Estate|2.0 TSI|2021-2024|320p|1630|420n|t
=Golf GTD
Mk6|2.0 TDI 170|2009-2013|170p|1393|350n|d|1:205p,2:215p
Mk7|2.0 TDI 184|2013-2020|184p|1377|380n|d|1:225p,2:230p
Mk8|2.0 TDI 200|2020-|200p|1505|400n|d|1:240p
=Golf
Mk4|1.4 16v|1997-2004|75p|1100|126n|n
Mk4|1.9 TDI 100|2000-2004|100p|1220|240n|d
Mk4|1.9 TDI 130|2000-2004|130p|1280|310n|d
Mk5|1.9 TDI 105|2004-2009|105p|1281|250n|d
Mk5|2.0 TDI 140|2004-2009|140p|1324|320n|d
Mk6|1.4 TSI 122|2009-2012|122p|1217|200n|t
Mk6|1.6 TDI 105|2009-2012|105p|1275|250n|d
Mk6|2.0 TDI 140|2009-2012|140p|1350|320n|d
Mk7|1.4 TSI 122|2013-2015|122p|1205|200n|t
Mk7|1.4 TSI ACT 150|2013-2017|150p|1270|250n|t
Mk7|1.6 TDI 105|2013-2017|105p|1265|250n|d
Mk7|2.0 TDI 150|2013-2017|150p|1316|320n|d
Mk7.5|1.0 TSI 110|2017-2020|110p|1182|200n|t
Mk7.5|1.5 TSI Evo 130|2017-2020|130p|1239|200n|t
Mk7.5|1.5 TSI Evo 150|2017-2020|150p|1270|250n|t
Mk7.5|1.6 TDI 115|2017-2020|115p|1306|250n|d
Mk8|1.5 TSI 130|2020-|130p|1255|200n|t
Mk8|1.5 eTSI 150|2020-|150p|1305|250n|h
Mk8|2.0 TDI 150|2020-|150p|1386|360n|d
Mk4 V5|2.3 V5 150|1998-2000|150p|1243|205n|n
Mk4 V6 4Motion|2.8 V6 24v|1999-2003|204p|1401|270n|n
=Polo GTI
9N3|1.8T 20v|2006-2009|150p|1194|220n|t|1:192p
6R|1.4 TSI|2010-2014|180p|1184|250n|t|1:200p
6C|1.8 TSI|2015-2017|192p|1272|320n|t|1:220p,2:230p,3:240p
AW|2.0 TSI|2018-2021|200p|1355|320n|t|1:240p,2:250p,3:320p
AW facelift|2.0 TSI|2021-|207p|1286|320n|t
AW facelift Edition 25|2.0 TSI|2023|207p|1297|320n|t
=Polo
6R|1.2 60|2009-2014|60p|1067|108n|n
6R|1.2 TSI 105|2009-2014|105p|1104|175n|t
6R|1.6 TDI 90|2009-2014|90p|1180|230n|d
AW|1.0 MPI 80|2017-|80p|1105|93n|n
AW|1.0 TSI 95|2017-|95p|1145|175n|t
=Up
Mk1|1.0 60|2012-2023|60p|929|95n|n
Mk1|1.0 75|2012-2023|75p|929|95n|n
Mk1|1.0 TSI 90|2016-2020|90p|1009|160n|t
GTI|1.0 TSI|2018-2023|115p|995|200n|t
=Scirocco
Mk3|2.0 TSI|2008-2014|200p|1318|280n|t|1:240p,2:260p,3:300p
Mk3.5|2.0 TSI 220|2014-2017|220p|1352|350n|t|1:260p,2:275p
R|2.0 TSI|2009-2017|265p|1352|350n|t|1:310p,2:330p
=Transporter
T5|1.9 TDI 105|2003-2009|105p|1830|250n|d|1:140p
T5|2.5 TDI 130|2003-2009|130p|1913|340n|d|1:170p
T5|2.5 TDI 174|2003-2009|174p|1990|400n|d|1:204p
T5.1|2.0 TDI 84|2010-2015|84p|1813|220n|d|1:160p,2:175p
T5.1|2.0 TDI 102|2010-2015|102p|1813|250n|d|1:160p,2:175p
T5.1|2.0 TDI 140|2010-2015|140p|1857|340n|d|1:175p
T5.1|2.0 BiTDI 180|2010-2015|180p|1957|400n|d|1:205p,2:215p
T6|2.0 TDI 84|2015-2019|84p|1856|220n|d|1:175p
T6|2.0 TDI 102|2015-2019|102p|1856|250n|d|1:150p
T6|2.0 TDI 150|2015-2019|150p|1880|340n|d|1:190p
T6|2.0 BiTDI 204|2015-2019|204p|1990|450n|d|1:230p
T6.1|2.0 TDI 90|2019-2024|90p|1890|220n|d|1:150p
T6.1|2.0 TDI 110|2019-2024|110p|1890|250n|d
T6.1|2.0 TDI 150|2019-2024|150p|1910|340n|d|1:185p
T6.1|2.0 BiTDI 199|2019-2024|199p|2030|450n|d
T4|1.9 D|1990-1995|61p|1520|127n|d
T4|1.9 TD|1992-1995|68p|1520|140n|d
T4|2.4 D|1990-1995|78p|1595|164n|d
T4 facelift|1.9 TD|1996-2003|68p|1580|140n|d
T4 facelift|2.4 D|1996-1998|78p|1655|164n|d
T4 facelift|2.5 TDI 88|1998-2003|88p|1685|195n|d
T4 facelift|2.5 TDI 102|1996-2003|102p|1685|250n|d
T5|3.2 V6|2003-2009|235p|1900|315n|n
T7|2.0 TDI 110|2024-|110p|1797|310n|d
T7|2.0 TDI 150|2024-|150p|1797|360n|d
T7|2.0 TDI 170 auto|2024-|170p|1835|390n|d
=Corrado
G60|1.8 8v G60|1988-1993|160p|1155|225n|s
16v|2.0 16v|1991-1994|136p|1175|180n|n
VR6|2.9 VR6|1991-1995|190p|1210|245n|n
=Golf VR6
Mk3|2.8 VR6|1992-1997|174p|1220|235n|n
=Lupo GTI
|1.6 16v|2002-2005|125p|975|152n|n
=Polo G40
Mk2F coupe|1.3 G40 supercharged|1991-1994|113p|830|150n|s
=Golf GTE
Mk8|1.4 TSI eHybrid|2020-2024|245p|1549|400n|h
Mk8.5|1.5 TSI eHybrid|2024-|272p|1595|400n|h
=T-Roc R
Mk1|2.0 TSI|2019-2021|300p|1497|400n|t
Mk1 facelift|2.0 TSI|2022-2025|300p|1578|400n|t
=Arteon R
Fastback|2.0 TSI|2020-2023|320p|1703|420n|t
Shooting Brake|2.0 TSI|2020-|320p|1718|420n|t
=Tiguan R
Mk2 facelift|2.0 TSI|2020-2023|320p|1671|420n|t
=ID.3 GTX
GTX|Single-motor electric 79 kWh|2024-2026|286p|1910|545n|e
GTX Performance|Single-motor electric 79 kWh|2024-2026|326p|1925|545n|e
=ID.4 GTX
GTX|Dual-motor electric 77 kWh|2021-2023|299p|2149|460n|e
GTX 2023 update|Dual-motor electric 77 kWh|2023-2026|340p|2256||e
=Caddy
Mk3 facelift|1.6 TDI 102|2010-2015|102p|1334|250n|d
Mk3 facelift|2.0 TDI 140|2010-2015|140p|1347|320n|d
Mk4|2.0 TDI 102|2015-2018|102p|1397|250n|d
Mk4|2.0 TDI 150|2015-2018|150p|1415|340n|d
Mk5 Cargo|2.0 TDI 102|2020-2026|102p|1471|280n|d
Mk5 Cargo|2.0 TDI 122|2020-2026|122p|1473|320n|d
=Amarok
Mk1|2.0 BiTDI 180 4MOTION|2010-2016|180p|1977|400n|d
Mk1 facelift|3.0 V6 TDI 204|2016-2020|204p|2053|500n|d
Mk1 facelift|3.0 V6 TDI 224|2016-2018|224p|2243|550n|d
Mk1 facelift|3.0 V6 TDI 258|2018-2020|258p|2180|580n|d
=ID.3
Mk1 facelift Pro|Single-motor electric 59 kWh|2023-|204p|1715|310n|e|1:228b
Mk1 facelift Pro S|Single-motor electric 77 kWh|2023-|204p|1862|310n|e|1:228b
@Audi
=S1
8X|2.0 TFSI|2014-2018|231p|1315|370n|t|1:300p,2:320p,3:380p
=S3
8L|1.8T 20v|1999-2001|210p|1420|270n|t|1:250p,2:265p
8L|1.8T 20v 225|2001-2003|225p|1430|280n|t|1:260p
8P|2.0 TFSI|2006-2012|265p|1495|350n|t|1:300p,2:320p,3:350p
8V|2.0 TFSI|2013-2016|300p|1425|380n|t|1:370b,2:410b
8V facelift|2.0 TFSI|2016-2019|310p|1445|400n|t|1:370b,2:410b
8Y|2.0 TFSI|2020-2024|310p|1500|400n|t|1:380p,2:400p,3:430p
8Y facelift|2.0 TFSI|2024-|333p|1535|420n|t|1:400b,1p:430b
=RS3
8P|2.5 TFSI|2011-2012|340p|1575|450n|t|1:400p,2:420p
8V|2.5 TFSI|2015-2017|367p|1520|465n|t|1:410p,2:430p,3:500p
8V facelift|2.5 TFSI|2017-2021|400p|1510|480n|t|1:470p,2:490p,3:580p
8Y|2.5 TFSI|2021-|400p|1575|500n|t|1:450p,2:470p
8Y facelift|2.5 TFSI|2024-|400p|1565|500n|t
=S4
B5|2.7 V6 biturbo|1997-2001|265p|1535|400n|t|1:315p
B6|4.2 V8|2003-2005|344p|1660|410n|n|1:364p
B7|4.2 V8|2005-2008|344p|1690|410n|n|1:364p
B8|3.0 TFSI|2009-2015|333p|1650|440n|s|1:400p,2:430p
B9|3.0 TFSI|2016-2019|354p|1630|500n|t|1:400p,2:420p
B9 TDI|3.0 TDI|2019-|347p|1750|700n|d|1:400p
=RS4
B5|2.7 V6 biturbo|2000-2001|380p|1620|440n|t|1:430p
B7|4.2 FSI V8|2006-2008|420p|1650|430n|n|1:440p,2:455p
B8|4.2 FSI V8|2012-2015|450p|1795|430n|n|1:475p
B9|2.9 TFSI V6 biturbo|2018-|450p|1715|600n|t|1:500p,2:515p
B9 facelift|2.9 TFSI V6 biturbo|2019-|450p|1745|600n|t
B9 Edition 25 Years|2.9 TFSI V6 biturbo|2024-|470p|1745|600n|t
=TT
Mk1 225 quattro|1.8T 20v|1999-2006|225p|1395|280n|t|1:250p,2:265p
Mk1 3.2 quattro|3.2 VR6|2003-2006|250p|1520|320n|n|1:270p,2:280p
Mk2|2.0 TFSI|2006-2014|200p|1260|280n|t|1:240p,2:260p,3:300p,4:370p
Mk3|2.0 TFSI|2014-2018|230p|1230|370n|t|1:290p,2:310p,3:380p
=TTS
Mk2|2.0 TFSI|2008-2014|272p|1395|350n|t|1:300p,2:320p
Mk3|2.0 TFSI|2015-2018|310p|1410|380n|t|1:350p,2:370p,3:380p,4:440p
=TT RS
Mk2|2.5 TFSI|2009-2014|340p|1450|450n|t|1:400p
Mk2 Plus|2.5 TFSI|2012-2014|360p|1450|465n|t|1:400p
Mk3|2.5 TFSI|2016-2023|400p|1450|480n|t|1:460p
=A3
8P|1.9 TDI|2003-2009|105p|1305|250n|d
8P|2.0 TDI 140|2003-2012|140p|1335|320n|d
8P|1.4 TFSI|2007-2012|125p|1220|200n|t
8V|1.4 TFSI|2012-2016|125p|1175|200n|t
8V|2.0 TDI 150|2012-2020|150p|1320|320n|d
8V|1.5 TFSI CoD|2017-2020|150p|1270|250n|t
8Y|30 TFSI 1.0|2020-|110p|1240|200n|t
8Y|35 TFSI 1.5|2020-|150p|1320|250n|t
=RS5
B9 Coupe|2.9 TFSI V6 biturbo|2017-2018|450p|1655|600n|t
B9 facelift Coupe|2.9 TFSI V6 biturbo|2020-2024|450p|1707|600n|t
=RS6
C7 Avant|4.0 TFSI V8 biturbo|2013-2014|560p|1935|700n|t
C7 facelift Avant|4.0 TFSI V8 biturbo|2014-2018|560p|1950|700n|t
C7 Performance Avant|4.0 TFSI V8 biturbo|2015-2018|605p|1950|750n|t
C8 Avant|4.0 TFSI V8 biturbo MHEV|2019-2025|600p|2075|800n|t
C8 Performance Avant|4.0 TFSI V8 biturbo MHEV|2022-2025|630p|2075|850n|t
=RS Q3
F3|2.5 TFSI|2019-|400p|1715|480n|t
F3 Sportback|2.5 TFSI|2019-|400p|1700|480n|t
@SEAT
=Leon Cupra
Mk1 Cupra R|1.8T 20v|2002-2003|210p|1320|270n|t|1:260p
Mk1 Cupra R|1.8T 20v 225|2003-2006|225p|1320|280n|t|1:265p,2:275p
Mk2|2.0 TFSI|2007-2010|240p|1375|300n|t|1:310p
Mk2 Cupra R|2.0 TFSI|2010-2012|265p|1375|350n|t|1:310p,2:330p,3:370p,4:400p
Mk3 265|2.0 TSI|2014-2015|265p|1300|350n|t|1:350p,2:370p,3:380p,4:440p
Mk3 280|2.0 TSI|2014-2017|280p|1300|350n|t|1:350p,2:370p,3:380p
Mk3 290|2.0 TSI|2015-2017|290p|1300|350n|t|1:350p,2:370p,3:380p
Mk3 300|2.0 TSI|2017-2020|300p|1395|380n|t|1:355p,2:370p
=Leon
Mk3|1.4 TSI 125|2013-2018|125p|1205|200n|t
Mk3|1.6 TDI 110|2013-2020|110p|1240|250n|d
Mk3 FR|1.8 TSI 180|2013-2020|180p|1250|250n|t
Mk3 FR|2.0 TDI 184|2013-2020|184p|1350|380n|d
=Ibiza Cupra
6L|1.8T 20v|2004-2008|180p|1199|235n|t|1:192p
6L|1.9 TDI 160|2004-2008|160p|1240|330n|d|1:190p
6J|1.4 TSI|2010-2015|180p|1259|250n|t|1:200p
6J facelift|1.8 TSI|2016-2017|192p|1185|320n|t|1:220p,2:230p
=Ibiza
6J FR|2.0 TDI 143|2010-2015|143p|1225|320n|d
6F FR|1.0 TSI 115|2017-|115p|1140|200n|t
6F FR|1.5 TSI 150|2018-|150p|1199|250n|t
@Cupra
=Leon
Mk4|2.0 TSI 245|2020-2024|245p|1450|370n|t
Mk4|2.0 TSI 300|2021-2024|300p|1460|400n|t
Mk4 e-Hybrid|1.4 TSI PHEV|2020-2024|245p|1596|400n|h
Mk4 facelift|2.0 TSI 300|2024-|300p|1421|400n|t
Mk4 facelift e-Hybrid|1.5 TSI PHEV|2024-|272p|1633|400n|h
=Formentor
VZ5|2.5 TSI 5-cyl|2021-2023|390p|1608|480n|t
VZ5 facelift|2.5 TSI 5-cyl|2025-|390p|1626|480n|t
VZ 310|2.0 TSI|2020-2024|310p|1569|400n|t
VZ 333 facelift|2.0 TSI|2024-|333p|1566|420n|t
=Ateca
300|2.0 TSI|2018-2020|300p|1557|400n|t
300 facelift|2.0 TSI|2020-|300p|1551|400n|t
=Born
Mk1|Single-motor electric 58 kWh|2021-2024|204p|1736|310n|e
Mk1 e-Boost|Single-motor electric 58 kWh|2021-2024|231p|1749|310n|e
Mk1 e-Boost|Single-motor electric 77 kWh|2022-2024|231p|1871|310n|e
VZ|Single-motor electric 79 kWh|2024-2026|326p|1999|545n|e
@Skoda
=Octavia vRS
Mk1|1.8T 20v|2001-2006|180p|1260|235n|t|1:210p
Mk2|2.0 TFSI|2006-2013|200p|1395|280n|t|1:260p,2:275p
Mk2|2.0 TDI 170|2007-2013|170p|1445|350n|d
Mk3|2.0 TSI 220|2013-2017|220p|1345|350n|t|1:300p,2:320p,3:380p
Mk3 vRS 230|2.0 TSI|2015-2017|230p|1345|350n|t|1:300p
Mk3 facelift|2.0 TSI 245|2017-2020|245p|1367|370n|t|1:300p,2:340p,3:350p
Mk3|2.0 TDI 184|2013-2020|184p|1395|380n|d|1:220p,2:230p
Mk4|2.0 TSI 245|2020-2024|245p|1445|370n|t|1:320p,2:340p,3:350p
Mk4|2.0 TDI 200|2020-2024|200p|1520|400n|d|1:230p
Mk4 iV|1.4 TSI PHEV|2020-2023|245p|1625|400n|h
Mk4 facelift|2.0 TSI 265|2024-|265p|1460|370n|t
=Fabia vRS
Mk1|1.9 TDI 130|2003-2007|130p|1200|310n|d|1:170p,2:185p,3:230p
Mk2|1.4 TSI|2010-2014|180p|1218|250n|t|1:200p
=Kodiaq vRS
Mk1|2.0 BiTDI 240|2018-2020|240p|1805|500n|d
Mk1 facelift|2.0 TSI 245|2021-2023|245p|1719|370n|t
=Superb
Mk3 280 4x4|2.0 TSI|2015-2018|280p|1550|350n|t
Mk3 facelift 280 4x4|2.0 TSI|2020-2023|280p|1580|400n|t
@Ford
=Fiesta ST
Mk6 ST150|2.0 Duratec|2005-2008|150p|1137|190n|n|1:165p,2:175p
Mk7 ST180|1.6 EcoBoost|2013-2017|182p|1163|240n|t|1:230b,2:250b,3:310b
Mk7 ST200|1.6 EcoBoost|2016-2017|200p|1163|290n|t|1:215p,2:225p
Mk8|1.5 EcoBoost|2018-2022|200p|1262|290n|t|1:250b,2:270b
Mk8 facelift|1.5 EcoBoost|2022-2023|200p|1262|320n|t
=Fiesta
Mk6|1.25 Zetec|2002-2008|75p|1048|110n|n
Mk7|1.25 82|2008-2017|82p|1045|114n|n
Mk7|1.0 EcoBoost 100|2013-2017|100p|1091|170n|t
Mk7|1.0 EcoBoost 125|2013-2017|125p|1091|170n|t
Mk8|1.0 EcoBoost 100|2017-2023|100p|1164|170n|t
Mk8|1.0 EcoBoost 125|2017-2023|125p|1164|170n|t
=Focus ST
Mk2 ST225|2.5 Duratec turbo|2005-2010|225p|1392|320n|t|1:275b,2:320b
Mk3 ST250|2.0 EcoBoost|2012-2018|250p|1362|360n|t|1:280b,2:305b
Mk3 ST TDCi|2.0 TDCi 185|2015-2018|185p|1488|400n|d|1:240b
Mk4|2.3 EcoBoost|2019-2025|280p|1433|420n|t|1:345b,1p:370b
Mk4 ST EcoBlue|2.0 EcoBlue 190|2019-2022|190p|1493|400n|d
Mk1 ST170|2.0 16v Duratec ST|2002-2005|173p|1314|195n|n
=Focus RS
Mk1|2.0 Duratec turbo|2002-2003|215p|1278|310n|t|1:245p
Mk2|2.5 Duratec turbo|2009-2010|305p|1467|440n|t|1:350p
Mk2 RS500|2.5 Duratec turbo|2010-2011|350p|1467|460n|t|1:370p
Mk3|2.3 EcoBoost|2016-2018|350p|1547|440n|t|1:380b,2:435b
=Focus
Mk1|1.6 Zetec|1998-2004|100p|1100|145n|n
Mk2|1.6 Ti-VCT 115|2008-2011|115p|1215|155n|n
Mk2|1.6 TDCi 109|2005-2011|109p|1290|240n|d
Mk3|1.0 EcoBoost 125|2012-2018|125p|1270|170n|t
Mk3|1.6 TDCi 115|2011-2015|115p|1310|270n|d
Mk4|1.0 EcoBoost 125|2018-2025|125p|1322|170n|t
Mk4|1.5 EcoBlue 120|2018-2025|120p|1400|300n|d
=Puma ST
Mk2|1.5 EcoBoost|2020-2023|200p|1358|320n|t|1:230p
=Transit Custom
Mk1 facelift|2.0 EcoBlue 105|2016-2023|105p|1900|360n|d
Mk1 facelift|2.0 EcoBlue 130|2016-2023|130p|1900|385n|d
Mk1 facelift|2.0 EcoBlue 170|2016-2023|170p|1920|405n|d
Mk1 facelift|2.0 EcoBlue 185|2019-2023|185p|1940|415n|d
Mk1|2.2 TDCi 100|2012-2018|100p|1729|310n|d
Mk1|2.2 TDCi 125|2012-2018|125p|1729|350n|d
Mk1|2.2 TDCi 155|2012-2018|155p|1729|385n|d
Mk2|2.0 EcoBlue 110|2023-|110p|1790|310n|d
Mk2|2.0 EcoBlue 136|2023-|136p|1790|360n|d
Mk2|2.0 EcoBlue 150|2023-|150p|1828|360n|d
Mk2|2.0 EcoBlue 170|2023-|170p|1866|390n|d
Mk1 facelift MS-RT|2.0 EcoBlue 185|2019-2023|185p|1967||d
Mk2 E-Transit Custom MS-RT|Single-motor electric 210 kW|2023-|285p|2117||e
=Escort RS Cosworth
Mk5|2.0 YB turbo|1992-1996|227p|1275|300n|t
=Sierra RS Cosworth
3-door|2.0 YB turbo|1986-1987|204p|1217|276n|t
Sapphire 4x4|2.0 YB turbo|1990-1992|220p|1305|290n|t
RS500|2.0 YB turbo|1987|227p|1237|280n|t
Sapphire 2WD|2.0 YB turbo|1988-1990|204p|1220|276n|t
=Escort RS2000
Mk5|2.0 16v DOHC|1991-1992|150p|1096|190n|n
Mk6|2.0 16v DOHC|1995-1996|150p|1179|190n|n
Mk5 facelift|2.0 16v DOHC|1992-1995|150p|1135|190n|n
=Escort RS Turbo
Series 1|1.6 CVH turbo|1985-1986|132p|861|180n|t
Series 2|1.6 CVH turbo|1986-1990|132p|965|180n|t
=Escort XR3i
Mk3|1.6 CVH|1982-1986|105p|925|138n|n
Mk4|1.6 CVH|1986-1989|105p|912|138n|n
Mk5|1.8 16v Zetec 130|1992-1993|130p|1100|162n|n
Mk5|1.8 16v Zetec 105|1993-1995|105p|1100|153n|n
=Sierra XR4x4
Mk2|2.8i V6|1987-1989|150p|1340|216n|n
Mk2|2.9i V6 cat|1989-1990|146p|1270|229n|n
=Fiesta XR2
Mk2 XR2|1.6 CVH|1984-1989|96p|860|132n|n
Mk3 XR2i|1.6 CVH|1989-1992|107p|893|135n|n
=Fiesta RS Turbo
Mk3|1.6 CVH turbo|1989-1992|133p|920|183n|t
=Fiesta RS1800
Mk3|1.8 16v Zetec|1992-1994|130p|955|162n|n
=Puma
Mk1|1.7 16v Zetec-SE|1997-2001|125p|1008|157n|n
Racing Puma|1.7 16v Zetec-SE|1999-2001|155p|1174|162n|n
=Capri
Mk3 2.8i|2.8 V6 Cologne|1981-1987|160p|1170|221n|n
=Mustang
S550 GT|5.0 V8 Ti-VCT|2015-2017|421p|1720|530n|n
S550 EcoBoost|2.3 EcoBoost|2015-2017|317p|1655|432n|t
S550 Mach 1|5.0 V8 Ti-VCT|2020-2023|460p|1764|529n|n
S650 GT|5.0 V8|2024-|446p|1733|540n|n
S650 Dark Horse|5.0 V8|2024-|453p|1742|540n|n
=Ranger Raptor
Mk1|2.0 EcoBlue biturbo diesel|2019-2022|213p|2510|500n|d
Mk2|3.0 EcoBoost V6 twin-turbo|2022-|292p|2454|491n|t
=Transit Connect
Mk1|1.8 TDCi 75|2006-2009|75p|1392|175n|d
Mk1|1.8 TDCi 90|2006-2009|90p|1398|240n|d
Mk1|1.8 TDCi 110|2006-2009|110p|1402|280n|d
Mk2|1.6 TDCi 95|2013-2016|95p|1380|230n|d
Mk2|1.6 TDCi 115|2013-2016|115p|1389|270n|d
Mk2|1.5 TDCi 100|2015-2018|100p|1382|250n|d
Mk2|1.5 TDCi 120|2015-2018|120p|1377|270n|d
Mk2|1.0 EcoBoost 100|2013-2015|100p|1342|170n|t
Mk2 facelift|1.5 EcoBlue 100|2018-2024|100p|1471|240n|d
Mk2 facelift|1.5 EcoBlue 120|2018-2023|120p|1471|270n|d
@Vauxhall
=Corsa VXR
D|1.6 Turbo|2007-2014|192p|1203|230n|t|1:225b,2:235b,3:250b
D Nurburgring|1.6 Turbo|2011-2013|205p|1203|250n|t
E|1.6 Turbo|2015-2018|205p|1293|245n|t|1:225b,2:240b,3:255b
=Corsa GSi
E|1.4 Turbo|2018-2019|150p|1278|220n|t|1:170p
=Corsa
C|1.2 16v|2000-2006|75p|980|110n|n
D|1.2 16v|2006-2014|80p|1060|110n|n
D|1.4 16v|2006-2014|90p|1100|125n|n
E|1.4 16v|2014-2019|90p|1120|130n|n
E|1.0 Turbo 115|2014-2019|115p|1163|170n|t
F|1.2 75|2020-|75p|1055|118n|n
F|1.2 Turbo 100|2020-|100p|1090|205n|t
F|1.2 Turbo 130|2020-|130p|1165|230n|t
F Corsa-e|Single-motor electric 50 kWh|2019-2023|136p|1455|260n|e
F facelift Electric|Single-motor electric 50 kWh 136|2023-|136p|1544|260n|e
F facelift Electric|Single-motor electric 51 kWh 156|2023-|156p|1544|260n|e
=Astra VXR
H|2.0T Z20LEH|2005-2010|240p|1393|320n|t|1:265b,2:290b,3:305b
J|2.0T A20NFT|2012-2019|280p|1475|400n|t|1:320b,2:335b,3:345b
=Astra GSi
K|1.6 Turbo|2018-2019|200p|1275|300n|t|1:220p
=Astra
H|1.6 16v 115|2004-2010|115p|1190|155n|n
H|1.9 CDTi 150|2004-2010|150p|1375|320n|d
J|1.4 Turbo 140|2009-2015|140p|1373|200n|t
J|1.7 CDTi 110|2009-2015|110p|1393|260n|d
K|1.0 Turbo 105|2015-2019|105p|1203|170n|t
K|1.6 CDTi 136|2015-2019|136p|1350|320n|d
=Nova
SR|1.3 8v|1983-1990|70p|750|101n|n
GSi|1.6 8v|1988-1990|101p|820|135n|n
=Astra GTE
Mk2|2.0 8v 20SEH|1986-1991|129p|960|190n|n
Mk2 16v|2.0 16v|1988-1989|150p|990|203n|n
=Calibra
16v|2.0 16v|1990-1997|150p|1185|196n|n
Turbo 4x4|2.0 16v turbo|1992-1997|204p|1380|280n|t
V6|2.5 V6|1993-1997|170p|1330|227n|n
=Astra Coupe
G Turbo|2.0 16v turbo|2000-2006|190p|1245|250n|t
=Cavalier
Mk3 GSi 2000|2.0 16v|1989-1992|150p|1200|196n|n
Mk3 Turbo 4x4|2.0 16v turbo|1993-1994|204p|1365|280n|t
=Vivaro
A facelift|2.0 CDTi 90|2011-2014|90p|1685|240n|d
A facelift|2.0 CDTi 115|2011-2014|114p|1685|290n|d
B|1.6 CDTi 115|2014-2019|115p|1661|300n|d
B|1.6 BiTurbo CDTi 140|2014-2019|140p|1661|340n|d
B|1.6 CDTi 95|2014-2019|95p|1661|260n|d
B|1.6 CDTi 120|2014-2019|120p|1661|300n|d
B|1.6 BiTurbo CDTi 125|2014-2019|125p|1661|320n|d
B|1.6 BiTurbo CDTi 145|2014-2019|145p|1661|340n|d
C|1.5 Diesel 120|2019-2023|120p|1558|300n|d
C|2.0 Diesel 122|2019-2023|122p|1620|340n|d
C|2.0 Diesel 150|2019-2023|150p|1620|370n|d
C|2.0 Diesel 180 auto|2019-2023|180p|1659|400n|d
A|1.9 DI 82 (F9Q 762)|2001-2006|82p|1927|190n|d
A|1.9 DTI 100 (F9Q 760)|2001-2006|101p|1927|240n|d
A|2.5 CDTi 135|2003-2006|135p|1927|320n|d
A 2006 facelift|2.5 CDTi 146|2006-2011|146p|1927|320n|d
@Renault
=Clio RS
Clio II 172|2.0 16v F4R|2000-2004|172p|1110|200n|n|1:185p
Clio II 172 Cup|2.0 16v F4R|2002-2004|172p|1021|200n|n|1:185p
Clio II 182|2.0 16v F4R|2004-2006|182p|1090|200n|n|1:190p
Clio II 182 Trophy|2.0 16v F4R|2005|182p|1090|200n|n|1:190p
Clio III 197|2.0 16v F4R|2006-2009|197p|1240|215n|n|1:211p,2:221p
Clio III 200|2.0 16v F4R|2009-2012|200p|1204|215n|n
Clio IV 200 Turbo|1.6 Turbo EDC|2013-2018|200p|1279|240n|t|1:220p,2:240p
Clio IV 220 Trophy|1.6 Turbo EDC|2015-2018|220p|1279|260n|t|1:245p
=Clio
Clio II|1.2 16v|2001-2006|75p|960|105n|n
Clio III|1.2 16v|2005-2012|75p|1040|105n|n
Clio III|1.5 dCi 86|2005-2012|86p|1100|200n|d
Clio IV|0.9 TCe 90|2012-2019|90p|1009|135n|t
Clio IV|1.5 dCi 90|2012-2019|90p|1071|220n|d
Clio V|1.0 TCe 100|2019-2021|100p|1159|160n|t
Clio V|1.0 TCe 90|2021-|90p|1153|160n|t
=Megane RS
Mk2 225|2.0T F4Rt|2004-2009|225p|1345|300n|t|1:255p,2:270p
Mk2 R26|2.0T F4Rt|2007-2009|230p|1345|310n|t
Mk2 R26.R|2.0T F4Rt|2008-2009|230p|1220|310n|t|1:255p,2:270p
Mk3 250|2.0T F4Rt|2010-2012|250p|1387|340n|t|1:300p,2:320p,3:350p
Mk3 265|2.0T F4Rt|2012-2016|265p|1387|360n|t|1:300p
Mk3 275 Trophy|2.0T F4Rt|2014-2016|275p|1376|360n|t|1:300p
Mk4 280|1.8 TCe|2018-2019|280p|1407|390n|t|1:310p,2:325p
Mk4 300 Trophy|1.8 TCe|2019-2022|300p|1419|400n|t|1:310p
=5 GT Turbo
Ph1|1.4 turbo|1985-1987|115p|850|165n|t
Ph2|1.4 turbo|1987-1990|120p|863|165n|t
=Clio Williams
Williams 1|2.0 16v F7R|1993-1994|150p|982|178n|n
Williams 2/3|2.0 16v F7R|1994-1996|150p|982|175n|n
=Clio 16v
Clio I|1.8 16v F7P|1991-1994|137p|1020|162n|n
=Clio V6
Ph1|3.0 V6 24v|2001-2003|230p|1355|300n|n
Ph2|3.0 V6 24v|2003-2005|255p|1400|300n|n
=Trafic
Mk2 facelift|2.0 dCi 90|2011-2014|90p|1685|260n|d
Mk2 facelift|2.0 dCi 115|2011-2014|115p|1685|300n|d
Mk3|1.6 dCi 115|2014-2019|115p|1640|300n|d
Mk3|1.6 Energy dCi 140|2014-2019|140p|1658|340n|d
Mk3|1.6 dCi 95|2014-2019|95p|1725|260n|d
Mk3|1.6 dCi 120|2014-2019|120p|1725|300n|d
Mk3|1.6 Energy dCi 125|2014-2019|125p|1725|320n|d
Mk3|1.6 Energy dCi 145|2014-2019|145p|1725|340n|d
Mk3 facelift|2.0 dCi 120|2019-2021|120p|1730|320n|d
Mk3 facelift|2.0 dCi 145|2019-2021|146p|1736|350n|d
Mk3 facelift|2.0 dCi 170|2019-2021|170p|1736|380n|d
=5 E-Tech
Mk1|Single-motor electric 52 kWh 150|2024-|150p|1450|245n|e
Mk1|Single-motor electric 40 kWh 122|2024-|122p|1350|225n|e
@Peugeot
=205 GTi
1.6|1.6 8v|1984-1986|105p|880|134n|n
1.6|1.6 8v 115|1986-1992|115p|875|133n|n
1.9|1.9 8v|1986-1992|130p|910|161n|n
=106 GTi
Ph2|1.6 16v|1996-2004|120p|950|142n|n
=106 Rallye
Ph1|1.3 8v|1993-1996|100p|825|111n|n
Ph2|1.6 8v|1996-1998|103p|868|132n|n
=106
Ph2|1.1 8v|1996-2003|60p|830|88n|n
=206 GTi
2.0|2.0 16v|1999-2004|136p|1100|190n|n
180|2.0 16v|2004-2007|177p|1162|202n|n
=208 GTi
Mk1|1.6 THP|2013-2015|200p|1160|275n|t|1:220p,2:230p
30th Anniversary|1.6 THP|2014-2015|208p|1160|300n|t
by Peugeot Sport|1.6 THP|2015-2019|208p|1160|300n|t|1:220p,2:230p
=107
Mk1|1.0 12v|2005-2014|68p|800|93n|n
=306 GTi-6
|2.0 16v XU10J4RS|1996-2001|167p|1215|193n|n
=106 XSi
Ph1|1.6 8v|1994-1996|105p|872|135n|n
=309 GTi
|1.9 8v|1987-1992|130p|910|161n|n
=308 GTi
Mk2 250|1.6 THP|2015-2017|250p|1205|330n|t
Mk2 270|1.6 THP|2015-2017|270p|1205|330n|t
@Citroen
=Saxo VTS
1.6 16v|1.6 16v|1997-2003|120p|935|145n|n
=Saxo VTR
1.6 8v|1.6 8v|1999-2003|100p|920|135n|n
=Saxo
1.1|1.1 8v|1996-2003|60p|830|90n|n
=C2 VTS
1.6 16v|1.6 16v|2004-2009|125p|1065|143n|n
=DS3 Racing
Mk1|1.6 THP|2011-2012|207p|1165|275n|t
=DS3 DSport
Mk1|1.6 THP 155|2010-2014|155p|1165|240n|t
Mk1 facelift|1.6 THP 165|2014-2015|165p|1165|240n|t
=C1
Mk1|1.0 12v|2005-2014|68p|790|93n|n
Mk2|1.0 VTi|2014-2022|68p|840|95n|n
=Berlingo
Mk2 van|1.6 HDi 75|2008-2012|75p|1350|185n|d
Mk2 van|1.6 e-HDi 90|2008-2012|90p|1350|215n|d
@Toyota
=Aygo
Mk1|1.0 VVT-i|2005-2014|68p|790|93n|n
Mk2|1.0 VVT-i|2014-2018|69p|840|95n|n
Mk2 facelift|1.0 VVT-i|2018-2022|72p|855|93n|n
@Mini
=Cooper S
R53|1.6 supercharged|2002-2004|163p|1140|210n|s|1:190p,2:220p
R53|1.6 supercharged 170|2004-2006|170p|1140|220n|s
R56|1.6 Turbo|2006-2010|175p|1130|240n|t|1:205p,2:230p,3:250p
R56 LCI|1.6 Turbo|2010-2014|184p|1130|240n|t|1:210p,2:230p,3:260p
F56|2.0 Turbo|2014-2021|192p|1235|280n|t|1:260p,2:280p
=John Cooper Works
R53 GP|1.6 supercharged|2006|218p|1090|250n|s|1:225p
R56|1.6 Turbo|2008-2014|211p|1205|260n|t|1:230p,2:250p,3:270p
R56 GP|1.6 Turbo|2012-2013|218p|1160|260n|t|1:230p
F56|2.0 Turbo|2015-2024|231p|1280|320n|t|1:280p,2:295p
F56 GP|2.0 Turbo|2020-2021|306p|1255|450n|t
F66|2.0 Turbo|2024-|231p|1330|380n|t
=Cooper
R50|1.6 16v|2001-2006|115p|1050|149n|n
R56|1.6 16v|2006-2010|120p|1065|160n|n
F56|1.5 Turbo|2014-2024|136p|1085|220n|t|1:165p
=Electric
F56 Cooper SE|Single-motor electric 32.6 kWh|2019-2021|184p|1365|270n|e
J01 Cooper SE|Single-motor electric 54.2 kWh|2024-|218p|1680|330n|e
J01 JCW|Single-motor electric 54.2 kWh|2024-|258p|1655|350n|e
@Abarth
=500
135|1.4 T-Jet|2008-2012|135p|1110|180n|t
esseesse|1.4 T-Jet|2009-2012|160p|1110|230n|t
=595
Turismo 160|1.4 T-Jet|2012-2016|160p|1035|230n|t
145|1.4 T-Jet|2016-2023|145p|1035|206n|t|1:170p,2:180p,3:230p
Turismo 165|1.4 T-Jet|2016-2023|165p|1035|230n|t|1:200p,2:215p
Competizione 180|1.4 T-Jet|2016-2023|180p|1045|250n|t|1:200p,2:215p
=695
Biposto|1.4 T-Jet|2015-2017|190p|997|250n|t
=Punto
Grande Punto|1.4 T-Jet|2008-2010|155p|1185|201n|t
Grande Punto esseesse|1.4 T-Jet|2008-2010|180p|1185|270n|t
Punto Evo|1.4 MultiAir|2010-2012|165p|1215|250n|t
@Fiat
=Punto
Grande Punto|1.2 8v|2006-2012|65p|1015|102n|n
Grande Punto|1.4 8v|2006-2012|77p|1040|115n|n
=500
Mk1|1.2 8v|2008-2024|69p|865|102n|n
Mk1|0.9 TwinAir 85|2010-2019|85p|930|145n|t
Mk1|1.0 Mild Hybrid|2020-2024|70p|900|92n|h
332 500e|Single-motor electric 42 kWh|2020-|118p|1365|220n|e
332 500e|Single-motor electric 23.8 kWh|2020-|95p|1255|220n|e
@Alfa Romeo
=Giulia Quadrifoglio
952|2.9 V6 biturbo|2016-2023|510p|1580|600n|t|1:580p
952 facelift|2.9 V6 biturbo|2023-|520p|1580|600n|t
=Giulietta
QV|1750 TBi|2010-2014|235p|1320|340n|t|1:265p
QV|1750 TBi 240|2014-2016|240p|1320|340n|t|1:270p
Veloce|1750 TBi 240|2016-2020|240p|1320|340n|t|1:255p
=147 GTA
Mk1|3.2 V6|2002-2005|250p|1360|300n|n
@Honda
=Civic Type R
EK9|1.6 B16B|1997-2000|185p|1050|160n|n
EP3|2.0 i-VTEC K20A2|2001-2005|200p|1204|196n|n
FN2|2.0 i-VTEC K20Z4|2007-2011|201p|1267|193n|n|1:216p,2:220p
FK2|2.0 VTEC Turbo K20C1|2015-2017|310p|1382|400n|t|1:350p
FK8|2.0 VTEC Turbo K20C1|2017-2022|320p|1380|400n|t|1:360p
FL5|2.0 VTEC Turbo K20C1|2023-|329p|1429|420n|t|1:360p
FD2 JDM|2.0 i-VTEC K20A|2007-2010|225p|1270|215n|n
=Civic
EK VTi|1.6 VTEC B16A2|1996-2000|160p|1090|150n|n
FN|1.8 i-VTEC|2006-2011|140p|1205|174n|n
FK7|1.0 VTEC Turbo|2017-2022|129p|1275|200n|t
FK7|1.5 VTEC Turbo|2017-2022|182p|1307|240n|t
EG6 SiR-II JDM|1.6 VTEC B16A|1991-1995|170p|1050|16k|n
EK4 SiR JDM|1.6 VTEC B16A|1995-2000|170p|1050|16k|n
Mk11 e:HEV|2.0 i-MMD hybrid|2022-2025|184p|1442|315n|h
=Integra Type R
DC2|1.8 VTEC B18C|1998-2001|190p|1125|178n|n
DC5|2.0 i-VTEC K20A|2001-2006|220p|1180|206n|n
DC2 96-spec JDM|1.8 VTEC B18C|1995-1997|200p|1060|18.5k|n
DC2 98-spec JDM|1.8 VTEC B18C|1998-1999|200p|1100|19k|n
DC2 00-spec JDM|1.8 VTEC B18C|1999-2001|200p|1100|19k|n
DB8 4-door 96-spec JDM|1.8 VTEC B18C|1995-1997|200p|1100|18.5k|n
DB8 4-door 98-spec JDM|1.8 VTEC B18C|1998-2001|200p|1100|19k|n
=S2000
AP1|2.0 VTEC F20C|1999-2004|240p|1260|208n|n
AP2|2.0 VTEC F20C|2004-2009|240p|1270|208n|n
=CR-Z
ZF1|1.5 i-VTEC IMA hybrid|2010-2013|124p|1147|174n|h
ZF2|1.5 i-VTEC IMA hybrid|2013-2016|137p|1155|190n|h
=Integra
DC5 Type S JDM|2.0 i-VTEC K20A|2004-2006|160p|1200|191n|n
=Accord Euro R
CL1 JDM|2.2 VTEC H22A|2000-2002|220p|1330|221n|n
CL7 JDM|2.0 i-VTEC K20A|2002-2008|220p|1390|206n|n
=Accord Type R
UK|2.2 VTEC H22A7|1998-2001|212p|1305|215n|n
=Prelude
BB4 Si VTEC JDM|2.2 VTEC H22A|1991-1996|200p|1240|22.3k|n
BB6 SiR JDM|2.2 VTEC H22A|1996-2000|200p|1260|22.3k|n
BB6 Type S JDM|2.2 VTEC H22A|1996-2000|220p|1310|22.5k|n
BA8 Si JDM|2.2 F22B|1991-1996|160p|1210|20.5k|n
Mk4 UK|2.0 16v|1992-1996|133p|1193|179n|n
Mk4 UK|2.3 16v|1992-1993|160p|1222|209n|n
Mk4 UK|2.2 VTEC 4WS|1993-1995|185p|1305|212n|n
=Beat
PP1|0.66 MTREC E07A|1991-1996|64p|760|6.1k|n
=CR-X Del Sol
EG2 SiR JDM|1.6 VTEC B16A|1995-1998|170p|1100|16k|n
@Toyota
=GR Yaris
Gen 1|1.6 turbo G16E-GTS|2020-2024|261p|1280|360n|t|1:310b,2:320b
Gen 2|1.6 turbo G16E-GTS|2024-|280p|1290|390n|t
=GR86
ZN8|2.4 boxer FA24|2022-2024|234p|1276|250n|n
=GT86
ZN6|2.0 boxer FA20|2012-2021|200p|1240|205n|n
=Supra
Mk4 UK|3.0 twin-turbo 2JZ-GTE|1993-1996|326b|1550|315l|t
Mk4 JDM RZ|3.0 twin-turbo 2JZ-GTE|1993-1996|280p|1510|431n|t
Mk4 JDM RZ VVT-i|3.0 twin-turbo 2JZ-GTE VVT-i|1997-2002|280p|1510|451n|t
Mk4 JDM SZ|3.0 2JZ-GE|1993-2002|225p|1450|284n|n
MA70 3.0GT Turbo JDM|3.0 turbo 7M-GTEU|1988-1989|240p|1540|35k|t
JZA70 2.5GT Twin Turbo R|2.5 twin-turbo 1JZ-GTE|1990-1993|280p|1520|37k|t
MA70 UK 3.0i|3.0 7M-GE|1986-1993|204p|1514|254n|n
MA70 UK 3.0i Turbo|3.0 turbo 7M-GTE|1988-1993|235p|1611|344n|t
=GR Supra
Mk5|3.0 turbo B58|2019-|340p|1495|500n|t|1:440b,2:475b
Mk5|2.0 turbo B48|2020-2023|258p|1395|400n|t
=Celica
T23|1.8 VVT-i 1ZZ|1999-2006|143p|1070|170n|n
T23 190|1.8 VVTL-i 2ZZ|1999-2006|192p|1115|180n|n
ST205 GT-Four|2.0 turbo 3S-GTE|1994-1999|239b|1440|304n|t
ST185 GT-Four JDM|2.0 turbo 3S-GTE|1989-1993|225p|1400|31k|t
ST205 GT-Four JDM|2.0 turbo 3S-GTE|1993-1999|255p|1380|31k|t
ST185 GT-Four UK|2.0 turbo 3S-GTE|1990-1994|204p|1468|275n|t
=MR2
SW20 GT|2.0 3S-GE|1990-1993|158b|1220|136l|n
SW20 GT Rev3|2.0 3S-GE|1994-1999|173b|1240|137l|n
SW20 Turbo Rev2|2.0 turbo 3S-GTE|1991-1993|225p|1270|304n|t
SW20 Turbo Rev3|2.0 turbo 3S-GTE|1994-1999|245p|1270|304n|t
Mk3 Roadster|1.8 VVT-i 1ZZ|2000-2006|140p|975|170n|n
=Yaris
Mk1 T Sport|1.5 VVT-i|2001-2005|106p|950|144n|n
Mk2 SR|1.8 VVT-i|2007-2011|133p|1105|173n|n
=Corolla
AE86 Levin/Trueno|1.6 16v 4A-GE|1983-1987|130p|940|149n|n
AE101 Levin GT-Apex|1.6 20v 4A-GE silvertop|1991-1995|160p|1090|16.5k|n
AE101 Levin GT-Z|1.6 supercharged 4A-GZE|1991-1995|170p|1150|21k|s
AE111 Levin BZ-G|1.6 20v 4A-GE blacktop|1995-2000|165p|1020|16.5k|n
AE111 Levin BZ-R|1.6 20v 4A-GE blacktop|1997-2000|165p|1080|16.5k|n
=Starlet
EP91 Glanza V|1.3 turbo 4E-FTE|1996-1999|135p|890|157n|t
EP82 GT Turbo|1.3 turbo 4E-FTE|1989-1990|135p|830|16k|t
EP82 GT Turbo late|1.3 turbo 4E-FTE|1994-1995|135p|860|16k|t
=Chaser
JZX100 Tourer V|2.5 turbo 1JZ-GTE VVT-i|1996-2001|280p|1470|378n|t
JZX90 Tourer V|2.5 twin-turbo 1JZ-GTE|1992-1996|280p|1450|362.8n|t
=Mark II
JZX90 Tourer V|2.5 twin-turbo 1JZ-GTE|1992-1996|280p|1450|362.8n|t
JZX100 Tourer V|2.5 turbo 1JZ-GTE VVT-i|1996-2000|280p|1470|377.6n|t
JZX110 iR-V|2.5 turbo 1JZ-GTE VVT-i|2000-2004|280p|1520|378n|t
=Cresta
JZX90 Tourer V|2.5 twin-turbo 1JZ-GTE|1992-1996|280p|1450|362.8n|t
JZX100 Roulant G|2.5 turbo 1JZ-GTE VVT-i|1996-2001|280p|1480|377.6n|t
=Verossa
JZX110 VR25|2.5 turbo 1JZ-GTE VVT-i|2001-2004|280p|1520|378n|t
=Aristo
JZS147 3.0V|3.0 twin-turbo 2JZ-GTE|1991-1997|280p|1680|44k|t
JZS161 V300 Vertex|3.0 twin-turbo 2JZ-GTE|1997-2004|280p|1680|451n|t
=Soarer
JZZ30 2.5GT Twin Turbo|2.5 twin-turbo 1JZ-GTE|1991-1993|280p|1550|37k|t
JZZ30 2.5GT-T|2.5 turbo 1JZ-GTE|1994-2001|280p|1560|37k|t
UZZ31 4.0GT-L|4.0 V8 1UZ-FE|1994-1996|260p|1630|36k|n
=Altezza
SXE10 RS200|2.0 3S-GE|1998-2005|210p|1340|22k|n
@Subaru
=Impreza
Classic Turbo 2000|2.0 turbo EJ20|1994-1996|208b|1235|201l|t
Classic Turbo 2000|2.0 turbo EJ20|1999-2000|215b|1235|214l|t
P1|2.0 turbo EJ20|2000|280p|1283|352n|t
22B STi|2.2 turbo EJ22G|1998|280p|1270|363n|t
New Age WRX|2.0 turbo EJ205|2001-2002|218p|1405|292n|t
New Age WRX|2.0 turbo EJ205|2003-2005|225p|1410|300n|t
Hawkeye WRX|2.5 turbo EJ255|2006-2007|230p|1410|320n|t
GC8 WRX STi JDM|2.0 turbo EJ20|1994-1995|250p|1220|31.5k|t
GC8 WRX STi Version II JDM|2.0 turbo EJ20|1995-1996|275p|1240|32.5k|t
GC8 WRX STi Version III JDM|2.0 turbo EJ20|1996-1997|280p|1250|35k|t
GC8 WRX STi Version IV JDM|2.0 turbo EJ20|1997-1998|280p|1250|36k|t
GC8 WRX STi Version V-VI JDM|2.0 turbo EJ20|1998-2000|280p|1270|36k|t
=Impreza WRX STI
New Age STI|2.0 turbo EJ207|2001-2005|265p|1470|343n|t
Hawkeye STI|2.5 turbo EJ257|2006-2007|280p|1495|392n|t
Mk3 STI|2.5 turbo EJ257|2008-2014|300p|1505|407n|t|1:330p
=WRX STI
VA|2.5 turbo EJ257|2014-2018|300p|1534|407n|t
=BRZ
Gen 1|2.0 boxer FA20|2012-2020|200p|1230|205n|n
=Legacy
BE5 B4 RSK JDM|2.0 twin-turbo EJ20|1998-1999|280p|1440|35k|t
BE5 B4 RSK JDM late|2.0 twin-turbo EJ20|2001-2003|280p|1460|343n|t
BH5 GT-B wagon JDM|2.0 twin-turbo EJ20|1998-1999|280p|1480|35k|t
BL5 B4 2.0GT JDM|2.0 turbo EJ20|2003-2004|280p|1410|343n|t
Mk1 UK 2.0 Turbo 4WD|2.0 turbo|1992-1995|200p|1365|260n|t
=Forester
SG9 STI JDM|2.5 turbo EJ25|2004|265p|1440|378n|t
SF5 S/tb JDM|2.0 turbo EJ20|1997-1998|250p|1350|31.2k|t
SF5 STi II Type M JDM|2.0 turbo EJ20|2000-2002|250p|1410|309n|t
SF S-Turbo UK|2.0 turbo|1998-2000|170p|1380|240n|t
SF S-Turbo UK facelift|2.0 turbo|2000-2002|170p|1330|240n|t
@Mitsubishi
=Lancer Evolution
Evo VI|2.0 turbo 4G63|1999-2000|280p|1365|373n|t
Evo VI TME|2.0 turbo 4G63|2000-2001|280p|1365|373n|t
Evo VII|2.0 turbo 4G63|2001-2003|280p|1400|383n|t
Evo VIII|2.0 turbo 4G63|2003-2004|276b|1410|392n|t
Evo VIII MR FQ-300|2.0 turbo 4G63|2004-2005|305b|1400|289l|t
Evo VIII FQ-400|2.0 turbo 4G63|2004-2005|405b|1450|355l|t
Evo IX FQ-300|2.0 turbo 4G63|2005-2007|305b|1400|297l|t
Evo IX FQ-320|2.0 turbo 4G63|2005-2007|326b|1400|305l|t
Evo IX FQ-340|2.0 turbo 4G63|2005-2007|345b|1400|321l|t
Evo IX FQ-360|2.0 turbo 4G63|2006-2007|366b|1400|363l|t
Evo IX GSR JDM|2.0 turbo 4G63|2005-2007|280p|1400|400n|t|1:320p
Evo X FQ-300|2.0 turbo 4B11T|2008-2014|295p|1560|407n|t|1:330p
Evo X FQ-330|2.0 turbo 4B11T|2008-2014|324b|1560|437n|t
Evo X FQ-360|2.0 turbo 4B11T|2008-2014|359p|1560|492n|t
Evo X FQ-400|2.0 turbo 4B11T|2009-2010|403b|1560|525n|t
Evo III JDM|2.0 turbo 4G63|1995-1996|270p|1260|309n|t
Evo IV JDM|2.0 turbo 4G63|1996-1997|280p|1350|353n|t
Evo V JDM|2.0 turbo 4G63|1998|280p|1360|372.6n|t
=GTO
Z16A Twin Turbo JDM|3.0 V6 twin-turbo 6G72|1990-1993|280p|1700|417n|t
Z16A Twin Turbo JDM facelift|3.0 V6 twin-turbo 6G72|1993-1998|280p|1710|427n|t
Z15A Twin Turbo MR JDM|3.0 V6 twin-turbo 6G72|1993-1995|280p|1650|427n|t
Z16A Twin Turbo JDM late|3.0 V6 twin-turbo 6G72|1998-2001|280p|1680|427n|t
=3000GT
UK|3.0 V6 twin-turbo 6G72|1992-1995|286p|1730|407n|t
UK facelift|3.0 V6 twin-turbo 6G72|1995-1999|286p|1690|407n|t
=FTO
GPX JDM|2.0 V6 MIVEC 6A12|1994-1996|200p|1170|20.4k|n
GP Version R JDM|2.0 V6 MIVEC 6A12|1997-1999|200p|1150|20.4k|n
=Galant VR-4
EC5A JDM|2.5 V6 twin-turbo 6A13|1996-1997|280p|1480|37k|t
@Nissan
=350Z
Z33|3.5 V6 VQ35DE|2003-2005|280p|1532|363n|n
Z33|3.5 V6 VQ35DE|2005-2006|300p|1532|353n|n
Z33 HR|3.5 V6 VQ35HR|2007-2009|313p|1532|358n|n
=370Z
Z34|3.7 V6 VQ37VHR|2009-2020|328p|1496|363n|n|1:348p
Z34 Nismo|3.7 V6 VQ37VHR|2013-2020|344p|1535|371n|n
=GT-R
R35 MY09|3.8 V6 twin-turbo VR38DETT|2009-2010|485p|1740|588n|t
R35 MY11|3.8 V6 twin-turbo VR38DETT|2011|530p|1735|607n|t
R35 MY12|3.8 V6 twin-turbo VR38DETT|2012-2016|550p|1740|628n|t|1:590b,2:610b,3:615b
R35 MY17|3.8 V6 twin-turbo VR38DETT|2017-2022|570p|1785|633n|t
R35 Nismo|3.8 V6 twin-turbo VR38DETT|2014-2022|600p|1750|652n|t
=Skyline
R32 GT-R|2.6 twin-turbo RB26DETT|1989-1994|280p|1430|353n|t
R33 GT-R|2.6 twin-turbo RB26DETT|1995-1998|280p|1530|368n|t
R34 GT-R|2.6 twin-turbo RB26DETT|1999-2002|280p|1560|392n|t
R32 GTS-t|2.0 turbo RB20DET|1989-1993|215p|1300|265n|t
R33 GTS-t|2.5 turbo RB25DET|1993-1998|250p|1340|294n|t
R34 GT-T|2.5 turbo RB25DET Neo|1998-2001|280p|1400|343n|t
R32 GTS Type S|2.0 RB20DE|1989-1991|155p|1230|18.8k|n
R32 GTS25 Type S|2.5 RB25DE|1991-1993|180p|1320|23k|n
R33 GTS25 Type S|2.5 RB25DE|1993-1994|200p|1320|23.5k|n
R33 GTS25t Type M saloon|2.5 turbo RB25DET|1993-1994|250p|1380|30k|t
R34 GT|2.0 RB20DE Neo|1998-2001|155p|1330|19k|n
R34 25GT|2.5 RB25DE Neo|1998-2000|200p|1340|255n|n
R34 25GT-t saloon|2.5 turbo RB25DET Neo|1998-2001|280p|1430|35k|t
=200SX
S13|1.8 turbo CA18DET|1989-1994|171p|1240|225n|t
S14|2.0 turbo SR20DET|1995-1996|200p|1255|265n|t
S14a|2.0 turbo SR20DET|1997-2000|200p|1255|265n|t
=Silvia
S13 K's|2.0 turbo SR20DET|1991-1993|205p|1220|274n|t
S15 Spec-R|2.0 turbo SR20DET|1999-2002|250p|1250|275n|t
S15 Spec-S|2.0 SR20DE|1999-2002|165p|1200|191n|n
S13 Q's|1.8 CA18DE|1988-1990|135p|1090|159n|n
S13 K's 1.8|1.8 turbo CA18DET|1988-1990|175p|1120|225n|t
S13 Q's|2.0 SR20DE|1991-1993|140p|1110|178n|n
S14 Q's|2.0 SR20DE|1993-1995|160p|1160|19.2k|n
S14 K's|2.0 turbo SR20DET|1993-1995|220p|1220|274n|t
S14a K's|2.0 turbo SR20DET|1996-1998|220p|1240|274n|t
S14a Autech K's MF-T|2.0 turbo SR20DET|1996-1998|250p|1260|28k|t
=180SX
RPS13|2.0 turbo SR20DET|1991-1998|205p|1230|274n|t
RS13 Type II|1.8 turbo CA18DET|1989-1990|175p|1170|225n|t
RPS13 Type II|2.0 turbo SR20DET|1991-1993|205p|1190|274n|t
RPS13 Type X|2.0 turbo SR20DET|1994-1995|205p|1210|274n|t
RPS13 Type X late|2.0 turbo SR20DET|1996-1997|205p|1220|274n|t
RPS13 Type S|2.0 SR20DE|1996-1998|140p|1200|178n|n
=Pulsar GTI-R
RNN14|2.0 turbo SR20DET|1990-1994|230p|1220|284n|t
=Micra
K11|1.3 16v|1992-2002|75p|830|105n|n
K12 160SR|1.6 16v|2005-2010|110p|1080|153n|n
=Juke Nismo
F15 Nismo|1.6 DIG-T|2013-2014|200p|1306|250n|t
F15 Nismo RS|1.6 DIG-T|2015-2017|218p|1315|280n|t
=Stagea
WGNC34 25t RS Four|2.5 turbo RB25DET|1997-1998|235p|1620|28k|t
WGC34 25t RS V|2.5 turbo RB25DET Neo|1998-2001|280p|1540|34k|t
WGNC34 25t RS Four S|2.5 turbo RB25DET Neo|1998-2001|280p|1650|35k|t
WGNC34 260RS Autech|2.6 twin-turbo RB26DETT|1997-2001|280p|1720|37.5k|t
=Laurel
C33 Medalist turbo|2.0 turbo RB20DET|1988-1990|205p|1380|27k|t
C34 25 Club S turbo|2.5 turbo RB25DET|1994-1996|235p|1430|28k|t
C35 25 Club S turbo|2.5 turbo RB25DET|1997-1998|235p|1440|28k|t
C35 25 Club S turbo Neo|2.5 turbo RB25DET Neo|1998-2002|280p|1450|34k|t
=Cefiro
A31 Sports Cruising|2.0 turbo RB20DET|1988-1990|205p|1330|27k|t
=300ZX
Z32 JDM 2-seater|3.0 twin-turbo VG30DETT|1989-1992|280p|1510|39.6k|t
Z32 JDM 2by2 T-bar|3.0 twin-turbo VG30DETT|1989-1992|280p|1550|39.6k|t
Z32 Euro 2+2|3.0 twin-turbo VG30DETT|1990-1994|283p|1644|375n|t
Z32 JDM 2-seater 1992-94|3.0 twin-turbo VG30DETT|1992-1994|280p|1540|39.6k|t
Z32 JDM 2by2 T-bar 1992-94|3.0 twin-turbo VG30DETT|1992-1994|280p|1580|39.6k|t
Z32 JDM Version S 2-seater|3.0 twin-turbo VG30DETT|1994-1998|280p|1530|39.6k|t
Z32 JDM 2by2 T-bar 1994-98|3.0 twin-turbo VG30DETT|1994-1998|280p|1570|39.6k|t
Z32 JDM Version S 2-seater late|3.0 twin-turbo VG30DETT|1998-2000|280p|1520|39.6k|t
Z32 JDM 2by2 T-bar late|3.0 twin-turbo VG30DETT|1998-2000|280p|1570|39.6k|t
Z32 JDM Version R 2by2 T-bar|3.0 twin-turbo VG30DETT|1998-2000|280p|1560|39.6k|t
@Mazda
=MX-5
NA|1.6|1989-1993|115p|955|136n|n
NA|1.8|1994-1998|131p|990|155n|n
NB|1.6|1998-2005|110p|1015|134n|n
NB|1.8|1998-2000|140p|1065|162n|n
NB|1.8 VVT|2001-2005|146p|1080|168n|n
NC|1.8|2005-2015|126p|1080|167n|n
NC|2.0|2005-2015|160p|1155|188n|n
ND|1.5 Skyactiv-G|2015-2023|131p|975|150n|n
ND|2.0 Skyactiv-G|2015-2018|160p|1000|200n|n
ND2|2.0 Skyactiv-G|2019-|184p|1030|205n|n
=MX-5 RF
ND RF|2.0 Skyactiv-G|2017-2018|160p|1045|200n|n
ND2 RF|2.0 Skyactiv-G|2019-|184p|1080|205n|n
=RX-7
FD UK|1.3 twin-rotor twin-turbo 13B-REW|1992-1995|239p|1284|294n|t
FD JDM Type R|1.3 twin-rotor twin-turbo 13B-REW|1993-1995|255p|1260|294n|t
FD JDM Spirit R era|1.3 twin-rotor twin-turbo 13B-REW|1999-2002|280p|1270|314n|t
FC JDM GT-X|1.3 twin-rotor turbo 13B|1985-1989|185p|1240|25k|t
FC JDM GT-X S5|1.3 twin-rotor turbo 13B|1989-1991|205p|1250|27.5k|t
FC Turbo II Euro|1.3 twin-rotor turbo 13B|1987-1990|181p|1250|247n|t
FC Turbo II Euro S5|1.3 twin-rotor turbo 13B|1990-1992|200p|1300|265n|t
FD JDM Type RS 265|1.3 twin-rotor twin-turbo 13B-REW|1997-1998|265p|1280|30k|t
FD JDM Type RS 280|1.3 twin-rotor twin-turbo 13B-REW|1999-2000|280p|1280|32k|t
=RX-8
SE3P 192|1.3 Renesis 13B-MSP 4-port|2003-2010|192p|1335|220n|n
SE3P 231|1.3 Renesis 13B-MSP 6-port|2003-2010|231p|1310|211n|n
=Eunos Roadster
NA6CE JDM|1.6 B6-ZE|1989-1991|120p|940|14k|n
NA8C JDM|1.8 BP-ZE|1993-1994|130p|980|16k|n
=3 MPS
BK|2.3 DISI turbo MZR|2006-2009|260p|1485|380n|t
BL|2.3 DISI turbo MZR|2011-2013|260p|1470|380n|t
=6 MPS
GG|2.3 DISI turbo MZR AWD|2006-2008|260p|1665|380n|t
@BMW
=M135i
F20|3.0 turbo N55|2012-2015|320p|1500|450n|t
F20 LCI|3.0 turbo N55|2015-2016|326p|1505|450n|t|1:380p
F40 xDrive|2.0 turbo B48|2019-2024|306p|1525|450n|t
F70 M135 xDrive|2.0 turbo B48|2024-|300p|1550|400n|t
=M140i
F20 LCI|3.0 turbo B58|2016-2019|340p|1525|500n|t|1:420b,2:440b
=M235i
F22|3.0 turbo N55|2014-2016|326p|1530|450n|t|1:380p,2:400p,3:450p
=M240i
F22|3.0 turbo B58|2016-2021|340p|1545|500n|t|1:420b,2:440b
G42 xDrive|3.0 turbo B58|2022-|374p|1690|500n|t
=M2
F87|3.0 turbo N55|2016-2018|370p|1495|465n|t|1:390p,2:400p
F87 Competition|3.0 twin-turbo S55|2018-2020|410p|1550|550n|t|1:500p,2:520p
F87 CS|3.0 twin-turbo S55|2020-2021|450p|1550|550n|t
G87|3.0 twin-turbo S58|2023-2024|460p|1725|550n|t
G87|3.0 twin-turbo S58|2025-|480p|1725|550n|t
=1M Coupe
E82|3.0 twin-turbo N54|2011-2012|340p|1495|450n|t
=330i
E46|3.0 M54|2000-2005|231p|1430|300n|n
G20|2.0 turbo B48|2019-2022|258p|1470|400n|t
=335i
E90/E92|3.0 twin-turbo N54|2006-2010|306p|1600|400n|t|1:370b
E90/E92 LCI|3.0 turbo N55|2010-2013|306p|1600|400n|t|1:400b,2:420b
=340i
F30 LCI|3.0 turbo B58|2016-2019|326p|1580|450n|t|1:400p,2:420p
=M340i
G20 xDrive|3.0 turbo B58|2019-|374p|1670|500n|t|1:420p,2:450p
=120d
E87|2.0 diesel N47|2007-2011|177p|1395|350n|d|1:210p,2:220p
F20|2.0 diesel N47|2011-2015|184p|1420|380n|d|1:220p,2:235p
F20 LCI|2.0 diesel B47|2015-2019|190p|1430|400n|d|1:220p
=320d
E46|2.0 diesel M47|2001-2005|150p|1450|330n|d|1:183p
E90|2.0 diesel N47|2007-2012|177p|1505|350n|d|1:210p,2:220p
F30|2.0 diesel N47|2012-2015|184p|1495|380n|d|1:220p,2:235p
F30 LCI|2.0 diesel B47|2015-2019|190p|1495|400n|d|1:220p,2:230p
G20|2.0 diesel B47|2019-|190p|1550|400n|d|1:220p
=M3
E30|2.3 S14 (cat)|1987-1991|195p|1200|230n|n
E30 Evo II|2.3 S14|1988-1989|220p|1200|245n|n
E36|3.0 S50B30|1993-1995|286p|1460|320n|n
E36|3.2 S50B32|1996-1999|321p|1515|350n|n
E46|3.2 S54|2000-2006|343p|1570|365n|n|1:365p,2:375p
E46 CSL|3.2 S54|2003-2004|360p|1385|370n|n|1:380p
E90/E92|4.0 V8 S65|2007-2013|420p|1655|400n|n|1:440p,2:445p
F80|3.0 twin-turbo S55|2014-2018|431p|1520|550n|t|1:496p,2:511p
F80 Competition|3.0 twin-turbo S55|2016-2018|450p|1520|550n|t|1:500p,2:520p,3:650p
F80 CS|3.0 twin-turbo S55|2018|460p|1585|600n|t|1:500p,2:520p
G80|3.0 twin-turbo S58|2021-|480p|1705|550n|t
G80 Competition|3.0 twin-turbo S58|2021-2024|510p|1730|650n|t|1:640p,2:680p
G80 Competition xDrive|3.0 twin-turbo S58|2021-2024|510p|1780|650n|t
G80 CS|3.0 twin-turbo S58|2023-2024|550p|1765|650n|t
G80 LCI Competition xDrive|3.0 twin-turbo S58|2024-|530p|1780|650n|t
G81 Touring Competition xDrive|3.0 twin-turbo S58|2022-2024|510p|1865|650n|t
G81 LCI Touring Competition xDrive|3.0 twin-turbo S58|2024-|530p|1865|650n|t
G81 LCI Touring CS|3.0 twin-turbo S58|2025-|550p|1850|650n|t
=M4
F82|3.0 twin-turbo S55|2014-2020|431p|1497|550n|t|1:496p,2:511p
F82 Competition|3.0 twin-turbo S55|2016-2020|450p|1497|550n|t|1:510p,2:530p
F82 CS|3.0 twin-turbo S55|2017-2018|460p|1580|600n|t|1:500p
F82 GTS|3.0 twin-turbo S55 water injection|2016|500p|1510|600n|t|1:530p
G82|3.0 twin-turbo S58|2021-|480p|1700|550n|t
G82 Competition|3.0 twin-turbo S58|2021-2024|510p|1725|650n|t
G82 CSL|3.0 twin-turbo S58|2022-2023|550p|1625|650n|t
G82 Competition xDrive|3.0 twin-turbo S58|2021-2024|510p|1775|650n|t
G82 LCI Competition xDrive|3.0 twin-turbo S58|2024-|530p|1775|650n|t
G82 LCI CS|3.0 twin-turbo S58|2024-|550p|1760|650n|t
=M5
E39|5.0 V8 S62|1998-2003|400p|1795|500n|n
E60|5.0 V10 S85|2005-2010|507p|1830|520n|n
F10|4.4 V8 twin-turbo S63|2011-2016|560p|1870|680n|t
F10 Competition|4.4 V8 twin-turbo S63|2014-2016|575p|1870|680n|t
F90|4.4 V8 twin-turbo S63|2018-2024|600p|1940|750n|t
F90 Competition|4.4 V8 twin-turbo S63|2018-2024|625p|1940|750n|t
G90|4.4 V8 twin-turbo S68 PHEV|2024-|727p|2435|1000n|h
=Z4 M
E85/E86|3.2 S54|2006-2008|343p|1410|365n|n
=Z4
E89 sDrive35is|3.0 twin-turbo N54|2010-2016|340p|1505|450n|t
=325i
E30|2.5 M20|1985-1987|171p|1180|226n|n
E30 cat|2.5 M20|1987-1991|170p|1180|222n|n
=318is
E30|1.8 16v M42|1989-1991|136p|1125|172n|n
E36 Coupe|1.9 16v M44|1996-1999|140p|1350|180n|n
=323i
E36|2.5 M52|1995-1998|170p|1385|245n|n
=328i
E36|2.8 M52|1995-1999|193p|1395|280n|n
=325Ci
E46|2.5 M54|2000-2003|192p|1495|245n|n
=330Ci
E46|3.0 M54|2000-2003|231p|1505|300n|n
=323ti
E36 Compact|2.5 M52|1997-2001|170p|1330|245n|n
=540i
E39|4.4 V8 M62|1996-2000|286p|1705|440n|n
=330e
G20|2.0 turbo PHEV|2019-2022|292p|1740|420n|h
=i4
G26 eDrive40|Single-motor electric 83.9 kWh|2021-2024|340p|2050|430n|e
G26 M50|Dual-motor electric 83.9 kWh|2021-2024|544p|2215|795n|e
G26 LCI M50|Dual-motor electric 83.9 kWh|2024-|544p|2215|795n|e
G26 LCI M60|Dual-motor electric 83.9 kWh|2025-|601p|2210|795n|e
@Mercedes
=A35
W177|2.0 turbo M260|2019-|306p|1480|400n|t|1:345p,2:355p
=A45
W176|2.0 turbo M133|2013-2015|360p|1480|450n|t|1:400p
W176 facelift|2.0 turbo M133|2016-2018|381p|1480|475n|t|1:420p,2:440p,3:460p
W177 A45 S|2.0 turbo M139|2019-2025|421p|1635|500n|t|1:460p
=CLA45
C117|2.0 turbo M133|2014-2015|360p|1585|450n|t|1:400p,2:420p,3:460p
C117 facelift|2.0 turbo M133|2016-2019|381p|1585|475n|t|1:420p,2:440p,3:460p
C118 CLA45 S|2.0 turbo M139|2020-|421p|1675|500n|t
=C43
W205|3.0 V6 biturbo M276|2016-2018|367p|1690|520n|t|1:420p
W205 facelift|3.0 V6 biturbo M276|2018-2021|390p|1690|520n|t|1:420p,2:430p
W206|2.0 turbo M139 mild hybrid|2022-2024|408p|1735|500n|t
W206 2024 update|2.0 turbo M139 mild hybrid|2024-2026|421p|1735|500n|t
=C63
W204|6.2 V8 M156|2008-2014|457p|1730|600n|n|1:510p
W204 Performance Pack|6.2 V8 M156|2009-2014|487p|1730|600n|n|1:510p
W205|4.0 V8 biturbo M177|2015-2021|476p|1640|650n|t|1:575p,2:590p
W205 C63 S|4.0 V8 biturbo M177|2015-2021|510p|1655|700n|t|1:570p
W206 C63 S E Performance|2.0 turbo M139 PHEV|2022-2026|680p|2090|1020n|h
=190E
W201|2.0 M102|1983-1993|122p|1100|177n|n
W201 2.3-16|2.3 16v|1984-1988|185p|1220|235n|n
W201 2.5-16|2.5 16v cat|1988-1993|195p|1300|235n|n
W201 Evo II|2.5 16v|1990-1991|235p|1340|245n|n
=CLA35
C118|2.0 turbo M260|2019-2023|306p|1515|400n|t
C118 facelift|2.0 turbo M260 mild hybrid|2023-2025|306p|1605|400n|t
=GLA45
H247 facelift GLA45 S|2.0 turbo M139|2023-2026|421p|1695|500n|t
=Vito
W639 facelift|110 CDI|2010-2014|95p|1720|250n|d
W639 facelift|113 CDI|2010-2014|136p|1720|310n|d
W639 facelift|116 CDI|2010-2014|163p|1720|360n|d
W639 facelift|122 CDI V6 auto|2010-2014|224p|1780|440n|d
W447|109 CDI|2014-2024|88p|1820|230n|d
W447|111 CDI|2014-2024|114p|1795||d
W447|114 CDI|2014-2024|136p|1920|330n|d
W447|116 CDI|2014-2024|163p|1920|380n|d
W447|119 CDI auto|2014-2024|190p|1925|440n|d
W447 eVito|eVito 41 kWh|2019-2024|116p|2193|295n|e
@Hyundai
=i20 N
BC3|1.6 T-GDi|2021-2024|204p|1190|275n|t
=i30 N
PD|2.0 T-GDi|2018-2020|250p|1400|353n|t|1:300p
PD Performance|2.0 T-GDi|2018-2020|275p|1429|353n|t|1:300b,2:320b
PD facelift Performance|2.0 T-GDi|2021-2024|280p|1455|392n|t|1:340b
PD Fastback Performance|2.0 T-GDi|2018-2020|275p|1441|353n|t
PD Fastback facelift Performance|2.0 T-GDi|2021-2024|280p|1431|392n|t
=Kona N
OS N|2.0 T-GDi|2021-2023|280p|1510|392n|t
=Ioniq 5 N
N|Dual-motor electric 84 kWh|2024-|609p|2205|740n|e
=Ioniq 5
Mk1 Standard Range|Single-motor electric 58 kWh|2021-2024|170p|1830|350n|e
Mk1 Long Range|Single-motor electric 72.6 kWh|2021-2022|218p|1910|350n|e
Mk1 Long Range AWD|Dual-motor electric 72.6 kWh|2021-2022|305p|2020|605n|e
Mk1 Long Range|Single-motor electric 77.4 kWh|2021-2024|228p|1905|350n|e
Mk1 Long Range AWD|Dual-motor electric 77.4 kWh|2021-2024|325p|2025|605n|e
@Kia
=Ceed GT
Mk2 cee'd GT|1.6 T-GDi|2013-2018|204p|1359|265n|t
Mk3 Ceed GT|1.6 T-GDi|2019-2023|204p|1430|265n|t|1:220p
=ProCeed GT
Mk2 pro_cee'd GT|1.6 T-GDi|2013-2018|204p|1359|265n|t
Mk3 ProCeed GT|1.6 T-GDi|2019-2023|204p|1475|265n|t
=Stinger
GT S|3.3 V6 twin-turbo T-GDi|2018-2020|370p|1855|510n|t
GT S facelift|3.3 V6 twin-turbo T-GDi|2021-2023|366p|1855|510n|t
=EV6
GT|Dual-motor electric 77.4 kWh|2022-2024|585p|2125|740n|e
Mk1 Standard Range|Single-motor electric 58 kWh|2021-2024|170p|1800|350n|e
Mk1 Long Range|Single-motor electric 77.4 kWh|2021-2024|229p|1910|350n|e
Mk1 Long Range AWD|Dual-motor electric 77.4 kWh|2021-2024|325p|2015|605n|e
@Porsche
=911
996 Carrera|3.4 flat-six|1998-2001|300p|1320|350n|n|1:320p
996 Carrera|3.6 flat-six|2002-2004|320p|1345|370n|n|1:338p
996 Turbo|3.6 flat-six twin-turbo|2000-2005|420p|1540|560n|t|1:480p
997.1 Turbo|3.6 flat-six twin-turbo|2006-2009|480p|1585|620n|t
997.2 Turbo|3.8 flat-six twin-turbo|2010-2013|500p|1570|650n|t
991.1 Turbo|3.8 flat-six twin-turbo|2014-2015|520p|1595|660n|t|1:600p
991.1 Turbo S|3.8 flat-six twin-turbo|2014-2015|560p|1605|700n|t|1:600p
996 GT3 Mk1|3.6 flat-six Mezger|1999-2001|360p|1350|370n|n
996 GT3 Mk2|3.6 flat-six Mezger|2003-2005|381p|1380|385n|n
997.1 Carrera|3.6 flat-six|2004-2008|325p|1415|370n|n|1:340p
997.1 Carrera S|3.8 flat-six|2005-2008|355p|1425|400n|n|1:375p
997.2 Carrera|3.6 flat-six DFI|2009-2012|345p|1415|390n|n|1:360p
997.2 Carrera S|3.8 flat-six DFI|2009-2012|385p|1425|420n|n|1:405p
997.1 GT3|3.6 flat-six Mezger|2006-2009|415p|1395|405n|n
997.2 GT3|3.8 flat-six Mezger|2010-2012|435p|1395|430n|n
991.1 Carrera|3.4 flat-six|2012-2015|350p|1380|390n|n|1:370p
991.1 Carrera S|3.8 flat-six|2012-2015|400p|1395|440n|n|1:440p
991.2 Carrera|3.0 flat-six twin-turbo|2016-2019|370p|1430|450n|t|1:470p,2:490p,3:540p
991.2 Carrera S|3.0 flat-six twin-turbo|2016-2019|420p|1440|500n|t|1:475p
991.1 GT3|3.8 flat-six|2014-2016|475p|1430|440n|n
991.2 GT3|4.0 flat-six|2017-2019|500p|1413|460n|n
992.1 Carrera|3.0 flat-six twin-turbo|2019-2024|385p|1505|450n|t|1:470p
992.1 Carrera S|3.0 flat-six twin-turbo|2019-2024|450p|1515|530n|t|1:540p
992.1 GT3|4.0 flat-six|2021-2024|510p|1418|470n|n
992.2 Carrera|3.0 flat-six twin-turbo|2025-|394p|1516|450n|t
=Cayman
987.1|2.7 flat-six|2006-2008|245p|1300|273n|n|1:255p
987.1 S|3.4 flat-six|2005-2008|295p|1340|340n|n|1:305p,2:315p
987.2|2.9 flat-six|2009-2012|265p|1330|300n|n|1:280p
987.2 S|3.4 flat-six DFI|2009-2012|320p|1350|370n|n|1:338p
987.2 R|3.4 flat-six DFI|2011-2012|330p|1295|370n|n|1:345p
981|2.7 flat-six|2013-2016|275p|1310|290n|n|1:285p
981 S|3.4 flat-six|2013-2016|325p|1320|370n|n|1:340p
981 GTS|3.4 flat-six|2014-2016|340p|1345|380n|n|1:355p
981 GT4|3.8 flat-six|2015-2016|385p|1340|420n|n|1:405p,2:415p
718|2.0 flat-four turbo|2016-|300p|1335|380n|t|1:370p,2:400p
718 S|2.5 flat-four turbo|2016-|350p|1355|420n|t|1:420p
718 GTS 4.0|4.0 flat-six|2020-|400p|1405|420n|n
718 GT4|4.0 flat-six|2019-|420p|1420|420n|n|1:440p,2:450p
718 GT4 RS|4.0 flat-six|2022-|500p|1415|450n|n
=Boxster
986|2.5 flat-six|1997-1999|204p|1250|245n|n|1:220p
986|2.7 flat-six|2000-2002|220p|1260|260n|n|1:239p
986|2.7 flat-six|2003-2004|228p|1275|260n|n|1:245p
986 S|3.2 flat-six|2000-2002|252p|1320|305n|n|1:270p
986 S|3.2 flat-six|2003-2004|260p|1320|310n|n|1:275p
987.1|2.7 flat-six|2005-2008|240p|1305|270n|n|1:255p
987.1 S|3.2 flat-six|2005-2006|280p|1355|320n|n|1:295p
987.2|2.9 flat-six|2009-2012|255p|1335|290n|n
987.2 S|3.4 flat-six DFI|2009-2012|310p|1355|360n|n|1:337p
981|2.7 flat-six|2012-2016|265p|1310|280n|n|1:290p
981 S|3.4 flat-six|2012-2016|315p|1320|360n|n|1:335p
718|2.0 flat-four turbo|2016-|300p|1335|380n|t|1:350p
718 S|2.5 flat-four turbo|2016-|350p|1355|420n|t|1:400p
@Lotus
=Elise
S1|1.8 Rover K-series|1996-2001|118b|725|165n|n
S1 111S|1.8 Rover K-series VVC|1999-2001|143b|735|174n|n
S2|1.8 Rover K-series|2001-2004|120b|860|168n|n
S2 111S|1.8 Rover K-series VVC|2001-2004|160p|870|174n|n
S2|1.8 Toyota 1ZZ-FE|2004-2011|134b|860|172n|n
S2 111R|1.8 Toyota 2ZZ-GE|2004-2007|189b|860|181n|n
S2 SC|1.8 Toyota 2ZZ-GE supercharged|2008-2011|217b|910|212n|s
S3|1.6 Toyota 1ZR|2011-2015|134b|866|160n|n
S3 Sport 220|1.8 Toyota 2ZR supercharged|2016-2021|217b|914|250n|s
S3 Cup 250|1.8 Toyota 2ZR supercharged|2016-2021|243b|884d|250n|s
=Exige
S2|1.8 Toyota 2ZZ-GE|2004-2006|190b|914|187n|n
S2 S|1.8 Toyota 2ZZ-GE supercharged|2006-2011|218b|933|215n|s
S3 S|3.5 V6 supercharged|2012-2015|350p|1176|400n|s
S3 Sport 350|3.5 V6 supercharged|2016-2019|350p|1125|400n|s
S3 Sport 380|3.5 V6 supercharged|2016-2021|380p|1076|410n|s
S3 Sport 410|3.5 V6 supercharged|2018-2021|416p|1054d|420n|s
S3 Cup 430|3.5 V6 supercharged|2017-2021|436p|1056d|440n|s
=Evora
S|3.5 V6 supercharged|2010-2015|350p|1437|400n|s
400|3.5 V6 supercharged|2015-2018|406p|1395|410n|s
GT410 Sport|3.5 V6 supercharged|2018-2021|416p|1361|420n|s
@Caterham
=Seven
160|0.66 turbo Suzuki K6A|2013-2017|80b|490d|107n|t
170|0.66 turbo Suzuki R06A|2021-|84b|440d|116n|t
270|1.6 Ford Sigma|2015-|135b|540d|165n|n
310|1.6 Ford Sigma|2016-|152b|540d|169n|n
360|2.0 Ford Duratec|2018-|180b|560d|193n|n
420|2.0 Ford Duratec|2016-|210b|560d|203n|n
620R|2.0 Ford Duratec supercharged|2013-2020|310b|545d|297n|s
@Lexus
=IS
XE10 IS200|2.0 1G-FE|1999-2005|155p|1360|195n|n
@Daihatsu
=Copen
L880K JDM|0.66 turbo JB-DET|2002-2003|64p|830|110n|t
L880K UK|0.66 turbo JB-DET|2004-2006|68p|830||t
1.3 Europe|1.3 K3-VE|2006-2011|87p|850|120n|n
@MG
=ZR
160|1.8 VVC K-series|2001-2004|160p|1090|174n|n
105|1.4 K-series|2001-2004|103p|1020|123n|n
=ZS
180|2.5 KV6|2002-2004|177p|1235|240n|n
=ZT
190|2.5 KV6|2001-2005|190p|1460|245n|n
260|4.6 V8|2003-2005|260p|1640|410n|n
=MGF
1.8i|1.8 K-series|1996-2002|120p|1060|165n|n
VVC|1.8 VVC K-series|1996-2002|145p|1150|174n|n
Trophy 160|1.8 VVC K-series 160|2001|160p|1035|174n|n
=TF
135|1.8 K-series|2002-2005|136p|1105|165n|n
160|1.8 VVC K-series|2002-2005|160p|1115|174n|n
=MG4
XPower|Dual-motor electric 64 kWh|2023-|435p|1800|600n|e
Standard Range|Single-motor electric 51 kWh|2022-|170p|1655|250n|e
Long Range|Single-motor electric 64 kWh|2022-|204p|1685|250n|e
Extended Range|Single-motor electric 77 kWh|2023-|245p|1751|350n|e
@Rover
=220 Coupe Turbo
R8 Coupe|2.0 T16 turbo|1993-1994|200p|1185|237n|t
=Mini Cooper
Classic|1.3i A-series|1991-1996|63p|635|95n|n
=25
GTi|1.8 VVC K-series|1999-2001|145p|1090|174n|n
@Alpine
=A110
A110|1.8 turbo M5P|2017-2021|252p|1103|320n|t
A110 S|1.8 turbo M5P|2019-2021|292p|1114|320n|t
A110 S 300|1.8 turbo M5P|2021-2025|300p|1109|340n|t
A110 GT|1.8 turbo M5P|2021-2025|300p|1119|340n|t
A110 R|1.8 turbo M5P|2022-2025|300p|1082|340n|t
@Polestar
=2
Long Range Dual Motor|Dual-motor electric 78 kWh|2020-2023|408p|2113|660n|e|1:350k
Standard Range Single Motor|Single-motor electric 64 kWh|2021-2022|224p|1940|330n|e
Long Range Single Motor|Single-motor electric 78 kWh|2021-2023|231p|1994|330n|e
MY24 Standard range Single motor|Single-motor electric 70 kWh|2023-|272p|1949|490n|e
MY24 Long range Single motor|Single-motor electric 82 kWh|2023-|299p|2009|490n|e
MY24 Long range Dual motor|Dual-motor electric 82 kWh|2023-|421p|2108|740n|e|1:350k
MY24 Long range Dual motor Performance pack|Dual-motor electric 82 kWh|2023-|476p|2105|740n|e
@@ENGINES
Volkswagen|AGU|1.8T 20v (Golf GTI Mk4)|150p|210n|t
Volkswagen|AUQ|1.8T 20v (Golf GTI Mk4 25th Anniversary)|180p|235n|t
Audi|BAM|1.8T 20v (S3 8L / TT 225 quattro)|225p|280n|t
Volkswagen|BWA|2.0 TFSI EA113 (Golf GTI Mk5)|200p|280n|t
Audi|CDLA|2.0 TFSI EA113 K04 (S3 8P / Leon Cupra R Mk2)|265p|350n|t
Volkswagen|CCZB|2.0 TSI EA888 Gen2 (Golf GTI Mk6)|210p|280n|t
Volkswagen|EA888 Gen3|2.0 TSI EA888 Gen3 IS20 (Golf GTI Mk7)|220p|350n|t
Volkswagen|CJXC|2.0 TSI EA888 Gen3 IS38 (Golf R Mk7)|300p|380n|t
Volkswagen|EA888 Gen4|2.0 TSI EA888 Gen4 (Golf R Mk8)|320p|420n|t
Audi|CZGB|2.5 TFSI 5-cyl (RS3 8V pre-facelift)|367p|465n|t
Audi|DAZA|2.5 TFSI 5-cyl (RS3 8V facelift)|400p|480n|t
Ford|Duratec HE 2.0|2.0 16v (Fiesta ST150)|150p|190n|n
Ford|Duratec RS 2.5|2.5 5-cyl turbo (Focus ST225)|225p|320n|t
Ford|2.3 EcoBoost|2.3 turbo (Focus RS Mk3)|350p|440n|t
Ford|YB|2.0 Cosworth turbo (Escort RS Cosworth)|227p|300n|t
Rover|K-series 1.8 VVC|1.8 16v VVC (MGF VVC)|145p|174n|n
Renault|F4R 830|2.0 16v (Clio RS 197)|197p|215n|n
Vauxhall|Z20LET|2.0 16v turbo (Astra G Coupe Turbo)|192p|250n|t
Vauxhall|Z20LEH|2.0 16v turbo (Astra VXR H)|240p|320n|t
Vauxhall|A20NFT|2.0 turbo (Astra VXR J)|280p|400n|t
Citroen|EP6CDTX|1.6 THP (DS3 Racing)|207p|275n|t
Honda|K20A2|2.0 i-VTEC (Civic Type R EP3 UK)|200p|196n|n
Honda|K20Z4|2.0 i-VTEC (Civic Type R FN2 UK)|201p|193n|n
Honda|K20A|2.0 i-VTEC (Integra Type R DC5 JDM)|220p|206n|n
Honda|K20C1|2.0 VTEC Turbo (Civic Type R FK8 UK)|320p|400n|t
Honda|K24A3|2.4 i-VTEC (Accord 2.4 Type S EU 2003)|190p|223n|n
Honda|B16B|1.6 VTEC (Civic Type R EK9 JDM)|185p|160n|n
Honda|B18C|1.8 VTEC (Integra Type R DC2 UK)|190p|178n|n
Honda|F20C|2.0 VTEC (S2000 AP1 EU)|240p|208n|n
Toyota|2JZ-GTE|3.0 twin-turbo (Supra Mk4 UK)|326b|315l|t
Toyota|2JZ-GTE JDM|3.0 twin-turbo VVT-i (Supra RZ JDM 1997+)|280p|451n|t
Toyota|2JZ-GE|3.0 NA (Supra SZ JDM)|225p|284n|n
Toyota|1JZ-GTE|2.5 single-turbo VVT-i (Chaser/Mark II Tourer V JZX100)|280p|378n|t
Toyota|3S-GTE|2.0 turbo (MR2 SW20 Rev3 JDM)|245p|304n|t
Toyota|4A-GE|1.6 16v (AE86 Corolla Levin/Trueno)|130p|149n|n
Nissan|SR20DET S14|2.0 turbo (200SX S14 UK)|200p|265n|t
Nissan|SR20DET S15|2.0 turbo (Silvia S15 Spec-R JDM)|250p|275n|t
Nissan|RB25DET|2.5 turbo (Skyline R33 GTS-t JDM)|250p|294n|t
Nissan|RB26DETT|2.6 twin-turbo (Skyline R34 GT-R JDM)|280p|392n|t
Nissan|VQ35HR|3.5 V6 (350Z UK 2007)|313p|358n|n
Nissan|VR38DETT|3.8 V6 twin-turbo (GT-R R35 MY17)|570p|633n|t
BMW|S54|3.2 straight-six (M3 E46)|343p|365n|n
BMW|S50B30|3.0 straight-six (M3 E36 3.0 EU)|286p|320n|n
BMW|S50B32|3.2 straight-six (M3 E36 3.2 EU)|321p|350n|n
BMW|N54|3.0 twin-turbo straight-six (335i E90/E92)|306p|400n|t
BMW|N55|3.0 turbo straight-six (M135i F20)|320p|450n|t
BMW|B58|3.0 turbo straight-six (M140i F20)|340p|500n|t
BMW|B58 M340i|3.0 turbo straight-six (M340i G20)|374p|500n|t
BMW|S65|4.0 V8 (M3 E90/E92)|420p|400n|n
Mazda|13B-REW|1.3 twin-rotor twin-turbo (RX-7 FD JDM Type R)|255p|294n|t
Mazda|13B-MSP|1.3 Renesis 6-port (RX-8 231)|231p|211n|n
Mitsubishi|4G63T Evo VI|2.0 turbo (Lancer Evo VI)|280p|373n|t
Mitsubishi|4G63T Evo IX|2.0 turbo MIVEC (Lancer Evo IX GSR JDM)|280p|400n|t
Mitsubishi|4B11T|2.0 turbo (Lancer Evo X FQ-300 UK)|295p|407n|t
Subaru|EJ207|2.0 turbo (Impreza WRX STI New Age UK)|265p|343n|t
Subaru|EJ257|2.5 turbo (Impreza WRX STI Mk3 UK)|300p|407n|t
GM|LS1|5.7 V8 (Chevrolet Corvette C5 1997-2000, US rating)|345b|350l|n
GM|LS3|6.2 V8 (Chevrolet Corvette C6 2008, US rating)|430b|424l|n
GM|LS7|7.0 V8 (Chevrolet Corvette C6 Z06, US rating)|505b|470l|n
Ford|Coyote 5.0|5.0 V8 Ti-VCT (Mustang GT UK 2018 facelift)|450p|529n|n
Toyota|G16E-GTS|1.6 turbo three-cyl (GR Yaris Gen1 UK)|261p|360n|t
Honda|B16A2|1.6 VTEC (Civic VTi EG/EK Europe)|160b|111l|n
Honda|B16A1|1.6 VTEC (CRX 1.6 VTEC Europe)|150p|144n|n
Honda|B16A EF9|1.6 VTEC (Civic SiR EF9 / CRX SiR EF8 JDM)|160p|150n|n
Honda|B18C4|1.8 VTEC (Civic VTi / Aerodeck UK 1996-2001)|169b|128l|n
Honda|B18C5|1.8 VTEC (Integra Type R DC2 US 1997-2001)|195b|130l|n
Honda|B18C 96 spec|1.8 VTEC (Integra Type R DC2 JDM 96-spec)|200p|181n|n
Honda|K20Z1|2.0 i-VTEC (Acura RSX Type-S US 2005-06)|210b|143l|n
Honda|K20Z3|2.0 i-VTEC (Civic Si US 2006-11)|197b|139l|n
Honda|K24A2|2.4 i-VTEC (Acura TSX US 2004-05)|200b|166l|n
Honda|K24Z7|2.4 i-VTEC (Civic Si US 2012-13)|201b|170l|n
Honda|H22A|2.2 VTEC (Prelude SiR BB6 JDM)|200p|219n|n
Honda|H22A Type S|2.2 VTEC (Prelude Type S BB6 JDM)|220p|221n|n
Honda|H22A8|2.2 VTEC (Prelude 2.2 VTi UK 1999-2001)|200p|156l|n
Honda|H22A7|2.2 VTEC (Accord Type R CH1 UK)|212p|164l|n
Honda|D16Z6|1.6 SOHC VTEC (Civic EX/Si EG US)|125b|106l|n
Honda|D16Y8|1.6 SOHC VTEC (Civic EX EK US)|127b|107l|n
Toyota|3S-GTE Gen2|2.0 turbo (Celica GT-Four ST185 / MR2 SW20 JDM)|225p|304n|t
Toyota|3S-GTE Gen4|2.0 turbo (Caldina GT-T ST215 JDM)|260p|324n|t
Toyota|3S-GE Gen3 BEAMS|2.0 16v BEAMS (Celica SS-II ST202 / MR2 SW20 JDM)|180p|192n|n
Toyota|3S-GE Gen5 BEAMS|2.0 16v BEAMS (Altezza RS200 manual JDM)|210p|216n|n
Toyota|4A-GE 20v Silver Top|1.6 20v (Corolla Levin / Sprinter Trueno JDM 1991-95)|160p|162n|n
Toyota|4A-GE 20v Black Top|1.6 20v (Corolla Levin / Sprinter Trueno JDM 1995-2000)|165p|162n|n
Toyota|4A-GZE|1.6 16v supercharged (MR2 AW11 Supercharged)|145p|190n|s
Toyota|1ZZ-FE|1.8 16v VVT-i (MR-S / MR2 Roadster JDM)|140b|127l|n
Toyota|2ZZ-GE|1.8 VVTL-i (Celica 190 / T-Sport UK)|189b||n
Toyota|1JZ-GTE twin-turbo|2.5 twin-turbo non-VVT-i (Chaser/Mark II Tourer V JZX90)|280p|363n|t
Nissan|CA18DET|1.8 turbo (200SX S13 Europe 1989-94)|169p|228n|t
Nissan|SR20DET S13|2.0 turbo (Silvia S13 K's JDM 1991-93)|205p|274n|t
Nissan|SR20DET GTi-R|2.0 turbo (Pulsar GTI-R RNN14 JDM)|230p|284n|t
Nissan|SR20DE|2.0 16v (Silvia S13 Q's JDM)|140p|178n|n
Nissan|SR20VE|2.0 Neo VVL (Primera P11 Te-V / Bluebird SSS-Z JDM)|190p|196n|n
Nissan|SR20VE P12|2.0 Neo VVL (Primera P12 20V JDM 2001-03)|204p|206n|n
Nissan|RB20DET|2.0 turbo straight-six (Skyline R32 GTS-t JDM)|215p|265n|t
Nissan|RB25DET NEO|2.5 turbo straight-six (Skyline R34 25GT Turbo JDM)|280p|343n|t
Nissan|RB30ET|3.0 turbo straight-six (Holden Commodore VL Turbo, Australia)|150k|296n|t
Nissan|VQ35DE|3.5 V6 (350Z 2003-04, US rating)|287b|274l|n
Nissan|VQ37VHR|3.7 V6 (370Z UK 2011)|328p|363n|n
Mazda|BP-ZE|1.8 16v (MX-5 NA 1.8i UK 1996-97)|99k|155n|n
Mazda|BP-4W|1.8 16v (MX-5 NB 1.8 UK 1998-2000)|100k|161n|n
Mazda|BP-Z3|1.8 16v S-VT (MX-5 NB 1.8 VVT UK 2001+)|109k|168n|n
Mazda|BP-4W turbo|1.8 turbo (Mazdaspeed MX-5 US 2004-05)|178b|226n|t
Mazda|20B-REW|2.0 triple-rotor twin-turbo (Eunos Cosmo JDM)|280p|407n|t
Mazda|13B-T|1.3 twin-rotor turbo (RX-7 FC Turbo II 1986-88)|185p|248n|t
Mazda|L3-VDT|2.3 DISI turbo (Mazdaspeed6 / Mazdaspeed3 US rating)|263b|280l|t
Ford|Zetec 2.0|2.0 16v Zetec (Focus Mk1 2.0 Europe)|130p|174n|n
Ford|Duratec ST170|2.0 16v Cosworth head (Focus ST170)|170p|196n|n
Ford|Zetec-SE 1.6|1.6 16v Sigma (Fiesta Mk5 1.6 2002-08)|100p|150n|n
Ford|Sigma 1.7 VCT|1.7 16v VCT (Puma 1.7)|126p|157n|n
Ford|Sigma 1.7 Racing Puma|1.7 16v VCT (Racing Puma)|155p|162n|n
Ford|1.6 Ti-VCT|1.6 16v Ti-VCT (Fiesta Mk6 Zetec S)|120p|152n|n
Ford|2.0 EcoBoost ST|2.0 turbo (Focus ST Mk3 Europe)|250p|360n|t
Ford|2.3 EcoBoost ST|2.3 turbo (Focus ST Mk4 2019+)|280p|420n|t
Ford|1.6 EcoBoost ST180|1.6 turbo (Fiesta ST180 2013-17)|180p||t
Ford|1.5 EcoBoost ST|1.5 turbo three-cyl (Fiesta ST Mk8 2018+)|200p|290n|t
Ford|Pinto 2.0|2.0 SOHC (Escort RS2000 Mk2)|110b||n
Vauxhall|C20XE|2.0 16v Red Top (Calibra 2.0 16v / Astra F GSi)|150p|196n|n
Vauxhall|C20LET|2.0 16v turbo (Calibra Turbo 4x4)|204p|280n|t
Vauxhall|X20XEV|2.0 16v Ecotec (Astra F / Vectra B 2.0 16v)|136p|185n|n
Vauxhall|Z22SE|2.2 16v (Astra G 2.2 2000-03)|147b||n
GM|LS2|6.0 V8 (Chevrolet Corvette C6 2005-07, US rating)|400b|400l|n
GM|LT1 6.2|6.2 V8 (Chevrolet Corvette C7 Stingray 2014 perf. exhaust, US rating)|460b|465l|n
GM|LT4|6.2 V8 supercharged (Chevrolet Corvette C7 Z06, US rating)|650b|650l|s
GM|LT1 5.7|5.7 V8 (Chevrolet Corvette C4 1993-95, US rating)|300b|340l|n
GM|L98|5.7 V8 (Chevrolet Corvette C4 1990-91, US rating)|245b|345l|n
Volkswagen|AUM|1.8T 20v (Golf Mk4 / Bora 1.8T 150)|150p|210n|t
Volkswagen|ASZ|1.9 TDI PD (Golf Mk4 GT TDI 130)|130p|310n|d
Volkswagen|ARL|1.9 TDI PD (Golf Mk4 GTI TDI 150)|150p|320n|d
Volkswagen|CFGB|2.0 TDI CR (Golf GTD Mk6)|170p|350n|d
Volkswagen|CUNA|2.0 TDI CR (Golf GTD Mk7)|184p|380n|d
Volkswagen|AAA|2.8 VR6 12v (Golf Mk3 VR6)|176p|235n|n
Volkswagen|ABV|2.9 VR6 12v (Golf Mk3 VR6 Syncro / Corrado VR6 Europe)|190p|245n|n
Volkswagen|AUE|2.8 V6 24v (Golf Mk4 V6 4Motion)|204p|270n|n
Volkswagen|BFH|3.2 VR6 24v (Golf R32 Mk4)|241p|320n|n
Volkswagen|BUB|3.2 VR6 24v (Golf R32 Mk5)|250p|320n|n
Volkswagen|CDLF|2.0 TSI EA113 (Golf R Mk6)|270p|350n|t
Volkswagen|BYD|2.0 TFSI EA113 (Golf GTI Mk5 Edition 30)|230p|300n|t
Volkswagen|EA888 Gen3 Clubsport|2.0 TSI EA888 Gen3 (Golf GTI Clubsport Mk7)|265p|370n|t
Audi|AGB|2.7 V6 biturbo (S4 B5 Europe)|265p|400n|t
BMW|M50B25|2.5 straight-six (325i E36 1991-92, non-VANOS)|192p|245n|n
BMW|M50B25TU|2.5 straight-six VANOS (325i E36 1993-95)|192p|250n|n
BMW|M52B28|2.8 straight-six (328i E36)|193p|280n|n
BMW|S52B32|3.2 straight-six (M3 E36 US/Canada 1996-99)|240b|240l|n
BMW|S58|3.0 twin-turbo straight-six (M3 Competition G80)|510p|650n|t
BMW|M57D30|3.0 diesel straight-six (330d E46 pre-facelift)|135k|390n|d
BMW|M57D30TU|3.0 diesel straight-six (330d E46 facelift)|150k|410n|d
Subaru|EJ20G|2.0 turbo (Impreza Turbo 2000 GC8 UK)|208b||t
Subaru|EJ205|2.0 turbo (Impreza WRX GD UK/Europe 2001)|218p||t
Subaru|EJ255|2.5 turbo (Impreza WRX GD Europe 2006-07)|230p|320n|t
Subaru|EJ207 GRB|2.0 turbo (Impreza WRX STI GRB JDM)|308p|422n|t
Subaru|FA20DIT|2.0 turbo (WRX VA US 2015-21)|268b|350n|t
Subaru|FA20DIT Levorg|2.0 turbo (Levorg 2.0 / WRX S4 JDM)|300p|400n|t
Subaru|FA20D|2.0 flat-four (BRZ / Toyota GT86 2012-16)|200p|205n|n
Mitsubishi|4G63T Evo IV|2.0 turbo (Lancer Evo IV JDM)|280p|353n|t
Mitsubishi|4G63T Evo VII|2.0 turbo (Lancer Evo VII JDM)|280p|383n|t
Mitsubishi|4G63T Evo VIII MR|2.0 turbo MIVEC (Lancer Evo VIII MR GSR JDM)|280p|400n|t
Mitsubishi|4G63T FQ-400|2.0 turbo (Lancer Evo VIII FQ-400 UK)|411p|481n|t
Mitsubishi|4G63T FQ-360|2.0 turbo MIVEC (Lancer Evo IX FQ-360 UK)|371p|492n|t
`;
