import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db/index.js'; // Connection à PostgreSQL

const router = express.Router();

// Middleware pour valider les tokens JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé.' });
  }

  jwt.verify(token, 'SECRET_KEY', (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expiré.' });
      }
      return res.status(401).json({ error: 'Token invalide.' });
    }

    req.user = user;
    next();
  });
};

// Enregistrement
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  // Validation des champs requis
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email invalide.' });
  }

  // Validation du mot de passe
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'Le mot de passe doit comporter au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.',
    });
  }

  try {
    // Vérification si l'email ou le username existe déjà
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email ou username déjà utilisé.' });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion dans la base de données
    const result = await pool.query(
      'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id',
      [email, username, hashedPassword]
    );

    res.status(201).json({
      message: 'Utilisateur enregistré avec succès',
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validation des champs requis
  if (!email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  try {
    // Vérification de l'utilisateur
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (!user.rows.length) {
      return res.status(401).json({ error: 'Utilisateur non trouvé.' });
    }

    // Comparaison des mots de passe
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Génération du token JWT
    const token = jwt.sign({ userId: user.rows[0].id }, 'SECRET_KEY', { expiresIn: '1h' });

    res.status(200).json({
      message: 'Connexion réussie',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

// Connexion - Test uniquement pour générer un token expiré
router.post('/test-expired-token', async (req, res) => {
  const token = jwt.sign({ userId: 1 }, 'SECRET_KEY', { expiresIn: '1s' });
  setTimeout(() => {
    res.status(200).json({ token });
  }, 2000); // Simule une expiration
});


// Route protégée
router.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Accès autorisé', userId: req.user.userId });
});

export { authenticateToken };
export default router;
