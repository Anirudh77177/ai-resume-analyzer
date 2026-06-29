const express = require('express');
const { triggerN8nWorkflow } = require('../controllers/n8nController');

const router = express.Router();

// POST route for sending data to n8n
router.post('/analyze', triggerN8nWorkflow);

module.exports = router;