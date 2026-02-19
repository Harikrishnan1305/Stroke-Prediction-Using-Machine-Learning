import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientAPI, predictionAPI } from '../api';
import { User, Calendar, Mail, Phone, Activity, ArrowLeft, TrendingUp, Download } from 'lucide-react';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      const response = await patientAPI.getById(patientId);
      setPatient(response.data);
      setPredictions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const downloadReport = async (predictionId) => {
    try {
      const response = await predictionAPI.downloadReport(predictionId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stroke_report_${patient?.name}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-600 mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Patient not found</p>
          <button onClick={() => navigate('/patients')} className="btn-primary">
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center text-gray-600 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Patients
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Patient Details</h1>
        </div>

        {/* Patient Information Card */}
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-4 mr-4">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{patient.name}</h2>
                <p className="text-gray-600">Patient ID: #{patient.id}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/patient/${patient.id}/trends`)}
              className="btn-primary flex items-center"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              View Trends
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Age</p>
              <p className="text-xl font-bold text-gray-800">{patient.age} years</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Gender</p>
              <p className="text-xl font-bold text-gray-800">{patient.gender}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Predictions</p>
              <p className="text-xl font-bold text-blue-600">{predictions.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Registered</p>
              <p className="text-xl font-bold text-gray-800">
                {new Date(patient.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {(patient.email || patient.phone) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {patient.email && (
                  <div className="flex items-center text-gray-700">
                    <Mail className="h-5 w-5 mr-2 text-gray-500" />
                    {patient.email}
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-5 w-5 mr-2 text-gray-500" />
                    {patient.phone}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Prediction History */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Prediction History</h3>
          
          {predictions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No predictions yet</p>
              <button
                onClick={() => navigate('/predict')}
                className="btn-primary mt-4"
              >
                Create First Prediction
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <div key={prediction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(prediction.stroke_risk)}`}>
                          {prediction.stroke_risk} Risk
                        </span>
                        {prediction.stroke_stage && (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            {prediction.stroke_stage}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(prediction.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => downloadReport(prediction.id)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-5 w-5 mr-1" />
                      Report
                    </button>
                  </div>

                  <div className="grid md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Heart Rate</p>
                      <p className="font-bold text-gray-800">{prediction.heart_rate} bpm</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Blood Pressure</p>
                      <p className="font-bold text-gray-800">{prediction.blood_pressure}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Blood Sugar</p>
                      <p className="font-bold text-gray-800">{prediction.blood_sugar} mg/dL</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">BMI</p>
                      <p className="font-bold text-gray-800">{prediction.bmi}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-700">
                    <span className="font-semibold">Confidence:</span> {(prediction.risk_probability * 100).toFixed(1)}%
                  </div>

                  {prediction.recommendations && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Recommendations:</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {prediction.recommendations.split('\n').slice(0, 3).map((rec, idx) => (
                          <p key={idx}>• {rec}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
