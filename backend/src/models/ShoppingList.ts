export interface ShoppingList {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateListData {
  name: string;
  description?: string;
  owner_id: number;
}

export interface UpdateListData {
  name?: string;
  description?: string;
}

export interface ListCollaborator {
  id: number;
  list_id: number;
  user_id: number;
  permission: 'read' | 'write';
  added_at: Date;
}

export interface ListWithItems extends ShoppingList {
  items: ShoppingItem[];
  collaborators: ListCollaborator[];
}

export interface ShoppingItem {
  id: number;
  list_id: number;
  name: string;
  quantity: number;
  unit?: string;
  price?: number;
  is_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateItemData {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
}

export interface UpdateItemData {
  name?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  is_completed?: boolean;
}
