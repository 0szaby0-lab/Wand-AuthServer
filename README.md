# Wand Enhancer Auth Server

Ez a szerver engedélyezi, hogy a Wand Enhancer alkalmazásod elinduljon.

## Helyi futtatás (Localhost)
1. Nyiss egy terminált ebben a mappában.
2. Futtasd: `npm install`
3. Hozz létre egy `.env` fájlt (opcionális), amiben megadod, hogy ki futtathatja a programot:
   ```
   ALLOWED_USERS=Szaby-PC\Szaby,MásikGép\MásikUser
   ```
4. Indítsd el a szervert: `node server.js`

## Feltöltés Render.com-ra
1. Csinálj egy új Web Service-t a Render-en.
2. Válaszd a GitHub repository-dat, vagy töltsd fel a fájlokat.
3. A **Build Command** legyen: `npm install`
4. A **Start Command** legyen: `node server.js`
5. A **Environment Variables** (Környezeti változók) résznél vegyél fel egy ilyet:
   - Key: `ALLOWED_USERS`
   - Value: `GépNév\FelhasználóNév` (Ezt a C# program fogja küldeni, teszteld le, mit ír ki a szerver logjába, ha megpróbálsz bejelentkezni!)
6. Másold ki a Render által adott URL-t (pl. `https://valami.onrender.com`), és írd be a C# `AuthService.cs` fájlba!
