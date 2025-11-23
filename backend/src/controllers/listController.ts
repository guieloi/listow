import { Request, Response } from 'express';
import pool from '../config/database';
import { ShoppingList, CreateListData, UpdateListData } from '../models/ShoppingList';

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
        COUNT(i.id) as total_items,
        COUNT(CASE WHEN i.is_completed = false THEN 1 END) as pending_items,
        COUNT(CASE WHEN i.is_completed = true THEN 1 END) as completed_items,
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
      WHERE l.owner_id = $1 OR lc.user_id = $1
      GROUP BY l.id, l.name, l.description, l.owner_id, l.is_shared, l.created_at, l.updated_at, lc.permission
      ORDER BY last_activity DESC
    `;
    const result = await pool.query(query, [userId]);

    console.log(`📋 Found ${result.rows.length} lists for user ${userId}:`, 
      result.rows.map(row => ({ 
        id: row.id, 
        name: row.name, 
        role: row.user_role,
        is_owner: row.is_owner 
      }))
    );

    // Add empty items and collaborators arrays
    const lists = result.rows.map((row: any) => ({
      ...row,
      items: [],
      collaborators: [],
    }));

    res.json(lists);
  } catch (error) {
    console.error('Error getting lists:', error);
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

    res.status(201).json(newList);
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateList = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    
    const listId = parseInt(req.params.id);
    const { name, description }: UpdateListData = req.body;

    if (!listId || isNaN(listId)) {
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    console.log('🔍 Updating list:', { listId, userId, userIdType: typeof userId });

    // Check if user owns the list or has write permission
    const accessCheck = await pool.query(`
      SELECT 
        l.owner_id, 
        lc.permission,
        CASE WHEN l.owner_id = $2 THEN true ELSE false END as is_owner
      FROM shopping_lists l
      LEFT JOIN list_collaborators lc ON l.id = lc.list_id AND lc.user_id = $2
      WHERE l.id = $1 
        AND (l.owner_id = $2 OR lc.permission = 'write')
    `, [listId, userId]);

    console.log('🔍 Access check result:', accessCheck.rows);

    if (accessCheck.rows.length === 0) {
      console.log('❌ Access denied: User', userId, 'does not have access to list', listId);
      res.status(403).json({ error: 'Acesso negado. Apenas o dono ou colaboradores com permissão de escrita podem editar a lista.' });
      return;
    }

    const ownerId = accessCheck.rows[0].owner_id;
    const permission = accessCheck.rows[0].permission;
    const isOwner = accessCheck.rows[0].is_owner;
    console.log('✅ Access granted:', { ownerId, permission, userId, isOwner });

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
      res.status(400).json({ error: 'Nenhum campo para atualizar' });
      return;
    }

    values.push(listId);
    const query = `UPDATE shopping_lists SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating list:', error);
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
    res.json({ message: 'Lista excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting list:', error);
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
      console.log('✅ Updated permission for user:', email, 'to', permission);
    } else {
      // Add new collaborator
      await pool.query(
        'INSERT INTO list_collaborators (list_id, user_id, permission) VALUES ($1, $2, $3)',
        [listId, targetUserId, permission]
      );
      console.log('✅ Added new collaborator:', email, 'with permission:', permission);
    }

    // Update list as shared
    await pool.query('UPDATE shopping_lists SET is_shared = true WHERE id = $1', [listId]);

    res.json({ message: 'Lista compartilhada com sucesso' });
  } catch (error) {
    console.error('Error sharing list:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getListCollaborators = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Getting collaborators for list:', req.params.id);
    const userId = req.user?.userId;
    
    if (!userId) {
      console.log('❌ No userId found');
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

    console.log('✅ Found collaborators:', result.rows.length, result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting collaborators:', error);
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

    res.json({ message: 'Colaborador removido com sucesso' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
