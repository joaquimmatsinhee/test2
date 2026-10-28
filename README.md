# AllContent — Git → Cloudflare Pages

## Por que via Git?

O **upload manual** do Cloudflare **não** aceita Pages Functions.
Com **repositório Git** conectado, as Functions em `/functions` funcionam
e o celular consegue carregar os vídeos do Neon.

## Passo a passo

### 1. Subir no GitHub

```bash
cd allcontent-cf-git
git init
git add .
git commit -m "AllContent loja + API Neon"
# crie um repo vazio no GitHub, depois:
git branch -M main
git remote add origin https://github.com/SEU_USER/allcontent.git
git push -u origin main
```

### 2. Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create** → **Pages** → **Connect to Git**
3. Escolha o repositório `allcontent`
4. Build settings:
   - **Framework preset:** None
   - **Build command:** (deixe vazio) ou `npm install`
   - **Build output directory:** `/` (raiz)
5. **Environment variables** (Settings do projeto):
   - `NEON_DATABASE_URL` = sua connection string do Neon
6. **Save and Deploy**

### 3. Testar no celular

Depois do deploy:

- `https://seu-projeto.pages.dev/api/videos` → JSON com vídeos
- `https://seu-projeto.pages.dev/` → loja

Se `/api/videos` funcionar, a loja no celular também funciona.

## Estrutura

```
/
  index.html, app.js, styles.css, assets/
  functions/api/videos.js    → GET /api/videos
  functions/api/settings.js  → GET /api/settings
  package.json               → @neondatabase/serverless
```
