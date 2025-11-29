import { Request, Response } from 'express';
import pool from '../config/database';
import { ShoppingItem, CreateItemData, UpdateItemData } from '../models/ShoppingList';

export const getItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    const listId = parseInt(req.params.listId);

    if (!listId || isNaN(listId)) {
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    // Query to get items with completed items at the end
    const result = await pool.query(
      'SELECT * FROM shopping_items WHERE list_id = $1 ORDER BY is_completed ASC, created_at ASC',
      [listId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const createItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    const listId = parseInt(req.params.listId);
    const { name, quantity, unit, price }: CreateItemData = req.body;

    if (!listId || isNaN(listId)) {
      res.status(400).json({ error: 'ID da lista inválido' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Nome do item é obrigatório' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO shopping_items (list_id, name, quantity, unit, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [listId, name.trim(), quantity || null, unit?.trim() || null, price || null]
    );

    // Update list's updated_at timestamp
    await pool.query('UPDATE shopping_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);

    // Send Push Notification to collaborators
    try {
      // 1. Get list name and owner/collaborators
      const listInfo = await pool.query(`
        SELECT l.name, l.owner_id, 
               array_agg(c.user_id) as collaborator_ids
        FROM shopping_lists l
        LEFT JOIN list_collaborators c ON l.id = c.list_id
        WHERE l.id = $1
        GROUP BY l.id
      `, [listId]);

      if (listInfo.rows.length > 0) {
        const { name: listName, owner_id, collaborator_ids } = listInfo.rows[0];

        // Combine owner and collaborators
        const recipients = new Set<number>();
        if (owner_id !== userId) recipients.add(owner_id);
        if (collaborator_ids && collaborator_ids[0] !== null) {
          collaborator_ids.forEach((id: number) => {
            if (id !== userId) recipients.add(id);
          });
        }

        if (recipients.size > 0) {
          const { sendPushNotification } = require('../services/notificationService');
          // Don't await this to avoid blocking the response
          sendPushNotification(
            Array.from(recipients),
            'Novo item na lista!',
            `"${name.trim()}" foi adicionado à lista "${listName}"`,
            { listId, itemId: result.rows[0].id }
          );
        }
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    const itemId = parseInt(req.params.id);
    const { name, quantity, unit, price, is_completed }: UpdateItemData = req.body;

    if (!itemId || isNaN(itemId)) {
      res.status(400).json({ error: 'ID do item inválido' });
      return;
    }

    // Check if user has write access to the list containing the item
    const accessCheck = await pool.query(`
      SELECT i.id FROM shopping_items i
      JOIN shopping_lists l ON i.list_id = l.id
      LEFT JOIN list_collaborators c ON l.id = c.list_id AND c.user_id = $2
      WHERE i.id = $1 AND (l.owner_id = $2 OR c.permission = 'write')
    `, [itemId, userId]);

    if (accessCheck.rows.length === 0) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }

    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(quantity);
    }

    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(unit?.trim() || null);
    }

    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }

    if (is_completed !== undefined) {
      updates.push(`is_completed = $${paramCount++}`);
      values.push(is_completed);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Nenhum campo para atualizar' });
      return;
    }

    values.push(itemId);
    const query = `UPDATE shopping_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    // Update list's updated_at timestamp
    await pool.query(`
      UPDATE shopping_lists SET updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT list_id FROM shopping_items WHERE id = $1)
    `, [itemId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }
    const itemId = parseInt(req.params.id);

    if (!itemId || isNaN(itemId)) {
      res.status(400).json({ error: 'ID do item inválido' });
      return;
    }

    // Check if user has write access to the list containing the item
    const accessCheck = await pool.query(`
      SELECT i.id FROM shopping_items i
      JOIN shopping_lists l ON i.list_id = l.id
      LEFT JOIN list_collaborators c ON l.id = c.list_id AND c.user_id = $2
      WHERE i.id = $1 AND (l.owner_id = $2 OR c.permission = 'write')
    `, [itemId, userId]);

    if (accessCheck.rows.length === 0) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    await pool.query('DELETE FROM shopping_items WHERE id = $1', [itemId]);

    // Update list's updated_at timestamp
    await pool.query(`
      UPDATE shopping_lists SET updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT list_id FROM shopping_items WHERE id = $1)
    `, [itemId]);

    res.json({ message: 'Item excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const toggleItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const itemId = parseInt(req.params.id);

    console.log(`[ToggleItem] Request: User ${userId}, Item ${itemId}`);

    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!itemId || isNaN(itemId)) {
      res.status(400).json({ error: 'ID do item inválido' });
      return;
    }

    // Check if user has write access to the list containing the item
    const accessCheck = await pool.query(`
      SELECT i.id, i.is_completed FROM shopping_items i
      JOIN shopping_lists l ON i.list_id = l.id
      LEFT JOIN list_collaborators c ON l.id = c.list_id AND c.user_id = $2
      WHERE i.id = $1 AND (l.owner_id = $2 OR c.permission = 'write')
    `, [itemId, userId]);

    if (accessCheck.rows.length === 0) {
      console.log(`[ToggleItem] Access denied or item not found. User: ${userId}, Item: ${itemId}`);
      res.status(403).json({ error: 'Acesso negado ou item não encontrado' });
      return;
    }

    const currentStatus = accessCheck.rows[0].is_completed;
    const newStatus = !currentStatus;

    const result = await pool.query(
      'UPDATE shopping_items SET is_completed = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newStatus, itemId]
    );

    // Update list's updated_at timestamp
    await pool.query(`
      UPDATE shopping_lists SET updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT list_id FROM shopping_items WHERE id = $1)
    `, [itemId]);

    console.log(`[ToggleItem] Success. Item ${itemId} toggled to ${newStatus}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};