/**
 * AgriDirect Voice AI Controller
 * Handles Vernacular ASR, TTS, and Agricultural Slot Extraction
 */

import { Request, Response } from 'express';
import { VoiceService } from '../services/voice.service.js';
import { SUPPORTED_LANGUAGES, type PreferredLanguage } from '@types';

export class VoiceController {
  /**
   * POST /api/v1/voice/process-intent
   * Processes audioBase64 or textTranscript and extracts structured crop listing slots
   */
  public static async processIntent(req: Request, res: Response): Promise<void> {
    try {
      const { audioBase64, textTranscript, language } = req.body;

      const lang = (language as PreferredLanguage) || 'hi';

      const result = await VoiceService.processVernacularAudio(
        audioBase64,
        textTranscript,
        lang
      );

      res.status(200).json({
        data: result,
      });
    } catch (err) {
      console.error('Error processing voice intent:', err);
      res.status(500).json({
        error: {
          code: 'VOICE_PROCESSING_FAILED',
          message: 'Failed to process vernacular voice input.',
          details: err instanceof Error ? err.message : null,
        },
      });
    }
  }

  /**
   * POST /api/v1/voice/synthesize
   * Synthesizes Indic vernacular speech audio from text
   */
  public static async synthesize(req: Request, res: Response): Promise<void> {
    try {
      const { text, language, gender } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_TEXT',
            message: 'A valid text string is required for speech synthesis.',
          },
        });
        return;
      }

      const lang = (language as PreferredLanguage) || 'hi';
      const result = await VoiceService.synthesizeSpeech(
        text,
        lang,
        gender === 'male' ? 'male' : 'female'
      );

      res.status(200).json({
        data: result,
      });
    } catch (err) {
      console.error('Error synthesizing voice:', err);
      res.status(500).json({
        error: {
          code: 'VOICE_SYNTHESIS_FAILED',
          message: 'Failed to synthesize vernacular speech.',
          details: err instanceof Error ? err.message : null,
        },
      });
    }
  }

  /**
   * GET /api/v1/voice/languages
   * Returns metadata for all 22 official Eighth Schedule languages
   */
  public static getLanguages(_req: Request, res: Response): void {
    res.status(200).json({
      data: SUPPORTED_LANGUAGES,
    });
  }
}
