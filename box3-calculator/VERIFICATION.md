# Box 3 calculator — primary-source verification

Verified-on date for this table: **2026-11-15** (Europe/Amsterdam).  
Every shipped numeric rule below was checked against a primary source URL the same day.  
Values that could not be confirmed, or that diverge by a documented rounding quirk, are marked **FLAG**.

| Rule | Value used | Source URL | Quote / article | Verified-on | Test name |
| --- | --- | --- | --- | --- | --- |
| Forfaittarief box 3 (2026) | 36% | https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/boxen_en_tarieven/box_3/box_3 | “2026 \| 36%” | 2026-11-15 | `params.test.js` → `huidig forfaittarief 36%` |
| Heffingsvrij vermogen 2026 (alleen) | €59.357 | https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/heffingsvrij-vermogen | “2026 \| € 59.357 \| € 118.714” | 2026-11-15 | `params.test.js` → `heffingsvrij vermogen 2026` |
| Heffingsvrij vermogen 2026 (partners) | €118.714 | same | same | 2026-11-15 | same |
| Forfait banktegoeden 2026 | 1,28% (voorlopig) | https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/berekening-box-3-inkomen-2026 | “Banktegoeden: 1,28%” | 2026-11-15 | `params.test.js` → `forfaitaire percentages 2026` |
| Forfait overige bezittingen 2026 | 6,00% (definitief) | same | “Beleggingen en andere bezittingen: 6,00%” | 2026-11-15 | same |
| Forfait schulden 2026 | 2,70% (voorlopig) | same | “Schulden: 2,70%” | 2026-11-15 | same |
| Schuldendrempel 2026 | €3.800 / persoon | same | “De drempel is € 3.800 per persoon.” | 2026-11-15 | `params.test.js` → `schuldendrempel 2026` |
| BD rekenvoorbeeld spaargeld €150k | belasting €417 | same | “36% × € 1.160 = € 417 belasting”; aandeel “60,42%” | 2026-11-15 | `forfait-bd.test.js` → `€150.000 spaargeld, geen partner` |
| BD rekenvoorbeeld spaargeld + partner | €72 / partner | same | “36% × € 200 = € 72 belasting” | 2026-11-15 | `forfait-bd.test.js` → `met partner` |
| BD rekenvoorbeeld mix zonder partner | belasting €4.667 | same | “36% × € 12.964 = € 4.667 belasting”; aandeel “81,94%” | 2026-11-15 | `forfait-bd.test.js` → `mix … geen partner` |
| BD rekenvoorbeeld mix met partner | €1.842 / partner | same | “36% × € 5.119 = € 1.842” | 2026-11-15 | `forfait-bd.test.js` → `mix met partner` |
| **FLAG** BD schuldenrendement in mix-voorbeeld | BD toont €2.598; 96.200×2,70%=€2.597,40 | same | Component half-up → €2.597; BD narrative €2.598. Tax still €4.667 | 2026-11-15 | documented in `forfait-bd.test.js` |
| Tegenbewijs: lager werkelijk rendement vervangt forfait | min(forfait, werkelijk)×36% | https://wetten.overheid.nl/BWBR0011353/2026-01-01/#Hoofdstuk5_Afdeling5.6_Artikel5.25 | Art. 5.25 lid 1: “…werkelijke rendement … lager is dan het voordeel … gesteld op het werkelijke rendement” | 2026-11-15 | `tegenbewijs.test.js` → `art. 5.25` |
| Tegenbewijs nooit hoger dan forfait | never pay more | https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/wat-is-mijn-werkelijk-rendement | “U gaat nooit meer belasting betalen dan wij eerder hebben berekend.” | 2026-11-15 | same |
| Geen heffingsvrij vermogen bij werkelijk rendement | true | https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/heffingsvrij-vermogen | “Bij de berekening van uw werkelijk rendement hebt u geen heffingsvrij vermogen” | 2026-11-15 | `tegenbewijs.test.js` → `geen heffingsvrij vermogen` |
| Negatief werkelijk rendement → €0; geen jaarverrekening | true | https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/content/wat-is-mijn-werkelijk-rendement | “zetten wij dit op € 0. U mag een negatief rendement … niet met een ander jaar verrekenen.” | 2026-11-15 | `tegenbewijs.test.js` → `negatief rendement` |
| Wet tegenbewijsregeling box 3 | Stb. 2025, 195 / BWBR0051293 | https://wetten.overheid.nl/BWBR0051293/2025-07-19/0 | Citeertitel “Wet tegenbewijsregeling box 3”; wijzigt Wet IB 2001 | 2026-11-15 | cited in `data.json` notes |
| Heffingsvrij resultaat (voorstel) | €1.800 | https://www.eerstekamer.nl/behandeling/20260212/gewijzigd_voorstel_van_wet_2 | Art. 5.40: “Het heffingsvrije resultaat bedraagt € 1.800.” | 2026-11-15 | `params.test.js` → `heffingsvrij resultaat` |
| Verliesdrempel (voorstel) | €500 | same | Art. 5.65: “…hoger is dan € 500.” | 2026-11-15 | `params.test.js` → `verliesdrempel` |
| MvT voorbeeld verlies Yuri | −€19.090 → verlies €18.590 | https://www.eerstekamer.nl/behandeling/20250516/memorie_van_toelichting | “Verlies … € 18.590 (= € 19.090 -/- € 500)” | 2026-11-15 | `nieuw-stelsel.test.js` → `MvT voorbeeld 12` |
| MvT voorbeeld Yuri winstjaar | resultaat €50.980; inkomen €49.180; belastbaar €24.180 | same | structure quotes as above; MvT tax used 36% | 2026-11-15 | `nieuw-stelsel.test.js` → `MvT voorbeeld 11` |
| MvT voorbeeld Xavier spaarder | resultaat €3.980; inkomen €2.180 | same | “€ 2.180 (= € 3.980 -/- € 1.800)” | 2026-11-15 | `nieuw-stelsel.test.js` → `MvT voorbeeld 10` |
| **FLAG** MvT box 3-tarief in voorbeelden | MvT: 36%; module: 35,5%/38,5% | MvT 36 748 nr. 3 vs amendement 80 | Module applies TK-aangenomen amendement; not yet wet | 2026-11-15 | flagged in tests |
| Amendement 37 022 nr. 80 tarieven | 35,5% / 38,5% vanaf €60.000 rendement/jaar | https://www.eerstekamer.nl/behandeling/20261112/stemmingsoverzicht_tweede_kamer_4 | “toptarief … 38,5% … € 60.000”; “36% naar 35,5%”; aangenomen TK 12-11-2026 | 2026-11-15 | `params.test.js` → `tarieven amendement` |
| **FLAG** schijf €60.000 per partner | `schijf_per_persoon: true` | same amendement text | Amendement noemt geen aparte partnergrens; module-aanname | 2026-11-15 | flagged in `data.json` note |
| Novelle 37 053: TK aangenomen, EK open | status voorstel | https://www.eerstekamer.nl/wetsvoorstel/37053_novelle_uitbreiding | “op 12 november 2026 aangenomen door de Tweede Kamer”; FIN EK 17-11-2026 | 2026-11-15 | `novelle.test.js` → `novelle status` |
| Ingangsjaar nieuw stelsel | 2029 | https://zoek.officielebekendmakingen.nl/kst-1278606.pdf | “…1 januari 2029” | 2026-11-15 | `params.test.js` → `beoogd ingangsjaar` |
| Financiële instrumenten | vermogenswinst | same PDF §2.2–2.3 | uitbreiding VWB naar alle financiële instrumenten | 2026-11-15 | `novelle.test.js` → `financiële instrumenten` |
| Banktegoeden / directe crypto | vermogensaanwas (tijdelijk) | same PDF §2.4 | “directe cryptobeleggingen (crypto wallets)… banktegoeden… vermogensaanwasbelasting”; verwachting vanaf 2030 | 2026-11-15 | same |
| Novelle voorbeeld Henk | 2029 €50; 2030 €340 | same PDF §2.3 | “Het belastbare voordeel in 2029 bedraagt € 50 en in 2030 € 340.” | 2026-11-15 | `novelle.test.js` → `voorbeeld Henk` |
| **FLAG** multi-lot gemiddelde verkrijgingsprijs | arithmetic tested; full multi-lot path not in simulator | same | Simulator uses single-lot step-up at start | 2026-11-15 | flagged in `novelle.test.js` |
| Wet werkelijk rendement box 3 (36 748) | TK aangenomen feb 2026; EK + novelle pending | https://www.eerstekamer.nl/wetsvoorstel/36748_wet_werkelijk_rendement_box | dossierstatus EK | 2026-11-15 | status in `data.json` |
| Afschaffen schuldendrempel in nieuw stelsel | drempel 0 | MvT 36 748 nr. 3 | “schuldendrempel … komt … niet terug” | 2026-11-15 | `data.json` `geen_schuldendrempel` |

## How rounding is applied

| Context | Method | Source |
| --- | --- | --- |
| Continuous projection (`forfait` / `simulate`) | Exact floating point | Internal; not a BD rounding claim |
| Official BD examples (`forfaitOfficial`) | Component returns `Math.round`; share truncate 2 dp; voordeel & tax floor | BD rekenvoorbeelden 2026 (verified) |

## Unconfirmed / do not ship silently

1. **Partner split of the €60.000 toptarieven-schijf** — amendement text does not state a per-partner bracket; module assumption is explicit in `data.json`.
2. **Multi-lot average cost basis** — Henk example arithmetic is tested; the simulator does not model staggered purchases.
3. **MvT 36% vs amendement 35,5%** — structure of MvT examples is verified; tax euros in those examples are recomputed at 35,5%.
4. **BD schuldenrendement €2.598 vs 2597,40** — one-euro intermediate print difference; final tax €4.667 still matches.
