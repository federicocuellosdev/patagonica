const express = require('express');
const router = express.Router();
const tokkoService = require('../services/tokkoService');

router.post('/contact', async (req, res) => {
  try {
    const result = await tokkoService.createContact(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
