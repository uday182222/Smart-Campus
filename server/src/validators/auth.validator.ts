import Joi from 'joi';

export const authValidator = {
  register: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      name: Joi.string().min(2).max(100).required(),
      role: Joi.string().valid('PARENT', 'TEACHER', 'ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF', 'BUS_HELPER', 'STUDENT').required(),
      schoolId: Joi.string().optional(),
      phone: Joi.string().optional(),
      metadata: Joi.object().optional()
    })
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      schoolId: Joi.string().optional() // optional; when provided can be any string (UUID or custom id e.g. demo-school-001)
    }).options({ allowUnknown: true })
  },

  updateProfile: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      phone: Joi.string().optional(),
      preferences: Joi.object().optional()
    })
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required()
    })
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required()
    })
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(6).required()
    })
  },

  verifyEmail: {
    body: Joi.object({
      token: Joi.string().required()
    })
  },

  resendVerification: {
    body: Joi.object({
      email: Joi.string().email().required()
    })
  }
};



