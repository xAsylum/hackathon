import React, { useEffect, useState, useCallback } from 'react';
import { api, HealthResponse, Item, ItemCreateInput } from './api/client';
import { Header } from './components/Header';
import { StatusCards } from './components/StatusCard';
import { ItemList } from './components/ItemList';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState<boolean>(false);

  const fetchHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const data = await api.getHealth();
      setHealth(data);
      setHealthError(null);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to connect to backend');
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setItemsLoading(true);
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchItems();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchItems]);

  const handleAddItem = async (item: ItemCreateInput) => {
    try {
      const newItem = await api.createItem(item);
      setItems((prev) => [newItem, ...prev]);
    } catch (err) {
      alert('Error creating item. Check if backend is running.');
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Error deleting item.');
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <StatusCards health={health} loading={healthLoading} error={healthError} />
      <ItemList
        items={items}
        loading={itemsLoading}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
};

export default App;
