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
  Info
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
  const { token } = useAuth();

  // State
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
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
      alert('Location coordinates updated successfully!');
      // Re-trigger order reload
      fetchOrders();
    } catch (e) {
      alert('Failed to update coordinates.');
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

      alert(`Order status updated to ${newStatus}!`);
      setNewStatus('');
      setNotes('');
      setSelectedOrder(null);
      fetchOrders();
      fetchProfile(); // Profile availability might update
    } catch (err: any) {
      alert(err.message || 'Failed to update order.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Pending</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Assigned</span>;
      case 'PICKED_UP':
        return <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-semibold">Picked Up</span>;
      case 'IN_TRANSIT':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">In Transit</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">Delivered</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">Failed</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Agent Delivery Console</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage tasks, report location, and toggle availability.</p>
        </div>
        {profile && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleAvailability}
              className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm shadow transition ${
                profile.isAvailable
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Status: {profile.isAvailable ? 'Available' : 'Unavailable'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Agent Location Profile */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <MapPin className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-800">Your Operational Profile</h2>
          </div>

          {profile && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p>
                  <strong>Zone Area:</strong>{' '}
                  <span className="text-gray-600">{profile.currentZone?.name || 'Unconfigured Zone'}</span>
                </p>
                <p>
                  <strong>GPS Lat:</strong> <span className="text-gray-600 font-mono">{profile.currentLat || 'N/A'}</span>
                </p>
                <p>
                  <strong>GPS Lng:</strong> <span className="text-gray-600 font-mono">{profile.currentLng || 'N/A'}</span>
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
                        className="w-full px-2 py-1 border rounded text-xs"
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
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 text-xs">
                    <button
                      type="submit"
                      className="bg-green-600 text-white font-bold px-2 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLoc(false)}
                      className="bg-gray-200 text-gray-700 px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setEditingLoc(true)}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Update Location (Coordinates)</span>
                </button>
              )}

              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>
                  The auto-assignment engine uses your GPS coordinates and zone assignment to pair you with the closest pickups. Keep your location updated to get nearby bookings.
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
              <Truck className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-800">Your Assigned Deliveries ({orders.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Pickup Address</th>
                    <th className="py-2.5 px-3">Drop Address</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400">
                        You have no deliveries currently assigned. Set your status to "Available" and wait for assignment.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-mono text-xs font-semibold text-gray-900">
                          {o.id.split('-')[0]}
                        </td>
                        <td className="py-3 px-3 text-xs">{o.customer.name}</td>
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
                            className="bg-green-50 text-green-700 hover:bg-green-100 font-bold py-1 px-2.5 rounded flex inline-flex items-center space-x-1 text-xs transition"
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
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex justify-between items-center">
                <span>Update Order #{selectedOrder.id.split('-')[0]}</span>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  Close
                </button>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p><strong>Customer:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.email})</p>
                  <p><strong>Pickup From:</strong> {selectedOrder.pickupAddress} ({selectedOrder.pickupArea.name})</p>
                  <p><strong>Deliver To:</strong> {selectedOrder.dropAddress} ({selectedOrder.dropArea.name})</p>
                </div>
                <div>
                  <p><strong>Payment Type:</strong> {selectedOrder.paymentType}</p>
                  <p><strong>Charge Amount:</strong> ₹{selectedOrder.totalCharge.toFixed(2)}</p>
                  <p><strong>Current Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleStatusUpdate} className="bg-gray-50 border p-4 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Select New Journey Stage</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="ASSIGNED">Assigned (Initial)</option>
                      <option value="PICKED_UP">Picked Up</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="FAILED">Failed Attempt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Status logs / Fail Reason</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        newStatus === 'FAILED'
                          ? 'E.g., Customer not at home / unreachable.'
                          : 'E.g., Handed over to security.'
                      }
                      required={newStatus === 'FAILED'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm shadow transition"
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
