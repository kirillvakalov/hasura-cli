import { createRequire } from 'node:module';
// @ts-ignore -- @types/node 20.x.x does not have `styleText`
import { styleText } from 'node:util';
import { install } from './install.js';

const { version } = createRequire(import.meta.url)('../package.json');

const HASURA_CLI_INSTALL =
  !process.env.HASURA_CLI_INSTALL ||
  process.env.HASURA_CLI_INSTALL === 'true' ||
  process.env.HASURA_CLI_INSTALL === '1';

if (HASURA_CLI_INSTALL) {
  await install(version);
} else {
  const styledPackageName = styleText(
    'bold',
    `@kirillvakalov/hasura-cli@${version}`,
  );
  const styledInstallEnvVar = styleText(
    'bold',
    `process.env.HASURA_CLI_INSTALL=${HASURA_CLI_INSTALL}`,
  );
  const skipInstallMessage = `Skipping installation of Hasura CLI ${styledInstallEnvVar}`;

  console.log(styledPackageName);
  console.log(skipInstallMessage);
}
