import express from 'express';
import pool from '../db/index.js';
import authRoutes, { authenticateToken } from './routes/auth.js'; // Ajout des routes d'authentification

const app = express();
app.use(express.json());

// Routes pour l'authentification
app.use('/api/auth', authRoutes);

// Test de la base de données
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Connexion réussie', timestamp: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la connexion à la base' });
  }
});

app.post('/api/auth/test-expired-token', (req, res) => {
  const token = jwt.sign({ userId: 1 }, 'SECRET_KEY', { expiresIn: '1s' });
  setTimeout(() => {
    res.status(200).json({ token });
  }, 2000);
});

app.use('/api/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Accès autorisé', user: req.user });
});

const PORT = 3000;

// Créez une instance de serveur et exportez-la
const server = app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

export { app, server };
