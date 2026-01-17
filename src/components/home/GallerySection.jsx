import React from 'react';
import { motion } from 'framer-motion';

const images = [
    {
        url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&q=80',
        title: 'Bull Riding'
    },
    {
        url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
        title: 'Arena Action'
    },
    {
        url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80',
        title: 'Horse Racing'
    },
    {
        url: 'https://images.unsplash.com/photo-1494947665470-20322015e3a8?w=600&q=80',
        title: 'Western Spirit'
    },
    {
        url: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=80',
        title: 'Sunset Ride'
    },
    {
        url: 'https://images.unsplash.com/photo-1551377558-8e8e0e9e44b1?w=600&q=80',
        title: 'Rodeo Night'
    }
];

export default function GallerySection() {
    return (
        <section className="py-24 px-6 bg-stone-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span 
                        className="inline-block text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        Capture the Moment
                    </motion.span>
                    <motion.h2 
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        Gallery
                    </motion.h2>
                    <motion.div 
                        className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto"
                        initial={{ width: 0 }}
                        whileInView={{ width: 96 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    />
                </div>
                
                {/* Gallery Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                        <motion.div
                            key={index}
                            className={`relative overflow-hidden rounded-xl group cursor-pointer ${
                                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                            }`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <img 
                                src={image.url}
                                alt={image.title}
                                className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                                    index === 0 ? 'h-64 md:h-full' : 'h-48 md:h-64'
                                }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <span className="text-white font-semibold text-lg">{image.title}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}