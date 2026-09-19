import byoaService from '../services/byoaService.js';
import { catchAsync } from '../middleware/errorMiddleware.js';

export const byoaController = {
  /**
   * POST /api/v1/byoa/validate-manifests - Validate manifests without creating a lab
   */
  validateManifests: catchAsync(async (req, res) => {
    const { manifestYaml } = req.body;
    const result = byoaService.validateBYOAManifests(manifestYaml);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  }),

  /**
   * POST /api/v1/byoa/create-lab - Create and deploy a BYOA lab session
   */
  createLab: catchAsync(async (req, res) => {
    const { manifestYaml, appName, description } = req.body;
    const labSession = await byoaService.createBYOALab(req.user.id, manifestYaml, {
      appName,
      description,
    });
    res.status(201).json({
      status: 'success',
      data: labSession,
    });
  }),

  /**
   * POST /api/v1/byoa/:labId/validate - Health check validation for a BYOA lab
   */
  validateHealth: catchAsync(async (req, res) => {
    const { labId } = req.params;
    const result = await byoaService.validateBYOAHealth(req.user.id, labId);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  }),

  /**
   * GET /api/v1/byoa/labs - List user's BYOA labs
   */
  getUserLabs: catchAsync(async (req, res) => {
    const labs = await byoaService.getUserBYOALabs(req.user.id);
    res.status(200).json({
      status: 'success',
      results: labs.length,
      data: labs,
    });
  }),
};

export default byoaController;
