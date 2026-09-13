import express from 'express';
import {
  getPracticeCatalog,
  startLabSession,
  getActiveLabSession,
  resetLabSession,
  getLabFiles,
  getLabFile,
  saveLabFile,
  deployLab,
  getLabNotes,
  saveLabNotes,
  diagnoseLabScenario,
  getLabScenarioHint,
  chatWithLabMentor,
  getLabChatHistory,
  explainLabEvidence,
  explainLabConcept,
} from '../controllers/labController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected catalog route
router.get('/catalog', authenticate, getPracticeCatalog);

// Automated Lab Session Management
router.post('/:labId/start', authenticate, startLabSession);
router.get('/:labId/session', authenticate, getActiveLabSession);
router.post('/:labId/reset', authenticate, resetLabSession);

// Lab Manifest Files & Re-Deployment
router.get('/:labId/files', authenticate, getLabFiles);
router.get('/:labId/files/:filename', authenticate, getLabFile);
router.put('/:labId/files/:filename', authenticate, saveLabFile);
router.post('/:labId/deploy', authenticate, deployLab);

// Persistent Root-Cause Investigation Notes (Scratchpad)
router.get('/:labId/notes', authenticate, getLabNotes);
router.put('/:labId/notes', authenticate, saveLabNotes);

// AI Mentor: Context-Grounded Diagnosis, Hints, and Interactive Chat
router.post('/:labId/ai/diagnose', authenticate, diagnoseLabScenario);
router.post('/:labId/ai/hint', authenticate, getLabScenarioHint);
router.post('/:labId/ai/chat', authenticate, chatWithLabMentor);
router.get('/:labId/ai/chat', authenticate, getLabChatHistory);
router.post('/:labId/ai/explain', authenticate, explainLabEvidence);
router.post('/:labId/ai/concept', authenticate, explainLabConcept);

export default router;
