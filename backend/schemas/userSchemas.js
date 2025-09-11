const Joi = require('joi');

// Base schema for user creation
const UserBaseSchema = Joi.object({
  nome: Joi.string().required(),
  email: Joi.string().email().required(),
  senha: Joi.string().required(),
  endereco: Joi.string().required(),
  numero_cartao: Joi.string().required(),
  validade_cartao: Joi.string().required(),
  cvv: Joi.string().required(),
});

// Schema for user updates (all fields optional)
const UserUpdateSchema = Joi.object({
  nome: Joi.string().optional(),
  email: Joi.string().email().optional(),
  senha: Joi.string().optional(),
  endereco: Joi.string().optional(),
  numero_cartao: Joi.string().optional(),
  validade_cartao: Joi.string().optional(),
  cvv: Joi.string().optional(),
});

module.exports = {
  UserBaseSchema,
  UserUpdateSchema,
};