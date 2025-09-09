const Joi = require('joi');

// Schema for PizzaBase
const PizzaBaseSchema = Joi.object({
  nome: Joi.string().required(),
  ingredientes: Joi.string().required(),
  preco: Joi.number().required(),
  id: Joi.string().required(),
  imagem_url: Joi.string().uri().optional(),
  data_pedido: Joi.string().optional(),
  cliente_id: Joi.string().optional(),
});

module.exports = {
  PizzaBaseSchema,
};