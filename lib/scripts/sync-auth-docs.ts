import { auth } from '../auth';
import fs from 'fs';

async function sync() {
  const authSchema = await auth.api.generateOpenAPISchema();
  // We save this to a file that next-openapi-gen is configured to read
  fs.writeFileSync(
    './public/auth-spec.json',
    JSON.stringify(authSchema, null, 2)
  );
  console.log('✅ BetterAuth schema synced!');
}

sync();
