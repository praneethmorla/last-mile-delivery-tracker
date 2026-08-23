import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import customerRouter from './routes/customer';
import agentRouter from './routes/agent';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Register API Route Handlers
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customer', customerRouter);
app.use('/api/agent', agentRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Serve static frontend files in production
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback to client routing for non-API requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      // In development or if frontend is not built, send a simple message
      res.status(200).send('Backend server is running. Frontend has not been built yet. Run "npm run build" to compile frontend.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Server is running on http://localhost:${PORT}`);
});

export default app;
