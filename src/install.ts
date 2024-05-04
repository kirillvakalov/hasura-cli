import { chmodSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';

/**
 * Hasura CLI assets naming pattern:
 * https://github.com/hasura/graphql-engine/releases
 * cli-hasura-{platform}-{arch}[.exe]
 * platform: darwin, linux, windows
 * arch: amd64, arm64
 * Note: Hasura CLI for Windows is only available for amd64 architecture
 */
const getUrl = (tag: string) => {
  const prefix = 'cli-hasura';
  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const arch = platform === 'windows' ? 'amd64' : process.arch;
  const ext = platform === 'windows' ? '.exe' : '';
  const assetName = `${prefix}-${platform}-${arch}${ext}`;

  return `https://github.com/hasura/graphql-engine/releases/download/${tag}/${assetName}`;
};

const download = async (url: string, destPath: URL) => {
  const response = await fetch(url);
  if (response.body) {
    await pipeline(
      Readable.fromWeb(response.body as ReadableStream),
      createWriteStream(destPath),
    );
  }
};

export const install = async (version: string) => {
  const destPath = new URL('../bin/hasura', import.meta.url);
  const url = getUrl(`v${version}`);
  await download(url, destPath);
  chmodSync(destPath, '755');
};
