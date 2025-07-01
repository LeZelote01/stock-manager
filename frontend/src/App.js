import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Html5QrcodeScanner } from "html5-qrcode";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Initialize Socket.IO
let socket = null;

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Système de Gestion de Stock Avancé</h1>
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

// Notification Component
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io(BACKEND_URL);
      
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.timestamp !== notification.timestamp));
        }, 5000);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.timestamp}
          className={`max-w-sm rounded-lg shadow-lg p-4 transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
              {notification.data && Object.keys(notification.data).length > 0 && (
                <p className="text-xs mt-1 opacity-90">
                  {JSON.stringify(notification.data)}
                </p>
              )}
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// QR Scanner Component
const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        scanner.clear();
        setScanning(false);
        onScan(decodedText);
      }, (error) => {
        console.warn(`QR scan error: ${error}`);
      });

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [scanning, onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Scanner QR Code</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        
        {!scanning ? (
          <button
            onClick={() => setScanning(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Démarrer le scan
          </button>
        ) : (
          <div>
            <div id="qr-reader" style={{ width: "100%" }}></div>
            <button
              onClick={() => {
                setScanning(false);
                onClose();
              }}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Arrêter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Home Page Component with Analytics
const HomePage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedMaterial, setScannedMaterial] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, trendsRes, alertsRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/analytics/trends`),
        axios.get(`${API}/stock-alerts`)
      ]);
      
      setAnalytics(analyticsRes.data);
      setTrends(trendsRes.data);
      setStockAlerts(alertsRes.data);
      
      console.log('Analytics loaded:', analyticsRes.data);
      console.log('Trends loaded:', trendsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleQRScan = async (qrData) => {
    try {
      const response = await axios.get(`${API}/qr/${qrData}`);
      setScannedMaterial(response.data);
      setShowQRScanner(false);
    } catch (error) {
      console.error('Erreur lors du scan QR:', error);
      alert('QR Code non reconnu');
      setShowQRScanner(false);
    }
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'critique': return 'bg-red-100 text-red-800';
      case 'bas': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const exportDashboard = async (format) => {
    try {
      if (format === 'png') {
        const element = document.getElementById('dashboard-content');
        const canvas = await html2canvas(element);
        const link = document.createElement('a');
        link.download = 'dashboard.png';
        link.href = canvas.toDataURL();
        link.click();
      } else {
        const response = await axios.post(`${API}/export/demandes`, 
          { format, include_graphiques: true },
          { responseType: 'blob' }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `rapport.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  // Prepare chart data
  const monthlyData = trends?.monthly_trends ? 
    Object.entries(trends.monthly_trends).map(([month, data]) => ({
      month,
      demandes: data.count,
      valeur: data.value
    })) : [];

  const topMaterialsData = trends?.top_materials ? 
    trends.top_materials.slice(0, 5).map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    })) : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <NotificationCenter />
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Avancé</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                📷 Scanner QR
              </button>
              <button
                onClick={() => navigate('/demande')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Nouvelle Demande
              </button>
              
              {/* Export buttons */}
              <div className="relative group">
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
                  📊 Exporter
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button onClick={() => exportDashboard('pdf')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    📄 Exporter PDF
                  </button>
                  <button onClick={() => exportDashboard('excel')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    📊 Exporter Excel
                  </button>
                  <button onClick={() => exportDashboard('csv')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    📋 Exporter CSV
                  </button>
                  <button onClick={() => exportDashboard('png')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    🖼️ Exporter PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="dashboard-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📦</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Matériels</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.materials_count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valeur Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.total_stock_value?.toFixed(2)}€</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚠️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Stock Bas</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.low_stock_count}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🚨</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Stock Critique</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.critical_stock_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends Chart */}
          {monthlyData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tendances Mensuelles</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="demandes" fill="#3B82F6" name="Nombre de demandes" />
                  <Line yAxisId="right" type="monotone" dataKey="valeur" stroke="#EF4444" strokeWidth={2} name="Valeur (€)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Materials Chart */}
          {topMaterialsData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Matériels Utilisés</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topMaterialsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nom, usage }) => `${nom}: ${usage}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage"
                  >
                    {topMaterialsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stock Alerts with AI Predictions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Alertes Stock avec Prédictions IA</h2>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Matériel</th>
                    <th className="text-left py-2">Stock</th>
                    <th className="text-left py-2">Statut</th>
                    <th className="text-left py-2">Prédiction IA</th>
                  </tr>
                </thead>
                <tbody>
                  {stockAlerts.map((alert, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{alert.material.nom}</td>
                      <td className="py-2">{alert.material.quantite}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertColor(alert.level)}`}>
                          {alert.level === 'critique' ? '🚨 Critique' : 
                           alert.level === 'bas' ? '⚠️ Bas' : '✅ Normal'}
                        </span>
                      </td>
                      <td className="py-2">
                        {alert.prediction && alert.prediction.prediction !== undefined ? (
                          <div className="text-xs">
                            <div>Prév. 30j: {alert.prediction.prediction.toFixed(1)}</div>
                            <div className="text-gray-500">Conf: {alert.prediction.confidence}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activité Récente</h2>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Superviseur</th>
                    <th className="text-left py-2">Valeur</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.recent_activity?.slice(0, 10).map((demande, index) => (
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
                        {demande.valeur_totale?.toFixed(2)}€
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ {demande.status}
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

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner 
          onScan={handleQRScan} 
          onClose={() => setShowQRScanner(false)} 
        />
      )}

      {/* Scanned Material Modal */}
      {scannedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Matériel Scanné</h3>
              <button 
                onClick={() => setScannedMaterial(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2">
              <p><strong>Nom:</strong> {scannedMaterial.nom}</p>
              <p><strong>Quantité:</strong> {scannedMaterial.quantite}</p>
              <p><strong>Prix unitaire:</strong> {scannedMaterial.prix_unitaire}€</p>
              <p><strong>Catégorie:</strong> {scannedMaterial.categorie}</p>
              <p><strong>Emplacement:</strong> {scannedMaterial.emplacement}</p>
              {scannedMaterial.qr_code && (
                <div className="mt-4 text-center">
                  <img src={scannedMaterial.qr_code} alt="QR Code" className="mx-auto w-24 h-24" />
                </div>
              )}
            </div>
            
            <button
              onClick={() => setScannedMaterial(null)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Admin Dashboard Component
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [materials, setMaterials] = useState([]);
  const [agents, setAgents] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [chefSection, setChefSection] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
    if (activeTab === 'historique') {
      fetchHistorique();
    }
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
        case 'fournisseurs':
          const fournisseursRes = await axios.get(`${API}/fournisseurs`);
          setFournisseurs(fournisseursRes.data);
          break;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, trendsRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/analytics/trends`)
      ]);
      setAnalytics(analyticsRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    }
  };

  const fetchHistorique = async () => {
    try {
      const response = await axios.get(`${API}/historique`);
      setHistorique(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'chef' ? 'chef-section' : activeTab;
      await axios.post(`${API}/${endpoint}`, formData);
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

  const exportData = async (format) => {
    try {
      const response = await axios.post(`${API}/export/demandes`, 
        { format, include_graphiques: true },
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const renderAnalytics = () => {
    if (!analytics || !trends) return <div>Chargement des analytics...</div>;

    const monthlyData = trends.monthly_trends ? 
      Object.entries(trends.monthly_trends).map(([month, data]) => ({
        month,
        demandes: data.count,
        valeur: data.value
      })) : [];

    return (
      <div className="space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Matériels</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.summary.materials_count}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Valeur Stock</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.summary.total_stock_value?.toFixed(2)}€</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Demandes/Mois</h3>
            <p className="text-3xl font-bold text-purple-600">{analytics.summary.monthly_demandes}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Valeur/Mois</h3>
            <p className="text-3xl font-bold text-orange-600">{analytics.summary.monthly_value?.toFixed(2)}€</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {monthlyData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Évolution Mensuelle</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="demandes" fill="#3B82F6" name="Nombre demandes" />
                  <Bar dataKey="valeur" fill="#EF4444" name="Valeur (€)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Alertes Stock</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Stock critique:</span>
                <span className="font-bold text-red-600">{analytics.summary.critical_stock_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Stock bas:</span>
                <span className="font-bold text-yellow-600">{analytics.summary.low_stock_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Agents:</span>
                <span className="font-bold text-blue-600">{analytics.summary.agents_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Superviseurs:</span>
                <span className="font-bold text-green-600">{analytics.summary.superviseurs_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Exports et Rapports</h3>
          <div className="flex space-x-4">
            <button onClick={() => exportData('pdf')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              📄 Export PDF
            </button>
            <button onClick={() => exportData('excel')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              📊 Export Excel
            </button>
            <button onClick={() => exportData('csv')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              📋 Export CSV
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistorique = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-bold">Historique des Actions</h3>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {historique.map((action, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(action.date).toLocaleString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {action.utilisateur}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {action.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {action.table_affectee}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <details className="cursor-pointer">
                    <summary>Voir détails</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(action.details, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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
                type={getInputType(field)}
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

  const getInputType = (field) => {
    if (['quantite', 'prix_unitaire', 'seuil_alerte', 'seuil_critique', 'delai_livraison'].includes(field)) {
      return 'number';
    }
    if (field === 'email') return 'email';
    if (field === 'telephone') return 'tel';
    return 'text';
  };

  const getFieldsForTab = () => {
    switch (activeTab) {
      case 'materials': 
        return ['nom', 'quantite', 'prix_unitaire', 'seuil_alerte', 'seuil_critique', 'categorie', 'unite', 'emplacement'];
      case 'agents': 
        return ['nom', 'matricule', 'email', 'telephone', 'service'];
      case 'superviseurs': 
        return ['nom', 'matricule', 'email', 'telephone', 'service'];
      case 'chef': 
        return ['nom', 'matricule', 'email', 'telephone', 'service'];
      case 'fournisseurs': 
        return ['nom', 'contact', 'email', 'telephone', 'adresse', 'delai_livraison'];
      default: return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'materials': return 'Matériel';
      case 'agents': return 'Agent';
      case 'superviseurs': return 'Superviseur';
      case 'chef': return 'Chef de Section';
      case 'fournisseurs': return 'Fournisseur';
      default: return '';
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'materials': return materials;
      case 'agents': return agents;
      case 'superviseurs': return superviseurs;
      case 'chef': return chefSection;
      case 'fournisseurs': return fournisseurs;
      default: return [];
    }
  };

  const renderDataTable = () => {
    const data = getCurrentData();
    const fields = getFieldsForTab();
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {fields.map(field => (
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
            {data.map((item, index) => (
              <tr key={index}>
                {fields.map(field => (
                  <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {field === 'qr_code' && item[field] ? (
                      <img src={item[field]} alt="QR" className="w-8 h-8" />
                    ) : (
                      item[field]
                    )}
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NotificationCenter />
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Administration Avancée</h1>
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
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'analytics', label: '📊 Analytics', icon: '📊' },
            { key: 'materials', label: '📦 Matériels', icon: '📦' },
            { key: 'agents', label: '👤 Agents', icon: '👤' },
            { key: 'superviseurs', label: '👥 Superviseurs', icon: '👥' },
            { key: 'chef', label: '🏆 Chef Section', icon: '🏆' },
            { key: 'fournisseurs', label: '🏪 Fournisseurs', icon: '🏪' },
            { key: 'historique', label: '📚 Historique', icon: '📚' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'historique' && renderHistorique()}
        {!['analytics', 'historique'].includes(activeTab) && (
          <>
            {renderForm()}
            {renderDataTable()}
          </>
        )}
      </div>
    </div>
  );
};

// Enhanced Material Request Page with AI predictions
const MaterialRequestPage = () => {
  const [agents, setAgents] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [formData, setFormData] = useState({
    superviseur_id: '',
    agent1_id: '',
    agent2_id: '',
    materiels_demandes: {},
    notes: ''
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

      // Get AI predictions for all materials
      const predictionPromises = materialsRes.data.map(material => 
        axios.get(`${API}/predictions/${material.id}`).catch(() => null)
      );
      const predictionResults = await Promise.all(predictionPromises);
      
      const predictionMap = {};
      predictionResults.forEach((result, index) => {
        if (result && result.data) {
          predictionMap[materialsRes.data[index].id] = result.data;
        }
      });
      setPredictions(predictionMap);

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
      alert('Demande créée et approuvée automatiquement !');
      navigate('/home');
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      alert('Erreur lors de la création de la demande');
    }
  };

  const calculateTotalValue = () => {
    return materials.reduce((total, material) => {
      const quantity = formData.materiels_demandes[material.id] || 0;
      return total + (quantity * (material.prix_unitaire || 0));
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Demande de Sortie de Matériel</h1>
            <div className="flex space-x-2">
              <div className="text-right">
                <p className="text-sm text-gray-600">Valeur totale estimée:</p>
                <p className="text-xl font-bold text-green-600">{calculateTotalValue().toFixed(2)}€</p>
              </div>
              <button
                onClick={() => navigate('/home')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Retour
              </button>
            </div>
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
                    {superviseur.nom} - {superviseur.matricule} ({superviseur.service})
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
                    {agent.nom} - {agent.matricule} ({agent.service})
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
                    {agent.nom} - {agent.matricule} ({agent.service})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Commentaires sur la demande..."
              />
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

            {/* Materials Quantities with AI Predictions */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quantités demandées avec Prédictions IA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map(material => {
                  const prediction = predictions[material.id];
                  const currentQuantity = formData.materiels_demandes[material.id] || 0;
                  const stockLevel = material.quantite <= material.seuil_critique ? 'critique' :
                                   material.quantite <= material.seuil_alerte ? 'bas' : 'normal';
                  
                  return (
                    <div key={material.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <label className="block text-gray-700 text-sm font-bold">
                          {material.nom}
                        </label>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          stockLevel === 'critique' ? 'bg-red-100 text-red-800' :
                          stockLevel === 'bas' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {stockLevel === 'critique' ? '🚨 Critique' :
                           stockLevel === 'bas' ? '⚠️ Bas' : '✅ Normal'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        Stock: {material.quantite} | Prix: {material.prix_unitaire}€ | 
                        Catégorie: {material.categorie}
                      </div>

                      {prediction && (
                        <div className="text-xs bg-blue-50 p-2 rounded mb-2">
                          <strong>🤖 Prédiction IA:</strong><br/>
                          Usage prévu (30j): {prediction.predicted_usage_30_days?.toFixed(1)}<br/>
                          {prediction.should_reorder && (
                            <span className="text-orange-600">⚠️ Réapprovisionnement recommandé</span>
                          )}
                          <br/>Confiance: {prediction.confidence}
                        </div>
                      )}

                      <input
                        type="number"
                        min="0"
                        max={material.quantite}
                        value={currentQuantity}
                        onChange={(e) => handleMaterialQuantityChange(material.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Quantité demandée"
                      />
                      
                      {currentQuantity > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          Valeur: {(currentQuantity * (material.prix_unitaire || 0)).toFixed(2)}€
                        </div>
                      )}
                      
                      {material.qr_code && (
                        <div className="mt-2 text-center">
                          <img src={material.qr_code} alt="QR Code" className="w-12 h-12 mx-auto" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-approval Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Approbation Automatique Activée
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Votre demande sera automatiquement approuvée et le stock sera mis à jour instantanément.
                      Valeur totale de la demande: <strong>{calculateTotalValue().toFixed(2)}€</strong>
                    </p>
                  </div>
                </div>
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
                ✅ Créer et Approuver la Demande
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