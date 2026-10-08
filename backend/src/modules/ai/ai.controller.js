const aiService = require('./ai.service');

async function chat(req, res, next) {
  try {
    const { message, history } = req.body;
    const reply = await aiService.chat(message, history);
    res.status(200).json({ success: true, data: { message: reply } });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };
