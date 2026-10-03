import React, { useState } from 'react';
import { Item, ItemCreateInput } from '../api/client';
import { PlusCircle, Trash2, Tag, Loader2, Sparkles } from 'lucide-react';

interface ItemListProps {
  items: Item[];
  loading: boolean;
  onAddItem: (item: ItemCreateInput) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  loading,
  onAddItem,
  onDeleteItem,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('nature');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onAddItem({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
      });
      setTitle('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-grid">
      {/* Create New Item Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', fontWeight: 700 }}>
          Add Location / Item
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title / Name *</label>
            <input
              id="title"
              className="input"
              type="text"
              placeholder="e.g. Wawel Castle, Park Jordana"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="nature">🌿 Nature / Greenery</option>
              <option value="monuments">🏛️ Monuments / Sights</option>
              <option value="food">🍕 Food & Drinks</option>
              <option value="viewpoint">🌆 Viewpoint</option>
              <option value="quiet">🤫 Quiet / Low Noise</option>
              <option value="general">✨ General</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Vibe / Description</label>
            <textarea
              id="description"
              className="textarea"
              placeholder="e.g. Relaxing vibe, scenic views, accessible walkway"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            id="btn-save-item"
            disabled={submitting || !title.trim()}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving to SQLite...
              </>
            ) : (
              <>
                <PlusCircle size={18} /> Add to Database
              </>
            )}
          </button>
        </form>
      </div>

      {/* Item List Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            Stored in SQLite ({items.length})
          </h2>
          {loading && <Loader2 size={16} className="animate-spin" color="#94a3b8" />}
        </div>

        {items.length === 0 && !loading ? (
          <div className="empty-state">
            <Sparkles size={36} color="#6366f1" style={{ opacity: 0.7 }} />
            <h3>No entries yet</h3>
            <p>Add a sample attraction or test item to verify SQLite database persistence!</p>
          </div>
        ) : (
          <div className="items-list">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-info">
                  <h3>{item.title}</h3>
                  {item.description && <p>{item.description}</p>}
                  <div className="item-meta">
                    <span className="tag">
                      <Tag size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                      {item.category}
                    </span>
                    {item.created_at && (
                      <span className="date-text">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => onDeleteItem(item.id)}
                  title="Delete item"
                  id={`btn-delete-${item.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
