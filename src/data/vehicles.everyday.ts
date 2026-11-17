/* eslint-disable */
/**
 * UK everyday cars (the common, non-performance versions people start modding): stock specs for the vehicle picker.
 * Dataset 2026-11-17.4 (batch 4: no changes here; batch 3). Kept apart from vehicles.cars.ts (hot hatches, JDM, classics, vans, EVs) so each
 * source file stays small; a model can appear in both files (e.g. Fiesta here, Fiesta ST and some Fiesta lines there).
 *
 * Format (parsed by src/lib/vehicles.ts): "@Make", "=Model", then
 * "gen|engine|years|power|weight|torque|asp[|stages]". Power is as the maker quotes it:
 * p = PS (converted to bhp x0.986), b = bhp, k = kW (x1.341). Torque n = Nm, l = lb-ft, k = kg·m (x7.233 to lb-ft).
 * Weight kg: kerb weight; "d" = only a dry weight was published (+20 kg added).
 * asp: t turbo petrol, d diesel, n non-turbo, s supercharged, h hybrid (full, mild or plug-in), e fully electric.
 *
 * Notes:
 *  - Where a source gives a kerb-weight range the lower figure is used. Vauxhall figures come from the identical Opel pages.
 *  - Method: almost all figures from auto-data.net modification pages (fetched this session); auto-data "Hp" is metric hp, written as p. Where auto-data gives a kerb range (e.g. Fiesta Mk8 1069-1144 kg, Yaris, Picanto III, i30 III), the LOWER figure is used. Parkers (parkers.co.uk UK trim spec pages, "Weight" field) used to fill or replace weights where auto-data had none or looked wrong; Parkers gives power in bhp, but the PS figure from auto-data / the model name is used for power.
 *  - Vauxhall lines use the identical Opel Corsa B-F / Astra G-K pages on auto-data (auto-data's Vauxhall section only lists old Astra Mk2 bodies), same approach as the existing Vauxhall Vivaro note. Opel quotes some engines slightly differently from Vauxhall UK (Corsa F 1.5 diesel is 102 PS on auto-data, sold as "100" by Vauxhall; Astra K 1.5d 122 PS).
 *  - Years are auto-data production years (start/end), which can be a year earlier than UK registration years (e.g. Focus Mk3 2010-2014, Corsa F / 208 Mk2 2019-). Exception: Focus Mk3 1.0 EcoBoost 100 written 2012-2014 to match the existing Mk3 1.0 EcoBoost 125 line (auto-data shows the whole pre-facelift range as 2010-2014, but the 1.0 EcoBoost arrived in 2012).
 *  - Fiesta Mk7 1.4 96: auto-data gives 966 kg (lighter than the 1.25 82 line at 1045 kg); Parkers UK 1.4 Style 3d gives 1041 kg and 125 Nm, so 1041 used.
 *  - Kia Picanto Mk1: auto-data gives 981 kg (1.0) / 966 kg (1.1); Parkers UK 5d gives 923 kg for both, so 923 used.
 *  - Peugeot 208 Mk2 1.2 PureTech 75: auto-data labels it turbocharged, but its 118 Nm matches the non-turbo EB2F (Mk1 PureTech 82 = 118 Nm, n); written n. Flag for review.
 *  - Peugeot 208 Mk2 1.2 PureTech 100: power/torque/years from auto-data (only the EAT8 page lists it, no weight); 1090 kg from Parkers UK manual Allure 5dr. 1.5 BlueHDi 100 weight 1090 kg also from Parkers (auto-data has no weight). 130 is the EAT8 automatic (auto-data lists no manual 130).
 *  - Vauxhall Corsa E 1.4 75: auto-data has no weight; Parkers 1.4 (75bhp) Design 3d gives 1166 kg, which is heavier than auto-data's Corsa E turbo cars (1124 kg) - different weight conventions, kept as published.
 *  - Toyota Yaris Mk2 1.33: power/years auto-data (101 PS); weight 1050 kg and 132 Nm from Parkers 1.33 SR 3d (Parkers 99 bhp).
 *  - Kia Rio Mk2 1.4: auto-data has no weight; 1154 kg from Parkers 1.4 2 5d.
 *  - Hyundai i10 Mk3 / i20 Mk3: auto-data has no weights; Parkers UK figures used (i10 1.0 MPi SE Connect 921 kg, 1.2 MPi SE Connect 932 kg, 1.0 T-GDi N Line 1024 kg; i20 1.0T GDi Premium 1065 kg, 48V MHD Premium 1090 kg).
 *  - Hybrids (asp h): power is the system figure from auto-data ("System power"). Torque left empty for Toyota HSD cars because no system torque is published (auto-data's "Power"/"Torque" fields there are engine-only); Yaris Mk4 Hybrid 130 has a published system torque (185 Nm). Jazz e:HEV 253 Nm is the motor/system torque. Ford 1.0 EcoBoost mHEV (48V mild hybrid) written h per the brief; note the repo header writes the Mercedes C43 48V mild hybrid as t - pick one convention.
 *  - Corsa-e and e-208 written with asp e (per brief); the repo header currently says electric = h, so the parser may need "e" support. 50 kWh = gross (45 kWh net).
 *  - Yaris Mk3 facelift Hybrid: 980 kg is the low end of auto-data's 980-1040 range and lighter than the pre-facelift hybrid (1085-1160) - flag for review.
 *  - Diesel aspiration: non-turbo diesels (106 1.5D, Micra K11 1.5D) written d as diesel.
 *  - Citroen C2 "VTR" 1.6: auto-data lists the 1.6i 16V 109 PS SensoDrive (2003-2008) without a VTR label; it is the UK C2 VTR 1.6 (automated manual), so gen "Ph1 VTR". VTS line already exists.
 *  - Focus Mk2 1.8 TDCi: auto-data gives 116 PS and 2005-2006 only (UK sold the 1.8 TDCi longer); label kept "1.8 TDCi 115", power 116p as published.
 *  - Astra J pre-facelift: auto-data gives the same 1298 kg for 1.6 115, 1.4T 120 and 1.6T 180 (looks like a shared figure); kept, flag for review.
 *  - Corsa D facelift 1.4 100: auto-data 1040 kg, lighter than the existing D 1.4 90 line (1100 kg); kept as published.
 *  - Gen labels: Fiesta/Focus Mk numbers as in the file; Corsa/Astra letters; 106/206/207 Ph1/Ph2; Yaris Mk1-Mk4 (XP10/XP90/XP130/XP210); Jazz Mk1 GD / Mk2 GE / Mk3 GK; Civic EP / FK (Mk8 5-door) / Mk9 FK / FK7.
 *  - Method: almost all figures come from auto-data.net variant pages (one #src per line), fetched in this session with curl and parsed (Power, Torque, Kerb Weight, Start/End of production, aspiration, fuel). auto-data "Hp" is metric hp, so power is written as p. Where auto-data gives a kerb range (e.g. 1293-1451) the lower figure is used. Years are the variant page's production years (European production, not UK registration years).
 *  - New model names: Mercedes everyday cars go under =A-Class and =C-Class (engine label starts with the badge, e.g. "A 180d 1.5 diesel"); BMW follows the file's per-badge models (=118d, =320i, =330d ...); Mini adds =One, =One D, =Cooper D, =Cooper SD and extra =Cooper lines. SEAT Ibiza gen labels follow the file (6L, 6J, 6F = KJ). Polo uses 9N / 9N3 / 6R / 6C / AW like the Polo GTI lines.
 *  - asp h is used for every mild hybrid (VW/SEAT/Audi eTSI / MHEV, BMW 48V "mild hybrid", Mercedes EQ Boost and all W206 non-PHEV engines) and for PHEVs. PHEV power is the system figure from the auto-data model name (Leon e-Hybrid 204, A3 40 TFSI e 204, 330e 292, A 250e 218, C 300e 320 / 313); the auto-data pages only list the petrol engine's torque, so PHEV torque is left empty.
 *  - VW Polo 9N and 9N3: auto-data weights looked wrong (every 9N3 3-door page says 1095 kg; 9N 1.2 64 says 1173 kg), so kerb weights come from cars-data.com (9N = 3-door base trim; 9N3 = 5-door Trendline, the 1.9 TDI 130 is Sportline). Power, torque and years are still auto-data. The 9N 1.9 TDI 130 was dropped (only weight found was auto-data 1319 kg).
 *  - BMW E46 330d facelift (204): auto-data 1655 kg looks like an estate/auto figure; cars-data.com 330d saloon automatic 1530 kg used instead.
 *  - Skoda Octavia Mk1 facelift: auto-data production runs to 2010 because the "Octavia Tour" carried on in other markets alongside the Mk2 (Wikipedia Octavia page); UK sales ended with the 2004 Mk2, so 2000-2004 / 2003-2004 written.
 *  - Skoda Octavia Mk4 1.5 TSI 150 1263 kg matches cars-data "1.5 TSI First Edition" (1263 kg). Octavia Mk4 facelift 1.5 TSI 116 weight is cars-data 1351 kg (auto-data gives none).
 *  - Skoda Fabia Mk4: auto-data gives no kerb weights for the 2021 cars, so cars-data.com (Dutch-market spec) is used: 1.0 MPI 80 1122 kg, 1.0 TSI 95 1142 kg, 1.0 TSI 110 1165 kg (the 110 page is the 7-speed DSG, so the line says DSG).
 *  - Skoda Fabia Mk1 1.9 TDI: auto-data pre-facelift page says 98 Hp against 101 Hp on the facelift page for the same ATD engine; only the facelift 101 Hp PD line was added. Fabia Mk1 1.2 HTP is from the facelift page (pre-facelift page starts 2003).
 *  - SEAT Leon Mk1 1.8T 180 (FWD): Wikipedia says it was badged "Cupra" and then "FR" in the UK, so gen "Mk1 Cupra/FR" under =Leon (the existing =Leon Cupra model only has the Cupra R).
 *  - SEAT Ibiza 6J 1.6 TDI 105: auto-data torque 180 Nm is clearly wrong for this engine (the 90 PS version is 230 Nm), so torque is left empty.
 *  - SEAT Leon Mk3 facelift FR 1.4 TSI 125: auto-data gives 250 Nm (kept as published; the Golf Mk7 and existing Leon Mk3 1.4 TSI 125 lines say 200 Nm) - worth a check.
 *  - Golf Mk5 GT 1.4 TSI 170 and 2.0 TDI 170 come from the auto-data 3-door pages; the 1.4 TSI 170 page is the DSG car (a manual was also sold). Golf Mk5 1.4 TSI 140 is the 3-door manual page.
 *  - BMW E90 LCI 320d 184: auto-data variant page gives 2010 only; written 2010-2012 (end of E90 LCI saloon, generation page 2008-2012).
 *  - Mini F56 LCI (2018) pages give 2018 only (pre-WLTP variant ID); written 2018-2021 from the generation range. Mini R56 lines are the auto-data LCI-era pages (2010-2013); the R56 Cooper D 110 page (listed with the N47 engine and the same 2010-2013 years as the 112 PS page) was skipped as inconsistent; the 112 PS line is used.
 *  - Mini R50 One / One D are from ultimatespecs (auto-data has no R50 One page): One 1.6 90 PS 1140 kg 140 Nm; One D 75 PS 1175 kg (2001-2004); One D "90" is quoted at 88 PS / 1190 kg / 190 Nm (2004-2006).
 *  - Mercedes W176 A 180 pre-facelift (1370 kg) is heavier than the facelift (1295 kg) on auto-data; both kept as published.
 *  - Audi A4 B9 facelift pages give 2019-2020 (the later 2020+ MHEV versions are separate variants, not added).
 *  - Several "auto" / "DSG" / "S tronic" labels are there because only the automatic page exists or the weight is the auto car's.
 *  - Batch 3 not added: Ka+ 1.5 TDCi, Fiesta Mk5 1.4, Corsa D 1.0, Astra J 1.7/2.0 CDTi pre-facelift, Peugeot 207 1.4 90 / 1.6 120 (2007-09), Yaris Mk3 facelift 1.5, Rio Mk2 1.5 CRDi, Octavia Mk4 2.0 TDI 150, Fabia Mk4 1.5 TSI, Leon Mk1 FR 1.9 TDI 150, R56 pre-facelift One/Cooper D, Mercedes A 160 CDI (W168), A 250e facelift, C 300d (no weight or doubtful data). Dropped at review: Astra J 1.6/1.4T/1.6T (all 1,298 kg), Yaris Mk3 facelift hybrid (980 kg), Corsa D facelift 1.4 (1,040 kg).
 *
 * Sources checked:
 *  https://www.auto-data.net/en/ford-ka-rbt-1.3-i-60hp-8136
 *  https://www.auto-data.net/en/ford-ka-rbt-1.3-i-70hp-8137
 *  https://www.auto-data.net/en/ford-ka-ii-1.2-69hp-8133
 *  https://www.auto-data.net/en/ford-ka-ii-1.3-tdci-75hp-dpf-8134
 *  https://www.auto-data.net/en/ford-ka-1.2-ti-vct-70hp-24768
 *  https://www.auto-data.net/en/ford-ka-1.2-ti-vct-85hp-25181
 *  https://www.auto-data.net/en/ford-focus-hatchback-i-1.4-16v-75hp-7361
 *  https://www.auto-data.net/en/ford-focus-hatchback-i-1.8-16v-115hp-7364
 *  https://www.auto-data.net/en/ford-focus-hatchback-i-2.0-16v-131hp-7369
 *  https://www.auto-data.net/en/ford-focus-hatchback-i-1.8-turbo-di-90hp-7367
 *  https://www.auto-data.net/en/ford-focus-hatchback-i-1.8-tdci-115hp-7366
 *  https://www.auto-data.net/en/ford-focus-ii-hatchback-1.4-duratec-16v-80hp-7314
 *  https://www.auto-data.net/en/ford-focus-ii-hatchback-1.6-duratec-16v-100hp-7315
 *  https://www.auto-data.net/en/ford-focus-ii-hatchback-1.8-i-16v-125hp-7320
 *  https://www.auto-data.net/en/ford-focus-ii-hatchback-2.0-duratec-16v-145hp-7323
 *  https://www.auto-data.net/en/ford-focus-ii-hatchback-1.8-tdci-116hp-7321
 *  https://www.auto-data.net/en/ford-focus-ii-hatchback-2.0-tdci-136hp-7324
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-1.0-ecoboost-100hp-start-stop-18056
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-1.6-ti-vct-125hp-51898
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-1.6-ecoboost-150hp-start-stop-18059
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-2.0-tdci-140hp-18066
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-2.0-tdci-163hp-18068
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-facelift-2014-1.0-ecoboost-100hp-20083
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-facelift-2014-1.5-ecoboost-150hp-20054
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-facelift-2014-1.5-ecoboost-182hp-20055
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-facelift-2014-1.5-tdci-120hp-s-s-20107
 *  https://www.auto-data.net/en/ford-focus-iii-hatchback-facelift-2014-2.0-tdci-150hp-s-s-20061
 *  https://www.auto-data.net/en/ford-focus-iv-hatchback-1.0-ecoboost-100hp-32954
 *  https://www.auto-data.net/en/ford-focus-iv-hatchback-1.5-ecoboost-150hp-32957
 *  https://www.auto-data.net/en/ford-focus-iv-hatchback-1.5-ecoboost-182hp-32959
 *  https://www.auto-data.net/en/ford-focus-iv-hatchback-2.0-ecoblue-150hp-32963
 *  https://www.auto-data.net/en/ford-focus-iv-hatchback-1.0-ecoboost-155hp-mild-hybrid-41405
 *  https://www.auto-data.net/en/ford-fiesta-v-mk5-3-door-1.25i-16v-75hp-38966
 *  https://www.auto-data.net/en/ford-fiesta-v-mk5-3-door-1.6-16v-sport-103hp-8048
 *  https://www.auto-data.net/en/ford-fiesta-v-mk5-3-door-1.8-di-75hp-8050
 *  https://www.auto-data.net/en/ford-fiesta-vi-mk6-3-door-1.4-duratec-16v-80hp-44909
 *  https://www.auto-data.net/en/ford-fiesta-vi-mk6-3-door-1.6-duratec-16v-100hp-44911
 *  https://www.auto-data.net/en/ford-fiesta-vi-mk6-3-door-1.4-duratorq-tdci-68hp-44912
 *  https://www.auto-data.net/en/ford-fiesta-vi-mk6-facelift-2005-3-door-1.6-duratec-100hp-42094
 *  https://www.auto-data.net/en/ford-fiesta-vi-mk6-facelift-2005-3-door-1.6-duratorq-tdci-90hp-8042
 *  https://www.auto-data.net/en/ford-fiesta-vii-mk7-3-door-1.4-96hp-8025
 *  https://www.parkers.co.uk/ford/fiesta/hatchback-2008/14-style-3d/specs/
 *  https://www.auto-data.net/en/ford-fiesta-vii-mk7-3-door-1.6-ti-vct-120hp-8034
 *  https://www.auto-data.net/en/ford-fiesta-vii-mk7-3-door-1.6-tdci-90hp-46829
 *  https://www.auto-data.net/en/ford-fiesta-vii-mk7-facelift-2012-3-door-1.6-tdci-95hp-46888
 *  https://www.auto-data.net/en/ford-fiesta-vii-mk7-facelift-2012-3-door-1.5-tdci-75hp-46887
 *  https://www.auto-data.net/en/ford-fiesta-viii-mk8-3-door-1.0-ecoboost-140hp-start-stop-30438
 *  https://www.auto-data.net/en/ford-fiesta-viii-mk8-3-door-1.1-85hp-30420
 *  https://www.auto-data.net/en/ford-fiesta-viii-mk8-3-door-1.5-tdci-85hp-30620
 *  https://www.auto-data.net/en/ford-fiesta-viii-mk8-3-door-1.0-ecoboost-155hp-mild-hybrid-41396
 *  https://www.auto-data.net/en/ford-fiesta-viii-mk8-facelift-2022-5-door-1.0-ecoboost-125hp-hybrid-44524
 *  https://www.auto-data.net/en/opel-corsa-b-1.4i-60hp-2114
 *  https://www.auto-data.net/en/opel-corsa-b-facelift-1997-1.0i-12v-54hp-2111
 *  https://www.auto-data.net/en/opel-corsa-b-facelift-1997-1.2i-16v-65hp-2113
 *  https://www.auto-data.net/en/opel-corsa-b-facelift-1997-1.4i-16v-90hp-25885
 *  https://www.auto-data.net/en/opel-corsa-b-facelift-1997-1.5-td-67hp-25864
 *  https://www.auto-data.net/en/opel-corsa-c-1.0-12v-58hp-2099
 *  https://www.auto-data.net/en/opel-corsa-c-1.4-16v-90hp-2102
 *  https://www.auto-data.net/en/opel-corsa-c-1.8-16v-125hp-2107
 *  https://www.auto-data.net/en/opel-corsa-c-1.7-dti-16v-75hp-2106
 *  https://www.auto-data.net/en/opel-corsa-c-facelift-2003-1.3-cdti-70hp-2101
 *  https://www.auto-data.net/en/opel-corsa-d-3-door-1.3-cdti-75hp-2093
 *  https://www.auto-data.net/en/opel-corsa-d-3-door-1.3-cdti-90hp-2094
 *  https://www.auto-data.net/en/opel-corsa-d-3-door-1.7-cdti-125hp-2098
 *  https://www.auto-data.net/en/opel-corsa-e-3-door-1.2-ecotec-70hp-twinport-22245
 *  https://www.auto-data.net/en/opel-corsa-e-3-door-1.4-ecotec-75hp-22246
 *  https://www.parkers.co.uk/vauxhall/corsa/hatchback-2014/14-(75bhp)-design-3d/specs/
 *  https://www.auto-data.net/en/opel-corsa-e-3-door-1.4-turbo-ecotec-100hp-start-stop-22255
 *  https://www.auto-data.net/en/opel-corsa-e-3-door-1.4-turbo-ecotec-150hp-start-stop-22256
 *  https://www.auto-data.net/en/opel-corsa-e-3-door-1.3-cdti-ecotec-75hp-start-stop-22259
 *  https://www.auto-data.net/en/opel-corsa-e-3-door-1.3-cdti-ecotec-95hp-start-stop-22260
 *  https://www.auto-data.net/en/opel-corsa-f-1.5-diesel-102hp-37426
 *  https://www.auto-data.net/en/opel-astra-g-1.4-ecotec-16v-90hp-2432
 *  https://www.auto-data.net/en/opel-astra-g-1.6-ecotec-16v-101hp-2435
 *  https://www.auto-data.net/en/opel-astra-g-1.8-16v-125hp-35133
 *  https://www.auto-data.net/en/opel-astra-g-1.7-dti-16v-75hp-2437
 *  https://www.auto-data.net/en/opel-astra-g-2.0-dti-16v-101hp-2445
 *  https://www.auto-data.net/en/opel-astra-g-facelift-2002-2.2-16-v-147hp-2446
 *  https://www.auto-data.net/en/opel-astra-h-1.4i-16v-90hp-2347
 *  https://www.auto-data.net/en/opel-astra-h-1.8i-140hp-2354
 *  https://www.auto-data.net/en/opel-astra-h-1.7-cdti-100hp-2351
 *  https://www.auto-data.net/en/opel-astra-h-1.9-cdti-120hp-2356
 *  https://www.auto-data.net/en/opel-astra-h-facelift-2007-1.8-ecotec-140hp-47449
 *  https://www.auto-data.net/en/opel-astra-h-facelift-2007-1.6-turbo-ecotec-180hp-47450
 *  https://www.auto-data.net/en/opel-astra-j-facelift-2012-2.0-cdti-165hp-ecotec-19439
 *  https://www.auto-data.net/en/opel-astra-k-1.4-100hp-22174
 *  https://www.auto-data.net/en/opel-astra-k-1.4-ecotec-125hp-22176
 *  https://www.auto-data.net/en/opel-astra-k-1.4-ecotec-150hp-22564
 *  https://www.auto-data.net/en/opel-astra-k-1.6-cdti-110hp-22563
 *  https://www.auto-data.net/en/opel-astra-k-facelift-2019-1.2-turbo-130hp-37567
 *  https://www.auto-data.net/en/opel-astra-k-facelift-2019-1.2-turbo-145hp-37568
 *  https://www.auto-data.net/en/opel-astra-k-facelift-2019-1.5d-122hp-37662
 *  https://www.auto-data.net/en/peugeot-106-i-1a-c-1.1-60hp-5412
 *  https://www.auto-data.net/en/peugeot-106-i-1a-c-1.4-75hp-5414
 *  https://www.auto-data.net/en/peugeot-106-i-1a-c-1.5-d-55hp-5417
 *  https://www.auto-data.net/en/peugeot-106-ii-1-1.4i-75hp-5406
 *  https://www.auto-data.net/en/peugeot-106-ii-1-1.5-d-57hp-5407
 *  https://www.auto-data.net/en/peugeot-206-1.1i-60hp-5247
 *  https://www.auto-data.net/en/peugeot-206-1.4i-75hp-5249
 *  https://www.auto-data.net/en/peugeot-206-1.6-16v-109hp-5250
 *  https://www.auto-data.net/en/peugeot-206-1.4-hdi-68hp-5248
 *  https://www.auto-data.net/en/peugeot-206-2.0-hdi-90hp-5254
 *  https://www.auto-data.net/en/peugeot-206-facelift-2003-1.4i-16v-88hp-34675
 *  https://www.auto-data.net/en/peugeot-206-facelift-2003-1.6i-16v-109hp-17900
 *  https://www.auto-data.net/en/peugeot-206-facelift-2003-1.6-hdi-109hp-34676
 *  https://www.auto-data.net/en/peugeot-207-1.4-vti-95hp-33967
 *  https://www.auto-data.net/en/peugeot-207-1.6-hdi-90hp-5354
 *  https://www.auto-data.net/en/peugeot-207-1.6-thp-150hp-33968
 *  https://www.auto-data.net/en/peugeot-207-facelift-2009-1.6-vti-120hp-33971
 *  https://www.auto-data.net/en/peugeot-207-facelift-2009-1.6-thp-156hp-33989
 *  https://www.auto-data.net/en/peugeot-208-i-phase-i-2012-1.2-vti-82hp-17525
 *  https://www.auto-data.net/en/peugeot-208-i-phase-i-2012-1.6-vti-120hp-17528
 *  https://www.auto-data.net/en/peugeot-208-i-phase-i-2012-1.6-thp-155hp-17529
 *  https://www.auto-data.net/en/peugeot-208-i-phase-i-2012-1.6-e-hdi-92hp-fap-stt-17532
 *  https://www.auto-data.net/en/peugeot-208-i-phase-ii-2015-1.2-puretech-82hp-22521
 *  https://www.auto-data.net/en/peugeot-208-i-phase-ii-2015-1.2-puretech-110hp-22525
 *  https://www.auto-data.net/en/peugeot-208-i-phase-ii-2015-1.6-bluehdi-100hp-22526
 *  https://www.auto-data.net/en/peugeot-208-ii-phase-i-2019-1.2-puretech-75hp-stop-start-37585
 *  https://www.auto-data.net/en/peugeot-208-ii-phase-i-2019-gt-line-1.2-puretech-100hp-automatic-36994
 *  https://www.parkers.co.uk/peugeot/208/hatchback-2019/12-puretech-100-allure-5dr/specs/
 *  https://www.auto-data.net/en/peugeot-208-ii-phase-i-2019-1.2-puretech-130hp-stop-start-automatic-37602
 *  https://www.auto-data.net/en/peugeot-208-ii-phase-i-2019-gt-line-1.5-bluehdi-100hp-36993
 *  https://www.parkers.co.uk/peugeot/208/hatchback-2019/15-bluehdi-100-allure-premium-5dr/specs/
 *  https://www.auto-data.net/en/peugeot-208-ii-phase-i-2019-e-208-50-kwh-136hp-36992
 *  https://www.auto-data.net/en/citroen-c2-i-phase-i-2003-1.1i-60hp-14984
 *  https://www.auto-data.net/en/citroen-c2-i-phase-i-2003-1.4i-73hp-14986
 *  https://www.auto-data.net/en/citroen-c2-i-phase-i-2003-1.4-hdi-68hp-27392
 *  https://www.auto-data.net/en/citroen-c2-i-phase-i-2003-1.6i-16v-109hp-sensodrive-24790
 *  https://www.auto-data.net/en/nissan-micra-k11-1.0i-16v-54hp-716
 *  https://www.auto-data.net/en/nissan-micra-k11-1.5-d-57hp-719
 *  https://www.auto-data.net/en/nissan-micra-k11-1.0-60hp-715
 *  https://www.auto-data.net/en/nissan-micra-k11-1.4-82hp-718
 *  https://www.auto-data.net/en/nissan-micra-k12-1.2-i-16v-80hp-706
 *  https://www.auto-data.net/en/nissan-micra-k12-1.2-i-16v-65hp-705
 *  https://www.auto-data.net/en/nissan-micra-k12-1.4-i-16v-88hp-708
 *  https://www.auto-data.net/en/nissan-micra-k12-1.5-di-82hp-711
 *  https://www.auto-data.net/en/toyota-yaris-i-3-door-1.0i-16v-68hp-4057
 *  https://www.auto-data.net/en/toyota-yaris-i-3-door-1.3i-16v-86hp-4058
 *  https://www.auto-data.net/en/toyota-yaris-i-3-door-1.4-di-75hp-4059
 *  https://www.auto-data.net/en/toyota-yaris-i-facelift-2003-3-door-1.0-vvt-i-65hp-50703
 *  https://www.auto-data.net/en/toyota-yaris-i-facelift-2003-3-door-1.3-vvt-i-87hp-50706
 *  https://www.auto-data.net/en/toyota-yaris-ii-1.0-i-vvt-i-69hp-4052
 *  https://www.auto-data.net/en/toyota-yaris-ii-1.3-i-vvt-i-87hp-4053
 *  https://www.auto-data.net/en/toyota-yaris-ii-1.33-vvt-i-101hp-4051
 *  https://www.parkers.co.uk/toyota/yaris/hatchback-2006/133-vvt-i-sr-nav-(6speed)-3d/specs/
 *  https://www.auto-data.net/en/toyota-yaris-ii-1.4-d-4d-90hp-4056
 *  https://www.auto-data.net/en/toyota-yaris-iii-1.0-vvt-i-69hp-17109
 *  https://www.auto-data.net/en/toyota-yaris-iii-1.33-dual-vvt-i-99hp-17110
 *  https://www.auto-data.net/en/toyota-yaris-iii-1.4-d-4d-90hp-17113
 *  https://www.auto-data.net/en/toyota-yaris-iii-1.5-hsd-100hp-hybrid-e-cvt-19314
 *  https://www.auto-data.net/en/toyota-yaris-xp210-1.5-115hp-hybrid-e-cvt-48927
 *  https://www.auto-data.net/en/toyota-yaris-xp210-1.5-130hp-hybrid-e-cvt-48928
 *  https://www.auto-data.net/en/toyota-corolla-hatch-viii-e110-1.3-i-16v-86hp-3339
 *  https://www.auto-data.net/en/toyota-corolla-hatch-viii-e110-1.6-i-16v-110hp-3340
 *  https://www.auto-data.net/en/toyota-corolla-hatch-ix-e120-e130-1.4-i-16v-97hp-3314
 *  https://www.auto-data.net/en/toyota-corolla-hatch-ix-e120-e130-1.6i-16v-110hp-3315
 *  https://www.auto-data.net/en/toyota-corolla-hatch-ix-e120-e130-1.4-d-4d-90hp-3313
 *  https://www.auto-data.net/en/toyota-corolla-hatch-ix-e120-e130-2.0-d-4d-90hp-3318
 *  https://www.auto-data.net/en/toyota-corolla-hatchback-xii-e210-1.2-d-4t-116hp-imt-35749
 *  https://www.auto-data.net/en/toyota-corolla-hatchback-xii-e210-1.8-122hp-hybrid-e-cvt-34628
 *  https://www.auto-data.net/en/toyota-corolla-hatchback-xii-e210-2.0-180hp-hybrid-e-cvt-34627
 *  https://www.auto-data.net/en/toyota-aygo-x-1.0-vvt-i-72hp-44978
 *  https://www.auto-data.net/en/honda-jazz-i-1.2-78hp-12140
 *  https://www.auto-data.net/en/honda-jazz-i-1.4-83hp-12141
 *  https://www.auto-data.net/en/honda-jazz-ii-1.2-90hp-12137
 *  https://www.auto-data.net/en/honda-jazz-ii-1.4-100hp-12138
 *  https://www.auto-data.net/en/honda-jazz-iii-1.3-i-vtec-102hp-22475
 *  https://www.auto-data.net/en/honda-jazz-iii-facelift-2017-1.5-i-vtec-130hp-32645
 *  https://www.auto-data.net/en/honda-jazz-iv-1.5-i-mmd-109hp-ehev-e-cvt-40809
 *  https://www.auto-data.net/en/honda-civic-vii-hatchback-1.4-16v-90hp-12226
 *  https://www.auto-data.net/en/honda-civic-vii-hatchback-1.6-16v-110hp-12227
 *  https://www.auto-data.net/en/honda-civic-vii-hatchback-1.7-ctdi-99hp-12228
 *  https://www.auto-data.net/en/honda-civic-viii-hatchback-5d-1.4i-83hp-12217
 *  https://www.auto-data.net/en/honda-civic-viii-hatchback-5d-2.2-d-140hp-12220
 *  https://www.auto-data.net/en/honda-civic-ix-hatchback-1.4-i-vtec-100hp-17142
 *  https://www.auto-data.net/en/honda-civic-ix-hatchback-1.8-i-vtec-142hp-17143
 *  https://www.auto-data.net/en/honda-civic-ix-hatchback-1.6-i-dtec-120hp-44021
 *  https://www.auto-data.net/en/honda-civic-ix-hatchback-2.2-i-dtec-150hp-17145
 *  https://www.auto-data.net/en/honda-civic-x-hatchback-1.6-i-dtec-120hp-32757
 *  https://www.auto-data.net/en/kia-picanto-i-1.0-i-12v-60hp-2715
 *  https://www.parkers.co.uk/kia/picanto/hatchback-2004/10-1-5d/specs/
 *  https://www.auto-data.net/en/kia-picanto-i-1.1i-12v-64hp-2717
 *  https://www.parkers.co.uk/kia/picanto/hatchback-2004/11-2-5d/specs/
 *  https://www.auto-data.net/en/kia-picanto-ii-5d-1.0-16v-69hp-17046
 *  https://www.auto-data.net/en/kia-picanto-ii-5d-1.2-16v-85hp-17050
 *  https://www.auto-data.net/en/kia-picanto-iii-1.0-67hp-29111
 *  https://www.auto-data.net/en/kia-picanto-iii-1.2-84hp-29131
 *  https://www.auto-data.net/en/kia-picanto-iii-1.0-t-gdi-100hp-32248
 *  https://www.auto-data.net/en/kia-rio-ii-hatchback-jb-1.4-i-16v-97hp-2681
 *  https://www.parkers.co.uk/kia/rio/hatchback-2005/14-2-5d/specs/
 *  https://www.auto-data.net/en/kia-rio-iii-hatchback-ub-1.2-16v-85hp-17052
 *  https://www.auto-data.net/en/kia-rio-iii-hatchback-ub-1.4-16v-109hp-17053
 *  https://www.auto-data.net/en/kia-rio-iii-hatchback-ub-1.1-crdi-12v-75hp-17054
 *  https://www.auto-data.net/en/kia-rio-iii-hatchback-ub-1.4-crdi-16v-90hp-17055
 *  https://www.auto-data.net/en/kia-rio-iv-hatchback-yb-1.25-mpi-84hp-30190
 *  https://www.auto-data.net/en/kia-rio-iv-hatchback-yb-1.0-t-gdi-100hp-30158
 *  https://www.auto-data.net/en/kia-rio-iv-hatchback-yb-1.0-t-gdi-120hp-30160
 *  https://www.auto-data.net/en/kia-rio-iv-hatchback-yb-1.4-crdi-77hp-30212
 *  https://www.auto-data.net/en/hyundai-i10-i-1.1-67hp-13878
 *  https://www.auto-data.net/en/hyundai-i10-i-1.2-78hp-13881
 *  https://www.auto-data.net/en/hyundai-i10-ii-1.0-16v-67hp-19718
 *  https://www.auto-data.net/en/hyundai-i10-ii-1.25-16v-87hp-19719
 *  https://www.auto-data.net/en/hyundai-i10-iii-1.0-mpi-67hp-37604
 *  https://www.parkers.co.uk/hyundai/i10/hatchback-2020/se-connect-10-mpi-67ps-5d/specs/
 *  https://www.auto-data.net/en/hyundai-i10-iii-1.2-mpi-84hp-37589
 *  https://www.parkers.co.uk/hyundai/i10/hatchback-2020/se-connect-12-mpi-84ps-5d/specs/
 *  https://www.auto-data.net/en/hyundai-i10-iii-n-line-1.0-t-gdi-100hp-37588
 *  https://www.parkers.co.uk/hyundai/i10/hatchback-2020/10-t-gdi-n-line-5d/specs/
 *  https://www.auto-data.net/en/hyundai-i20-i-pb-1.2-78hp-13926
 *  https://www.auto-data.net/en/hyundai-i20-i-pb-1.4-101hp-31438
 *  https://www.auto-data.net/en/hyundai-i20-i-pb-1.4-crdi-90hp-31442
 *  https://www.auto-data.net/en/hyundai-i20-ii-gb-1.2-84hp-23617
 *  https://www.auto-data.net/en/hyundai-i20-ii-gb-1.0-t-gdi-100hp-31426
 *  https://www.auto-data.net/en/hyundai-i20-ii-gb-1.4-crdi-90hp-23618
 *  https://www.auto-data.net/en/hyundai-i20-iii-1.0-t-gdi-100hp-39279
 *  https://www.parkers.co.uk/hyundai/i20/hatchback-2020/10t-gdi-premium-5dr/specs/
 *  https://www.auto-data.net/en/hyundai-i20-iii-1.0-t-gdi-48v-100hp-mild-hybrid-39281
 *  https://www.parkers.co.uk/hyundai/i20/hatchback-2020/10t-gdi-48v-mhd-premium-5dr/specs/
 *  https://www.auto-data.net/en/hyundai-i30-i-1.4-109hp-13719
 *  https://www.auto-data.net/en/hyundai-i30-i-1.6-122hp-13720
 *  https://www.auto-data.net/en/hyundai-i30-i-2.0-143hp-13724
 *  https://www.auto-data.net/en/hyundai-i30-i-1.6-crdi-116hp-13723
 *  https://www.auto-data.net/en/hyundai-i30-ii-1.4-100hp-18534
 *  https://www.auto-data.net/en/hyundai-i30-ii-1.6-gdi-135hp-18537
 *  https://www.auto-data.net/en/hyundai-i30-ii-1.6-crdi-110hp-18540
 *  https://www.auto-data.net/en/hyundai-i30-ii-1.6-crdi-128hp-18542
 *  https://www.auto-data.net/en/hyundai-i30-iii-1.0-t-gdi-120hp-25979
 *  https://www.auto-data.net/en/hyundai-i30-iii-1.4-t-gdi-140hp-25965
 *  https://www.auto-data.net/en/hyundai-i30-iii-1.6-crdi-110hp-27074
 *  https://www.auto-data.net/en/hyundai-i30-iii-1.6-crdi-136hp-25937
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-1.6-101hp-14240
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-1.8-t-150hp-14244
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-1.9-tdi-90hp-14251
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-1.9-tdi-110hp-14249
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-facelift-2000-1.4-75hp-14239
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-facelift-2000-1.6-102hp-14241
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-facelift-2000-1.8-t-150hp-56450
 *  https://www.auto-data.net/en/skoda-octavia-i-tour-facelift-2000-1.9-tdi-130hp-14250
 *  https://www.auto-data.net/en/skoda-octavia-ii-1.4-mpi-75hp-14209
 *  https://www.auto-data.net/en/skoda-octavia-ii-1.6-mpi-102hp-14212
 *  https://www.auto-data.net/en/skoda-octavia-ii-1.6-16v-fsi-115hp-14211
 *  https://www.auto-data.net/en/skoda-octavia-ii-1.8-tsi-160hp-55860
 *  https://www.auto-data.net/en/skoda-octavia-ii-1.9-tdi-105hp-14213
 *  https://www.auto-data.net/en/skoda-octavia-ii-2.0-tdi-pd-140hp-14215
 *  https://www.auto-data.net/en/skoda-octavia-ii-facelift-2009-1.2-tsi-105hp-17433
 *  https://www.auto-data.net/en/skoda-octavia-ii-facelift-2009-1.4-tsi-122hp-14181
 *  https://www.auto-data.net/en/skoda-octavia-ii-facelift-2009-1.8-tsi-160hp-14185
 *  https://www.auto-data.net/en/skoda-octavia-ii-facelift-2009-1.6-tdi-cr-dpf-105hp-17434
 *  https://www.auto-data.net/en/skoda-octavia-ii-facelift-2009-2.0-tdi-cr-140hp-14189
 *  https://www.auto-data.net/en/skoda-octavia-iii-1.2-tsi-105hp-19276
 *  https://www.auto-data.net/en/skoda-octavia-iii-1.0-tsi-115hp-25537
 *  https://www.auto-data.net/en/skoda-octavia-iii-1.4-tsi-140hp-19252
 *  https://www.auto-data.net/en/skoda-octavia-iii-1.8-tsi-180hp-19283
 *  https://www.auto-data.net/en/skoda-octavia-iii-1.6-tdi-105hp-19258
 *  https://www.auto-data.net/en/skoda-octavia-iii-2.0-tdi-150hp-19286
 *  https://www.auto-data.net/en/skoda-octavia-iii-facelift-2017-1.0-tsi-116hp-27258
 *  https://www.auto-data.net/en/skoda-octavia-iii-facelift-2017-1.4-tsi-150hp-27323
 *  https://www.auto-data.net/en/skoda-octavia-iii-facelift-2017-1.5-tsi-150hp-35790
 *  https://www.auto-data.net/en/skoda-octavia-iii-facelift-2017-1.6-tdi-116hp-27324
 *  https://www.auto-data.net/en/skoda-octavia-iii-facelift-2017-2.0-tdi-150hp-27259
 *  https://www.auto-data.net/en/skoda-octavia-iv-1.0-tsi-evo-110hp-38005
 *  https://www.auto-data.net/en/skoda-octavia-iv-1.5-tsi-evo-150hp-38006
 *  https://www.auto-data.net/en/skoda-octavia-iv-2.0-tdi-116hp-38008
 *  https://www.auto-data.net/en/skoda-octavia-iv-facelift-2024-1.5-tsi-116hp-51305
 *  https://cars-data.com/en/skoda/octavia/2024-hatchback/1-5-tsi-115hp-business-edition--108733/specs
 *  https://www.auto-data.net/en/skoda-octavia-iv-facelift-2024-2.0-tdi-115hp-52154
 *  https://www.auto-data.net/en/skoda-fabia-i-6y-1.4-mpi-68hp-14151
 *  https://www.auto-data.net/en/skoda-fabia-i-6y-1.4-16v-75hp-14153
 *  https://www.auto-data.net/en/skoda-fabia-i-6y-1.4-16v-101hp-14152
 *  https://www.auto-data.net/en/skoda-fabia-i-6y-facelift-2004-1.2-htp-64hp-45984
 *  https://www.auto-data.net/en/skoda-fabia-i-6y-facelift-2004-1.4-16v-75hp-45985
 *  https://www.auto-data.net/en/skoda-fabia-i-6y-facelift-2004-1.4-tdi-80hp-36213
 *  https://www.auto-data.net/en/skoda-fabia-i-6y-facelift-2004-1.9-tdi-pd-101hp-45991
 *  https://www.auto-data.net/en/skoda-fabia-ii-1.2-i-htp-12v-69hp-14130
 *  https://www.auto-data.net/en/skoda-fabia-ii-1.4-i-16v-86hp-14131
 *  https://www.auto-data.net/en/skoda-fabia-ii-1.6-i-16v-105hp-14134
 *  https://www.auto-data.net/en/skoda-fabia-ii-1.4-tdi-80hp-14133
 *  https://www.auto-data.net/en/skoda-fabia-ii-1.9-tdi-105hp-14136
 *  https://www.auto-data.net/en/skoda-fabia-ii-facelift-2010-1.2-mpi-70hp-20376
 *  https://www.auto-data.net/en/skoda-fabia-ii-facelift-2010-1.2-tsi-86hp-17437
 *  https://www.auto-data.net/en/skoda-fabia-ii-facelift-2010-1.2-tsi-105hp-17438
 *  https://www.auto-data.net/en/skoda-fabia-ii-facelift-2010-1.6-tdi-90hp-17440
 *  https://www.auto-data.net/en/skoda-fabia-ii-facelift-2010-1.6-tdi-105hp-17441
 *  https://www.auto-data.net/en/skoda-fabia-iii-1.0-75hp-20397
 *  https://www.auto-data.net/en/skoda-fabia-iii-1.2-tsi-90hp-20398
 *  https://www.auto-data.net/en/skoda-fabia-iii-1.2-tsi-110hp-20329
 *  https://www.auto-data.net/en/skoda-fabia-iii-1.0-tsi-95hp-32106
 *  https://www.auto-data.net/en/skoda-fabia-iii-1.0-tsi-110hp-32105
 *  https://www.auto-data.net/en/skoda-fabia-iii-1.4-tdi-90hp-20330
 *  https://www.auto-data.net/en/skoda-fabia-iii-facelift-2018-1.0-mpi-75hp-33807
 *  https://www.auto-data.net/en/skoda-fabia-iii-facelift-2018-1.0-tsi-95hp-33808
 *  https://www.auto-data.net/en/skoda-fabia-iii-facelift-2018-1.0-tsi-110hp-33810
 *  https://www.auto-data.net/en/skoda-fabia-iv-1.0-mpi-80hp-43753
 *  https://cars-data.com/en/skoda/fabia/pj/1-0-mpi-greentech-ambition--107510/specs
 *  https://www.auto-data.net/en/skoda-fabia-iv-1.0-tsi-95hp-43754
 *  https://cars-data.com/en/skoda/fabia/pj/1-0-tsi-70kw-greentech-ambition--104170/specs
 *  https://www.auto-data.net/en/skoda-fabia-iv-1.0-tsi-110hp-43755
 *  https://cars-data.com/en/skoda/fabia/pj/1-0-tsi-81kw-greentech-ambition--104172/specs
 *  https://www.auto-data.net/en/skoda-fabia-iv-1.0-tsi-115hp-52156
 *  https://www.auto-data.net/en/volkswagen-golf-iv-1.6-101hp-8660
 *  https://www.auto-data.net/en/volkswagen-golf-iv-2.0-115hp-8679
 *  https://www.auto-data.net/en/volkswagen-golf-iv-1.9-tdi-90hp-8673
 *  https://www.auto-data.net/en/volkswagen-golf-iv-1.9-tdi-110hp-8669
 *  https://www.auto-data.net/en/volkswagen-golf-iv-1.9-tdi-115hp-8670
 *  https://www.auto-data.net/en/volkswagen-golf-v-3-door-1.4-16v-80hp-8616
 *  https://www.auto-data.net/en/volkswagen-golf-v-3-door-1.6-102hp-8622
 *  https://www.auto-data.net/en/volkswagen-golf-v-3-door-1.6-fsi-115hp-8621
 *  https://www.auto-data.net/en/volkswagen-golf-v-3-door-2.0-fsi-150hp-8628
 *  https://www.auto-data.net/en/volkswagen-golf-v-3-door-1.4-tsi-140hp-8620
 *  https://www.auto-data.net/en/volkswagen-golf-v-3-door-1.4-tsi-170hp-dsg-8617
 *  https://www.auto-data.net/en/volkswagen-golf-v-3-door-2.0-tdi-170hp-dpf-8635
 *  https://www.auto-data.net/en/volkswagen-golf-vi-5-door-1.4-80hp-41240
 *  https://www.auto-data.net/en/volkswagen-golf-vi-5-door-1.2-tsi-105hp-41234
 *  https://www.auto-data.net/en/volkswagen-golf-vi-5-door-1.4-tsi-160hp-41243
 *  https://www.auto-data.net/en/volkswagen-golf-vi-5-door-1.6-102hp-41256
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-1.2-tsi-85hp-17884
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-1.2-tsi-105hp-17885
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-1.4-tsi-125hp-20420
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-1.6-tdi-110hp-20423
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-facelift-2017-1.0-tsi-85hp-27624
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-facelift-2017-1.4-tsi-125hp-27414
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-facelift-2017-1.4-tsi-150hp-27830
 *  https://www.auto-data.net/en/volkswagen-golf-vii-5-door-facelift-2017-2.0-tdi-150hp-27723
 *  https://www.auto-data.net/en/volkswagen-golf-viii-1.0-tsi-110hp-40804
 *  https://www.auto-data.net/en/volkswagen-golf-viii-1.0-etsi-110hp-mild-hybrid-dsg-41488
 *  https://www.auto-data.net/en/volkswagen-golf-viii-1.5-etsi-130hp-mild-hybrid-dsg-43585
 *  https://www.auto-data.net/en/volkswagen-golf-viii-2.0-tdi-115hp-38154
 *  https://www.auto-data.net/en/volkswagen-golf-viii-facelift-2024-1.5-tsi-116hp-51263
 *  https://www.auto-data.net/en/volkswagen-golf-viii-facelift-2024-1.5-tsi-150hp-51250
 *  https://www.auto-data.net/en/volkswagen-golf-viii-facelift-2024-1.5-etsi-150hp-mild-hybrid-dsg-51252
 *  https://www.auto-data.net/en/volkswagen-golf-viii-facelift-2024-2.0-tdi-116hp-51743
 *  https://www.auto-data.net/en/volkswagen-golf-viii-facelift-2024-2.0-tdi-150hp-dsg-51742
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-1.2-i-12v-64hp-8440
 *  https://cars-data.com/en/volkswagen/polo/9n-2001-hatchback-8088/1-2-12v-65hp--24924/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-1.4-16v-75hp-8442
 *  https://cars-data.com/en/volkswagen/polo/9n-2001-hatchback-8088/1-4-16v-75hp-24682--24682/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-1.4-16v-101hp-8441
 *  https://cars-data.com/en/volkswagen/polo/9n-2001-hatchback-8088/1-4-16v-100hp--25252/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-1.4-tdi-75hp-8444
 *  https://cars-data.com/en/volkswagen/polo/9n-2001-hatchback-8088/1-4-tdi--24689/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-1.9-tdi-101hp-8447
 *  https://cars-data.com/en/volkswagen/polo/9n-2001-hatchback-8088/1-9-tdi--24691/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-facelift-2005-1.2-70hp-3-d-8410
 *  https://cars-data.com/en/volkswagen/polo/2005-hatchback-9n3-8085/1-2-12v-70hp-trendline--46854/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-facelift-2005-1.4-80hp-3-d-8412
 *  https://cars-data.com/en/volkswagen/polo/2005-hatchback-9n3-8085/1-4-16v-80hp-trendline-42762--42762/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-facelift-2005-1.6-105hp-3-d-8420
 *  https://cars-data.com/en/volkswagen/polo/2005-hatchback-9n3-8085/1-6-16v-trendline-42746--42746/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-facelift-2005-1.4-tdi-80hp-3-d-8418
 *  https://cars-data.com/en/volkswagen/polo/2005-hatchback-9n3-8085/1-4-tdi-80hp-trendline--35824/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-facelift-2005-1.9-tdi-100hp-3-d-8424
 *  https://cars-data.com/en/volkswagen/polo/2005-hatchback-9n3-8085/1-9-tdi-100hp-trendline--35817/specs
 *  https://www.auto-data.net/en/volkswagen-polo-iv-9n-facelift-2005-1.9-tdi-130hp-3-d-8426
 *  https://cars-data.com/en/volkswagen/polo/2005-hatchback-9n3-8085/1-9-tdi-130hp-sportline--35828/specs
 *  https://www.auto-data.net/en/volkswagen-polo-v-5-door-1.2-70hp-8405
 *  https://www.auto-data.net/en/volkswagen-polo-v-5-door-1.4-85hp-8407
 *  https://www.auto-data.net/en/volkswagen-polo-v-5-door-1.2-tdi-75hp-16814
 *  https://www.auto-data.net/en/volkswagen-polo-v-facelift-2014-1.0-60hp-19687
 *  https://www.auto-data.net/en/volkswagen-polo-v-facelift-2014-1.0-75hp-23284
 *  https://www.auto-data.net/en/volkswagen-polo-v-facelift-2014-1.2-tsi-bmt-90hp-19688
 *  https://www.auto-data.net/en/volkswagen-polo-v-facelift-2014-1.2-tsi-bmt-110hp-19689
 *  https://www.auto-data.net/en/volkswagen-polo-v-facelift-2014-1.0-tsi-bmt-110hp-23307
 *  https://www.auto-data.net/en/volkswagen-polo-v-facelift-2014-1.4-tdi-bmt-90hp-19691
 *  https://www.auto-data.net/en/volkswagen-polo-vi-1.0-75hp-30521
 *  https://www.auto-data.net/en/volkswagen-polo-vi-1.0-tsi-115hp-31890
 *  https://www.auto-data.net/en/volkswagen-polo-vi-1.5-tsi-150hp-dsg-36027
 *  https://www.auto-data.net/en/volkswagen-polo-vi-1.6-tdi-80hp-32203
 *  https://www.auto-data.net/en/volkswagen-polo-vi-1.6-tdi-95hp-32204
 *  https://www.auto-data.net/en/volkswagen-polo-vi-facelift-2021-1.0-evo-80hp-45894
 *  https://www.auto-data.net/en/volkswagen-polo-vi-facelift-2021-1.0-tsi-95hp-43431
 *  https://www.auto-data.net/en/volkswagen-polo-vi-facelift-2021-1.0-tsi-110hp-dsg-43419
 *  https://www.auto-data.net/en/seat-ibiza-iii-1.2-12v-64hp-13477
 *  https://www.auto-data.net/en/seat-ibiza-iii-1.4-16v-75hp-13479
 *  https://www.auto-data.net/en/seat-ibiza-iii-1.4-16v-100hp-13478
 *  https://www.auto-data.net/en/seat-ibiza-iii-1.4-tdi-75hp-13480
 *  https://www.auto-data.net/en/seat-ibiza-iii-1.9-tdi-101hp-13484
 *  https://www.auto-data.net/en/seat-ibiza-iii-fr-1.8-i-20v-150hp-13481
 *  https://www.auto-data.net/en/seat-ibiza-iii-fr-1.9-tdi-130hp-13485
 *  https://www.auto-data.net/en/seat-ibiza-iii-facelift-2006-1.2-70hp-34942
 *  https://www.auto-data.net/en/seat-ibiza-iii-facelift-2006-1.4-86hp-34934
 *  https://www.auto-data.net/en/seat-ibiza-iii-facelift-2006-1.4-tdi-80hp-34939
 *  https://www.auto-data.net/en/seat-ibiza-iv-1.2-70hp-13472
 *  https://www.auto-data.net/en/seat-ibiza-iv-1.4-85hp-13468
 *  https://www.auto-data.net/en/seat-ibiza-iv-1.6-mpi-105hp-13469
 *  https://www.auto-data.net/en/seat-ibiza-iv-1.2-tsi-105hp-36506
 *  https://www.auto-data.net/en/seat-ibiza-iv-1.6-tdi-90hp-44361
 *  https://www.auto-data.net/en/seat-ibiza-iv-1.6-tdi-105hp-36507
 *  https://www.auto-data.net/en/seat-ibiza-iv-1.9-tdi-105hp-dpf-13471
 *  https://www.auto-data.net/en/seat-ibiza-iv-fr-1.4-tsi-150hp-dsg-16885
 *  https://www.auto-data.net/en/seat-ibiza-iv-facelift-2015-1.0-75hp-21899
 *  https://www.auto-data.net/en/seat-ibiza-iv-facelift-2015-1.0-eco-tsi-95hp-21920
 *  https://www.auto-data.net/en/seat-ibiza-iv-facelift-2015-1.0-eco-tsi-110hp-21921
 *  https://www.auto-data.net/en/seat-ibiza-iv-facelift-2015-1.2-tsi-90hp-21919
 *  https://www.auto-data.net/en/seat-ibiza-iv-facelift-2015-1.4-tdi-90hp-21927
 *  https://www.auto-data.net/en/seat-ibiza-iv-facelift-2015-1.4-tdi-105hp-21929
 *  https://www.auto-data.net/en/seat-ibiza-iv-facelift-2015-1.4-eco-tsi-150hp-act-21923
 *  https://www.auto-data.net/en/seat-ibiza-v-1.0-mpi-75hp-start-stop-29532
 *  https://www.auto-data.net/en/seat-ibiza-v-1.0-ecotsi-95hp-41469
 *  https://www.auto-data.net/en/seat-ibiza-v-1.6-tdi-80hp-start-stop-32054
 *  https://www.auto-data.net/en/seat-ibiza-v-1.6-tdi-95hp-start-stop-32055
 *  https://www.auto-data.net/en/seat-ibiza-v-facelift-2021-1.0-mpi-80hp-43770
 *  https://www.auto-data.net/en/seat-ibiza-v-facelift-2021-1.0-tsi-95hp-43771
 *  https://www.auto-data.net/en/seat-ibiza-v-facelift-2021-1.0-tsi-110hp-43772
 *  https://www.auto-data.net/en/seat-leon-i-1m-1.4-16v-75hp-13615
 *  https://www.auto-data.net/en/seat-leon-i-1m-1.6-100hp-13616
 *  https://www.auto-data.net/en/seat-leon-i-1m-1.9-tdi-90hp-13623
 *  https://www.auto-data.net/en/seat-leon-i-1m-1.9-tdi-110hp-13621
 *  https://www.auto-data.net/en/seat-leon-i-1m-1.9-tdi-130hp-45185
 *  https://www.auto-data.net/en/seat-leon-i-1m-1.8-t-20v-180hp-13618
 *  https://en.wikipedia.org/wiki/SEAT_León_Mk1
 *  https://www.auto-data.net/en/seat-leon-ii-1p-1.4-mpi-85hp-16897
 *  https://www.auto-data.net/en/seat-leon-ii-1p-1.6-mpi-102hp-13601
 *  https://www.auto-data.net/en/seat-leon-ii-1p-1.4-tsi-125hp-13600
 *  https://www.auto-data.net/en/seat-leon-ii-1p-1.8-tsi-160hp-46446
 *  https://www.auto-data.net/en/seat-leon-ii-1p-1.9-tdi-105hp-13602
 *  https://www.auto-data.net/en/seat-leon-ii-1p-2.0-tdi-16v-140hp-46461
 *  https://www.auto-data.net/en/seat-leon-ii-1p-fr-2.0-tfsi-200hp-13609
 *  https://www.auto-data.net/en/seat-leon-ii-1p-fr-2.0-tdi-170hp-dpf-13606
 *  https://www.auto-data.net/en/seat-leon-ii-1p-facelift-2009-1.2-tsi-105hp-16896
 *  https://www.auto-data.net/en/seat-leon-ii-1p-facelift-2009-1.6-tdi-cr-105hp-dpf-16899
 *  https://www.auto-data.net/en/seat-leon-ii-1p-facelift-2009-2.0-tdi-cr-140hp-dpf-46483
 *  https://www.auto-data.net/en/seat-leon-ii-1p-facelift-2009-fr-2.0-tfsi-211hp-46474
 *  https://www.auto-data.net/en/seat-leon-ii-1p-facelift-2009-fr-2.0-tdi-cr-170hp-dpf-46487
 *  https://www.auto-data.net/en/seat-leon-iii-facelift-2016-1.0-tsi-115hp-27166
 *  https://www.auto-data.net/en/seat-leon-iii-facelift-2016-1.2-tsi-110hp-27110
 *  https://www.auto-data.net/en/seat-leon-iii-facelift-2016-1.5-tsi-130hp-35884
 *  https://www.auto-data.net/en/seat-leon-iii-facelift-2016-fr-1.4-tsi-125hp-27169
 *  https://www.auto-data.net/en/seat-leon-iii-facelift-2016-fr-1.4-tsi-150hp-26934
 *  https://www.auto-data.net/en/seat-leon-iii-facelift-2016-1.5-tsi-150hp-35786
 *  https://www.auto-data.net/en/seat-leon-iii-facelift-2016-fr-2.0-tdi-150hp-26970
 *  https://www.auto-data.net/en/seat-leon-iv-1.0-tsi-110hp-40786
 *  https://www.auto-data.net/en/seat-leon-iv-1.5-tsi-130hp-39367
 *  https://www.auto-data.net/en/seat-leon-iv-1.5-tsi-150hp-39368
 *  https://www.auto-data.net/en/seat-leon-iv-1.5-etsi-150hp-mild-hybrid-dsg-39369
 *  https://www.auto-data.net/en/seat-leon-iv-2.0-tdi-115hp-40787
 *  https://www.auto-data.net/en/seat-leon-iv-2.0-tdi-150hp-dsg-39370
 *  https://www.auto-data.net/en/seat-leon-iv-1.4-e-hybrid-204hp-dsg-41520
 *  https://www.auto-data.net/en/audi-a1-8x-1.2-tfsi-86hp-18960
 *  https://www.auto-data.net/en/audi-a1-8x-1.4-tfsi-122hp-18962
 *  https://www.auto-data.net/en/audi-a1-8x-1.4-tfsi-185hp-s-tronic-18961
 *  https://www.auto-data.net/en/audi-a1-8x-1.6-tdi-90hp-18966
 *  https://www.auto-data.net/en/audi-a1-8x-1.6-tdi-105hp-18968
 *  https://www.auto-data.net/en/audi-a1-8x-2.0-tdi-143hp-18969
 *  https://www.auto-data.net/en/audi-a1-8x-facelift-2014-1.0-tfsi-ultra-95hp-22384
 *  https://www.auto-data.net/en/audi-a1-8x-facelift-2014-1.4-tfsi-125hp-20620
 *  https://www.auto-data.net/en/audi-a1-8x-facelift-2014-1.4-tfsi-150hp-20622
 *  https://www.auto-data.net/en/audi-a1-8x-facelift-2014-1.6-tdi-116hp-20624
 *  https://www.auto-data.net/en/audi-a1-8x-facelift-2014-1.8-tfsi-192hp-s-tronic-31980
 *  https://www.auto-data.net/en/audi-a1-sportback-gb-25-tfsi-95hp-35810
 *  https://www.auto-data.net/en/audi-a1-sportback-gb-30-tfsi-116hp-34083
 *  https://www.auto-data.net/en/audi-a1-sportback-gb-35-tfsi-150hp-s-tronic-35811
 *  https://www.auto-data.net/en/audi-a1-sportback-gb-40-tfsi-200hp-s-tronic-35812
 *  https://www.auto-data.net/en/audi-a3-8l-1.6i-101hp-4236
 *  https://www.auto-data.net/en/audi-a3-8l-1.8-20v-125hp-4237
 *  https://www.auto-data.net/en/audi-a3-8l-1.8-t-150hp-4238
 *  https://www.auto-data.net/en/audi-a3-8l-1.9-tdi-90hp-4245
 *  https://www.auto-data.net/en/audi-a3-8l-1.9-tdi-110hp-4243
 *  https://www.auto-data.net/en/audi-a3-8l-facelift-2000-1.8-t-150hp-26945
 *  https://www.auto-data.net/en/audi-a3-8l-facelift-2000-1.8-t-180hp-27046
 *  https://www.auto-data.net/en/audi-a3-8l-facelift-2000-1.9-tdi-100hp-4242
 *  https://www.auto-data.net/en/audi-a3-8l-facelift-2000-1.9-tdi-130hp-4244
 *  https://www.auto-data.net/en/audi-a3-8p-1.6-102hp-4182
 *  https://www.auto-data.net/en/audi-a3-8p-1.6-fsi-115hp-4181
 *  https://www.auto-data.net/en/audi-a3-8p-2.0-fsi-150hp-4189
 *  https://www.auto-data.net/en/audi-a3-8p-2.0-tfsi-200hp-dsg-4198
 *  https://www.auto-data.net/en/audi-a3-8p-facelift-2008-1.2-tfsi-105hp-start-stop-27133
 *  https://www.auto-data.net/en/audi-a3-8p-facelift-2008-1.8-tfsi-160hp-27144
 *  https://www.auto-data.net/en/audi-a3-8p-facelift-2008-1.6-tdi-105hp-55455
 *  https://www.auto-data.net/en/audi-a3-8p-facelift-2008-2.0-tdi-170hp-4193
 *  https://www.auto-data.net/en/audi-a3-8v-1.2-tfsi-110hp-23070
 *  https://www.auto-data.net/en/audi-a3-8v-1.8-tfsi-180hp-23174
 *  https://www.auto-data.net/en/audi-a3-8v-1.6-tdi-110hp-clean-diesel-23080
 *  https://www.auto-data.net/en/audi-a3-8v-2.0-tdi-184hp-clean-diesel-23206
 *  https://www.auto-data.net/en/audi-a3-sportback-8v-facelift-2016-1.0-tfsi-115hp-23727
 *  https://www.auto-data.net/en/audi-a3-sportback-8v-facelift-2016-2.0-tfsi-190hp-23779
 *  https://www.auto-data.net/en/audi-a3-sportback-8v-facelift-2016-1.6-tdi-116hp-43248
 *  https://www.auto-data.net/en/audi-a3-sportback-8y-30-tdi-116hp-39293
 *  https://www.auto-data.net/en/audi-a3-sportback-8y-35-tdi-150hp-49020
 *  https://www.auto-data.net/en/audi-a3-sportback-8y-35-tfsi-150hp-mild-hybrid-s-tronic-39970
 *  https://www.auto-data.net/en/audi-a3-sportback-8y-40-tfsi-e-204hp-plug-in-hybrid-s-tronic-41343
 *  https://www.auto-data.net/en/audi-a4-b5-typ-8d-1.6i-101hp-4409
 *  https://www.auto-data.net/en/audi-a4-b5-typ-8d-1.8-20v-125hp-4410
 *  https://www.auto-data.net/en/audi-a4-b5-typ-8d-1.8-20v-turbo-150hp-4412
 *  https://www.auto-data.net/en/audi-a4-b5-typ-8d-1.9-tdi-90hp-4419
 *  https://www.auto-data.net/en/audi-a4-b5-typ-8d-1.9-tdi-110hp-4416
 *  https://www.auto-data.net/en/audi-a4-b5-typ-8d-2.5-tdi-v6-150hp-4424
 *  https://www.auto-data.net/en/audi-a4-b6-8e-1.8-t-150hp-4350
 *  https://www.auto-data.net/en/audi-a4-b6-8e-1.8-t-163hp-4351
 *  https://www.auto-data.net/en/audi-a4-b6-8e-2.0i-20v-131hp-4363
 *  https://www.auto-data.net/en/audi-a4-b6-8e-1.9-tdi-101hp-4358
 *  https://www.auto-data.net/en/audi-a4-b6-8e-1.9-tdi-130hp-4360
 *  https://www.auto-data.net/en/audi-a4-b6-8e-2.5-tdi-v6-163hp-4371
 *  https://www.auto-data.net/en/audi-a4-b6-8e-3.0i-v6-220hp-4374
 *  https://www.auto-data.net/en/audi-a4-b7-8e-2.0-130hp-26526
 *  https://www.auto-data.net/en/audi-a4-b7-8e-1.8-t-163hp-26700
 *  https://www.auto-data.net/en/audi-a4-b7-8e-2.0-tfsi-200hp-4365
 *  https://www.auto-data.net/en/audi-a4-b7-8e-1.9-tdi-115hp-26495
 *  https://www.auto-data.net/en/audi-a4-b7-8e-2.0-tdi-140hp-26679
 *  https://www.auto-data.net/en/audi-a4-b7-8e-2.7-tdi-v6-180hp-4373
 *  https://www.auto-data.net/en/audi-a4-b8-8k-1.8-tfsi-120hp-4301
 *  https://www.auto-data.net/en/audi-a4-b8-8k-1.8-tfsi-160hp-4303
 *  https://www.auto-data.net/en/audi-a4-b8-8k-2.0-tfsi-211hp-4314
 *  https://www.auto-data.net/en/audi-a4-b8-8k-2.0-tdi-143hp-4306
 *  https://www.auto-data.net/en/audi-a4-b8-8k-2.0-tdi-170hp-4310
 *  https://www.auto-data.net/en/audi-a4-b8-8k-2.7-tdi-v6-190hp-4317
 *  https://www.auto-data.net/en/audi-a4-b8-8k-facelift-2011-1.8-tfsi-170hp-18826
 *  https://www.auto-data.net/en/audi-a4-b8-8k-facelift-2011-2.0-tfsi-225hp-18837
 *  https://www.auto-data.net/en/audi-a4-b8-8k-facelift-2011-2.0-tdi-136hp-26559
 *  https://www.auto-data.net/en/audi-a4-b8-8k-facelift-2011-2.0-tdi-150hp-18810
 *  https://www.auto-data.net/en/audi-a4-b8-8k-facelift-2011-2.0-tdi-177hp-18813
 *  https://www.auto-data.net/en/audi-a4-b8-8k-facelift-2011-3.0-tdi-v6-204hp-18818
 *  https://www.auto-data.net/en/audi-a4-b9-8w-1.4-tfsi-150hp-22290
 *  https://www.auto-data.net/en/audi-a4-b9-8w-2.0-tfsi-ultra-190hp-22318
 *  https://www.auto-data.net/en/audi-a4-b9-8w-2.0-tdi-150hp-22292
 *  https://www.auto-data.net/en/audi-a4-b9-8w-2.0-tdi-190hp-23136
 *  https://www.auto-data.net/en/audi-a4-b9-8w-3.0-tdi-v6-218hp-s-tronic-23078
 *  https://www.auto-data.net/en/audi-a4-b9-8w-facelift-2019-35-tfsi-150hp-37525
 *  https://www.auto-data.net/en/audi-a4-b9-8w-facelift-2019-30-tdi-136hp-s-tronic-37522
 *  https://www.auto-data.net/en/audi-a4-b9-8w-facelift-2019-35-tdi-163hp-s-tronic-37523
 *  https://www.auto-data.net/en/audi-a4-b9-8w-facelift-2019-40-tdi-190hp-s-tronic-37075
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-e87-116i-115hp-9793
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-e87-lci-facelift-2007-116i-122hp-9798
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-116i-136hp-17712
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-e87-118i-129hp-9805
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-e87-lci-facelift-2007-118i-143hp-9808
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-118i-170hp-17713
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-lci-facelift-2015-118i-136hp-23002
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f40-118i-140hp-37175
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-e87-120i-150hp-9815
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-e87-lci-facelift-2007-120i-170hp-9818
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-lci-facelift-2015-120i-177hp-22880
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f40-120i-178hp-steptronic-41482
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-116d-116hp-17252
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-lci-facelift-2015-116d-116hp-22964
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f40-116d-116hp-37178
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-e87-118d-122hp-9802
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-e87-lci-facelift-2007-118d-143hp-27396
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-118d-143hp-17253
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-lci-facelift-2015-118d-150hp-23064
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f40-118d-150hp-37180
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-e87-120d-163hp-9810
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-f40-120d-190hp-steptronic-38805
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-e87-lci-facelift-2007-123d-204hp-9822
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-125d-218hp-17717
 *  https://www.auto-data.net/en/bmw-1-series-hatchback-5dr-f20-lci-facelift-2015-125d-224hp-steptronic-23087
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-316i-105hp-9975
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-facelift-2001-316i-116hp-9976
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-316i-136hp-17731
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-318i-118hp-9978
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-facelift-2001-318i-143hp-9979
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-318i-129hp-9927
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-lci-facelift-2008-318i-143hp-27599
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-lci-facelift-2015-318i-136hp-22929
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-318i-156hp-steptronic-38853
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-320i-150hp-9982
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-facelift-2001-320i-170hp-9983
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-320i-150hp-9929
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-lci-facelift-2008-320i-170hp-27798
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-320i-184hp-17207
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-lci-facelift-2015-320i-184hp-23001
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-320i-184hp-steptronic-37228
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-lci-facelift-2022-320i-184hp-steptronic-45812
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-facelift-2001-325i-192hp-9985
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-325i-218hp-9930
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-328i-245hp-17208
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-330i-258hp-9933
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-lci-facelift-2015-330i-252hp-22990
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-lci-facelift-2022-330i-245hp-steptronic-45814
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-lci-facelift-2022-330e-292hp-plug-in-hybrid-steptronic-45817
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-316d-116hp-17210
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-facelift-2001-318d-115hp-9977
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-318d-122hp-9926
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-lci-facelift-2008-318d-143hp-27786
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-318d-143hp-17211
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-lci-facelift-2015-318d-150hp-23028
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-318d-150hp-37229
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-lci-facelift-2022-318d-150hp-mild-hybrid-steptronic-45819
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-320d-136hp-9980
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-320d-163hp-9928
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-lci-facelift-2008-320d-184hp-27787
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-320d-163hp-efficientdynamics-edition-17213
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-320d-190hp-mild-hybrid-steptronic-39316
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-lci-facelift-2022-320d-190hp-mild-hybrid-steptronic-45820
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-325d-197hp-37133
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-lci-facelift-2008-325d-204hp-27803
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-330d-184hp-9988
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e46-facelift-2001-330d-204hp-9989
 *  https://cars-data.com/en/bmw/3-series/2001-sedan/330d-28280--28280/specs
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-330d-231hp-9932
 *  https://www.auto-data.net/en/bmw-3-series-sedan-e90-lci-facelift-2008-330d-245hp-27571
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-330d-258hp-steptronic-17737
 *  https://www.auto-data.net/en/bmw-3-series-sedan-f30-lci-facelift-2015-330d-258hp-steptronic-23065
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-330d-265hp-steptronic-37231
 *  https://www.auto-data.net/en/bmw-3-series-sedan-g20-330d-286hp-mild-hybrid-steptronic-41492
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w168-a-140-82hp-13204
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w168-a-160-102hp-13206
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w168-a-190-125hp-13213
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w168-a-170-cdi-90hp-13210
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w169-a-150-95hp-13151
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w169-a-170-115hp-13165
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w169-a-200-136hp-13180
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w169-a-200-turbo-193hp-13197
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w169-a-180-cdi-109hp-13173
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w169-a-200-cdi-140hp-13189
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-a-180-122hp-18624
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-a-200-156hp-18627
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-a-250-211hp-7g-dct-18628
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-a-180-cdi-109hp-18625
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-a-200-cdi-136hp-18623
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-a-220-cdi-170hp-7g-dct-18626
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-facelift-2015-a-180-122hp-23488
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-facelift-2015-a-200-156hp-23529
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-facelift-2015-a-250-211hp-23530
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-facelift-2015-a-180d-109hp-23406
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-facelift-2015-a-200d-136hp-23526
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w176-facelift-2015-a-220d-177hp-7g-dct-23378
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-180-136hp-33753
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-200-163hp-32804
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-220-190hp-7g-dct-35953
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-250-224hp-7g-dct-32806
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-180d-116hp-7g-dct-32807
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-200d-150hp-8g-dct-35951
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-220d-190hp-8g-dct-35952
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-a-250e-218hp-plug-in-hybrid-8g-dct-37687
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-facelift-2022-a-180-136hp-mild-hybrid-7g-dct-46621
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-facelift-2022-a-200-163hp-mild-hybrid-7g-dct-46622
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-facelift-2022-a-180d-116hp-8g-dct-46631
 *  https://www.auto-data.net/en/mercedes-benz-a-class-w177-facelift-2022-a-200d-150hp-8g-dct-46632
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-c-200-2.0-kompressor-163hp-12569
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-c-180-kompressor-143hp-12566
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-c-200-cdi-116hp-12588
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-c-220-cdi-143hp-12571
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-c-270-cdi-170hp-12577
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-c-320-v6-218hp-41001
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-facelift-2004-c-180-kompressor-143hp-41158
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-facelift-2004-c-200-kompressor-163hp-12570
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-facelift-2004-c-230-v6-204hp-12573
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-facelift-2004-c-200-cdi-122hp-12567
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-facelift-2004-c-220-cdi-150hp-12572
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w203-facelift-2004-c-320-cdi-v6-224hp-12584
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-c-180-1.8-kompressor-156hp-43161
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-c-200-kompressor-184hp-12541
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-c-200-cdi-136hp-12540
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-c-220-cdi-170hp-44274
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-c-250-cdi-blueefficiency-204hp-41927
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-c-350-cdi-blueefficiency-v6-231hp-7g-tronic-41930
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-facelift-2011-c-180-1.6-blueefficiency-156hp-17354
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-facelift-2011-c-200-blueefficiency-184hp-17355
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-facelift-2011-c-250-blueefficiency-204hp-7g-tronic-plus-17356
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-facelift-2011-c-200-cdi-136hp-17350
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-facelift-2011-c-220-cdi-blueefficiency-170hp-17351
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w204-facelift-2011-c-250-cdi-blueefficiency-204hp-17352
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-c-180-156hp-18670
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-c-200-184hp-18671
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-c-250-211hp-7g-tronic-plus-20879
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-c-300-245hp-7g-tronic-plus-24846
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-c-200d-1.6-136hp-20814
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-c-220d-170hp-18672
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-c-250d-204hp-7g-tronic-plus-20815
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-facelift-2018-c-180-1.6-156hp-38184
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-facelift-2018-c-200-184hp-eq-boost-9g-tronic-32994
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-facelift-2018-c-300-258hp-eq-boost-9g-tronic-33291
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-facelift-2018-c-220d-194hp-9g-tronic-32993
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-facelift-2018-c-300d-245hp-9g-tronic-33700
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w205-facelift-2018-c-300e-320hp-eq-power-9g-tronic-38099
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-c-180-170hp-eq-boost-9g-tronic-42343
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-c-200-204hp-eq-boost-9g-tronic-42344
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-c-300-258hp-eq-boost-9g-tronic-42346
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-c-220d-200hp-eq-boost-9g-tronic-42348
 *  https://www.auto-data.net/en/mercedes-benz-c-class-w206-c-300e-313hp-plug-in-hybrid-9g-tronic-44914
 *  https://www.ultimatespecs.com/car-specs/Mini/924/Mini-Mini-R50-One-16.html
 *  https://www.auto-data.net/en/mini-hatch-r56-one-1.6-75hp-21496
 *  https://www.auto-data.net/en/mini-hatch-r56-one-1.6-98hp-21494
 *  https://www.auto-data.net/en/mini-hatch-f56-3-door-one-1.2-102hp-21546
 *  https://www.auto-data.net/en/mini-hatch-f56-facelift-2018-3-door-one-first-1.5-75hp-32579
 *  https://www.auto-data.net/en/mini-hatch-f56-facelift-2018-3-door-one-1.5-102hp-32580
 *  https://www.auto-data.net/en/mini-hatch-f56-facelift-2021-3-door-one-1.5-102hp-46729
 *  https://www.ultimatespecs.com/car-specs/Mini/47457/Mini-Mini-R50-One-D-75.html
 *  https://www.ultimatespecs.com/car-specs/Mini/930/Mini-Mini-R50-One-D-90.html
 *  https://www.auto-data.net/en/mini-hatch-r56-one-d-1.6-90hp-21497
 *  https://www.auto-data.net/en/mini-hatch-f56-3-door-one-d-1.5-95hp-21548
 *  https://www.auto-data.net/en/mini-hatch-r56-cooper-d-1.6-112hp-21515
 *  https://www.auto-data.net/en/mini-hatch-f56-3-door-cooper-d-1.5-116hp-21553
 *  https://www.auto-data.net/en/mini-hatch-f56-facelift-2018-3-door-cooper-d-1.5-116hp-32587
 *  https://www.auto-data.net/en/mini-hatch-r56-cooper-sd-2.0-143hp-21505
 *  https://www.auto-data.net/en/mini-hatch-f56-3-door-cooper-sd-2.0-170hp-21557
 *  https://www.auto-data.net/en/mini-hatch-r56-cooper-1.6-122hp-21498
 *  https://www.auto-data.net/en/mini-hatch-f56-facelift-2018-3-door-cooper-1.5-136hp-32582
 *  https://www.auto-data.net/en/mini-hatch-f56-facelift-2021-3-door-cooper-1.5-136hp-46731
 *  https://www.auto-data.net/en/mini-hatch-f66-3-door-cooper-c-1.5-156hp-steptronic-51170
 */
export const CAR_EVERYDAY_DATA = `
@Ford
=Ka
Mk1|1.3 60|1996-2002|60p|890|105n|n
Mk1|1.3 Duratec 70|2002-2008|70p|890|106n|n
Mk2|1.2 69|2009-2016|69p|865|102n|n
Mk2|1.3 TDCi 75|2009-2016|75p|980|145n|d
Ka+|1.2 Ti-VCT 70|2016-2018|70p|934|105n|n
Ka+|1.2 Ti-VCT 85|2016-2018|85p|934|112n|n
=Focus
Mk1|1.4 16v|1999-2005|75p|1068|125n|n
Mk1|1.8 16v Zetec|1999-2005|115p|1125|160n|n
Mk1|2.0 16v Zetec|1999-2005|131p|1146|173n|n
Mk1|1.8 TDDi 90|1999-2005|90p|1183|200n|d
Mk1|1.8 TDCi 115|2001-2005|115p|1279|250n|d
Mk2|1.4 Duratec 80|2005-2010|80p|1245|127n|n
Mk2|1.6 Duratec 100|2005-2010|100p|1242|143n|n
Mk2|1.8 Duratec 125|2005-2010|125p|1265|165n|n
Mk2|2.0 Duratec 145|2005-2010|145p|1326|185n|n
Mk2|1.8 TDCi 115|2005-2006|116p|1357|250n|d
Mk2|2.0 TDCi 136|2005-2010|136p|1335|320n|d
Mk3|1.0 EcoBoost 100|2012-2014|100p|1201||t
Mk3|1.6 Ti-VCT 125|2010-2014|125p|1201|159n|n
Mk3|1.6 EcoBoost 150|2010-2014|150p|1258||t
Mk3|2.0 TDCi 140|2010-2014|140p|1346||d
Mk3|2.0 TDCi 163|2010-2014|163p|1346||d
Mk3 facelift|1.0 EcoBoost 100|2014-2018|100p|1276|170n|t
Mk3 facelift|1.5 EcoBoost 150|2014-2018|150p|1325|240n|t
Mk3 facelift|1.5 EcoBoost 182|2014-2018|182p|1325|240n|t
Mk3 facelift|1.5 TDCi 120|2014-2018|120p|1343|270n|d
Mk3 facelift|2.0 TDCi 150|2014-2018|150p|1415|370n|d
Mk4|1.0 EcoBoost 100|2018-2021|100p|1247|170n|t
Mk4|1.5 EcoBoost 150|2018-2021|150p|1294|240n|t
Mk4|1.5 EcoBoost 182|2018-2021|182p|1294|240n|t
Mk4|2.0 EcoBlue 150|2018-2021|150p|1418|370n|d
Mk4|1.0 EcoBoost 155 mHEV|2020-2021|155p|1269|190n|h
=Fiesta
Mk5|1.25 16v Zetec|1999-2001|75p|1015|110n|n
Mk5|1.6 16v Zetec S|1999-2001|103p|1029|145n|n
Mk5|1.8 DI|1999-2001|75p|1097|140n|d
Mk6|1.4 Duratec 80|2002-2005|80p|1024|124n|n
Mk6|1.6 Duratec Zetec S|2002-2005|100p|1026|146n|n
Mk6|1.4 TDCi 68|2002-2005|68p|1063|160n|d
Mk6 facelift|1.6 Duratec Zetec S|2005-2008|100p|1053|146n|n
Mk6 facelift|1.6 TDCi 90|2005-2008|90p|1155|204n|d
Mk7|1.4 96|2008-2012|96p|1041|125n|n
Mk7|1.6 Ti-VCT Zetec S|2008-2012|120p|1109|152n|n
Mk7|1.6 TDCi 90|2009-2010|90p|1022|212n|d
Mk7 facelift|1.6 TDCi 95|2012-2015|95p|1033|200n|d
Mk7 facelift|1.5 TDCi 75|2012-2017|75p|1033|185n|d
Mk8|1.0 EcoBoost 140 ST-Line|2017-2020|140p|1069|180n|t
Mk8|1.1 Ti-VCT 85|2017-2019|85p|1033|110n|n
Mk8|1.5 TDCi 85|2017-2020|85p|1083|215n|d
Mk8|1.0 EcoBoost 155 mHEV|2020-2021|155p|1139|240n|h
Mk8 facelift|1.0 EcoBoost 125 mHEV|2021-2023|125p|1136|210n|h
@Vauxhall
=Corsa
B|1.4i 8v|1993-1997|60p|875|103n|n
B facelift|1.0 12v|1997-2000|54p|872|82n|n
B facelift|1.2 16v|1998-2000|65p|870|110n|n
B facelift|1.4 16v|1997-2000|90p|950|114n|n
B facelift|1.5 TD|1997-2000|67p|937|132n|d
C|1.0 12v|2000-2003|58p|880|85n|n
C|1.4 16v|2000-2003|90p|953|125n|n
C|1.8 16v SRi|2001-2003|125p|1015|170n|n
C|1.7 DTi|2000-2003|75p|1040|165n|d
C facelift|1.3 CDTi|2003-2006|70p|1035|170n|d
D|1.3 CDTi 75|2006-2010|75p|1160|170n|d
D|1.3 CDTi 90|2006-2010|90p|1170|200n|d
D|1.7 CDTi 125|2006-2010|125p|1170|280n|d
E|1.2 70|2015-2018|70p|1045|115n|n
E|1.4 75|2014-2018|75p|1166|130n|n
E|1.4 Turbo 100|2015-2018|100p|1124|200n|t
E|1.4 Turbo 150 SRi|2015-2018|150p|1139|220n|t
E|1.3 CDTi 75|2015-2018|75p|1124|190n|d
E|1.3 CDTi 95|2015-2018|95p|1124|190n|d
F|1.5 Turbo D 100|2019-2023|102p|1090|250n|d
=Astra
G|1.4 16v|1998-2000|90p|1090|125n|n
G|1.6 16v|1998-2000|101p|1115|150n|n
G|1.8 16v|2000-2002|125p|1155|170n|n
G|1.7 DTi|2000-2002|75p|1185|165n|d
G|2.0 DTi|1999-2002|101p|1250|205n|d
G facelift|2.2 16v SRi|2002-2004|147p|1175|203n|n
H|1.4 16v|2004-2006|90p|1130|125n|n
H|1.8 16v 140|2005-2006|140p|1278|175n|n
H|1.7 CDTi 100|2004-2006|100p|1265|240n|d
H|1.9 CDTi 120|2004-2006|120p|1393|280n|d
H facelift|1.8 16v 140|2007-2009|140p|1203|175n|n
H facelift|1.6 Turbo 180 SRi|2007-2009|180p|1280|230n|t
J facelift|2.0 CDTi 165|2012-2015|165p|1373|350n|d
K|1.4 100|2015-2018|100p|1169|130n|n
K|1.4 Turbo 125|2015-2018|125p|1203|245n|t
K|1.4 Turbo 150|2015-2018|150p|1203|245n|t
K|1.6 CDTi 110|2015-2018|110p|1285|300n|d
K facelift|1.2 Turbo 130|2019-2021|130p|1205|225n|t
K facelift|1.2 Turbo 145|2019-2021|145p|1205|225n|t
K facelift|1.5 Turbo D 122|2019-2021|122p|1296|300n|d
@Peugeot
=106
Ph1|1.1 8v|1991-1996|60p|780|88n|n
Ph1|1.4 8v|1991-1996|75p|820|111n|n
Ph1|1.5 D|1994-1996|55p|880|95n|d
Ph2|1.4 8v|1996-2000|75p|815|111n|n
Ph2|1.5 D|2000-2003|57p|875|95n|d
=206
Ph1|1.1 8v|1998-2003|60p|910|91n|n
Ph1|1.4 8v|1998-2003|75p|950|111n|n
Ph1|1.6 16v|1998-2003|109p|1088|147n|n
Ph1|1.4 HDi|2001-2003|68p|975|150n|d
Ph1|2.0 HDi 90|1999-2003|90p|1070|205n|d
Ph2|1.4 16v|2003-2009|88p|963|133n|n
Ph2|1.6 16v|2003-2009|109p|1013|147n|n
Ph2|1.6 HDi 110|2003-2009|109p|1055|240n|d
=207
Ph1|1.4 VTi|2006-2009|95p|1165|136n|n
Ph1|1.6 HDi 90|2006-2009|90p|1304|215n|d
Ph1 GT|1.6 THP 150|2006-2009|150p|1281|240n|t
Ph2|1.6 VTi|2009-2012|120p|1180|160n|n
Ph2 GT|1.6 THP 156|2009-2012|156p|1234|240n|t
=208
Mk1|1.2 VTi 82|2012-2015|82p|975|118n|n
Mk1|1.6 VTi 120|2012-2015|120p|1090|160n|n
Mk1|1.6 THP 155|2012-2015|155p|1165||t
Mk1|1.6 e-HDi 92|2012-2015|92p|1080|230n|d
Mk1 facelift|1.2 PureTech 82|2015-2018|82p|960|118n|n
Mk1 facelift|1.2 PureTech 110|2015-2018|110p|1060|205n|t
Mk1 facelift|1.6 BlueHDi 100|2015-2018|100p|1090|254n|d
Mk2|1.2 PureTech 75|2019-2022|75p|980|118n|n
Mk2|1.2 PureTech 100|2019-2023|100p|1090|205n|t
Mk2|1.2 PureTech 130 EAT8|2019-2023|130p|1158|230n|t
Mk2|1.5 BlueHDi 100|2019-2023|100p|1090|250n|d
Mk2|e-208 50 kWh|2019-2023|136p|1455|260n|e
@Citroen
=C2
Ph1|1.1 8v|2003-2008|60p|932|94n|n
Ph1|1.4 8v|2003-2008|73p|987|116n|n
Ph1|1.4 HDi|2003-2008|68p|996|150n|d
Ph1 VTR|1.6 16v SensoDrive|2003-2008|109p|1055|147n|n
@Nissan
=Micra
K11|1.0 16v|1992-2000|54p|775|79n|n
K11|1.5 D|1998-2002|57p|900|95n|d
K11 facelift|1.0 16v 60|2000-2002|60p|835|80n|n
K11 facelift|1.4 16v|2000-2002|82p|865|108n|n
K12|1.2 16v 80|2003-2005|80p|970|110n|n
K12|1.2 16v 65|2005-2010|65p|980|110n|n
K12|1.4 16v|2003-2005|88p|975|128n|n
K12|1.5 dCi 82|2003-2005|82p|1025|185n|d
@Toyota
=Yaris
Mk1|1.0 VVT-i|1999-2003|68p|830|90n|n
Mk1|1.3 VVT-i|1999-2003|86p|975|124n|n
Mk1|1.4 D-4D|2001-2003|75p|1025|170n|d
Mk1 facelift|1.0 VVT-i|2003-2005|65p|880|90n|n
Mk1 facelift|1.3 VVT-i|2003-2005|87p|895|122n|n
Mk2|1.0 VVT-i|2005-2011|69p|980|93n|n
Mk2|1.3 VVT-i|2005-2008|87p|1010|121n|n
Mk2|1.33 Dual VVT-i|2009-2010|101p|1050|132n|n
Mk2|1.4 D-4D|2006-2009|90p|980|190n|d
Mk3|1.0 VVT-i|2011-2014|69p|950|93n|n
Mk3|1.33 Dual VVT-i|2011-2014|99p|1090|125n|n
Mk3|1.4 D-4D|2011-2014|90p|1135|205n|d
Mk3|1.5 Hybrid|2012-2014|100p|1085||h
Mk4|1.5 Hybrid 115|2020-2024|115p|1110||h
Mk4|1.5 Hybrid 130|2023-2024|130p|1175|185n|h
=Corolla
E110|1.3 16v|1997-1999|86p|1060|120n|n
E110|1.6 16v|1997-2001|110p|1100|145n|n
E120|1.4 VVT-i|2001-2006|97p|1125|130n|n
E120|1.6 VVT-i|2001-2006|110p|1130|150n|n
E120|1.4 D-4D|2004-2006|90p|1190|190n|d
E120|2.0 D-4D 90|2001-2006|90p|1270|215n|d
E210|1.2 Turbo|2019-2022|116p|1300|185n|t
E210|1.8 Hybrid|2018-2022|122p|1285||h
E210|2.0 Hybrid 180|2018-2020|180p|1340||h
=Aygo
Aygo X|1.0 VVT-i|2021-2025|72p|940|93n|n
@Honda
=Jazz
Mk1 GD|1.2 i-DSI|2002-2008|78p|980|110n|n
Mk1 GD|1.4 i-DSI|2002-2008|83p|980|119n|n
Mk2 GE|1.2 i-VTEC|2008-2011|90p|1047|114n|n
Mk2 GE|1.4 i-VTEC|2008-2011|100p|1047|127n|n
Mk3 GK|1.3 i-VTEC|2015-2017|102p|1138|123n|n
Mk3 GK facelift|1.5 i-VTEC Sport|2018-2020|130p|1029|155n|n
Mk4|1.5 i-MMD e:HEV|2020-2023|109p|1228|253n|h
=Civic
EP|1.4 16v|2001-2005|90p|1167|120n|n
EP|1.6 16v|2001-2005|110p|1192|152n|n
EP|1.7 CTDi|2001-2005|99p|1265|220n|d
FK|1.4 i-DSI|2006-2011|83p|1170|119n|n
FK|2.2 i-CTDi|2006-2011|140p|1350|340n|d
Mk9 FK|1.4 i-VTEC|2012-2014|100p|1272|127n|n
Mk9 FK|1.8 i-VTEC|2012-2014|142p|1344|174n|n
Mk9 FK|1.6 i-DTEC|2013-2014|120p|1310|300n|d
Mk9 FK|2.2 i-DTEC|2012-2014|150p|1487|350n|d
FK7|1.6 i-DTEC|2018-2019|120p|1287|300n|d
@Kia
=Picanto
Mk1|1.0|2004-2007|60p|923|86n|n
Mk1|1.1|2004-2007|64p|923|97n|n
Mk2|1.0|2011-2015|69p|840|95n|n
Mk2|1.25|2011-2015|85p|850|120n|n
Mk3|1.0|2017-2020|67p|935|96n|n
Mk3|1.25|2017-2020|84p|939|122n|n
Mk3|1.0 T-GDi|2017-2020|100p|933|172n|t
=Rio
Mk2|1.4|2005-2009|97p|1154|125n|n
Mk3|1.25|2011-2015|85p|1029|121n|n
Mk3|1.4|2011-2015|109p|1066|137n|n
Mk3|1.1 CRDi|2011-2015|75p|1116|170n|d
Mk3|1.4 CRDi|2011-2015|90p|1164|220n|d
Mk4|1.25|2017-2020|84p|1110|122n|n
Mk4|1.0 T-GDi 100|2017-2020|100p|1155|172n|t
Mk4|1.0 T-GDi 120|2017-2020|120p|1160|172n|t
Mk4|1.4 CRDi 77|2017-2018|77p|1230|240n|d
@Hyundai
=i10
Mk1|1.1|2008-2010|67p|1000|98n|n
Mk1|1.2|2008-2010|78p|1035|119n|n
Mk2|1.0|2013-2016|67p|933|95n|n
Mk2|1.25|2013-2016|87p|941|120n|n
Mk3|1.0 MPi|2019-2023|67p|921|96n|n
Mk3|1.2 MPi|2019-2023|84p|932|118n|n
Mk3 N Line|1.0 T-GDi|2020-2023|100p|1024|172n|t
=i20
Mk1|1.2|2009-2012|78p|1045|119n|n
Mk1|1.4|2009-2012|101p|1025|137n|n
Mk1|1.4 CRDi 90|2010-2012|90p|1099|220n|d
Mk2|1.2 84|2014-2018|84p|1040|122n|n
Mk2|1.0 T-GDi 100|2016-2018|100p|1065|172n|t
Mk2|1.4 CRDi|2014-2018|90p|1165|240n|d
Mk3|1.0 T-GDi 100|2020-2023|100p|1065|172n|t
Mk3|1.0 T-GDi 100 48V mHEV|2020-2023|100p|1090|172n|h
=i30
Mk1|1.4|2008-2010|109p|1268|137n|n
Mk1|1.6|2007-2010|122p|1268|157n|n
Mk1|2.0|2007-2010|143p|1327|186n|n
Mk1|1.6 CRDi 116|2007-2010|116p|1366|255n|d
Mk2|1.4|2012-2015|100p|1185|137n|n
Mk2|1.6 GDi|2012-2015|135p|1193|157n|n
Mk2|1.6 CRDi 110|2012-2015|110p|1290|260n|d
Mk2|1.6 CRDi 128|2012-2015|128p|1290|260n|d
Mk3|1.0 T-GDi|2016-2018|120p|1194|171n|t
Mk3|1.4 T-GDi|2016-2018|140p|1204|242n|t
Mk3|1.6 CRDi 110|2016-2018|110p|1263|280n|d
Mk3|1.6 CRDi 136|2016-2018|136p|1263|280n|d
@Skoda
=Octavia
Mk1|1.6 101|1997-2000|101p|1220|145n|n
Mk1|1.8T 20v 150|1997-2000|150p|1285|210n|t
Mk1|1.9 TDI 90|1996-2000|90p|1285|210n|d
Mk1|1.9 TDI 110|1997-2000|110p|1300|235n|d
Mk1 facelift|1.4 16v 75|2000-2004|75p|1250|126n|n
Mk1 facelift|1.6 102|2000-2004|102p|1280|148n|n
Mk1 facelift|1.8T 20v 150|2000-2004|150p|1240|210n|t
Mk1 facelift|1.9 TDI PD 130|2003-2004|130p|1295|310n|d
Mk2|1.4 75|2004-2006|75p|1230|126n|n
Mk2|1.6 102|2004-2008|102p|1255|148n|n
Mk2|1.6 FSI 115|2004-2008|115p|1265|155n|n
Mk2|1.8 TSI 160|2007-2008|160p|1325|250n|t
Mk2|1.9 TDI 105|2004-2008|105p|1235|250n|d
Mk2|2.0 TDI PD 140|2004-2008|140p|1335|320n|d
Mk2 facelift|1.2 TSI 105|2010-2013|105p|1265|175n|t
Mk2 facelift|1.4 TSI 122|2009-2013|122p|1340|200n|t
Mk2 facelift|1.8 TSI 160|2009-2013|160p|1380|250n|t
Mk2 facelift|1.6 TDI CR 105|2009-2013|105p|1350|250n|d
Mk2 facelift|2.0 TDI CR 140|2010-2013|140p|1410|320n|d
Mk3|1.2 TSI 105|2013-2015|105p|1155|175n|t
Mk3|1.0 TSI 115|2016-2017|115p|1150|200n|t
Mk3|1.4 TSI 140|2013-2015|140p|1180|250n|t
Mk3|1.8 TSI 180|2013-2017|180p|1245|250n|t
Mk3|1.6 TDI 105|2013-2015|105p|1230|250n|d
Mk3|2.0 TDI 150|2013-2017|150p|1255|320n|d
Mk3 facelift|1.0 TSI 116|2017-2019|116p|1150|200n|t
Mk3 facelift|1.4 TSI 150|2017-2018|150p|1180|250n|t
Mk3 facelift|1.5 TSI 150|2017-2019|150p|1205|250n|t
Mk3 facelift|1.6 TDI 116|2017-2019|116p|1230|250n|d
Mk3 facelift|2.0 TDI 150|2017-2019|150p|1257|340n|d
Mk4|1.0 TSI 110|2020-2023|110p|1226|200n|t
Mk4|1.5 TSI 150|2020-2024|150p|1263|250n|t
Mk4|2.0 TDI 116|2019-2024|116p|1348|300n|d
Mk4 facelift|1.5 TSI 116|2024-|116p|1351|220n|t
Mk4 facelift|2.0 TDI 115|2024-|115p|1358|300n|d
=Fabia
Mk1|1.4 MPI 68|1999-2004|68p|1065|120n|n
Mk1|1.4 16v 75|1999-2004|75p|1075|126n|n
Mk1|1.4 16v 101|1999-2004|101p|1075|126n|n
Mk1 facelift|1.2 HTP 64|2004-2006|64p|1055|112n|n
Mk1 facelift|1.4 16v 75|2004-2006|75p|1060|126n|n
Mk1 facelift|1.4 TDI PD 80|2005-2006|80p|1130|195n|d
Mk1 facelift|1.9 TDI PD 101|2004-2006|101p|1145|240n|d
Mk2|1.2 HTP 69|2007-2010|69p|1050|112n|n
Mk2|1.4 16v 86|2007-2010|86p|1060|132n|n
Mk2|1.6 16v 105|2007-2010|105p|1070|153n|n
Mk2|1.4 TDI PD 80|2007-2010|80p|1130|195n|d
Mk2|1.9 TDI 105|2007-2010|105p|1155|240n|d
Mk2 facelift|1.2 70|2010-2014|70p|1020|112n|n
Mk2 facelift|1.2 TSI 86|2010-2014|86p|1041|160n|t
Mk2 facelift|1.2 TSI 105|2010-2014|105p|1055|175n|t
Mk2 facelift|1.6 TDI 90|2010-2014|90p|1129|230n|d
Mk2 facelift|1.6 TDI 105|2010-2014|105p|1144|250n|d
Mk3|1.0 75|2014-2018|75p|1055|95n|n
Mk3|1.2 TSI 90|2014-2017|90p|1109|160n|t
Mk3|1.2 TSI 110|2014-2017|110p|1129|175n|t
Mk3|1.0 TSI 95|2017-2018|95p|1035|160n|t
Mk3|1.0 TSI 110|2017-2018|110p|1055|200n|t
Mk3|1.4 TDI 90|2014-2018|90p|1156|230n|d
Mk3 facelift|1.0 MPI 75|2018-2019|75p|1011|95n|n
Mk3 facelift|1.0 TSI 95|2018-2020|95p|1046|160n|t
Mk3 facelift|1.0 TSI 110|2018-2020|110p|1057|200n|t
Mk4|1.0 MPI 80|2021-|80p|1122|93n|n
Mk4|1.0 TSI 95|2021-|95p|1142|175n|t
Mk4|1.0 TSI 110 DSG|2021-2023|110p|1165|200n|t
Mk4|1.0 TSI 115|2024-|115p|1103|200n|t
@Volkswagen
=Golf
Mk4|1.6 101|1997-2003|101p|1092|145n|n
Mk4|2.0 115|1998-2003|115p|1170|170n|n
Mk4|1.9 TDI 90|1997-2003|90p|1200|202n|d
Mk4|1.9 TDI 110|1997-2001|110p|1215|235n|d
Mk4|1.9 TDI PD 115|1998-2004|115p|1237|310n|d
Mk5|1.4 16v 80|2006-2008|80p|1155|132n|n
Mk5|1.6 102|2003-2008|102p|1173|148n|n
Mk5|1.6 FSI 115|2003-2008|115p|1184|155n|n
Mk5|2.0 FSI 150|2004-2008|150p|1242|200n|n
Mk5|1.4 TSI 140|2006-2008|140p|1262|220n|t
Mk5 GT|1.4 TSI 170|2005-2008|170p|1293|240n|t
Mk5 GT|2.0 TDI 170|2005-2008|170p|1293|350n|d
Mk6|1.4 80|2008-2012|80p|1142|132n|n
Mk6|1.2 TSI 105|2009-2012|105p|1158|175n|t
Mk6|1.4 TSI 160|2008-2012|160p|1271|240n|t
Mk6|1.6 102|2008-2010|102p|1157|148n|n
Mk7|1.2 TSI 85|2012-2017|85p|1205|160n|t
Mk7|1.2 TSI 105|2012-2014|105p|1210|175n|t
Mk7|1.4 TSI 125|2014-2017|125p|1225|200n|t
Mk7|1.6 TDI 110|2013-2017|110p|1265|250n|d
Mk7.5|1.0 TSI 85|2017-2019|85p|1131|175n|t
Mk7.5|1.4 TSI 125|2017-2018|125p|1171|200n|t
Mk7.5|1.4 TSI 150|2017-2018|150p|1183|250n|t
Mk7.5 GT|2.0 TDI 150|2017-2019|150p|1291|340n|d
Mk8|1.0 TSI 110|2020-2024|110p|1182|200n|t
Mk8|1.0 eTSI 110 DSG|2020-2024|110p|1227|200n|h
Mk8|1.5 eTSI 130 DSG|2020-2024|130p|1377|200n|h
Mk8|2.0 TDI 115|2020-2024|115p|1305|300n|d
Mk8.5|1.5 TSI 116|2024-|116p|1229|220n|t
Mk8.5|1.5 TSI 150|2024-|150p|1274|250n|t
Mk8.5|1.5 eTSI 150 DSG|2024-|150p|1301|250n|h
Mk8.5|2.0 TDI 116|2024-|116p|1315|300n|d
Mk8.5|2.0 TDI 150 DSG|2024-|150p|1369|360n|d
=Polo
9N|1.2 12v 64|2002-2005|64p|983|112n|n
9N|1.4 16v 75|2001-2005|75p|993|126n|n
9N|1.4 16v 101|2001-2005|101p|1035|126n|n
9N|1.4 TDI 75|2001-2005|75p|1063|195n|d
9N|1.9 TDI 101|2001-2005|101p|1090|240n|d
9N3|1.2 70|2007-2009|70p|991|112n|n
9N3|1.4 80|2005-2009|80p|990|132n|n
9N3|1.6 105|2005-2009|105p|1006|148n|n
9N3|1.4 TDI 80|2005-2009|80p|1064|195n|d
9N3|1.9 TDI 100|2005-2009|100p|1102|240n|d
9N3|1.9 TDI 130|2005-2009|130p|1145|310n|d
6R|1.2 70|2009-2014|70p|1017|112n|n
6R|1.4 85|2009-2014|85p|1020|132n|n
6R|1.2 TDI 75|2010-2014|75p|1082|180n|d
6C|1.0 60|2014-2017|60p|1050|95n|n
6C|1.0 75|2014-2017|75p|1050|95n|n
6C|1.2 TSI 90|2014-2017|90p|1107|160n|t
6C|1.2 TSI 110|2014-2017|110p|1135|175n|t
6C|1.0 TSI 110|2014-2017|110p|1041|200n|t
6C|1.4 TDI 90|2014-2017|90p|1151|230n|d
AW|1.0 75|2017-2018|75p|1030|95n|n
AW|1.0 TSI 115|2017-2018|115p|1155|200n|t
AW|1.5 TSI 150 DSG|2018-2020|150p|1235|250n|t
AW|1.6 TDI 80|2017-2019|80p|1280|230n|d
AW|1.6 TDI 95|2017-2020|95p|1280|250n|d
AW facelift|1.0 80|2021-|80p|1132|93n|n
AW facelift|1.0 TSI 95|2021-|95p|1097|175n|t
AW facelift|1.0 TSI 110 DSG|2021-2024|110p|1132|200n|t
@SEAT
=Ibiza
6L|1.2 12v 64|2002-2006|64p|1015|112n|n
6L|1.4 16v 75|2002-2006|75p|1035|128n|n
6L|1.4 16v 100|2002-2006|100p|1050|126n|n
6L|1.4 TDI 75|2002-2005|75p|1095|195n|d
6L|1.9 TDI 101|2002-2006|101p|1140|240n|d
6L FR|1.8T 20v 150|2003-2006|150p|1180|220n|t
6L FR|1.9 TDI 130|2002-2006|130p|1190|310n|d
6L facelift|1.2 70|2006-2008|70p|1027|112n|n
6L facelift|1.4 86|2006-2008|86p|1035|130n|n
6L facelift|1.4 TDI 80|2006-2007|80p|1106|195n|d
6J|1.2 70|2008-2012|70p|974|112n|n
6J|1.4 85|2008-2012|85p|1000|132n|n
6J|1.6 105|2008-2009|105p|1015|148n|n
6J|1.2 TSI 105|2010-2012|105p|1020|175n|t
6J|1.6 TDI 90|2009-2012|90p|1095|230n|d
6J|1.6 TDI 105|2009-2012|105p|1095||d
6J|1.9 TDI 105|2008-2010|105p|1125|240n|d
6J FR|1.4 TSI 150 DSG|2009-2012|150p|1179|220n|t
6J facelift 2015|1.0 75|2015-2017|75p|974|95n|n
6J facelift 2015|1.0 TSI 95|2015-2017|95p|1020|160n|t
6J facelift 2015|1.0 TSI 110|2015-2017|110p|1034|200n|t
6J facelift 2015|1.2 TSI 90|2015-2017|90p|1014|160n|t
6J facelift 2015|1.4 TDI 90|2015-2017|90p|1080|230n|d
6J facelift 2015|1.4 TDI 105|2015-2017|105p|1086|230n|d
6J FR facelift 2015|1.4 TSI ACT 150|2015-2017|150p|1068|250n|t
6F|1.0 MPI 75|2017-2021|75p|1016|95n|n
6F|1.0 TSI 95|2019-2021|95p|1059|175n|t
6F|1.6 TDI 80|2017-2018|80p|1172|230n|d
6F|1.6 TDI 95|2017-2018|95p|1178|250n|d
6F facelift|1.0 MPI 80|2021-2023|80p|1025|93n|n
6F facelift|1.0 TSI 95|2021-2025|95p|1070|175n|t
6F facelift|1.0 TSI 110|2021-2024|110p|1094|200n|t
=Leon
Mk1|1.4 16v 75|1999-2005|75p|1210|128n|n
Mk1|1.6 100|1999-2005|100p|1220|148n|n
Mk1|1.9 TDI 90|1999-2005|90p|1307|202n|d
Mk1|1.9 TDI 110|1999-2005|110p|1314|235n|d
Mk1|1.9 TDI PD 130|2003-2006|130p|1293|310n|d
Mk1 Cupra/FR|1.8T 20v 180|1999-2005|180p|1322|235n|t
Mk2|1.4 85|2006-2009|85p|1276|132n|n
Mk2|1.6 102|2005-2009|102p|1205|148n|n
Mk2|1.4 TSI 125|2007-2009|125p|1249|155n|t
Mk2|1.8 TSI 160|2007-2009|160p|1320|250n|t
Mk2|1.9 TDI 105|2005-2006|105p|1290|250n|d
Mk2|2.0 TDI 140|2005-2009|140p|1315|320n|d
Mk2 FR|2.0 TFSI 200|2005-2009|200p|1334|280n|t
Mk2 FR|2.0 TDI 170|2006-2009|170p|1331|350n|d
Mk2 facelift|1.2 TSI 105|2010-2012|105p|1200|175n|t
Mk2 facelift|1.6 TDI CR 105|2009-2012|105p|1290|250n|d
Mk2 facelift|2.0 TDI CR 140|2010-2012|140p|1305|320n|d
Mk2 facelift FR|2.0 TFSI 211|2009-2012|211p|1320|280n|t
Mk2 facelift FR|2.0 TDI CR 170|2009-2012|170p|1320|350n|d
Mk3 facelift|1.0 TSI 115|2016-2020|115p|1127|200n|t
Mk3 facelift|1.2 TSI 110|2016-2018|110p|1138|175n|t
Mk3 facelift|1.5 TSI 130|2018-2020|130p|1164|200n|t
Mk3 facelift FR|1.4 TSI 125|2016-2018|125p|1158||t
Mk3 facelift FR|1.4 TSI ACT 150|2016-2018|150p|1166|250n|t
Mk3 facelift FR|1.5 TSI 150|2018-2020|150p|1168|250n|t
Mk3 facelift FR|2.0 TDI 150|2016-2018|150p|1230|340n|d
Mk4|1.0 TSI 110|2020-2024|110p|1204|200n|t
Mk4|1.5 TSI 130|2020-2023|130p|1227|200n|t
Mk4 FR|1.5 TSI 150|2020-|150p|1241|250n|t
Mk4 FR|1.5 eTSI 150 DSG|2020-|150p|1286|250n|h
Mk4|2.0 TDI 115|2020-|115p|1340|300n|d
Mk4 FR|2.0 TDI 150 DSG|2020-|150p|1371|360n|d
Mk4 e-Hybrid|1.4 TSI PHEV|2020-2024|204p|1539||h
@Audi
=A1
8X|1.2 TFSI 86|2010-2014|86p|1115|160n|t
8X|1.4 TFSI 122|2010-2014|122p|1175|200n|t
8X|1.4 TFSI 185 S tronic|2010-2014|185p|1265|250n|t
8X|1.6 TDI 90|2011-2014|90p|1210|230n|d
8X|1.6 TDI 105|2010-2014|105p|1215|250n|d
8X|2.0 TDI 143|2011-2014|143p|1265|320n|d
8X facelift|1.0 TFSI 95|2015-2018|95p|1035|160n|t
8X facelift|1.4 TFSI 125|2014-2018|125p|1155|200n|t
8X facelift|1.4 TFSI CoD 150|2014-2018|150p|1195|250n|t
8X facelift|1.6 TDI 116|2014-2018|116p|1225|250n|d
8X facelift|1.8 TFSI 192 S tronic|2014-2018|192p|1180|250n|t
GB Sportback|25 TFSI 1.0 95|2019-2020|95p|1090|175n|t
GB Sportback|30 TFSI 1.0 116|2018-2020|116p|1105|200n|t
GB Sportback|35 TFSI 1.5 150 S tronic|2018-2020|150p|1165|250n|t
GB Sportback|40 TFSI 2.0 200 S tronic|2018-2020|200p|1260|320n|t
=A3
8L|1.6 101|1996-1998|101p|1015|145n|n
8L|1.8 20v 125|1996-2000|125p|1065|170n|n
8L|1.8T 20v 150|1996-1998|150p|1070|210n|t
8L|1.9 TDI 90|1996-1999|90p|1095|202n|d
8L|1.9 TDI 110|1997-1999|110p|1105|235n|d
8L facelift|1.8T 20v 150|2000-2003|150p|1175|210n|t
8L facelift|1.8T 20v 180|2000-2003|180p|1180|235n|t
8L facelift|1.9 TDI 100|2001-2003|100p|1185|240n|d
8L facelift|1.9 TDI 130|2000-2003|130p|1200|310n|d
8P|1.6 102|2003-2005|102p|1205|148n|n
8P|1.6 FSI 115|2003-2005|115p|1225|155n|n
8P|2.0 FSI 150|2003-2005|150p|1275|200n|n
8P|2.0 TFSI 200 DSG|2004-2005|200p|1340|280n|t
8P facelift|1.2 TFSI 105|2009-2013|105p|1205|175n|t
8P facelift|1.8 TFSI 160|2008-2009|160p|1280|250n|t
8P facelift|1.6 TDI 105|2009-2012|105p|1280|250n|d
8P facelift|2.0 TDI 170|2009-2012|170p|1335|350n|d
8V|1.2 TFSI 110|2014-2016|110p|1150|175n|t
8V|1.8 TFSI 180|2012-2016|180p|1230|250n|t
8V|1.6 TDI 110|2014-2016|110p|1230|250n|d
8V|2.0 TDI 184|2014-2016|184p|1285|380n|d
8V facelift Sportback|1.0 TFSI 115|2016-2018|115p|1180|200n|t
8V facelift Sportback|2.0 TFSI 190|2016-2018|190p|1285|320n|t
8V facelift Sportback|1.6 TDI 116|2017-2018|116p|1260|250n|d
8Y|30 TDI 2.0 116|2020-2024|116p|1350|300n|d
8Y|35 TDI 2.0 150|2020-2024|150p|1395|340n|d
8Y|35 TFSI 1.5 MHEV S tronic|2020-2024|150p|1320|250n|h
8Y|40 TFSI e 1.4 PHEV|2020-2024|204p|1560||h
=A4
B5|1.6 101|1994-1999|101p|1170|140n|n
B5|1.8 20v 125|1994-1999|125p|1220|173n|n
B5|1.8T 20v 150|1995-1999|150p|1255|210n|t
B5|1.9 TDI 90|1995-1999|90p|1240|202n|d
B5|1.9 TDI 110|1996-1999|110p|1240|235n|d
B5|2.5 TDI V6 150|1997-1999|150p|1355|310n|d
B6|1.8T 20v 150|2000-2002|150p|1375|210n|t
B6|1.8T 20v 163|2002-2004|163p|1375|225n|t
B6|2.0 131|2000-2004|131p|1310|195n|n
B6|1.9 TDI 101|2001-2004|101p|1375|250n|d
B6|1.9 TDI 130|2000-2004|130p|1405|310n|d
B6|2.5 TDI V6 163|2002-2004|163p|1505|310n|d
B6|3.0 V6 220|2000-2004|220p|1425|300n|n
B7|2.0 130|2004-2008|130p|1340|195n|n
B7|1.8T 20v 163|2004-2008|163p|1390|225n|t
B7|2.0 TFSI 200|2004-2008|200p|1425|280n|t
B7|1.9 TDI 115|2004-2008|115p|1390|285n|d
B7|2.0 TDI 140|2004-2008|140p|1430|320n|d
B7|2.7 TDI V6 180|2005-2007|180p|1540|380n|d
B8|1.8 TFSI 120|2008-2011|120p|1410|230n|t
B8|1.8 TFSI 160|2007-2011|160p|1410|250n|t
B8|2.0 TFSI 211|2008-2011|211p|1435|350n|t
B8|2.0 TDI 143|2007-2011|143p|1460|320n|d
B8|2.0 TDI 170|2008-2011|170p|1465|350n|d
B8|2.7 TDI V6 190|2007-2011|190p|1570|400n|d
B8 facelift|1.8 TFSI 170|2011-2015|170p|1430|320n|t
B8 facelift|2.0 TFSI 225|2013-2015|225p|1450|350n|t
B8 facelift|2.0 TDI 136|2011-2015|136p|1480|320n|d
B8 facelift|2.0 TDI 150|2013-2015|150p|1480|320n|d
B8 facelift|2.0 TDI 177|2011-2015|177p|1480|380n|d
B8 facelift|3.0 TDI V6 204|2011-2015|204p|1575|400n|d
B9|1.4 TFSI 150|2015-2018|150p|1320|250n|t
B9|2.0 TFSI ultra 190|2015-2018|190p|1380|320n|t
B9|2.0 TDI 150|2015-2018|150p|1430|320n|d
B9|2.0 TDI 190|2015-2018|190p|1450|400n|d
B9|3.0 TDI V6 218 S tronic|2015-2018|218p|1540|400n|d
B9 facelift|35 TFSI 2.0 150|2019-2020|150p|1415|320n|t
B9 facelift|30 TDI 2.0 136 S tronic|2019-2020|136p|1490|320n|d
B9 facelift|35 TDI 2.0 163 S tronic|2019-2020|163p|1495|380n|d
B9 facelift|40 TDI 2.0 190 S tronic|2019-2020|190p|1585|400n|d
@BMW
=116i
E87|1.6 N45|2004-2007|115p|1205|150n|n
E87 LCI|2.0 N43|2009-2011|122p|1275|185n|n
F20|1.6 turbo N13|2011-2015|136p|1290|220n|t
=118i
E87|2.0 N46|2004-2007|129p|1235|180n|n
E87 LCI|2.0 N43|2007-2011|143p|1275|190n|n
F20|1.6 turbo N13|2011-2015|170p|1295|250n|t
F20 LCI|1.5 turbo B38|2015-2017|136p|1305|220n|t
F40|1.5 turbo B38|2019-2020|140p|1290|220n|t
=120i
E87|2.0 N46|2004-2007|150p|1260|200n|n
E87 LCI|2.0 N43|2007-2011|170p|1300|210n|n
F20 LCI|1.6 turbo N13|2015-2016|177p|1305|250n|t
F40|2.0 turbo B48 auto|2020-2024|178p|1390|280n|t
=116d
F20|2.0 diesel N47|2011-2015|116p|1310|260n|d
F20 LCI|1.5 diesel B37|2015-2017|116p|1320|270n|d
F40|1.5 diesel B37|2019-2024|116p|1375|270n|d
=118d
E87|2.0 diesel M47|2004-2007|122p|1310|280n|d
E87 LCI|2.0 diesel N47|2007-2011|143p|1320|300n|d
F20|2.0 diesel N47|2011-2015|143p|1320|320n|d
F20 LCI|2.0 diesel B47|2015-2017|150p|1350|320n|d
F40|2.0 diesel B47|2019-2024|150p|1400|350n|d
=120d
E87|2.0 diesel M47|2004-2007|163p|1340|340n|d
F40|2.0 diesel B47 auto|2020-2024|190p|1450|400n|d
=123d
E87 LCI|2.0 twin-turbo diesel N47|2007-2011|204p|1420|400n|d
=125d
F20|2.0 twin-turbo diesel N47|2012-2015|218p|1390|450n|d
F20 LCI|2.0 twin-turbo diesel B47 auto|2015-2017|224p|1430|450n|d
=316i
E46|1.9 M43|1999-2001|105p|1285|165n|n
E46 facelift|1.8 N42|2001-2005|116p|1320|175n|n
F30|1.6 turbo N13|2012-2015|136p|1385|220n|t
=318i
E46|1.9 M43|1998-2001|118p|1285|180n|n
E46 facelift|2.0 N42|2001-2005|143p|1320|200n|n
E90|2.0 N46|2005-2007|129p|1325|180n|n
E90 LCI|2.0 N43|2009-2012|143p|1360|190n|n
F30 LCI|1.5 turbo B38|2015-2018|136p|1400|220n|t
G20|2.0 turbo B48 auto|2020-2022|156p|1490|250n|t
=320i
E46|2.0 M52|1998-2001|150p|1365|190n|n
E46 facelift|2.2 M54|2001-2005|170p|1390|210n|n
E90|2.0 N46|2005-2007|150p|1395|200n|n
E90 LCI|2.0 N43|2009-2012|170p|1370|210n|n
F30|2.0 turbo N20|2012-2015|184p|1400|270n|t
F30 LCI|2.0 turbo B48|2015-2018|184p|1430|290n|t
G20|2.0 turbo B48 auto|2019-2022|184p|1450|300n|t
G20 LCI|2.0 turbo B48 auto|2022-2026|184p|1515|300n|t
=325i
E46 saloon|2.5 M54|2001-2005|192p|1395|245n|n
E90|2.5 N52|2005-2007|218p|1490|250n|n
=328i
F30|2.0 turbo N20|2011-2015|245p|1430|350n|t
=330i
E90|3.0 N52|2005-2007|258p|1525|300n|n
F30 LCI|2.0 turbo B48|2015-2018|252p|1470|350n|t
G20 LCI|2.0 turbo B48 auto|2022-2024|245p|1525|400n|t
=330e
G20 LCI|2.0 turbo PHEV|2022-2024|292p|1770||h
=316d
F30|2.0 diesel N47|2012-2015|116p|1410|260n|d
=318d
E46 facelift|2.0 diesel M47|2001-2005|115p|1395|265n|d
E90|2.0 diesel M47|2006-2007|122p|1435|280n|d
E90 LCI|2.0 diesel N47|2010-2012|143p|1415|320n|d
F30|2.0 diesel N47|2012-2015|143p|1410|320n|d
F30 LCI|2.0 diesel B47|2015-2018|150p|1430|320n|d
G20|2.0 diesel B47|2019-2022|150p|1445|320n|d
G20 LCI|2.0 diesel B47 mild hybrid auto|2022-2026|150p|1555|320n|h
=320d
E46|2.0 diesel M47 136|1998-2001|136p|1375|280n|d
E90|2.0 diesel M47|2005-2007|163p|1435|340n|d
E90 LCI|2.0 diesel N47 184|2010-2012|184p|1420|380n|d
F30 EfficientDynamics|2.0 diesel N47 163|2011-2015|163p|1415|380n|d
G20|2.0 diesel B47 mild hybrid auto|2020-2022|190p|1540|400n|h
G20 LCI|2.0 diesel B47 mild hybrid auto|2022-2026|190p|1570|400n|h
=325d
E90|3.0 diesel M57|2006-2008|197p|1500|400n|d
E90 LCI|3.0 diesel N57|2010-2012|204p|1525|430n|d
=330d
E46|3.0 diesel M57|1999-2001|184p|1520|390n|d
E46 facelift|3.0 diesel M57 auto|2003-2005|204p|1530|410n|d
E90|3.0 diesel M57|2005-2007|231p|1515|500n|d
E90 LCI|3.0 diesel N57|2009-2012|245p|1535|520n|d
F30|3.0 diesel N57 auto|2012-2015|258p|1540|560n|d
F30 LCI|3.0 diesel N57 auto|2015-2018|258p|1540|560n|d
G20|3.0 diesel B57 auto|2019-2020|265p|1590|580n|d
G20 mild hybrid|3.0 diesel B57 auto|2020-2022|286p|1695|650n|h
@Mercedes
=A-Class
W168|A 140 1.4 M166|1997-2001|82p|1020|130n|n
W168|A 160 1.6 M166|1997-2001|102p|1135|150n|n
W168|A 190 1.9 M166|1999-2001|125p|1185|180n|n
W168|A 170 CDI 1.7 diesel|1998-2001|90p|1100|180n|d
W169|A 150 1.5 M266|2004-2008|95p|1225|140n|n
W169|A 170 1.7 M266|2004-2008|115p|1240|155n|n
W169|A 200 2.0 M266|2004-2008|136p|1270|185n|n
W169|A 200 Turbo 2.0 M266|2005-2008|193p|1305|280n|t
W169|A 180 CDI 2.0 diesel|2004-2008|109p|1345|250n|d
W169|A 200 CDI 2.0 diesel|2007-2008|140p|1365|300n|d
W176|A 180 1.6 turbo M270|2012-2015|122p|1370|200n|t
W176|A 200 1.6 turbo M270|2012-2015|156p|1370|250n|t
W176|A 250 2.0 turbo M270 DCT|2012-2015|211p|1445|350n|t
W176|A 180 CDI 1.5 diesel|2012-2015|109p|1320|260n|d
W176|A 200 CDI 2.1 diesel|2012-2014|136p|1445|300n|d
W176|A 220 CDI 2.1 diesel DCT|2012-2015|170p|1485|350n|d
W176 facelift|A 180 1.6 turbo M270|2015-2018|122p|1295|200n|t
W176 facelift|A 200 1.6 turbo M270|2015-2018|156p|1295|250n|t
W176 facelift|A 250 2.0 turbo M270|2015-2018|211p|1320|350n|t
W176 facelift|A 180d 1.5 diesel|2015-2018|109p|1320|260n|d
W176 facelift|A 200d 2.1 diesel|2015-2018|136p|1380|300n|d
W176 facelift|A 220d 2.1 diesel DCT|2015-2018|177p|1410|350n|d
W177|A 180 1.3 turbo M282|2018-2022|136p|1275|200n|t
W177|A 200 1.3 turbo M282|2018-2022|163p|1280|250n|t
W177|A 220 2.0 turbo M260 DCT|2018-2020|190p|1375|350n|t
W177|A 250 2.0 turbo M260 DCT|2018-2022|224p|1380|350n|t
W177|A 180d 1.5 diesel DCT|2018-2020|116p|1370|260n|d
W177|A 200d 2.0 diesel DCT|2018-2022|150p|1415|320n|d
W177|A 220d 2.0 diesel DCT|2018-2022|190p|1445|400n|d
W177|A 250e 1.3 turbo PHEV|2019-2022|218p|1605||h
W177 facelift|A 180 1.3 turbo mild hybrid DCT|2022-|136p|1365|230n|h
W177 facelift|A 200 1.3 turbo mild hybrid DCT|2022-|163p|1365|270n|h
W177 facelift|A 180d 2.0 diesel DCT|2022-|116p|1455|280n|d
W177 facelift|A 200d 2.0 diesel DCT|2022-|150p|1455|320n|d
=C-Class
W203|C 200 Kompressor 2.0 M111|2000-2002|163p|1415|230n|s
W203|C 180 Kompressor 1.8 M271|2002-2004|143p|1400|220n|s
W203|C 200 CDI 2.1 diesel|2000-2003|116p|1430|250n|d
W203|C 220 CDI 2.1 diesel|2000-2003|143p|1445|315n|d
W203|C 270 CDI 2.7 diesel|2000-2004|170p|1525|370n|d
W203|C 320 3.2 V6|2000-2004|218p|1490|308n|n
W203 facelift|C 180 Kompressor 1.8 M271|2004-2007|143p|1410|220n|s
W203 facelift|C 200 Kompressor 1.8 M271|2004-2007|163p|1410|240n|s
W203 facelift|C 230 2.5 V6|2005-2007|204p|1455|245n|n
W203 facelift|C 200 CDI 2.1 diesel|2004-2005|122p|1440|270n|d
W203 facelift|C 220 CDI 2.1 diesel|2004-2005|150p|1465|340n|d
W203 facelift|C 320 CDI 3.0 V6 diesel|2005-2007|224p|1555|415n|d
W204|C 180 Kompressor 1.8 M271|2007-2008|156p|1410|230n|s
W204|C 200 Kompressor 1.8 M271|2007-2010|184p|1415|250n|s
W204|C 200 CDI 2.1 diesel|2007-2009|136p|1485|270n|d
W204|C 220 CDI 2.1 diesel|2007-2009|170p|1510|400n|d
W204|C 250 CDI 2.1 twin-turbo diesel|2009-2011|204p|1540|500n|d
W204|C 350 CDI 3.0 V6 diesel auto|2009-2011|231p|1625|540n|d
W204 facelift|C 180 1.6 turbo M274|2012-2014|156p|1395|250n|t
W204 facelift|C 200 1.8 turbo M271|2011-2014|184p|1425|270n|t
W204 facelift|C 250 1.8 turbo M271 auto|2011-2014|204p|1430|310n|t
W204 facelift|C 200 CDI 2.1 diesel|2011-2014|136p|1490|360n|d
W204 facelift|C 220 CDI 2.1 diesel|2011-2014|170p|1525|400n|d
W204 facelift|C 250 CDI 2.1 twin-turbo diesel|2011-2014|204p|1540|500n|d
W205|C 180 1.6 turbo M274|2014-2018|156p|1320|250n|t
W205|C 200 2.0 turbo M274|2014-2018|184p|1370|300n|t
W205|C 250 2.0 turbo M274 auto|2014-2016|211p|1405|350n|t
W205|C 300 2.0 turbo M274 auto|2015-2016|245p|1455|370n|t
W205|C 200d 1.6 diesel|2014-2018|136p|1410|300n|d
W205|C 220d 2.1 diesel|2014-2018|170p|1475|400n|d
W205|C 250d 2.1 twin-turbo diesel auto|2014-2016|204p|1520|500n|d
W205 facelift|C 180 1.6 turbo M274|2019-2020|156p|1365|250n|t
W205 facelift|C 200 1.5 turbo EQ Boost auto|2018-2021|184p|1430|280n|h
W205 facelift|C 300 2.0 turbo EQ Boost auto|2018-2021|258p|1480|370n|h
W205 facelift|C 220d 2.0 diesel auto|2018-2021|194p|1510|400n|d
W205 facelift|C 300d 2.0 diesel auto|2018-2021|245p|1560|500n|d
W205 facelift|C 300e 2.0 turbo PHEV auto|2019-2021|320p|1740||h
W206|C 180 1.5 turbo mild hybrid auto|2021-2026|170p|1550|250n|h
W206|C 200 1.5 turbo mild hybrid auto|2021-2026|204p|1575|300n|h
W206|C 300 2.0 turbo mild hybrid auto|2021-2026|258p|1600|400n|h
W206|C 220d 2.0 diesel mild hybrid auto|2021-2026|200p|1680|440n|h
W206|C 300e 2.0 turbo PHEV auto|2021-2026|313p|2005||h
@Mini
=One
R50|1.6 90|2001-2006|90p|1140|140n|n
R56 LCI|1.6 75|2010-2012|75p|1060|140n|n
R56 LCI|1.6 98|2010-2012|98p|1060|153n|n
F56|1.2 turbo 102|2014-2017|102p|1090|180n|t
F56 LCI One First|1.5 turbo 75|2018-2021|75p|1110|160n|t
F56 LCI|1.5 turbo 102|2018-2021|102p|1115|190n|t
F56 2021 facelift|1.5 turbo 102|2021-2022|102p|1155|190n|t
=One D
R50|1.4 diesel 75|2001-2004|75p|1175|180n|d
R50|1.4 diesel 88|2004-2006|88p|1190|190n|d
R56 LCI|1.6 diesel 90|2010-2012|90p|1090|215n|d
F56|1.5 diesel 95|2014-2018|95p|1115|220n|d
=Cooper D
R56 LCI|1.6 diesel 112|2011-2013|112p|1090|270n|d
F56|1.5 diesel 116|2014-2018|116p|1135|270n|d
F56 LCI|1.5 diesel 116|2018-2021|116p|1165|270n|d
=Cooper SD
R56 LCI|2.0 diesel 143|2011-2013|143p|1150|305n|d
F56|2.0 diesel 170|2014-2018|170p|1175|360n|d
=Cooper
R56 LCI|1.6 16v 122|2010-2012|122p|1065|160n|n
F56 LCI|1.5 Turbo 136|2018-2021|136p|1085|230n|t
F56 2021 facelift|1.5 Turbo 136|2021-2024|136p|1150|220n|t
F66 Cooper C|1.5 Turbo 156 auto|2024-|156p|1335|230n|t
@@ENGINES
`;
