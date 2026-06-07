// Parses a JSON string that was stored in the database, returning `fallback`
// for empty/non-string/invalid input. Shared by Query.js and the public site.
function parseStoredJson(value, fallback) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

module.exports = {
  parseStoredJson,
};
