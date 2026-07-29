import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Clock, Flag, Music, Beer, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const days = [
{
  day: 'Friday',
  date: 'July 31',
  accent: 'FREE EVENT',
  items: [
  { time: '1:00 PM', what: 'Team Penning', detail: 'Western Ontario Team Penning Association sanctioned event — free to watch!' },
  { time: '5:00 PM', what: 'Wing Night', detail: 'Kick off rodeo weekend right — come hungry.' }]
},
{
  day: 'Saturday',
  date: 'August 1',
  accent: 'PRO RODEO',
  items: [
  { time: '11:00 AM', what: 'Gates Open', detail: 'Bar, food booth & food trucks all day.' },
  { time: '2:00 PM', what: 'High School Rodeo', detail: 'The next generation of rodeo athletes.' },
  { time: '7:00 PM', what: 'Pro Rodeo Performance', detail: 'By Rawhide Rodeos — see the running order below.' }]
},
{
  day: 'Sunday',
  date: 'August 2',
  accent: 'PRO RODEO',
  items: [
  { time: '11:00 AM', what: 'Gates Open', detail: 'Bar, food booth & food trucks all day.' },
  { time: '2:00 PM', what: 'High School Rodeo', detail: 'The next generation of rodeo athletes.' },
  { time: '7:00 PM', what: 'Pro Rodeo Performance', detail: 'Final performance of the weekend!' }]
}];


const runningOrder = [
{ name: 'Grand Entry & Opening Ceremonies', note: 'Sponsor flags, prayer and anthem' },
{ name: 'Bareback & Saddle Bronc Riding', note: null },
{ name: 'Steer Riding', note: null },
{ name: 'Team Roping', note: null },
{ name: 'Trick Roping', note: 'Specialty act' },
{ name: 'Breakaway Roping', note: null },
{ name: 'Trick Riding', note: 'Specialty act' },
{ name: 'Pole Bending & Jr. Pole Bending', note: null },
{ name: 'Frisbees for Hospice & Intermission', note: 'Everyone can play — 1 for $5 or 3 for $10. Take your shot at a $500 STIHL prize pack, up for grabs both days! All proceeds to Saugeen Hospice.' },
{ name: 'Barrel Racing & Jr. Barrel Racing', note: null },
{ name: 'Tie-Down Roping', note: null },
{ name: 'Drill Team', note: null },
{ name: 'Jr. Bull Riding & Bull Riding', note: 'The main event!' },
{ name: 'Closing & Meet-and-Greet', note: 'Stick around and meet the riders' }];


export default function Schedule() {
  return (
    <div className="min-h-screen bg-stone-950">
            {/* Hero */}
            <section className="relative pt-32 pb-16 px-6">
                <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560986752-2e31d9507413?w=1920&q=80')`
          }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/80 to-stone-950" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.span
            className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}>
                        July 31 – August 2, 2026
                    </motion.span>
                    <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}>
                        Event
                        <span className="text-green-500"> Schedule</span>
                    </motion.h1>
                    <motion.p
            className="text-stone-300 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>
                        Three days of rodeo action at the Holmdale Rodeo Grounds in Walkerton.
                        Bar, food booth and food trucks open all weekend.
                    </motion.p>
                </div>
            </section>

            {/* Day-by-day schedule */}
            <section className="pb-16 px-6">
                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                    {days.map((d, i) => (
            <motion.div
              key={d.day}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}>
                            <Card className="bg-stone-900 border-stone-800 p-6 h-full">
                                <div className="flex items-baseline justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-white">{d.day}</h2>
                                    <span className="text-green-500 font-semibold">{d.date}</span>
                                </div>
                                <span className="inline-block text-xs font-bold tracking-wider text-stone-900 bg-green-500 rounded-full px-3 py-1 mb-5">
                                    {d.accent}
                                </span>
                                <div className="space-y-4">
                                    {d.items.map((it) => (
                    <div key={it.time + it.what} className="flex gap-3">
                                            <Clock className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {it.time} — {it.what}
                                                </p>
                                                <p className="text-stone-400 text-sm">{it.detail}</p>
                                            </div>
                                        </div>
                  ))}
                                </div>
                            </Card>
                        </motion.div>
          ))}
                </div>
            </section>

            {/* Running order */}
            <section className="pb-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-3">
                            Saturday & Sunday · 7:00 PM
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            Pro Rodeo <span className="text-green-500">Running Order</span>
                        </h2>
                        <p className="text-stone-400 mt-3">
                            Here's how each performance unfolds, start to finish.
                        </p>
                    </div>

                    <Card className="bg-stone-900 border-stone-800 p-6 md:p-8">
                        <ol className="space-y-3">
                            {runningOrder.map((ev, i) => (
                <motion.li
                  key={ev.name}
                  className="flex items-center gap-4 border-b border-stone-800 last:border-0 pb-3 last:pb-0"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}>
                                    <span className="w-8 h-8 rounded-full bg-stone-800 text-green-500 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">{ev.name}</p>
                                        {ev.note && <p className="text-stone-400 text-sm">{ev.note}</p>}
                                    </div>
                                </motion.li>
              ))}
                        </ol>
                    </Card>
                    <p className="text-stone-500 text-sm text-center mt-4">
                        Running order subject to change on performance day.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="pb-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 p-10">
                        <Star className="w-10 h-10 text-stone-900 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-stone-950 mb-3">
                            Don't Miss the Action
                        </h2>
                        <p className="text-stone-900/80 mb-6">
                            This event is expected to sell out. Adult tickets are $35 +HST online or $40 at the gate.
                            Buy online to lock in your spot before it sells out — and skip the gate lineup!
                        </p>
                        <Link to={createPageUrl('Events')}>
                            <Button className="bg-stone-950 hover:bg-stone-800 text-white font-semibold gap-2 text-lg px-8 py-3">
                                <Ticket className="w-5 h-5" />
                                Buy Tickets
                            </Button>
                        </Link>
                    </Card>
                </div>
            </section>
        </div>);
}
