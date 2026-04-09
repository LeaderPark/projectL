const test = require("node:test");
const assert = require("node:assert/strict");

const { createChampionNameService } = require("../scripts/Riot/ChampionNameService");

test("champion name service fetches korean champion names from the api and caches the result", async () => {
  const seenUrls = [];
  const service = createChampionNameService({
    httpClient: {
      async get(url) {
        seenUrls.push(url);

        if (url === "https://versions.test") {
          return {
            data: ["99.1.1"],
          };
        }

        if (
          url ===
          "https://cdn.test/cdn/99.1.1/data/ko_KR/champion.json"
        ) {
          return {
            data: {
              data: {
                Ahri: {
                  id: "Ahri",
                  name: "아리",
                },
                Kaisa: {
                  id: "Kaisa",
                  name: "카이사",
                },
                MonkeyKing: {
                  id: "MonkeyKing",
                  name: "오공",
                },
              },
            },
          };
        }

        throw new Error(`unexpected url: ${url}`);
      },
    },
    versionsUrl: "https://versions.test",
    championCdnBaseUrl: "https://cdn.test",
    fallbackVersion: "1.0.0",
  });

  const first = await service.getChampionNameMap();
  const second = await service.getChampionNameMap();

  assert.equal(first.ahri, "아리");
  assert.equal(first.kaisa, "카이사");
  assert.equal(first.monkeyking, "오공");
  assert.equal(first.wukong, "오공");
  assert.equal(first, second);
  assert.deepEqual(seenUrls, [
    "https://versions.test",
    "https://cdn.test/cdn/99.1.1/data/ko_KR/champion.json",
  ]);
});
