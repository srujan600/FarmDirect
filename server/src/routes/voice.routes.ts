/**
 * AgriDirect Vernacular Voice AI Routes
 * /api/v1/voice
 */

import { Router } from 'express';
import { VoiceController } from '../controllers/voice.controller.js';

const router = Router();

// Process vernacular audio or text to extract structured agricultural slots
router.post('/process-intent', VoiceController.processIntent);

// Synthesize spoken audio for vernacular text prompt
router.post('/synthesize', VoiceController.synthesize);

// Multilingual conversational AI assistant
router.post('/assistant/chat', VoiceController.assistantChat);

// Retrieve all 22 official languages and metadata
router.get('/languages', VoiceController.getLanguages);

export default router;
