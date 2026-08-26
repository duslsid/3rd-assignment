/* =========================================================
   공통 : 헤더 / 푸터 / 홍보띠 / TOP 버튼 / 유틸
   ========================================================= */

/* 메뉴 구성 */
const MENUS = [
  { name: '의류', subs: ['남성', '여성', '아동'] },
  { name: '신발', subs: ['로드', '트랙', '트레일'] },
  { name: '액세서리', subs: ['모자', '조끼', '벨트', '양말'] },
  { name: '매거진', subs: ['매거진'] },
];

/* 홍보띠 문구 */
const PROMO_TEXTS = [
  '[리뷰이벤트] 구매하신 제품에 리뷰를 남기고 10,000 포인트를 받아보세요',
  '[플친이벤트] 카카오톡에서 러너스 채널을 플러스친구로 등록하시면 15% 할인쿠폰을 드립니다',
  '[무료배송이벤트] 주문금액에 상관없이 무료배송 혜택을 드립니다',
];

/* ---------- 유틸 ---------- */

/* 79000 -> 79,000원 */
function formatPrice(price) {
  return Number(price).toLocaleString('ko-KR') + '원';
}

/* 이름 마스킹 : 김가나 -> 김*나 */
function maskName(name) {
  const s = String(name || '').trim();
  if (s.length <= 1) return s;
  if (s.length === 2) return s[0] + '*';
  return s[0] + '*'.repeat(s.length - 2) + s[s.length - 1];
}

/* URL 쿼리스트링 값 */
function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}

/* 하위 메뉴 링크 (매거진은 매거진 페이지로) */
function subMenuHref(menu, sub) {
  if (menu === '매거진') return 'magazine.html';
  return 'category.html?cat=' + encodeURIComponent(menu) + '&sub=' + encodeURIComponent(sub);
}

function menuHref(menu) {
  if (menu === '매거진') return 'magazine.html';
  return 'category.html?cat=' + encodeURIComponent(menu);
}

/* HTML 이스케이프 */
function esc(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- 헤더 ---------- */
function renderHeader() {
  const homeIcon =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.4">' +
    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/></svg>';

  const menuHtml = MENUS.map(function (m) {
    const subs = m.subs
      .map(function (s) {
        return '<li><a class="font-submenu" href="' + subMenuHref(m.name, s) + '">' + esc(s) + '</a></li>';
      })
      .join('');

    return (
      '<li class="menu-item">' +
      '<a class="font-menu" href="' + menuHref(m.name) + '">' + esc(m.name) + '</a>' +
      '<div class="submenu"><ul>' + subs + '</ul></div>' +
      '</li>'
    );
  }).join('');

  const promoHtml = PROMO_TEXTS.map(function (t, i) {
    return '<div class="promo-item font-promo" data-index="' + i + '">' + esc(t) + '</div>';
  }).join('');

  return (
    '<header class="header" id="header">' +
    '<div class="promo"><div class="promo-list">' + promoHtml + '</div></div>' +
    '<div class="header-line"></div>' +
    '<nav class="gnb">' +
    '<a class="gnb-home" href="index.html" aria-label="메인 페이지">' + homeIcon + '</a>' +
    '<ul class="gnb-menu">' + menuHtml + '</ul>' +
    '<div class="gnb-spot">' +
    '<a class="font-menu" href="signup.html">회원가입</a>' +
    '<span class="font-menu bar">ㅣ</span>' +
    '<a class="font-menu" href="login.html">로그인</a>' +
    '</div>' +
    '</nav>' +
    '</header>'
  );
}

/* ---------- 푸터 ---------- */
function renderFooter(logoUrl) {
  return (
    '<footer class="footer">' +
    '<div class="container footer-inner">' +
    '<div class="footer-text">' +
    '<p class="font-menu footer-cs">고객상담센터 1588-0123 (무료)<br>상담시간 월~토 09:00~18:00</p>' +
    '<p class="font-submenu footer-links">' +
    '<a href="#">회사소개</a><span class="bar">ㅣ</span>' +
    '<a href="#">고객지원</a><span class="bar">ㅣ</span>' +
    '<a href="#">찾아오시는길</a><span class="bar">ㅣ</span>' +
    '<a href="#">개인정보처리방침</a>' +
    '</p>' +
    '<p class="font-promo footer-info">러너스(주) 서울특별시 마포구 잔다리로 8<br>대표자 김코딩<br>' +
    '사업자등록번호 102-81-12345 ㅣ 통신판매신고번호 2025-서울마포-0451</p>' +
    '</div>' +
    '<a href="index.html"><img class="footer-logo" src="' + esc(logoUrl) + '" alt="RUNNERS"></a>' +
    '</div>' +
    '</footer>'
  );
}

/* ---------- 홍보띠 순환 ---------- */
function startPromoRolling() {
  const items = document.querySelectorAll('.promo-item');
  if (!items.length) return;

  let current = 0;
  items[0].classList.add('on');

  setInterval(function () {
    items[current].classList.remove('on');
    current = (current + 1) % items.length;

    // 애니메이션 재시작을 위해 리플로우를 한 번 발생시킨다
    void items[current].offsetWidth;
    items[current].classList.add('on');
  }, 4000);
}

/* ---------- 스크롤 : 홍보띠 숨김 / TOP 버튼 ---------- */
function initScrollBehavior() {
  const header = document.getElementById('header');
  const topBtn = document.getElementById('topBtn');
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;

    // 아래로 내리면 홍보띠가 사라지고, 위로 올리면 다시 나타난다
    if (header) {
      if (y > lastY && y > 40) header.classList.add('promo-hidden');
      else if (y < lastY) header.classList.remove('promo-hidden');
    }

    // 400px 이상 내리면 TOP 버튼 표시
    if (topBtn) {
      if (y >= 400) topBtn.classList.add('show');
      else topBtn.classList.remove('show');
    }

    lastY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- 레이어 팝업 ---------- */
function openLayer(title, bodyHtml) {
  let layer = document.getElementById('commonLayer');

  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'layer';
    layer.id = 'commonLayer';
    layer.innerHTML =
      '<div class="layer-box">' +
      '<div class="layer-head">' +
      '<strong class="font-price" id="commonLayerTitle"></strong>' +
      '<button type="button" class="layer-close" aria-label="닫기">&times;</button>' +
      '</div>' +
      '<div id="commonLayerBody"></div>' +
      '</div>';
    document.body.appendChild(layer);

    layer.addEventListener('click', function (e) {
      if (e.target === layer || e.target.classList.contains('layer-close')) {
        layer.classList.remove('open');
      }
    });
  }

  document.getElementById('commonLayerTitle').textContent = title;
  document.getElementById('commonLayerBody').innerHTML = bodyHtml;
  layer.classList.add('open');

  return layer;
}

function closeLayer() {
  const layer = document.getElementById('commonLayer');
  if (layer) layer.classList.remove('open');
}

/* ---------- 페이지 공통 초기화 ---------- */
async function initLayout() {
  const headerSlot = document.getElementById('headerSlot');
  const footerSlot = document.getElementById('footerSlot');

  if (headerSlot) headerSlot.innerHTML = renderHeader();

  // TOP 버튼
  if (!document.getElementById('topBtn')) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'topBtn';
    btn.className = 'top-btn';
    btn.textContent = 'TOP';
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
  }

  startPromoRolling();
  initScrollBehavior();

  const assets = await fetchSiteAssets();
  if (footerSlot) footerSlot.innerHTML = renderFooter(assets.logo);

  return assets;
}
