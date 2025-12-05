const express = require('express');
const router = express.Router();
const tokkoService = require('../services/tokkoService');

// test
router.get('/test', async (req, res) => {
  try {
    const result = await tokkoService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/contact', async (req, res) => {
  try {
    const result = await tokkoService.createContact(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// test
router.get('/properties', async (req, res) => {
  try {
    const result = await tokkoService.getProperties();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// test
router.post('/test', async (req, res) => {
  try {
    const result = await tokkoService.createTestContacts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
