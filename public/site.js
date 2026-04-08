function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchPlayerSuggestions(query) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    return [];
  }

  return response.json();
}

function renderSearchResults(container, items) {
  if (!items.length) {
    container.classList.remove("is-open");
    container.innerHTML = "";
    return;
  }

  container.innerHTML = items
    .map(
      (item) =>
        `<a class="site-search__result" href="/players/${encodeURIComponent(item.discordId)}">${escapeHtml(item.name)}</a>`
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
