import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CheckCircle, Loader2, X } from 'lucide-react';
import { api } from '@/api/railwayClient';
import { LOGO_URL } from '@/lib/constants';

// ═══════════════════════════════════════════════════
//  MENU DATA — edit this to change the kiosk menu
// ═══════════════════════════════════════════════════

const DEFAULT_MENU = [
  { id:'b1', name:'Classic Smash Burger', desc:'Beef patty, American cheese, pickles, sauce', price:1200, emoji:'🍔', cat:'burgers', popular:true, soldOut:false },
  { id:'b2', name:'Double Stack', desc:'Two smash patties, double cheese, lettuce', price:1600, emoji:'🍔', cat:'burgers', popular:false, soldOut:false },
  { id:'b3', name:'Bacon BBQ Burger', desc:'Smoked bacon, BBQ sauce, crispy onions', price:1500, emoji:'🥓', cat:'burgers', popular:false, soldOut:false },
  { id:'b4', name:'Mushroom Swiss', desc:'Sautéed mushrooms, Swiss cheese, garlic aioli', price:1400, emoji:'🍄', cat:'burgers', popular:false, soldOut:false },
  { id:'d1', name:'Classic Dog', desc:'All-beef frank, mustard, ketchup, relish', price:800, emoji:'🌭', cat:'dogs', popular:true, soldOut:false },
  { id:'d2', name:'Chili Cheese Dog', desc:'Loaded with beef chili and melted cheese', price:1100, emoji:'🌶️', cat:'dogs', popular:false, soldOut:false },
  { id:'d3', name:'Slaw Dog', desc:'Creamy coleslaw, mustard, onions', price:1000, emoji:'🥬', cat:'dogs', popular:false, soldOut:false },
  { id:'d4', name:'Foot-Long', desc:'12" all-beef frank with all the fixins', price:1200, emoji:'🌭', cat:'dogs', popular:false, soldOut:false },
  { id:'s1', name:'Pulled Pork', desc:'Slow-smoked pork, tangy slaw, brioche bun', price:1400, emoji:'🐷', cat:'sandwiches', popular:true, soldOut:false },
  { id:'s2', name:'Grilled Chicken', desc:'Marinated chicken breast, lettuce, ranch', price:1300, emoji:'🍗', cat:'sandwiches', popular:false, soldOut:false },
  { id:'s3', name:'Philly Cheesesteak', desc:'Shaved beef, peppers, onions, provolone', price:1500, emoji:'🥩', cat:'sandwiches', popular:false, soldOut:false },
  { id:'s4', name:'BLT Club', desc:'Triple-decker bacon, lettuce, tomato, mayo', price:1200, emoji:'🥪', cat:'sandwiches', popular:false, soldOut:false },
  { id:'x1', name:'Fries', desc:'Crispy golden fries, seasoned', price:500, emoji:'🍟', cat:'sides', popular:false, soldOut:false },
  { id:'x2', name:'Onion Rings', desc:'Beer-battered, crispy fried', price:600, emoji:'🧅', cat:'sides', popular:false, soldOut:false },
  { id:'x3', name:'Poutine', desc:'Fries, cheese curds, hot gravy', price:900, emoji:'🇨🇦', cat:'sides', popular:true, soldOut:false },
  { id:'x4', name:'Coleslaw', desc:'Creamy homestyle slaw', price:400, emoji:'🥗', cat:'sides', popular:false, soldOut:false },
  { id:'r1', name:'Pop', desc:'Coke, Sprite, or Ginger Ale', price:300, emoji:'🥤', cat:'drinks', popular:false, soldOut:false },
  { id:'r2', name:'Water', desc:'Bottled water', price:200, emoji:'💧', cat:'drinks', popular:false, soldOut:false },
  { id:'r3', name:'Lemonade', desc:'Fresh-squeezed lemonade', price:500, emoji:'🍋', cat:'drinks', popular:false, soldOut:false },
  { id:'r4', name:'Iced Tea', desc:'Sweetened or unsweetened', price:400, emoji:'🧊', cat:'drinks', popular:false, soldOut:false },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'burgers', label: 'Burgers' },
  { key: 'dogs', label: 'Hot Dogs' },
  { key: 'sandwiches', label: 'Sandwiches' },
  { key: 'sides', label: 'Sides' },
  { key: 'drinks', label: 'Drinks' },
];

const TAX_RATE = 0.13;
const TAX_LABEL = 'HST';

function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}

// ═══════════════════════════════════════════════════
//  MENU ITEM CARD
// ═══════════════════════════════════════════════════

function MenuCard({ item, quantity, onAdd }) {
  if (item.soldOut) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onAdd(item.id)}
      className="bg-stone-800 border border-stone-700 rounded-xl p-4 text-left transition-all hover:border-green-500/40 hover:bg-stone-800/80 relative group"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-100 text-sm truncate">{item.name}</h3>
            {item.popular && (
              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">POPULAR</span>
            )}
          </div>
          <p className="text-stone-500 text-xs mt-0.5 line-clamp-1">{item.desc}</p>
          <p className="text-green-400 font-bold text-base mt-1">{formatPrice(item.price)}</p>
        </div>
      </div>
      {quantity > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
          {quantity}
        </div>
      )}
      <div className="absolute inset-0 rounded-xl bg-green-500/0 group-hover:bg-green-500/5 transition-colors" />
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════
//  CART DRAWER
// ═══════════════════════════════════════════════════

function CartDrawer({ cart, menu, onAdd, onRemove, onClear, onCheckout, isOpen, onClose }) {
  const items = Object.entries(cart).filter(([_, qty]) => qty > 0);
  const subtotal = items.reduce((sum, [id, qty]) => {
    const item = menu.find(m => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, [_, qty]) => sum + qty, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-stone-900 border-l border-stone-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
              <h2 className="text-xl font-bold text-stone-100">Your Order</h2>
              <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-500">Your cart is empty</p>
                </div>
              ) : (
                items.map(([id, qty]) => {
                  const item = menu.find(m => m.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 bg-stone-800 rounded-lg p-3 border border-stone-700">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-200 text-sm truncate">{item.name}</p>
                        <p className="text-green-400 font-bold text-sm">{formatPrice(item.price * qty)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onRemove(id)} className="w-8 h-8 rounded-lg bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors">
                          {qty === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5 text-stone-300" />}
                        </button>
                        <span className="w-8 text-center font-bold text-stone-200">{qty}</span>
                        <button onClick={() => onAdd(id)} className="w-8 h-8 rounded-lg bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5 text-stone-300" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-stone-700 px-6 py-4 space-y-3">
                <div className="flex justify-between text-sm text-stone-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-400">
                  <span>{TAX_LABEL} ({Math.round(TAX_RATE * 100)}%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-stone-100 pt-2 border-t border-stone-700">
                  <span>Total</span>
                  <span className="text-green-400">{formatPrice(total)}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={onClear} className="flex-shrink-0 px-4 py-3 rounded-xl bg-stone-800 border border-stone-600 text-stone-300 font-semibold hover:bg-stone-700 transition-colors">
                    Clear
                  </button>
                  <button onClick={onCheckout} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20">
                    Pay {formatPrice(total)}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════
//  SUCCESS SCREEN
// ═══════════════════════════════════════════════════

function SuccessScreen({ orderNumber, onReset }) {
  useEffect(() => {
    const timer = setTimeout(onReset, 10000);
    return () => clearTimeout(timer);
  }, [onReset]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-stone-950 z-50 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
      </motion.div>
      <h1 className="text-4xl font-bold text-stone-100 mt-6">Order Placed!</h1>
      <p className="text-stone-400 mt-2">Your order number is</p>
      <div className="mt-4 px-10 py-6 bg-stone-800 border-2 border-green-500 rounded-2xl">
        <span className="text-7xl font-black text-green-400 tracking-wider">#{orderNumber}</span>
      </div>
      <p className="text-stone-500 mt-6">Listen for your number at the pickup counter</p>
      <button onClick={onReset} className="mt-8 px-8 py-3 bg-stone-800 border border-stone-600 rounded-xl text-stone-300 font-semibold hover:bg-stone-700 transition-colors">
        New Order
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
//  MAIN KIOSK COMPONENT
// ═══════════════════════════════════════════════════

export default function FoodKiosk() {
  const [menu, setMenu] = useState(DEFAULT_MENU);
  const [activeCat, setActiveCat] = useState('all');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [error, setError] = useState('');

  // Try to load menu from backend (for admin-managed menus)
  useEffect(() => {
    async function loadMenu() {
      try {
        const saved = localStorage.getItem('rodeo_food_menu');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.menu && data.menu.length > 0) {
            setMenu(data.menu.map(item => ({
              ...item,
              price: typeof item.price === 'number' && item.price < 100
                ? Math.round(item.price * 100)  // Convert from dollars to cents
                : item.price
            })));
          }
        }
      } catch (e) {
        console.log('Using default menu');
      }
    }
    loadMenu();
  }, []);

  const filteredMenu = activeCat === 'all' 
    ? menu.filter(m => !m.soldOut) 
    : menu.filter(m => m.cat === activeCat && !m.soldOut);

  const addItem = useCallback((id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id] <= 1) delete next[id];
      else next[id]--;
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu.find(m => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const handleCheckout = async () => {
    setPaying(true);
    setError('');
    setCartOpen(false);

    try {
      // Build line items
      const items = Object.entries(cart).map(([id, qty]) => {
        const item = menu.find(m => m.id === id);
        return { id, name: item.name, price: item.price, quantity: qty };
      });

      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const tax = Math.round(subtotal * TAX_RATE);
      const total = subtotal + tax;

      // In production, this would call Moneris Go Cloud API
      // For now, simulate payment success
      // const response = await api.post('/moneris/food-checkout', { items, subtotal, tax, total });

      // Generate order number
      const num = Math.floor(Math.random() * 900) + 100;
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setOrderNumber(num);
      setCart({});
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Checkout error:', err);
    } finally {
      setPaying(false);
    }
  };

  if (orderNumber) {
    return <SuccessScreen orderNumber={orderNumber} onReset={() => setOrderNumber(null)} />;
  }

  return (
    <div className="min-h-screen bg-stone-950 pt-20 md:pt-0">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-stone-950/95 backdrop-blur-lg border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Holmdale Pro Rodeo" className="h-9 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-stone-100">Rodeo Grub</h1>
              <p className="text-xs text-stone-500">Tap items to add to your order</p>
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-600/20"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{formatPrice(totalPrice + Math.round(totalPrice * TAX_RATE))}</span>
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-stone-100 text-stone-900 text-xs font-black rounded-full flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCat(cat.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCat === cat.key
                    ? 'bg-green-500 text-white'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMenu.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              quantity={cart[item.id] || 0}
              onAdd={addItem}
            />
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        cart={cart}
        menu={menu}
        onAdd={addItem}
        onRemove={removeItem}
        onClear={clearCart}
        onCheckout={handleCheckout}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      {/* Paying overlay */}
      <AnimatePresence>
        {paying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/90 z-50 flex flex-col items-center justify-center"
          >
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-stone-300 font-semibold mt-4">Processing payment...</p>
            <p className="text-stone-500 text-sm mt-1">Please tap your card on the terminal</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-700 text-red-200 px-6 py-3 rounded-xl font-semibold z-50"
            onClick={() => setError('')}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
