// packages
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// utils
import connectDB from './config/db.js';
import userRouter from './routes/userRoutes.js';

dotenv.config();
const PORT = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/users', userRouter);

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
