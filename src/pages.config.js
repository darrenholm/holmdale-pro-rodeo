import About from './pages/About';
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