import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
// Only needed in development (Vite on :5173). In production React is served from the same origin.
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api', apiRoutes);
app.use('/api', notFoundHandler);
app.use(errorHandler);
