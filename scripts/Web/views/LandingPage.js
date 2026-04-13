const { renderLayout } = require("./Layout");
const { PROJECT_DISPLAY_NAME } = require("../../Utils/Branding");

function renderLandingPage() {
  const body = `
    <main class="page page--landing">
      <section class="landing-card">
        <p class="hero-card__eyebrow">${PROJECT_DISPLAY_NAME} Server Record</p>
        <h1>서버 아이디 입력</h1>
        <p>확인하려는 디스코드 서버 아이디를 입력하면 해당 서버 전적 페이지로 바로 이동합니다.</p>
        <form
          class="server-id-form"
          action="/"
          method="get"
          data-server-id-form
          data-server-id-check-endpoint="/api/server-validation"
        >
          <label class="server-id-form__label" for="server-id-input">서버 아이디</label>
          <div class="server-id-form__controls">
            <input
              id="server-id-input"
              class="server-id-form__input"
              type="text"
              name="serverId"
              inputmode="numeric"
              autocomplete="off"
              placeholder="예: 123456789012345678"
              data-server-id-input
            />
            <button class="server-id-form__submit" type="submit">전적 보기</button>
          </div>
          <p class="server-id-form__hint" data-server-id-error hidden>
            서버 아이디를 숫자로 입력해 주세요.
          </p>
        </form>
      </section>
    </main>
  `;

  return renderLayout({
    title: `${PROJECT_DISPLAY_NAME} 서버 선택`,
    description: `Discord 서버 아이디를 입력해 해당 서버의 ${PROJECT_DISPLAY_NAME} 전적을 조회하세요.`,
    body,
    showHeader: false,
  });
}

module.exports = {
  renderLandingPage,
};
