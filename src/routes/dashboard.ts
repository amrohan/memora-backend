import { Hono } from 'hono';
import { authMiddleware } from '../middleware/authMiddleware';
import { listBookmarks } from '../handlers/bookmarkHandler';

const dashboardRoutes = new Hono();

// Apply auth middleware
dashboardRoutes.use('*', authMiddleware);

// GET /dashboard -> Use the listBookmarks handler
dashboardRoutes.get('/', listBookmarks);

export default dashboardRoutes;
