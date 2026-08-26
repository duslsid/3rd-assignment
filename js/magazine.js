/* =========================================================
   매거진 목록 페이지
   ========================================================= */

/* 본문에서 마크다운 기호를 걷어내고 미리보기 텍스트를 만든다 */
function toPreview(body) {
  return String(body || '')
    .replace(/^>\s?/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

(async function () {
  await initLayout();

  const articles = await fetchArticles();
  const list = document.getElementById('magList');

  if (!articles.length) {
    list.innerHTML = '<p class="font-price">등록된 기사가 없습니다.</p>';
    return;
  }

  list.innerHTML = articles
    .map(function (a) {
      const preview = a.subtitle ? a.subtitle + ' ' + toPreview(a.body) : toPreview(a.body);

      return (
        '<a class="mag-row" href="article.html?slug=' + encodeURIComponent(a.slug) + '">' +
        '<img src="' + esc(a.image_url) + '" alt="' + esc(a.title) + '">' +
        '<div class="mag-row-text">' +
        '<p class="mag-row-title font-price">' + esc(a.title) + '</p>' +
        '<p class="mag-row-preview font-pname">' + esc(preview) + '</p>' +
        '</div>' +
        '</a>'
      );
    })
    .join('');
})();
