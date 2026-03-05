Skip to content
darrenholm
holmdale-pro-rodeo
Repository navigation
Code
Issues
Pull requests
Actions
Projects
Security
Insights
Settings
Files
Go to file
t
functions
public
src
api
components
hooks
lib
pages
About.jsx
AssignStaff.jsx
BarSales.jsx
Bartender.jsx
BuyTickets.jsx
BuyTickets.jsxvvvvvvvvvvvvvvvvvvv
CheckoutCancel.jsx
CheckoutSuccess.jsx
Contact.jsx
Events.jsx
FoodAdmin.jsx
FoodKiosk.jsx
GateScan.jsx
Home.jsx
IDCheck.jsx
ImportStaff.jsx
ManageEvents.jsx
RFIDRegistry.jsx
RFIDTest.jsx
RefundTickets.jsx
ResendTicket.jsx
Shop.jsx
StaffList.jsx
StaffScheduling.jsx
TestRailway.jsx
TicketSalesReport.jsx
TrackOrder.jsx
UpdatePrices.jsx
utils
App.jsx
Layout.jsx
index.css
main.jsx
pages.config.js
.gitignore
BuyTickets.jsx
README.md
components.json
eslint.config.js
files.zip
find-h.ps1
find-h2.ps1
htaccess
index.html
jsconfig.json
package-lock.json
package.json
postcss.config.js
tailwind.config.js
vite.config.js
holmdale-pro-rodeo/src/pages
/
BuyTickets.jsx
in
main

Edit

Preview
Indent mode

Spaces
Indent size

4
Line wrap mode

No wrap
Editing BuyTickets.jsx file contents
  1
  2
  3
  4
  5
  6
  7
  8
  9
 10
 11
 12
 13
 14
 15
 16
 17
 18
 19
 20
 21
 22
 23
 24
 25
 26
 27
 28
 29
 30
 31
 32
 33
 34
 35
 36
 37
 38
 39
 40
 41
 42
 43
 44
 45
 46
 47
 48
 49
 50
 51
 52
 53
 54
 55
 56
 57
 58
 59
 60
 61
 62
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { functions } from '@/api/railwayClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Ticket, Users, CheckCircle, ArrowLeft, Minus, Plus, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ticketTypes = [
    {
        id: 'general',
        name: 'General Admission',
        description: 'Standard arena seating with great views of all the action',
        priceKey: 'general_price',
        availableKey: 'general_available',
        color: 'border-green-500/50 bg-green-500/10'
    },
    {
        id: 'child',
        name: 'Child Ticket (5-12 years)',
        description: 'Discounted ticket for children ages 5 to 12 years',
        priceKey: 'child_price',
        availableKey: 'child_available',
        color: 'border-green-500/50 bg-green-500/10'
    },
    {
        id: 'family',
        name: 'Family Ticket (2 Adults + 2 Children)',
        description: 'Perfect for families - includes 2 adult and 2 child tickets',
        priceKey: 'family_price',
        availableKey: 'family_available',
        color: 'border-green-500/50 bg-green-500/10'
    }
];

export default function BuyTickets() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const queryClient = useQueryClient();
    
    const [quantities, setQuantities] = useState({
        general: 0,
        child: 0,
        family: 0
    });
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        postal_code: ''
    });
    const [orderComplete, setOrderComplete] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [isInIframe, setIsInIframe] = useState(window.self !== window.top);
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutTicket, setCheckoutTicket] = useState(null);
Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
