import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getLists, createList, updateList, deleteList, shareList, getListCollaborators, removeCollaborator } from '../controllers/listController';

const router = Router();

// Enable authentication
router.use(authenticateToken);

// List CRUD routes
router.get('/', getLists);
router.post('/', createList);
router.put('/:id', updateList);
router.delete('/:id', deleteList);
router.post('/:id/share', shareList);
router.get('/:id/collaborators', getListCollaborators);
router.delete('/:id/collaborators/:collaboratorId', removeCollaborator);

export default router;
