const test = require("node:test");
const assert = require("node:assert/strict");

const { createRiotAssetService } = require("../scripts/Riot/RiotAssetService");

test("riot asset service resolves icon metadata from Data Dragon and caches the manifest", async () => {
  const seenUrls = [];
  const service = createRiotAssetService({
    httpClient: {
      async get(url) {
        seenUrls.push(url);

        if (url === "https://versions.test") {
          return { data: ["99.1.1"] };
        }

        if (url === "https://cdn.test/cdn/99.1.1/data/ko_KR/champion.json") {
          return {
            data: {
              data: {
                Ahri: {
                  id: "Ahri",
                  name: "아리",
                  image: { full: "Ahri.png" },
                },
              },
            },
          };
        }

        if (url === "https://cdn.test/cdn/99.1.1/data/ko_KR/item.json") {
          return {
            data: {
              data: {
                6655: {
                  name: "루덴의 동반자",
                  image: { full: "6655.png" },
                },
              },
            },
          };
        }

        if (url === "https://cdn.test/cdn/99.1.1/data/ko_KR/summoner.json") {
          return {
            data: {
              data: {
                SummonerFlash: {
                  key: "4",
                  name: "점멸",
                  image: { full: "SummonerFlash.png" },
                },
              },
            },
          };
        }

        if (url === "https://cdn.test/cdn/99.1.1/data/ko_KR/runesReforged.json") {
          return {
            data: [
              {
                slots: [
                  {
                    runes: [
                      {
                        id: 8112,
                        name: "감전",
                        icon:
                          "perk-images/Styles/Domination/Electrocute/Electrocute.png",
                      },
                    ],
                  },
                ],
              },
            ],
          };
        }

        throw new Error(`unexpected url: ${url}`);
      },
    },
    versionsUrl: "https://versions.test",
    cdnBaseUrl: "https://cdn.test",
    fallbackVersion: "1.0.0",
  });

  const first = await service.getAssetManifest();
  const second = await service.getAssetManifest();

  assert.equal(first.version, "99.1.1");
  assert.equal(first, second);
  assert.equal(first.championAssets.ahri.imageUrl, "https://cdn.test/cdn/99.1.1/img/champion/Ahri.png");
  assert.equal(first.itemAssets[6655].imageUrl, "https://cdn.test/cdn/99.1.1/img/item/6655.png");
  assert.equal(first.spellAssets[4].imageUrl, "https://cdn.test/cdn/99.1.1/img/spell/SummonerFlash.png");
  assert.equal(
    first.runeAssets[8112].imageUrl,
    "https://cdn.test/cdn/img/perk-images/Styles/Domination/Electrocute/Electrocute.png"
  );
  assert.deepEqual(seenUrls, [
    "https://versions.test",
    "https://cdn.test/cdn/99.1.1/data/ko_KR/champion.json",
    "https://cdn.test/cdn/99.1.1/data/ko_KR/item.json",
    "https://cdn.test/cdn/99.1.1/data/ko_KR/summoner.json",
    "https://cdn.test/cdn/99.1.1/data/ko_KR/runesReforged.json",
  ]);
});
