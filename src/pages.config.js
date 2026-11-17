/**
 * pages.config.js — page routing.
 * Each page in ./pages is listed in PAGES; mainPage is the landing page.
 */
import About from './pages/About';
import AssignStaff from './pages/AssignStaff';
import BarSales from './pages/BarSales';
import BuyADrink from './pages/BuyADrink';
import Bartender from './pages/Bartender';
import BuyTickets from './pages/BuyTickets';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Contact from './pages/Contact';
import Events from './pages/Events';
import FoodAdmin from './pages/FoodAdmin';
import FoodKiosk from './pages/FoodKiosk';
import GateScan from './pages/GateScan';
import Home from './pages/Home';
import IDCheck from './pages/IDCheck';
import ImportStaff from './pages/ImportStaff';
import Privacy from './pages/Privacy';
import RFIDRegistry from './pages/RFIDRegistry';
import RFIDTest from './pages/RFIDTest';
import RefundTickets from './pages/RefundTickets';
import ResendTicket from './pages/ResendTicket';
import Schedule from './pages/Schedule';
import Shop from './pages/Shop';
import StaffList from './pages/StaffList';
import StaffScheduling from './pages/StaffScheduling';
import TestRailway from './pages/TestRailway';
import TicketSalesReport from './pages/TicketSalesReport';
import Tickets2027 from './pages/Tickets2027';
import TrackOrder from './pages/TrackOrder';
import UpdatePrices from './pages/UpdatePrices';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AssignStaff": AssignStaff,
    "BarSales": BarSales,
    "BuyADrink": BuyADrink,
    "Bartender": Bartender,
    "BuyTickets": BuyTickets,
    "CheckoutCancel": CheckoutCancel,
    "CheckoutSuccess": CheckoutSuccess,
    "Contact": Contact,
    "Events": Events,
    "FoodAdmin": FoodAdmin,
    "FoodKiosk": FoodKiosk,
    "GateScan": GateScan,
    "Home": Home,
    "IDCheck": IDCheck,
    "ImportStaff": ImportStaff,
    "Privacy": Privacy,
    "RFIDRegistry": RFIDRegistry,
    "RFIDTest": RFIDTest,
    "RefundTickets": RefundTickets,
    "ResendTicket": ResendTicket,
    "Schedule": Schedule,
    "Shop": Shop,
    "StaffList": StaffList,
    "StaffScheduling": StaffScheduling,
    "TestRailway": TestRailway,
    "TicketSalesReport": TicketSalesReport,
    "Tickets2027": Tickets2027,
    "TrackOrder": TrackOrder,
    "UpdatePrices": UpdatePrices,
}

export const pagesConfig = {
    mainPage: "Home", // v2
    Pages: PAGES,
    Layout: __Layout,
};
