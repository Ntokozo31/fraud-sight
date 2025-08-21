import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
* Validation middleware for different request parts
* @param schema - Zod schema to validate against
* @param source - Part of request to validate ('body', 'params', 'query') - defaults to 'body')
* @returns Express middleware function
*/

export const validate = (
  schema: ZodSchema,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];

      const validatedData = await schema.parseAsync(dataToValidate);

      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'params') {
        req.params = validatedData as import('express-serve-static-core').ParamsDictionary;
      } else if (source === 'query') {
        Object.assign(req.query, validatedData)
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formatZodErrors(error),
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
      console.error('Validation middleware error:', error);

      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  };
};
/**
 * Format Zod validation errors into user-friendly format
 * @param error - ZodError from validation
 * @returns Array of formatted error objects
 */
const formatZodErrors = (error: ZodError) => {
  return error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.code === 'invalid_type' && 'received' in err ? `Received: ${typeof (err as any).received}` : undefined
  }));
};


/**
 * Validates request body data
 * Usage: validateBody(UserRegistrationSchema)
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Validates URL parameters
 * Usage: validateParams(userIdParamsSchema)
*/
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Validates query string parameters
 * Usage: validateQuery(userListQuerySchema)
*/
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');