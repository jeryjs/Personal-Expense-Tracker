import db from '@config/firebase.js';
import { collection } from 'firebase/firestore';

const usersCollection = collection(db, 'users');
const expensesCollection = collection(db, 'expenses');
