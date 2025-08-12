// Create transaction interface
export interface CreateTransactionRequest {
  amount: number;
  type: string;
}

// Transaction interface
export interface TransactionResponse {
  id: number;
  amount: number;
  type: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: Date;
}

// Transaction service interface
export interface TransactionServiceCreateData {
  amount: number;
  type: string;
  userId: number;
}