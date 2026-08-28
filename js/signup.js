/* =========================================================
   회원가입 페이지
   ========================================================= */

/* ---------------------------------------------------------
   비밀번호 입력칸 : 방금 입력한 문자를 1초간 보여준 뒤 점으로 바꾼다
   --------------------------------------------------------- */
function attachPeekPassword(input) {
  const store = { value: '' };
  let timer = null;

  function draw(peek) {
    const v = store.value;

    if (peek && v.length) input.value = '●'.repeat(v.length - 1) + v[v.length - 1];
    else input.value = '●'.repeat(v.length);

    input.setSelectionRange(input.value.length, input.value.length);

    clearTimeout(timer);
    if (peek) {
      timer = setTimeout(function () {
        input.value = '●'.repeat(store.value.length);
      }, 1000);
    }
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      store.value = store.value.slice(0, -1);
      draw(false);
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      return;
    }

    // 한 글자짜리 키만 입력으로 받는다 (조합키 제외)
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      store.value += e.key;
      draw(true);
    }
  });

  input.addEventListener('paste', function (e) {
    e.preventDefault();
  });

  return store;
}

/* 주민등록번호 앞 7자리로 만 나이를 계산한다 */
function calcAge(birth6, gender) {
  if (!/^\d{6}$/.test(birth6) || !/^[1-8]$/.test(gender)) return null;

  const century = ['1', '2', '5', '6'].indexOf(gender) >= 0 ? 1900 : 2000;
  const year = century + Number(birth6.slice(0, 2));
  const month = Number(birth6.slice(2, 4));
  const day = Number(birth6.slice(4, 6));

  const today = new Date();
  let age = today.getFullYear() - year;
  const passed = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!passed) age -= 1;

  return age >= 0 && age < 130 ? age : null;
}

/* ---------- 초기화 ---------- */
(async function () {
  await initLayout();

  const pwStore = attachPeekPassword(document.getElementById('suPw'));
  const pw2Store = attachPeekPassword(document.getElementById('suPw2'));

  const state = { idChecked: false };

  /* 아이디 중복검사 */
  const userIdInput = document.getElementById('suUserId');
  const idHint = document.getElementById('idHint');

  userIdInput.addEventListener('input', function () {
    state.idChecked = false;
    idHint.className = 'hint';
    idHint.textContent = '';
  });

  document.getElementById('btnCheckId').addEventListener('click', async function () {
    const userId = userIdInput.value.trim();
    const { data, error } = await sb.rpc('check_user_id', { p_user_id: userId });

    if (error) {
      console.error('[아이디 중복검사 실패]', error.message);
      idHint.className = 'hint error';
      idHint.textContent = '중복검사 중 오류가 발생했습니다.';
      return;
    }

    state.idChecked = data.ok;
    idHint.className = 'hint ' + (data.ok ? 'ok' : 'error');
    idHint.textContent = data.message;
  });

  /* 이메일 도메인 드롭다운 */
  const emailDomain = document.getElementById('suEmailDomain');
  document.getElementById('suEmailSelect').addEventListener('change', function (e) {
    if (e.target.value) {
      emailDomain.value = e.target.value;
      emailDomain.readOnly = true;
    } else {
      emailDomain.value = '';
      emailDomain.readOnly = false;
      emailDomain.focus();
    }
  });

  /* 도로명주소 찾기 */
  document.getElementById('btnFindAddr').addEventListener('click', function () {
    if (typeof daum === 'undefined' || !daum.Postcode) {
      console.error('[주소 검색] 우편번호 서비스를 불러오지 못했습니다.');
      alert('주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    new daum.Postcode({
      oncomplete: function (data) {
        document.getElementById('suZip').value = data.zonecode;
        document.getElementById('suAddr').value = data.roadAddress || data.jibunAddress;
        document.getElementById('suAddrDetail').focus();
      },
    }).open();
  });

  /* 만 나이 표시 */
  const ageHint = document.getElementById('ageHint');
  function updateAge() {
    const age = calcAge(document.getElementById('suBirth6').value.trim(), document.getElementById('suBirth1').value.trim());

    if (age === null) {
      ageHint.className = 'hint';
      ageHint.textContent = '';
      return;
    }

    ageHint.className = 'hint ok';
    ageHint.textContent = '만 ' + age + '세';
  }

  document.getElementById('suBirth6').addEventListener('input', updateAge);
  document.getElementById('suBirth1').addEventListener('input', updateAge);

  /* 가입하기 */
  const submitHint = document.getElementById('submitHint');

  document.getElementById('btnSignupSubmit').addEventListener('click', async function () {
    const name = document.getElementById('suName').value.trim();
    const userId = userIdInput.value.trim();
    const emailId = document.getElementById('suEmailId').value.trim();
    const domain = emailDomain.value.trim();

    function fail(message) {
      submitHint.className = 'hint error';
      submitHint.textContent = message;
    }

    if (!name) return fail('이름을 입력해 주세요.');
    if (!userId) return fail('아이디를 입력해 주세요.');
    if (!state.idChecked) return fail('아이디 중복검사를 진행해 주세요.');
    if (pwStore.value.length < 8) return fail('비밀번호는 8자 이상 입력해 주세요.');
    if (pwStore.value !== pw2Store.value) return fail('비밀번호가 일치하지 않습니다.');
    if (!document.getElementById('agreeRequired').checked) return fail('필수 약관에 동의해 주세요.');

    const { data, error } = await sb.rpc('signup_member', {
      p_user_id: userId,
      p_password: pwStore.value,
      p_name: name,
      p_phone: document.getElementById('suPhone').value.trim(),
      p_email: emailId && domain ? emailId + '@' + domain : null,
      p_address: (document.getElementById('suZip').value.trim() + ' ' + document.getElementById('suAddr').value.trim()).trim(),
      p_address_detail: document.getElementById('suAddrDetail').value.trim(),
      p_birth7: document.getElementById('suBirth6').value.trim() + document.getElementById('suBirth1').value.trim(),
      p_agree_marketing: document.getElementById('agreeMarketing').checked,
    });

    if (error) {
      console.error('[회원가입 실패]', error.message);
      return fail('가입 처리 중 오류가 발생했습니다.');
    }

    if (!data.ok) return fail(data.message);

    submitHint.className = 'hint ok';
    submitHint.textContent = data.message;

    alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
    location.href = 'login.html';
  });
})();
