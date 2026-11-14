import React from 'react';
import { motion } from 'framer-motion';

const images = [
    {
        url: '/images/92a9412-alvinstonrodeo2023-sunday.jpg',
        title: 'Bull Riding'
    },
    {
        url: '/images/pxl-20250802-230419309.jpg',
        title: 'Arena Action'
    },
    {
        url: '/images/pxl-20250803-012047586.jpg',
        title: 'The Shark Tank'
    },
    {
        url: '/images/pxl-20250801-214130202.jpg',
        title: 'Western Spirit'
    },
    {
        url: '/images/pxl-20250803-012117808-long-exposure.jpg',
        title: 'Fun for all ages'
    },
    {
        url: '/images/pxl-20250804-010943127.jpg',
        title: 'The Saloon'
    }
];

export default function GallerySection() {
    return (
        <section className="py-24 px-6 bg-stone-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span 
                        className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4"
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
                        className="w-24 h-1 bg-green-500 mx-auto"
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