const fs = require("fs");

export const getReplayData = (path) => {
  const decoded = fs
    .readFileSync(path, "utf8")
    .toString()
    .split("\n")
    .slice(0, 20)
    .join("");

  const startIndex = decoded.indexOf('{"gameLength"');
  const endIndex = decoded.indexOf(']"}');

  try {
    const jsonStr = decoded.substring(startIndex, endIndex) + ']"}';
    return JSON.parse(jsonStr);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("Unable to parse replay data from this replay file.");
    } else {
      throw new Error(
        "An unexpected error has occured while trying to parse replay data."
      );
    }
  }
};
