import fs from "node:fs";

const version = JSON.parse(
  fs.readFileSync(new URL("../backend-version.json", import.meta.url), "utf-8"),
);
const token = process.env.GH_TOKEN;

if (!token) {
  throw new Error(
    "GH_TOKEN is required to verify the private backend release gate.",
  );
}

const response = await fetch(
  `https://api.github.com/repos/${version.repository}/commits/${version.sha}/check-runs?per_page=100`,
  {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  },
);

if (!response.ok) {
  throw new Error(
    `Unable to read backend checks: ${response.status} ${response.statusText}`,
  );
}

const payload = await response.json();
const gates = payload.check_runs.filter(
  (check) => check.name === "backend-release-gate",
);
if (
  gates.length === 0 ||
  !gates.some(
    (check) => check.status === "completed" && check.conclusion === "success",
  )
) {
  throw new Error(
    `Backend ${version.sha} does not have a successful backend-release-gate.`,
  );
}

console.log(
  `Verified backend-release-gate for ${version.repository}@${version.sha}.`,
);
