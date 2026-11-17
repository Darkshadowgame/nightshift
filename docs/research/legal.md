# Nightshift: UK legal and App Store research

Researched 17 November 2026 for the Phase 1 spec in [`docs/SPEC.md`](../SPEC.md). Related notes: [`plate-blurring.md`](plate-blurring.md), [`data-sources.md`](data-sources.md).

> **Not legal advice.** This is desk research by an AI assistant to help with product design. It is not a substitute for a solicitor. **Before the public App Store launch, get advice from a UK solicitor**, ideally one who knows both online safety/data protection law and local-authority injunction work. Several points below could not be checked against primary sources; they are listed under [What I could not verify](#what-i-could-not-verify).

---

## Summary

1. **The biggest legal risk is the car-cruise injunctions, not the app's core idea.** The West Midlands orders cover anyone who *promotes, organises or publicises "by any means whatsoever"* a gathering where racing, stunts or dangerous driving is *intended or expected*. Every order carries a penal notice that also reaches *"any other person who knows of this order and does anything which helps"* a breach. A platform that has been told about a prohibited cruise and leaves it up is in the risk zone. The "rolling meet" design (hidden next location, revealed only to people already there) is exactly the pattern councils cite in court as evasion.
2. **Lawful meets, shows and track days are fine.** The orders and PSPOs target dangerous or antisocial *driving*, not people parking up to look at cars. Keep the product clearly on that side.
3. **Speed-camera alerts from a database are legal in the UK.** Jammers are not. Sharing live *police* positions is a grey area (obstructing police). Camera alerts are illegal in France, Switzerland and (while driving) Germany.
4. **Live location makes a DPIA mandatory** under the ICO's list. Number plates can be personal data. Blurring plates is good privacy-by-design, but it does **not** make cars anonymous, and it does not stop police or insurers getting evidence.
5. **The Online Safety Act applies** from day one of user posting (profiles, photos, chat). For a small service the work is mostly paperwork: a risk assessment, reporting and complaints, clear terms and a named accountable person. Claiming "18+" only counts if you use *highly effective* age assurance.
6. **App Store:** guideline 1.4.4 bans encouraging "excessive speed", 1.2 needs filter, report, block and contact, and 1.2 rejects "random or anonymous chat". Push-to-talk with strangers within 500 m is the feature most likely to be rejected.
7. **Branding:** stay well away from "Need for Speed", "NFS" and "Underground" in the name, plus EA logos and art. Genre styling is fine. Also check "Nightshift" against Apple's own iOS **Night Shift** feature name.

---

## 1. Car meet and cruising law

### 1.1 Section 59 Police Reform Act 2002 (vehicle seizure)

* [s59 PRA 2002](https://www.legislation.gov.uk/ukpga/2002/30/section/59): a uniformed constable who reasonably believes a vehicle is being driven carelessly or inconsiderately ([RTA 1988 s3](https://www.legislation.gov.uk/ukpga/1988/52/section/3)) or off-road ([s34](https://www.legislation.gov.uk/ukpga/1988/52/section/34)) in a way that causes, or is likely to cause, "alarm, distress or annoyance" can stop it, seize it and remove it.
* **The warning step is gone.** Section 8 of the Crime and Policing Act 2026 repealed s59(4) and (5) from **29 June 2026**, so police can now seize a vehicle at the first incident ([Home Office circular 004/2026](https://www.gov.uk/government/publications/circular-0042026-crime-and-policing-act-2026/circular-0042026-crime-and-policing-act-2026-accessible); [ASB factsheet](https://www.gov.uk/government/publications/crime-and-policing-act-2026-factsheets/crime-and-policing-act-2026-anti-social-behaviour-asb-factsheet)). Users need to know this: one burnout leaving a meet can now lose them the car.
* **App implication:** tell users plainly in event screens and onboarding. It is a user-safety point rather than an app liability.

### 1.2 Public Spaces Protection Orders (PSPOs)

* PSPOs are made under the [Anti-social Behaviour, Crime and Policing Act 2014, ss59–75](https://www.legislation.gov.uk/ukpga/2014/12/part/4/chapter/2). Breaching one is an offence, usually dealt with by a fixed penalty of about £100 or a fine on conviction.
* Many councils have car-cruising PSPOs, for example [Stockport](https://consultation.stockport.gov.uk/place/public-space-protection-order-car-cruising-2026) (proposed to run to 4 May 2029), [Southend](https://www.southend.gov.uk/news/article/3313/council-and-police-enforce-pspo-following-dangerous-driving-at-seafront-car-meet), [Wokingham](https://www.wokingham.gov.uk/news/2025/residents-views-sought-measures-against-car-cruising), [North West Leicestershire](https://www.nwleics.gov.uk/news/2025/10/01/fines_issued_to_nuisance_drivers_in_car_cruising_clampdown), [Central Bedfordshire](https://www.lutontoday.co.uk/news/politics/council/crackdown-on-car-cruising-and-street-racing-in-central-bedfordshire-5464291) and [Bolsover](https://www.bolsover.gov.uk/news/car-cruising-fine-lands-driver-a-hefty-fine).
* Typical wording, from Stockport: "Car cruising" means two or more vehicles on a highway or publicly accessible place where someone is speeding, **driving in convoy**, racing, doing stunts, making noise, causing obstruction and so on. The Stockport text targets drivers and passengers. It does not mention organisers or spectators.
* Southend's council says its PSPO "is not about stopping car meets altogether"; it targets the behaviour.
* **Note:** "driving in convoy" is listed as prohibited conduct in Stockport's PSPO. **A Nightshift "cruise" (a convoy along a route) running through a PSPO area may itself breach the order**, even at legal speeds. PSPO wording varies by council, so each one needs reading.

### 1.3 "Persons unknown" street-cruise injunctions

**Legal basis.** Councils use [s222 Local Government Act 1972](https://www.legislation.gov.uk/ukpga/1972/70/section/222) and [s130 Highways Act 1980](https://www.legislation.gov.uk/ukpga/1980/66/section/130), with a power of arrest under s27 Police and Justice Act 2006. In [*Wolverhampton CC v London Gypsies and Travellers* [2023] UKSC 47](https://caselaw.nationalarchives.gov.uk/uksc/2023/47/press-summary) the Supreme Court confirmed that courts can grant injunctions against "newcomers", people unknown at the time who later do the prohibited act. Such orders need a "compelling justification", wide publicity and periodic review. Car-cruise orders are reviewed every year on that basis ([*Birmingham CC v Persons Unknown* [2026] EWHC 442 (KB)](https://caselaw.nationalarchives.gov.uk/ewhc/kb/2026/442), paras 15–16 and 22).

**Current orders I found (November 2026):**

| Area | Status | Covers organisers or promoters? | Source |
|---|---|---|---|
| **Black Country** (Wolverhampton, Sandwell, Walsall; Dudley stepped back) | Amended order by HHJ Kelly, 27 Feb 2026, in force **until 23:59 on 1 Mar 2027** | **Yes, expressly** (see the wording below) | [Sealed order](https://www.wolverhampton.gov.uk/sites/default/files/2026-05/Black-Country-Injunction-27.02-SEALED_0.pdf); [LGL report](https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/99869-high-court-agrees-car-cruising-injunctions-should-remain-in-black-country-and-birmingham2) |
| **Birmingham** (whole city) | Reviewed 27 Feb 2026; in force **until 23:59 on 27 Feb 2027** | **Yes.** Covers participants, spectators and a separate category of people who "organise or promote" street cruises | [[2026] EWHC 442 (KB)](https://caselaw.nationalarchives.gov.uk/ewhc/kb/2026/442); [council news](https://www.birmingham.gov.uk/news/article/1743/judge_confirms_tough_new_measures_as_birmingham_secures_ongoing_street_cruise_injunction); [2025 review, [2025] EWHC 1102 (KB)](https://caselaw.nationalarchives.gov.uk/ewhc/kb/2025/1102) |
| **Enfield** (borough-wide) | Granted 5 Dec 2025, in force 20 Dec 2025 to 20 Dec 2026, with annual review | **Yes.** Bans gathering to "engage in, participate in, promote or organise" racing, stunts or dangerous driving | [Enfield news](https://www.enfield.gov.uk/news-and-events/2025/01/high-court-upholds-car-cruising-injunction-in-enfield); [order page](https://www.enfield.gov.uk/services/your-council/injunction-order-car-cruising) |
| **Kensington & Chelsea and Westminster** | Granted 30 Jul 2026 (KB-2026-001615), with power of arrest, until the first court date after 19 Jul 2027 | Not confirmed (I could not open the sealed PDF). Reported to cover dangerous driving, **convoys**, racing and stunts | [RBKC](https://www.rbkc.gov.uk/community-and-local-life/community-safety/car-cruising-injunction-order); [Westminster](https://www.westminster.gov.uk/leisure-libraries-and-community/crime-and-community-safety/anti-social-behaviour/injunction-order-car-cruising) |
| Southend | 2018–2023 order, now replaced by a PSPO | n/a | [Southend](https://www.southend.gov.uk/cruiseinjunction) |

**Exact Black Country wording** (sealed order of 27 Feb 2026, para 3):

> "IT IS FORBIDDEN for any of the Third Defendants … to **promote organise publicise (by any means whatsoever)** any gathering between the hours of **3:00pm and 7:00am** of **2 or more persons** with the **intention or expectation** that some of those present will engage in motor racing or motor stunts or other dangerous or obstructive driving within the area shown on the plan B."

"Motor stunts" are defined to include burnouts, donuts, drifting and undertaking. The penal notice says:

> "ANY OTHER PERSON WHO KNOWS OF THIS ORDER AND DOES ANYTHING WHICH HELPS OR PERMITS ANY OF THE DEFENDANTS TO BREACH THE TERMS OF THIS ORDER MAY ALSO BE HELD IN CONTEMPT OF COURT AND MAY BE IMPRISONED, FINED OR HAVE THEIR ASSETS SEIZED."

**Does this cover organising or promoting via social media or apps?** Yes. "By any means whatsoever" plainly includes Instagram, WhatsApp, Facebook and an app like Nightshift. Enforcement already covers this:

* **Six admins and moderators of a Facebook car page** admitted contempt for "promoting, organising or publicising" Wolverhampton cruises. Three were fined £1,000 and three had sentence deferred, and all paid costs. This was a High Court committal hearing on 30 May 2018 ([Wolverhampton CC](https://wolverhampton.gov.uk/news/group-admit-breaching-high-court-car-cruising-injunction)). A planned follow-up meet was cancelled after the council warned the admins.
* **Three Birmingham organisers who promoted meets on Instagram and in group chats** were jailed for 3 years, 4 years 2 months and 3 years for **public nuisance**, a criminal offence separate from the injunction ([Police, Crime, Sentencing and Courts Act 2022 s78](https://www.legislation.gov.uk/ukpga/2022/32/section/78); [Express & Star, 17 Sep 2024](https://expressandstar.com/news/crime/2024/09/17/watch-fireworks-let-off-at-illegal-street-racing-event-in-birmingham-as-organisers-put-behind-bars)).
* The 2026 Birmingham review names specific Instagram organiser accounts and says the council monitors social-media polls in which followers avoid the West Midlands because of the injunction ([2026] EWHC 442 (KB) para 18(vi)). **Councils watch these channels and use them as evidence.**
* Birmingham found five people in contempt in the year to February 2026, after 21 breaches the year before ([2026] EWHC 442 para 18(i)). Enfield got suspended custodial sentences and fines in 2025 ([Enfield](https://www.enfield.gov.uk/news-and-events/2025/06/success-in-court-after-two-people-found-in-breach-of-enfield-car-cruising-injunction)).

**Who could be in contempt?**

| Person | Risk | Why |
|---|---|---|
| **Host or co-host** of a Nightshift cruise or rolling meet inside an injunction area between 3pm and 7am, where stunts or racing are "intended or expected" | **High** | They are a "Third Defendant" (promote, organise, publicise). "Expectation" can be inferred from the crowd, the hour, past events, chat messages ("bring the launch control") or even the class filter ("S class only"). |
| **Attendees and spectators** | Medium to high | Birmingham's order covers spectators. The Black Country's covers people who attend "with the intention or expectation" of stunts. |
| **The app operator (you)** | **Low while unaware; rising sharply once on notice** | Contempt by a non-party needs knowledge of the order *and* an act that knowingly helps a breach (the penal-notice principle). An operator told by a council or police that a listed event is a prohibited cruise, who leaves it up or keeps revealing its locations, is exposed. Councils could also seek orders directly against a platform, or name the account holder. |

**Other routes to liability:**

* **Encouraging or assisting crime:** [Serious Crime Act 2007 s44](https://www.legislation.gov.uk/ukpga/2007/27/section/44) needs *intent*. Foreseeability alone is not enough (s44(2)). Sections 45–46 (believing an offence will be committed) set a lower bar. Product features and marketing that reward speed or evading police are what would supply that intent or belief.
* **Public nuisance** (above). This is used against organisers, not platforms, so far.

**Design choices that reduce this risk** (most important first):

1. **Injunction zones are hard blocks, not warnings.** Turn the PSPO "warning" in the spec into a tiered system:
   * **Court injunction areas** (Birmingham, Black Country, Enfield, RBKC and Westminster, plus any others found): **block** cruises and rolling meets whose start, route or any stop falls inside, between 3pm and 7am. Static meets, shows and track days at a named venue with landowner permission can still go ahead, with a mandatory notice to attendees.
   * **PSPO areas:** block or warn depending on the wording. Block cruises (convoys) where the PSPO bans convoys.
   * Keep the zone data with source links and expiry dates, reviewed every month (orders are reviewed and renewed every year). Hosts see *why* something is blocked, with a link to the order.
2. **Rolling meets must not be designed to evade enforcement.**
   * Require **all stops to be entered on the server before the event starts**, checked against the zones. Drop "add the next stop at the moment you tap Move on".
   * Keep a server-side log of every stop (time, location, host) for the retention period. This is your evidence that the platform is not a tool for hiding, and it is what you would produce if served a lawful request.
   * Never market the reveal as "stay ahead of the police". Frame it as stopping car parks from being swamped and protecting venues.
   * Consider requiring each stop to be a **named venue with landowner or business permission** (a tick box plus venue name) and making rolling meets "crew-only" (smaller invite lists) until the public launch.
3. **Host attestations and terms of use.** At event creation the host ticks to confirm: no racing, stunts or dangerous driving; the venue allows it; they have checked local orders. The terms say that racing, stunts and meets in banned areas or times break the terms and lead to account removal and co-operation with lawful requests.
4. **Notice and takedown** with a published channel for **councils and police** (an email and a form), a target response within hours, and a "suspend event" switch that also stops further reveals.
5. **No "police nearby" alerts in event, chat or cruise context** (see section 3), and moderation of chat terms like "skids", "launch" and "pull" in event chats as a signal (flag for review, don't auto-ban).
6. **Remove "sprint" language.** The spec calls Phase 3 routes "sprint routes". "Sprint" means a speed contest, and that is exactly the evidence of "intention or expectation" of racing that a council would quote. Rename them to "scenic drives" or "routes" (see section 2).

---

## 2. Dangerous driving, racing and gamification

### 2.1 Offences

| Offence | What it is | Notes |
|---|---|---|
| [RTA 1988 s12](https://www.legislation.gov.uk/ukpga/1988/52/section/12) | A person who "**promotes** or takes part in a race or trial of speed between motor vehicles on a public way" commits an offence | Covers the **promoter**, not just drivers. Under [RTOA 1988 Sch 2](https://www.legislation.gov.uk/ukpga/1988/53/schedule/2) it is a summary offence with obligatory disqualification. Lawful closed-road events need a motor race order (s12A–12F). |
| [RTA s1](https://www.legislation.gov.uk/ukpga/1988/52/section/1) / [s2](https://www.legislation.gov.uk/ukpga/1988/52/section/2) / [s2A](https://www.legislation.gov.uk/ukpga/1988/52/section/2A) | Causing death by dangerous driving, and dangerous driving | Up to life imprisonment for causing death (since 2022) |
| [RTA s3](https://www.legislation.gov.uk/ukpga/1988/52/section/3) | Careless and inconsiderate driving | Also the trigger for s59 seizure |
| [SCA 2007 ss44–46](https://www.legislation.gov.uk/ukpga/2007/27/section/44) | Encouraging or assisting any of the above | Intent or belief required |
| [Road Vehicles (Construction and Use) Regs 1986 reg 110](https://www.legislation.gov.uk/uksi/1986/1078/regulation/110) | Using a hand-held phone while driving (widened in 2022 by [SI 2022/81](https://www.legislation.gov.uk/uksi/2022/81/made) to any hand-held use) | Relevant to drive mode, push-to-talk and check-in (see section 7) |

### 2.2 Lessons from apps and social media

* **Snapchat "Speed Filter":** in [*Lemmon v Snap* (9th Cir., 4 May 2021)](https://blog.ericgoldman.org/archives/2021/05/the-ninth-circuits-confusing-ruling-over-snapchats-speed-filter-lemmon-v-snap.htm) the court let a **negligent-design** claim go ahead. The theory was that the filter rewarded users for recording high speeds, and the platform's usual immunity did not cover its own design. This is US law, but the reasoning carries over to UK negligence and to App Store review: **a platform is responsible for what its reward mechanics incentivise**, separately from what users post.
* **Organisers jailed** for Instagram promotion (Birmingham 2024), and **Facebook page admins found in contempt** (Wolverhampton 2018), are both covered above.
* **Waze police reports:** UK police have publicly gamed Waze police markers ([Surrey Police, 2022](https://www.theregister.com/2022/09/01/surrey_police_waze_traffic/)), which shows police treat these features as a road-safety tool rather than an obstruction. Waze itself has not been prosecuted in the UK.

### 2.3 Gamification design rules

* **Never record, display or reward speed, elapsed time or arrival order on public roads.** The spec already says this for cruises. Extend it to routes, and make it a code-level rule.
* **Route completions** should require a **minimum duration** derived from the speed limits along the route (for example, the time at 85% of each limit). Completions faster than that **do not count and earn no rep**, and repeated fast completions flag the account for review. Show "time on route" nowhere.
* **Rep** comes from turning up and contributing: attending, check-ins, photo spots, rated routes, hosting events that finish without incident. A "clean event" bonus for hosts whose events draw no reports or police complaints rewards responsible hosting.
* **Lap times** only within geofenced **licensed circuits** during a listed track day event, and ideally only when entered manually or imported from the circuit's timing system, not computed from phone GPS.
* **Post-meet voting and trophies** for best build are fine. Avoid categories like "loudest", "best launch" or "best skid".
* **Class letters** (S to D) are fine as build descriptors, but don't attach rewards to high classes. Treat class-filtered **night cruises in injunction areas** as higher risk.

---

## 3. Speed-camera and hazard alerts (drive mode, later phase)

### UK position

| Tech | UK status | Source |
|---|---|---|
| GPS database of fixed and mobile camera *sites* (the Waze/TomTom model) | **Legal.** Camera sites are published by safety partnerships | [Confused.com](https://www.confused.com/car-insurance/guides/radar-detectors); [Road Safety Support](https://roadsafetysupport.co.uk/speed-camera-laser-jammers) |
| Radar or laser *detectors* (passive) | Widely reported as legal to own and use. A statutory ban was proposed but, as far as I can find, never brought into force | Secondary sources only; *unverified* |
| **Laser or radar jammers** | **Illegal.** Drivers have been jailed for perverting the course of justice | [Road Safety Support](https://www.roadsafetysupport.co.uk/node/2535); [Driving.co.uk](https://driving.co.uk/?p=105944) |
| Live reports of **police officers or speed traps** | **Grey area.** Warning *speeding* drivers of a police check has been prosecuted as wilful obstruction under [Police Act 1996 s89(2)](https://www.legislation.gov.uk/ukpga/1996/16/section/89) (*Betts v Stevens* [1910]; Grimsby headlight-flashing conviction 2011). *DPP v Glendinning* [2005] says the prosecution must show the warned drivers were actually speeding | [Bike Lawyer](https://www.bikelawyer.co.uk/?p=624); [New Statesman](https://www.newstatesman.com/politics/2011/01/police-officer-thompson-speed) |

**Recommendations for drive mode:**

* Use **official or licensed fixed-camera databases**, and present alerts as speed-limit and hazard alerts ("Average speed zone, 50 mph"), not "police ahead".
* **Leave out user-reported police positions** completely, or at least never show them in or near an event or cruise. A platform where hosts can see "police at stop 1, move on" next to a rolling-meet reveal would be strong evidence of helping people evade a dispersal order or an injunction.
* User hazard reports (debris, accident, broken-down vehicle, flooding) are fine.

### Other countries (for later expansion)

* **France:** apps may not show exact camera locations. Approved providers show generic "zones de danger". Fines up to €1,500 are reported ([TomTom help](https://help.tomtom.com/hc/en-gb/articles/34671694910482-Are-Tom-speed-camera-warnings-legal)).
* **Germany:** a driver may not *use* a camera-warning app or device while driving (StVO §23(1c)), with a €75 fine and a point. In 2026 the federal states pushed for a fuller ban ([Novinite, Jan 2026](https://m.novinite.com/view_news.php?id=236737); [ground.news](https://ground.news/article/hardly-any-sanctions-so-far-federal-states-want-stricter-bans-on-speed-camera-alerts)).
* **Switzerland:** warning systems are prohibited, and even possession may be an offence ([TomTom](https://help.tomtom.com/hc/en-gb/articles/34671694910482-Are-Tom-speed-camera-warnings-legal)).
* Spain, Italy and others restrict detectors and some alerts. **Geofence the feature by country** and default it to off outside the UK.

---

## 4. Data protection (UK GDPR / DPA 2018 / DUAA 2025)

### 4.1 Live location

* **A DPIA is mandatory.** The ICO's list of processing likely to be high risk says: "**A DPIA is required for any intended processing operation involving geolocation data**" where it is combined with another high-risk factor, such as innovative technology or tracking behaviour. Nightshift has several ([ICO high-risk examples](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/examples-of-processing-likely-to-result-in-high-risk/)). Write it before the backend (Supabase) phase, not before public launch.
* Location is not a "special category" under Article 9, but precise, live location shows where people live, work and sleep, and can enable stalking. Treat it as high risk.
* **Lawful basis:**
  * Profile, garage and events: contract (Art 6(1)(b)).
  * **Live presence: consent** (opt-in, per session, withdrawable in one tap). Apple's 5.1.1 and 5.1.5 effectively require consent anyway.
  * Moderation and safety: legitimate interests.
  * Responding to court orders: legal obligation.
  * The new "recognised legitimate interests" basis (Art 6(1)(ea), inserted by the [Data (Use and Access) Act 2025](https://www.legislation.gov.uk/ukpga/2025/18/part/5) and in force from 5 Feb 2026 per [Bratby](https://bratby.law/data-use-and-access-act-2025-commencement/)) includes some disclosures to public bodies and crime purposes. Confirm the exact Annex 1 wording with a solicitor before relying on it.
* **Design:**
  * Presence is off by default.
  * Snap positions to a coarse grid (500 m to 1 km) and add jitter.
  * Show no presence within about 1 km of the user's home or saved private places.
  * Hide users when fewer than about 3 are in a cell, and delay updates by 5–10 minutes.
  * Expire presence automatically when the app closes or after 2 hours.
  * **Do not store a location history.** Keep only the latest fuzzed cell in memory, with a TTL.
  * Block/unblock and "hide from crew X" controls.

### 4.2 Number plates

* **The ICO says** "a VRM is personal data if it can be combined with other information", depending on purpose and context ([ICO innovation FAQs](https://ico.org.uk/for-organisations/advice-and-services/innovation-advice/previously-asked-questions); [ICO video surveillance guidance on ANPR](https://ico.org.uk/for-organisations/guide-to-data-protection/key-dp-themes/guidance-on-video-surveillance-including-cctv/additional-considerations-for-technologies-other-than-cctv)). On a platform that links a plate to a profile, a photo, a location and a time, it will almost always be personal data, both for the owner and for **other people's cars in the background**.
* **Photos of other people's cars at meets:** individuals posting for personal reasons fall under the "domestic purposes" exemption, but **Nightshift, as the platform storing and publishing them, is a controller** for its own processing. Default plate blurring is a strong privacy-by-design measure ([UK GDPR Art 25](https://www.legislation.gov.uk/eur/2016/679/article/25)). It also reduces **plate cloning** risk, which matters to this community.
* **Also strip EXIF GPS** from uploads by default. Otherwise a garage photo reveals the owner's home.
* **Criminal offence data:** reports like "this user was street racing", and the moderation records that follow them, are *allegations of offences* ([Art 10 UK GDPR](https://www.legislation.gov.uk/eur/2016/679/article/10); [DPA 2018 Sch 1](https://www.legislation.gov.uk/ukpga/2018/12/schedule/1)). You need a Schedule 1 condition, probably the preventing or detecting unlawful acts condition, plus an **appropriate policy document**. Keep such notes factual and minimal.

### 4.3 Other obligations

* Pay the **ICO data protection fee** and register (small-organisation tier, about £52 a year per the [ICO](https://ico.org.uk/for-organisations/advice-for-small-organisations/whats-new/blogs/dashcams-and-uk-gdpr-what-small-businesses-need-to-know/)).
* Publish a privacy notice. Support access, deletion and correction requests. **Apple also requires in-app account deletion** (5.1.1(v)).
* **Host data in the UK or EU** (for example, a Supabase London or Frankfurt region) to avoid transfer paperwork.
* **Suggested retention**:

| Data | Retention |
|---|---|
| Live presence | Not stored (latest cell only, 2-hour TTL) |
| Check-ins | 90 days, then aggregate counts only |
| Event stop logs | 12 months |
| Chat | 90 days after the event |
| Moderation records | 2 years |
| Deleted accounts | Purged within 30 days, unless a legal hold applies |

---

## 5. Plate blurring: what it does and does not achieve (for the owner's question)

The owner asked whether default blurring would stop photos "being used by law or insurance purposes". The factual answer:

**What blurring does:**

* It reduces the personal data Nightshift *publishes*, protecting bystanders and owners from doxxing and plate cloning. This is good practice and supports the Art 5(1)(c) data-minimisation and Art 25 privacy-by-design duties.
* If plates are blurred **on the phone before upload**, and the app never receives or stores the unblurred original, then **Nightshift does not hold** the plate. It cannot disclose what it does not hold. That is a lawful and legitimate design choice, made for privacy and not to defeat investigations.

**What blurring does not do:**

* **It does not make a car anonymous.** Modified cars and bikes are often more identifiable from their wrap, wheels, kit and colour than from the plate, especially when tied to a public profile listing the mods.
* **It does not stop police.** Police can get the original photo from the person who took it (their camera roll), from other attendees, from ANPR, CCTV and dashcams, and from Nightshift's other records: who checked in where and when, event stop logs, chat and account details. They can do this through a voluntary request or compulsory process:
  * **Voluntary disclosure:** [DPA 2018 Sch 2 para 2](https://www.legislation.gov.uk/ukpga/2018/12/schedule/2/paragraph/2) *permits* (it does not *require*) a controller to disclose personal data for preventing or detecting crime where the normal rules "would be likely to prejudice" that purpose. Police usually make such requests on a standard form. Nightshift decides case by case.
  * **Compulsory:** a **production order** under [PACE 1984 Sch 1](https://www.legislation.gov.uk/ukpga/1984/60/schedule/1) (a court order to produce material, including electronic data "in a form in which it is visible and legible"), search warrants, and, if Nightshift is treated as a telecoms operator for its chat, communications-data authorisations under the [Investigatory Powers Act 2016 Part 3](https://www.legislation.gov.uk/ukpga/2016/25/part/3). Courts also make **non-party disclosure** orders in civil cases ([CPR 31.17](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part31#31.17); Norwich Pharmacal orders).
  * In contempt proceedings, councils have used social-media evidence heavily (see section 1.3).
* **It does not stop insurers.** Insurers investigate claims using social media, open-source photos and witness evidence. They can ask Nightshift for data (Sch 2 para 2 covers fraud, and [Sch 2 para 5](https://www.legislation.gov.uk/ukpga/2018/12/schedule/2/paragraph/5) covers legal claims), and they can get court orders.

**What the app must not do** (keep this factual in owner discussions):

* Market blurring or ephemeral data as a way to "beat" police or insurers. That messaging could supply the *intent* for SCA 2007 s44 or for contempt. It would also likely breach Apple 1.4.4 and 5.1.
* **Delete or alter data after receiving a request, preservation notice or court order, or once aware of an investigation.** That risks **perverting the course of justice** (a common-law offence) and contempt. Routine deletion under a published retention schedule is fine, but it must be **paused (a "legal hold")** for specific accounts or events when a request arrives.

**Recommended law-enforcement request policy** (publish a short version):

1. Verify that the requester is genuine (call back on an official number).
2. Require legal process for message content. Consider Sch 2 para 2 requests for basic account data case by case.
3. Make emergency disclosures where there is a risk to life.
4. Preserve data for 90 days on request.
5. Tell the user unless prohibited or unless it would prejudice the investigation.
6. Keep a log and publish a yearly transparency count.

---

## 6. Online Safety Act 2023

**Is Nightshift a "user-to-user service"?** **Yes.** [OSA s3](https://www.legislation.gov.uk/ukpga/2023/50/section/3) covers any internet service where content generated, uploaded or shared by one user can be "encountered" by another: profiles, build photos, event pages, chat and voice. It has UK users and targets the UK, so it has "links with the UK" (s4). **There is no size threshold** for the core duties. Only the extra Category 1, 2A and 2B duties depend on size, and Nightshift won't be categorised.

**Duties for a small service, and timelines as they apply in 2026** ([Ofcom important dates](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/important-dates-for-online-safety-compliance); [illegal content duties](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/illegal-content-duties-under-the-online-safety-act)):

| Duty | What it means for Nightshift | When |
|---|---|---|
| **Illegal content risk assessment** | Assess 17–18 kinds of priority illegal content, plus other relevant offences, and keep a written record. Relevant risks for this app: harassment and stalking (location), threats, fraud and scams (car sales), CSEA (grooming, if under-18s get in), and encouraging or assisting crime. | **Within 3 months of launch**, and **before any "significant change"** such as live presence, push-to-talk or drive mode. Review yearly. Ofcom is already investigating a platform for launching a feature before assessing it ([Lewis Silkin, Oct 2026](https://www.lewissilkin.com/insights/2026/10/22/ofcom-investigation-puts-pre-launch-risk-assessments-in-the-spotlight-102o663)). |
| **Illegal content safety duties** (codes in force since **17 Mar 2025**) | Even "low risk" services need: a **named accountable person**, clear **terms of service** explaining how users are protected, a **content moderation function** that removes illegal content quickly, **easy reporting**, and a **complaints procedure** with appeals. | Now |
| **Children's access assessment** | Required for all user-to-user services. You can only conclude children *cannot* access the service if you use **highly effective age assurance** (HEAA). App Store 18+ ratings and self-declared dates of birth are *not* HEAA ([Ofcom age assurance statement](https://www.ofcom.org.uk/online-safety/protecting-children/statement-age-assurance-and-childrens-access?language=en); [Ofcom tool](https://www.ofcom.org.uk/os-toolkit/child-access-assessment/childrens-access-assessment-tool)). Without HEAA you must assume children can access it, which triggers a **children's risk assessment** and the **Protection of Children Codes** (in force since 25 Jul 2025). | Within 3 months of launch |
| **CSEA reporting** to the NCA | Any detected child sexual exploitation and abuse content must be reported | Since **7 Apr 2026** |
| Records and Ofcom information requests | Keep risk-assessment records and measure records | Ongoing. Ofcom can request them. |
| Fees | Only above the £250m worldwide revenue threshold | n/a |

**Recommendation:**

* For the **friends-only TestFlight beta**, write a lightweight risk assessment and terms now. Technically the Act may already apply once other people can post.
* **Before the public launch**, add HEAA. A natural fit is **photocard driving licence or ID check plus selfie match, or facial age estimation**, through a certified provider. That lets you document "children cannot normally access" and avoid the children's codes. It also deters fake accounts and ban evasion.
* Penalties go up to £18m or 10% of qualifying worldwide revenue, and Ofcom has opened enforcement programmes specifically on risk assessments ([CMS](https://cms.law/en/gbr/legal-updates/online-safety-act-ofcom-launches-enforcement-programme-for-illegal-harms-risk-assessments)).
* **Dangerous driving is not a Schedule 7 priority offence** (as far as I could check, see [Sch 7](https://www.legislation.gov.uk/ukpga/2023/50/schedule/7)). Encouraging or assisting it is therefore likely "other illegal content" rather than priority content. You still have to remove it swiftly once you are aware of it.

---

## 7. Apple App Store Review Guidelines

Quoted from the [current guidelines](https://developer.apple.com/app-store/review/guidelines/):

| Guideline | Text (excerpt) | Impact on Nightshift |
|---|---|---|
| **1.2 UGC** | Must include "a method for filtering objectionable material", "a mechanism to report offensive content and timely responses", "the ability to block abusive users", "published contact information" | Build all four before the first App Store submission: report and block on profiles, photos, events, chat and voice, plus keyword and image filtering. |
| **1.2** | Apps "used primarily for … **random or anonymous chat** … making physical threats, or bullying do not belong on the App Store" | **Proximity push-to-talk with strangers within 500 m is high risk** for rejection. Limit push-to-talk to the members of a cruise or crew you have joined. |
| **1.4.4** | "should never **encourage** drunk driving or other **reckless behavior such as excessive speed**". Apps "may only display DUI checkpoints that are published by law enforcement" | No speed rewards, timed routes or "sprint" language. No police-position reports (by analogy with DUI checkpoints). |
| **1.4.5** | Apps "should not urge customers to participate in activities (like bets, challenges, etc.) or use their devices in a way that risks physical harm" | Route "challenges" and rep: keep them speed-free and add a minimum duration. Drive mode must be hands-free, with no interaction while moving. |
| **2.5.4** | Background services only "for their intended purposes: VoIP, audio playback, location, task completion, local notifications" | Background location only during an active cruise or presence session, with a clear purpose string. Expect questions about "Always" permission, so prefer "When in use" plus a Live Activity. |
| **5.1.1** | Consent for data collection; "you must also offer account deletion within the app" | In-app delete. Privacy nutrition labels must list precise location. |
| **5.1.2(iii)** | No "surreptitiously build a user profile" | Don't combine check-ins into hidden movement profiles. |
| **5.1.5** | "Use Location Services … only when it is directly relevant"; "notify and obtain consent" | Fine for map, check-in and presence, if each is opt-in. |
| **4.1(c), 5.2.1, 5.2.5** | No third-party brand or product names in the icon or name without approval; don't use "trademarks … without permission"; nothing "confusingly similar to an existing **Apple product**" | See section 8 (EA, car makers, and Apple's "Night Shift"). |
| **1.1.6** | No "false information … fake location trackers" | The demo "simulate GPS" switch must not ship in production builds. |
| **2.3.6** | Answer age-rating questions honestly | Rate 18+. Also use HEAA (section 6). |
| **1.5** | Support URL and contact details | Required |

**Push to Talk (PushToTalk framework):**

* Apple's developer support guidance says "All apps implementing a push-to-talk workflow should adopt the PushToTalk framework", and the legacy PTT entitlement is being deprecated ([Apple forums, DTS](https://developer.apple.com/forums/thread/760506)).
* Use of the framework needs the Push to Talk capability and background mode. A channel must be joined **while the app is in the foreground** ([PTChannelManager](https://developer.apple.com/documentation/pushtotalk/ptchannelmanager)). There is no ad-hoc "everyone near me" broadcast; channels are explicit, which fits a "cruise channel" model.
* **Road law:** the driver must not hold the phone ([reg 110](https://www.legislation.gov.uk/uksi/1986/1078/regulation/110)). Hands-free use from a cradle is legal, but careless driving can still apply. Use the system PTT UI or Bluetooth handlebar and steering buttons, and default to **passenger-only** or voice-activated transmit.

---

## 8. Trademarks and branding

* **EA owns "NEED FOR SPEED"** (US registration 2132509, filed 1997, per [Justia](https://companyprofiles.justia.com/company/electronic-arts/trademarks/trademark?page=29)). EA has filed EU marks such as "NEED FOR SPEED ARENA" ([Trusted Reviews, 2016](https://www.trustedreviews.com/news/need-for-speed-arena-trademark-registered-by-ea-in-europe-2940401)) and files UK marks in classes 9 and 41 through Harbottle & Lewis ([UK TM Journal 2026/007](https://www.ipo.gov.uk/t-tmj/tm-journals/2026-007/UK00004329833.html)). **I could not run a UK IPO search**: the search service returned a bot challenge. Assume UK and EU protection exists for NEED FOR SPEED and NFS in classes 9 and 41.

| Risky (avoid) | Fine |
|---|---|
| "Need for Speed", "NFS", "NFS-style", "Underground" as the app name or subtitle, or in App Store keywords and metadata (Apple 5.2.1 also bans "copycat … metadata") | A dark neon map, hexagon pins, "garage", "rep", class letters, game-style stats screens. **Genre conventions are not protected.** |
| EA logos, fonts, game screenshots, cover art, the NFS Underground 2 HUD or vinyl art, sound effects | Your own original art, fonts licensed for app use, and music you have licensed |
| "Most Wanted", "Heat", "Carbon", "Unbound" used *as product names alongside* racing-game styling (ordinary words, but in that context they create a passing-off risk) | Ordinary words used descriptively ("cruise", "meet", "underground scene" in body text) |
| Car maker **logos and badges** (BMW roundel, VW, Honda H) as filter icons or map pins | Brand **names in plain text** in the "brand" filter. This is descriptive or referential use, allowed under [Trade Marks Act 1994 s11(2)](https://www.legislation.gov.uk/ukpga/1994/26/section/11) if done fairly, with no logos. |
| "Fast & Furious" (Universal) references | Users' own photos of their own cars, including badges |

* **"Nightshift" name check:**
  * Apple ships an iOS display feature called **Night Shift**. Apple guidelines 4.1(c) and 5.2.5 ("confusingly similar to an existing Apple product") make this a review risk, and Apple could also object on trademark grounds. A distinctive tagline helps ("Nightshift: Car & Bike Meets").
  * A UK designation of an international mark **NIGHTSHIFT** exists in classes 9 and 11 for flashing lights and beacons ([UK TM Journal 2026/024, WO0000001920180](https://www.ipo.gov.uk/t-tmj/tm-journals/2026-024/WO0000001920180.html)). That is different goods, so likely low risk, but class 9 also covers software. The US has a pending NIGHTSHIFT class 9 application (NightShift Automation LLC, 2026).
  * **Get a proper clearance search (UK IPO, EUIPO and WIPO) before spending on branding**, and consider filing your own UK mark in classes 9, 41 and 42 (about £170–£270 online).

---

## 9. Insurance

* **Declaring mods is a legal duty.** For personal motor policies, the [Consumer Insurance (Disclosure and Representations) Act 2012 s2](https://www.legislation.gov.uk/ukpga/2012/6/section/2) requires the consumer to "take reasonable care not to make a misrepresentation" when answering the insurer's questions. Insurers always ask about modifications. Under Schedule 1, a **deliberate or reckless** misrepresentation lets the insurer avoid the policy and keep the premium. A **careless** one leads to a proportionate remedy, such as paying a reduced share of the claim. Insurers still have to pay third parties under the RTA, then recover the money from the driver ([Quotezone](https://quotezone.co.uk/car-insurance/guides/vehicle-modifications); [Honest John](https://www.honestjohn.co.uk/news/tax-insurance-and-warranties/2025-06/how-roof-boxes-and-bike-racks-could-invalidate-your-car-insurance)).
* **Track days are usually excluded** from standard road policies. Separate track-day cover exists. A Financial Ombudsman decision is reported to treat Nürburgring tourist sessions as an excluded "prepared course" ([Confused.com](https://www.confused.com/car-insurance/guides/track-day-insurance); [oversteer48](https://oversteer48.com/nurburgring-insurance-tourist-driving-guide/), a secondary source).
* **Meet attendance:** I found no evidence that mainstream UK insurers ask about or penalise *attending* meets. Specialist modified-car insurers often give discounts for club membership. Mod-heavy profiles and photos **are** used by insurers in claim investigations, including open-source checks for undeclared mods and "crash for cash" fraud.
* **Could insurers get Nightshift data?**
  * They can *ask*, under DPA Sch 2 para 2 (fraud is a crime) or para 5 (legal claims). Both *permit* disclosure; neither requires it.
  * They can *compel* it through a court order (CPR 31.17, Norwich Pharmacal).
  * Recommended policy: **no voluntary disclosure to insurers or other private parties without a court order**, except where the user consents. Publish this. Disclosures to police are handled under section 5.
* **What the app should tell users:**
  * When a build is saved with mods: "Have you told your insurer about these mods? Undeclared mods can void your cover."
  * On track-day events: "Your road policy probably doesn't cover track use."
  * On public profiles: "Your garage is public. Insurers and police can see public posts." Make garage visibility selectable (Public / Crew / Only me).

---

## Risk table

Severity: **H** high, **M** medium, **L** low. Phase: **P1** friends beta (local data), **P1b** Supabase backend and TestFlight, **Pub** public App Store launch, **P2/P3** later features.

| # | Risk | Severity | Mitigation | Phase |
|---|---|---|---|---|
| 1 | Hosts in contempt for promoting cruises or rolling meets in an injunction area (3pm–7am) where stunts or racing are expected | **H** | Hard-block cruises and rolling meets in injunction zones at night; host attestation; zone data with links and expiry dates, reviewed monthly; in-app explanation of the orders | P1b (data), Pub (enforced) |
| 2 | Platform contempt or liability after being put on notice of a prohibited event | **H** | Council and police takedown channel; suspend switch that stops reveals; response target in hours; legal hold | P1b |
| 3 | Rolling-meet design seen as built to evade police | **H** | All stops pre-registered server-side and zone-checked; stops logged; venue-permission field; no "stay ahead of police" copy; no police alerts near events | P1b |
| 4 | Cruise (convoy) breaches a PSPO that bans "driving in convoy" | M | PSPO dataset including wording flags; block convoy events where convoys are banned | P1b |
| 5 | Gamification seen as encouraging speed (SCA 2007, App Store 1.4.4/1.4.5, negligent design as in *Lemmon v Snap*) | **H** | Rename "sprint routes"; no time or speed anywhere; minimum-duration rule voids fast completions; lap times only at geofenced circuits; "clean event" host bonus | P1 (naming), P3 |
| 6 | Live presence enables stalking or harassment; data protection breach | **H** | DPIA; opt-in per session; fuzzing, k-anonymity, delay, home exclusion; no history stored; block and hide controls | P2 (DPIA by P1b) |
| 7 | No DPIA, no ICO fee, no privacy notice | M | Write the DPIA, pay the fee, publish the notice, UK or EU hosting | P1b |
| 8 | Plates or other third-party data published; plate cloning; EXIF leaks home location | M | On-device plate blur by default; strip EXIF GPS; reporting for unblurred plates | P1b–P2 |
| 9 | Blurring or ephemerality perceived or marketed as obstructing justice | M | Factual copy only; written law-enforcement policy; legal hold; no deletion after a request | Pub |
| 10 | OSA non-compliance (no risk assessment, reporting or complaints; assessment skipped before new features) | **H** (Ofcom is actively enforcing) | Risk assessment within 3 months of launch and *before* presence, push-to-talk or drive mode; named accountable person; terms; reporting and complaints; records | P1b, Pub |
| 11 | Children get in. Without HEAA, the children's codes and risk assessment apply | **H** | HEAA (licence or ID plus selfie, or facial age estimation) before public launch | Pub |
| 12 | App Store rejection: UGC tools missing (1.2) | **H** | Filter, report, block and contact on all UGC surfaces | Pub |
| 13 | App Store rejection or legal risk: proximity push-to-talk with strangers ("random chat"), driver distraction | **H** | Push-to-talk only inside joined cruise or crew channels; passenger-first; system PTT UI; moderation and reporting of voice | P3 |
| 14 | Police-position alerts treated as obstruction (Police Act 1996 s89) or as helping evade dispersal or injunctions | M | Official fixed-camera and hazard data only; no user police reports | P3 |
| 15 | Camera alerts illegal abroad (France, Germany, Switzerland) | M (L until expansion) | Country geofence; off by default outside the UK | P3+ |
| 16 | Trademark or passing-off claim from EA; App Store 5.2.1 / 4.1 | M | No NFS, Underground or EA marks or art; plain-text car brands, no logos | P1 (branding) |
| 17 | "Nightshift" conflicts with Apple's iOS "Night Shift" or other marks | M | Clearance search; distinctive full name; own UK filing | Before Pub |
| 18 | Users caught out by undeclared mods or track-day exclusions; insurers seek data | M | Nudges on mods and track days; garage visibility controls; no voluntary disclosure to insurers without a court order | P1 (copy), P1b (policy) |
| 19 | s59 seizure (no warning since 29 Jun 2026) and PSPO fines for users | M (to users) | Clear in-app guidance at events; "no skids, no noise" host code of conduct | P1 |
| 20 | Criminal-offence data in moderation records without a Sch 1 condition or policy document | L–M | Appropriate policy document; minimal factual notes; retention limits | P1b |
| 21 | Demo "simulate GPS" shipping in production (1.1.6) | L | Build flag that strips it from release builds | Pub |

---

## Concrete changes to `SPEC.md`

1. Rename **"sprint routes" to "scenic routes"** everywhere, and add the minimum-duration completion rule.
2. Make **PSPO and injunction zones a tiered system**: *block* (injunction areas, 3pm–7am, cruises and rolling meets), *block convoy* (PSPOs that ban convoys), *warn* (other PSPOs). Add `source_url`, `expires_at` and `last_checked` to the zone data.
3. **Rolling meets:** remove "host adds the next stop at the moment they tap Move on". All stops are entered before the start and zone-checked. Add a venue-permission field and server-side stop logging.
4. Add a **host code of conduct and attestation** to event creation.
5. Add **report, block and filter** to every UGC surface, and a **council/police contact channel**, before public launch.
6. **Garage visibility** setting, **EXIF stripping**, and **on-device plate blur** (no unblurred original stored server-side).
7. **Insurance nudges** on mods and track days.
8. Phase 2 and 3 notes: presence opt-in with fuzzing and no history; push-to-talk only in joined channels; no police reports; camera alerts geofenced to the UK.
9. Compliance checklist before public launch: DPIA, ICO fee, privacy notice, OSA risk assessment and children's access assessment (with HEAA), terms of service, named accountable person, law-enforcement policy, trademark clearance, **solicitor review**.

---

## What I could not verify

* **UK IPO register entries** for NEED FOR SPEED, NFS, UNDERGROUND or NIGHTSHIFT. The search service returned a bot challenge, so the EA UK and EU coverage is assumed, not confirmed. Whether Apple holds a "NIGHT SHIFT" mark is also unchecked.
* The **Birmingham** sealed order's exact organiser wording (the council's PDF and page returned errors). The scope is taken from the 2026 judgment and council summaries.
* The **RBKC and Westminster** (July 2026) and **Enfield** sealed orders' exact wording on promoting and organising.
* Whether car-cruise injunctions exist in **other areas** (Coventry, Solihull, Bradford, Kirklees, Stoke and others). Searches found none, but the data task should check every council.
* **Penalty details for RTA s12** (taken from RTOA Sch 2 by reference, not quoted).
* The status of any UK ban on passive **radar or laser detectors** (secondary sources only).
* The full **Data (Use and Access) Act 2025 Annex 1** wording on crime-related disclosures.
* Whether **dangerous driving** (or encouraging it) appears anywhere in OSA Schedule 7. I believe it does not.
* Apple's App Review stance on **PushToTalk** apps beyond developer-forum statements. The guidelines text itself does not mention push-to-talk.
* Whether Nightshift's chat would make it a "telecommunications operator" for IPA 2016 purposes.
* Insurer practice on **meet attendance**. I found no primary evidence either way.
* Fine levels quoted from secondary sources: Germany €75, France up to €1,500, s89 obstruction level 3.
