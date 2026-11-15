# Box 3-rekenvoorbeeld

Statische GitHub Pages-calculator: huidig forfait + tegenbewijs naast het voorstel werkelijk rendement (36 748 / novelle 37 053 / amendement 37 022 nr. 80).

Geen belastingadvies. Parameters staan in `data.json` met bron-URL’s.

## Bestanden

| File | Rol |
| --- | --- |
| `calc.js` | Rekenkern (browser + Node) |
| `model.js` | Scenario-builders / dropdown-ranges |
| `app.js` | UI |
| `data.json` | Bron-gebonden parameters |
| `VERIFICATION.md` | Tabel: regel → waarde → URL → quote → test |
| `test/*.test.js` | `node:test` suite |

## Tests draaien

Vereist Node.js 18+ (ingebouwde `node:test`).

```bash
cd box3-calculator
node --test test/*.test.js
```

Of vanaf de map:

```bash
node test.js
```

Elke regeltest citeert in een comment de primaire URL, het artikel/paragraaf en een korte quote. Officiële rekenvoorbeelden (Belastingdienst, MvT) zijn als asserts opgenomen. Zie `VERIFICATION.md` voor de verificatietabel en FLAG’s.

## Standaardvergelijking (eerlijk)

- Beleggen start op **aanhouden tot het einde** (latente heffing meegerekend).
- Rendementstappen van **1%**, default **7%**.
- Resultaat: één verticale bankafschrift-lijst (start → na groei → belasting − → eind), plus quitte-rendement voor forfait / tegenbewijs / voorstel.
- Grafiek en jaar-tabel staan ingeklapt.
