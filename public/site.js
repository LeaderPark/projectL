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

function renderSearchResults(container, items, query = "") {
  const searchForm = document.querySelector("[data-player-search]");
  const playerPathPrefix =
    searchForm?.dataset.playerPathPrefix ?? "/players";
  const input = document.querySelector("[data-player-search-input]");

  if (!items.length) {
    // 검색어가 있는데 결과가 없으면 침묵하지 말고 알려준다 (가이드: 상태 가시성/검색성).
    if (query) {
      container.innerHTML = `<p class="site-search__empty" role="status">‘${escapeHtml(query)}’ 검색 결과가 없어요.</p>`;
      container.classList.add("is-open");
      if (input) {
        input.setAttribute("aria-expanded", "true");
        input.removeAttribute("aria-activedescendant");
      }
      return;
    }

    container.classList.remove("is-open");
    container.innerHTML = "";
    if (input) {
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
    return;
  }

  container.innerHTML = items
    .map(
      (item, index) =>
        `<a class="site-search__result" role="option" id="site-search-option-${index}" href="${playerPathPrefix}/${encodeURIComponent(item.discordId)}">${escapeHtml(item.name)}</a>`
    )
    .join("");
  container.classList.add("is-open");
  if (input) {
    input.setAttribute("aria-expanded", "true");
  }
}

function wirePlayerSearch() {
  const input = document.querySelector("[data-player-search-input]");
  const results = document.querySelector("[data-player-search-results]");

  if (!input || !results) {
    return;
  }

  let pendingRequest = null;
  let debounceTimer = null;
  let activeIndex = -1;

  const options = () =>
    Array.from(results.querySelectorAll(".site-search__result"));

  function setActive(nextIndex) {
    const opts = options();
    if (!opts.length) {
      activeIndex = -1;
      return;
    }
    activeIndex = (nextIndex + opts.length) % opts.length;
    opts.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
    const active = opts[activeIndex];
    if (active) {
      input.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
    }
  }

  function closeResults() {
    results.classList.remove("is-open");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }

  input.addEventListener("input", () => {
    const query = input.value.trim();
    activeIndex = -1;
    window.clearTimeout(debounceTimer);

    if (query.length < 1) {
      renderSearchResults(results, []);
      return;
    }

    // Debounce to avoid a fetch on every keystroke.
    debounceTimer = window.setTimeout(async () => {
      pendingRequest = query;
      const items = await fetchPlayerSuggestions(query);
      if (pendingRequest !== query) {
        return;
      }
      renderSearchResults(results, items, query);
    }, 200);
  });

  // Keyboard navigation for the autocomplete listbox (WAI-ARIA combobox).
  input.addEventListener("keydown", (event) => {
    const opts = options();

    if (event.key === "ArrowDown") {
      if (!opts.length) {
        return;
      }
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      if (!opts.length) {
        return;
      }
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && opts[activeIndex]) {
        event.preventDefault();
        window.location.href = opts[activeIndex].href;
      }
    } else if (event.key === "Escape") {
      closeResults();
    }
  });

  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      closeResults();
    }, 120);
  });

  input.addEventListener("focus", () => {
    if (results.innerHTML.trim()) {
      results.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
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

  // Live region so screen readers are told when matches are appended or fail.
  let status = document.querySelector("[data-load-more-status]");
  if (!status) {
    status = document.createElement("p");
    status.className = "match-feed__status";
    status.setAttribute("data-load-more-status", "");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    button.insertAdjacentElement("afterend", status);
  }

  button.addEventListener("click", async () => {
    if (button.disabled) {
      return;
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    const originalText = button.textContent;
    button.textContent = "불러오는 중…";
    status.textContent = "";
    status.classList.remove("match-feed__status--error");

    const guildId = button.dataset.guildId ?? "";
    const discordId = button.dataset.discordId ?? "";
    const offset = Number(button.dataset.nextOffset) || 0;

    const restoreButton = () => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = originalText;
    };

    try {
      const response = await fetch(
        `/${encodeURIComponent(guildId)}/players/${encodeURIComponent(discordId)}/matches?offset=${offset}`
      );
      if (!response.ok) {
        throw new Error("failed to load more matches");
      }

      const payload = await response.json();
      let added = 0;
      if (payload.html) {
        const before = feed.children.length;
        feed.insertAdjacentHTML("beforeend", payload.html);
        added = feed.children.length - before;
      }
      status.textContent = added
        ? `경기 ${added}개를 더 불러왔어요.`
        : "더 불러올 경기가 없어요.";

      if (payload.hasMore) {
        button.dataset.nextOffset = String(payload.nextOffset);
        restoreButton();
      } else {
        button.remove();
      }
    } catch (_error) {
      restoreButton();
      status.textContent = "경기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
      status.classList.add("match-feed__status--error");
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

  const submit = form.querySelector('[type="submit"]');

  const showError = (message) => {
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    input.focus();
  };

  form.addEventListener("submit", async (event) => {
    const serverId = input.value.trim();
    const isValid = /^\d+$/.test(serverId);

    if (!isValid) {
      event.preventDefault();
      showError("서버 아이디를 숫자로 입력해 주세요.");
      return;
    }

    event.preventDefault();
    const serverIdCheckEndpoint =
      form.dataset.serverIdCheckEndpoint ?? "/api/server-validation";

    if (submit) {
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
    }

    try {
      const response = await fetch(
        `${serverIdCheckEndpoint}?serverId=${encodeURIComponent(serverId)}`
      );

      if (!response.ok) {
        throw new Error("server id validation failed");
      }

      const payload = await response.json();
      if (!payload?.registered) {
        showError("등록되지 않은 서버 아이디입니다.");
        return;
      }
    } catch (_error) {
      showError("서버 아이디를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
      }
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

// 닉네임 새로고침: POST 폼 전체 리로드 직전 즉시 상태 피드백 (가이드: 상태 가시성).
function wireRefreshForm() {
  const form = document.querySelector("[data-refresh-form]");
  const button = form?.querySelector("[data-refresh-button]");
  if (!form || !button) {
    return;
  }

  form.addEventListener("submit", () => {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "갱신 중…";
  });
}

wireRefreshForm();

// 랭킹 표 클라이언트 정렬 (가이드: 찾기/검색성). 머리글 버튼으로 정렬·방향 토글.
function wireRankingSort() {
  document.querySelectorAll("[data-sortable-table]").forEach((table) => {
    const tbody = table.querySelector("tbody");
    if (!tbody) {
      return;
    }

    const originalRows = Array.from(tbody.querySelectorAll("tr"));

    const valueFor = (row, key) => {
      if (key === "name") {
        return (row.children[1]?.textContent ?? "").trim().toLowerCase();
      }
      if (key === "wins") {
        return Number(row.dataset.wins ?? 0);
      }
      if (key === "winrate") {
        return Number(row.dataset.winrate ?? 0);
      }
      return Number(row.dataset.rank ?? 0);
    };

    table.querySelectorAll("[data-sort-key]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.sortKey;
        const th = button.closest("th");
        const ascending = th?.getAttribute("aria-sort") !== "ascending";

        // 다른 머리글의 정렬 표시 초기화.
        table
          .querySelectorAll("th[aria-sort]")
          .forEach((other) => other.removeAttribute("aria-sort"));
        if (th) {
          th.setAttribute("aria-sort", ascending ? "ascending" : "descending");
        }

        const sorted = originalRows.slice().sort((a, b) => {
          const av = valueFor(a, key);
          const bv = valueFor(b, key);
          let cmp;
          if (typeof av === "number" && typeof bv === "number") {
            cmp = av - bv;
          } else {
            cmp = String(av).localeCompare(String(bv), "ko");
          }
          return ascending ? cmp : -cmp;
        });

        sorted.forEach((row) => tbody.appendChild(row));
      });
    });
  });
}

wireRankingSort();

// 경기 목록 필터: 이미 로드된 카드를 플레이어 이름 등 텍스트로 거른다 (가이드: 찾기/인지부하).
function wireMatchFilter() {
  const input = document.querySelector("[data-match-filter]");
  const feed = document.querySelector("#match-timeline-feed");
  const emptyMessage = document.querySelector("[data-match-filter-empty]");
  if (!input || !feed) {
    return;
  }

  const cards = Array.from(feed.querySelectorAll(".match-row"));

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const match = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) {
        visible += 1;
      }
    });

    if (emptyMessage) {
      emptyMessage.hidden = !(query && visible === 0);
    }
  });
}

wireMatchFilter();
