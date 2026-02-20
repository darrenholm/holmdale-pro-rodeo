import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { railwayAuth } from '@/components/railwayAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar, Edit, Loader2, CheckCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function ManageEvents() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        time: '',
        location: '',
        description: '',
        image_url: '',
        general_price: 30,
        child_price: 10,
        family_price: 70
    });

    const { data: events, isLoading } = useQuery({
        queryKey: ['events-manage'],
        queryFn: async () => {
            const result = await railwayAuth.callWithAuth('getEventsFromRailway');
            return result?.data || [];
        }
    });

    const createEvent = useMutation({
        mutationFn: async (eventData) => {
            const token = localStorage.getItem('railway_auth_token');
            const response = await base44.functions.invoke('createEventRailway', {
                token,
                ...eventData,
                tickets_sold: 0
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events-manage'] });
            setShowForm(false);
            setEditingEvent(null);
            setFormData({
                name: '',
                date: '',
                time: '',
                location: '',
                description: '',
                image_url: '',
                general_price: 30,
                child_price: 10,
                family_price: 70
            });
        }
    });

    const updateEvent = useMutation({
        mutationFn: async ({ eventId, eventData }) => {
            const token = localStorage.getItem('railway_auth_token');
            const response = await base44.functions.invoke('updateEventRailway', {
                token,
                eventId,
                ...eventData
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events-manage'] });
            setShowForm(false);
            setEditingEvent(null);
            setFormData({
                name: '',
                date: '',
                time: '',
                location: '',
                description: '',
                image_url: '',
                general_price: 30,
                child_price: 10,
                family_price: 70
            });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingEvent) {
            updateEvent.mutate({ eventId: editingEvent.id, eventData: formData });
        } else {
            createEvent.mutate(formData);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name || event.title,
            date: event.date ? event.date.split('T')[0] : '',
            time: event.time,
            location: event.location || event.venue,
            description: event.description,
            image_url: event.image_url || '',
            general_price: event.general_price || 30,
            child_price: event.child_price || 10,
            family_price: event.family_price || 70
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingEvent(null);
        setFormData({
            name: '',
            date: '',
            time: '',
            location: '',
            description: '',
            image_url: '',
            general_price: 30,
            child_price: 20,
            family_price: 100
        });
    };

    return (
        <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <Link 
                    to={createPageUrl('Staff')}
                    className="inline-flex items-center gap-2 text-stone-400 hover:text-green-400 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Staff Dashboard
                </Link>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Manage Events</h1>
                    <Button
                        onClick={() => showForm ? handleCancel() : setShowForm(true)}
                        className="bg-green-500 hover:bg-green-600 text-stone-900"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {showForm ? 'Cancel' : 'Create Event'}
                    </Button>
                </div>

                {showForm && (
                    <Card className="bg-stone-900 border-stone-800 mb-8">
                        <CardHeader>
                            <CardTitle className="text-white">
                                {editingEvent ? 'Edit Event' : 'Create New Event'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-stone-300">Event Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-2 bg-stone-800 border-stone-700 text-white"
                                            placeholder="Holmdale Rodeo 2026"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-stone-300">Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="mt-2 bg-stone-800 border-stone-700 text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-stone-300">Time</Label>
                                        <Input
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="mt-2 bg-stone-800 border-stone-700 text-white"
                                            placeholder="7:00 PM"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-stone-300">Location</Label>
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="mt-2 bg-stone-800 border-stone-700 text-white"
                                            placeholder="Main Arena"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-stone-300">Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-2 bg-stone-800 border-stone-700 text-white"
                                        placeholder="Event description..."
                                        rows={4}
                                    />
                                </div>

                                <div>
                                    <Label className="text-stone-300">Image URL (optional)</Label>
                                    <Input
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        className="mt-2 bg-stone-800 border-stone-700 text-white"
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>

                                <div>
                                    <Label className="text-stone-300 mb-2 block">Ticket Pricing</Label>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-stone-400 text-sm">General Admission</Label>
                                            <Input
                                                type="number"
                                                value={formData.general_price}
                                                onChange={(e) => setFormData({ ...formData, general_price: Number(e.target.value) })}
                                                className="mt-2 bg-stone-800 border-stone-700 text-white"
                                                placeholder="30"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-stone-400 text-sm">Child Ticket</Label>
                                            <Input
                                                type="number"
                                                value={formData.child_price}
                                                onChange={(e) => setFormData({ ...formData, child_price: Number(e.target.value) })}
                                                className="mt-2 bg-stone-800 border-stone-700 text-white"
                                                placeholder="10"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-stone-400 text-sm">Family Package</Label>
                                            <Input
                                                type="number"
                                                value={formData.family_price}
                                                onChange={(e) => setFormData({ ...formData, family_price: Number(e.target.value) })}
                                                className="mt-2 bg-stone-800 border-stone-700 text-white"
                                                placeholder="70"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <p className="text-stone-300 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                                        Tiered pricing is automatic: Tier 1 starts at your base price, then increases by $5 per tier (1000 tickets each)
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={createEvent.isPending || updateEvent.isPending}
                                    className="w-full bg-green-500 hover:bg-green-600 text-stone-900"
                                >
                                    {(createEvent.isPending || updateEvent.isPending) ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {editingEvent ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        <>
                                            {editingEvent ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                            {editingEvent ? 'Update Event' : 'Create Event'}
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto" />
                        <p className="text-stone-400 mt-4">Loading events...</p>
                    </div>
                ) : events && events.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => {
                            const ticketsSold = event.tickets_sold || 0;
                            const currentTier = ticketsSold < 1000 ? 1 : ticketsSold < 2000 ? 2 : 3;
                            const ticketsRemaining = ticketsSold < 3000 ? (currentTier === 1 ? 1000 - ticketsSold : currentTier === 2 ? 2000 - ticketsSold : 3000 - ticketsSold) : 0;

                            return (
                                <Card key={event.id} className="bg-stone-900 border-stone-800">
                                    <div className="relative h-48">
                                        <img
                                            src={event.image_url || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800'}
                                            alt={event.name}
                                            className="w-full h-full object-cover rounded-t-xl"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent" />
                                    </div>
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                                        <div className="space-y-2 text-sm text-stone-400 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-green-500" />
                                                {format(new Date(event.date), 'MMMM d, yyyy')} at {event.time}
                                            </div>
                                            <p className="text-stone-500">{event.location}</p>
                                            <p className="text-green-400 font-semibold">
                                                Starting at ${event.general_price || 30}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 mb-4">
                                            <Badge className="bg-green-500/20 text-green-400">
                                                Tier {currentTier}
                                            </Badge>
                                            <Badge variant="outline" className="border-stone-700 text-stone-400">
                                                {ticketsRemaining} tickets left
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-stone-500 text-xs">
                                                {ticketsSold} tickets sold
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(event)}
                                                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                                            >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="bg-stone-900 border-stone-800 p-12 text-center">
                        <Calendar className="w-16 h-16 text-stone-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
                        <p className="text-stone-400 mb-6">Create your first rodeo event to get started</p>
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-green-500 hover:bg-green-600 text-stone-900"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Event
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}