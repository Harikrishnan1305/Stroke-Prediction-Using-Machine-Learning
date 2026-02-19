import React, { useState, useEffect } from 'react';
import { patientAPI } from '../api';
import { Users, Search, Plus, TrendingUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      console.log('Patients response:', response.data); // Debug log
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'All' || patient.gender === genderFilter;
    
    let matchesAge = true;
    if (ageFilter === 'Young' && patient.age > 40) matchesAge = false;
    if (ageFilter === 'Middle' && (patient.age <= 40 || patient.age > 60)) matchesAge = false;
    if (ageFilter === 'Senior' && patient.age <= 60) matchesAge = false;
    
    return matchesSearch && matchesGender && matchesAge;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-blue-600 mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Patients</h1>
            <p className="text-gray-600">
              Manage patient records 
              {patients.length > 0 && (
                <span className="ml-2 text-blue-600 font-semibold">({patients.length} total)</span>
              )}
            </p>
          </div>
          <button
            onClick={() => navigate('/predict')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Patient
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="input-field"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="input-field"
            >
              <option value="All">All Ages</option>
              <option value="Young">Young (≤40)</option>
              <option value="Middle">Middle (41-60)</option>
              <option value="Senior">Senior (60+)</option>
            </select>
          </div>
        </div>

        {/* Patient Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {filteredPatients.length === 0 ? (
            <div className="col-span-3 card text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              {patients.length === 0 ? (
                <>
                  <p className="text-gray-600 mb-2">No patients in the system</p>
                  <p className="text-sm text-gray-500 mb-4">Add your first patient to get started</p>
                  <button
                    onClick={() => navigate('/predict')}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Patient
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">No patients match your search</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters</p>
                </>
              )}
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="card hover:shadow-xl transition">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 rounded-full p-3 mr-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{patient.name}</h3>
                    <p className="text-sm text-gray-600">
                      {patient.age} years • {patient.gender}
                    </p>
                  </div>
                </div>
                
                {patient.email && (
                  <p className="text-sm text-gray-600 mb-1">📧 {patient.email}</p>
                )}
                {patient.phone && (
                  <p className="text-sm text-gray-600 mb-3">📱 {patient.phone}</p>
                )}
                
                <div className="pt-3 border-t border-gray-200 mb-3">
                  <p className="text-xs text-gray-500">
                    Added: {new Date(patient.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/patient/${patient.id}/trends`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Trends
                  </button>
                  <button
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;
