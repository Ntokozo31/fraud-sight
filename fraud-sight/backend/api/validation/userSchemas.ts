import { z } from 'zod';

// Email schema
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(100, 'Email must not exceed 100 characters')
  .toLowerCase()
  .refine(
    (email) => !email.includes('+'),
    'Email aliases with + are not allowed'
  );

// Password schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*)')
  .refine(
    (password) => !password.includes('password'),
    'Password cannot contain the word "password"'
  )
  .refine(
    (password) => !password.includes('123456'),
    'Password cannot contain common sequences like "123456"'
  );

// Name schema
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform((name) => {
    return name
      .trim()
      .replace(/\s+/g, ' ')                     
      .replace(/^['-]+|['-]+$/g, '')            
      .split(' ')                               
      .map(word => 
        word.charAt(0).toUpperCase() + 
        word.slice(1).toLowerCase()
      )                                         
      .join(' ');                        
  });


// User registration schema
export const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['admin', 'customer']).optional().default('customer')
}).strict();


// User login schema
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
}).strict();


// Update user profile schema
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional()
}).strict()
.refine(
  (data) => data.name || data.email,
  {
    message: 'At least one field (name or email) must be provided', path: ['name']
  }
);


// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required')
})
.strict()
.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword']
  }
)
.refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from the current password',
    path: ['newPassword']
  }
);

// Admin update user schema
export const adminUpdateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(['admin', 'customer']).optional(),
  isActive: z.boolean().optional()
})
.strict()
.refine(
  (data) => data.name || data.email || data.role || data.isActive !== undefined,
  {
    message: 'At least one field must be provided',
    path: ['name']
  }
);

// URL parameter schema
export const userIdParamSchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, 'User ID must be positive integer')
    .transform((val) => parseInt(val))
    .refine((val) => val > 0 && val < 2147483647, 'User ID must be a valid positive interger')
});

// Query parameters
export const userListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val))
    .refine((val) => val > 0 && val <= 1000, 'Page must be between 0 and 1000'),

  // Limit parameter
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Math.min(parseInt(val), 100))
    .refine((val) => val > 0 && val <= 100, 'Limit must be betweet 1 and 100'),

  role: z.enum(['admin', 'customer']).optional(),

  // Active status filter
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val == 'true') return true;
      if (val == 'false') return false;
      return undefined;
    }),

  // Search term validation
  search: z
    .string()
    .max(100, 'Search term must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s@.-]*$/, 'Search term contains invalid charecters')
    .optional()
    .transform((val) => val?.trim())
})


// Type generation
export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type AdminUpdateUser = z.infer<typeof adminUpdateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;