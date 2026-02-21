import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function StaffScheduling() {
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    staff_name: '',
    date: '',
    start_time: '',
    end_time: '',
    role: 'general',
    notes: '',
    event_id: ''
  });

  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading, error } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const result = await base44.functions.invoke('getShiftsFromRailway', {});
      console.log('=== SHIFTS DEBUG ===');
      console.log('Full API Response:', result);
      console.log('result.data:', result.data);
      const shiftsData = result.data?.data || [];
      console.log('Shifts received:', shiftsData);
      console.log('Number of shifts:', shiftsData.length);
      console.log('First shift:', shiftsData[0]);
      console.log('===================');
      return shiftsData;
    }
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const result = await base44.functions.invoke('getEventsFromRailway', {});
      return result.data?.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setFormData({
      staff_name: shift.staff_name,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      role: shift.role,
      notes: shift.notes || '',
      event_id: shift.event_id || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      staff_name: '',
      date: '',
      start_time: '',
      end_time: '',
      role: 'general',
      notes: '',
      event_id: ''
    });
    setEditingShift(null);
    setShowForm(false);
  };

  const roleColors = {
    gate: 'bg-blue-100 text-blue-800',
    bar: 'bg-purple-100 text-purple-800',
    ticket_booth: 'bg-green-100 text-green-800',
    security: 'bg-red-100 text-red-800',
    general: 'bg-gray-100 text-gray-800'
  };

  const groupedShifts = shifts.reduce((acc, shift) => {
    if (!shift.date) return acc;
    const date = shift.date.split('T')[0];
    if (!acc[date]) acc[date] = {};
    if (!acc[date][shift.role]) acc[date][shift.role] = [];
    acc[date][shift.role].push(shift);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedShifts).sort();

  const roleOrder = ['gate', 'bar', 'ticket_booth', 'security', 'general'];
  const sortedGroupedShifts = {};

  sortedDates.forEach(date => {
    sortedGroupedShifts[date] = {};
    const roles = Object.keys(groupedShifts[date]).sort((a, b) => {
      const indexA = roleOrder.indexOf(a);
      const indexB = roleOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    roles.forEach(role => {
      sortedGroupedShifts[date][role] = groupedShifts[date][role].sort((a, b) => 
        a.start_time.localeCompare(b.start_time)
      );
    });
  });

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Staff Scheduling</h1>
            <p className="text-gray-400">Manage staff shifts and schedules</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
          </Button>
        </div>

        {showForm && (
          <Card className="bg-stone-900 border-stone-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">
                {editingShift ? 'Edit Shift' : 'Add New Shift'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">Staff Name</label>
                    <Input
                      value={formData.staff_name}
                      onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                      className="bg-stone-800 border-stone-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">Role</label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gate">Gate</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="ticket_booth">Ticket Booth</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="bg-stone-800 border-stone-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">Start Time</label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="bg-stone-800 border-stone-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">End Time</label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="bg-stone-800 border-stone-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Event (Optional)</label>
                  <Select
                    value={formData.event_id}
                    onValueChange={(value) => setFormData({ ...formData, event_id: value })}
                  >
                    <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                      <SelectValue placeholder="Select event (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No Event</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {event.date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Notes</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-stone-800 border-stone-700 text-white"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingShift ? 'Update Shift' : 'Create Shift'}
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                    className="border-stone-700 text-white hover:bg-stone-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-white text-center py-8">Loading schedules...</div>
        ) : error ? (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-12 text-center">
              <p className="text-red-400">Error loading shifts: {error.message}</p>
            </CardContent>
          </Card>
        ) : sortedDates.length === 0 ? (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No shifts scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <Card key={date} className="bg-stone-900 border-stone-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    {date}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.keys(sortedGroupedShifts[date]).map((role) => (
                      <div key={role} className="space-y-2">
                        <h3 className="text-white font-semibold px-2 flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${roleColors[role]}`}>
                            {role.replace('_', ' ')}
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {sortedGroupedShifts[date][role].map((shift) => (
                            <div
                              key={shift.id}
                              className="bg-stone-800 rounded-lg p-4 flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-white font-semibold">{shift.staff_name}</h4>
                                </div>
                                <div className="flex items-center gap-4 text-gray-400 text-sm">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {shift.start_time} - {shift.end_time}
                                  </span>
                                  {shift.notes && (
                                    <span className="text-gray-500">• {shift.notes}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(shift)}
                                  className="border-stone-700 text-white hover:bg-stone-700"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteMutation.mutate(shift.id)}
                                  className="border-red-800 text-red-400 hover:bg-red-950"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}