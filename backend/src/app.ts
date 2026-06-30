import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/error-handler.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api', routes);

// Global error handler (must be registered after all routes)
app.use(errorHandler);

export default app;
