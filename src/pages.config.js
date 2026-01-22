import About from './pages/About';
import BuyTickets from './pages/BuyTickets';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Contact from './pages/Contact';
import Events from './pages/Events';
import Home from './pages/Home';
import Shop from './pages/Shop';
import TrackOrder from './pages/TrackOrder';
import GateScan from './pages/GateScan';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "BuyTickets": BuyTickets,
    "CheckoutCancel": CheckoutCancel,
    "CheckoutSuccess": CheckoutSuccess,
    "Contact": Contact,
    "Events": Events,
    "Home": Home,
    "Shop": Shop,
    "TrackOrder": TrackOrder,
    "GateScan": GateScan,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};