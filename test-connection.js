// Script para probar la conexión a Supabase
const { Client } = require('pg');
require('dotenv').config({ path: './apps/api/.env' });

console.log('🔍 Probando conexión a Supabase...');
console.log('DATABASE_URL configurado:', process.env.DATABASE_URL ? 'Sí' : 'No');

if (!process.env.DATABASE_URL) {
  console.log('❌ No se encontró DATABASE_URL en apps/api/.env');
  console.log('🔧 Edita el archivo y reemplaza TU-PASSWORD-AQUI con tu contraseña real');
  process.exit(1);
}

// Verificar si tiene la contraseña placeholder
if (process.env.DATABASE_URL.includes('TU-PASSWORD-AQUI')) {
  console.log('❌ Aún tienes "TU-PASSWORD-AQUI" en la DATABASE_URL');
  console.log('🔧 Reemplázalo con tu contraseña real de Supabase');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Conexión exitosa a Supabase!');
    await client.query('SELECT version()');
    console.log('✅ Base de datos respondió correctamente');
    await client.end();
    
    console.log('');
    console.log('🚀 Todo listo! Ahora ejecuta:');
    console.log('   npm run db:migrate');
    console.log('   npm run db:seed');  
    console.log('   npm run dev');
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('1. Verifica que la contraseña sea correcta');
    console.log('2. Ve a Supabase → Settings → Database → Reset password');
    console.log('3. Verifica que el proyecto esté activo en Supabase');
    process.exit(1);
  }
}

testConnection();