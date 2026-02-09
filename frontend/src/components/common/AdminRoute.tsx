import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { selectIsAdmin } from '../../store/slices/authSlice';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = selectIsAdmin(user);

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;