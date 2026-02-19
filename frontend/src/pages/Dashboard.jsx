import React, { useState, useEffect } from 'react';
import { statisticsAPI, patientAPI } from '../api';
import { Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, patientsRes] = await Promise.all([
        statisticsAPI.getStats(),
        patientAPI.getAll()
      ]);
      console.log('Stats data:', statsRes.data); // Debug log
      console.log('Patients data:', patientsRes.data); // Debug log
      setStats(statsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data); // More detailed error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-600 mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const riskData = [
    { name: 'Low Risk', value: stats?.risk_distribution?.low || 0, color: '#10b981' },
    { name: 'Medium Risk', value: stats?.risk_distribution?.medium || 0, color: '#f59e0b' },
    { name: 'High Risk', value: stats?.risk_distribution?.high || 0, color: '#ef4444' }
  ];

  const barData = [
    { name: 'Low', count: stats?.risk_distribution?.low || 0 },
    { name: 'Medium', count: stats?.risk_distribution?.medium || 0 },
    { name: 'High', count: stats?.risk_distribution?.high || 0 }
  ];

  // Age distribution data
  const ageData = stats?.age_distribution ? 
    Object.entries(stats.age_distribution).map(([range, count]) => ({
      name: range,
      count: count
    })) : [];

  // Gender risk data
  const genderRiskData = stats?.gender_risk ? 
    Object.entries(stats.gender_risk).map(([gender, data]) => ({
      gender: gender,
      total: data.total,
      high_risk: data.high_risk
    })) : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of stroke predictions and patient data</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Patients</p>
                <p className="text-4xl font-bold">{stats?.total_patients || 0}</p>
              </div>
              <Users className="h-16 w-16 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Predictions</p>
                <p className="text-4xl font-bold">{stats?.total_predictions || 0}</p>
              </div>
              <Activity className="h-16 w-16 text-purple-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm mb-1">High Risk Cases</p>
                <p className="text-4xl font-bold">{stats?.risk_distribution?.high || 0}</p>
              </div>
              <AlertCircle className="h-16 w-16 text-red-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Low Risk Cases</p>
                <p className="text-4xl font-bold">{stats?.risk_distribution?.low || 0}</p>
              </div>
              <TrendingUp className="h-16 w-16 text-green-200" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Risk Level Statistics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Analytics */}
        {ageData.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Age Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {genderRiskData.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-bold mb-4 text-gray-800">High Risk by Gender</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genderRiskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gender" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#10b981" name="Total Patients" />
                    <Bar dataKey="high_risk" fill="#ef4444" name="High Risk" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Recent Predictions */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Predictions</h3>
          {!stats?.recent_predictions || stats.recent_predictions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No predictions yet</p>
              <p className="text-sm text-gray-500">Start making predictions to see data here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recent_predictions.map((pred, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{pred.patient_name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          pred.stroke_risk === 'High' ? 'bg-red-100 text-red-800' :
                          pred.stroke_risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pred.stroke_risk}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {pred.stroke_stage || 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {(pred.risk_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
