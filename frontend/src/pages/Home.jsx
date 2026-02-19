import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Brain, Shield, TrendingUp, Users, FileText } from 'lucide-react';
import { useAuth } from '../AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Brain Stroke Risk Prediction System
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Advanced AI-powered system using Machine Learning and Deep Learning 
              to predict stroke risk from medical parameters and brain scan images
            </p>
            {user ? (
              <Link to="/predict" className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
                Start Prediction
              </Link>
            ) : (
              <Link to="/login" className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Key Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <Brain className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Combines Machine Learning and Deep Learning models for accurate stroke risk prediction
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <Activity className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comprehensive Health Check</h3>
              <p className="text-gray-600">
                Analyzes multiple health parameters including BP, blood sugar, cholesterol, and BMI
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-16 w-16 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                All patient data is securely stored with authentication and encryption
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <FileText className="h-16 w-16 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Image Analysis</h3>
              <p className="text-gray-600">
                Upload MRI or CT scans for deep learning-based brain scan analysis
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <TrendingUp className="h-16 w-16 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Risk Assessment</h3>
              <p className="text-gray-600">
                Get detailed risk levels (Low/Medium/High) and stroke stage predictions
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-16 w-16 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Patient Management</h3>
              <p className="text-gray-600">
                Track patient history, view trends, and manage medical records efficiently
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold mb-2">Input Data</h3>
              <p className="text-gray-600 text-sm">
                Enter patient details and medical parameters
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-bold mb-2">Upload Scan</h3>
              <p className="text-gray-600 text-sm">
                Upload MRI or CT brain scan image (optional)
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-bold mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                ML and DL models analyze the data
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="font-bold mb-2">Get Results</h3>
              <p className="text-gray-600 text-sm">
                Receive risk assessment and recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="gradient-bg text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8">
            Join healthcare professionals using our AI-powered stroke prediction system
          </p>
          {user ? (
            <Link to="/predict" className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
              Make a Prediction
            </Link>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
                Login
              </Link>
              <Link to="/register" className="inline-block bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 transition border-2 border-white">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
