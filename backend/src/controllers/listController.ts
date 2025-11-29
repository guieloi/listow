import { Request, Response } from 'express';
import pool from '../config/database';
import { ShoppingList, CreateListData, UpdateListData } from '../models/ShoppingList';
import { logger } from '../utils/logger';

export const getLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    // Query to get both owned and shared lists
    const query = `
      SELECT 
        l.*,
        COALESCE(MAX(i.created_at), l.updated_at) as last_activity,
        COUNT(DISTINCT i.id) as total_items,
        COUNT(DISTINCT CASE WHEN i.is_completed = false THEN i.id END) as pending_items,
        COUNT(DISTINCT CASE WHEN i.is_completed = true THEN i.id END) as completed_items,
        COUNT(DISTINCT col.id) as collaborators_count,
        CASE 
          WHEN l.owner_id = $1 THEN 'owner'
          ELSE lc.permission
        END as user_role,
        CASE 
          WHEN l.owner_id = $1 THEN true
          ELSE false
        END as is_owner
      FROM shopping_lists l
      LEFT JOIN shopping_items i ON l.id = i.list_id
      LEFT JOIN list_collaborators lc ON l.id = lc.list_id AND lc.user_id = $1
      LEFT JOIN list_collaborators col ON l.id = col.list_id
      WHERE l.owner_id = $1 OR lc.user_id = $1
      GROUP BY l.id, l.name, l.description, l.owner_id, l.is_shared, l.created_at, l.updated_at, lc.permission
      ORDER BY last_activity DESC
    `;
    const result = await pool.query(query, [userId]);

    logger.debug(`Found ${result.rows.length} lists for user`, { userId, action: 'GET_LISTS', entityType: 'USER', entityId: String(userId) });

    // Add empty items and collaborators arrays
    const lists = result.rows.map((row: any) => ({
      ...row,
      items: [],
      collaborators: [],
    }));

    res.json(lists);
  } catch (error) {
    logger.error('Error getting lists', { error, action: 'GET_LISTS_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    const { name, description }: CreateListData = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Nome da lista é obrigatório' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO shopping_lists (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description?.trim() || null, userId]
    );

    const newList = result.rows[0];
    newList.items = [];
    newList.collaborators = [];

    logger.info('List created', { userId, listId: newList.id, name: newList.name, action: 'CREATE_LIST', entityType: 'LIST', entityId: String(newList.id) });
    res.status(201).json(newList);
  } catch (error) {
    logger.error('Error creating list', { error, action: 'CREATE_LIST_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateList = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Update list request received', { action: 'UPDATE_LIST_REQUEST' });

    const userId = req.user?.userId;
    logger.debug('User from token', { userId, type: typeof userId });

    if (!userId) {
      logger.warn('No userId found in request', { action: 'UPDATE_LIST_UNAUTHORIZED' });
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const listId = parseInt(req.params.id);
    const { name, description }: UpdateListData = req.body;

    logger.debug('Request params', { listId, name, description });

    if (!listId || isNaN(listId)) {
      logger.warn('Invalid listId', { listId, action: 'UPDATE_LIST_INVALID_ID' });
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    // First, check if list exists
    const listExists = await pool.query(
      'SELECT id, owner_id, name FROM shopping_lists WHERE id = $1',
      [listId]
    );

    if (listExists.rows.length === 0) {
      logger.warn('List not found', { listId, action: 'UPDATE_LIST_NOT_FOUND' });
      res.status(404).json({ error: 'Lista não encontrada' });
      return;
    }

    const ownerId = listExists.rows[0].owner_id;

    // Check if user is owner
    const userIdNum = Number(userId);
    const ownerIdNum = Number(ownerId);
    const isOwner = userIdNum === ownerIdNum;

    // Check collaborator permissions
    const collaboratorCheck = await pool.query(
      'SELECT permission FROM list_collaborators WHERE list_id = $1 AND user_id = $2',
      [listId, userId]
    );

    const hasWritePermission = collaboratorCheck.rows.length > 0 &&
      collaboratorCheck.rows[0].permission === 'write';

    // Final access check
    if (!isOwner && !hasWritePermission) {
      logger.warn('Access denied to update list', { userId, listId, action: 'UPDATE_LIST_FORBIDDEN' });
      res.status(403).json({ error: 'Acesso negado. Apenas o dono ou colaboradores com permissão de escrita podem editar a lista.' });
      return;
    }

    // Building update query...
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description?.trim() || null);
    }

    if (updates.length === 0) {
      logger.warn('No fields to update for list', { listId, action: 'UPDATE_LIST_NO_FIELDS' });
      res.status(400).json({ error: 'Nenhum campo para atualizar' });
      return;
    }

    values.push(listId);
    const query = `UPDATE shopping_lists SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    // Executing update query...
    const result = await pool.query(query, values);
    logger.info('List updated successfully', { listId, userId, action: 'UPDATE_LIST', entityType: 'LIST', entityId: String(listId) });

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating list', { error, action: 'UPDATE_LIST_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const listId = parseInt(req.params.id);

    if (!listId || isNaN(listId)) {
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    // Check if user owns the list
    const listCheck = await pool.query(
      'SELECT owner_id FROM shopping_lists WHERE id = $1',
      [listId]
    );

    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lista não encontrada' });
      return;
    }

    // Convert both to numbers for comparison
    const ownerId = parseInt(listCheck.rows[0].owner_id);
    const userIdNum = parseInt(userId.toString());

    if (ownerId !== userIdNum) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    await pool.query('DELETE FROM shopping_lists WHERE id = $1', [listId]);
    logger.info('List deleted', { listId, userId, action: 'DELETE_LIST', entityType: 'LIST', entityId: String(listId) });
    res.json({ message: 'Lista excluída com sucesso' });
  } catch (error) {
    logger.error('Error deleting list', { error, action: 'DELETE_LIST_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const shareList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    const listId = parseInt(req.params.id);
    const { email, permission = 'read' } = req.body;

    if (!listId || isNaN(listId)) {
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    // Check if user owns the list
    const listCheck = await pool.query(
      'SELECT owner_id FROM shopping_lists WHERE id = $1',
      [listId]
    );

    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lista não encontrada' });
      return;
    }

    if (listCheck.rows[0].owner_id !== userId) {
      res.status(403).json({ error: 'Apenas o dono pode compartilhar a lista' });
      return;
    }

    // Find user by email
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: `Usuário com email "${email}" não encontrado. Verifique se o email está correto e se o usuário já possui uma conta no sistema.` });
      return;
    }

    const targetUserId = userResult.rows[0].id;

    // Check if already shared
    const existingShare = await pool.query(
      'SELECT id, permission FROM list_collaborators WHERE list_id = $1 AND user_id = $2',
      [listId, targetUserId]
    );

    if (existingShare.rows.length > 0) {
      const currentPermission = existingShare.rows[0].permission;
      if (currentPermission === permission) {
        res.status(400).json({ error: 'Este usuário já tem esta permissão na lista' });
        return;
      }
      // Update permission
      await pool.query(
        'UPDATE list_collaborators SET permission = $1 WHERE list_id = $2 AND user_id = $3',
        [permission, listId, targetUserId]
      );
      logger.info('Updated collaborator permission', { listId, email, permission, action: 'UPDATE_COLLABORATOR', entityType: 'LIST', entityId: String(listId) });
    } else {
      // Add new collaborator
      await pool.query(
        'INSERT INTO list_collaborators (list_id, user_id, permission) VALUES ($1, $2, $3)',
        [listId, targetUserId, permission]
      );
      logger.info('Added new collaborator', { listId, email, permission, action: 'ADD_COLLABORATOR', entityType: 'LIST', entityId: String(listId) });
    }

    // Update list as shared
    await pool.query('UPDATE shopping_lists SET is_shared = true WHERE id = $1', [listId]);

    res.json({ message: 'Lista compartilhada com sucesso' });
  } catch (error) {
    logger.error('Error sharing list', { error, action: 'SHARE_LIST_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getListCollaborators = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug('Getting collaborators for list', { listId: req.params.id });
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('No userId found');
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const listId = parseInt(req.params.id);

    if (!listId || isNaN(listId)) {
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    // Check if user has access to the list
    const listCheck = await pool.query(
      'SELECT owner_id FROM shopping_lists WHERE id = $1',
      [listId]
    );

    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lista não encontrada' });
      return;
    }

    if (listCheck.rows[0].owner_id !== userId) {
      res.status(403).json({ error: 'Apenas o dono pode ver os colaboradores' });
      return;
    }

    // Get collaborators
    const result = await pool.query(`
      SELECT 
        lc.id,
        lc.permission,
        u.name,
        u.email
      FROM list_collaborators lc
      JOIN users u ON lc.user_id = u.id
      WHERE lc.list_id = $1
      ORDER BY lc.added_at ASC
    `, [listId]);

    logger.debug('Found collaborators', { count: result.rows.length });
    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting collaborators', { error, action: 'GET_COLLABORATORS_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const removeCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const listId = parseInt(req.params.id);
    const collaboratorId = parseInt(req.params.collaboratorId);

    if (!listId || isNaN(listId)) {
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    if (!collaboratorId || isNaN(collaboratorId)) {
      res.status(400).json({ error: 'ID do colaborador inválido' });
      return;
    }

    // Check if user owns the list
    const listCheck = await pool.query(
      'SELECT owner_id FROM shopping_lists WHERE id = $1',
      [listId]
    );

    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lista não encontrada' });
      return;
    }

    if (listCheck.rows[0].owner_id !== userId) {
      res.status(403).json({ error: 'Apenas o dono pode remover colaboradores' });
      return;
    }

    // Remove collaborator
    const result = await pool.query(
      'DELETE FROM list_collaborators WHERE list_id = $1 AND id = $2 RETURNING id',
      [listId, collaboratorId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Colaborador não encontrado' });
      return;
    }

    logger.info('Collaborator removed', { listId, collaboratorId, removedBy: userId, action: 'REMOVE_COLLABORATOR', entityType: 'LIST', entityId: String(listId) });
    res.json({ message: 'Colaborador removido com sucesso' });
  } catch (error) {
    logger.error('Error removing collaborator', { error, action: 'REMOVE_COLLABORATOR_ERROR' });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
