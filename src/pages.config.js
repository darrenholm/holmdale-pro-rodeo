import About from './pages/About';
import BuyTickets from './pages/BuyTickets';
import Contact from './pages/Contact';
import Events from './pages/Events';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "BuyTickets": BuyTickets,
    "Contact": Contact,
    "Events": Events,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};