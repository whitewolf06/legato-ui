import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import process from "node:process";
import { assertPagesProvenance } from "./pages-provenance.mjs";

const env = process.env;
const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
const repo = env.GITHUB_REPOSITORY;
const landing = env.LEGATO_LANDING_REPO;
if (!/^[\w-]+\/[\w.-]+$/.test(landing || "")) throw new Error("Set LEGATO_LANDING_REPO to the landing repository");
async function get(path, token) {
  const response = await fetch("https://api.github.com/repos/" + path, { headers: {
    Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"
  } });
  if (!response.ok) throw new Error("Cannot verify " + path + " (HTTP " + response.status + ")");
  return response.json();
}
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const [libraryHead, landingHead] = await Promise.all([
  get(repo + "/commits/main", env.GH_TOKEN), get(landing + "/commits/main", env.LANDING_TOKEN || env.GH_TOKEN)
]);
let run = event.workflow_run;
if (env.GITHUB_EVENT_NAME === "workflow_dispatch" && env.GITHUB_REF === "refs/heads/main") {
  const runs = await get(repo + "/actions/workflows/ci.yml/runs?event=push&branch=main&status=success&head_sha=" + head, env.GH_TOKEN);
  run = runs.workflow_runs.find((item) => item.head_sha === head);
}
const source = assertPagesProvenance({
  event: { ...event, workflow_run: run }, repository: repo, checkedOutSha: head, latestMainSha: libraryHead.sha
});
const expected = env.EXPECTED_LANDING || event.inputs?.landing_sha;
if (!/^[a-f0-9]{40}$/.test(landingHead.sha) || (expected && expected !== landingHead.sha)) throw new Error("Superseded or invalid landing revision");
appendFileSync(env.GITHUB_OUTPUT, `library=${source.revision}\nci_run=${source.runId}\nlanding=${landingHead.sha}\n`);
process.stdout.write("Verified library " + source.revision + " and landing " + landingHead.sha + "\n");
