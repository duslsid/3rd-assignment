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

/* 상품 미니 이미지 / 메인 상품 이미지
   미니 이미지가 많으면 메인 이미지 높이를 넘기므로 파일명 순서대로 8개까지만 배치한다 */
const THUMB_MAX = 8;

function initImages(product) {
  const thumbBox = document.getElementById('detailThumbs');
  const mainImg = document.getElementById('detailMainImg');

  thumbBox.innerHTML = product.images
    .slice(0, THUMB_MAX)
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

/* 구매수량 설정 + 총 구매액 계산 */
function initBuyBox(product) {
  const box = document.getElementById('qtyBox');
  const total = document.getElementById('buyTotal');
  let qty = 1;

  box.innerHTML = qtyBoxHtml(qty);
  const num = box.querySelector('.qty-num');

  function draw() {
    num.textContent = qty;
    total.textContent = formatPrice(product.price * qty);
  }

  box.querySelector('.qty-minus').addEventListener('click', function () {
    if (qty > 1) qty -= 1;
    draw();
  });

  box.querySelector('.qty-plus').addEventListener('click', function () {
    qty += 1;
    draw();
  });

  draw();

  return function () {
    return qty;
  };
}

/* 담을 상품 정보를 만든다. 사이즈를 골라야 하는 상품인데 고르지 않았으면 null */
function pickItem(product, getQty) {
  const selected = document.querySelector('.size-btn.selected');

  if (buildSizes(product.size_case).length && !selected) {
    alert('사이즈를 선택해 주세요.');
    return null;
  }

  const main = product.images.find(function (i) {
    return i.is_main;
  });

  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: main ? main.url : product.images.length ? product.images[0].url : '',
    sizeCase: product.size_case,
    size: selected ? selected.textContent : '',
    qty: getQty(),
  };
}

/* 장바구니 담기 / 위시리스트 담기 */
function initCartButton(product, getQty) {
  document.querySelector('.btn-cart').addEventListener('click', function () {
    const item = pickItem(product, getQty);
    if (!item) return;

    addToStore(CART_KEY, item);
    if (confirm('장바구니에 담았습니다. 장바구니로 이동하시겠습니까?')) location.href = 'cart.html';
  });

  document.getElementById('btnWish').addEventListener('click', function () {
    const item = pickItem(product, getQty);
    if (!item) return;

    addToStore(WISH_KEY, item);
    location.href = 'wishlist.html';
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
    .slice(0, 6)
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

  const getQty = initBuyBox(product);
  initCartButton(product, getQty);

  initDescription(product, assets);

  const all = await fetchAllMainImages();
  initRecommend(all, slug);
})();
