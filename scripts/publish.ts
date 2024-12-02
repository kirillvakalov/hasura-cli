import { readFile, writeFile } from 'node:fs/promises';
import { Octokit } from '@octokit/core';
import semver from 'semver';
import { $ } from 'zx';

// The maximum major version of Hasura CLI that we want to publish
const MAX_MAJOR_VERSION = 2;

const getNpmPublishedVersions = async () => {
  const response = await fetch(
    'https://registry.npmjs.org/@kirillvakalov/hasura-cli',
  );
  const data = (await response.json()) as { versions: Record<string, unknown> };
  // These versions were published during testing and unpublished later. Since we can't
  // publish the same version twice on npm, we need to exclude them from publishing.
  const unpublishedVersions = ['2.0.8', '2.36.9', '2.38.1'];

  return [...unpublishedVersions, ...Object.keys(data.versions)];
};

const getGithubReleases = async () => {
  const octokit = new Octokit();
  // https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#list-releases
  const releases = await octokit.request('GET /repos/{owner}/{repo}/releases', {
    owner: 'hasura',
    repo: 'graphql-engine',
  });
  // Remove "v" prefix and filter out invalid versions
  const versions = releases.data
    .map(({ tag_name }) => semver.clean(tag_name))
    .filter(Boolean) as string[];
  const allowedVersions = versions.filter(
    (version) => semver.major(version) <= MAX_MAJOR_VERSION,
  );
  const stableVersions = allowedVersions.filter(
    (version) => semver.prerelease(version) === null,
  );

  return stableVersions;
};

const versionsToPublish = async () => {
  const npmVersions = await getNpmPublishedVersions();
  const githubVersions = await getGithubReleases();
  return githubVersions.filter((version) => !npmVersions.includes(version));
};

const updatePackageJson = async (version: string) => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  packageJson.version = version;
  await writeFile('package.json', JSON.stringify(packageJson, null, 2), 'utf8');
};

const publish = async () => {
  const versions = await versionsToPublish();
  for (const version of versions) {
    console.log(`Publishing version ${version}`);

    await updatePackageJson(version);
    await $`git add package.json`;
    await $`git commit -m "chore: 🔖 release ${version}"`;
    await $`git tag ${version}`;
    await $`git push`;
    await $`git push origin ${version}`;
    await $`pnpm publish --access public`;
    await $`sleep 10`;
  }
};

await publish();
