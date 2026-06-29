const axios = require('axios');

const triggerN8nWorkflow = async (req, res) => {
    try {
        const { resumeText, studentName } = req.body;

        // Yahan n8n ka TEST URL aayega jo n8n screen pe tha
        const n8nWebhookUrl = 'http://localhost:5678/webhook-test/fdb68720-bf4a-40ba-9d62-8eef02862223';

        const response = await axios.post(n8nWebhookUrl, {
            resumeText,
            studentName
        });

        res.status(200).json({ 
            success: true, 
            message: 'Resume sent to n8n successfully!',
            n8nResponse: response.data 
        });
    } catch (error) {
        console.error('Error triggering n8n:', error.message);
        res.status(500).json({ success: false, message: 'Failed to connect to n8n' });
    }
};

module.exports = { triggerN8nWorkflow };