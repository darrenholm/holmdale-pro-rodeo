import BuyTickets from './pages/BuyTickets';
import Contact from './pages/Contact';
import Events from './pages/Events';
import Home from './pages/Home';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BuyTickets": BuyTickets,
    "Contact": Contact,
    "Events": Events,
    "Home": Home,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};