import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Trophy, Users, Ticket } from 'lucide-react';

const features = [
    {
        icon: Trophy,
        title: "World-Class Competition",
        description: "Watch the best riders from across the country compete in thrilling events that showcase true rodeo excellence."
    },
    {
        icon: Users,
        title: "Family Entertainment",
        description: "Fun for all ages with activities, food vendors, live music, and memories that will last a lifetime."
    },
    {
        icon: Shield,
        title: "Safe & Secure",
        description: "Professional event management ensures a safe, enjoyable experience for everyone in attendance."
    },
    {
        icon: Ticket,
        title: "Easy Ticketing",
        description: "Simple online booking with instant confirmation. Choose your seats and get ready for the ride."
    }
];

export default function FeaturesSection() {
    return (
        <section className="py-24 px-6 bg-gradient-to-b from-stone-950 to-stone-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-full h-full" 
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
            </div>
            
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span 
                        className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        Why Choose Us
                    </motion.span>
                    <motion.h2 
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        The Ultimate Rodeo Experience
                    </motion.h2>
                    <motion.p 
                        className="text-stone-400 max-w-2xl mx-auto text-lg"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        More than just a show — it's an experience that celebrates the Western heritage 
                        and the incredible bond between rider and animal.
                    </motion.p>
                </div>
                
                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            className="text-center group"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-orange-500/20 flex items-center justify-center border border-green-500/20 group-hover:border-green-500/50 transition-all duration-300 group-hover:scale-110">
                                <feature.icon className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-stone-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}