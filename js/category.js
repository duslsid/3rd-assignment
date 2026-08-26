/* =========================================================
   하위 메뉴 페이지 (상품 목록)
   ========================================================= */

function productCardHtml(product) {
  return (
    '<a class="product-card" href="product.html?slug=' + encodeURIComponent(product.slug) + '">' +
    '<img src="' + esc(product.image) + '" alt="' + esc(product.name) + '">' +
    '<p class="name font-pname">' + esc(product.name) + '</p>' +
    '<p class="price font-price">' + formatPrice(product.price) + '</p>' +
    '</a>'
  );
}

(async function () {
  await initLayout();

  const category = getParam('cat') || '';
  const subcategory = getParam('sub') || '';

  document.getElementById('pageTitle').textContent = category || '전체 상품';
  document.getElementById('pageSub').textContent = subcategory;
  document.title = 'RUNNERS | ' + (category || '상품') + (subcategory ? ' - ' + subcategory : '');

  const products = await fetchProductsByCategory(category, subcategory);
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyMsg');

  if (!products.length) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = products.map(productCardHtml).join('');
})();
