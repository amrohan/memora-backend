import { Hono } from 'hono';
import { registerUser, loginUser } from '../handlers/authHandler';

const authRoutes = new Hono();

// POST /auth/register
authRoutes.post('/register', registerUser);

// POST /auth/login
authRoutes.post('/login', loginUser);

// Optional: Add routes for logout (client-side token removal usually suffices),
// or token refresh if using short-lived tokens.

export default authRoutes;
