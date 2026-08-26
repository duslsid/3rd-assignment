/* =========================================================
   Supabase 연결 및 데이터 조회 모듈
   ========================================================= */

/* 접속 정보는 저장소에 올리지 않는다.
   - 로컬 : js/config.js (git 제외 대상, js/config.sample.js 참고)
   - 배포 : GitHub Actions 가 저장소 Secrets 로 js/config.js 를 생성한다 */
const SUPABASE_CONFIG = window.SUPABASE_CONFIG || {};

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
  console.error('[설정 오류] js/config.js 가 없습니다. js/config.sample.js 를 복사해 값을 채워 주세요.');
}

/* supabase-js UMD 전역(window.supabase)에서 클라이언트를 생성한다 */
const sb = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

/* ---------------------------------------------------------
   폴더명 파싱 : 상위메뉴_하위메뉴_상품명_가격_판매순위
   조각이 5개가 아니면 콘솔에 오류를 출력하고 건너뛴다.
   --------------------------------------------------------- */
function parseFolderName(folderName) {
  const parts = String(folderName).split('_').map((s) => s.trim());

  if (parts.length !== 5) {
    console.error(
      '[폴더명 오류] "' + folderName + '" 은 언더바 기준 5조각이 아니므로 건너뜁니다. (조각 ' + parts.length + '개)'
    );
    return null;
  }

  const price = Number(parts[3]);
  const rank = Number(String(parts[4]).replace('판매순위', ''));

  if (!Number.isFinite(price) || !Number.isFinite(rank)) {
    console.error('[폴더명 오류] "' + folderName + '" 의 가격 또는 판매순위를 숫자로 읽을 수 없어 건너뜁니다.');
    return null;
  }

  return {
    category: parts[0] === '엑세서리' ? '액세서리' : parts[0], // 표기 오타 보정
    subcategory: parts[1],
    name: parts[2],
    price: price,
    rank: rank,
  };
}

/* 폴더명 파싱 결과를 상품 레코드에 반영한 뒤 유효한 상품만 돌려준다 */
function normalizeProducts(rows) {
  const list = [];

  (rows || []).forEach((row) => {
    const parsed = parseFolderName(row.folder_name);
    if (!parsed) return;
    list.push(Object.assign({}, row, parsed));
  });

  return list;
}

/* ---------------------------------------------------------
   조회 함수
   --------------------------------------------------------- */

/* 베스트 상품 : 판매순위 1~10 (99는 순위 없음이므로 제외) */
async function fetchBestProducts() {
  const { data, error } = await sb
    .from('products')
    .select('slug, folder_name, product_images(url, is_main)')
    .gte('rank', 1)
    .lte('rank', 10)
    .order('rank', { ascending: true });

  if (error) {
    console.error('[베스트 상품 조회 실패]', error.message);
    return [];
  }

  return normalizeProducts(data).map((p) => {
    const main = (p.product_images || []).find((i) => i.is_main);
    return Object.assign({}, p, { image: main ? main.url : '' });
  });
}

/* 카테고리별 상품 (하위 메뉴 페이지) */
async function fetchProductsByCategory(category, subcategory) {
  const { data, error } = await sb
    .from('products')
    .select('slug, folder_name, product_images(url, is_main)')
    .order('rank', { ascending: true });

  if (error) {
    console.error('[상품 목록 조회 실패]', error.message);
    return [];
  }

  return normalizeProducts(data)
    .filter((p) => {
      if (category && p.category !== category) return false;
      if (subcategory && p.subcategory !== subcategory) return false;
      return true;
    })
    .map((p) => {
      const main = (p.product_images || []).find((i) => i.is_main);
      return Object.assign({}, p, { image: main ? main.url : '' });
    });
}

/* 상품 1건 상세 */
async function fetchProduct(slug) {
  const { data, error } = await sb
    .from('products')
    .select('slug, folder_name, description, size_case, product_images(url, is_main, sort_order)')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('[상품 상세 조회 실패]', error.message);
    return null;
  }

  const parsed = parseFolderName(data.folder_name);
  if (!parsed) return null;

  const images = (data.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order);

  return Object.assign({}, data, parsed, { images: images });
}

/* 전체 상품의 메인 이미지 (상세 페이지 하단 랜덤 추천용) */
async function fetchAllMainImages() {
  const { data, error } = await sb
    .from('products')
    .select('slug, folder_name, product_images(url, is_main)');

  if (error) {
    console.error('[추천 상품 조회 실패]', error.message);
    return [];
  }

  return normalizeProducts(data)
    .map((p) => {
      const main = (p.product_images || []).find((i) => i.is_main);
      return { slug: p.slug, name: p.name, image: main ? main.url : '' };
    })
    .filter((p) => p.image);
}

/* 매거진 기사 목록 */
async function fetchArticles() {
  const { data, error } = await sb
    .from('articles')
    .select('slug, title, subtitle, body, image_url, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[기사 목록 조회 실패]', error.message);
    return [];
  }

  return data;
}

/* 매거진 기사 1건 */
async function fetchArticle(slug) {
  const { data, error } = await sb
    .from('articles')
    .select('slug, title, subtitle, body, image_url')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('[기사 조회 실패]', error.message);
    return null;
  }

  return data;
}

/* 사이트 공용 리소스 (로고 / 배너 / 사이즈 가이드 / 상품정보제공고시) */
async function fetchSiteAssets() {
  const { data, error } = await sb
    .from('site_assets')
    .select('kind, key, value, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[공용 리소스 조회 실패]', error.message);
    return { logo: '', banners: [], sizeGuide: {}, notices: {} };
  }

  const result = { logo: '', banners: [], sizeGuide: {}, notices: {} };

  data.forEach((row) => {
    if (row.kind === 'logo') result.logo = row.value;
    else if (row.kind === 'banner') result.banners.push(row.value);
    else if (row.kind === 'size_guide') result.sizeGuide[row.key] = row.value;
    else if (row.kind === 'notice') result.notices[row.key] = row.value;
  });

  return result;
}
