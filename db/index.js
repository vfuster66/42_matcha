import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Charge le bon fichier .env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  console.warn(`Fichier ${envFile} introuvable, utilisant les variables d'environnement par défaut.`);
}

const { Pool } = pkg;

// Configure les paramètres de connexion
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Vérification de la connexion
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connexion réussie à PostgreSQL :', res.rows[0].now);
  } catch (err) {
    console.error('Erreur de connexion à la base de données :', err.message);
    process.exit(1);
  }
})();

export default pool;
