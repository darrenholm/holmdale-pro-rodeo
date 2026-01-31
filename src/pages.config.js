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
import AdminBarCredits from './pages/AdminBarCredits';
import BarRedemption from './pages/BarRedemption';
import BuyBarCredits from './pages/BuyBarCredits';
import BuyTickets from './pages/BuyTickets';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Contact from './pages/Contact';
import Events from './pages/Events';
import GateScan from './pages/GateScan';
import Home from './pages/Home';
import ImportStaff from './pages/ImportStaff';
import Shop from './pages/Shop';
import Staff from './pages/Staff';
import StaffList from './pages/StaffList';
import StaffScheduling from './pages/StaffScheduling';
import TrackOrder from './pages/TrackOrder';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AdminBarCredits": AdminBarCredits,
    "BarRedemption": BarRedemption,
    "BuyBarCredits": BuyBarCredits,
    "BuyTickets": BuyTickets,
    "CheckoutCancel": CheckoutCancel,
    "CheckoutSuccess": CheckoutSuccess,
    "Contact": Contact,
    "Events": Events,
    "GateScan": GateScan,
    "Home": Home,
    "ImportStaff": ImportStaff,
    "Shop": Shop,
    "Staff": Staff,
    "StaffList": StaffList,
    "StaffScheduling": StaffScheduling,
    "TrackOrder": TrackOrder,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};