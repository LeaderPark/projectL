const { renderLayout } = require("./Layout");
const { escapeHtml } = require("./ViewHelpers");

function renderNotFoundPage({
  title = "페이지를 찾을 수 없습니다",
  description = "요청한 페이지가 존재하지 않아요.",
} = {}) {
  return renderLayout({
    title,
    description,
    body: `
      <main class="page page--missing">
        <section class="panel panel--missing">
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
          <a class="button-link" href="/">홈으로 돌아가기</a>
        </section>
      </main>
    `,
  });
}

module.exports = {
  renderNotFoundPage,
};
