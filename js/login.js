/* =========================================================
   로그인 페이지
   ========================================================= */

/* 모의 문자 인증 : 6자리 인증번호를 발급한다 */
function issueAuthCode(targetId, messageId) {
  const phone = document.getElementById(targetId).value.trim();
  const box = document.getElementById(messageId);

  if (!phone) {
    box.textContent = '전화번호를 먼저 입력해 주세요.';
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  box.dataset.code = code;
  box.textContent = '인증번호 ' + code + ' 가 발송되었습니다. (실습용 화면 표시)';
}

/* 아이디 찾기 팝업 */
function openFindIdLayer() {
  openLayer(
    '아이디 찾기',
    '<div class="layer-field"><label class="font-pname">이름</label><input type="text" id="findIdName"></div>' +
      '<div class="layer-field"><label class="font-pname">전화번호</label><input type="text" id="findIdPhone" placeholder="010-0000-0000"></div>' +
      '<button type="button" class="layer-btn" id="findIdAuth">전화번호 문자 인증 받기</button>' +
      '<p class="layer-msg font-pname" id="findIdAuthMsg"></p>' +
      '<div style="height:12px"></div>' +
      '<button type="button" class="layer-btn" id="findIdSubmit">아이디 찾기</button>' +
      '<p class="layer-msg font-pname" id="findIdResult"></p>'
  );

  document.getElementById('findIdAuth').addEventListener('click', function () {
    issueAuthCode('findIdPhone', 'findIdAuthMsg');
  });

  document.getElementById('findIdSubmit').addEventListener('click', async function () {
    const name = document.getElementById('findIdName').value.trim();
    const phone = document.getElementById('findIdPhone').value.trim();
    const result = document.getElementById('findIdResult');

    if (!name || !phone) {
      result.textContent = '이름과 전화번호를 모두 입력해 주세요.';
      return;
    }

    const { data, error } = await sb.rpc('find_user_id', { p_name: name, p_phone: phone });

    if (error) {
      console.error('[아이디 찾기 실패]', error.message);
      result.textContent = '조회 중 오류가 발생했습니다.';
      return;
    }

    result.textContent = data.message;
  });
}

/* 비밀번호 찾기 팝업 */
function openFindPwLayer() {
  openLayer(
    '비밀번호 찾기',
    '<div class="layer-field"><label class="font-pname">아이디</label><input type="text" id="findPwId"></div>' +
      '<div class="layer-field"><label class="font-pname">이름</label><input type="text" id="findPwName"></div>' +
      '<div class="layer-field"><label class="font-pname">전화번호</label><input type="text" id="findPwPhone" placeholder="010-0000-0000"></div>' +
      '<button type="button" class="layer-btn" id="findPwAuth">전화번호 문자 인증 받기</button>' +
      '<p class="layer-msg font-pname" id="findPwAuthMsg"></p>' +
      '<div style="height:12px"></div>' +
      '<button type="button" class="layer-btn" id="findPwSubmit">비밀번호 재설정</button>' +
      '<p class="layer-msg font-pname" id="findPwResult"></p>'
  );

  document.getElementById('findPwAuth').addEventListener('click', function () {
    issueAuthCode('findPwPhone', 'findPwAuthMsg');
  });

  document.getElementById('findPwSubmit').addEventListener('click', async function () {
    const userId = document.getElementById('findPwId').value.trim();
    const name = document.getElementById('findPwName').value.trim();
    const phone = document.getElementById('findPwPhone').value.trim();
    const result = document.getElementById('findPwResult');

    if (!userId || !name || !phone) {
      result.textContent = '아이디, 이름, 전화번호를 모두 입력해 주세요.';
      return;
    }

    const { data, error } = await sb.rpc('reset_password', {
      p_user_id: userId,
      p_name: name,
      p_phone: phone,
    });

    if (error) {
      console.error('[비밀번호 재설정 실패]', error.message);
      result.textContent = '처리 중 오류가 발생했습니다.';
      return;
    }

    result.textContent = data.message;
  });
}

/* ---------- 초기화 ---------- */
(async function () {
  await initLayout();

  const idInput = document.getElementById('loginId');
  const pwInput = document.getElementById('loginPw');
  const remember = document.getElementById('rememberId');
  const msg = document.getElementById('loginMsg');

  // 아이디 기억하기
  const savedId = localStorage.getItem('runnersSavedId');
  if (savedId) {
    idInput.value = savedId;
    remember.checked = true;
  }

  async function doLogin() {
    const userId = idInput.value.trim();
    const password = pwInput.value;

    if (!userId || !password) {
      msg.textContent = '아이디와 비밀번호를 입력해 주세요.';
      return;
    }

    const { data, error } = await sb.rpc('login_member', { p_user_id: userId, p_password: password });

    if (error) {
      console.error('[로그인 실패]', error.message);
      msg.textContent = '로그인 처리 중 오류가 발생했습니다.';
      return;
    }

    if (!data.ok) {
      msg.textContent = data.message;
      return;
    }

    if (remember.checked) localStorage.setItem('runnersSavedId', userId);
    else localStorage.removeItem('runnersSavedId');

    sessionStorage.setItem('runnersMember', JSON.stringify({ userId: data.user_id, name: data.name }));

    // 로그인 전에 담아둔 장바구니 내역을 회원 장바구니로 합친다
    mergeGuestCart(data.user_id);

    if (data.password_change_recommended) {
      alert('마지막 비밀번호 변경 후 3개월이 지났습니다. 비밀번호를 변경해 주세요.');
    }

    location.href = 'mypage.html';
  }

  document.getElementById('btnLogin').addEventListener('click', doLogin);
  pwInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
  });

  document.getElementById('btnSignup').addEventListener('click', function () {
    location.href = 'signup.html';
  });

  document.getElementById('btnFindId').addEventListener('click', openFindIdLayer);
  document.getElementById('btnFindPw').addEventListener('click', openFindPwLayer);
})();
