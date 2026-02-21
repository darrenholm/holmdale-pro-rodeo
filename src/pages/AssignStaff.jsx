import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AssignStaff() {
  const [selectedDate, setSelectedDate] = useState('');
  const [assignments, setAssignments] = useState({});
  const queryClient = useQueryClient();

  // Fetch shifts from Railway
  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ['railway-shifts'],
    queryFn: async () => {
      const result = await base44.functions.invoke('getShiftsFromRailway', {});
      return result.data?.data || [];
    }
  });

  // Fetch staff from Railway
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['railway-staff'],
    queryFn: async () => {
      const result = await base44.functions.invoke('getStaffFromRailway', {});
      return result.data?.data || [];
    }
  });

  const assignStaffMutation = useMutation({
    mutationFn: async ({ shiftId, staffIds }) => {
      const result = await base44.functions.invoke('assignStaffToShift', {
        shift_id: shiftId,
        staff_ids: staffIds
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['railway-shifts']);
      setAssignments({});
    }
  });

  const createShiftsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('createEventShifts', {});
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['railway-shifts']);
    }
  });

  const shifts = shiftsData || [];
  const staff = staffData || [];

  // Filter shifts by date if selected
  const filteredShifts = selectedDate
    ? shifts.filter(s => s.date === selectedDate)
    : shifts;

  // Group shifts by date
  const groupedShifts = filteredShifts.reduce((acc, shift) => {
    const date = shift.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedShifts).sort();

  const handleAddStaff = (shiftId, staffId) => {
    const currentStaff = assignments[shiftId] || [];
    if (!currentStaff.includes(staffId) && currentStaff.length < 6) {
      setAssignments({ ...assignments, [shiftId]: [...currentStaff, staffId] });
    }
  };

  const handleRemoveStaff = (shiftId, staffId) => {
    const currentStaff = assignments[shiftId] || [];
    setAssignments({ ...assignments, [shiftId]: currentStaff.filter(id => id !== staffId) });
  };

  const handleSaveAssignments = async () => {
    const promises = Object.entries(assignments).map(([shiftId, staffIds]) => 
      assignStaffMutation.mutateAsync({ shiftId, staffIds })
    );
    await Promise.all(promises);
  };

  const roleColors = {
    gate: 'bg-blue-500',
    bar: 'bg-purple-500',
    ticket_booth: 'bg-green-500',
    security: 'bg-red-500',
    general: 'bg-gray-500'
  };

  if (shiftsLoading || staffLoading) {
    return (
      <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Assign Staff to Shifts</h1>
            <p className="text-gray-400">Schedule available staff to open shifts</p>
          </div>
          <div className="flex gap-3">
            {shifts.length === 0 && (
              <Button
                onClick={() => createShiftsMutation.mutate()}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createShiftsMutation.isPending}
              >
                {createShiftsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event Shifts
                  </>
                )}
              </Button>
            )}
            {Object.keys(assignments).length > 0 && (
              <Button
                onClick={handleSaveAssignments}
                className="bg-green-600 hover:bg-green-700"
                disabled={assignStaffMutation.isPending}
              >
                {assignStaffMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save {Object.keys(assignments).length} Assignment{Object.keys(assignments).length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-white rounded-md px-4 py-2"
          />
        </div>

        {sortedDates.length === 0 ? (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No shifts available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <Card key={date} className="bg-stone-900 border-stone-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupedShifts[date].map((shift) => {
                      const currentAssignments = assignments[shift.id] || (shift.staff_ids || []);
                      const assignedStaffList = currentAssignments.map(id => staff.find(s => s.id === id)).filter(Boolean);
                      const availableSlots = 6 - currentAssignments.length;

                      return (
                        <div
                          key={shift.id}
                          className="bg-stone-800 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={`${roleColors[shift.role]} text-white`}>
                                  {shift.role?.replace('_', ' ') || 'General'}
                                </Badge>
                                <span className="flex items-center gap-1 text-gray-400 text-sm">
                                  <Clock className="w-4 h-4" />
                                  {shift.start_time} - {shift.end_time}
                                </span>
                                <Badge variant="outline" className="text-gray-400 border-gray-600">
                                  {currentAssignments.length}/6 Staff
                                </Badge>
                              </div>
                              {shift.notes && (
                                <p className="text-gray-500 text-sm mb-3">{shift.notes}</p>
                              )}
                              
                              {assignedStaffList.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {assignedStaffList.map((member) => (
                                    <Badge 
                                      key={member.id} 
                                      className="bg-green-600 text-white flex items-center gap-1"
                                    >
                                      <Users className="w-3 h-3" />
                                      {member.name}
                                      <button
                                        onClick={() => handleRemoveStaff(shift.id, member.id)}
                                        className="ml-1 hover:text-red-300"
                                      >
                                        <XCircle className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {currentAssignments.length < 6 && (
                                <Select
                                  value=""
                                  onValueChange={(value) => handleAddStaff(shift.id, value)}
                                >
                                  <SelectTrigger className="bg-stone-700 border-stone-600 text-white w-48">
                                    <SelectValue placeholder="Add staff..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {staff
                                      .filter(member => !currentAssignments.includes(member.id))
                                      .map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                          {member.name} {member.role && `(${member.role})`}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {currentAssignments.length >= 6 && (
                                <span className="text-green-400 text-sm flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Fully Staffed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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