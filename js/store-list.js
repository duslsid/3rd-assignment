/* =========================================================
   장바구니 / 위시리스트 공통 목록
   ========================================================= */

/* 옵션 드롭다운 목록 (상품 상세페이지의 사이즈 케이스와 동일) */
function storeSizes(sizeCase) {
  const sizes = [];

  if (Number(sizeCase) === 1) {
    for (let s = 220; s <= 290; s += 10) sizes.push(String(s));
  } else if (Number(sizeCase) === 2) {
    for (let s = 80; s <= 115; s += 5) sizes.push(String(s));
  }

  return sizes;
}

/* 담은 이후에도 옵션을 바꿀 수 있도록 드롭다운으로 표시한다 */
function optionHtml(item, index) {
  const sizes = storeSizes(item.sizeCase);

  if (!sizes.length) return '<span class="font-pname">단일 사이즈</span>';

  const options = sizes
    .map(function (s) {
      return '<option value="' + s + '"' + (String(item.size) === s ? ' selected' : '') + '>' + s + '</option>';
    })
    .join('');

  return '<select class="font-pname" data-index="' + index + '">' + options + '</select>';
}

function rowHtml(item, index) {
  return (
    '<div class="cart-row" data-index="' + index + '">' +
    '<div class="cart-goods">' +
    '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '">' +
    '<div class="cart-goods-text">' +
    '<p class="font-pname">' + esc(item.name) + '</p>' +
    '<div class="cart-option">' + optionHtml(item, index) + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="cart-right">' +
    '<p class="font-price">' + formatPrice(item.price) + '</p>' +
    '<div class="cart-control">' +
    qtyBoxHtml(item.qty) +
    '<button type="button" class="cart-del font-pname">삭제</button>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

/* base : 저장소 키 (CART_KEY / WISH_KEY), emptyText : 비었을 때 문구 */
function initStoreList(base, emptyText) {
  const list = document.getElementById('cartList');
  const totalBox = document.getElementById('cartTotalPrice');

  function render() {
    const items = readStore(base);

    if (!items.length) {
      list.innerHTML = '<p class="cart-empty font-pname">' + esc(emptyText) + '</p>';
      totalBox.textContent = '0 원';
      return;
    }

    list.innerHTML = items.map(rowHtml).join('');

    const total = items.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);

    totalBox.textContent = Number(total).toLocaleString('ko-KR') + ' 원';
  }

  /* 수량이나 옵션이 바뀌면 같은 상품끼리 다시 합친 뒤 저장한다 */
  function save(items) {
    const merged = [];
    items.forEach(function (item) {
      if (item.qty > 0) mergeStoreItem(merged, item);
    });

    writeStore(base, merged);
    render();
  }

  list.addEventListener('click', function (e) {
    const row = e.target.closest('.cart-row');
    if (!row) return;

    const items = readStore(base);
    const item = items[Number(row.dataset.index)];
    if (!item) return;

    if (e.target.closest('.qty-plus')) item.qty += 1;
    else if (e.target.closest('.qty-minus')) item.qty = Math.max(1, item.qty - 1);
    else if (e.target.closest('.cart-del')) item.qty = 0;
    else return;

    save(items);
  });

  list.addEventListener('change', function (e) {
    const select = e.target.closest('select');
    if (!select) return;

    const items = readStore(base);
    const item = items[Number(select.dataset.index)];
    if (!item) return;

    item.size = select.value;
    save(items);
  });

  document.getElementById('cartBuyBtn').addEventListener('click', function () {
    if (!readStore(base).length) {
      alert(emptyText);
      return;
    }

    alert('구매 기능은 준비중입니다.');
  });

  render();
}
