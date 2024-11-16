import request from 'supertest';
import { app, server } from '../server.js';
import pool from '../../db/index.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuration pour gérer __dirname et __filename avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Avant tous les tests : réinitialisation de la base de données
beforeAll(async () => {
  try {
    // Définir le chemin de recherche au schéma public
    await pool.query('SET search_path TO public');

    // Supprime toutes les tables existantes
    await pool.query(`
      DROP TABLE IF EXISTS
        blocked_users, likes, messages, notifications, photos, profiles, users
      CASCADE;
    `);

    // Charger et exécuter le script SQL
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8');
    await pool.query(schemaSQL);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la base de données :', error);
    throw error;
  }
});

// Après tous les tests : fermeture des connexions
afterAll(async () => {
  try {
    await pool.end(); // Ferme la connexion au pool PostgreSQL
    server.close(); // Arrête le serveur
  } catch (error) {
    console.error('Erreur lors de la fermeture des connexions:', error);
    throw error;
  }
});

// Définition des tests pour les endpoints d'authentification
describe('Auth Endpoints', () => {
  const validUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password@123', // Respecte toutes les contraintes
  };

  const invalidPassword = 'short';

  it('devrait enregistrer un utilisateur avec /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Utilisateur enregistré avec succès');
    expect(res.body).toHaveProperty('userId');
  });

  it('devrait échouer si un email existe déjà avec /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Email ou username déjà utilisé.');
  });

  it('devrait échouer si un champ est manquant avec /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: '',
      username: 'testuser3',
      password: validUser.password,
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Tous les champs sont requis.');
  });

  it('devrait échouer si le mot de passe est trop court avec /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'shortpassword@example.com',
      username: 'shortpassworduser',
      password: invalidPassword,
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty(
      'error',
      'Le mot de passe doit comporter au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.'
    );
  });

  it('devrait échouer si le format de l’email est invalide avec /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      username: 'invalidemailuser',
      password: validUser.password,
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Email invalide.');
  });

  it('devrait connecter un utilisateur avec /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Connexion réussie');
    expect(res.body).toHaveProperty('token');
  });

  it('devrait échouer avec un mauvais mot de passe avec /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: 'wrongpassword',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Mot de passe incorrect.');
  });

  it('devrait échouer si l’email n’existe pas avec /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notfound@example.com',
      password: 'Password@123',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Utilisateur non trouvé.');
  });

  it('devrait échouer si un token expiré est utilisé', async () => {
    const tokenRes = await request(app).post('/api/auth/test-expired-token');
    const expiredToken = tokenRes.body.token;

    const protectedRouteRes = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(protectedRouteRes.statusCode).toEqual(401);
    expect(protectedRouteRes.body).toHaveProperty('error', 'Token expiré.');
  });

  it('devrait échouer si aucun token n’est fourni', async () => {
    const protectedRouteRes = await request(app).get('/api/protected');
    expect(protectedRouteRes.statusCode).toEqual(401);
    expect(protectedRouteRes.body).toHaveProperty('error', 'Accès non autorisé.');
  });

  it('devrait échouer si un token invalide est utilisé', async () => {
    const protectedRouteRes = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid_token');

    expect(protectedRouteRes.statusCode).toEqual(401);
    expect(protectedRouteRes.body).toHaveProperty('error', 'Token invalide.');
  });
});
