import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';

export default function StaffList() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list('-created_date', 500)
  });

  const filteredStaff = staff.filter(person => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(person).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  });

  const columns = staff.length > 0 ? Object.keys(staff[0]).filter(key => 
    !['id', 'created_date', 'updated_date', 'created_by'].includes(key)
  ) : [];

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-green-500" />
            Staff Directory
          </h1>
          <p className="text-gray-400">View all imported staff members</p>
        </div>

        <Card className="bg-stone-900 border-stone-800 mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-stone-800 border-stone-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">Loading staff data...</p>
            </CardContent>
          </Card>
        ) : staff.length === 0 ? (
          <Card className="bg-stone-900 border-stone-800">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No staff records found</p>
              <p className="text-gray-500 text-sm">Import staff data to see them here</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-white">
                {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-800">
                      {columns.map(col => (
                        <th key={col} className="text-left p-3 text-gray-400 font-medium text-sm">
                          {col.replace(/_/g, ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((person, idx) => (
                      <tr key={person.id || idx} className="border-b border-stone-800 hover:bg-stone-800/50">
                        {columns.map(col => (
                          <td key={col} className="p-3 text-gray-300 text-sm">
                            {person[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}