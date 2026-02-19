import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Activity, User, LogOut, Home, FileText, Users, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              Stroke Prediction System
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>

            {user && (
              <>
                <Link
                  to="/predict"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Predict
                </Link>

                <Link
                  to="/patients"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Patients
                </Link>

                <Link
                  to="/history"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  History
                </Link>

                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/model-performance"
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      ML Analytics
                    </Link>
                  </>
                )}

                <div className="flex items-center space-x-3 border-l pl-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </button>
                </div>
              </>
            )}

            {!user && (
              <Link
                to="/login"
                className="btn-primary"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
