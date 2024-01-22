import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(60).required(),
  name: Joi.string().min(1).max(60).required(),
  surname: Joi.string().min(1).max(60).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(60).required(),
});

  
