const fs = require("node:fs");

function parseStatsJson(statsJson) {
  if (Array.isArray(statsJson)) {
    return statsJson;
  }

  if (typeof statsJson !== "string") {
    throw new Error("PlayerStats[] parsed to null");
  }

  return JSON.parse(statsJson);
}

function parseROFLBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("ROFL input must be a Buffer");
  }

  if (buffer.length < 33) {
    throw new Error("ROFL file is too small");
  }

  const gameVersion = buffer
    .subarray(15, 29)
    .toString("utf8")
    .replace(/\0+$/g, "");
  const metadataLength = buffer.readInt32LE(buffer.length - 4);
  const metadataStart = buffer.length - metadataLength - 4;

  if (
    metadataLength <= 0 ||
    metadataStart < 0 ||
    metadataStart + metadataLength > buffer.length - 4
  ) {
    throw new Error("Invalid ROFL metadata length");
  }

  const rawMetadata = JSON.parse(
    buffer.subarray(metadataStart, metadataStart + metadataLength).toString("utf8")
  );

  if (!rawMetadata) {
    throw new Error("RawMetadata parsed to null");
  }

  return {
    gameLength: rawMetadata.gameLength,
    gameVersion,
    lastGameChunkId: rawMetadata.lastGameChunkId,
    lastKeyframeId: rawMetadata.lastKeyFrameId,
    statsJson: parseStatsJson(rawMetadata.statsJson),
  };
}

async function parseROFL(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  return parseROFLBuffer(buffer);
}

module.exports = {
  parseROFL,
  parseROFLBuffer,
};
