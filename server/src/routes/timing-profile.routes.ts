import { Router } from 'express';
import { timingProfileController } from '../controllers/timing-profile.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, timingProfileController.get);
router.get('/histogram', authenticate, timingProfileController.histogram);
router.put('/override', authenticate, timingProfileController.override);

export default router;
