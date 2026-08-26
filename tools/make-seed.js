// data.json -> Supabase 시드용 SQL 파일 생성
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const q = (v) => (v === null || v === undefined ? 'null' : "'" + String(v).replace(/'/g, "''") + "'");

const out = [];

out.push('truncate table public.product_images, public.products restart identity cascade;');
out.push('truncate table public.articles restart identity;');
out.push('truncate table public.site_assets restart identity;');

// 상품
const pRows = data.products.map(
  (p) =>
    '(' +
    [q(p.slug), q(p.folder_name), q(p.category), q(p.subcategory), q(p.name), p.price, p.rank, p.size_case, q(p.description)].join(', ') +
    ')'
);
out.push(
  'insert into public.products (slug, folder_name, category, subcategory, name, price, rank, size_case, description) values\n' +
    pRows.join(',\n') +
    ';'
);

// 상품 이미지
const iRows = [];
data.products.forEach((p) => {
  p.images.forEach((img) => {
    iRows.push('((select id from public.products where slug = ' + q(p.slug) + '), ' + q(img.url) + ', ' + img.is_main + ', ' + img.sort_order + ')');
  });
});
out.push('insert into public.product_images (product_id, url, is_main, sort_order) values\n' + iRows.join(',\n') + ';');

// 기사
const aRows = data.articles.map(
  (a) => '(' + [q(a.slug), q(a.file_name), q(a.title), q(a.subtitle), q(a.body), q(a.image_url), a.sort_order].join(', ') + ')'
);
out.push('insert into public.articles (slug, file_name, title, subtitle, body, image_url, sort_order) values\n' + aRows.join(',\n') + ';');

// 공용 리소스
const sRows = [];
sRows.push("('logo', 'main', " + q(data.logo) + ', 0)');
data.banners.forEach((b, i) => sRows.push("('banner', 'banner-" + (i + 1) + "', " + q(b) + ', ' + (i + 1) + ')'));
Object.entries(data.sizeGuide).forEach(([k, v]) => sRows.push("('size_guide', " + q(k) + ', ' + q(v) + ', 0)'));
Object.entries(data.notices).forEach(([k, v]) => sRows.push("('notice', " + q(k) + ', ' + q(v) + ', 0)'));
out.push('insert into public.site_assets (kind, key, value, sort_order) values\n' + sRows.join(',\n') + ';');

const sql = out.join('\n\n');
fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql, 'utf8');

// MCP 실행 편의를 위해 문장 단위로도 분할 저장
out.forEach((stmt, i) => fs.writeFileSync(path.join(__dirname, 'seed-' + (i + 1) + '.sql'), stmt, 'utf8'));

console.log('seed.sql 생성 완료 (' + out.length + ' 문장, ' + sql.length + ' bytes)');
