import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { AppDataSource } from '../config/data-source';
import { ServiceCategory } from '../entities/ServiceCategory';

const router = Router();

// Public: Provider search
router.get('/search/providers', (req, res, next) => {
  searchController.searchProviders(req, res, next);
});

// Public: Provider details
router.get('/search/providers/:id', (req, res, next) => {
  searchController.getProviderDetails(req, res, next);
});

// Public: Get active categories
router.get('/categories', async (req, res, next) => {
  try {
    const categoryRepo = AppDataSource.getRepository(ServiceCategory);
    const categories = await categoryRepo.find({ where: { is_active: true }, order: { name: 'ASC' } });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

export default router;
