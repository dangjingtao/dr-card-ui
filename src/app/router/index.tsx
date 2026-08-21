import { createBrowserRouter } from 'react-router-dom'
import MobileLayout from '../../layouts/MobileLayout'
import Home from '../../pages/Home'
import CardPage from '../../pages/Card'
import Exchange from '../../pages/Exchange'
import Profile from '../../pages/Profile'
import DrawSuccess from '../../pages/DrawSuccess'

export const router = createBrowserRouter([
  {
    element: <MobileLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/card', element: <CardPage /> },
      { path: '/exchange', element: <Exchange /> },
      { path: '/profile', element: <Profile /> },
      { path: '/draw-success', element: <DrawSuccess /> },
    ],
  },
])
