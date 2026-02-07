import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Radio, Ticket, User, Calendar } from 'lucide-react';

export default function RFIDRegistry() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets-with-rfid'],
    queryFn: async () => {
      const allTickets = await base44.entities.TicketOrder.list();
      return allTickets.filter(ticket => ticket.rfid_tag_id);
    },
    initialData: [],
  });

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">RFID Registry</h1>
          <p className="text-gray-400">View all linked RFID bracelets and tickets</p>
        </div>

        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-500" />
              Linked RFID Bracelets ({tickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No RFID bracelets linked yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-stone-800 hover:bg-stone-800/50">
                      <TableHead className="text-gray-400">RFID Bracelet #</TableHead>
                      <TableHead className="text-gray-400">Confirmation Code</TableHead>
                      <TableHead className="text-gray-400">Customer Name</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Ticket Type</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="border-stone-800 hover:bg-stone-800/50">
                        <TableCell className="font-mono text-green-400 font-semibold">
                          {ticket.rfid_tag_id}
                        </TableCell>
                        <TableCell className="font-mono text-white">
                          {ticket.confirmation_code}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {ticket.customer_name}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {ticket.customer_email}
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-300 capitalize">
                            {ticket.ticket_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.scanned 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-blue-900/30 text-blue-400'
                          }`}>
                            {ticket.scanned ? 'Scanned' : 'Not Scanned'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}