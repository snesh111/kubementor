import ApiResponse from '../utils/apiResponse.js';

export const validateRequest = (validatorFn) => {
  return (req, res, next) => {
    const { valid, errors } = validatorFn(req.body);
    if (!valid) {
      return ApiResponse.error(res, 'Validation Failed', 400, errors);
    }
    next();
  };
};

export default validateRequest;
