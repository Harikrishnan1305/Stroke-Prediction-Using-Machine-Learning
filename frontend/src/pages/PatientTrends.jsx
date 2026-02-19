import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trendsAPI, patientAPI } from '../api';
import { ArrowLeft, TrendingUp, Activity, Heart, Droplet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PatientTrends = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('risk_probability');

  useEffect(() => {
    fetchTrends();
  }, [patientId]);

  const fetchTrends = async () => {
    try {
      const response = await trendsAPI.getPatientTrends(patientId);
      setPatient(response.data.patient);
      setTrends(response.data.trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-600 mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">Loading patient trends...</p>
        </div>
      </div>
    );
  }

  if (!patient || !trends) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available for this patient.</p>
          <button onClick={() => navigate('/patients')} className="btn-primary mt-4">
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = trends.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString(),
    'Heart Rate': trends.heart_rate[index],
    'BP Systolic': trends.bp_systolic[index],
    'BP Diastolic': trends.bp_diastolic[index],
    'Blood Sugar': trends.blood_sugar[index],
    'Cholesterol': trends.cholesterol[index],
    'BMI': trends.bmi[index],
    'Risk %': (trends.risk_probability[index] * 100).toFixed(1)
  }));

  const metrics = [
    { key: 'risk_probability', label: 'Risk Probability', color: '#ef4444', icon: TrendingUp },
    { key: 'heart_rate', label: 'Heart Rate', color: '#3b82f6', icon: Heart },
    { key: 'bp_systolic', label: 'Blood Pressure (Systolic)', color: '#8b5cf6', icon: Activity },
    { key: 'blood_sugar', label: 'Blood Sugar', color: '#f59e0b', icon: Droplet },
    { key: 'cholesterol', label: 'Cholesterol', color: '#10b981', icon: Activity },
    { key: 'bmi', label: 'BMI', color: '#ec4899', icon: Activity }
  ];

  const getMetricData = (metricKey) => {
    if (metricKey === 'risk_probability') {
      return chartData.map(d => ({ date: d.date, value: parseFloat(d['Risk %']) }));
    }
    const metricMap = {
      'heart_rate': 'Heart Rate',
      'bp_systolic': 'BP Systolic',
      'blood_sugar': 'Blood Sugar',
      'cholesterol': 'Cholesterol',
      'bmi': 'BMI'
    };
    return chartData.map(d => ({ date: d.date, value: d[metricMap[metricKey]] }));
  };

  const currentMetric = metrics.find(m => m.key === selectedMetric);
  const metricData = getMetricData(selectedMetric);

  // Calculate latest values
  const latestIndex = trends.dates.length - 1;
  const latestValues = {
    heart_rate: trends.heart_rate[latestIndex],
    bp: `${trends.bp_systolic[latestIndex]}/${trends.bp_diastolic[latestIndex]}`,
    blood_sugar: trends.blood_sugar[latestIndex],
    cholesterol: trends.cholesterol[latestIndex],
    bmi: trends.bmi[latestIndex],
    risk: (trends.risk_probability[latestIndex] * 100).toFixed(1)
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Patients
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Health Trends</h1>
          <p className="text-gray-600">
            {patient.name} • Age {patient.age} • {patient.gender}
          </p>
        </div>

        {/* Latest Values Summary */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <p className="text-red-100 text-xs mb-1">Risk Level</p>
            <p className="text-2xl font-bold">{latestValues.risk}%</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-xs mb-1">Heart Rate</p>
            <p className="text-2xl font-bold">{latestValues.heart_rate}</p>
            <p className="text-xs text-blue-100">bpm</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-purple-100 text-xs mb-1">Blood Pressure</p>
            <p className="text-2xl font-bold">{latestValues.bp}</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-orange-100 text-xs mb-1">Blood Sugar</p>
            <p className="text-2xl font-bold">{latestValues.blood_sugar}</p>
            <p className="text-xs text-orange-100">mg/dL</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-xs mb-1">Cholesterol</p>
            <p className="text-2xl font-bold">{latestValues.cholesterol}</p>
            <p className="text-xs text-green-100">mg/dL</p>
          </div>
          <div className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <p className="text-pink-100 text-xs mb-1">BMI</p>
            <p className="text-2xl font-bold">{latestValues.bmi}</p>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Select Metric to View Trend</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedMetric === metric.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-6 w-6 mr-3" style={{ color: metric.color }} />
                    <span className="font-medium text-gray-800">{metric.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trend Chart */}
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            {currentMetric?.label} Over Time
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={metricData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentMetric?.color || '#3b82f6'}
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
                name={currentMetric?.label}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* All Metrics Combined */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-gray-800">All Metrics Combined</h3>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Heart Rate" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="BP Systolic" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="Blood Sugar" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="Cholesterol" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Risk %" stroke="#ef4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PatientTrends;
