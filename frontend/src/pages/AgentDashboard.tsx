import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import {
  Truck,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  MapPin,
  RefreshCw,
  Edit2,
  Info,
  Calendar,
  Layers,
  Inbox
} from 'lucide-react';

interface Order {
  id: string;
  pickupAddress: string;
  pickupArea: { name: string; postalCode: string };
  dropAddress: string;
  dropArea: { name: string; postalCode: string };
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  orderType: 'B2B' | 'B2C';
  paymentType: 'PREPAID' | 'COD';
  totalCharge: number;
  status: string;
  customer: { name: string; email: string };
  createdAt: string;
}

interface AgentProfile {
  id: string;
  isAvailable: boolean;
  currentLat: number;
  currentLng: number;
  currentZoneId?: string;
  currentZone?: { name: string };
}

export default function AgentDashboard() {
  const { token, user } = useAuth();

  // State
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Notification State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update inputs
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit coordinates
  const [editingLoc, setEditingLoc] = useState(false);
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchOrders();
  }, []);

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

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/agent/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
      setNewLat(data.currentLat?.toString() || '');
      setNewLng(data.currentLng?.toString() || '');
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/agent/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const res = await fetch('/api/agent/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !profile.isAvailable }),
      });
      const data = await res.json();
      setProfile(data);
      showSuccess(`Status toggled successfully. You are now ${data.isAvailable ? 'Available' : 'Unavailable'}.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/agent/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentLat: parseFloat(newLat),
          currentLng: parseFloat(newLng),
        }),
      });
      const data = await res.json();
      setProfile(data);
      setEditingLoc(false);
      showSuccess('Location coordinates updated successfully!');
      fetchOrders();
    } catch (e) {
      showError('Failed to update coordinates.');
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/agent/orders/${selectedOrder.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Update failed.');

      showSuccess(`Order status updated to ${newStatus}!`);
      setNewStatus('');
      setNotes('');
      setSelectedOrder(null);
      fetchOrders();
      fetchProfile();
    } catch (err: any) {
      showError(err.message || 'Failed to update order.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-[10px] font-bold uppercase tracking-wider">Pending</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wider">Assigned</span>;
      case 'PICKED_UP':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold uppercase tracking-wider">Picked Up</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold uppercase tracking-wider">In Transit</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[10px] font-bold uppercase tracking-wider">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold uppercase tracking-wider">Delivered</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider">Failed</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-gray-50 text-gray-700 border border-gray-200 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const totalAssigned = orders.length;
  const pendingPickup = orders.filter((o) => o.status === 'ASSIGNED').length;
  const transitCount = orders.filter((o) => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const completedDrops = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      
      {/* 1. AGENT STATISTICS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Shipments</span>
            <h3 className="text-2xl font-black text-gray-900">{totalAssigned}</h3>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Awaiting Pickup</span>
            <h3 className="text-2xl font-black text-gray-900">{pendingPickup}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
            <Inbox className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">In-Transit Pipeline</span>
            <h3 className="text-2xl font-black text-gray-900">{transitCount}</h3>
          </div>
          <div className="bg-yellow-50 text-yellow-600 p-2.5 rounded-lg">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Drops</span>
            <h3 className="text-2xl font-black text-gray-900">{completedDrops}</h3>
          </div>
          <div className="bg-green-50 text-green-600 p-2.5 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Agent Dispatch Queue</h1>
          <p className="text-gray-500 text-sm mt-0.5">Toggle availability status, verify GPS pins, and log route status.</p>
        </div>
        {profile && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleAvailability}
              className={`flex items-center px-4 py-2 rounded-lg font-bold text-xs shadow transition uppercase tracking-wider ${
                profile.isAvailable
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <UserCheck className="h-4.5 w-4.5 mr-2" />
              Duty: {profile.isAvailable ? 'ON DUTY (AVAIL)' : 'OFF DUTY (BUSY)'}
            </button>
            <button
              onClick={() => {
                fetchProfile();
                fetchOrders();
              }}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              title="Refresh Console"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
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
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Agent Location Profile */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-800 font-sans">Operational Profile</h2>
          </div>

          {profile && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="flex justify-between border-b pb-1">
                  <strong className="text-gray-500">Linked Region:</strong>{' '}
                  <span className="font-bold text-gray-800">{profile.currentZone?.name || 'Unconfigured Zone'}</span>
                </p>
                <p className="flex justify-between border-b pb-1">
                  <strong className="text-gray-500">Live Latitude:</strong> <span className="font-mono text-gray-700">{profile.currentLat || 'N/A'}</span>
                </p>
                <p className="flex justify-between border-b pb-1">
                  <strong className="text-gray-500">Live Longitude:</strong> <span className="font-mono text-gray-700">{profile.currentLng || 'N/A'}</span>
                </p>
              </div>

              {editingLoc ? (
                <form onSubmit={handleUpdateLocation} className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={newLat}
                        onChange={(e) => setNewLat(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={newLng}
                        onChange={(e) => setNewLng(e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 text-xs">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded"
                    >
                      Save Coordinates
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLoc(false)}
                      className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setEditingLoc(true)}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Update Location (Coordinates)</span>
                </button>
              )}

              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs flex items-start space-x-2">
                <Info className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>
                  Proximity routing automatically assigns you to bookings based on your coordinates. Keep your GPS pins updated to receive nearby dispatches.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Assigned Orders list and actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Orders Table */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 border-b border-gray-100 pb-3">
              <Truck className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-800 font-sans">Active Delivery Queue ({orders.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Pickup point</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p className="font-semibold text-gray-500 text-sm">No shipments assigned</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Toggle duty to "Available" to get automatically assigned.</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">
                          {o.id.split('-')[0]}
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold">{o.customer.name}</td>
                        <td className="py-3 px-3 text-xs">
                          {o.pickupAddress} <br />
                          <span className="text-gray-400">({o.pickupArea.name})</span>
                        </td>
                        <td className="py-3 px-3 text-xs">
                          {o.dropAddress} <br />
                          <span className="text-gray-400">({o.dropArea.name})</span>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setNewStatus(o.status);
                            }}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-1 px-2.5 rounded flex inline-flex items-center space-x-1 text-[10px] uppercase tracking-wider transition"
                          >
                            <span>Open</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Status Updater Panel */}
          {selectedOrder && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
              <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2 flex justify-between items-center">
                <span>Update Journey stage for Order #{selectedOrder.id.split('-')[0]}</span>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  Close
                </button>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
                <div>
                  <p><strong>Recipient Company:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.email})</p>
                  <p><strong>Pickup address:</strong> {selectedOrder.pickupAddress} ({selectedOrder.pickupArea.name})</p>
                  <p><strong>Drop address:</strong> {selectedOrder.dropAddress} ({selectedOrder.dropArea.name})</p>
                </div>
                <div>
                  <p><strong>Payment terms:</strong> {selectedOrder.paymentType}</p>
                  <p><strong>Total charge:</strong> ₹{selectedOrder.totalCharge.toFixed(2)}</p>
                  <p><strong>Active stage:</strong> {getStatusBadge(selectedOrder.status)}</p>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleStatusUpdate} className="bg-gray-50 border p-4 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Select New Journey Stage</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="ASSIGNED">Assigned (Initial)</option>
                      <option value="PICKED_UP">Picked Up</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered (Success)</option>
                      <option value="FAILED">Failed Attempt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Timeline log note / Fail Reason</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        newStatus === 'FAILED'
                          ? 'Specify reason, e.g. Receiver unreachable.'
                          : 'Enter timeline description notes...'
                      }
                      required={newStatus === 'FAILED'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {newStatus === 'FAILED' && (
                  <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200 text-xs">
                    <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                    <span>
                      Warning: Marking as FAILED triggers an automated customer alert to reschedule. Your profile will be released back to 'Available'.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs shadow-md transition"
                >
                  {loading ? 'Submitting Status Update...' : 'Commit Status Change'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
