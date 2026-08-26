// data.json 을 Supabase PostgREST 로 적재한다.
const fs = require('fs');
const path = require('path');

const URL = 'https://mkqdilotjjwlohtmkajb.supabase.co';
const KEY = 'sb_publishable_6x0Jyvd2tvV4NAJBfK_aCQ_ogQ5GUO6';

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

const headers = {
  apikey: KEY,
  Authorization: 'Bearer ' + KEY,
  'Content-Type': 'application/json',
};

async function req(method, table, body, query) {
  const res = await fetch(URL + '/rest/v1/' + table + (query || ''), {
    method,
    headers: Object.assign({}, headers, method === 'POST' ? { Prefer: 'return=representation' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(method + ' ' + table + ' -> ' + res.status + ' ' + text);
  return text ? JSON.parse(text) : null;
}

(async () => {
  // 기존 데이터 삭제
  await req('DELETE', 'product_images', null, '?id=gt.0');
  await req('DELETE', 'products', null, '?id=gt.0');
  await req('DELETE', 'articles', null, '?id=gt.0');
  await req('DELETE', 'site_assets', null, '?id=gt.0');
  console.log('기존 데이터 삭제 완료');

  // 상품
  const productRows = data.products.map((p) => ({
    slug: p.slug,
    folder_name: p.folder_name,
    category: p.category,
    subcategory: p.subcategory,
    name: p.name,
    price: p.price,
    rank: p.rank,
    size_case: p.size_case,
    description: p.description,
  }));
  const inserted = await req('POST', 'products', productRows);
  console.log('상품', inserted.length, '건 적재');

  const idBySlug = {};
  inserted.forEach((r) => (idBySlug[r.slug] = r.id));

  // 상품 이미지
  const imageRows = [];
  data.products.forEach((p) => {
    p.images.forEach((img) => {
      imageRows.push({
        product_id: idBySlug[p.slug],
        url: img.url,
        is_main: img.is_main,
        sort_order: img.sort_order,
      });
    });
  });
  await req('POST', 'product_images', imageRows);
  console.log('상품 이미지', imageRows.length, '건 적재');

  // 기사
  await req('POST', 'articles', data.articles.map((a) => ({
    slug: a.slug,
    file_name: a.file_name,
    title: a.title,
    subtitle: a.subtitle,
    body: a.body,
    image_url: a.image_url,
    sort_order: a.sort_order,
  })));
  console.log('기사', data.articles.length, '건 적재');

  // 공용 리소스
  const assetRows = [{ kind: 'logo', key: 'main', value: data.logo, sort_order: 0 }];
  data.banners.forEach((b, i) => assetRows.push({ kind: 'banner', key: 'banner-' + (i + 1), value: b, sort_order: i + 1 }));
  Object.entries(data.sizeGuide).forEach(([k, v]) => assetRows.push({ kind: 'size_guide', key: k, value: v, sort_order: 0 }));
  Object.entries(data.notices).forEach(([k, v]) => assetRows.push({ kind: 'notice', key: k, value: v, sort_order: 0 }));
  await req('POST', 'site_assets', assetRows);
  console.log('공용 리소스', assetRows.length, '건 적재');

  console.log('시드 완료');
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
