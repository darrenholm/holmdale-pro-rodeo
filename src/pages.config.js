/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import BarSales from './pages/BarSales';
import Bartender from './pages/Bartender';
import BuyTickets from './pages/BuyTickets';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Contact from './pages/Contact';
import Events from './pages/Events';
import GateScan from './pages/GateScan';
import Home from './pages/Home';
import IDCheck from './pages/IDCheck';
import ImportStaff from './pages/ImportStaff';
import RFIDRegistry from './pages/RFIDRegistry';
import RFIDTest from './pages/RFIDTest';
import RefundTickets from './pages/RefundTickets';
import ResendTicket from './pages/ResendTicket';
import Shop from './pages/Shop';
import Staff from './pages/Staff';
import StaffList from './pages/StaffList';
import StaffScheduling from './pages/StaffScheduling';
import TestRailway from './pages/TestRailway';
import TrackOrder from './pages/TrackOrder';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "BarSales": BarSales,
    "Bartender": Bartender,
    "BuyTickets": BuyTickets,
    "CheckoutCancel": CheckoutCancel,
    "CheckoutSuccess": CheckoutSuccess,
    "Contact": Contact,
    "Events": Events,
    "GateScan": GateScan,
    "Home": Home,
    "IDCheck": IDCheck,
    "ImportStaff": ImportStaff,
    "RFIDRegistry": RFIDRegistry,
    "RFIDTest": RFIDTest,
    "RefundTickets": RefundTickets,
    "ResendTicket": ResendTicket,
    "Shop": Shop,
    "Staff": Staff,
    "StaffList": StaffList,
    "StaffScheduling": StaffScheduling,
    "TestRailway": TestRailway,
    "TrackOrder": TrackOrder,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};