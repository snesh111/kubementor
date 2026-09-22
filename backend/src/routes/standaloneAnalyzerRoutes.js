import express from 'express';
import { analyzeRawSnippet } from '../controllers/analyzerController.js';

const router = express.Router();

// POST /api/v1/analyzer/raw (or /api/v1/analyzer/analyze)
router.post('/raw', analyzeRawSnippet);
router.post('/analyze', analyzeRawSnippet);

export default router;
