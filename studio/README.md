# Administrace akcí – MŠ Želatovice (Sanity Studio)

Akce v kalendáři na webu se spravují v Sanity:
**https://mszelatovice.sanity.studio**

Web (`kalendar-akci.html` a ukázka „Nejbližší akce“ na úvodní stránce)
si akce načítá přímo ze Sanity, takže po kliknutí na **Publish**
se změna na webu objeví do minuty. Web není potřeba znovu nasazovat.

## Jak přidat akci
1. Otevřít administraci, vlevo **Akce – letošní rok** a vybrat měsíc.
2. Kliknout na **+**, vyplnit název, případně datum a poznámku.
3. Kliknout na **Publish**.

Na webu se zobrazuje aktuální školní rok (od září do srpna).
Pokud v něm zatím žádná akce není, ukáže se poslední rok, který v Sanity je.

## První nastavení (jednorázově, na počítači s Node.js 22.12+)
```
cd studio
npm install
npx sanity login            # přihlášení k účtu Sanity
npm run import-akce         # nahraje 40 akcí z dosavadního kalendáře
npm run deploy              # zveřejní administraci na mszelatovice.sanity.studio
```

Lokální spuštění administrace: `npm run dev` → http://localhost:3333

## Přístup pro učitelky
sanity.io/manage → projekt → **Members** → **Invite** (role Editor/Administrator).
