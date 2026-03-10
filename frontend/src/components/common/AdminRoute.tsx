import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { selectIsAdmin } from '../../store/slices/authSlice';
import ForbiddenPage from '../../pages/ForbiddenPage';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = selectIsAdmin(user);

  if (!isAdmin) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
};

export default AdminRoute;