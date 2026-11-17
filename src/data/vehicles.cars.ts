/* eslint-disable */
/**
 * UK cars and vans: stock specs for the vehicle picker. Dataset 2026-11-17.
 *
 * Format (parsed by src/lib/vehicles.ts): "@Make", "=Model", then
 * "gen|engine|years|power|weight|torque|asp[|stages]". Power is as the maker quotes it:
 * p = PS (converted to bhp x0.986), b = bhp, k = kW (x1.341). Torque n = Nm, l = lb-ft.
 * Weight kg: kerb for cars, wet for bikes; "d" = only a dry weight was published (+20 kg added).
 * asp: t turbo petrol, d diesel, n non-turbo, s supercharged, h hybrid. Stages: total power after
 * a tuner's stage for that exact variant. "@@ENGINES": make|code|label|power|torque|asp swap donors.
 *
 * Notes:
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
 */
export const CAR_DATA = `
@Volkswagen
=Golf GTI
Mk1|1.6 8v|1979-1982|110p|810|140n|n
Mk1|1.8 8v|1982-1984|112p|860|153n|n
Mk2|1.8 8v|1984-1991|112p|920|157n|n
Mk2 16v|1.8 16v|1986-1991|139p|960|168n|n
Mk3|2.0 8v|1991-1997|115p|1110|166n|n
Mk3 16v|2.0 16v|1993-1997|150p|1170|180n|n
Mk4|1.8T 20v|1998-2004|150p|1270|210n|t
Mk4 25th Anniversary|1.8T 20v|2002-2003|180p|1290|235n|t
Mk4 GTI TDI|1.9 TDI 150|2001-2004|150p|1300|320n|d
Mk5|2.0 TFSI|2004-2009|200p|1336|280n|t
Mk5 Edition 30|2.0 TFSI|2006-2007|230p|1340|300n|t
Mk5 Pirelli|2.0 TFSI|2007-2008|230p|1340|300n|t
Mk6|2.0 TSI|2009-2013|210p|1318|280n|t
Mk6 Edition 35|2.0 TSI|2011-2012|235p|1350|300n|t
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
Mk5 R32|3.2 VR6|2005-2009|250p|1510|320n|n
Mk6|2.0 TSI|2010-2013|270p|1446|350n|t
Mk7|2.0 TSI|2014-2017|300p|1476|380n|t|1:370b,2:410b
Mk7.5|2.0 TSI|2017-2018|310p|1495|380n|t|1:370b,2:410b
Mk7.5 WLTP|2.0 TSI|2018-2020|300p|1505|400n|t|1:370b,2:410b
Mk8|2.0 TSI|2021-2024|320p|1551|420n|t|1:400b,1p:430b
Mk8 20 Years|2.0 TSI|2022-2023|333p|1551|420n|t
Mk8.5|2.0 TSI|2024-|333p|1548|420n|t
=Golf GTD
Mk6|2.0 TDI 170|2009-2013|170p|1393|350n|d
Mk7|2.0 TDI 184|2013-2020|184p|1377|380n|d
Mk8|2.0 TDI 200|2020-|200p|1505|400n|d
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
=Polo GTI
9N3|1.8T 20v|2006-2009|150p|1194|220n|t
6R|1.4 TSI|2010-2014|180p|1184|250n|t
6C|1.8 TSI|2015-2017|192p|1272|320n|t
AW|2.0 TSI|2018-2021|200p|1355|320n|t|1:240p,2:250p,3:320p
AW facelift|2.0 TSI|2021-|207p|1286|320n|t
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
Mk3|2.0 TSI|2008-2014|200p|1318|280n|t
Mk3.5|2.0 TSI 220|2014-2017|220p|1352|350n|t
R|2.0 TSI|2009-2017|265p|1352|350n|t
=Transporter
T5|1.9 TDI 105|2003-2009|105p|1830|250n|d
T5|2.5 TDI 130|2003-2009|130p|1913|340n|d
T5|2.5 TDI 174|2003-2009|174p|1990|400n|d
T5.1|2.0 TDI 84|2010-2015|84p|1813|220n|d
T5.1|2.0 TDI 102|2010-2015|102p|1813|250n|d
T5.1|2.0 TDI 140|2010-2015|140p|1857|340n|d
T5.1|2.0 BiTDI 180|2010-2015|180p|1957|400n|d
T6|2.0 TDI 84|2015-2019|84p|1856|220n|d
T6|2.0 TDI 102|2015-2019|102p|1856|250n|d
T6|2.0 TDI 150|2015-2019|150p|1880|340n|d
T6|2.0 BiTDI 204|2015-2019|204p|1990|450n|d
T6.1|2.0 TDI 90|2019-2024|90p|1890|220n|d
T6.1|2.0 TDI 110|2019-2024|110p|1890|250n|d
T6.1|2.0 TDI 150|2019-2024|150p|1910|340n|d
T6.1|2.0 BiTDI 199|2019-2024|199p|2030|450n|d
@Audi
=S1
8X|2.0 TFSI|2014-2018|231p|1315|370n|t
=S3
8L|1.8T 20v|1999-2001|210p|1420|270n|t
8L|1.8T 20v 225|2001-2003|225p|1430|280n|t
8P|2.0 TFSI|2006-2012|265p|1495|350n|t
8V|2.0 TFSI|2013-2016|300p|1425|380n|t|1:370b,2:410b
8V facelift|2.0 TFSI|2016-2019|310p|1445|400n|t|1:370b,2:410b
8Y|2.0 TFSI|2020-2024|310p|1500|400n|t
8Y facelift|2.0 TFSI|2024-|333p|1535|420n|t|1:400b,1p:430b
=RS3
8P|2.5 TFSI|2011-2012|340p|1575|450n|t
8V|2.5 TFSI|2015-2017|367p|1520|465n|t|1:410p,2:430p,3:500p
8V facelift|2.5 TFSI|2017-2021|400p|1510|480n|t|1:470p,2:490p,3:580p
8Y|2.5 TFSI|2021-|400p|1575|500n|t
=S4
B5|2.7 V6 biturbo|1997-2001|265p|1535|400n|t
B6|4.2 V8|2003-2005|344p|1660|410n|n
B7|4.2 V8|2005-2008|344p|1690|410n|n
B8|3.0 TFSI|2009-2015|333p|1650|440n|s
B9|3.0 TFSI|2016-2019|354p|1630|500n|t
B9 TDI|3.0 TDI|2019-|347p|1750|700n|d
=RS4
B5|2.7 V6 biturbo|2000-2001|380p|1620|440n|t
B7|4.2 FSI V8|2006-2008|420p|1650|430n|n
B8|4.2 FSI V8|2012-2015|450p|1795|430n|n
B9|2.9 TFSI V6 biturbo|2018-|450p|1715|600n|t
=TT
Mk1 225 quattro|1.8T 20v|1999-2006|225p|1395|280n|t
Mk1 3.2 quattro|3.2 VR6|2003-2006|250p|1520|320n|n
Mk2|2.0 TFSI|2006-2014|200p|1260|280n|t
Mk3|2.0 TFSI|2014-2018|230p|1230|370n|t
=TTS
Mk2|2.0 TFSI|2008-2014|272p|1395|350n|t
Mk3|2.0 TFSI|2015-2018|310p|1410|380n|t
=TT RS
Mk2|2.5 TFSI|2009-2014|340p|1450|450n|t
Mk2 Plus|2.5 TFSI|2012-2014|360p|1450|465n|t
Mk3|2.5 TFSI|2016-2023|400p|1450|480n|t
=A3
8P|1.9 TDI|2003-2009|105p|1305|250n|d
8P|2.0 TDI 140|2003-2012|140p|1335|320n|d
8P|1.4 TFSI|2007-2012|125p|1220|200n|t
8V|1.4 TFSI|2012-2016|125p|1175|200n|t
8V|2.0 TDI 150|2012-2020|150p|1320|320n|d
8V|1.5 TFSI CoD|2017-2020|150p|1270|250n|t
8Y|30 TFSI 1.0|2020-|110p|1240|200n|t
8Y|35 TFSI 1.5|2020-|150p|1320|250n|t
@SEAT
=Leon Cupra
Mk1 Cupra R|1.8T 20v|2002-2003|210p|1320|270n|t
Mk1 Cupra R|1.8T 20v 225|2003-2006|225p|1320|280n|t
Mk2|2.0 TFSI|2007-2010|240p|1375|300n|t
Mk2 Cupra R|2.0 TFSI|2010-2012|265p|1375|350n|t
Mk3 265|2.0 TSI|2014-2015|265p|1300|350n|t
Mk3 280|2.0 TSI|2014-2017|280p|1300|350n|t|1:350p,2:370p,3:380p
Mk3 290|2.0 TSI|2015-2017|290p|1300|350n|t|1:350p,2:370p,3:380p
Mk3 300|2.0 TSI|2017-2020|300p|1395|380n|t|1:355p,2:370p
=Leon
Mk3|1.4 TSI 125|2013-2018|125p|1205|200n|t
Mk3|1.6 TDI 110|2013-2020|110p|1240|250n|d
Mk3 FR|1.8 TSI 180|2013-2020|180p|1250|250n|t
Mk3 FR|2.0 TDI 184|2013-2020|184p|1350|380n|d
=Ibiza Cupra
6L|1.8T 20v|2004-2008|180p|1199|235n|t
6L|1.9 TDI 160|2004-2008|160p|1240|330n|d
6J|1.4 TSI|2010-2015|180p|1259|250n|t
6J facelift|1.8 TSI|2016-2017|192p|1185|320n|t
=Ibiza
6J FR|2.0 TDI 143|2010-2015|143p|1225|320n|d
6F FR|1.0 TSI 115|2017-|115p|1140|200n|t
6F FR|1.5 TSI 150|2018-|150p|1199|250n|t
@Cupra
=Leon
Mk4|2.0 TSI 245|2020-2024|245p|1450|370n|t
Mk4|2.0 TSI 300|2021-2024|300p|1460|400n|t
Mk4 e-Hybrid|1.4 TSI PHEV|2020-2024|245p|1596|400n|h
@Skoda
=Octavia vRS
Mk1|1.8T 20v|2001-2006|180p|1260|235n|t
Mk2|2.0 TFSI|2006-2013|200p|1395|280n|t
Mk2|2.0 TDI 170|2007-2013|170p|1445|350n|d
Mk3|2.0 TSI 220|2013-2017|220p|1345|350n|t|1:300p,2:320p,3:380p
Mk3 vRS 230|2.0 TSI|2015-2017|230p|1345|350n|t
Mk3 facelift|2.0 TSI 245|2017-2020|245p|1367|370n|t|1:300p,2:340p,3:350p
Mk3|2.0 TDI 184|2013-2020|184p|1395|380n|d|1:220p,2:230p
Mk4|2.0 TSI 245|2020-2024|245p|1445|370n|t
Mk4|2.0 TDI 200|2020-2024|200p|1520|400n|d
Mk4 iV|1.4 TSI PHEV|2020-2023|245p|1625|400n|h
Mk4 facelift|2.0 TSI 265|2024-|265p|1460|370n|t
=Fabia vRS
Mk1|1.9 TDI 130|2003-2007|130p|1200|310n|d
Mk2|1.4 TSI|2010-2014|180p|1218|250n|t
@Ford
=Fiesta ST
Mk6 ST150|2.0 Duratec|2005-2008|150p|1137|190n|n
Mk7 ST180|1.6 EcoBoost|2013-2017|182p|1163|240n|t|1:230b,2:250b,3:310b
Mk7 ST200|1.6 EcoBoost|2016-2017|200p|1163|290n|t
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
=Focus RS
Mk1|2.0 Duratec turbo|2002-2003|215p|1278|310n|t
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
Mk2|1.5 EcoBoost|2020-2023|200p|1358|320n|t
=Transit Custom
Mk1 facelift|2.0 EcoBlue 105|2016-2023|105p|1900|360n|d
Mk1 facelift|2.0 EcoBlue 130|2016-2023|130p|1900|385n|d
Mk1 facelift|2.0 EcoBlue 170|2016-2023|170p|1920|405n|d
Mk1 facelift|2.0 EcoBlue 185|2019-2023|185p|1940|415n|d
=Escort RS Cosworth
Mk5|2.0 YB turbo|1992-1996|227p|1275|300n|t
=Sierra RS Cosworth
3-door|2.0 YB turbo|1986-1987|204p|1217|276n|t
Sapphire 4x4|2.0 YB turbo|1990-1992|220p|1305|290n|t
@Vauxhall
=Corsa VXR
D|1.6 Turbo|2007-2014|192p|1203|230n|t|1:225b,2:235b,3:250b
D Nurburgring|1.6 Turbo|2011-2013|205p|1203|250n|t
E|1.6 Turbo|2015-2018|205p|1293|245n|t|1:225b,2:240b,3:255b
=Corsa GSi
E|1.4 Turbo|2018-2019|150p|1278|220n|t
=Corsa
C|1.2 16v|2000-2006|75p|980|110n|n
D|1.2 16v|2006-2014|80p|1060|110n|n
D|1.4 16v|2006-2014|90p|1100|125n|n
E|1.4 16v|2014-2019|90p|1120|130n|n
E|1.0 Turbo 115|2014-2019|115p|1163|170n|t
F|1.2 75|2020-|75p|1055|118n|n
F|1.2 Turbo 100|2020-|100p|1090|205n|t
F|1.2 Turbo 130|2020-|130p|1165|230n|t
=Astra VXR
H|2.0T Z20LEH|2005-2010|240p|1393|320n|t|1:265b,2:290b,3:305b
J|2.0T A20NFT|2012-2019|280p|1475|400n|t|1:320b,2:335b,3:345b
=Astra GSi
K|1.6 Turbo|2018-2019|200p|1275|300n|t
=Astra
H|1.6 16v 115|2004-2010|115p|1190|155n|n
H|1.9 CDTi 150|2004-2010|150p|1375|320n|d
J|1.4 Turbo 140|2009-2015|140p|1373|200n|t
J|1.7 CDTi 110|2009-2015|110p|1393|260n|d
K|1.0 Turbo 105|2015-2019|105p|1203|170n|t
K|1.6 CDTi 136|2015-2019|136p|1350|320n|d
@Renault
=Clio RS
Clio II 172|2.0 16v F4R|2000-2004|172p|1110|200n|n
Clio II 172 Cup|2.0 16v F4R|2002-2004|172p|1021|200n|n
Clio II 182|2.0 16v F4R|2004-2006|182p|1090|200n|n
Clio II 182 Trophy|2.0 16v F4R|2005|182p|1090|200n|n
Clio III 197|2.0 16v F4R|2006-2009|197p|1240|215n|n
Clio III 200|2.0 16v F4R|2009-2012|200p|1204|215n|n
Clio IV 200 Turbo|1.6 Turbo EDC|2013-2018|200p|1279|240n|t
Clio IV 220 Trophy|1.6 Turbo EDC|2015-2018|220p|1279|260n|t
=Clio
Clio II|1.2 16v|2001-2006|75p|960|105n|n
Clio III|1.2 16v|2005-2012|75p|1040|105n|n
Clio III|1.5 dCi 86|2005-2012|86p|1100|200n|d
Clio IV|0.9 TCe 90|2012-2019|90p|1009|135n|t
Clio IV|1.5 dCi 90|2012-2019|90p|1071|220n|d
Clio V|1.0 TCe 100|2019-2021|100p|1159|160n|t
Clio V|1.0 TCe 90|2021-|90p|1153|160n|t
=Megane RS
Mk2 225|2.0T F4Rt|2004-2009|225p|1345|300n|t
Mk2 R26|2.0T F4Rt|2007-2009|230p|1345|310n|t
Mk2 R26.R|2.0T F4Rt|2008-2009|230p|1220|310n|t
Mk3 250|2.0T F4Rt|2010-2012|250p|1387|340n|t
Mk3 265|2.0T F4Rt|2012-2016|265p|1387|360n|t|1:300p
Mk3 275 Trophy|2.0T F4Rt|2014-2016|275p|1376|360n|t|1:300p
Mk4 280|1.8 TCe|2018-2019|280p|1407|390n|t
Mk4 300 Trophy|1.8 TCe|2019-2022|300p|1419|400n|t
@Peugeot
=205 GTi
1.6|1.6 8v|1984-1986|105p|880|134n|n
1.6|1.6 8v 115|1986-1992|115p|875|133n|n
1.9|1.9 8v|1986-1992|130p|910|161n|n
=106 GTi
Ph2|1.6 16v|1996-2004|120p|950|142n|n
=106 Rallye
Ph1|1.3 8v|1993-1996|100p|825|111n|n
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
@Toyota
=Aygo
Mk1|1.0 VVT-i|2005-2014|68p|790|93n|n
Mk2|1.0 VVT-i|2014-2018|69p|840|95n|n
Mk2 facelift|1.0 VVT-i|2018-2022|72p|855|93n|n
@Mini
=Cooper S
R53|1.6 supercharged|2002-2004|163p|1140|210n|s
R53|1.6 supercharged 170|2004-2006|170p|1140|220n|s
R56|1.6 Turbo|2006-2010|175p|1130|240n|t
R56 LCI|1.6 Turbo|2010-2014|184p|1130|240n|t
F56|2.0 Turbo|2014-2021|192p|1235|280n|t
=John Cooper Works
R53 GP|1.6 supercharged|2006|218p|1090|250n|s
R56|1.6 Turbo|2008-2014|211p|1205|260n|t
R56 GP|1.6 Turbo|2012-2013|218p|1160|260n|t
F56|2.0 Turbo|2015-2024|231p|1280|320n|t|1:280p,2:295p
F56 GP|2.0 Turbo|2020-2021|306p|1255|450n|t
=Cooper
R50|1.6 16v|2001-2006|115p|1050|149n|n
R56|1.6 16v|2006-2010|120p|1065|160n|n
F56|1.5 Turbo|2014-2024|136p|1085|220n|t
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
@Alfa Romeo
=Giulia Quadrifoglio
952|2.9 V6 biturbo|2016-2023|510p|1580|600n|t
952 facelift|2.9 V6 biturbo|2023-|520p|1580|600n|t
=Giulietta
QV|1750 TBi|2010-2014|235p|1320|340n|t
QV|1750 TBi 240|2014-2016|240p|1320|340n|t
Veloce|1750 TBi 240|2016-2020|240p|1320|340n|t
=147 GTA
Mk1|3.2 V6|2002-2005|250p|1360|300n|n
@Honda
=Civic Type R
EK9|1.6 B16B|1997-2000|185p|1050|160n|n
EP3|2.0 i-VTEC K20A2|2001-2005|200p|1204|196n|n
FN2|2.0 i-VTEC K20Z4|2007-2011|201p|1267|193n|n
FK2|2.0 VTEC Turbo K20C1|2015-2017|310p|1382|400n|t|1:350p
FK8|2.0 VTEC Turbo K20C1|2017-2022|320p|1380|400n|t|1:360p
FL5|2.0 VTEC Turbo K20C1|2023-|329p|1429|420n|t
=Civic
EK VTi|1.6 VTEC B16A2|1996-2000|160p|1090|150n|n
FN|1.8 i-VTEC|2006-2011|140p|1205|174n|n
FK7|1.0 VTEC Turbo|2017-2022|129p|1275|200n|t
FK7|1.5 VTEC Turbo|2017-2022|182p|1307|240n|t
=Integra Type R
DC2|1.8 VTEC B18C|1998-2001|190p|1125|178n|n
DC5|2.0 i-VTEC K20A|2001-2006|220p|1180|206n|n
=S2000
AP1|2.0 VTEC F20C|1999-2004|240p|1260|208n|n
AP2|2.0 VTEC F20C|2004-2009|240p|1270|208n|n
=CR-Z
ZF1|1.5 i-VTEC IMA hybrid|2010-2013|124p|1147|174n|h
ZF2|1.5 i-VTEC IMA hybrid|2013-2016|137p|1155|190n|h
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
=GR Supra
Mk5|3.0 turbo B58|2019-|340p|1495|500n|t|1:440b,2:475b
Mk5|2.0 turbo B48|2020-2023|258p|1395|400n|t
=Celica
T23|1.8 VVT-i 1ZZ|1999-2006|143p|1070|170n|n
T23 190|1.8 VVTL-i 2ZZ|1999-2006|192p|1115|180n|n
ST205 GT-Four|2.0 turbo 3S-GTE|1994-1999|239b|1440|304n|t
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
=Starlet
EP91 Glanza V|1.3 turbo 4E-FTE|1996-1999|135p|890|157n|t
=Chaser
JZX100 Tourer V|2.5 turbo 1JZ-GTE VVT-i|1996-2001|280p|1470|378n|t
@Subaru
=Impreza
Classic Turbo 2000|2.0 turbo EJ20|1994-1996|208b|1235|201l|t
Classic Turbo 2000|2.0 turbo EJ20|1999-2000|215b|1235|214l|t
P1|2.0 turbo EJ20|2000|280p|1283|352n|t
22B STi|2.2 turbo EJ22G|1998|280p|1270|363n|t
New Age WRX|2.0 turbo EJ205|2001-2002|218p|1405|292n|t
New Age WRX|2.0 turbo EJ205|2003-2005|225p|1410|300n|t
Hawkeye WRX|2.5 turbo EJ255|2006-2007|230p|1410|320n|t
=Impreza WRX STI
New Age STI|2.0 turbo EJ207|2001-2005|265p|1470|343n|t
Hawkeye STI|2.5 turbo EJ257|2006-2007|280p|1495|392n|t
Mk3 STI|2.5 turbo EJ257|2008-2014|300p|1505|407n|t|1:330p
=WRX STI
VA|2.5 turbo EJ257|2014-2018|300p|1534|407n|t
=BRZ
Gen 1|2.0 boxer FA20|2012-2020|200p|1230|205n|n
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
Evo X FQ-300|2.0 turbo 4B11T|2008-2014|295p|1560|407n|t
Evo X FQ-330|2.0 turbo 4B11T|2008-2014|324b|1560|437n|t
Evo X FQ-360|2.0 turbo 4B11T|2008-2014|359p|1560|492n|t
Evo X FQ-400|2.0 turbo 4B11T|2009-2010|403b|1560|525n|t
@Nissan
=350Z
Z33|3.5 V6 VQ35DE|2003-2005|280p|1532|363n|n
Z33|3.5 V6 VQ35DE|2005-2006|300p|1532|353n|n
Z33 HR|3.5 V6 VQ35HR|2007-2009|313p|1532|358n|n
=370Z
Z34|3.7 V6 VQ37VHR|2009-2020|328p|1496|363n|n
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
=200SX
S13|1.8 turbo CA18DET|1989-1994|171p|1240|225n|t
S14|2.0 turbo SR20DET|1995-1996|200p|1255|265n|t
S14a|2.0 turbo SR20DET|1997-2000|200p|1255|265n|t
=Silvia
S13 K's|2.0 turbo SR20DET|1991-1993|205p|1220|274n|t
S15 Spec-R|2.0 turbo SR20DET|1999-2002|250p|1250|275n|t
S15 Spec-S|2.0 SR20DE|1999-2002|165p|1200|191n|n
=180SX
RPS13|2.0 turbo SR20DET|1991-1998|205p|1230|274n|t
=Pulsar GTI-R
RNN14|2.0 turbo SR20DET|1990-1994|230p|1220|284n|t
=Micra
K11|1.3 16v|1992-2002|75p|830|105n|n
K12 160SR|1.6 16v|2005-2010|110p|1080|153n|n
=Juke Nismo
F15 Nismo|1.6 DIG-T|2013-2014|200p|1306|250n|t
F15 Nismo RS|1.6 DIG-T|2015-2017|218p|1315|280n|t
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
=RX-8
SE3P 192|1.3 Renesis 13B-MSP 4-port|2003-2010|192p|1335|220n|n
SE3P 231|1.3 Renesis 13B-MSP 6-port|2003-2010|231p|1310|211n|n
@BMW
=M135i
F20|3.0 turbo N55|2012-2015|320p|1500|450n|t
F20 LCI|3.0 turbo N55|2015-2016|326p|1505|450n|t|1:380p
=M140i
F20 LCI|3.0 turbo B58|2016-2019|340p|1525|500n|t|1:420b,2:440b
=M235i
F22|3.0 turbo N55|2014-2016|326p|1530|450n|t
=M240i
F22|3.0 turbo B58|2016-2021|340p|1545|500n|t|1:420b,2:440b
G42 xDrive|3.0 turbo B58|2022-|374p|1690|500n|t
=M2
F87|3.0 turbo N55|2016-2018|370p|1495|465n|t|1:390p,2:400p
F87 Competition|3.0 twin-turbo S55|2018-2020|410p|1550|550n|t
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
F30 LCI|3.0 turbo B58|2016-2019|326p|1580|450n|t
=M340i
G20 xDrive|3.0 turbo B58|2019-|374p|1670|500n|t
=120d
E87|2.0 diesel N47|2007-2011|177p|1395|350n|d
F20|2.0 diesel N47|2011-2015|184p|1420|380n|d
F20 LCI|2.0 diesel B47|2015-2019|190p|1430|400n|d
=320d
E46|2.0 diesel M47|2001-2005|150p|1450|330n|d
E90|2.0 diesel N47|2007-2012|177p|1505|350n|d
F30|2.0 diesel N47|2012-2015|184p|1495|380n|d
F30 LCI|2.0 diesel B47|2015-2019|190p|1495|400n|d
G20|2.0 diesel B47|2019-|190p|1550|400n|d
=M3
E30|2.3 S14 (cat)|1987-1991|195p|1200|230n|n
E30 Evo II|2.3 S14|1988-1989|220p|1200|245n|n
E36|3.0 S50B30|1993-1995|286p|1460|320n|n
E36|3.2 S50B32|1996-1999|321p|1515|350n|n
E46|3.2 S54|2000-2006|343p|1570|365n|n
E46 CSL|3.2 S54|2003-2004|360p|1385|370n|n
E90/E92|4.0 V8 S65|2007-2013|420p|1655|400n|n
F80|3.0 twin-turbo S55|2014-2018|431p|1520|550n|t|1:496p,2:511p
F80 Competition|3.0 twin-turbo S55|2016-2018|450p|1520|550n|t
F80 CS|3.0 twin-turbo S55|2018|460p|1585|600n|t
G80|3.0 twin-turbo S58|2021-|480p|1705|550n|t
G80 Competition|3.0 twin-turbo S58|2021-2024|510p|1730|650n|t
=M4
F82|3.0 twin-turbo S55|2014-2020|431p|1497|550n|t|1:496p,2:511p
F82 Competition|3.0 twin-turbo S55|2016-2020|450p|1497|550n|t
F82 CS|3.0 twin-turbo S55|2017-2018|460p|1580|600n|t
F82 GTS|3.0 twin-turbo S55 water injection|2016|500p|1510|600n|t
G82|3.0 twin-turbo S58|2021-|480p|1700|550n|t
G82 Competition|3.0 twin-turbo S58|2021-2024|510p|1725|650n|t
G82 CSL|3.0 twin-turbo S58|2022-2023|550p|1625|650n|t
=M5
E39|5.0 V8 S62|1998-2003|400p|1795|500n|n
E60|5.0 V10 S85|2005-2010|507p|1830|520n|n
F10|4.4 V8 twin-turbo S63|2011-2016|560p|1870|680n|t
F10 Competition|4.4 V8 twin-turbo S63|2014-2016|575p|1870|680n|t
F90|4.4 V8 twin-turbo S63|2018-2024|600p|1940|750n|t
F90 Competition|4.4 V8 twin-turbo S63|2018-2024|625p|1940|750n|t
=Z4 M
E85/E86|3.2 S54|2006-2008|343p|1410|365n|n
=Z4
E89 sDrive35is|3.0 twin-turbo N54|2010-2016|340p|1505|450n|t
@Mercedes
=A35
W177|2.0 turbo M260|2019-|306p|1480|400n|t
=A45
W176|2.0 turbo M133|2013-2015|360p|1480|450n|t|1:400p
W176 facelift|2.0 turbo M133|2016-2018|381p|1480|475n|t
W177 A45 S|2.0 turbo M139|2019-2025|421p|1635|500n|t|1:460p
=CLA45
C117|2.0 turbo M133|2014-2015|360p|1585|450n|t
C117 facelift|2.0 turbo M133|2016-2019|381p|1585|475n|t
C118 CLA45 S|2.0 turbo M139|2020-|421p|1675|500n|t
=C43
W205|3.0 V6 biturbo M276|2016-2018|367p|1690|520n|t
W205 facelift|3.0 V6 biturbo M276|2018-2021|390p|1690|520n|t
=C63
W204|6.2 V8 M156|2008-2014|457p|1730|600n|n
W204 Performance Pack|6.2 V8 M156|2009-2014|487p|1730|600n|n
W205|4.0 V8 biturbo M177|2015-2021|476p|1640|650n|t
W205 C63 S|4.0 V8 biturbo M177|2015-2021|510p|1655|700n|t
@Hyundai
=i20 N
BC3|1.6 T-GDi|2021-2024|204p|1190|275n|t
=i30 N
PD|2.0 T-GDi|2018-2020|250p|1400|353n|t
PD Performance|2.0 T-GDi|2018-2020|275p|1429|353n|t|1:300b,2:320b
PD facelift Performance|2.0 T-GDi|2021-2024|280p|1455|392n|t|1:340b
=Kona N
OS N|2.0 T-GDi|2021-2023|280p|1510|392n|t
@Kia
=Ceed GT
Mk2 cee'd GT|1.6 T-GDi|2013-2018|204p|1359|265n|t
Mk3 Ceed GT|1.6 T-GDi|2019-2023|204p|1430|265n|t
=ProCeed GT
Mk2 pro_cee'd GT|1.6 T-GDi|2013-2018|204p|1359|265n|t
Mk3 ProCeed GT|1.6 T-GDi|2019-2023|204p|1475|265n|t
=Stinger
GT S|3.3 V6 twin-turbo T-GDi|2018-2020|370p|1855|510n|t
GT S facelift|3.3 V6 twin-turbo T-GDi|2021-2023|366p|1855|510n|t
@Porsche
=911
996 Carrera|3.4 flat-six|1998-2001|300p|1320|350n|n
996 Carrera|3.6 flat-six|2002-2004|320p|1345|370n|n
996 Turbo|3.6 flat-six twin-turbo|2000-2005|420p|1540|560n|t
997.1 Turbo|3.6 flat-six twin-turbo|2006-2009|480p|1585|620n|t
997.2 Turbo|3.8 flat-six twin-turbo|2010-2013|500p|1570|650n|t
991.1 Turbo|3.8 flat-six twin-turbo|2014-2015|520p|1595|660n|t
991.1 Turbo S|3.8 flat-six twin-turbo|2014-2015|560p|1605|700n|t
996 GT3 Mk1|3.6 flat-six Mezger|1999-2001|360p|1350|370n|n
996 GT3 Mk2|3.6 flat-six Mezger|2003-2005|381p|1380|385n|n
997.1 Carrera|3.6 flat-six|2004-2008|325p|1415|370n|n
997.1 Carrera S|3.8 flat-six|2005-2008|355p|1425|400n|n
997.2 Carrera|3.6 flat-six DFI|2009-2012|345p|1415|390n|n
997.2 Carrera S|3.8 flat-six DFI|2009-2012|385p|1425|420n|n
997.1 GT3|3.6 flat-six Mezger|2006-2009|415p|1395|405n|n
997.2 GT3|3.8 flat-six Mezger|2010-2012|435p|1395|430n|n
991.1 Carrera|3.4 flat-six|2012-2015|350p|1380|390n|n
991.1 Carrera S|3.8 flat-six|2012-2015|400p|1395|440n|n
991.2 Carrera|3.0 flat-six twin-turbo|2016-2019|370p|1430|450n|t
991.2 Carrera S|3.0 flat-six twin-turbo|2016-2019|420p|1440|500n|t
991.1 GT3|3.8 flat-six|2014-2016|475p|1430|440n|n
991.2 GT3|4.0 flat-six|2017-2019|500p|1413|460n|n
992.1 Carrera|3.0 flat-six twin-turbo|2019-2024|385p|1505|450n|t
992.1 Carrera S|3.0 flat-six twin-turbo|2019-2024|450p|1515|530n|t
992.1 GT3|4.0 flat-six|2021-2024|510p|1418|470n|n
992.2 Carrera|3.0 flat-six twin-turbo|2025-|394p|1516|450n|t
=Cayman
987.1|2.7 flat-six|2006-2008|245p|1300|273n|n
987.1 S|3.4 flat-six|2005-2008|295p|1340|340n|n
987.2|2.9 flat-six|2009-2012|265p|1330|300n|n
987.2 S|3.4 flat-six DFI|2009-2012|320p|1350|370n|n
987.2 R|3.4 flat-six DFI|2011-2012|330p|1295|370n|n
981|2.7 flat-six|2013-2016|275p|1310|290n|n
981 S|3.4 flat-six|2013-2016|325p|1320|370n|n
981 GTS|3.4 flat-six|2014-2016|340p|1345|380n|n
981 GT4|3.8 flat-six|2015-2016|385p|1340|420n|n
718|2.0 flat-four turbo|2016-|300p|1335|380n|t
718 S|2.5 flat-four turbo|2016-|350p|1355|420n|t
718 GTS 4.0|4.0 flat-six|2020-|400p|1405|420n|n
718 GT4|4.0 flat-six|2019-|420p|1420|420n|n
718 GT4 RS|4.0 flat-six|2022-|500p|1415|450n|n
=Boxster
986|2.5 flat-six|1997-1999|204p|1250|245n|n
986|2.7 flat-six|2000-2002|220p|1260|260n|n
986|2.7 flat-six|2003-2004|228p|1275|260n|n
986 S|3.2 flat-six|2000-2002|252p|1320|305n|n
986 S|3.2 flat-six|2003-2004|260p|1320|310n|n
987.1|2.7 flat-six|2005-2008|240p|1305|270n|n
987.1 S|3.2 flat-six|2005-2006|280p|1355|320n|n
987.2|2.9 flat-six|2009-2012|255p|1335|290n|n
987.2 S|3.4 flat-six DFI|2009-2012|310p|1355|360n|n
981|2.7 flat-six|2012-2016|265p|1310|280n|n
981 S|3.4 flat-six|2012-2016|315p|1320|360n|n
718|2.0 flat-four turbo|2016-|300p|1335|380n|t
718 S|2.5 flat-four turbo|2016-|350p|1355|420n|t
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
`;
