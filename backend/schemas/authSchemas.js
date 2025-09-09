const Joi = require('joi');

// Schema for LoginInput
const LoginInputSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
});

// Schema for Token
const TokenSchema = Joi.object({
  access_token: Joi.string().required(),
  token_type: Joi.string().default('bearer'),
});

// Schema for TokenData
const TokenDataSchema = Joi.object({
  sub: Joi.string().required(),
  email: Joi.string().email().required(),
  exp: Joi.number().optional(),
});

module.exports = {
  LoginInputSchema,
  TokenSchema,
  TokenDataSchema,
};