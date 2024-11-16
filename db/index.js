import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Charge les variables d'environnement

const { Pool } = pkg;

// Détecte l'environnement pour définir les paramètres de connexion
const isTestEnv = process.env.NODE_ENV === 'test';

const pool = new Pool({
  user: process.env.DB_USER || (isTestEnv ? 'test_user' : 'virginie'),
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || (isTestEnv ? 'matcha_test' : 'matcha'),
  password: process.env.DB_PASSWORD || 'Perpignan66!!',
  port: process.env.DB_PORT || 5432,
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

console.log('Base de données connectée :', process.env.DB_NAME);

export default pool;
