function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchPlayerSuggestions(query) {
  const searchForm = document.querySelector("[data-player-search]");
  const searchEndpoint =
    searchForm?.dataset.searchEndpoint ?? "/api/search";
  const response = await fetch(
    `${searchEndpoint}?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) {
    return [];
  }

  return response.json();
}

function renderSearchResults(container, items) {
  const searchForm = document.querySelector("[data-player-search]");
  const playerPathPrefix =
    searchForm?.dataset.playerPathPrefix ?? "/players";

  if (!items.length) {
    container.classList.remove("is-open");
    container.innerHTML = "";
    return;
  }

  container.innerHTML = items
    .map(
      (item) =>
        `<a class="site-search__result" href="${playerPathPrefix}/${encodeURIComponent(item.discordId)}">${escapeHtml(item.name)}</a>`
    )
    .join("");
  container.classList.add("is-open");
}

function wirePlayerSearch() {
  const input = document.querySelector("[data-player-search-input]");
  const results = document.querySelector("[data-player-search-results]");

  if (!input || !results) {
    return;
  }

  let pendingRequest = null;

  input.addEventListener("input", async () => {
    const query = input.value.trim();
    if (query.length < 1) {
      renderSearchResults(results, []);
      return;
    }

    pendingRequest = query;
    const items = await fetchPlayerSuggestions(query);

    if (pendingRequest !== query) {
      return;
    }

    renderSearchResults(results, items);
  });

  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      results.classList.remove("is-open");
    }, 120);
  });

  input.addEventListener("focus", () => {
    if (results.innerHTML.trim()) {
      results.classList.add("is-open");
    }
  });
}

wirePlayerSearch();

function handleMatchToggle(button) {
  const detailId = button.getAttribute("aria-controls");
  const detail = detailId
    ? document.querySelector(`[data-match-detail="${detailId}"]`)
    : null;

  if (!detail) {
    return;
  }

  const isExpanded = button.getAttribute("aria-expanded") === "true";
  document.querySelectorAll("[data-match-toggle]").forEach((otherButton) => {
    const otherDetailId = otherButton.getAttribute("aria-controls");
    const otherDetail = otherDetailId
      ? document.querySelector(`[data-match-detail="${otherDetailId}"]`)
      : null;
    otherButton.setAttribute("aria-expanded", "false");
    if (otherDetail) {
      otherDetail.hidden = true;
    }
  });

  button.setAttribute("aria-expanded", isExpanded ? "false" : "true");
  detail.hidden = isExpanded;
}

function handleMatchTab(button) {
  const panelId = button.dataset.matchTab;
  const detailId = button.dataset.matchTabTarget;
  if (!panelId || !detailId) {
    return;
  }

  document
    .querySelectorAll(`[data-match-tab-target="${detailId}"]`)
    .forEach((tabButton) => {
      tabButton.classList.toggle("is-active", tabButton === button);
      tabButton.setAttribute(
        "aria-selected",
        tabButton === button ? "true" : "false"
      );
    });

  document
    .querySelectorAll(`[data-match-panel-parent="${detailId}"]`)
    .forEach((panel) => {
      const isActive = panel.dataset.matchPanel === panelId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
}

function wireMatchRows() {
  // Event delegation so dynamically appended match cards (via "더보기") work too.
  document.addEventListener("click", (event) => {
    const toggleButton = event.target.closest("[data-match-toggle]");
    if (toggleButton) {
      handleMatchToggle(toggleButton);
      return;
    }

    const tabButton = event.target.closest("[data-match-tab]");
    if (tabButton) {
      handleMatchTab(tabButton);
    }
  });
}

wireMatchRows();

function wireLoadMoreMatches() {
  const button = document.querySelector("[data-load-more-matches]");
  const feed = document.querySelector("[data-player-match-feed]");

  if (!button || !feed) {
    return;
  }

  button.addEventListener("click", async () => {
    if (button.disabled) {
      return;
    }

    button.disabled = true;
    const guildId = button.dataset.guildId ?? "";
    const discordId = button.dataset.discordId ?? "";
    const offset = Number(button.dataset.nextOffset) || 0;

    try {
      const response = await fetch(
        `/${encodeURIComponent(guildId)}/players/${encodeURIComponent(discordId)}/matches?offset=${offset}`
      );
      if (!response.ok) {
        throw new Error("failed to load more matches");
      }

      const payload = await response.json();
      if (payload.html) {
        feed.insertAdjacentHTML("beforeend", payload.html);
      }

      if (payload.hasMore) {
        button.dataset.nextOffset = String(payload.nextOffset);
        button.disabled = false;
      } else {
        button.remove();
      }
    } catch (_error) {
      button.disabled = false;
    }
  });
}

wireLoadMoreMatches();

function wireServerIdForm() {
  const form = document.querySelector("[data-server-id-form]");
  const input = document.querySelector("[data-server-id-input]");
  const error = document.querySelector("[data-server-id-error]");

  if (!form || !input) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    const serverId = input.value.trim();
    const isValid = /^\d+$/.test(serverId);

    if (!isValid) {
      event.preventDefault();
      if (error) {
        error.hidden = false;
      }
      input.focus();
      return;
    }

    event.preventDefault();
    const serverIdCheckEndpoint =
      form.dataset.serverIdCheckEndpoint ?? "/api/server-validation";

    try {
      const response = await fetch(
        `${serverIdCheckEndpoint}?serverId=${encodeURIComponent(serverId)}`
      );

      if (!response.ok) {
        throw new Error("server id validation failed");
      }

      const payload = await response.json();
      if (!payload?.registered) {
        window.alert("등록되지 않은 서버 아이디입니다.");
        input.focus();
        return;
      }
    } catch (_error) {
      window.alert("서버 아이디를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      input.focus();
      return;
    }

    window.location.href = `/${encodeURIComponent(serverId)}`;
  });

  input.addEventListener("input", () => {
    if (error) {
      error.hidden = true;
    }
  });
}

wireServerIdForm();
