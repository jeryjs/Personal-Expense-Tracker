export default class Expense {
    constructor(
        public id: string,
        public amount: number,
        public category: string,
        public date: Date,
        public description?: string
    ) {}
}
