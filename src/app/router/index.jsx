import { createBrowserRouter } from 'react-router-dom'
import MobileLayout from '../../layouts/MobileLayout'
import Home from '../../pages/Home'
import Card from '../../pages/Card'
import Exchange from '../../pages/Exchange'
import Profile from '../../pages/Profile'

export const router = createBrowserRouter([
  {
    element: <MobileLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/card', element: <Card /> },
      { path: '/exchange', element: <Exchange /> },
      { path: '/profile', element: <Profile /> },
    ],
  },
])
