import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import routes from './routes';
import { errorHandler } from './middleware/error-handler.middleware';
import { configurePassport } from './config/passport';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());
configurePassport();

// Routes
app.use('/api', routes);

// Global error handler (must be registered after all routes)
app.use(errorHandler);

export default app;
