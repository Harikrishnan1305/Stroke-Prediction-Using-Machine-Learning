import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionAPI, patientAPI } from '../api';
import { Upload, Activity, AlertCircle, CheckCircle, Download } from 'lucide-react';

const PredictionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    heart_rate: '',
    bp_systolic: '',
    bp_diastolic: '',
    blood_sugar: '',
    cholesterol: '',
    bmi: '',
    is_smoker: false,
    is_alcoholic: false,
  });
  
  const [scanImage, setScanImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScanImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.age || !formData.heart_rate || 
        !formData.bp_systolic || !formData.bp_diastolic || 
        !formData.blood_sugar || !formData.cholesterol || !formData.bmi) {
      return 'Please fill in all required fields';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      console.warn('Validation failed:', validationError, { ...formData });
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (scanImage) {
        data.append('scan_image', scanImage);
      }

      // Console log payload before sending
      console.log('Prediction payload (summary):', {
        ...formData,
        scan_image: scanImage
          ? { name: scanImage.name, size: scanImage.size, type: scanImage.type }
          : null,
      });
      // Enumerate FormData entries for full visibility
      for (const [k, v] of data.entries()) {
        console.log('FormData entry:', k, v instanceof File ? { name: v.name, size: v.size, type: v.type } : v);
      }

      const response = await predictionAPI.predict(data);
      setResult(response.data);
    } catch (err) {
      console.error('Prediction request failed:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result?.prediction?.id) return;
    
    setDownloadingReport(true);
    try {
      const response = await predictionAPI.downloadReport(result.prediction.id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stroke_report_${result.patient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="card">
            <div className="text-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Prediction Results
              </h2>
              <p className="text-gray-600">
                Patient: {result.patient.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className={`p-6 rounded-lg border-2 ${getRiskColor(result.prediction.stroke_risk)}`}>
                <h3 className="text-lg font-bold mb-2">Stroke Risk Level</h3>
                <p className="text-4xl font-bold">{result.prediction.stroke_risk}</p>
                <p className="text-sm mt-2">
                  Confidence: {(result.prediction.risk_probability * 100).toFixed(1)}%
                </p>
              </div>

              <div className="p-6 rounded-lg border-2 bg-blue-100 text-blue-800 border-blue-300">
                <h3 className="text-lg font-bold mb-2">Stroke Stage</h3>
                <p className="text-4xl font-bold">
                  {result.prediction.stroke_stage || 'None Detected'}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Medical Parameters</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Heart Rate</p>
                  <p className="font-bold">{result.prediction.heart_rate} bpm</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Blood Pressure</p>
                  <p className="font-bold">{result.prediction.blood_pressure}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Blood Sugar</p>
                  <p className="font-bold">{result.prediction.blood_sugar} mg/dL</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Cholesterol</p>
                  <p className="font-bold">{result.prediction.cholesterol} mg/dL</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">BMI</p>
                  <p className="font-bold">{result.prediction.bmi}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Recommendations</h3>
              <div className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start bg-blue-50 p-3 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {result.feature_importance && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Risk Factor Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">Key factors contributing to the risk assessment:</p>
                  <div className="space-y-2">
                    {Object.entries(result.feature_importance)
                      .slice(0, 5)
                      .map(([feature, importance]) => (
                        <div key={feature} className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 w-40 capitalize">
                            {feature.replace(/_/g, ' ')}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 ml-3">
                            <div
                              className="bg-blue-600 h-4 rounded-full"
                              style={{ width: `${importance}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 ml-3 w-16 text-right">
                            {importance.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                className="btn-secondary flex-1 flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-2" />
                {downloadingReport ? 'Generating...' : 'Download Report'}
              </button>
              <button
                onClick={() => setResult(null)}
                className="btn-primary flex-1"
              >
                New Prediction
              </button>
              <button
                onClick={() => navigate('/history')}
                className="btn-secondary flex-1"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card">
          <div className="text-center mb-8">
            <Activity className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800">
              Stroke Risk Prediction
            </h2>
            <p className="text-gray-600 mt-2">
              Enter patient details and medical parameters
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Patient Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    max="120"
                    required
                  />
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Parameters */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Medical Parameters</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Heart Rate (bpm) *</label>
                  <input
                    type="number"
                    name="heart_rate"
                    value={formData.heart_rate}
                    onChange={handleChange}
                    className="input-field"
                    min="40"
                    max="200"
                    required
                  />
                </div>
                <div>
                  <label className="label">Blood Pressure (Systolic) *</label>
                  <input
                    type="number"
                    name="bp_systolic"
                    value={formData.bp_systolic}
                    onChange={handleChange}
                    className="input-field"
                    min="80"
                    max="250"
                    required
                  />
                </div>
                <div>
                  <label className="label">Blood Pressure (Diastolic) *</label>
                  <input
                    type="number"
                    name="bp_diastolic"
                    value={formData.bp_diastolic}
                    onChange={handleChange}
                    className="input-field"
                    min="50"
                    max="150"
                    required
                  />
                </div>
                <div>
                  <label className="label">Blood Sugar (mg/dL) *</label>
                  <input
                    type="number"
                    name="blood_sugar"
                    value={formData.blood_sugar}
                    onChange={handleChange}
                    className="input-field"
                    min="50"
                    max="500"
                    required
                  />
                </div>
                <div>
                  <label className="label">Cholesterol (mg/dL) *</label>
                  <input
                    type="number"
                    name="cholesterol"
                    value={formData.cholesterol}
                    onChange={handleChange}
                    className="input-field"
                    min="100"
                    max="400"
                    required
                  />
                </div>
                <div>
                  <label className="label">BMI *</label>
                  <input
                    type="number"
                    step="0.1"
                    name="bmi"
                    value={formData.bmi}
                    onChange={handleChange}
                    className="input-field"
                    min="10"
                    max="60"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Lifestyle Factors */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Lifestyle Factors</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_smoker"
                    checked={formData.is_smoker}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-gray-700 font-medium">
                    Smoking Habit
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_alcoholic"
                    checked={formData.is_alcoholic}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-gray-700 font-medium">
                    Alcohol Consumption
                  </label>
                </div>
              </div>
            </div>

            {/* Brain Scan Upload */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Brain Scan Image (Optional)</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Upload MRI or CT Scan
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG up to 16MB
                </p>
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-600 mt-2">{scanImage.name}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Predict Stroke Risk'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;
