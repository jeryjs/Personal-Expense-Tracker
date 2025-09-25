export interface CreateExpenseData {
    amount: number;
    category: string;
    date: string; // ISO date string for Firestore
    description?: string;
}

export interface Expense extends CreateExpenseData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export default Expense;
