const { validationResult } = require('express-validator');

const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);

    res.status(200).json({ status: 'ok', token, user });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getSafeUserById(req.user.id);
    res.status(200).json({ status: 'ok', user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
