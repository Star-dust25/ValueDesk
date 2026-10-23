import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import BoardPage from './pages/BoardPage'
import Catalog from './pages/Catalog'
import MetricsPage from './pages/MetricsPage'
import AssetsPage from './pages/AssetsPage'
import ChangesPage from './pages/ChangesPage'
import KnowledgePage from './pages/KnowledgePage'
import LoginPage from './pages/LoginPage'
import NotFound from './pages/NotFound'
import RouteError from './pages/RouteError'
import ProtectedRoute from './components/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          // Rutas publicas: Landing visual informativa y Login
          { index: true, element: <Home /> },
          { path: 'login', element: <LoginPage /> },

          // Rutas protegidas: Requieren sesion activa
          {
            path: 'tablero',
            element: (
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'catalogo',
            element: (
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            ),
          },
          {
            path: 'conocimiento',
            element: (
              <ProtectedRoute>
                <KnowledgePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'metricas',
            element: (
              <ProtectedRoute allowedRoles={['agente', 'gerente']}>
                <MetricsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'activos',
            element: (
              <ProtectedRoute allowedRoles={['agente', 'gerente']}>
                <AssetsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'cambios',
            element: (
              <ProtectedRoute allowedRoles={['agente', 'gerente']}>
                <ChangesPage />
              </ProtectedRoute>
            ),
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
