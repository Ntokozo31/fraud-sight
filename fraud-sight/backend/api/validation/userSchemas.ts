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
  .min(8, 'Password must be at least  8 characters')
  .max(128, 'Passoword must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (&%#$@&)')
  .refine(
    (password) => !password.includes('password'),
    'Password cannot contain the word password'
  )
  .refine(
    (password) => !password.includes('123456'),
    'Passowrd cannot contain common sequences like "123456"'
  );

// Name schema
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2,'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphes, and apostrophes')
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