/**
 * 원본 에셋 폴더를 스캔해서
 *  1) site/assets/ 아래로 파일명을 정규화하여 복사하고
 *  2) Supabase 시드용 data.json 을 생성한다.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', '..'); // 3차과제_러닝쇼핑몰
const SITE = path.resolve(__dirname, '..'); // site
const ASSETS = path.join(SITE, 'assets');

const DIR_PRODUCT = path.join(SRC, '상품 상세 이미지');
const DIR_BANNER = path.join(SRC, '메인배너 이미지');
const DIR_LOGO = path.join(SRC, '쇼핑몰 로고');
const DIR_SIZE = path.join(SRC, '사이즈 가이드');
const DIR_ARTICLE = path.join(SRC, '기사');
const DIR_NOTICE = path.join(SRC, '상품 설명 텍스트');

const IMG_EXT = ['.png', '.jpg', '.jpeg', '.jfif', '.webp', '.gif', '.avif'];

function isImage(f) {
  return IMG_EXT.includes(path.extname(f).toLowerCase());
}

// .jfif 는 실제로 JPEG 이므로 브라우저 호환을 위해 .jpg 로 저장한다
function normalizeExt(ext) {
  const e = ext.toLowerCase();
  return e === '.jfif' || e === '.jpeg' ? '.jpg' : e;
}

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n').trim();
}

// '엑세서리' 오타를 '액세서리'로 통일
function normalizeCategory(c) {
  return c === '엑세서리' ? '액세서리' : c;
}

// 폴더명 첫 조각으로 사이즈 케이스 판정 (1: 신발, 2: 의류, 3: 액세서리)
function sizeCaseOf(category) {
  if (category === '신발') return 1;
  if (category === '의류') return 2;
  return 3;
}

const data = { products: [], articles: [], banners: [], notices: {} };

/* ---------- 로고 ---------- */
{
  const f = fs.readdirSync(DIR_LOGO).filter(isImage)[0];
  const out = 'runners-logo' + normalizeExt(path.extname(f));
  copy(path.join(DIR_LOGO, f), path.join(ASSETS, 'logo', out));
  data.logo = 'assets/logo/' + out;
}

/* ---------- 메인 배너 ---------- */
fs.readdirSync(DIR_BANNER)
  .filter(isImage)
  .sort()
  .forEach((f, i) => {
    const out = 'banner-' + (i + 1) + normalizeExt(path.extname(f));
    copy(path.join(DIR_BANNER, f), path.join(ASSETS, 'banner', out));
    data.banners.push('assets/banner/' + out);
  });

/* ---------- 사이즈 가이드 ---------- */
data.sizeGuide = {};
fs.readdirSync(DIR_SIZE)
  .filter(isImage)
  .forEach((f) => {
    const key = f.startsWith('신발') ? 'shoes' : 'apparel';
    const out = key + normalizeExt(path.extname(f));
    copy(path.join(DIR_SIZE, f), path.join(ASSETS, 'size-guide', out));
    data.sizeGuide[key] = 'assets/size-guide/' + out;
  });

/* ---------- 추가 정보(상품정보제공고시) ---------- */
fs.readdirSync(DIR_NOTICE)
  .filter((f) => f.endsWith('.txt'))
  .forEach((f) => {
    const key = f.startsWith('신발') ? 'shoes' : 'apparel';
    data.notices[key] = readText(path.join(DIR_NOTICE, f));
  });

/* ---------- 상품 ---------- */
const folders = fs
  .readdirSync(DIR_PRODUCT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let seq = 0;
folders.forEach((folder) => {
  const parts = folder.split('_').map((s) => s.trim());
  if (parts.length !== 5) {
    console.error('[상품 폴더 오류] ' + folder + ' : 언더바 기준 5조각이 아니므로 건너뜁니다. (조각 ' + parts.length + '개)');
    return;
  }

  const rawCategory = parts[0];
  const subcategory = parts[1];
  const name = parts[2];
  const price = Number(parts[3]);
  const rank = Number(String(parts[4]).replace('판매순위', ''));
  const category = normalizeCategory(rawCategory);

  if (!Number.isFinite(price) || !Number.isFinite(rank)) {
    console.error('[상품 폴더 오류] ' + folder + ' : 가격 또는 판매순위를 숫자로 변환할 수 없어 건너뜁니다.');
    return;
  }

  seq += 1;
  const slug = 'p' + String(seq).padStart(2, '0');
  const dir = path.join(DIR_PRODUCT, folder);
  const files = fs.readdirSync(dir);

  // 상품설명.txt / 상품 설명.txt 둘 다 허용
  const descFile = files.find((f) => f.replace(/\s+/g, '') === '상품설명.txt');
  const description = descFile ? readText(path.join(dir, descFile)) : '';
  if (!descFile) console.error('[상품 설명 없음] ' + folder);

  // 메인이미지 파일이 맨 앞, 나머지는 파일명 순서
  const imageFiles = files.filter(isImage);
  const mainFile = imageFiles.find(
    (f) => path.basename(f, path.extname(f)).replace(/\s+/g, '') === '메인이미지'
  );
  const restFiles = imageFiles
    .filter((f) => f !== mainFile)
    .sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));
  const ordered = mainFile ? [mainFile].concat(restFiles) : restFiles;
  if (!mainFile) console.error('[메인이미지 없음] ' + folder);

  const images = ordered.map((f, i) => {
    const out = (i === 0 ? 'main' : 'img-' + i) + normalizeExt(path.extname(f));
    copy(path.join(dir, f), path.join(ASSETS, 'products', slug, out));
    return { url: 'assets/products/' + slug + '/' + out, is_main: i === 0, sort_order: i };
  });

  data.products.push({
    slug: slug,
    folder_name: folder,
    category: category,
    subcategory: subcategory,
    name: name,
    price: price,
    rank: rank,
    size_case: sizeCaseOf(category),
    description: description,
    images: images,
  });
});

/* ---------- 매거진 기사 ---------- */
const articleFiles = fs
  .readdirSync(DIR_ARTICLE)
  .filter((f) => /\.(md|txt)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

const articleImages = fs.readdirSync(DIR_ARTICLE).filter(isImage);

articleFiles.forEach((f, i) => {
  const base = path.basename(f, path.extname(f));
  const raw = readText(path.join(DIR_ARTICLE, f));
  const lines = raw.split('\n');

  const title = lines[0].replace(/^#+\s*/, '').trim(); // 첫 번째 줄 = 기사 제목
  const rest = lines.slice(1);
  const subIdx = rest.findIndex((l) => l.trim() !== '');
  const subtitle = subIdx >= 0 ? rest[subIdx].replace(/\*\*/g, '').trim() : '';
  const body = rest.slice(subIdx + 1).join('\n').trim();

  // 기사 이미지: 기사 텍스트 파일과 같은 이름의 이미지 사용, 없으면 임시 이미지 생성
  const slug = 'a' + String(i + 1).padStart(2, '0');
  const match = articleImages.find((img) => path.basename(img, path.extname(img)) === base);
  let url;

  if (match) {
    const out = slug + normalizeExt(path.extname(match));
    copy(path.join(DIR_ARTICLE, match), path.join(ASSETS, 'articles', out));
    url = 'assets/articles/' + out;
  } else {
    console.error('[기사 이미지 없음] ' + base + ' 와 이름이 같은 이미지가 없어 임시 이미지를 사용합니다.');
    url = 'assets/articles/' + slug + '.svg';
    const no = String(i + 1).padStart(2, '0');
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">' +
      '<rect width="600" height="600" fill="#EBF400"/>' +
      '<text x="300" y="288" font-family="Noto Sans KR, sans-serif" font-size="40" font-weight="700" fill="#1D1D1D" text-anchor="middle">RUNNERS</text>' +
      '<text x="300" y="338" font-family="Noto Sans KR, sans-serif" font-size="22" font-weight="300" fill="#1D1D1D" text-anchor="middle">MAGAZINE ' + no + '</text>' +
      '</svg>';
    fs.mkdirSync(path.join(ASSETS, 'articles'), { recursive: true });
    fs.writeFileSync(path.join(ASSETS, 'articles', slug + '.svg'), svg, 'utf8');
  }

  data.articles.push({
    slug: slug,
    file_name: base,
    title: title,
    subtitle: subtitle,
    body: body,
    image_url: url,
    sort_order: i + 1,
  });
});

fs.writeFileSync(path.join(SITE, 'tools', 'data.json'), JSON.stringify(data, null, 2), 'utf8');

console.log('---------------------------------------------');
console.log('상품 :', data.products.length, '개');
console.log('기사 :', data.articles.length, '개');
console.log('배너 :', data.banners.length, '장');
console.log('상품 이미지 총 :', data.products.reduce((n, p) => n + p.images.length, 0), '장');
console.log('data.json 생성 완료');
