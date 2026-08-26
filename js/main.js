/* =========================================================
   메인 페이지
   ========================================================= */

/* ---------- 메인 이미지 슬라이드 ----------
   fadeIn 2초 -> 3초 유지 -> fadeOut 2초 를 무한 반복한다. */
function initHero(banners) {
  const hero = document.getElementById('hero');
  const logo = document.getElementById('heroLogo');
  if (!hero || !banners.length) return;

  const imgs = banners.map(function (src, i) {
    const img = document.createElement('img');
    img.className = 'hero-img';
    img.src = src;
    img.alt = '러너스 메인 배너 ' + (i + 1);
    img.style.transition = 'opacity 2s linear';
    hero.insertBefore(img, logo);
    return img;
  });

  let index = 0;

  function play() {
    const current = imgs[index];
    current.style.opacity = '1'; // 2초간 fade in

    setTimeout(function () {
      current.style.opacity = '0'; // 3초 유지 후 2초간 fade out

      setTimeout(function () {
        index = (index + 1) % imgs.length;
        play();
      }, 2000);
    }, 5000);
  }

  // 삽입 직후에는 초기 스타일이 확정되지 않아 첫 fade in 이 생략될 수 있다
  requestAnimationFrame(function () {
    requestAnimationFrame(play);
  });
}

/* ---------- 베스트 상품 리스트 (오른쪽 -> 왼쪽 흐름) ---------- */
const BEST_ITEM_WIDTH = 290;
const BEST_ITEM_GAP = 40;
const BEST_SPEED = 54; // px / 초

function bestItemHtml(product) {
  return (
    '<a class="best-item" href="product.html?slug=' + encodeURIComponent(product.slug) + '">' +
    '<div class="best-rank font-content">' + product.rank + '</div>' +
    '<div class="best-name font-pname">' + esc(product.name) + '</div>' +
    '<div class="best-price font-price">' + formatPrice(product.price) + '</div>' +
    '<img class="best-img" src="' + esc(product.image) + '" alt="' + esc(product.name) + '">' +
    '</a>'
  );
}

function initBest(products) {
  const track = document.getElementById('bestTrack');
  if (!track) return;

  if (!products.length) {
    track.innerHTML = '<p class="font-price">베스트 상품이 없습니다.</p>';
    return;
  }

  // 끊김 없이 흐르도록 목록을 두 벌 이어 붙인다
  const html = products.map(bestItemHtml).join('');
  track.innerHTML = html + html;

  const setWidth = products.length * (BEST_ITEM_WIDTH + BEST_ITEM_GAP);
  track.style.setProperty('--flow-distance', '-' + setWidth + 'px');
  track.style.animationDuration = setWidth / BEST_SPEED + 's';
}

/* ---------- 매거진 ---------- */
function initMagazine(articles) {
  const grid = document.getElementById('magGrid');
  if (!grid) return;

  grid.innerHTML = articles
    .map(function (a) {
      return (
        '<a class="mag-card" href="article.html?slug=' + encodeURIComponent(a.slug) + '">' +
        '<img src="' + esc(a.image_url) + '" alt="' + esc(a.title) + '">' +
        '<p class="mag-card-title font-price">' + esc(a.title) + '</p>' +
        '</a>'
      );
    })
    .join('');
}

/* ---------- 초기화 ---------- */
(async function () {
  const assets = await initLayout();

  const logo = document.getElementById('heroLogo');
  if (logo) logo.src = assets.logo;

  initHero(assets.banners);

  const [best, articles] = await Promise.all([fetchBestProducts(), fetchArticles()]);
  initBest(best);
  initMagazine(articles);
})();
