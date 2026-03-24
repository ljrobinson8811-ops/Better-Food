import AdminAnalytics from './pages/AdminAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import AdminErrors from './pages/AdminErrors';
import AdminMenuIngestion from './pages/AdminMenuIngestion';
import AdminModeration from './pages/AdminModeration';
import AdminPremium from './pages/AdminPremium';
import AdminRecipeLogs from './pages/AdminRecipeLogs';
import Community from './pages/Community';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Profile from './pages/Profile';
import RecipeDetail from './pages/RecipeDetail';
import RestaurantDetail from './pages/RestaurantDetail';
import Layout from './Layout.jsx';

export const PAGES = Object.freeze({
  AdminAnalytics,
  AdminDashboard,
  AdminErrors,
  AdminMenuIngestion,
  AdminModeration,
  AdminPremium,
  AdminRecipeLogs,
  Community,
  Explore,
  Favorites,
  Home,
  Profile,
  RecipeDetail,
  RestaurantDetail
});

export const pagesConfig = Object.freeze({
  mainPage: 'Home',
  Pages: PAGES,
  Layout
});