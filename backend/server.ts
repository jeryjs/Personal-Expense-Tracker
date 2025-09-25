require("module-alias/register");
import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import expensesRoutes from '@routes/expensesRoutes';

const app: Application = express();

// Middleware
app.use(cors<Request>({
    origin: function (origin, callback) {
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

// Routes
app.get('/api', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        message: 'Personal Expense Tracker API is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/expenses', expensesRoutes);

// handle 404
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT as unknown as number || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Using Default User ID: ${process.env.DEFAULT_USER_ID || 'default_user'}`);
    console.log(`Expenses API: http://localhost:${PORT}/api/expenses`);
});

export default app;
