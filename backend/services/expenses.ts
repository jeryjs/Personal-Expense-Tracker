import { 
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    Timestamp 
} from 'firebase/firestore';
import { Expense, CreateExpenseData } from '@common/models/Expense';
import { cache, TTL } from '@config/cache';
import db from '@config/firebase';

// Define a default user ID since we're skipping authentication
export const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'default_user';

class ExpenseService {
    private expensesCollection;

    constructor() {
        this.expensesCollection = collection(db, 'users', DEFAULT_USER_ID, 'expenses');
    }

    /**
     * Create a new expense
     */
    async createExpense(expenseData: CreateExpenseData): Promise<Expense> {
        try {
            const now = new Date();
            const docData = {
                ...expenseData,
                createdAt: Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now)
            };

            const docRef = await addDoc(this.expensesCollection, docData);
            
            const expense: Expense = {
                id: docRef.id,
                ...expenseData,
                createdAt: now,
                updatedAt: now
            };

            // Clear cache
            this.clearExpensesCache();

            return expense;
        } catch (error) {
            throw new Error(`Failed to create expense: ${error}`);
        }
    }

    /**
     * Get all expenses
     */
    async getAllExpenses(): Promise<Expense[]> {
        try {
            const cacheKey = 'all_expenses';
            const cached = cache.get<Expense[]>(cacheKey);
            
            if (cached) {
                return cached;
            }

            const q = query(this.expensesCollection, orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const expenses: Expense[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                expenses.push({
                    id: doc.id,
                    amount: data.amount,
                    category: data.category,
                    date: data.date,
                    description: data.description || '',
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate()
                });
            });

            cache.set(cacheKey, expenses, TTL.MEDIUM);
            return expenses;
        } catch (error) {
            throw new Error(`Failed to fetch expenses: ${error}`);
        }
    }

    /**
     * Get expense by ID
     */
    async getExpenseById(id: string): Promise<Expense | null> {
        try {
            const cacheKey = `expense_${id}`;
            const cached = cache.get<Expense>(cacheKey);
            
            if (cached) {
                return cached;
            }

            const docRef = doc(this.expensesCollection, id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            const data = docSnap.data();
            const expense: Expense = {
                id: docSnap.id,
                amount: data.amount,
                category: data.category,
                date: data.date,
                description: data.description || '',
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            };

            cache.set(cacheKey, expense, TTL.MEDIUM);
            return expense;
        } catch (error) {
            throw new Error(`Failed to fetch expense: ${error}`);
        }
    }

    /**
     * Update expense
     */
    async updateExpense(id: string, updateData: Partial<CreateExpenseData>): Promise<Expense | null> {
        try {
            const docRef = doc(this.expensesCollection, id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return null;
            }

            const updatedData = {
                ...updateData,
                updatedAt: Timestamp.fromDate(new Date())
            };

            await updateDoc(docRef, updatedData);

            // Clear cache
            this.clearExpensesCache();
            cache.del(`expense_${id}`);

            // Return updated expense
            return await this.getExpenseById(id);
        } catch (error) {
            throw new Error(`Failed to update expense: ${error}`);
        }
    }

    /**
     * Delete expense
     */
    async deleteExpense(id: string): Promise<boolean> {
        try {
            const docRef = doc(this.expensesCollection, id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return false;
            }

            await deleteDoc(docRef);

            // Clear cache
            this.clearExpensesCache();
            cache.del(`expense_${id}`);

            return true;
        } catch (error) {
            throw new Error(`Failed to delete expense: ${error}`);
        }
    }

    /**
     * Get total expenses for a specific month
     */
    async getTotalForMonth(month: string): Promise<number> {
        try {
            const cacheKey = `total_month_${month}`;
            const cached = cache.get<number>(cacheKey);
            
            if (cached !== undefined) {
                return cached;
            }

            const startDate = `${month}-01`;
            const nextMonth = new Date(month + '-01');
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const endDate = nextMonth.toISOString().slice(0, 7) + '-01';

            const q = query(
                this.expensesCollection,
                where('date', '>=', startDate),
                where('date', '<', endDate)
            );

            const querySnapshot = await getDocs(q);
            let total = 0;

            querySnapshot.forEach((doc) => {
                total += doc.data().amount;
            });

            cache.set(cacheKey, total, TTL.LONG);
            return total;
        } catch (error) {
            throw new Error(`Failed to calculate monthly total: ${error}`);
        }
    }

    /**
     * Get category totals for a specific month
     */
    async getCategoryTotals(month?: string): Promise<Record<string, number>> {
        try {
            const cacheKey = `category_totals_${month || 'all'}`;
            const cached = cache.get<Record<string, number>>(cacheKey);
            
            if (cached) {
                return cached;
            }

            let q = query(this.expensesCollection);

            if (month) {
                const startDate = `${month}-01`;
                const nextMonth = new Date(month + '-01');
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                const endDate = nextMonth.toISOString().slice(0, 7) + '-01';

                q = query(
                    this.expensesCollection,
                    where('date', '>=', startDate),
                    where('date', '<', endDate)
                );
            }

            const querySnapshot = await getDocs(q);
            const totals: Record<string, number> = {};

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const category = data.category;
                totals[category] = (totals[category] || 0) + data.amount;
            });

            cache.set(cacheKey, totals, TTL.MEDIUM);
            return totals;
        } catch (error) {
            throw new Error(`Failed to calculate category totals: ${error}`);
        }
    }

    /**
     * Get expenses by category
     */
    async getExpensesByCategory(category: string): Promise<Expense[]> {
        try {
            const cacheKey = `expenses_category_${category}`;
            const cached = cache.get<Expense[]>(cacheKey);
            
            if (cached) {
                return cached;
            }

            const q = query(
                this.expensesCollection,
                where('category', '==', category),
                orderBy('date', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const expenses: Expense[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                expenses.push({
                    id: doc.id,
                    amount: data.amount,
                    category: data.category,
                    date: data.date,
                    description: data.description || '',
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate()
                });
            });

            cache.set(cacheKey, expenses, TTL.MEDIUM);
            return expenses;
        } catch (error) {
            throw new Error(`Failed to fetch expenses by category: ${error}`);
        }
    }

    /**
     * Calculate remaining budget for a month
     */
    async getRemainingBudget(month: string, monthlyBudget: number): Promise<number> {
        try {
            const totalSpent = await this.getTotalForMonth(month);
            return Math.max(0, monthlyBudget - totalSpent);
        } catch (error) {
            throw new Error(`Failed to calculate remaining budget: ${error}`);
        }
    }

    /**
     * Clear expenses cache
     */
    private clearExpensesCache(): void {
        const keys = cache.keys();
        keys.forEach(key => {
            if (key.startsWith('expenses_') || key.startsWith('all_expenses') || 
                key.startsWith('total_month_') || key.startsWith('category_totals_')) {
                cache.del(key);
            }
        });
    }
}

export default new ExpenseService();
