/* eslint-disable */
/**
 * UK motorbikes: stock specs for the vehicle picker. Dataset 2026-11-17.
 *
 * Format (parsed by src/lib/vehicles.ts): "@Make", "=Model", then
 * "gen|engine|years|power|weight|torque|asp[|stages]". Power is as the maker quotes it:
 * p = PS (converted to bhp x0.986), b = bhp, k = kW (x1.341). Torque n = Nm, l = lb-ft.
 * Weight kg: kerb for cars, wet for bikes; "d" = only a dry weight was published (+20 kg added).
 * asp: t turbo petrol, d diesel, n non-turbo, s supercharged, h hybrid. Stages: total power after
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
=CBR600RR
PC37|599cc inline-4|2003-2004|117p|169d|66n|n
PC37|599cc inline-4|2005-2006|117p|163d|66n|n
PC40|599cc inline-4|2007-2012|120p|155d|66n|n
PC40|599cc inline-4|2013-2016|120p|186|66n|n
2024-|599cc inline-4|2024-|121p|193|63n|n
=CBR600F
|599cc inline-4|2011-2013|102p|206|64n|n
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
=CB125F
|125cc single|2021-|8.7k|117|11.2n|n
=PCX125
|125cc single|2021-|9.2k|130|11.8n|n
=Hornet 750
|755cc parallel twin|2023-|92p|190|75n|n
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
=H2
|998cc supercharged inline-4|2015-|231p|238|141.7n|s
=H2 SX
|998cc supercharged inline-4|2018-2021|200p|256|137n|s
SE|998cc supercharged inline-4|2022-|200p|267|137n|s
=ZX-9R
C|899cc inline-4|1998-1999|143p|183d|101n|n
=ZX-12R
A|1199cc inline-4|2000-2001|178p|210d|134n|n
=ZZR1400
|1352cc inline-4|2006-2011|190p|215d|154n|n
|1441cc inline-4|2012-|200p|268|162.5n|n
=Ninja 125
|125cc single|2019-|11k|148|11.7n|n
=Z125
|125cc single|2019-|11k|146|11.7n|n
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
=GSX-R600
K6-K7|599cc inline-4|2006-2007|125p|161d|67.7n|n
K8-L0|599cc inline-4|2008-2010|125p|165d|68.6n|n
L1-|599cc inline-4|2011-|125.8p|187|69.6n|n
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
=Bandit 1200
GSF1200|1157cc air/oil-cooled inline-4|1996-2000|97p|208d|96n|n
GSF1200S|1157cc air/oil-cooled inline-4|1996-2000|97p|214d|96n|n
GSF1200|1157cc air/oil-cooled inline-4|2001-2006|100p|214d|93n|n
GSF1200S|1157cc air/oil-cooled inline-4|2001-2006|100p|218d|93n|n
=Bandit 1250
GSF1250|1255cc liquid-cooled inline-4|2007-2016|100p|247|107n|n
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
=Speed Triple
1050|1050cc triple|2005-2010|131p|189d|105n|n
1050|1050cc triple|2011-2015|135p|214|111n|n
1050 S|1050cc triple|2016-2020|140p|192d|112n|n
1050 R|1050cc triple|2016-2020|140p|189d|112n|n
1200 RS|1160cc triple|2021-|180p|198|125n|n
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
@KTM
=390 Duke
|373cc single|2013-2016|32k|139d|35n|n
|373cc single|2017-2023|32k|149d|37n|n
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
@Husqvarna
=Svartpilen 401
|373cc single|2018-2023|32k|150d|37n|n
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
`;
