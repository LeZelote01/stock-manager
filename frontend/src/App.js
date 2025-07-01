import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Login Page Component
const LoginPage = () => {
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    navigate('/admin-login');
  };

  const handleUserAccess = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Système de Gestion de Stock</h1>
          <p className="text-gray-600">Choisissez votre mode d'accès</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleAdminLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Administrateur
          </button>
          
          <button
            onClick={handleUserAccess}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Utilisateur
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Login Component
const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/login`, { password });
      if (response.data.status === 'success') {
        localStorage.setItem('admin-token', response.data.token);
        navigate('/admin');
      }
    } catch (error) {
      setError('Mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Connexion Administrateur</h1>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Entrez le mot de passe"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
          >
            Se connecter
          </button>
        </form>
        
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage = () => {
  const [materials, setMaterials] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, demandesRes, alertsRes] = await Promise.all([
        axios.get(`${API}/materials`),
        axios.get(`${API}/demandes`),
        axios.get(`${API}/stock-alerts`)
      ]);
      
      setMaterials(materialsRes.data);
      setDemandes(demandesRes.data.slice(0, 10)); // Last 10 requests
      setStockAlerts(alertsRes.data);
      
      console.log('Materials loaded:', materialsRes.data);
      console.log('Stock alerts loaded:', alertsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'critique': return 'bg-red-100 text-red-800';
      case 'bas': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
            <button
              onClick={() => navigate('/demande')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              Nouvelle Demande
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Stock Current */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Stock Actuel</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Matériel</th>
                    <th className="text-left py-2">Quantité</th>
                    <th className="text-left py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {stockAlerts.map((alert, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{alert.material.nom}</td>
                      <td className="py-2">{alert.material.quantite}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertColor(alert.level)}`}>
                          {alert.level === 'critique' ? 'Stock Critique' : 
                           alert.level === 'bas' ? 'Stock Bas' : 'Stock Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Dernières Demandes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Superviseur</th>
                    <th className="text-left py-2">Agent 1</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((demande, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">
                        {new Date(demande.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-2">
                        <div>
                          <div className="font-medium">{demande.superviseur_nom}</div>
                          <div className="text-gray-500 text-xs">{demande.superviseur_matricule}</div>
                        </div>
                      </td>
                      <td className="py-2">
                        <div>
                          <div className="font-medium">{demande.agent1_nom}</div>
                          <div className="text-gray-500 text-xs">{demande.agent1_matricule}</div>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {demande.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [agents, setAgents] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [chefSection, setChefSection] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      switch (activeTab) {
        case 'materials':
          const materialsRes = await axios.get(`${API}/materials`);
          setMaterials(materialsRes.data);
          break;
        case 'agents':
          const agentsRes = await axios.get(`${API}/agents`);
          setAgents(agentsRes.data);
          break;
        case 'superviseurs':
          const superviseursRes = await axios.get(`${API}/superviseurs`);
          setSuperviseurs(superviseursRes.data);
          break;
        case 'chef':
          const chefRes = await axios.get(`${API}/chef-section`);
          setChefSection(chefRes.data);
          break;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/${activeTab === 'chef' ? 'chef-section' : activeTab}`, formData);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'chef' ? 'chef-section' : activeTab;
      await axios.put(`${API}/${endpoint}/${editingItem.id}`, formData);
      setEditingItem(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        const endpoint = activeTab === 'chef' ? 'chef-section' : activeTab;
        await axios.delete(`${API}/${endpoint}/${id}`);
        fetchData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const renderForm = () => {
    const fields = getFieldsForTab();
    return (
      <form onSubmit={editingItem ? handleUpdate : handleCreate} className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-bold mb-4">
          {editingItem ? 'Modifier' : 'Ajouter'} {getTabTitle()}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field}>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === 'quantite' ? 'number' : 'text'}
                value={formData[field] || ''}
                onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            {editingItem ? 'Modifier' : 'Ajouter'}
          </button>
          {editingItem && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setFormData({});
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    );
  };

  const getFieldsForTab = () => {
    switch (activeTab) {
      case 'materials': return ['nom', 'quantite'];
      case 'agents': return ['nom', 'matricule'];
      case 'superviseurs': return ['nom', 'matricule'];
      case 'chef': return ['nom', 'matricule'];
      default: return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'materials': return 'Matériel';
      case 'agents': return 'Agent';
      case 'superviseurs': return 'Superviseur';
      case 'chef': return 'Chef de Section';
      default: return '';
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'materials': return materials;
      case 'agents': return agents;
      case 'superviseurs': return superviseurs;
      case 'chef': return chefSection;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <button
              onClick={() => {
                localStorage.removeItem('admin-token');
                window.location.href = '/';
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { key: 'materials', label: 'Matériels' },
            { key: 'agents', label: 'Agents' },
            { key: 'superviseurs', label: 'Superviseurs' },
            { key: 'chef', label: 'Chef de Section' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        {renderForm()}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {getFieldsForTab().map(field => (
                  <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentData().map((item, index) => (
                <tr key={index}>
                  {getFieldsForTab().map(field => (
                    <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item[field]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setFormData(item);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Material Request Page
const MaterialRequestPage = () => {
  const [agents, setAgents] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [formData, setFormData] = useState({
    superviseur_id: '',
    agent1_id: '',
    agent2_id: '',
    materiels_demandes: {}
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, superviseursRes, materialsRes] = await Promise.all([
        axios.get(`${API}/agents`),
        axios.get(`${API}/superviseurs`),
        axios.get(`${API}/materials`)
      ]);
      
      setAgents(agentsRes.data);
      setSuperviseurs(superviseursRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleMaterialQuantityChange = (materialId, quantity) => {
    setFormData(prev => ({
      ...prev,
      materiels_demandes: {
        ...prev.materiels_demandes,
        [materialId]: parseInt(quantity) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/demandes`, formData);
      alert('Demande créée avec succès !');
      navigate('/home');
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      alert('Erreur lors de la création de la demande');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Demande de Sortie de Matériel</h1>
            <button
              onClick={() => navigate('/home')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Retour
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Supervisor Selection */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Superviseur
              </label>
              <select
                value={formData.superviseur_id}
                onChange={(e) => setFormData({...formData, superviseur_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un superviseur</option>
                {superviseurs.map(superviseur => (
                  <option key={superviseur.id} value={superviseur.id}>
                    {superviseur.nom} - {superviseur.matricule}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent 1 Selection */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Agent 1
              </label>
              <select
                value={formData.agent1_id}
                onChange={(e) => setFormData({...formData, agent1_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner l'agent 1</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.nom} - {agent.matricule}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent 2 Selection */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Agent 2
              </label>
              <select
                value={formData.agent2_id}
                onChange={(e) => setFormData({...formData, agent2_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner l'agent 2</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.nom} - {agent.matricule}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Display */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Date de demande
              </label>
              <input
                type="text"
                value={new Date().toLocaleString('fr-FR')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                disabled
              />
            </div>

            {/* Materials Quantities */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quantités demandées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map(material => (
                  <div key={material.id}>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {material.nom} (Stock: {material.quantite})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={material.quantite}
                      value={formData.materiels_demandes[material.id] || 0}
                      onChange={(e) => handleMaterialQuantityChange(material.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Créer la demande
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/demande" element={<MaterialRequestPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;