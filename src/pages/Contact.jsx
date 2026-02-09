import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Send, CheckCircle, Loader2 } from 'lucide-react';
import Map from '@/components/Map';

const contactInfo = [
    {
        icon: MapPin,
        title: 'Address',
        details: ['588 Sideroad 10 S.', 'Walkerton, ON']
    },
    {
        icon: Phone,
        title: 'Phone',
        details: ['519-881-6575', '519-889-1343']
    },
    {
        icon: Mail,
        title: 'Email',
        details: ['info@holmdalerodeo.com', 'tickets@holmdalerodeo.com']
    }
];

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
    };
    
    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6 relative">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute top-8 left-8 z-20">
                <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/a90833e02_LogoBevel.png"
                    alt="Holmdale Pro Rodeo"
                    className="max-w-[200px]"
                />
            </motion.div>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span 
                        className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Get In Touch
                    </motion.span>
                    <motion.h1 
                        className="text-4xl md:text-6xl font-bold text-white mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        Contact Us
                    </motion.h1>
                    <motion.p 
                        className="text-stone-400 max-w-2xl mx-auto text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        Have questions about events, tickets, or sponsorship opportunities? 
                        We'd love to hear from you.
                    </motion.p>
                </div>
                
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        {contactInfo.map((info, index) => (
                            <motion.div
                                key={info.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-stone-900 border-stone-800 hover:border-green-500/30 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                <info.icon className="w-6 h-6 text-green-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold mb-2">{info.title}</h3>
                                                {info.details.map((detail, i) => (
                                                    <p key={i} className="text-white text-sm">{detail}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                    
                    {/* Contact Form */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-stone-900 border-stone-800">
                            <CardHeader>
                                <CardTitle className="text-white">Send Us a Message</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isSubmitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                                        <p className="text-stone-400 mb-6">Thank you for reaching out. We'll get back to you soon.</p>
                                        <Button 
                                            onClick={() => setIsSubmitted(false)}
                                            variant="outline"
                                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                                        >
                                            Send Another Message
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <Label htmlFor="name" className="text-stone-300">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="mt-2 bg-stone-800 border-stone-700 text-white focus:border-green-500"
                                                    placeholder="John Doe"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="email" className="text-stone-300">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="mt-2 bg-stone-800 border-stone-700 text-white focus:border-green-500"
                                                    placeholder="john@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="subject" className="text-stone-300">Subject</Label>
                                            <Input
                                                id="subject"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="mt-2 bg-stone-800 border-stone-700 text-white focus:border-green-500"
                                                placeholder="How can we help?"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label htmlFor="message" className="text-stone-300">Message</Label>
                                            <Textarea
                                                id="message"
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                className="mt-2 bg-stone-800 border-stone-700 text-white focus:border-green-500 h-36"
                                                placeholder="Tell us more about your inquiry..."
                                                required
                                            />
                                        </div>
                                        
                                        <Button 
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-green-500 hover:bg-green-600 text-stone-900 font-semibold py-6 text-lg"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
                
                {/* Map Section */}
                <motion.div
                    className="mt-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <Card className="bg-stone-900 border-stone-800 overflow-hidden">
                        <Map />
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}