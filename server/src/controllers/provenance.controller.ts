import { Request, Response } from 'express';
import { ProvenanceService } from '../services/provenance.service.js';

export class ProvenanceController {
  /**
   * GET /api/v1/provenance/verify/:hash
   * Cryptographically verifies a batch hash or QR payload
   */
  static verify(req: Request, res: Response): void {
    const hash = req.params.hash as string;

    if (!hash) {
      res.status(400).json({
        error: {
          code: 'HASH_REQUIRED',
          message: 'Cryptographic hash parameter is required',
        },
      });
      return;
    }

    const verification = ProvenanceService.verify(hash);

    if (!verification.is_valid) {
      res.status(404).json({
        error: {
          code: 'PROVENANCE_HASH_INVALID',
          message: verification.error || 'Cryptographic chain verification failed',
        },
        data: {
          is_valid: false,
        },
      });
      return;
    }

    res.status(200).json({
      data: {
        is_valid: true,
        batch: verification.batch,
      },
    });
  }

  /**
   * GET /api/v1/provenance/sample
   * Returns sample verified batch
   */
  static getSample(req: Request, res: Response): void {
    const sample = ProvenanceService.getSampleBatch();
    res.status(200).json({
      data: sample,
    });
  }
}
