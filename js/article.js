/* =========================================================
   매거진 전문 페이지
   ========================================================= */

/* 기사 본문(마크다운)을 HTML 로 변환한다 */
function renderBody(body) {
  const blocks = String(body || '').split(/\n\s*\n/);

  return blocks
    .map(function (block) {
      const text = block.trim();
      if (!text) return '';

      // 인용문
      if (text.indexOf('>') === 0) {
        const quote = text
          .split('\n')
          .map(function (line) {
            return esc(line.replace(/^>\s?/, ''));
          })
          .join('<br>');
        return '<blockquote>' + quote + '</blockquote>';
      }

      const html = esc(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // 굵은 글씨
        .replace(/\n/g, '<br>');

      return '<p>' + html + '</p>';
    })
    .join('');
}

(async function () {
  await initLayout();

  const slug = getParam('slug');

  if (!slug) {
    console.error('[매거진 전문] slug 파라미터가 없습니다.');
    location.replace('magazine.html');
    return;
  }

  const article = await fetchArticle(slug);

  if (!article) {
    document.getElementById('articleTitle').textContent = '기사를 찾을 수 없습니다.';
    return;
  }

  document.title = 'RUNNERS | ' + article.title;
  document.getElementById('articleTitle').textContent = article.title;
  document.getElementById('articleSubtitle').textContent = article.subtitle || '';

  // 왼쪽에 기사 이미지를 두고 그 오른쪽부터 본문이 흐르도록 배치한다
  document.getElementById('articleBody').innerHTML =
    '<img class="article-thumb" src="' + esc(article.image_url) + '" alt="' + esc(article.title) + '">' +
    renderBody(article.body);
})();
