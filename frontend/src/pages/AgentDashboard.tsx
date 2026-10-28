import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MapPin,
  RefreshCw,
  Edit2,
  Layers,
  Inbox,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Clock,
  Navigation
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
      showSuccess(`Duty status updated. You are now ${data.isAvailable ? 'Online & Available for dispatches' : 'Off Duty'}.`);
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
      showSuccess('GPS coordinates calibrated successfully!');
      fetchOrders();
    } catch (e) {
      showError('Failed to update coordinates.');
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setNewLat(lat);
        setNewLng(lng);
        setEditingLoc(true);
        showSuccess(`Live GPS lock acquired: ${lat}, ${lng}. Click "Save Coordinates" to commit.`);
      },
      (err) => {
        showError(`Could not detect device GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

      showSuccess(`Consignment status updated to ${newStatus}!`);
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
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
            Pending
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5"></span>
            Assigned
          </span>
        );
      case 'PICKED_UP':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
            Picked Up
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 animate-pulse"></span>
            In Transit
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></span>
            Out for Delivery
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Delivered
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
            {status}
          </span>
        );
    }
  };

  const totalAssigned = orders.length;
  const pendingPickup = orders.filter((o) => o.status === 'ASSIGNED').length;
  const transitCount = orders.filter((o) => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const completedDrops = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* 1. AGENT BENTO METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Route Load</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{totalAssigned}</h3>
            <span className="text-[10px] text-zinc-500 font-medium">Assigned to courier</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Awaiting Pickup</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{pendingPickup}</h3>
            <span className="text-[10px] text-sky-600 font-medium">Initial assignment</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100/80 flex items-center justify-center text-sky-600">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Active Transit</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{transitCount}</h3>
            <span className="text-[10px] text-amber-600 font-medium">In handover pipeline</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Completed Drops</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{completedDrops}</h3>
            <span className="text-[10px] text-emerald-600 font-medium">Successful handovers</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL STATUS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Courier Dispatch Terminal</h1>
            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200 font-bold">
              AGENT
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Manage dispatch status milestones, calibrate GPS pins, and acknowledge custody handoffs.
          </p>
        </div>

        {profile && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleAvailability}
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
                profile.isAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full mr-2 ${profile.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}></span>
              <span>{profile.isAvailable ? 'Status: Available (On Duty)' : 'Status: Busy (Off Duty)'}</span>
            </button>
            <button
              onClick={() => {
                fetchProfile();
                fetchOrders();
              }}
              className="p-2.5 rounded-xl border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition"
              title="Refresh Console"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50/80 text-emerald-800 px-4 py-3 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center animate-fadeIn shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50/80 text-rose-800 px-4 py-3 rounded-xl border border-rose-200 text-xs font-semibold flex items-center animate-fadeIn shadow-sm">
          <AlertCircle className="h-4 w-4 text-rose-600 mr-2 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: GPS & Telemetry Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Compass className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Telemetry & Sector</h2>
              <span className="text-[10px] text-zinc-400 font-mono">GPS Routing Engine</span>
            </div>
          </div>

          {profile && (
            <div className="space-y-4">
              <div className="space-y-2.5 text-xs text-zinc-700">
                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 border border-zinc-200/60">
                  <span className="text-zinc-500 font-medium">Assigned Sector:</span>
                  <span className="font-bold text-zinc-900">
                    {profile.currentZone?.name || 'Central Hub'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 font-mono text-[11px]">
                  <span className="text-zinc-500 font-sans font-medium">Current Latitude:</span>
                  <span className="font-bold text-zinc-800">{profile.currentLat ?? '28.6139'}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 font-mono text-[11px]">
                  <span className="text-zinc-500 font-sans font-medium">Current Longitude:</span>
                  <span className="font-bold text-zinc-800">{profile.currentLng ?? '77.2090'}</span>
                </div>
              </div>

              {editingLoc ? (
                <form onSubmit={handleUpdateLocation} className="space-y-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={newLat}
                        onChange={(e) => setNewLat(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={newLng}
                        onChange={(e) => setNewLng(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold transition flex items-center space-x-1"
                      title="Read GPS sensor from device"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Device GPS</span>
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-zinc-900 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-zinc-800 transition"
                    >
                      Save Coordinates
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLoc(false)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleDetectGPS}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span>Detect Device GPS (Live Lock)</span>
                  </button>
                  <button
                    onClick={() => setEditingLoc(true)}
                    className="w-full border border-zinc-200 hover:border-zinc-900 text-zinc-700 hover:text-zinc-900 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition bg-white shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Manually Calibrate Pins</span>
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-xs text-indigo-950 space-y-1">
                <span className="font-bold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                  Haversine Auto-Match
                </span>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  The dispatcher matches you with pickups nearest to these coordinates. Keep GPS updated to claim nearby tasks.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Queue & Status Workflow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2.5">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-zinc-900">Active Task Queue ({orders.length})</h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Live Manifest</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-y border-zinc-100">
                  <tr>
                    <th className="py-3 px-3">Manifest ID</th>
                    <th className="py-3 px-3">Recipient</th>
                    <th className="py-3 px-3">Pickup</th>
                    <th className="py-3 px-3">Dropoff</th>
                    <th className="py-3 px-3">Stage</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700 font-medium">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400">
                        <Inbox className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                        <p className="font-bold text-zinc-600 text-xs">No parcels assigned in your sector</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Toggle duty to "Available" to get automatically assigned.</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-zinc-900">
                          #{o.id.split('-')[0]}
                        </td>
                        <td className="py-3 px-3 font-semibold text-zinc-900">{o.customer.name}</td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-zinc-800">{o.pickupArea.name}</span>
                          <span className="text-[10px] text-zinc-400 block font-mono">{o.pickupArea.postalCode}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-zinc-800">{o.dropArea.name}</span>
                          <span className="text-[10px] text-zinc-400 block font-mono">{o.dropArea.postalCode}</span>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setNewStatus(o.status);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-900 hover:text-white transition"
                          >
                            <span>Open Task</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Status Updater Drawer/Card */}
          {selectedOrder && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-zinc-900">
                    Handover Status: Order #{selectedOrder.id.split('-')[0]}
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Waybill Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 bg-zinc-50 p-4 rounded-xl border border-zinc-200/70">
                <div className="space-y-1.5">
                  <p>
                    <strong className="text-zinc-900">Consignee:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.email})
                  </p>
                  <p>
                    <strong className="text-zinc-900">Pickup Origin:</strong> {selectedOrder.pickupAddress} ({selectedOrder.pickupArea.name})
                  </p>
                  <p>
                    <strong className="text-zinc-900">Destination:</strong> {selectedOrder.dropAddress} ({selectedOrder.dropArea.name})
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p>
                    <strong className="text-zinc-900">Terms:</strong> {selectedOrder.paymentType}
                  </p>
                  <p>
                    <strong className="text-zinc-900">Billable Charge:</strong>{' '}
                    <span className="font-mono font-bold text-zinc-900">₹{selectedOrder.totalCharge.toFixed(2)}</span>
                  </p>
                  <p>
                    <strong className="text-zinc-900">Dimensions:</strong> {selectedOrder.length}×{selectedOrder.width}×{selectedOrder.height} cm ({selectedOrder.actualWeight} kg)
                  </p>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleStatusUpdate} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Progress Journey Stage
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium text-zinc-900"
                    >
                      <option value="ASSIGNED">Assigned (Awaiting Pickup)</option>
                      <option value="PICKED_UP">Picked Up (In Hand)</option>
                      <option value="IN_TRANSIT">In Transit (Cross-Dock)</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery (Last Mile)</option>
                      <option value="DELIVERED">Delivered (Successful Completion)</option>
                      <option value="FAILED">Failed Attempt (Receiver Unreachable)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Timeline Note / Handover Description
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        newStatus === 'FAILED'
                          ? 'Specify reason, e.g. Customer unavailable at door'
                          : 'e.g. Package collected from warehouse counter'
                      }
                      required={newStatus === 'FAILED'}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                {newStatus === 'FAILED' && (
                  <div className="flex items-center space-x-2 text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>
                      Notice: Logging as FAILED triggers an automated alert for the customer to reschedule. Your profile will be marked available for other orders.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-900 text-white py-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-zinc-800 transition shadow-sm flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Transmitting Telemetry Update...' : 'Commit Status Milestone'}</span>
                  {!loading && <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
