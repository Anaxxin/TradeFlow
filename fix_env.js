const fs = require('fs');

const content = `# ------------------------------------------------------------------------------
# SUPABASE DATABASE CONNECTION
# ------------------------------------------------------------------------------
DATABASE_URL="postgresql://postgres.fnrxxlmtuniybwqwuxwd:Anikin2115@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.fnrxxlmtuniybwqwuxwd:Anikin2115@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"

# ------------------------------------------------------------------------------
# OTHER SETTINGS
# ------------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;

fs.writeFileSync('.env', content);
console.log('Fixed .env file');
