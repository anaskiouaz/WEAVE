import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import healthRoutes from './routes/health.js';
import usersRoutes from './routes/users.js';
import authRoutes from './routes/auth.js'; // <--- IMPORTANT

const app = express();

app.use(helmet());
app.use(cors()); // Configurez ceci si le front et le back sont sur des ports différents
app.use(morgan('dev'));
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);

export default app;