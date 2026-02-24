import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Ticket, CreditCard, LogOut, Radio, DollarSign, Mail, BadgeCheck, Wine, RefreshCw, Calendar, UtensilsCrossed, ClipboardList } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { LOGO_URL } from '@/lib/constants';

const STAFF_PASSWORD = 'staff2026'; // Change this to your desired password

export default function Staff() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem('staff_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === STAFF_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('staff_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('staff_auth');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <Card className="bg-stone-900 border-stone-800 w-full max-w-md">
          <CardHeader className="items-center">
            <img src={LOGO_URL} alt="Holmdale Pro Rodeo" className="h-20 w-auto mb-2" />
            <CardTitle className="text-white text-2xl text-center">Staff Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="bg-stone-800 border-stone-700 text-white text-lg p-6"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
              >
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Holmdale Pro Rodeo" className="h-12 w-auto hidden sm:block" />
            <h1 className="text-3xl font-bold text-white">Staff Dashboard</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-stone-700 text-white hover:bg-stone-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link to={createPageUrl('GateScan')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <QrCode className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Gate Scanner</h2>
                <p className="text-gray-400">Scan QR codes & link RFID wristbands</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('StaffScheduling')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <Ticket className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Scheduling</h2>
                <p className="text-gray-400">Manage staff shifts</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('ManageEvents')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Manage Events</h2>
                <p className="text-gray-400">Create and manage rodeo events</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Events')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <Ticket className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Purchase Tickets</h2>
                <p className="text-gray-400">Buy event tickets for customers</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('BarSales')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <DollarSign className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Bar Sales</h2>
                <p className="text-gray-400">Sell drink tokens via RFID</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('ResendTicket')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <Mail className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Resend Ticket</h2>
                <p className="text-gray-400">Resend QR codes via email</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('IDCheck')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <BadgeCheck className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">ID Check</h2>
                <p className="text-gray-400">Verify 19+ for wristbands</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Bartender')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <Wine className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Bartender</h2>
                <p className="text-gray-400">Redeem bar drink tokens</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('RefundTickets')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Refund Tickets</h2>
                <p className="text-gray-400">Process ticket refunds</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('FoodKiosk')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <UtensilsCrossed className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Food Kiosk</h2>
                <p className="text-gray-400">Customer food ordering screen</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('FoodAdmin')}>
            <Card className="bg-stone-900 border-stone-800 hover:border-green-600 transition-all cursor-pointer h-full">
              <CardContent className="p-8 text-center">
                <ClipboardList className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Menu Manager</h2>
                <p className="text-gray-400">Edit food booth menu & prices</p>
              </CardContent>
            </Card>
          </Link>
          </div>

        <Card className="bg-stone-900 border-stone-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white text-sm">Quick Access Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href={createPageUrl('GateScan')} className="block text-green-500 hover:text-green-400">
              Gate Scanner
            </a>
            <a href={createPageUrl('Events')} className="block text-green-500 hover:text-green-400">
              Purchase Tickets
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}