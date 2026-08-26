/* =========================================================
   마이페이지
   ========================================================= */

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

  document.getElementById('btnPoint').addEventListener('click', function () {
    openLayer(
      '쿠폰/포인트',
      '<p class="font-price" style="line-height:1.9">' +
        '보유 쿠폰 : 2장<br>' +
        '· 신규가입 15% 할인쿠폰 (30일 남음)<br>' +
        '· 무료배송 쿠폰 (기간 제한 없음)<br><br>' +
        '보유 포인트 : 10,000 P' +
        '</p>'
    );
  });
})();
