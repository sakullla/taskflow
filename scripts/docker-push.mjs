import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const username = process.env.DOCKERHUB_USERNAME;
const tag = process.env.IMAGE_TAG || "latest";

if (!username) {
  console.error("Missing DOCKERHUB_USERNAME. Example:");
  console.error("  DOCKERHUB_USERNAME=yourname IMAGE_TAG=v2 npm run docker:push");
  process.exit(1);
}

const image = `${username}/taskflow:${tag}`;

console.log(`Pushing image as ${image}`);
run("docker", ["info"]);
run("docker", ["build", "-f", "Dockerfile", "-t", image, "."]);
run("docker", ["push", image]);

console.log("Done.");
console.log(`- ${image}`);
