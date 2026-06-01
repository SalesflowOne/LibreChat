import { writeFileSync } from 'node:fs';

const apiUrl = process.env.LIBRECHAT_API_URL?.trim() ?? '';

writeFileSync(
  'proxy.config.json',
  JSON.stringify({ apiUrl }, null, 2),
  'utf8',
);

console.log(
  apiUrl
    ? `proxy.config.json written (apiUrl length ${apiUrl.length})`
    : 'proxy.config.json written with empty apiUrl — set LIBRECHAT_API_URL on Vercel',
);
