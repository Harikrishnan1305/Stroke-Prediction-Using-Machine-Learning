import React, { useState, useEffect } from 'react';
import { predictionAPI } from '../api';
import { Search, Calendar, TrendingUp, Activity } from 'lucide-react';

const PatientHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await predictionAPI.getAll();
      // Backend returns paginated data with predictions array
      setPredictions(response.data.predictions || response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPredictions = predictions.filter(pred => {
    const matchesSearch = pred.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'All' || pred.stroke_risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-600 mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">Loading patient history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient History</h1>
          <p className="text-gray-600">View and search past predictions</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Search Patient</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Filter by Risk Level</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="input-field"
              >
                <option value="All">All Levels</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50">
            <p className="text-sm text-gray-600 mb-1">Total Predictions</p>
            <p className="text-3xl font-bold text-blue-600">{predictions.length}</p>
          </div>
          <div className="card bg-green-50">
            <p className="text-sm text-gray-600 mb-1">Low Risk</p>
            <p className="text-3xl font-bold text-green-600">
              {predictions.filter(p => p.stroke_risk === 'Low').length}
            </p>
          </div>
          <div className="card bg-yellow-50">
            <p className="text-sm text-gray-600 mb-1">Medium Risk</p>
            <p className="text-3xl font-bold text-yellow-600">
              {predictions.filter(p => p.stroke_risk === 'Medium').length}
            </p>
          </div>
          <div className="card bg-red-50">
            <p className="text-sm text-gray-600 mb-1">High Risk</p>
            <p className="text-3xl font-bold text-red-600">
              {predictions.filter(p => p.stroke_risk === 'High').length}
            </p>
          </div>
        </div>

        {/* Predictions List */}
        <div className="space-y-4">
          {filteredPredictions.length === 0 ? (
            <div className="card text-center py-12">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No predictions found</p>
            </div>
          ) : (
            filteredPredictions.map((prediction) => (
              <div key={prediction.id} className="card hover:shadow-xl transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-gray-800 mr-3">
                        {prediction.patient_name || 'Unknown Patient'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(prediction.stroke_risk)}`}>
                        {prediction.stroke_risk} Risk
                      </span>
                      {prediction.stroke_stage && (
                        <span className="ml-2 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {prediction.stroke_stage}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Heart Rate</p>
                        <p className="font-bold">{prediction.heart_rate} bpm</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Blood Pressure</p>
                        <p className="font-bold">{prediction.blood_pressure}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600">Blood Sugar</p>
                        <p className="font-bold">{prediction.blood_sugar} mg/dL</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600">BMI</p>
                        <p className="font-bold">{prediction.bmi}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(prediction.created_at)}
                      <TrendingUp className="h-4 w-4 ml-4 mr-1" />
                      Confidence: {(prediction.risk_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistory;
