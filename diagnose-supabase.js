// Diagnóstico completo de conexión a Supabase
const { Client } = require('pg');
require('dotenv').config({ path: './apps/api/.env' });

const originalUrl = process.env.DATABASE_URL;
console.log('🔍 Diagnosticando conexión a Supabase...');
console.log('📋 URL original:', originalUrl.replace(/:[^:@]*@/, ':****@'));

// Diferentes variaciones de URL para probar
const urlVariations = [
  // URL original
  originalUrl,
  
  // Con pooler específico
  originalUrl.replace('db.bcpanxxwahxbvxueeioj.supabase.co:5432', 'aws-0-sa-east-1.pooler.supabase.com:6543'),
  
  // Con pooler genérico  
  originalUrl.replace('db.bcpanxxwahxbvxueeioj.supabase.co:5432', 'aws-0-sa-east-1.pooler.supabase.com:5432'),
  
  // Sin especificar puerto
  originalUrl.replace(':5432', ''),
  
  // Con puerto 6543 (Transaction mode)
  originalUrl.replace(':5432', ':6543'),
];

async function testUrl(url, index) {
  const client = new Client({ 
    connectionString: url,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log(`\n🧪 Prueba ${index + 1}: ${url.replace(/:[^:@]*@/, ':****@')}`);
    await client.connect();
    
    const result = await client.query('SELECT version()');
    console.log('✅ ¡CONEXIÓN EXITOSA!');
    console.log('📊 PostgreSQL:', result.rows[0].version.split(' ')[1]);
    
    await client.end();
    return url;
    
  } catch (error) {
    console.log('❌ Falló:', error.code || error.message.split('\n')[0]);
    try { await client.end(); } catch {}
    return null;
  }
}

async function diagnose() {
  console.log('🚀 Iniciando diagnóstico...\n');
  
  for (let i = 0; i < urlVariations.length; i++) {
    const workingUrl = await testUrl(urlVariations[i], i);
    
    if (workingUrl) {
      console.log('\n🎉 SOLUCIÓN ENCONTRADA!');
      console.log('✏️  Actualiza tu .env con esta URL:');
      console.log(`DATABASE_URL="${workingUrl}"`);
      
      // Crear archivo con la URL correcta
      const fs = require('fs');
      const envContent = fs.readFileSync('./apps/api/.env', 'utf8');
      const newEnvContent = envContent.replace(
        /DATABASE_URL="[^"]*"/,
        `DATABASE_URL="${workingUrl}"`
      );
      
      fs.writeFileSync('./apps/api/.env.fixed', newEnvContent);
      console.log('💾 Guardado en apps/api/.env.fixed');
      console.log('\n📋 Próximos pasos:');
      console.log('1. copy apps\\api\\.env.fixed apps\\api\\.env');
      console.log('2. npm run db:migrate');
      console.log('3. npm run db:seed');
      console.log('4. npm run dev');
      return;
    }
  }
  
  console.log('\n❌ Ninguna URL funcionó. Posibles causas:');
  console.log('1. Proyecto de Supabase pausado/inactivo');
  console.log('2. Contraseña incorrecta');
  console.log('3. Firewall/proxy bloqueando la conexión');
  console.log('4. Región incorrecta');
  
  console.log('\n🔧 Soluciones sugeridas:');
  console.log('1. Ve a Supabase Dashboard y verifica que el proyecto esté activo');
  console.log('2. Settings > Database > Reset password');
  console.log('3. Intenta desde otra red (datos móviles)');
  console.log('4. Verifica que la región sea correcta');
}

diagnose();