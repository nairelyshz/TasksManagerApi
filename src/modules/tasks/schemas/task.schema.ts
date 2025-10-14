import * as Joi from 'joi';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required().messages({
    'string.min': 'El título no puede estar vacío',
    'string.max': 'El título no puede exceder 255 caracteres',
    'any.required': 'El título es requerido',
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'La descripción no puede exceder 1000 caracteres',
  }),
  completed: Joi.boolean().optional().default(false),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'El título no puede estar vacío',
    'string.max': 'El título no puede exceder 255 caracteres',
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'La descripción no puede exceder 1000 caracteres',
  }),
  completed: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });
