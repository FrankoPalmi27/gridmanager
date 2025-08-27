// Probar con el pooler correcto de Supabase
const { Client } = require('pg');

const projectRef = 'bcpanxxwahxbvxueeioj';
const password = 'kuVindgKoRqZxYmn';

// Diferentes configuraciones de pooler que Supabase usa
const poolerConfigs = [
  // Session pooler
  `postgresql://postgres.${projectRef}:${password}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  
  // Transaction pooler  
  `postgresql://postgres.${projectRef}:${password}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  
  // Direct connection
  `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
  
  // Con SSL explícito
  `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`,
];

async function testPooler(url, name) {
  const client = new Client({ 
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
  
  try {
    console.log(`🧪 Probando ${name}...`);
    await client.connect();
    await client.query('SELECT 1');
    console.log(`✅ ¡${name} FUNCIONA!`);
    console.log(`📋 URL: ${url}`);
    await client.end();
    return url;
  } catch (error) {
    console.log(`❌ ${name} falló: ${error.code || error.message.split('\n')[0]}`);
    try { await client.end(); } catch {}
    return null;
  }
}

async function findWorkingPooler() {
  const configs = [
    [poolerConfigs[0], 'Session Pooler (6543)'],
    [poolerConfigs[1], 'Transaction Pooler (5432)'], 
    [poolerConfigs[2], 'Direct Connection'],
    [poolerConfigs[3], 'Direct Connection + SSL'],
  ];
  
  for (const [url, name] of configs) {
    const working = await testPooler(url, name);
    if (working) {
      console.log('\n🎉 CONEXIÓN ENCONTRADA!');
      console.log('📝 Actualiza tu apps/api/.env:');
      console.log(`DATABASE_URL="${working}"`);
      return working;
    }
  }
  
  console.log('\n❌ Ningún pooler funcionó.');
  console.log('🔧 Ve a Supabase Dashboard y verifica:');
  console.log('1. Proyecto activo (no pausado)');
  console.log('2. Settings > Database > Connection string');
  console.log('3. ¿La región es correcta?');
}

findWorkingPooler();