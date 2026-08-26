/* =========================================================
   상품 상세 페이지
   ========================================================= */

/* 사이즈 선택 버튼 목록
   케이스 1 : 신발      220 ~ 290, 10 단위
   케이스 2 : 의류       80 ~ 115,  5 단위
   케이스 3 : 액세서리   사이즈 선택 영역 없음 */
function buildSizes(sizeCase) {
  const sizes = [];

  if (sizeCase === 1) {
    for (let s = 220; s <= 290; s += 10) sizes.push(s);
  } else if (sizeCase === 2) {
    for (let s = 80; s <= 115; s += 5) sizes.push(s);
  }

  return sizes;
}

/* 상품 미니 이미지 / 메인 상품 이미지 */
function initImages(product) {
  const thumbBox = document.getElementById('detailThumbs');
  const mainImg = document.getElementById('detailMainImg');

  thumbBox.innerHTML = product.images
    .map(function (img, i) {
      return (
        '<img src="' + esc(img.url) + '" alt="' + esc(product.name) + ' 이미지 ' + (i + 1) + '"' +
        ' data-src="' + esc(img.url) + '"' + (i === 0 ? ' class="active"' : '') + '>'
      );
    })
    .join('');

  if (product.images.length) {
    mainImg.src = product.images[0].url;
    mainImg.alt = product.name;
  }

  thumbBox.addEventListener('click', function (e) {
    const thumb = e.target.closest('img');
    if (!thumb) return;

    mainImg.src = thumb.dataset.src;
    thumbBox.querySelectorAll('img').forEach(function (el) {
      el.classList.remove('active');
    });
    thumb.classList.add('active');
  });
}

/* 사이즈 선택 + 사이즈 가이드 */
function initSizes(product, assets) {
  const sizeHead = document.querySelector('.size-head');
  const sizeList = document.getElementById('sizeList');
  const sizes = buildSizes(product.size_case);

  if (!sizes.length) {
    // 케이스 3 (액세서리) : 사이즈 선택 영역을 비워둔다
    sizeHead.style.display = 'none';
    sizeList.style.display = 'none';
    return;
  }

  sizeList.innerHTML = sizes
    .map(function (s) {
      return '<button type="button" class="size-btn font-price">' + s + '</button>';
    })
    .join('');

  sizeList.addEventListener('click', function (e) {
    const btn = e.target.closest('.size-btn');
    if (!btn) return;

    sizeList.querySelectorAll('.size-btn').forEach(function (el) {
      el.classList.remove('selected');
    });
    btn.classList.add('selected');
  });

  const guideUrl = product.size_case === 1 ? assets.sizeGuide.shoes : assets.sizeGuide.apparel;

  document.getElementById('sizeGuideBtn').addEventListener('click', function () {
    openLayer('사이즈 가이드', '<img src="' + esc(guideUrl) + '" alt="사이즈 가이드">');
  });
}

/* 상품 설명 + 추가 정보 토글 */
function initDescription(product, assets) {
  document.getElementById('detailDesc').textContent = product.description || '';

  const wrap = document.querySelector('.detail-extra');
  const notice = product.size_case === 1 ? assets.notices.shoes : product.size_case === 2 ? assets.notices.apparel : '';

  if (!notice) {
    wrap.style.display = 'none';
    return;
  }

  const body = document.getElementById('extraBody');
  const arrow = document.getElementById('extraArrow');
  body.textContent = notice;

  document.getElementById('extraToggle').addEventListener('click', function () {
    const open = body.classList.toggle('open');
    arrow.textContent = open ? '＞' : '∨';
  });
}

/* 추천 상품 : 메인 이미지 중 4장을 매 접속 시 랜덤으로 노출 */
function initRecommend(all, currentSlug) {
  const list = document.getElementById('recommendList');
  const pool = all.filter(function (p) {
    return p.slug !== currentSlug;
  });

  // 피셔-예이츠 셔플
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  list.innerHTML = pool
    .slice(0, 4)
    .map(function (p) {
      return (
        '<a href="product.html?slug=' + encodeURIComponent(p.slug) + '">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' +
        '</a>'
      );
    })
    .join('');
}

/* ---------- 초기화 ---------- */
(async function () {
  const assets = await initLayout();
  const slug = getParam('slug');

  if (!slug) {
    console.error('[상품 상세] slug 파라미터가 없습니다.');
    location.replace('index.html');
    return;
  }

  const product = await fetchProduct(slug);

  if (!product) {
    document.querySelector('.detail-info').innerHTML = '<p class="font-price">상품 정보를 찾을 수 없습니다.</p>';
    return;
  }

  document.title = 'RUNNERS | ' + product.name;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailPrice').textContent = formatPrice(product.price);

  initImages(product);
  initSizes(product, assets);
  initDescription(product, assets);

  const all = await fetchAllMainImages();
  initRecommend(all, slug);
})();
