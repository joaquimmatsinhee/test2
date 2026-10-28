# AllContent (Node.js + Neon)

Site + API no **mesmo servidor**. O celular chama `/api/videos` no seu domínio;
o Node consulta o Neon. Não depende de CDN nem de CORS no browser.

## Rodar local

```bash
cd allcontent-node
npm install
npm start
# abra http://localhost:3000
```

## Deploy no Render (recomendado, grátis)

1. Crie conta em https://render.com
2. **New → Web Service**
3. Conecte o GitHub **ou** faça upload do código
4. Configuração:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. Environment variables (opcional):
   - `DATABASE_URL` = connection string do Neon
6. Deploy → use a URL `https://seu-app.onrender.com` no celular

## Deploy no Railway

1. https://railway.app → New Project → Deploy from folder/GitHub
2. Add variable `DATABASE_URL` se quiser
3. Railway detecta Node e sobe com `npm start`

## Deploy no VPS / qualquer host Node

```bash
npm install --production
PORT=3000 npm start
# ou use pm2: pm2 start server.js --name allcontent
```

## Endpoints

- `GET /api/videos` — vídeos publicados
- `GET /api/settings` — Telegram etc.
- `GET /api/health` — status
