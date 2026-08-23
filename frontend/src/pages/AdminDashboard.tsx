import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import {
  ShieldAlert,
  Compass,
  Settings,
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Info,
  CheckCircle,
  TrendingUp,
  Map,
  Users,
  Coins,
  Inbox
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  description?: string;
  _count?: { areas: number; agentProfiles: number };
}

interface Area {
  id: string;
  postalCode: string;
  name: string;
  zoneId: string;
  zone: Zone;
}

interface RateCard {
  id: string;
  fromZoneId: string;
  fromZone: Zone;
  toZoneId: string;
  toZone: Zone;
  orderType: string;
  baseCharge: number;
  ratePerKg: number;
  codSurcharge: number;
}

interface Agent {
  id: string;
  userId: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
  currentZoneId?: string;
  currentZone?: Zone;
  user: { name: string; email: string };
}

interface Order {
  id: string;
  pickupAddress: string;
  pickupArea: Area;
  dropAddress: string;
  dropArea: Area;
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  orderType: string;
  paymentType: string;
  deliveryCharge: number;
  codSurcharge: number;
  totalCharge: number;
  status: string;
  agentId?: string;
  agent?: { user: { name: string } };
  customer: { name: string; email: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const { token } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState<'orders' | 'zones' | 'rates' | 'agents'>('orders');

  // Master Data State
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Filter state for orders
  const [filterStatus, setFilterStatus] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  // Selected entities for details/modals
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Inline Notification State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Forms state
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDesc, setNewZoneDesc] = useState('');

  const [newAreaPostal, setNewAreaPostal] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaZoneId, setNewAreaZoneId] = useState('');

  const [newRcFromZone, setNewRcFromZone] = useState('');
  const [newRcToZone, setNewRcToZone] = useState('');
  const [newRcType, setNewRcType] = useState('B2C');
  const [newRcBase, setNewRcBase] = useState('50');
  const [newRcPerKg, setNewRcPerKg] = useState('8');
  const [newRcCod, setNewRcCod] = useState('15');

  // Override / Assign actions state
  const [assignAgentId, setAssignAgentId] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');

  // Fetch helper loaders
  useEffect(() => {
    fetchZones();
    fetchAreas();
    fetchRateCards();
    fetchAgents();
    fetchOrders();
  }, [filterStatus, filterZone, filterAgent]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const fetchZones = async () => {
    const res = await fetch('/api/admin/zones', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setZones(await res.json());
  };

  const fetchAreas = async () => {
    const res = await fetch('/api/admin/areas', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setAreas(data);
      if (data.length > 0 && !newAreaZoneId) {
        setNewAreaZoneId(data[0].zoneId);
      }
    }
  };

  const fetchRateCards = async () => {
    const res = await fetch('/api/admin/ratecards', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setRateCards(await res.json());
  };

  const fetchAgents = async () => {
    const res = await fetch('/api/admin/agents', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAgents(await res.json());
  };

  const fetchOrders = async () => {
    let url = `/api/admin/orders?`;
    if (filterStatus) url += `status=${filterStatus}&`;
    if (filterZone) url += `zoneId=${filterZone}&`;
    if (filterAgent) url += `agentId=${filterAgent}&`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setOrders(await res.json());
  };

  const fetchOrderDetails = async (id: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setSelectedOrder(data);
      setOverrideStatus(data.status);
      setOverrideNotes('');
      setAssignAgentId(data.agentId || '');
    }
  };

  // Create Zone handler
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newZoneName, description: newZoneDesc }),
    });
    if (res.ok) {
      setNewZoneName('');
      setNewZoneDesc('');
      showSuccess('Zone created successfully!');
      fetchZones();
    } else {
      const d = await res.json();
      showError(d.error || 'Failed to create zone.');
    }
  };

  // Create Area handler
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ postalCode: newAreaPostal, name: newAreaName, zoneId: newAreaZoneId }),
    });
    if (res.ok) {
      setNewAreaPostal('');
      setNewAreaName('');
      showSuccess('Area linked successfully!');
      fetchAreas();
    } else {
      const d = await res.json();
      showError(d.error || 'Failed to map area.');
    }
  };

  // Create Rate Card handler
  const handleCreateRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/ratecards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fromZoneId: newRcFromZone,
        toZoneId: newRcToZone,
        orderType: newRcType,
        baseCharge: newRcBase,
        ratePerKg: newRcPerKg,
        codSurcharge: newRcCod,
      }),
    });
    if (res.ok) {
      showSuccess('Rate card configuration created!');
      fetchRateCards();
    } else {
      const d = await res.json();
      showError(d.error || 'Failed to create rate card.');
    }
  };

  // Delete handlers
  const handleDeleteZone = async (id: string) => {
    if (confirm('Delete this zone? This deletes all mapped areas and rate cards!')) {
      await fetch(`/api/admin/zones/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      showSuccess('Zone deleted successfully.');
      fetchZones();
      fetchAreas();
      fetchRateCards();
    }
  };

  const handleDeleteArea = async (id: string) => {
    await fetch(`/api/admin/areas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    showSuccess('Area link deleted.');
    fetchAreas();
  };

  const handleDeleteRateCard = async (id: string) => {
    await fetch(`/api/admin/ratecards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    showSuccess('Rate card deleted.');
    fetchRateCards();
  };

  // Assign agent trigger
  const handleAssignAgent = async (auto: boolean) => {
    if (!selectedOrder) return;
    const body: any = {};
    if (auto) body.auto = true;
    else {
      if (!assignAgentId) return showError('Please select a specific agent to assign.');
      body.agentId = assignAgentId;
    }

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (res.ok) {
      showSuccess(d.message || 'Agent assigned successfully!');
    } else {
      showError(d.error || 'Failed to assign agent.');
    }
    fetchOrderDetails(selectedOrder.id);
    fetchOrders();
  };

  // Override order status
  const handleOverrideStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !overrideStatus) return;

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/override-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: overrideStatus, notes: overrideNotes }),
    });

    if (res.ok) {
      showSuccess('Status overridden and customer notified.');
      fetchOrderDetails(selectedOrder.id);
      fetchOrders();
    } else {
      showError('Failed to override status.');
    }
  };

  // Initialize form defaults once zones are fetched
  useEffect(() => {
    if (zones.length > 0) {
      if (!newAreaZoneId) setNewAreaZoneId(zones[0].id);
      if (!newRcFromZone) setNewRcFromZone(zones[0].id);
      if (!newRcToZone) setNewRcToZone(zones[0].id);
    }
  }, [zones]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider">Assigned</span>;
      case 'PICKED_UP':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold uppercase tracking-wider">Picked Up</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold uppercase tracking-wider">In Transit</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-bold uppercase tracking-wider">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-wider">Delivered</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider">Failed</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const totalInvoice = orders.reduce((sum, o) => sum + o.totalCharge, 0);
  const activeAgents = agents.filter((a) => a.isAvailable).length;

  return (
    <div className="space-y-6">
      
      {/* 1. ADMIN KPI METRICS DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice Volume</span>
            <h3 className="text-2xl font-black text-gray-900">₹{totalInvoice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Shipments</span>
            <h3 className="text-2xl font-black text-gray-900">{orders.length}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
            <Inbox className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">On-Duty Couriers</span>
            <h3 className="text-2xl font-black text-gray-900">{activeAgents} / {agents.length}</h3>
          </div>
          <div className="bg-green-50 text-green-600 p-2.5 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Operating Zones</span>
            <h3 className="text-2xl font-black text-gray-900">{zones.length}</h3>
          </div>
          <div className="bg-yellow-50 text-yellow-600 p-2.5 rounded-lg">
            <Map className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Dashboard Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Control Panel</h1>
          <p className="text-gray-500 text-sm mt-0.5">Control pricing formulas, zone regions, and agent delivery queues.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg border text-sm font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 rounded-md transition ${
              activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-1.5 rounded-md transition ${
              activeTab === 'zones' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Zones & Areas
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-4 py-1.5 rounded-md transition ${
              activeTab === 'rates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rate Cards
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-1.5 rounded-md transition ${
              activeTab === 'agents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Agents
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR INLINE ALERTS */}
      {successMsg && (
        <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg border border-green-200 text-sm font-semibold flex items-center transition shadow-sm animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg border border-red-200 text-sm font-semibold flex items-center transition shadow-sm animate-fadeIn">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* ORDERS TAB */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Order Listing with filters */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800 font-sans">All Shipments ({orders.length})</h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2 py-1 border rounded text-xs bg-white text-gray-700 font-semibold"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                </select>

                {/* Zone filter */}
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="px-2 py-1 border rounded text-xs bg-white text-gray-700 font-semibold"
                >
                  <option value="">All Zones</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>

                {/* Agent filter */}
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="px-2 py-1 border rounded text-xs bg-white text-gray-700 font-semibold"
                >
                  <option value="">All Agents</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-3">Price</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Agent</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400">
                        No orders matching search filter criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">{o.id.split('-')[0]}</td>
                        <td className="py-3 px-3">{o.customer.name}</td>
                        <td className="py-3 px-3">
                          {o.pickupArea.name} → {o.dropArea.name}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900">₹{o.totalCharge.toFixed(2)}</td>
                        <td className="py-3 px-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 px-3 text-gray-500 font-medium">
                          {o.agent ? o.agent.user.name : <em className="text-gray-400">Unassigned</em>}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => fetchOrderDetails(o.id)}
                            className="bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 px-2 py-1 rounded font-bold text-[10px] transition"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Audit, Overrides & Agent assignment details */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-base font-extrabold text-gray-800 border-b pb-2 mb-3 flex justify-between items-center">
                    <span>Manage Order #{selectedOrder.id.split('-')[0]}</span>
                    <button onClick={() => setSelectedOrder(null)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Close</button>
                  </h3>
                  
                  <div className="space-y-1.5 text-xs text-gray-700">
                    <p><strong>Customer:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.email})</p>
                    <p><strong>Route:</strong> {selectedOrder.pickupAddress} → {selectedOrder.dropAddress}</p>
                    <p><strong>Actual Wt:</strong> {selectedOrder.actualWeight} kg | <strong>Volumetric:</strong> {selectedOrder.volumetricWeight.toFixed(2)} kg</p>
                    <p><strong>Type:</strong> {selectedOrder.orderType} ({selectedOrder.paymentType})</p>
                    <p><strong>Price Breakdown:</strong> Delivery: ₹{selectedOrder.deliveryCharge.toFixed(2)} + COD Surcharge: ₹{selectedOrder.codSurcharge.toFixed(2)} = <strong>₹{selectedOrder.totalCharge.toFixed(2)}</strong></p>
                    <p><strong>Reschedule Attempts:</strong> {selectedOrder.rescheduleAttempts} {selectedOrder.rescheduleDate && `(Rescheduled for ${new Date(selectedOrder.rescheduleDate).toLocaleDateString()})`}</p>
                  </div>
                </div>

                {/* 1. AGENT ASSIGNMENT ACTIONS */}
                <div className="bg-gray-50 border p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Agent Assignment (Nearest / Manual)</h4>
                  
                  {/* Dropdown list of available agents */}
                  <div className="flex space-x-2">
                    <select
                      value={assignAgentId}
                      onChange={(e) => setAssignAgentId(e.target.value)}
                      className="flex-grow px-2 py-1 text-xs border rounded bg-white focus:outline-none"
                    >
                      <option value="">-- Choose Agent --</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.user.name} ({ag.isAvailable ? 'Available' : 'Busy'} - {ag.currentZone?.name || 'No Zone'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignAgent(false)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1 rounded"
                    >
                      Assign
                    </button>
                  </div>

                  <div className="border-t pt-2.5">
                    <button
                      onClick={() => handleAssignAgent(true)}
                      className="w-full border border-indigo-600 hover:bg-indigo-50 text-indigo-700 text-xs font-bold py-1.5 rounded transition flex items-center justify-center space-x-1"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>Trigger Auto-Assignment</span>
                    </button>
                  </div>
                </div>

                {/* 2. ADMIN STATUS OVERRIDE */}
                <form onSubmit={handleOverrideStatus} className="bg-gray-50 border p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Force Override Status</h4>
                  <div className="space-y-2">
                    <select
                      value={overrideStatus}
                      onChange={(e) => setOverrideStatus(e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded bg-white focus:outline-none"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="PICKED_UP">Picked Up</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="FAILED">Failed</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Notes for status override log..."
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded transition"
                    >
                      Override & Notify Customer
                    </button>
                  </div>
                </form>

                {/* 3. IMMUTABLE TIMELINE AUDIT HISTORY */}
                <div className="border-t pt-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Immutable History Logs</h4>
                  <div className="relative border-l pl-3 ml-1 space-y-3 max-h-48 overflow-y-auto text-[11px]">
                    {selectedOrder.timelines?.map((tl: any) => (
                      <div key={tl.id}>
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>{tl.status}</span>
                          <span className="text-gray-400">{new Date(tl.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-500 italic">{tl.notes}</p>
                        <p className="text-[9px] text-gray-400">Actor: {tl.actor ? tl.actor.name : 'SYSTEM'} ({tl.actorRole})</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. NOTIFICATION AUDIT LOGS */}
                <div className="border-t pt-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Notification dispatch log</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto text-[10px] text-gray-500">
                    {selectedOrder.notifications?.length === 0 ? (
                      <p className="text-gray-400">No notifications sent.</p>
                    ) : (
                      selectedOrder.notifications?.map((notif: any) => (
                        <div key={notif.id} className="p-2 bg-gray-50 rounded border">
                          <div className="flex justify-between font-bold text-gray-700">
                            <span>{notif.type} to {notif.recipientEmail}</span>
                            <span className="text-green-600 uppercase font-semibold">{notif.status}</span>
                          </div>
                          <p className="font-medium text-gray-800 mt-0.5">Subj: {notif.subject}</p>
                          <p className="whitespace-pre-line leading-relaxed text-gray-400 mt-1">{notif.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center py-12 text-gray-400 shadow-sm text-sm">
                <Info className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <span>Select an order from the list to audit its status timeline, check notification dispatch history, manually assign an agent, or trigger status overrides.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ZONES & AREAS TAB */}
      {/* ==================================================== */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* Zones Config */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <h2 className="text-lg font-bold text-gray-800">Operational Zones</h2>
            </div>

            <form onSubmit={handleCreateZone} className="bg-gray-50 p-4 border rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Zone West"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Zone details..."
                  value={newZoneDesc}
                  onChange={(e) => setNewZoneDesc(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-xs transition shadow-sm"
              >
                Add Operational Zone
              </button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {zones.map((z) => (
                <div key={z.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 text-sm">
                  <div>
                    <h4 className="font-bold text-gray-800">{z.name}</h4>
                    <p className="text-gray-500 text-xs">{z.description || 'No description'}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      Areas Linked: {z._count?.areas} | active couriers: {z._count?.agentProfiles}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(z.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Areas (Postal Codes) Config */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <h2 className="text-lg font-bold text-gray-800">Pin Area to Zone Mapping</h2>
            </div>

            <form onSubmit={handleCreateArea} className="bg-gray-50 p-4 border rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., 400050"
                    value={newAreaPostal}
                    onChange={(e) => setNewAreaPostal(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Area Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Bandra"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Link to Zone</label>
                  <select
                    value={newAreaZoneId}
                    onChange={(e) => setNewAreaZoneId(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border bg-white focus:outline-none"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-xs transition shadow-sm"
              >
                Map Area to Zone
              </button>
            </form>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="min-w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Postal Code</th>
                    <th className="py-2 px-3">Area Name</th>
                    <th className="py-2 px-3">Linked Zone</th>
                    <th className="py-2 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {areas.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 px-3 font-mono font-bold">{a.postalCode}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">{a.name}</td>
                      <td className="py-2 px-3 text-gray-500">{a.zone.name}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteArea(a.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* RATE CARDS TAB */}
      {/* ==================================================== */}
      {activeTab === 'rates' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Configurable Pricing Rate Cards</h2>
          </div>

          <form onSubmit={handleCreateRateCard} className="bg-gray-50 p-4 border rounded-xl space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">From Zone</label>
                <select
                  value={newRcFromZone}
                  onChange={(e) => setNewRcFromZone(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border bg-white focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">To Zone</label>
                <select
                  value={newRcToZone}
                  onChange={(e) => setNewRcToZone(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border bg-white focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Order Type</label>
                <select
                  value={newRcType}
                  onChange={(e) => setNewRcType(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border bg-white focus:outline-none"
                >
                  <option value="B2C">B2C (Retail)</option>
                  <option value="B2B">B2B (Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Base Charge (₹)</label>
                <input
                  type="number"
                  required
                  value={newRcBase}
                  onChange={(e) => setNewRcBase(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rate per Kg (₹)</label>
                <input
                  type="number"
                  required
                  value={newRcPerKg}
                  onChange={(e) => setNewRcPerKg(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">COD Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={newRcCod}
                  onChange={(e) => setNewRcCod(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-xs transition shadow-sm"
            >
              Add Pricing Route Rule
            </button>
          </form>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="min-w-full text-xs text-left text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Pickup Zone</th>
                  <th className="py-2 px-3">Drop Zone</th>
                  <th className="py-2 px-3">Route Category</th>
                  <th className="py-2 px-3">Order Type</th>
                  <th className="py-2 px-3">Base Charge</th>
                  <th className="py-2 px-3">Price Per Kg</th>
                  <th className="py-2 px-3">COD Surcharge</th>
                  <th className="py-2 px-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rateCards.map((rc) => {
                  const isIntra = rc.fromZoneId === rc.toZoneId;
                  return (
                    <tr key={rc.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{rc.fromZone.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{rc.toZone.name}</td>
                      <td className="py-2.5 px-3">
                        {isIntra ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-semibold text-[10px]">Intra-Zone</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[10px]">Inter-Zone</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{rc.orderType}</td>
                      <td className="py-2.5 px-3 font-medium">₹{rc.baseCharge.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-medium">₹{rc.ratePerKg.toFixed(2)} / kg</td>
                      <td className="py-2.5 px-3 font-medium">₹{rc.codSurcharge.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteRateCard(rc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* AGENTS TAB */}
      {/* ==================================================== */}
      {activeTab === 'agents' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <div>
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-2">Delivery Agents Registry</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Agent Name</th>
                  <th className="py-2 px-3">Email Address</th>
                  <th className="py-2 px-3">Current Zone</th>
                  <th className="py-2 px-3">Coordinates (Lat, Lng)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-3 font-bold text-gray-900">{ag.user.name}</td>
                    <td className="py-3 px-3">{ag.user.email}</td>
                    <td className="py-3 px-3 font-medium text-gray-700">{ag.currentZone?.name || 'Unassigned'}</td>
                    <td className="py-3 px-3 font-mono text-gray-500">
                      {ag.currentLat !== null && ag.currentLng !== null 
                        ? `${ag.currentLat?.toFixed(4)}, ${ag.currentLng?.toFixed(4)}`
                        : 'No Coordinates'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ag.isAvailable ? (
                        <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-bold text-[10px] uppercase">Available</span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px] uppercase">Busy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
