const Joi = require('joi');

exports.validateSignup = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required().messages({
      "string.base": "Name should be a type of text",
      "string.empty": "Name cannot be empty",
      "string.min": "Name should have a minimum length of {#limit}",
      "string.max": "Name should have a maximum length of {#limit}",
      "any.required": "Name is required"
    }),
    phone: Joi.string().length(11).pattern(/^[0-9]+$/).required().messages({
      "string.base": "Phone should be a type of text",
      "string.empty": "Phone cannot be empty",
      "string.length": "Phone must be 11 digits",
      "string.pattern.base": "Phone must contain only numbers",
      "any.required": "Phone is required"
    }),
    email: Joi.string().email().required().messages({
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be valid",
      "any.required": "Email is required"
    }),
    password: Joi.string().min(8).required().messages({
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least {#limit} characters",
      "any.required": "Password is required"
    }),
    confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
      "string.empty": "Confirm password cannot be empty",
      "any.only": "Passwords must match",
      "any.required": "Confirm password is required"
    }),
    age: Joi.number().min(18).required().messages({
      "number.base": "Age must be a number",
      "number.min": "Age must be at least {#limit}",
      "any.required": "Age is required"
    })
  });

  return schema.validate(data, { abortEarly: false });
};

exports.validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be valid",
      "any.required": "Email is required"
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password cannot be empty",
      "any.required": "Password is required"
    })
  });

  return schema.validate(data, { abortEarly: false });
};

exports.validateUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).messages({
      "string.base": "Name should be a type of text",
      "string.empty": "Name cannot be empty",
      "string.min": "Name should have a minimum length of {#limit}",
      "string.max": "Name should have a maximum length of {#limit}"
    }),
    phone: Joi.string().length(11).pattern(/^[0-9]+$/).messages({
      "string.base": "Phone should be a type of text",
      "string.empty": "Phone cannot be empty",
      "string.length": "Phone must be 11 digits",
      "string.pattern.base": "Phone must contain only numbers"
    }),
    email: Joi.string().email().messages({
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be valid"
    }),
    password: Joi.string().min(8).messages({
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least {#limit} characters"
    }),
    age: Joi.number().min(18).messages({
      "number.base": "Age must be a number",
      "number.min": "Age must be at least {#limit}"
    })
  });

  return schema.validate(data, { abortEarly: false });
};