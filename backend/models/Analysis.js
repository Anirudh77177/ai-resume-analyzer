// backend/models/Analysis.js
const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    jobDescription: { 
        type: String, 
        required: true 
    },
    skills: [String],
    matched_keywords: [String],
    missing_keywords: [String],
    match_score: {
        type: Number,
        default: 0
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Analysis', analysisSchema);