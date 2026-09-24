const { body, param, query } = require('express-validator');

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória'),
];

const propertyValidation = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('Título é obrigatório')
    .isLength({ min: 5, max: 255 }).withMessage('Título deve ter entre 5 e 255 caracteres'),
  body('preco')
    .notEmpty().withMessage('Preço é obrigatório')
    .isNumeric().withMessage('Preço deve ser um número')
    .custom((value) => {
      if (parseFloat(value) <= 0) throw new Error('Preço deve ser positivo');
      return true;
    }),
  body('tipo')
    .notEmpty().withMessage('Tipo é obrigatório')
    .isIn(['venda', 'aluguel']).withMessage('Tipo deve ser "venda" ou "aluguel"'),
  body('categoria')
    .notEmpty().withMessage('Categoria é obrigatória')
    .isIn(['apartamento', 'casa', 'terreno', 'comercial', 'cobertura', 'kitnet'])
    .withMessage('Categoria inválida'),
  body('cidade')
    .trim()
    .notEmpty().withMessage('Cidade é obrigatória'),
  body('descricao').optional().trim(),
  body('area').optional().isInt({ min: 1 }).withMessage('Área deve ser um número positivo'),
  body('quartos').optional().isInt({ min: 0 }).withMessage('Quartos deve ser um número >= 0'),
  body('banheiros').optional().isInt({ min: 0 }).withMessage('Banheiros deve ser um número >= 0'),
  body('garagem').optional().isInt({ min: 0 }).withMessage('Garagem deve ser um número >= 0'),
  body('bairro').optional().trim(),
  body('endereco').optional().trim(),
  body('cep').optional().trim(),
  body('latitude').optional().isDecimal().withMessage('Latitude inválida'),
  body('longitude').optional().isDecimal().withMessage('Longitude inválida'),
];

const searchValidation = [
  query('cidade').optional().trim(),
  query('bairro').optional().trim(),
  query('tipo').optional().isIn(['venda', 'aluguel']).withMessage('Tipo inválido'),
  query('categoria').optional().isIn(['apartamento', 'casa', 'terreno', 'comercial', 'cobertura', 'kitnet']),
  query('preco_min').optional().isNumeric().withMessage('Preço mínimo inválido'),
  query('preco_max').optional().isNumeric().withMessage('Preço máximo inválido'),
  query('quartos_min').optional().isInt({ min: 0 }),
  query('area_min').optional().isInt({ min: 0 }),
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite deve ser entre 1 e 50'),
  query('order').optional().isIn(['preco_asc', 'preco_desc', 'recente', 'relevancia']),
];

const uuidValidation = [
  param('id').isUUID().withMessage('ID inválido'),
];

module.exports = {
  loginValidation,
  propertyValidation,
  searchValidation,
  uuidValidation,
};
