export const MOCK_COMPANY_BASE_CURRENCY = "USD";

export type ExpenseStatus = "DRAFT" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED";

export type Expense = {
  id: string;
  employee: string;
  description: string;
  date: string;
  category: string;
  status: ExpenseStatus;
  amount: number;
  currency: string;
  convertedAmount: number;
};

export const MOCK_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    employee: "John Doe",
    description: "Client dinner at STK",
    date: "2026-03-24",
    category: "Meals",
    status: "APPROVED",
    amount: 345.50,
    currency: "USD",
    convertedAmount: 345.50,
  },
  {
    id: "exp-2",
    employee: "John Doe",
    description: "AWS Cloud Hosting - March",
    date: "2026-03-25",
    category: "Software",
    status: "WAITING_APPROVAL",
    amount: 1450.00,
    currency: "EUR",
    convertedAmount: 1560.25,
  },
  {
    id: "exp-3",
    employee: "John Doe",
    description: "Uber to Airport",
    date: "2026-03-26",
    category: "Travel",
    status: "REJECTED",
    amount: 85.00,
    currency: "GBP",
    convertedAmount: 105.40,
  },
  {
    id: "exp-4",
    employee: "Jane Smith",
    description: "Office Supplies",
    date: "2026-03-20",
    category: "Office",
    status: "DRAFT",
    amount: 45.00,
    currency: "USD",
    convertedAmount: 45.00,
  }
];

export const MOCK_APPROVAL_LOGS = [
  {
    step: 1,
    approver: "Sarah Manager",
    action: "APPROVED",
    comment: "Looks good to me.",
    target: "exp-1",
    timestamp: "2026-03-25T10:00:00Z"
  },
  {
    step: 2,
    approver: "Finance Dept",
    action: "APPROVED",
    comment: "Approved.",
    target: "exp-1",
    timestamp: "2026-03-26T14:30:00Z"
  },
  {
    step: 1,
    approver: "Sarah Manager",
    action: "REJECTED",
    comment: "Out of policy for local travel.",
    target: "exp-3",
    timestamp: "2026-03-27T09:15:00Z"
  }
];
