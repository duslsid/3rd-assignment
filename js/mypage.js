/* =========================================================
   마이페이지
   ========================================================= */

/* 최근 주문내역 (주문 기능은 아직 없으므로 예시로 보여주는 내역이다) */
const RECENT_ORDERS = [
  { date: '2026-08-26', no: '20260826-00318', name: '핑크 4인치 러닝 쇼츠 외 1건', price: 158000, state: '배송준비중' },
  { date: '2026-08-18', no: '20260818-00104', name: 'Charged 터뷸런스 3', price: 220000, state: '배송중' },
  { date: '2026-08-05', no: '20260805-00027', name: '드라이 러닝 타이츠 외 2건', price: 203000, state: '배송완료' },
];

/* 쿠폰 / 포인트 보유 내역 */
function pointHtml() {
  return (
    '<p class="font-pname">' +
    '보유 쿠폰 : 2장<br>' +
    '· 신규가입 15% 할인쿠폰 (30일 남음)<br>' +
    '· 무료배송 쿠폰 (기간 제한 없음)<br><br>' +
    '보유 포인트 : 10,000 P' +
    '</p>'
  );
}

/* 장바구니 / 위시리스트에 담겨 있는 상품 */
function itemsHtml(base, emptyText) {
  const items = readStore(base);

  if (!items.length) return '<p class="mypage-empty font-pname">' + esc(emptyText) + '</p>';

  return items
    .map(function (item) {
      const option = item.size ? '사이즈 ' + esc(item.size) : '단일 사이즈';

      return (
        '<div class="mypage-item">' +
        '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '">' +
        '<div class="mypage-item-text font-pname">' + esc(item.name) + ' (' + option + ' / ' + item.qty + '개)</div>' +
        '<div class="mypage-item-price font-price">' + formatPrice(item.price * item.qty) + '</div>' +
        '</div>'
      );
    })
    .join('');
}

/* 최근 주문내역 */
function ordersHtml() {
  if (!RECENT_ORDERS.length) return '<p class="mypage-empty font-pname">최근 주문내역이 없습니다.</p>';

  return RECENT_ORDERS.map(function (o) {
    return (
      '<div class="mypage-order font-pname">' +
      esc(o.date) + ' ㅣ 주문번호 ' + esc(o.no) + '<br>' +
      esc(o.name) + ' ㅣ ' + formatPrice(o.price) + ' ㅣ ' + esc(o.state) +
      '</div>'
    );
  }).join('');
}

/* ---------- 초기화 ---------- */
(async function () {
  await initLayout();

  // 로그인 정보는 세션에 보관한다
  let member = null;
  try {
    member = JSON.parse(sessionStorage.getItem('runnersMember') || 'null');
  } catch (e) {
    console.error('[마이페이지] 로그인 정보를 읽지 못했습니다.', e);
  }

  const name = member && member.name ? member.name : '고객';
  document.getElementById('myName').textContent = maskName(name) + ' 님';

  const panel = document.getElementById('mypagePanel');
  const tabs = document.querySelectorAll('.mypage-tab');

  function show(tab) {
    if (tab === 'wish') panel.innerHTML = itemsHtml(WISH_KEY, '위시리스트가 비어 있습니다.');
    else if (tab === 'cart') panel.innerHTML = itemsHtml(CART_KEY, '장바구니가 비어 있습니다.');
    else if (tab === 'orders') panel.innerHTML = ordersHtml();
    else panel.innerHTML = pointHtml();
  }

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (el) {
        el.classList.remove('on');
      });
      btn.classList.add('on');
      show(btn.dataset.tab);
    });
  });

  show('point');
})();
