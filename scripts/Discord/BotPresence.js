const { ActivityType } = require("discord.js");

function buildBotPresenceActivity() {
  return {
    name: '시스템 가동 "준비완료"',
    type: ActivityType.Streaming,
    url: "https://www.youtube.com/watch?v=MviIDKKvex0",
  };
}

module.exports = {
  buildBotPresenceActivity,
};
