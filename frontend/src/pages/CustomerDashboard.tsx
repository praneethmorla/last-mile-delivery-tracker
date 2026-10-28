import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Package,
  PackagePlus,
  Calculator,
  Compass,
  CheckCircle2,
  Truck,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Coins,
  Boxes,
  ArrowRight,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  MapPin,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

interface Area {
  id: string;
  postalCode: string;
  name: string;
  zone: { id: string; name: string };
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
  orderType: 'B2B' | 'B2C';
  paymentType: 'PREPAID' | 'COD';
  deliveryCharge: number;
  codSurcharge: number;
  totalCharge: number;
  status: string;
  agent?: { user: { name: string } };
  rescheduleDate?: string;
  rescheduleAttempts: number;
  createdAt: string;
}

interface TimelineItem {
  id: string;
  status: string;
  actorRole: string;
  actor?: { name: string };
  notes: string;
  timestamp: string;
}

export default function CustomerDashboard() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State derived from route path
  const isHistory = location.pathname.includes('/history');
  const activeSubTab: 'booking' | 'history' = isHistory ? 'history' : 'booking';

  const setActiveSubTab = (tab: 'booking' | 'history') => {
    navigate(tab === 'history' ? '/customer/history' : '/customer/booking');
  };

  // Master Data State
  const [areas, setAreas] = useState<Area[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  // Inline Notification State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupAreaId, setPickupAreaId] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropAreaId, setDropAreaId] = useState('');
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [actualWeight, setActualWeight] = useState(1);
  const [orderType, setOrderType] = useState<'B2B' | 'B2C'>('B2C');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');

  // Preview State
  const [pricingPreview, setPricingPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Areas and Orders on Load
  useEffect(() => {
    fetchAreas();
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

  const fetchAreas = async () => {
    try {
      const res = await fetch('/api/customer/areas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAreas(data);
      if (data.length > 0) {
        setPickupAreaId(data[0].id);
        setDropAreaId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/customer/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/customer/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSelectedOrder(data);
      setTimeline(data.timelines || []);
      setRescheduleSuccess('');
      setRescheduleError('');
      setRescheduleDate('');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePreviewPrice = async () => {
    setPreviewError('');
    try {
      const res = await fetch('/api/customer/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupAreaId,
          dropAreaId,
          length,
          width,
          height,
          actualWeight,
          orderType,
          paymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed.');
      setPricingPreview(data);
    } catch (err: any) {
      setPreviewError(err.message);
      setPricingPreview(null);
    }
  };

  useEffect(() => {
    if (pickupAreaId && dropAreaId) {
      handlePreviewPrice();
    }
  }, [pickupAreaId, dropAreaId, length, width, height, actualWeight, orderType, paymentType]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingPreview) return;
    setBookingLoading(true);

    try {
      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupAddress,
          pickupAreaId,
          dropAddress,
          dropAreaId,
          length,
          width,
          height,
          actualWeight,
          orderType,
          paymentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed.');

      setPickupAddress('');
      setDropAddress('');
      setPricingPreview(null);
      await fetchOrders();
      
      if (data.id) {
        fetchOrderDetails(data.id);
      }
      
      setActiveSubTab('history');
      showSuccess('Shipment created successfully! Courier agent dispatched.');
    } catch (err: any) {
      showError(err.message || 'Failed to place order.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedOrder || !rescheduleDate) return;
    setRescheduleError('');
    setRescheduleSuccess('');

    try {
      const res = await fetch(`/api/customer/orders/${selectedOrder.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rescheduleDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reschedule failed.');

      setRescheduleSuccess('Order rescheduled! New agent auto-assignment triggered.');
      fetchOrderDetails(selectedOrder.id);
      fetchOrders();
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule order.');
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

  const totalCost = orders.reduce((sum, o) => sum + o.totalCharge, 0);
  const activeCount = orders.filter((o) => ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const completedCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.pickupArea.name.toLowerCase().includes(q) ||
      o.dropArea.name.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Notifications */}
      {successMsg && (
        <div className="bg-emerald-50/80 text-emerald-800 px-4 py-3 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center animate-fadeIn shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50/80 text-rose-800 px-4 py-3 rounded-xl border border-rose-200 text-xs font-semibold flex items-center animate-fadeIn shadow-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600 mr-2 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Responsive Grid: Dedicated Left Side Navigation & Right Side Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Navigation & Snapshot Metrics */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-20">
          {/* 1. Primary Left Navigation Menu */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Customer Actions</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                Portal
              </span>
            </div>

            <div className="p-2 space-y-1.5">
              {/* Left Action: Place Order */}
              <button
                type="button"
                onClick={() => setActiveSubTab('booking')}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center space-x-3 group ${
                  activeSubTab === 'booking'
                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/15'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                    activeSubTab === 'booking'
                      ? 'bg-zinc-800 text-indigo-400'
                      : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200/70 group-hover:text-zinc-900'
                  }`}
                >
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-tight">Place Order</span>
                    {activeSubTab === 'booking' && (
                      <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 rounded border border-indigo-400/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      activeSubTab === 'booking' ? 'text-zinc-400' : 'text-zinc-400'
                    }`}
                  >
                    New booking & dispatch
                  </p>
                </div>
              </button>

              {/* Left Action: Order History */}
              <button
                type="button"
                onClick={() => setActiveSubTab('history')}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center space-x-3 group ${
                  activeSubTab === 'history'
                    ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/15'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                    activeSubTab === 'history'
                      ? 'bg-zinc-800 text-indigo-400'
                      : 'bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200/70 group-hover:text-zinc-900'
                  }`}
                >
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-tight">Order History</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        activeSubTab === 'history'
                          ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                          : 'bg-zinc-200/80 text-zinc-700'
                      }`}
                    >
                      {orders.length}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      activeSubTab === 'history' ? 'text-zinc-400' : 'text-zinc-400'
                    }`}
                  >
                    Track status & audit logs
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Left Snapshot Analytics */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block px-0.5">
              Account Overview
            </span>

            <div className="p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Logistics Spend</span>
                <span className="text-base font-extrabold text-zinc-900 font-mono tracking-tight">
                  ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                <div className="flex items-center justify-between text-zinc-400 mb-0.5">
                  <span className="text-[10px] font-bold uppercase">Active</span>
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-black text-zinc-900">{activeCount}</span>
                  <span className="text-[9px] text-amber-600 font-medium">on route</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
                <div className="flex items-center justify-between text-zinc-400 mb-0.5">
                  <span className="text-[10px] font-bold uppercase">Delivered</span>
                  <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-black text-zinc-900">{completedCount}</span>
                  <span className="text-[9px] text-emerald-600 font-medium">verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Left System Heuristics Note */}
          <div className="p-4 rounded-2xl bg-zinc-900 text-white shadow-sm space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-tight">Autonomous Dispatch</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Consignments are automatically evaluated via <span className="text-indigo-300 font-mono text-[10px]">(L×W×H)/5000</span> and assigned to the nearest courier agent by proximity heuristics.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Workspace (Place Order or Order History) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6 min-w-0">
          {/* Workspace Title Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                  {activeSubTab === 'booking' ? 'Place Consignment Order' : 'Order History & Audit Ledger'}
                </h1>
                <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200 font-bold uppercase">
                  {activeSubTab === 'booking' ? 'New Dispatch' : 'Immutable Records'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                {activeSubTab === 'booking'
                  ? 'Configure origin, destination, cargo metrics, and auto-dispatch the nearest courier agent.'
                  : 'Inspect live tracking statuses, delivery waypoints, courier assignments, and reschedule if required.'}
              </p>
            </div>

            {activeSubTab === 'history' ? (
              <button
                type="button"
                onClick={() => setActiveSubTab('booking')}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 shadow-sm transition"
              >
                <PackagePlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Place New Order</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveSubTab('history')}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 transition"
              >
                <History className="w-3.5 h-3.5 text-zinc-500" />
                <span>View History ({orders.length})</span>
              </button>
            )}
          </div>

      {/* ==================================================== */}
      {/* 3. CREATE BOOKING VIEW */}
      {/* ==================================================== */}
      {activeSubTab === 'booking' && (
        <div className="w-full bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 animate-fadeIn">
          <div className="flex items-center space-x-3 pb-5 mb-6 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Package className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Consignment Specifications</h2>
              <p className="text-xs text-zinc-400">Fill in the dispatch route and cargo metrics for automated price discovery.</p>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {/* Step 1: Route Coordinates */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                1. Routing & Hub Assignment
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Area */}
                <div className="p-4 rounded-xl bg-zinc-50/60 border border-zinc-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800">Origin / Pickup Point</label>
                    <span className="text-[10px] font-mono text-zinc-400">From</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-medium mb-1">Postal Hub</label>
                    <select
                      value={pickupAreaId}
                      onChange={(e) => setPickupAreaId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium text-zinc-800"
                    >
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.postalCode} — {a.name} ({a.zone.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="e.g. Unit 402, Trade Tower, Connaught Pl"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                {/* Drop Area */}
                <div className="p-4 rounded-xl bg-zinc-50/60 border border-zinc-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800">Destination / Drop Point</label>
                    <span className="text-[10px] font-mono text-zinc-400">To</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-medium mb-1">Postal Hub</label>
                    <select
                      value={dropAreaId}
                      onChange={(e) => setDropAreaId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium text-zinc-800"
                    >
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.postalCode} — {a.name} ({a.zone.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-500 font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={dropAddress}
                      onChange={(e) => setDropAddress(e.target.value)}
                      placeholder="e.g. 77 Green Park Lane, Indiranagar"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Dimensions & Metrics */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                2. Cargo Dimensions & Mass
              </span>

              <div className="p-4 rounded-xl bg-zinc-50/60 border border-zinc-200/70 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Width (cm)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Actual Mass (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={actualWeight}
                      onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Service Tier</label>
                    <select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value as 'B2B' | 'B2C')}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium"
                    >
                      <option value="B2C">B2C Retail Dispatch</option>
                      <option value="B2B">B2B Commercial Freight</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Payment Method</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as 'PREPAID' | 'COD')}
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium"
                    >
                      <option value="PREPAID">Prepaid Account</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Live Rate Quote Breakdown */}
            <div className="p-5 rounded-2xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold tracking-tight">Algorithmic Rate Calculation</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  Divisor 5000
                </span>
              </div>

              {previewError && (
                <p className="text-rose-400 text-xs font-semibold">{previewError}</p>
              )}

              {pricingPreview ? (
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-800/50">
                      <span className="text-zinc-400">Volumetric Wt:</span>
                      <span className="font-mono font-bold text-white">{pricingPreview.volumetricWeight.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-zinc-800/50">
                      <span className="text-zinc-400">Billable Charge Wt:</span>
                      <span className="font-mono font-bold text-white">{pricingPreview.chargeableWeight.toFixed(2)} kg</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-zinc-400">Base & distance rate:</span>
                    <span className="font-mono">₹{pricingPreview.deliveryCharge.toFixed(2)}</span>
                  </div>
                  {pricingPreview.codSurcharge > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">COD Surcharge Fee:</span>
                      <span className="font-mono text-amber-400">+₹{pricingPreview.codSurcharge.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-zinc-800 text-sm font-bold text-white">
                    <span>Total Estimated Invoice:</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      ₹{pricingPreview.totalCharge.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-2">Select origin and destination hubs above to load the live rate card.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={bookingLoading || !pricingPreview}
              className="w-full bg-zinc-900 text-white py-3.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 transition shadow-lg shadow-zinc-900/10 flex items-center justify-center space-x-2"
            >
              <span>{bookingLoading ? 'Initiating Dispatch Protocol...' : 'Confirm Shipment Booking'}</span>
              {!bookingLoading && <ArrowRight className="w-4 h-4 text-zinc-400" />}
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. ORDER HISTORY VIEW */}
      {/* ==================================================== */}
      {activeSubTab === 'history' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fadeIn">
          {/* Main Table Column */}
          <div className={`${selectedOrder ? 'xl:col-span-7' : 'xl:col-span-12'} bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-4`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-100 gap-3">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-zinc-900">Consignment Audit Ledger</h2>
              </div>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, Hub, Status..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <button
                  onClick={fetchOrders}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/80 transition"
                  title="Refresh Orders"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-y border-zinc-100">
                  <tr>
                    <th className="py-3 px-3">Order Token</th>
                    <th className="py-3 px-3">Routing (Origin → Dest)</th>
                    <th className="py-3 px-3">Tier</th>
                    <th className="py-3 px-3">Invoice</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400">
                        <Package className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                        <p className="font-bold text-zinc-600 text-xs">No consignments found</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Place a new shipment using the "Create Booking" view.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-zinc-900">
                          #{o.id.split('-')[0]}
                        </td>
                        <td className="py-3 px-3 font-semibold text-zinc-800">
                          {o.pickupArea.name} <span className="text-zinc-400 font-normal">→</span> {o.dropArea.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/50">
                            {o.orderType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold font-mono text-zinc-900">
                          ₹{o.totalCharge.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => fetchOrderDetails(o.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-900 hover:text-white transition"
                          >
                            <span>Inspect</span>
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

          {/* Active Order Details Panel */}
          {selectedOrder && (
            <div className="xl:col-span-5 bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-6 animate-fadeIn self-start">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-zinc-900 font-mono">
                    #{selectedOrder.id.split('-')[0]}
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

              {/* Waybill Card */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-2">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Waypoint Route</div>
                  <div className="space-y-1">
                    <p className="text-zinc-600">
                      <strong className="text-zinc-900">Pickup:</strong> {selectedOrder.pickupAddress} ({selectedOrder.pickupArea.name})
                    </p>
                    <p className="text-zinc-600">
                      <strong className="text-zinc-900">Drop:</strong> {selectedOrder.dropAddress} ({selectedOrder.dropArea.name})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-zinc-200/70 bg-zinc-50">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">Dimensions</span>
                    <span className="font-mono font-bold text-zinc-800">
                      {selectedOrder.length}×{selectedOrder.width}×{selectedOrder.height} cm
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-zinc-200/70 bg-zinc-50">
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">Mass</span>
                    <span className="font-mono font-bold text-zinc-800">{selectedOrder.actualWeight} kg</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200/70 bg-zinc-50 flex items-center justify-between">
                  <span className="text-zinc-500 font-semibold">Assigned Courier:</span>
                  <span className="font-bold text-zinc-900">
                    {selectedOrder.agent ? selectedOrder.agent.user.name : 'Awaiting Hub Match...'}
                  </span>
                </div>
              </div>

              {/* Reschedule Flow if status is FAILED */}
              {selectedOrder.status === 'FAILED' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Attempt Unsuccessful</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    The delivery executive was unable to complete handover. Please select a reschedule date to trigger auto-reassignment.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={handleReschedule}
                      disabled={!rescheduleDate}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs transition"
                    >
                      Authorize Reschedule
                    </button>
                  </div>
                  {rescheduleSuccess && <p className="text-emerald-700 font-semibold text-[11px]">{rescheduleSuccess}</p>}
                  {rescheduleError && <p className="text-rose-700 font-semibold text-[11px]">{rescheduleError}</p>}
                </div>
              )}

              {/* Immutable Timeline */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-900 mb-4">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Immutable Audit Trail</span>
                </div>

                <div className="relative pl-4 space-y-4 border-l-2 border-zinc-100 ml-2">
                  {timeline.length === 0 ? (
                    <p className="text-zinc-400 text-xs">Awaiting log entries...</p>
                  ) : (
                    timeline.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white ring-2 ring-zinc-100"></div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-zinc-900 uppercase tracking-wide">{item.status}</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{item.notes}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
