/**
 * AllContent — pure HTML / CSS / JS with Neon PostgreSQL
 *
 * Estratégia de conexão (ordem):
 * 1) /api/videos e /api/settings  → Cloudflare Pages Function (melhor no celular)
 * 2) Neon serverless direto no browser (fallback desktop / local)
 */

const NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_my9MGUxd5rNc@ep-broad-lake-b526gxc3-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

/**
 * URL do Cloudflare Worker (API).
 * 1) Faça deploy do worker em worker/ (veja README)
 * 2) Cole aqui a URL que o Cloudflare der, ex:
 *    https://allcontent-api.seu-usuario.workers.dev
 * Deixe '' para tentar /api no mesmo domínio primeiro.
 */
const API_BASE = ''; // same-origin /api via Node server // ex: 'https://allcontent-api.xxx.workers.dev'

/** Tenta carregar o driver Neon de vários CDNs (rede móvel às vezes bloqueia um) */
async function loadNeonDriver() {
  const urls = [
    'https://cdn.jsdelivr.net/npm/@neondatabase/serverless@1.0.1/+esm',
    'https://esm.sh/@neondatabase/serverless@1.0.1',
    'https://unpkg.com/@neondatabase/serverless@1.0.1?module',
  ];
  let lastErr;
  for (const url of urls) {
    try {
      const mod = await import(url);
      if (mod && mod.neon) return mod.neon;
    } catch (e) {
      lastErr = e;
      console.warn('Neon CDN falhou:', url, e);
    }
  }
  throw lastErr || new Error('Não foi possível carregar o driver Neon');
}

let _sql = null;
async function getSql() {
  if (_sql) return _sql;
  const neon = await loadNeonDriver();
  _sql = neon(NEON_DATABASE_URL);
  return _sql;
}

const DEFAULT_TELEGRAM_URL = 'https://t.me/receive_new_folders';
const ITEMS_PER_PAGE = 20;

const COVER_PRESETS = ['cover-studio', 'cover-travel', 'cover-design'];

const PAYMENT_LINKS = {
  5: 'https://buy.trywalled.com/e3de20f7-4524-4fc2-961b-2bbbe2a60db3',
  10: 'https://buy.trywalled.com/69833d0b-57a3-43e7-9576-976eb3f34dcf',
  15: 'https://buy.trywalled.com/2856bdd4-d44e-440a-8a4a-4b7b632e85d0',
  20: 'https://buy.trywalled.com/b9209760-8569-45c6-8f44-09af1235c19b',
  25: 'https://buy.trywalled.com/7ce59b86-b3a3-4ad6-8984-176b9b677213',
  30: 'https://buy.trywalled.com/55299ec9-7dcb-43ac-9c87-acd5fdfd2271',
  35: 'https://buy.trywalled.com/44199923-553b-40a7-bb85-1bceb7a02f92',
  40: 'https://buy.trywalled.com/60a23155-026d-43ff-8bcd-83f8e0034538',
  45: 'https://buy.trywalled.com/1e3c5a1d-ca1c-4437-a257-74167f21ce97',
  50: 'https://buy.trywalled.com/9ba3f1fb-6bda-4a60-9eb2-c0a7a405b10b',
  55: 'https://buy.trywalled.com/e0aebb64-a4bf-480f-ba04-f33e39c1e7e3',
  60: 'https://buy.trywalled.com/ffa32b02-dc27-4639-b1b3-5e315d6b19d2',
  65: 'https://buy.trywalled.com/fddbc139-f727-40e5-8445-de49812365df',
  70: 'https://buy.trywalled.com/1e54a641-ed8b-4202-b161-3769b53a2e3c',
  75: 'https://buy.trywalled.com/36800a74-c434-4c04-ac38-06977e4255ba',
  80: 'https://buy.trywalled.com/419c0579-fe7a-4fd4-9469-6a1da1ba17d9',
  85: 'https://buy.trywalled.com/f208e880-c2b3-4b38-b33c-ae55e73ca8e3',
  90: 'https://buy.trywalled.com/60b0373f-1432-417b-95ef-0e08a4daeefd',
  95: 'https://buy.trywalled.com/8dd75405-f29e-45b3-ba5c-636a8a3d9c18',
  100: 'https://buy.trywalled.com/7d98c331-2a1d-4a4d-99f1-0b2e74d7bbf0',
  105: 'https://buy.trywalled.com/12fc50bd-d63a-4443-a9ea-09f77c3062f6',
  110: 'https://buy.trywalled.com/0f5412f6-6f0c-468b-b2a8-60ef68a93174',
  115: 'https://buy.trywalled.com/bd64506d-d831-46c1-9b54-dc84a32c3bf5',
  120: 'https://buy.trywalled.com/a1a748a6-33b8-4d1c-807a-ea0aa5876205',
  125: 'https://buy.trywalled.com/dc4be313-57fd-4850-b78d-6287f518b196',
  130: 'https://buy.trywalled.com/887060e8-391d-479f-88b6-d3b0f98890bb',
  135: 'https://buy.trywalled.com/238ed05b-0402-4bd6-886e-8e92a1e42e04',
  140: 'https://buy.trywalled.com/0c3442a9-1ae2-4414-8d22-448ecb6c743b',
  145: 'https://buy.trywalled.com/50ac9692-b6c6-4654-9d0b-7f3e8a1c2d4e',
  150: 'https://buy.trywalled.com/a2b3c4d5-e6f7-8901-2345-6789abcdef01',
  155: 'https://buy.trywalled.com/b3c4d5e6-f789-0123-4567-89abcdef0123',
  160: 'https://buy.trywalled.com/c4d5e6f7-8901-2345-6789-abcdef012345',
  165: 'https://buy.trywalled.com/d5e6f789-0123-4567-89ab-cdef01234567',
  170: 'https://buy.trywalled.com/e6f78901-2345-6789-abcd-ef0123456789',
  175: 'https://buy.trywalled.com/f7890123-4567-89ab-cdef-0123456789ab',
  180: 'https://buy.trywalled.com/89012345-6789-abcd-ef01-23456789abcd',
  185: 'https://buy.trywalled.com/01234567-89ab-cdef-0123-456789abcdef',
  190: 'https://buy.trywalled.com/81284c8f-79c2-4eca-8c56-56a342d4995b',
  195: 'https://buy.trywalled.com/a09a3714-04bb-4dd9-9121-762d9ee147c7',
  200: 'https://buy.trywalled.com/a4f8ccde-a8df-4eb0-a870-47ce74ee694b',
};

function getPaymentUrlForPrice(rawPrice) {
  const num = typeof rawPrice === 'string' ? parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) : Number(rawPrice);
  if (isNaN(num) || num <= 5) return PAYMENT_LINKS[5];
  if (num >= 200) return PAYMENT_LINKS[200];
  const rounded = Math.round(num / 5) * 5;
  const clamped = Math.max(5, Math.min(200, rounded));
  return PAYMENT_LINKS[clamped] || PAYMENT_LINKS[5];
}

const DEFAULT_SAMPLE_VIDEOS = [
  {
    id: 'sample-1',
    title: 'Studio Sessions',
    description: 'Exclusive original studio recording collection and creator notes.',
    price: 5,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: null,
    duration: '08:24',
    category: 'STUDIO ORIGINALS',
    views_count: 6300,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    title: 'Travel Stories',
    description: 'Field notes, travel chronicles and cinematic landscapes.',
    price: 10,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail_url: null,
    duration: '12:16',
    category: 'FIELD NOTES · VOL. 04',
    views_count: 7700,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    title: 'Design Archive',
    description: 'High resolution digital archive, project files and motion recordings.',
    price: 15,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail_url: null,
    duration: '12 projects',
    category: 'THE CREATIVE ARCHIVE',
    views_count: 2900,
    created_at: new Date().toISOString(),
  },
];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getSafeSessionStorage(key) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch (err) {
    console.warn('Storage read unavailable:', err);
  }
  return null;
}

function setSafeSessionStorage(key, value) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn('Storage write unavailable:', err);
  }
}


function mapVideoRow(r) {
  return {
    ...r,
    price: Number(r.price),
    views_count: r.views_count != null ? Number(r.views_count) : 0,
  };
}

/** 1) API same-origin (Cloudflare Function) — funciona no celular */
function apiUrl(path) {
  const base = (API_BASE || '').replace(/\/$/, '');
  if (base) return base + path;
  return path; // same-origin /api/...
}

async function fetchVideosFromApi() {
  const urls = [];
  if (API_BASE) urls.push(apiUrl('/api/videos'));
  urls.push('/api/videos'); // tenta same-origin também
  let lastErr;
  for (const u of urls) {
    try {
      const res = await fetch(u, { credentials: 'omit', cache: 'no-store' });
      if (!res.ok) throw new Error('API videos HTTP ' + res.status + ' @ ' + u);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'API videos failed');
      return (data.videos || []).map(mapVideoRow);
    } catch (e) {
      lastErr = e;
      console.warn('fetchVideosFromApi falhou em', u, e);
    }
  }
  throw lastErr || new Error('API videos unavailable');
}

async function fetchSettingsFromApi() {
  const urls = [];
  if (API_BASE) urls.push(apiUrl('/api/settings'));
  urls.push('/api/settings');
  let lastErr;
  for (const u of urls) {
    try {
      const res = await fetch(u, { credentials: 'omit', cache: 'no-store' });
      if (!res.ok) throw new Error('API settings HTTP ' + res.status + ' @ ' + u);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'API settings failed');
      return data.settings || null;
    } catch (e) {
      lastErr = e;
      console.warn('fetchSettingsFromApi falhou em', u, e);
    }
  }
  throw lastErr || new Error('API settings unavailable');
}

/** 2) Neon direto no browser (fallback desktop/local) */
async function fetchVideosFromNeonDirect() {
  const sql = await getSql();
  const rows = await sql`
    SELECT
      id, title, description, price, video_url, thumbnail_url,
      duration, category, views_count, created_by, is_published, created_at
    FROM videos
    WHERE is_published = true OR is_published IS NULL
    ORDER BY created_at DESC
  `;
  return rows.map(mapVideoRow);
}

async function fetchAppSettingsFromNeonDirect() {
  const sql = await getSql();
  const rows = await sql`
    SELECT id, telegram_group_url, updated_at
    FROM app_settings
    WHERE id = 'default'
    LIMIT 1
  `;
  if (rows && rows.length > 0) return rows[0];
  const anyRow = await sql`
    SELECT id, telegram_group_url, updated_at
    FROM app_settings
    LIMIT 1
  `;
  if (anyRow && anyRow.length > 0) return anyRow[0];
  return null;
}

async function fetchVideosFromNeon() {
  // Com o servidor Node, /api/videos sempre está no mesmo domínio (PC e celular).
  try {
    return await fetchVideosFromApi();
  } catch (apiErr) {
    console.warn('API falhou, tentando Neon direto (só desktop/local):', apiErr);
  }
  try {
    return await fetchVideosFromNeonDirect();
  } catch (e) {
    throw apiErr || e;
  }
}

async function fetchAppSettingsFromNeon() {
  try {
    return await fetchSettingsFromApi();
  } catch (apiErr) {
    console.warn('API settings falhou:', apiErr);
  }
  try {
    return await fetchAppSettingsFromNeonDirect();
  } catch (e) {
    return null;
  }
}

let videos = [];
let searchQuery = '';
let currentPage = 1;
let telegramUrl = DEFAULT_TELEGRAM_URL;
let isAccessDenied = false;
let isLoading = true;
let loadError = null;
let activePreviewVideo = null;
let postPaymentItem = null;
let toastTimeout = null;

function formatViews(views) {
  if (!views) return '0 views';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K views';
  return views + ' views';
}

function formatCoverTitle(title) {
  const parts = String(title || '').trim().split(' ');
  if (parts.length <= 1) return [title || '', ''];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
}

function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('visible');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('visible'), 3500);
}

function getTelegramReceiptLink(item) {
  const msg = 'Hello! I just completed the payment of ' + item.priceFormatted + ' for "' + item.title + '". Here is my proof of payment:';
  const separator = telegramUrl.includes('?') ? '&' : '?';
  return telegramUrl + separator + 'text=' + encodeURIComponent(msg);
}

function handleDirectPayment(title, rawPrice) {
  const paymentUrl = getPaymentUrlForPrice(rawPrice);
  const priceFormatted = '$' + Number(rawPrice).toFixed(2);
  try {
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  } catch (e) {
    console.warn('Could not open tab:', e);
  }
  postPaymentItem = { title, price: rawPrice, priceFormatted, paymentUrl };
  openCheckoutModal();
  showToast('Opening checkout (' + priceFormatted + '). Send receipt on Telegram after paying!');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadData() {
  isLoading = true;
  loadError = null;
  render();

  try {
    const [neonVideos, settings] = await Promise.all([
      fetchVideosFromNeon(),
      fetchAppSettingsFromNeon().catch(() => null),
    ]);

    if (settings && settings.telegram_group_url && settings.telegram_group_url.trim()) {
      telegramUrl = settings.telegram_group_url.trim();
    }

    if (neonVideos && neonVideos.length > 0) {
      videos = shuffleArray(neonVideos);
    } else {
      videos = shuffleArray(DEFAULT_SAMPLE_VIDEOS);
      showToast('No published videos in database — showing samples.');
    }
  } catch (err) {
    console.warn('Neon error:', err);
    var msg = err && err.message ? err.message : String(err);
    // Mensagem mais clara no celular (Failed to fetch)
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      msg = 'Falha de rede ao conectar no banco (comum no 3G/4G). '
        + 'No Cloudflare, publique as Functions em /functions/api. Detalhe: ' + msg;
    }
    loadError = msg;
    videos = shuffleArray(DEFAULT_SAMPLE_VIDEOS);
    showToast('Sem conexão com o banco — mostrando exemplos.');
  } finally {
    isLoading = false;
    render();
  }
}

function render() {
  const app = document.getElementById('app');

  if (isAccessDenied) {
    app.innerHTML =
      '<div class="access-denied-box"><h2>Access Restricted</h2><p>You must be 18 years or older to access AllContent content.</p><button class="button button-primary" type="button" id="retry-age">Verify Age Again</button></div>';
    document.getElementById('retry-age').addEventListener('click', function () {
      isAccessDenied = false;
      document.getElementById('age-modal').hidden = false;
    });
    return;
  }

  const filtered = videos.filter(function (v) {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (v.title || '').toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q) ||
      (v.category || '').toLowerCase().includes(q) ||
      String(v.price || '').includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  var cardsHtml = '';
  if (isLoading) {
    cardsHtml =
      '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">Loading collections from Neon database...</div>';
  } else {
    cardsHtml = pageItems
      .map(function (video, index) {
        const coverStyle = COVER_PRESETS[index % COVER_PRESETS.length];
        const titles = formatCoverTitle(video.title);
        const titleL1 = titles[0];
        const titleL2 = titles[1];
        const priceNum = Number(video.price);
        const priceText = '$' + priceNum.toFixed(2);
        const rawPrice = '$' + priceNum;
        const dateStr = video.created_at
          ? new Date(video.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
          : '';
        const hasThumb = Boolean(video.thumbnail_url);
        const thumbSrc = hasThumb ? escapeHtml(video.thumbnail_url) : '';

        return (
          '<article class="product-card" data-id="' +
          escapeHtml(video.id) +
          '"><div class="cover ' +
          (hasThumb ? '' : coverStyle) +
          '" role="img" aria-label="' +
          escapeHtml(video.title) +
          '" style="position:relative">' +
          (hasThumb
            ? '<img src="' +
              thumbSrc +
              '" alt="' +
              escapeHtml(video.title) +
              '" class="cover-img-bg" loading="lazy" /><div class="cover-overlay"></div>'
            : '') +
          '<span class="cover-kicker">' +
          escapeHtml(video.category || 'STUDIO COLLECTION') +
          '</span><span class="cover-title">' +
          escapeHtml(titleL1) +
          (titleL2 ? '<br>' + escapeHtml(titleL2) : '') +
          '</span><span class="price-badge">' +
          priceText +
          '</span><span class="duration-badge">◷ ' +
          escapeHtml(video.duration || '05:00') +
          '</span></div><div class="card-body"><h3>' +
          escapeHtml(video.title) +
          '</h3><div class="card-meta"><span>◉ &nbsp;' +
          formatViews(video.views_count) +
          '</span><span>' +
          dateStr +
          '</span></div><div class="card-actions"><div class="card-actions-row"><button class="button button-primary card-btn-preview" type="button" data-action="preview" data-id="' +
          escapeHtml(video.id) +
          '"><span class="btn-icon" aria-hidden="true">◉</span><span>Preview</span></button><a class="button button-outline card-btn-telegram" href="' +
          escapeHtml(telegramUrl) +
          '" target="_blank" rel="noopener noreferrer"><span class="telegram-icon" aria-hidden="true">➤</span><span>Telegram</span></a></div><button class="button button-primary card-btn-pay" type="button" data-action="pay" data-id="' +
          escapeHtml(video.id) +
          '" data-price="' +
          priceNum +
          '"><span class="btn-icon" aria-hidden="true">▣</span><span>Pay ' +
          rawPrice +
          '</span></button></div></div></article>'
        );
      })
      .join('');
  }

  if (loadError && !isLoading) {
    cardsHtml =
      '<div style="grid-column:1/-1;padding:16px 20px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:var(--ink);font-size:13px;margin-bottom:12px"><strong style="color:#dc2626">⚠️ Neon connection note</strong><p style="margin:6px 0 0;color:var(--muted)">' +
      escapeHtml(loadError) +
      '</p><button type="button" class="button button-primary" id="retry-neon" style="margin-top:10px;padding:6px 14px;font-size:12px">🔄 Retry</button></div>' +
      cardsHtml;
  }

  var paginationHtml = '';
  if (!isLoading && filtered.length > 0) {
    var pageBtns = '';
    if (totalPages > 1) {
      pageBtns =
        '<div class="pagination-controls"><button class="pagination-btn" type="button" data-page="prev"' +
        (currentPage === 1 ? ' disabled' : '') +
        '>← Prev</button>';
      for (var p = 1; p <= totalPages; p++) {
        pageBtns +=
          '<button class="pagination-btn' +
          (p === currentPage ? ' active' : '') +
          '" type="button" data-page="' +
          p +
          '">' +
          p +
          '</button>';
      }
      pageBtns +=
        '<button class="pagination-btn" type="button" data-page="next"' +
        (currentPage === totalPages ? ' disabled' : '') +
        '>Next →</button></div>';
    }
    paginationHtml =
      '<div class="pagination-container"><div class="pagination-info">Showing <strong>' +
      (startIndex + 1) +
      '</strong>–<strong>' +
      Math.min(startIndex + ITEMS_PER_PAGE, filtered.length) +
      '</strong> of <strong>' +
      filtered.length +
      '</strong> videos (20 per page)</div>' +
      pageBtns +
      '</div>';
  }

  app.innerHTML =
    '<header class="site-header"><nav class="navigation" aria-label="Main navigation">' +
    '<a class="brand brand-desktop-only" href="#home" aria-label="AllContent home"><span class="brand-mark" aria-hidden="true">A</span><span class="brand-name">all<span>content</span></span></a>' +
    '<div class="nav-links"><a class="nav-link active" href="#catalog">All Content</a><span class="age-tag">18+</span><a class="nav-link" href="#home">Home</a><a class="nav-link" href="#videos">Videos</a>' +
    '<a class="nav-link nav-link-desktop" href="' +
    escapeHtml(telegramUrl) +
    '" target="_blank" rel="noopener noreferrer" title="Join our Telegram">Telegram</a></div>' +
    '<div class="nav-actions"><button class="icon-button" id="search-toggle" type="button" aria-label="Search" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></button>' +
    '<button class="icon-button" id="theme-toggle" type="button" aria-label="Switch color theme"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.7 8.7 0 1 0 20.2 15.1Z"/><path d="m16.7 2 .6 2.1L19.4 5l-2.1.7-.6 2.1-.7-2.1-2.1-.7 2.1-.9.7-2.1Z"/></svg></button></div></nav>' +
    '<form class="search-bar" id="search-form" role="search" hidden><label class="visually-hidden" for="search-input">Search collections</label>' +
    '<input id="search-input" type="search" placeholder="Search collections and videos" value="' +
    escapeHtml(searchQuery) +
    '" /><button class="search-submit" type="submit">Search</button></form></header>' +
    '<main id="home"><section class="offer-panel" aria-labelledby="offer-title"><div class="offer-copy"><p class="eyebrow">A little more to explore</p>' +
    '<h1 id="offer-title"><span aria-hidden="true">✦</span> Special Offer — All Content <span class="offer-price">$200</span></h1>' +
    '<p class="offer-description">Complete collection • Instant delivery • Secure payment</p><div class="offer-actions">' +
    '<a class="button button-outline" href="' +
    escapeHtml(telegramUrl) +
    '" target="_blank" rel="noopener noreferrer"><span class="telegram-icon" aria-hidden="true">➤</span> Telegram</a>' +
    '<button class="button button-primary" type="button" id="offer-pay">Pay $200 Now</button></div></div>' +
    '<ul class="offer-benefits"><li><span aria-hidden="true">✓</span> Full access</li><li><span aria-hidden="true">✓</span> Auto delivery</li><li><span aria-hidden="true">✓</span> One-time payment</li></ul></section>' +
    '<div class="section-divider" aria-hidden="true"><span>↓</span></div>' +
    '<section class="catalog-section" id="catalog" aria-labelledby="catalog-title"><div class="catalog-intro"><p class="eyebrow">Curated for you</p><h2 id="catalog-title">Available Videos</h2>' +
    '<div class="stats" aria-label="Store statistics"><span>From <strong>$5.00</strong></span><span><strong>1,197+</strong> Happy Customers</span><span><strong>4.6/5</strong> Rating</span>' +
    '<span><span class="live-dot"></span><strong>7</strong> online</span><span>Up to <strong>$200.00</strong></span><span>Avg: <strong>$79.82</strong></span></div>' +
    '<a class="button button-outline view-all" href="#videos">View All Videos <span aria-hidden="true">→</span></a></div>' +
    '<div class="product-grid" id="videos" aria-live="polite">' +
    cardsHtml +
    paginationHtml +
    '</div>' +
    '<p class="empty-state" id="empty-state"' +
    (!isLoading && filtered.length === 0 ? '' : ' hidden') +
    '>No collections match your search. Try another keyword.</p></section></main>' +
    '<footer class="site-footer" id="community"><a class="brand footer-brand" href="#home"><span class="brand-mark" aria-hidden="true">A</span><span class="brand-name">all<span>content</span></span></a>' +
    '<p>Original work from independent creators. Send proof to <a href="' +
    escapeHtml(telegramUrl) +
    '" target="_blank" rel="noopener noreferrer" style="color: var(--blue); font-weight: 700;"> Telegram Link</a>.</p>' +
    '<span>© 2026 AllContent · Neon connected</span></footer>';

  bindEvents();
}

function bindEvents() {
  var searchToggle = document.getElementById('search-toggle');
  var searchForm = document.getElementById('search-form');
  var searchInput = document.getElementById('search-input');
  var themeToggle = document.getElementById('theme-toggle');
  var offerPay = document.getElementById('offer-pay');
  var retryNeon = document.getElementById('retry-neon');

  if (retryNeon) {
    retryNeon.addEventListener('click', function () {
      loadData();
    });
  }

  if (searchToggle && searchForm) {
    searchToggle.addEventListener('click', function () {
      var open = searchForm.hidden;
      searchForm.hidden = !open;
      searchToggle.setAttribute('aria-expanded', String(open));
      if (open) setTimeout(function () {
        if (searchInput) searchInput.focus();
      }, 50);
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      searchQuery = searchInput ? searchInput.value : '';
      currentPage = 1;
      render();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchQuery = searchInput.value;
      currentPage = 1;
      clearTimeout(searchInput._t);
      searchInput._t = setTimeout(render, 200);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      document.body.classList.toggle('dark');
    });
  }

  if (offerPay) {
    offerPay.addEventListener('click', function () {
      handleDirectPayment('Special Offer — All Content', 200);
    });
  }

  document.querySelectorAll('[data-action="preview"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-id');
      var video = videos.find(function (v) {
        return String(v.id) === String(id);
      });
      if (video) openPreview(video);
    });
  });

  document.querySelectorAll('[data-action="pay"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-id');
      var price = Number(btn.getAttribute('data-price'));
      var video = videos.find(function (v) {
        return String(v.id) === String(id);
      });
      if (video) handleDirectPayment(video.title, price);
    });
  });

  document.querySelectorAll('.pagination-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var page = btn.getAttribute('data-page');
      if (page === 'prev') currentPage = Math.max(1, currentPage - 1);
      else if (page === 'next') currentPage = currentPage + 1;
      else currentPage = Number(page);
      render();
      var el = document.getElementById('videos');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function openPreview(video) {
  activePreviewVideo = video;
  var modal = document.getElementById('preview-modal');
  var vid = document.getElementById('preview-video');
  document.getElementById('preview-title').textContent = video.title;
  document.getElementById('preview-category').textContent = video.category || 'STUDIO';
  document.getElementById('preview-duration').textContent = video.duration || '';
  document.getElementById('preview-views').textContent = formatViews(video.views_count);
  document.getElementById('preview-desc').textContent = video.description || '';
  document.getElementById('preview-telegram').href = telegramUrl;
  vid.src = video.video_url || '';
  if (video.thumbnail_url) vid.poster = video.thumbnail_url;
  modal.hidden = false;
  document.getElementById('preview-pay').onclick = function () {
    closePreview();
    handleDirectPayment(video.title, Number(video.price));
  };
}

function closePreview() {
  var modal = document.getElementById('preview-modal');
  var vid = document.getElementById('preview-video');
  vid.pause();
  vid.removeAttribute('src');
  vid.removeAttribute('poster');
  vid.load();
  modal.hidden = true;
  activePreviewVideo = null;
}

function openCheckoutModal() {
  if (!postPaymentItem) return;
  document.getElementById('checkout-item-title').textContent = postPaymentItem.title;
  document.getElementById('checkout-item-price').textContent = postPaymentItem.priceFormatted;
  document.getElementById('checkout-telegram-link').href = getTelegramReceiptLink(postPaymentItem);
  var reopen = document.getElementById('checkout-reopen');
  if (reopen) {
    reopen.textContent = 'Reopen Payment Link (' + postPaymentItem.priceFormatted + ')';
    reopen.onclick = function () {
      window.open(postPaymentItem.paymentUrl, '_blank', 'noopener,noreferrer');
    };
  }
  document.getElementById('checkout-modal').hidden = false;
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal').hidden = true;
  postPaymentItem = null;
}

function init() {
  var ageVerified = getSafeSessionStorage('studioVaultAgeVerified') === 'yes';
  var ageModal = document.getElementById('age-modal');

  document.getElementById('age-confirm').addEventListener('click', function () {
    setSafeSessionStorage('studioVaultAgeVerified', 'yes');
    ageModal.hidden = true;
    isAccessDenied = false;
    loadData();
  });

  document.getElementById('age-decline').addEventListener('click', function () {
    ageModal.hidden = true;
    isAccessDenied = true;
    showToast('You must be 18 or older to enter this website.');
    render();
  });

  document.getElementById('preview-close').addEventListener('click', closePreview);
  document.getElementById('preview-modal').addEventListener('click', function (e) {
    if (e.target.id === 'preview-modal') closePreview();
  });

  document.getElementById('checkout-close').addEventListener('click', closeCheckoutModal);
  var closeBtn = document.getElementById('checkout-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeCheckoutModal);
  document.getElementById('checkout-modal').addEventListener('click', function (e) {
    if (e.target.id === 'checkout-modal') closeCheckoutModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!document.getElementById('preview-modal').hidden) closePreview();
      if (!document.getElementById('checkout-modal').hidden) closeCheckoutModal();
    }
  });

  if (!ageVerified) {
    ageModal.hidden = false;
  } else {
    loadData();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
