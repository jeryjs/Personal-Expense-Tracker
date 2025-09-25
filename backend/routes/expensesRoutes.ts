import { Router, Request, Response } from 'express';
import expenseService from '@services/expenses';
import { CreateExpenseData } from '@common/models/Expense';
import { ExpenseCategory } from '@common/constants';

/**
 * Expenses Routes
 */

const router: Router = Router();

// Default monthly budget (TODO: gotta make configurable)
const MONTHLY_BUDGET = 20000;

// Get all expenses
router.get('/', async (req: Request, res: Response) => {
    try {
        const expenses = await expenseService.getAllExpenses();
        res.json({
            success: true,
            data: expenses,
            count: expenses.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch expenses'
        });
    }
});

// Get expense by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const expense = await expenseService.getExpenseById(id);
        
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch expense'
        });
    }
});

// Create a new expense
router.post('/', async (req: Request, res: Response) => {
    try {
        const expenseData: CreateExpenseData = req.body;
        
        // Basic validation
        if (!expenseData.amount || !expenseData.category || !expenseData.date) {
            return res.status(400).json({
                success: false,
                message: 'Amount, category, and date are required'
            });
        }

        if (expenseData.amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        // Validate category
        if (!Object.values(ExpenseCategory).includes(expenseData.category as ExpenseCategory)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be one of: ' + Object.values(ExpenseCategory).join(', ')
            });
        }

        const expense = await expenseService.createExpense(expenseData);
        
        // Calculate remaining budget for the month
        const month = expenseData.date.slice(0, 7); // Extract YYYY-MM
        const remainingBudget = await expenseService.getRemainingBudget(month, MONTHLY_BUDGET);
        
        // Get updated category totals
        const categoryTotals = await expenseService.getCategoryTotals(month);

        res.status(201).json({
            success: true,
            data: expense,
            remainingBudget,
            categoryTotals,
            budgetExceeded: remainingBudget <= 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create expense'
        });
    }
});

// Update an expense
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: Partial<CreateExpenseData> = req.body;
        
        // Validate amount if provided
        if (updateData.amount !== undefined && updateData.amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        // Validate category if provided
        if (updateData.category && !Object.values(ExpenseCategory).includes(updateData.category as ExpenseCategory)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be one of: ' + Object.values(ExpenseCategory).join(', ')
            });
        }

        const expense = await expenseService.updateExpense(id, updateData);
        
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update expense'
        });
    }
});

// Delete an expense
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await expenseService.deleteExpense(id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete expense'
        });
    }
});

// Get monthly report
router.get('/reports/monthly/:month', async (req: Request, res: Response) => {
    try {
        const { month } = req.params;
        
        // Validate month format (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month format. Use YYYY-MM'
            });
        }

        const [totalExpenses, categoryTotals, remainingBudget] = await Promise.all([
            expenseService.getTotalForMonth(month),
            expenseService.getCategoryTotals(month),
            expenseService.getRemainingBudget(month, MONTHLY_BUDGET)
        ]);

        res.json({
            success: true,
            data: {
                month,
                totalExpenses,
                categoryTotals,
                monthlyBudget: MONTHLY_BUDGET,
                remainingBudget,
                budgetExceeded: remainingBudget <= 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to generate monthly report'
        });
    }
});

// Get expenses by category
router.get('/category/:category', async (req: Request, res: Response) => {
    try {
        const { category } = req.params;
        
        // Validate category
        if (!Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category. Must be one of: ' + Object.values(ExpenseCategory).join(', ')
            });
        }

        const expenses = await expenseService.getExpensesByCategory(category);
        
        res.json({
            success: true,
            data: expenses,
            count: expenses.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch expenses by category'
        });
    }
});

// Get category totals
router.get('/categories/totals', async (req: Request, res: Response) => {
    try {
        const { month } = req.query as { month?: string };
        
        if (month && !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month format. Use YYYY-MM'
            });
        }

        const categoryTotals = await expenseService.getCategoryTotals(month);
        
        res.json({
            success: true,
            data: categoryTotals,
            month: month || 'all-time'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch category totals'
        });
    }
});

export default router;
