import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from 'lucide-react';

export default function ProductCard({ product, onAddToCart }) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || null);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await onAddToCart({
      ...product,
      selectedSize,
      selectedColor
    });
    setIsAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card className="bg-stone-900 border-stone-800 hover:border-green-500/30 transition-all duration-300 overflow-hidden h-full flex flex-col">
        <div className="relative overflow-hidden h-64 bg-stone-800">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4 bg-green-500 text-stone-900 px-3 py-1 rounded-full text-sm font-semibold">
            ${product.price.toFixed(2)}
          </div>
        </div>
        
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-white text-lg">{product.name}</CardTitle>
              <p className="text-green-500 text-xs font-semibold mt-1 uppercase">{product.category}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between">
          <p className="text-stone-400 text-sm mb-4">{product.description}</p>
          
          {product.sizes?.length > 0 && (
            <div className="mb-4">
              <p className="text-stone-300 text-sm mb-2 font-medium">Select Size</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'bg-green-500 text-stone-900 border-green-500'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-green-500/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {product.colors?.length > 0 && (
            <div className="mb-4">
              <p className="text-stone-300 text-sm mb-2 font-medium">Select Color</p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                      selectedColor === color
                        ? 'bg-green-500 text-stone-900 border-green-500'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-green-500/50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <Button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}