const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'task_manager',
};

async function seedUsers() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('✅ Password hasheada');

    // Crear 10 usuarios
    let created = 0;
    let skipped = 0;

    for (let i = 1; i <= 10; i++) {
      const email = `user${i}@example.com`;
      const name = `Usuario ${i}`;

      try {
        // Verificar si el usuario ya existe
        const checkQuery = 'SELECT id FROM users WHERE email = $1';
        const checkResult = await client.query(checkQuery, [email]);

        if (checkResult.rows.length > 0) {
          console.log(`⏭️  Usuario ${email} ya existe, saltando...`);
          skipped++;
          continue;
        }

        // Insertar usuario
        const insertQuery = `
          INSERT INTO users (email, password, name)
          VALUES ($1, $2, $3)
          RETURNING id, email, name
        `;

        const result = await client.query(insertQuery, [
          email,
          hashedPassword,
          name,
        ]);

        console.log(
          `✅ Usuario creado: ${result.rows[0].email} (${result.rows[0].name})`,
        );
        created++;
      } catch (err) {
        console.error(`❌ Error creando usuario ${email}:`, err.message);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   - Usuarios creados: ${created}`);
    console.log(`   - Usuarios saltados: ${skipped}`);
    console.log(`   - Total: ${created + skipped}/10`);
    console.log('\n🔑 Credenciales:');
    console.log('   - Email: user1@example.com a user10@example.com');
    console.log('   - Password: password123');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Conexión cerrada');
  }
}

seedUsers();

