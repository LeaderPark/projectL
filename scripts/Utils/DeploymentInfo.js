const packageJson = require("../../package.json");

const DEFAULT_LOCALE = "ko-KR";
const DEFAULT_TIME_ZONE = "Asia/Seoul";

function readDeploymentInfo(env = process.env) {
  return {
    version: packageJson.version ?? "0.0.0",
    commit: env.BOT_DEPLOY_COMMIT ?? "",
    message: env.BOT_DEPLOY_MESSAGE ?? "",
    deployedAt: env.BOT_DEPLOYED_AT ?? "",
  };
}

function formatDeploymentTimestamp(
  deployedAt,
  { locale = DEFAULT_LOCALE, timeZone = DEFAULT_TIME_ZONE } = {}
) {
  if (!deployedAt) {
    return "";
  }

  const parsedDate = new Date(deployedAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return deployedAt;
  }

  return parsedDate.toLocaleString(locale, { timeZone });
}

function formatDeploymentInfoMessage(
  info = readDeploymentInfo(),
  { locale = DEFAULT_LOCALE, timeZone = DEFAULT_TIME_ZONE } = {}
) {
  const lines = ["머글들의 피난처 내전 봇", `버전: v${info.version}`];
  const hasDeploymentInfo = Boolean(info.commit || info.message || info.deployedAt);

  if (!hasDeploymentInfo) {
    lines.push("배포 정보: 아직 기록이 없어요.");
    return lines.join("\n");
  }

  if (info.commit) {
    lines.push(`배포 커밋: ${info.commit}`);
  }

  if (info.message) {
    lines.push(`업데이트: ${info.message}`);
  }

  if (info.deployedAt) {
    lines.push(
      `배포 시각: ${formatDeploymentTimestamp(info.deployedAt, {
        locale,
        timeZone,
      })}`
    );
  }

  return lines.join("\n");
}

module.exports = {
  readDeploymentInfo,
  formatDeploymentInfoMessage,
  formatDeploymentTimestamp,
};
