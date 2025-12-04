import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Members from './pages/Members';
import Events from './pages/Events';
import TasksHP from './pages/TasksHP';
import TasksRC from './pages/TasksRC';
import Hours from './pages/Hours';
import Announcements from './pages/Announcements';
import Admin from './pages/Admin';
import HERCTimeline from './pages/HERCTimeline';
import SkillMatrix from './pages/SkillMatrix';
import Eligibility from './pages/Eligibility';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Profile": Profile,
    "Members": Members,
    "Events": Events,
    "TasksHP": TasksHP,
    "TasksRC": TasksRC,
    "Hours": Hours,
    "Announcements": Announcements,
    "Admin": Admin,
    "HERCTimeline": HERCTimeline,
    "SkillMatrix": SkillMatrix,
    "Eligibility": Eligibility,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};