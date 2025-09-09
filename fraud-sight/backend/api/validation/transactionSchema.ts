import { z } from 'zod';

// Transaction search query schema
export const transactionSearchSchema = z.object({
  // Amount filters
  amount_min: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  amount_max: z.string().optional().transform(val => val ? parseFloat(val) : undefined),

  // Date filters
  date_from: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  date_to: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  created_hours_ago: z.string().optional().transform(val => val ? parseInt(val) : undefined),

  // User filters
  user_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  user_created_days: z.string().optional().transform(val => val ? parseInt(val) : undefined),

  // Transaction filters
  type: z.enum(['debit', 'credit']).optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),

  // Pattern detection
  suspicious: z.string().optional().transform(val => val === 'true'),
  frequency: z.enum(['high', 'normal', 'low']).optional(),

  // Search
  search: z.string().max(100).optional(),

  // Pagination & sorting
  page: z.string().optional().default('1').transform(val => Math.max(1, parseInt(val))),
  limit: z.string().optional().default('50').transform(val => Math.min(100, Math.max(1, parseInt(val)))),
  sort: z.string().optional().default('-createdAt')

});

export type TransactionSearchQuery = z.infer<typeof transactionSearchSchema>;

// Transaction creation schema
export const createTransactionSchema = z.object({
  amount: z.number().positive().max(1000000),
  type: z.enum(['debit', 'credit']),
  description: z.string().max(500).optional(),
  merchant: z.string().max(100).optional(),
  location: z.string().max(100).optional()
});

export type CreateTransactionData = z.infer<typeof createTransactionSchema>;