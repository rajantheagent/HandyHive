import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

// Public: Provider search
router.get('/search/providers', (req, res, next) => {
  searchController.searchProviders(req, res, next);
});

// Public: Provider details
router.get('/search/providers/:id', (req, res, next) => {
  searchController.getProviderDetails(req, res, next);
});

export default router;
