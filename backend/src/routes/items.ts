import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getItems, createItem, updateItem, deleteItem, toggleItem } from '../controllers/itemController';

const router = Router();

// Enable authentication
router.use(authenticateToken);

// Item CRUD routes
router.get('/list/:listId', getItems);
router.post('/list/:listId', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/toggle', toggleItem);

export default router;
