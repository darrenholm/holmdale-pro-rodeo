import Home from './pages/Home';
import Events from './pages/Events';
import BuyTickets from './pages/BuyTickets';
import About from './pages/About';
import Contact from './pages/Contact';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Events": Events,
    "BuyTickets": BuyTickets,
    "About": About,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};