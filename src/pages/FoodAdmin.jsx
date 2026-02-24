import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Save, Eye, X, GripVertical, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LOGO_URL } from '@/lib/constants';

const EMOJI_OPTIONS = ['🍔','🥓','🍄','🌭','🌶️','🥬','🐷','🍗','🥩','🥪','🍟','🧅','🥗','🥤','💧','🍋','🧊','🌮','🍕','🥧','🍦','🧁','🍩','☕','🍺','🥜','🌽','🥔','🫧','🔥'];

const DEFAULT_MENU = [
  { id:'b1', name:'Classic Smash Burger', desc:'Beef patty, American cheese, pickles, sauce', price:12.00, emoji:'🍔', cat:'burgers', popular:true, soldOut:false },
  { id:'b2', name:'Double Stack', desc:'Two smash patties, double cheese, lettuce', price:16.00, emoji:'🍔', cat:'burgers', popular:false, soldOut:false },
  { id:'b3', name:'Bacon BBQ Burger', desc:'Smoked bacon, BBQ sauce, crispy onions', price:15.00, emoji:'🥓', cat:'burgers', popular:false, soldOut:false },
  { id:'b4', name:'Mushroom Swiss', desc:'Sautéed mushrooms, Swiss cheese, garlic aioli', price:14.00, emoji:'🍄', cat:'burgers', popular:false, soldOut:false },
  { id:'d1', name:'Classic Dog', desc:'All-beef frank, mustard, ketchup, relish', price:8.00, emoji:'🌭', cat:'dogs', popular:true, soldOut:false },
  { id:'d2', name:'Chili Cheese Dog', desc:'Loaded with beef chili and melted cheese', price:11.00, emoji:'🌶️', cat:'dogs', popular:false, soldOut:false },
  { id:'d3', name:'Slaw Dog', desc:'Creamy coleslaw, mustard, onions', price:10.00, emoji:'🥬', cat:'dogs', popular:false, soldOut:false },
  { id:'d4', name:'Foot-Long', desc:'12" all-beef frank with all the fixins', price:12.00, emoji:'🌭', cat:'dogs', popular:false, soldOut:false },
  { id:'s1', name:'Pulled Pork', desc:'Slow-smoked pork, tangy slaw, brioche bun', price:14.00, emoji:'🐷', cat:'sandwiches', popular:true, soldOut:false },
  { id:'s2', name:'Grilled Chicken', desc:'Marinated chicken breast, lettuce, ranch', price:13.00, emoji:'🍗', cat:'sandwiches', popular:false, soldOut:false },
  { id:'s3', name:'Philly Cheesesteak', desc:'Shaved beef, peppers, onions, provolone', price:15.00, emoji:'🥩', cat:'sandwiches', popular:false, soldOut:false },
  { id:'s4', name:'BLT Club', desc:'Triple-decker bacon, lettuce, tomato, mayo', price:12.00, emoji:'🥪', cat:'sandwiches', popular:false, soldOut:false },
  { id:'x1', name:'Fries', desc:'Crispy golden fries, seasoned', price:5.00, emoji:'🍟', cat:'sides', popular:false, soldOut:false },
  { id:'x2', name:'Onion Rings', desc:'Beer-battered, crispy fried', price:6.00, emoji:'🧅', cat:'sides', popular:false, soldOut:false },
  { id:'x3', name:'Poutine', desc:'Fries, cheese curds, hot gravy', price:9.00, emoji:'🇨🇦', cat:'sides', popular:true, soldOut:false },
  { id:'x4', name:'Coleslaw', desc:'Creamy homestyle slaw', price:4.00, emoji:'🥗', cat:'sides', popular:false, soldOut:false },
  { id:'r1', name:'Pop', desc:'Coke, Sprite, or Ginger Ale', price:3.00, emoji:'🥤', cat:'drinks', popular:false, soldOut:false },
  { id:'r2', name:'Water', desc:'Bottled water', price:2.00, emoji:'💧', cat:'drinks', popular:false, soldOut:false },
  { id:'r3', name:'Lemonade', desc:'Fresh-squeezed lemonade', price:5.00, emoji:'🍋', cat:'drinks', popular:false, soldOut:false },
  { id:'r4', name:'Iced Tea', desc:'Sweetened or unsweetened', price:4.00, emoji:'🧊', cat:'drinks', popular:false, soldOut:false },
];

const DEFAULT_CATEGORIES = [
  { key: 'burgers', label: 'Burgers' },
  { key: 'dogs', label: 'Hot Dogs' },
  { key: 'sandwiches', label: 'Sandwiches' },
  { key: 'sides', label: 'Sides' },
  { key: 'drinks', label: 'Drinks' },
];

export default function FoodAdmin() {
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [taxRate, setTaxRate] = useState(13);
  const [taxLabel, setTaxLabel] = useState('HST');
  const [boothName, setBoothName] = useState('RODEO GRUB');
  const [unsaved, setUnsaved] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', desc: '', price: '', cat: 'burgers', emoji: '🍔', popular: false });

  // Category form
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');

  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rodeo_food_menu');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.menu) setMenuItems(data.menu);
        if (data.categories) setCategories(data.categories);
        if (data.taxRate) setTaxRate(Math.round(data.taxRate * 100));
        if (data.taxLabel) setTaxLabel(data.taxLabel);
        if (data.boothName) setBoothName(data.boothName);
      }
    } catch (e) { console.warn('Failed to load saved menu:', e); }
  }, []);

  const markUnsaved = () => { setUnsaved(true); setSaved(false); };

  const saveChanges = () => {
    const data = {
      boothName,
      taxRate: taxRate / 100,
      taxLabel,
      categories,
      menu: menuItems,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem('rodeo_food_menu', JSON.stringify(data));
    setUnsaved(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Item actions
  const toggleSoldOut = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, soldOut: !item.soldOut } : item));
    markUnsaved();
  };

  const togglePopular = (id) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, popular: !item.popular } : item));
    markUnsaved();
  };

  const deleteItem = (id) => {
    if (!confirm('Remove this item from the menu?')) return;
    setMenuItems(prev => prev.filter(item => item.id !== id));
    markUnsaved();
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: '', desc: '', price: '', cat: categories[0]?.key || 'burgers', emoji: '🍔', popular: false });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, desc: item.desc, price: item.price.toString(), cat: item.cat, emoji: item.emoji, popular: item.popular });
    setModalOpen(true);
  };

  const saveItem = () => {
    if (!form.name.trim()) return alert('Please enter an item name.');
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return alert('Please enter a valid price.');

    if (editingId) {
      setMenuItems(prev => prev.map(item =>
        item.id === editingId ? { ...item, name: form.name, desc: form.desc, price, cat: form.cat, emoji: form.emoji, popular: form.popular } : item
      ));
    } else {
      setMenuItems(prev => [...prev, {
        id: 'item_' + Date.now(),
        name: form.name, desc: form.desc, price, cat: form.cat, emoji: form.emoji, popular: form.popular, soldOut: false
      }]);
    }
    setModalOpen(false);
    markUnsaved();
  };

  // Category actions
  const addCategory = () => {
    const key = newCatKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const label = newCatLabel.trim();
    if (!key || !label) return alert('Enter both a key and label.');
    if (categories.find(c => c.key === key)) return alert('Category already exists.');
    setCategories(prev => [...prev, { key, label }]);
    setNewCatKey(''); setNewCatLabel('');
    markUnsaved();
  };

  const removeCategory = (key) => {
    const count = menuItems.filter(i => i.cat === key).length;
    if (count > 0 && !confirm(`${count} items use this category. Remove anyway?`)) return;
    setCategories(prev => prev.filter(c => c.key !== key));
    markUnsaved();
  };

  return (
    <div className="min-h-screen bg-stone-950 pt-20 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-3">
              <img src={LOGO_URL} alt="" className="h-8 w-auto" />
              Menu Manager
            </h1>
            <p className="text-stone-500 text-sm mt-1">Staff Only — Manage the food booth menu</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Saved
              </motion.span>
            )}
            {unsaved && (
              <span className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" /> Unsaved changes
              </span>
            )}
            <Link to={createPageUrl('FoodKiosk')}>
              <Button variant="outline" size="sm" className="border-stone-700 text-stone-300 hover:bg-stone-800">
                <Eye className="w-4 h-4 mr-1" /> Preview Kiosk
              </Button>
            </Link>
            <Button onClick={saveChanges} size="sm" className="bg-green-600 hover:bg-green-500 text-white">
              <Save className="w-4 h-4 mr-1" /> Save & Publish
            </Button>
          </div>
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="pt-4 pb-4">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tax Rate</label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="number" value={taxRate} onChange={e => { setTaxRate(e.target.value); markUnsaved(); }}
                  className="bg-stone-800 border-stone-700 text-stone-200 w-20" min="0" max="30" />
                <span className="text-stone-400 font-semibold">%</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="pt-4 pb-4">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tax Label</label>
              <Input value={taxLabel} onChange={e => { setTaxLabel(e.target.value); markUnsaved(); }}
                className="bg-stone-800 border-stone-700 text-stone-200 mt-1" />
            </CardContent>
          </Card>
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="pt-4 pb-4">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Booth Name</label>
              <Input value={boothName} onChange={e => { setBoothName(e.target.value); markUnsaved(); }}
                className="bg-stone-800 border-stone-700 text-stone-200 mt-1" />
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card className="bg-stone-900 border-stone-800 mb-6">
          <CardContent className="pt-4 pb-4">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Categories</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map(c => (
                <div key={c.key} className="flex items-center gap-1 bg-stone-800 border border-stone-700 rounded-full px-3 py-1 text-sm text-stone-300">
                  {c.label}
                  <button onClick={() => removeCategory(c.key)} className="ml-1 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input placeholder="key (e.g. desserts)" value={newCatKey} onChange={e => setNewCatKey(e.target.value)}
                className="bg-stone-800 border-stone-700 text-stone-200 max-w-[180px]" />
              <Input placeholder="Label (e.g. Desserts)" value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)}
                className="bg-stone-800 border-stone-700 text-stone-200 max-w-[180px]" />
              <Button onClick={addCategory} variant="outline" size="sm" className="border-stone-700 text-stone-300 hover:bg-stone-800">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-stone-200">Menu Items</h2>
            <span className="text-sm text-stone-500">{menuItems.length} items</span>
          </div>
          <Button onClick={openAddModal} className="bg-green-600 hover:bg-green-500 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        {/* Menu Items Table */}
        <Card className="bg-stone-900 border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-10"></th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">Item</th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-24">Price</th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-28">Category</th>
                  <th className="text-center text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-20">Popular</th>
                  <th className="text-center text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-24">Status</th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id} className={`border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors ${item.soldOut ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3 text-2xl">{item.emoji}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-200 text-sm">{item.name}</p>
                      <p className="text-stone-500 text-xs">{item.desc}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-green-400">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-green-500/30 text-green-400 capitalize text-xs">{item.cat}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={item.popular} onChange={() => togglePopular(item.id)}
                        className="w-4 h-4 accent-green-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleSoldOut(item.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          item.soldOut
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}>
                        {item.soldOut ? 'SOLD OUT' : 'Available'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(item)} className="p-2 hover:bg-stone-700 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4 text-stone-400" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-stone-100 mb-4">{editingId ? 'Edit Item' : 'Add Item'}</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase">Name</label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-stone-800 border-stone-700 text-stone-200 mt-1" placeholder="e.g. Classic Smash Burger" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase">Description</label>
                    <Input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                      className="bg-stone-800 border-stone-700 text-stone-200 mt-1" placeholder="e.g. Beef patty, cheese, pickles" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 uppercase">Price ($)</label>
                      <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        className="bg-stone-800 border-stone-700 text-stone-200 mt-1" step="0.25" min="0" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 uppercase">Category</label>
                      <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                        className="w-full mt-1 bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2 text-sm">
                        {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-500 uppercase">Emoji</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                          className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                            form.emoji === e ? 'bg-green-500/20 border-2 border-green-500' : 'bg-stone-800 border border-stone-700 hover:border-stone-600'
                          }`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.popular} onChange={e => setForm(f => ({ ...f, popular: e.target.checked }))}
                      className="accent-green-500" />
                    <span className="text-sm text-stone-300">Mark as Popular</span>
                  </label>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button onClick={() => setModalOpen(false)} variant="outline" className="flex-1 border-stone-700 text-stone-300 hover:bg-stone-800">
                    Cancel
                  </Button>
                  <Button onClick={saveItem} className="flex-1 bg-green-600 hover:bg-green-500 text-white">
                    {editingId ? 'Save Changes' : 'Add Item'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Unsaved changes bar */}
      <AnimatePresence>
        {unsaved && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-stone-700 px-6 py-4 flex items-center justify-center gap-4 z-30 md:ml-48"
          >
            <span className="text-yellow-400 text-sm font-semibold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Unsaved changes
            </span>
            <Button onClick={saveChanges} size="sm" className="bg-green-600 hover:bg-green-500 text-white">
              <Save className="w-4 h-4 mr-1" /> Save & Publish
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="border-stone-700 text-stone-400 hover:bg-stone-800">
              Discard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
