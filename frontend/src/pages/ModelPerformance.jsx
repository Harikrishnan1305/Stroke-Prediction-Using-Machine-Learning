import React, { useState, useEffect } from 'react';
import { modelAPI } from '../api';
import { Activity, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const ModelPerformance = () => {
  const [performance, setPerformance] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [perfRes, compRes] = await Promise.all([
        modelAPI.getPerformance(),
        modelAPI.compare()
      ]);
      setPerformance(perfRes.data);
      setComparison(compRes.data);
    } catch (error) {
      console.error('Error fetching model performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-600 mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">Loading model performance data...</p>
        </div>
      </div>
    );
  }

  const metrics = performance?.ml_metrics;
  const featureImportance = performance?.feature_importance;

  // Prepare feature importance data for chart
  const featureData = featureImportance ? 
    Object.entries(featureImportance)
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        importance: (value * 100).toFixed(2)
      }))
      .sort((a, b) => b.importance - a.importance)
    : [];

  // Prepare confusion matrix data
  const confusionMatrix = metrics?.confusion_matrix || [];
  const labels = ['Low', 'Medium', 'High'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Model Performance Analytics</h1>
          <p className="text-gray-600">Comprehensive analysis of ML and DL model performance</p>
        </div>

        {/* Performance Metrics Cards */}
        {metrics && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Test Accuracy</p>
                  <p className="text-4xl font-bold">{(metrics.test_accuracy * 100).toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-16 w-16 text-blue-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Precision</p>
                  <p className="text-4xl font-bold">{(metrics.precision * 100).toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-16 w-16 text-green-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Recall</p>
                  <p className="text-4xl font-bold">{(metrics.recall * 100).toFixed(1)}%</p>
                </div>
                <Activity className="h-16 w-16 text-purple-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">F1-Score</p>
                  <p className="text-4xl font-bold">{(metrics.f1_score * 100).toFixed(1)}%</p>
                </div>
                <PieChart className="h-16 w-16 text-orange-200" />
              </div>
            </div>
          </div>
        )}

        {/* Cross-Validation Results */}
        {metrics && (
          <div className="card mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Cross-Validation Results</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mean CV Accuracy</p>
                  <p className="text-2xl font-bold text-blue-600">{(metrics.cv_mean * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Standard Deviation</p>
                  <p className="text-2xl font-bold text-blue-600">±{(metrics.cv_std * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Importance Chart */}
        {featureData.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Feature Importance Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="importance" fill="#3b82f6" name="Importance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Confusion Matrix */}
        {confusionMatrix.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Confusion Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border bg-gray-100"></th>
                    {labels.map(label => (
                      <th key={label} className="px-4 py-2 border bg-blue-100 font-bold">
                        Predicted {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confusionMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 border bg-blue-100 font-bold">
                        Actual {labels[i]}
                      </td>
                      {row.map((value, j) => (
                        <td
                          key={j}
                          className={`px-4 py-2 border text-center font-semibold ${
                            i === j ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Best Hyperparameters */}
        {performance?.best_params && (
          <div className="card mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Optimized Hyperparameters</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(performance.best_params).map(([param, value]) => (
                <div key={param} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{param.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-bold text-gray-800">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ML vs DL Comparison */}
        {comparison.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-gray-800">ML vs DL Prediction Comparison</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ML Prediction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      DL Prediction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Final Risk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparison.slice(0, 20).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.patient_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {(item.ml_prediction * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {(item.dl_prediction * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.final_risk === 'High' ? 'bg-red-100 text-red-800' :
                          item.final_risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.final_risk}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelPerformance;
