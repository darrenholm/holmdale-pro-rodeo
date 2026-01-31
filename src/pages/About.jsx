import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Trophy, Users, Calendar, Star, Award, Heart } from 'lucide-react';
import SponsorTicker from '../components/SponsorTicker';

const stats = [
{ icon: Calendar, value: '150+', label: 'Years of Farming' },
{ icon: Users, value: '10,000+', label: 'Fans Entertained' },
{ icon: Trophy, value: '50+', label: 'Champion Riders' },
{ icon: Star, value: '4.9', label: 'Average Rating' }];


const values = [
{
  icon: Award,
  title: 'Excellence',
  description: 'We strive for the highest standards in every event, from safety to entertainment.'
},
{
  icon: Heart,
  title: 'Passion',
  description: 'Our love for Western heritage and rodeo culture drives everything we do.'
},
{
  icon: Users,
  title: 'Community',
  description: 'Building connections and creating memories that bring people together.'
}];


export default function About() {
  return (
    <div className="min-h-screen bg-stone-950">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1494947665470-20322015e3a8?w=1920&q=80')`
          }}>

                    <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/80 to-stone-950" />
                </div>
                
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.span
            className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}>

                        Our Story
                    </motion.span>
                    <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}>

                        A Legacy of
                        <span className="text-green-500"> Farming Excellence</span>
                    </motion.h1>
                    <motion.p className="text-xl text-stone-300 leading-relaxed"

          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}>Holmdale Farms has been continuously operated by the Holm Family since 1874. Through 6 generations, the farm has changed from a 100 acres mixed farming operation to more specialized farming in dairy and cash crops along with a well known foundation quarter horse breeding program.
Holm Potato Farms grows approimately 800 acres potatoes annually, focussed on the seed potato market annually providing seed to other potato growers across Canada and the United States. In addition table potatos and other cash crops are raised.



          </motion.p>
                </div>
            </section>
            
            {/* Stats Section */}
            <section className="py-16 px-6 bg-stone-900">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                  key={stat.label}
                                  className="text-center"
                                  initial={{ opacity: 0, y: 20 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: index * 0.1 }}>
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <Icon className="w-7 h-7 text-green-500" />
                                    </div>
                                    <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
                                    <p className="text-stone-400">{stat.label}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>
            
            {/* Our Story */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}>

                            <span className="text-green-500 text-sm font-semibold tracking-wider uppercase mb-4 block">
                                The Beginning
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                From The Pioneer Days Until Today, Horses and Cattle are in Our Blood
                            </h2>
                            <div className="space-y-4 text-stone-300 leading-relaxed">
                                <p className="">What started in 2024 being the first Rodeo held in Bruce County in many years to celebrate the 150th anniversary of our family farm. It has grown to be one of the most anticipated rodeos in the region. Our founders, passionate farmers and rodeo enthusiasts, dreamed of creating an event that would celebrate the true spirit of the early days of life on the farm.




                </p>
                                <p>
                                    Today, we host thousands of fans each year, featuring world-class competitors 
                                    in bull riding, barrel racing, bronc riding, and team roping. Our commitment 
                                    to excellence, safety, and entertainment has made us a beloved tradition 
                                    for families across the nation.
                                </p>
                                <p>
                                    Beyond the arena, we're proud to support local communities, preserve Western 
                                    heritage, and inspire the next generation of rodeo champions.
                                </p>
                            </div>
                        </motion.div>
                        
                        <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}>

                            <div className="space-y-4">
                                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/7ab4b7466_Planter2.jpg"
                  alt="Farm image"
                  className="w-full h-48 object-cover rounded-xl" />

                                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/d82a12661_Sprayer1.jpg"
                  alt="Farm image"
                  className="w-full h-64 object-cover rounded-xl" />

                                </div>
                             <div className="space-y-4 pt-8">
                                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/11dc58395_JohnDeere.jpg"
                  alt="Farm image"
                  className="w-full h-64 object-cover rounded-xl" />

                                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696b7ab40d412f960295a323/a80e32f3b_CowTrailerPhoto.jpg"
                  alt="Farm image"
                  className="w-full h-48 object-cover rounded-xl" />

                                </div>
                                </motion.div>
                    </div>
                </div>
            </section>
            
            {/* Values */}
            <section className="py-24 px-6 bg-stone-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-green-500 text-sm font-semibold tracking-wider uppercase mb-4 block">
                            What We Stand For
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Our Core Values
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-orange-500 mx-auto" />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <motion.div
                                  key={value.title}
                                  initial={{ opacity: 0, y: 30 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: index * 0.1 }}>
                                    <Card className="bg-stone-800 border-stone-700 p-8 h-full text-center hover:border-green-500/30 transition-all duration-300">
                                        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-green-500/20 flex items-center justify-center">
                                            <Icon className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                                        <p className="text-stone-400">{value.description}</p>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Sponsor Ticker */}
            <SponsorTicker />
        </div>);

}