import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import {
  Package,
  Calculator,
  Compass,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  Calendar,
  XCircle,
  Eye,
  Info,
  History,
  FileSpreadsheet
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

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<'booking' | 'history'>('booking');

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

  // Re-run preview automatically on input change
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

      // Reset form fields
      setPickupAddress('');
      setDropAddress('');
      setPricingPreview(null);
      
      // Update orders
      await fetchOrders();
      
      // Select the newly placed order to show tracking
      if (data.id) {
        fetchOrderDetails(data.id);
      }
      
      // Switch tab to History
      setActiveSubTab('history');
      showSuccess('Order placed successfully! Redirecting you to the tracking page.');
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

      setRescheduleSuccess('Order rescheduled successfully and a new agent is being assigned!');
      fetchOrderDetails(selectedOrder.id);
      fetchOrders();
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule order.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Pending</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Assigned</span>;
      case 'PICKED_UP':
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">Picked Up</span>;
      case 'IN_TRANSIT':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">In Transit</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Delivered</span>;
      case 'FAILED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Place delivery orders and trace active shipments.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 p-1 rounded-lg border text-sm font-semibold">
          <button
            onClick={() => setActiveSubTab('booking')}
            className={`px-5 py-2 rounded-md transition flex items-center space-x-1.5 ${
              activeSubTab === 'booking' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Book Delivery</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-5 py-2 rounded-md transition flex items-center space-x-1.5 ${
              activeSubTab === 'history' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Delivery History</span>
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
      {/* BOOKING TAB CONTENT */}
      {/* ==================================================== */}
      {activeSubTab === 'booking' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2.5 mb-6 border-b border-gray-100 pb-3">
            <Package className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">New Shipment Booking</h2>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pickup details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">1. Pickup Information</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pickup Address</label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="E.g., 123 Alpha Road, Apartment 4B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pickup Area (Postal Code)</label>
                  <select
                    value={pickupAreaId}
                    onChange={(e) => setPickupAreaId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.postalCode} - {a.name} ({a.zone.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drop details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">2. Drop Information</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Drop Address</label>
                  <input
                    type="text"
                    required
                    value={dropAddress}
                    onChange={(e) => setDropAddress(e.target.value)}
                    placeholder="E.g., 456 Omega Street, Office 12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Drop Area (Postal Code)</label>
                  <select
                    value={dropAreaId}
                    onChange={(e) => setDropAreaId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.postalCode} - {a.name} ({a.zone.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Package stats */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">3. Package Statistics</h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={actualWeight}
                    onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Order Category</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as 'B2B' | 'B2C')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="B2C">B2C (Retail)</option>
                    <option value="B2B">B2B (Enterprise)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as 'PREPAID' | 'COD')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="PREPAID">Prepaid</option>
                    <option value="COD">Cash On Delivery (COD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* LIVE RATE PREVIEW PANEL */}
            <div className="bg-green-50 border border-green-200 p-5 rounded-xl space-y-3">
              <div className="flex items-center space-x-1.5 text-green-800 font-bold text-sm">
                <Calculator className="h-5 w-5 text-green-600" />
                <span>Live Calculated Charge Breakdown</span>
              </div>
              {previewError && <p className="text-red-600 text-xs font-semibold">{previewError}</p>}
              {pricingPreview ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-700 border-t border-green-200/60 pt-2.5">
                  <div className="flex justify-between">
                    <span>Volumetric Weight:</span>
                    <strong className="text-gray-900">{pricingPreview.volumetricWeight.toFixed(2)} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Chargeable Weight:</span>
                    <strong className="text-gray-900">{pricingPreview.chargeableWeight.toFixed(2)} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Route base & rate charge:</span>
                    <strong className="text-gray-900">₹{pricingPreview.deliveryCharge.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>COD Fee:</span>
                    <strong className="text-gray-900">₹{pricingPreview.codSurcharge.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between col-span-2 text-sm font-bold text-green-900 border-t border-green-200 pt-2">
                    <span>Total Billable Cost:</span>
                    <span>₹{pricingPreview.totalCharge.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">Fill out pickup and destination zones to estimate charges.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={bookingLoading || !pricingPreview}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 transition"
            >
              {bookingLoading ? 'Processing Booking...' : 'Confirm Shipment Booking'}
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* HISTORY TAB CONTENT */}
      {/* ==================================================== */}
      {activeSubTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* History List Table */}
          <div className={`${selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4`}>
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-800 font-sans">Booking History Log</h2>
              </div>
              <button
                onClick={fetchOrders}
                className="text-xs text-green-600 font-bold hover:underline"
              >
                Refresh Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Pickup → Destination</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Cost</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400">
                        You haven't placed any orders yet. Go to the "Book Delivery" tab.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">
                          {o.id.split('-')[0]}
                        </td>
                        <td className="py-3 px-3">
                          {o.pickupArea.name} → {o.dropArea.name}
                        </td>
                        <td className="py-3 px-3 uppercase text-gray-500 font-medium">
                          {o.orderType}
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900">
                          ₹{o.totalCharge.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => fetchOrderDetails(o.id)}
                            className="bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 px-2 py-1 rounded font-bold text-[10px] inline-flex items-center space-x-1.5 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Track Package</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Tracker details side panel */}
          {selectedOrder && (
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 animate-fadeIn">
              
              <div>
                <h3 className="text-base font-extrabold text-gray-800 border-b pb-2 mb-3 flex justify-between items-center">
                  <span>Track Order #{selectedOrder.id.split('-')[0]}</span>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                  >
                    Close
                  </button>
                </h3>

                <div className="space-y-2.5 text-xs text-gray-700 leading-relaxed">
                  <p>
                    <strong>Addresses:</strong> <br />
                    Pickup: {selectedOrder.pickupAddress} ({selectedOrder.pickupArea.name}) <br />
                    Drop: {selectedOrder.dropAddress} ({selectedOrder.dropArea.name})
                  </p>
                  <p>
                    <strong>Measurements:</strong> <br />
                    Dimensions: {selectedOrder.length}x{selectedOrder.width}x{selectedOrder.height} cm <br />
                    Weight: {selectedOrder.actualWeight} kg (Volumetric: {selectedOrder.volumetricWeight.toFixed(2)} kg)
                  </p>
                  <p>
                    <strong>Cost breakdown:</strong> <br />
                    Charge: <strong>₹{selectedOrder.totalCharge.toFixed(2)}</strong> ({selectedOrder.paymentType})
                  </p>
                  <p>
                    <strong>Current status:</strong> {getStatusBadge(selectedOrder.status)}
                  </p>
                  <p>
                    <strong>Courier executive:</strong>{' '}
                    <span className="font-semibold text-gray-900">
                      {selectedOrder.agent ? selectedOrder.agent.user.name : 'Awaiting assignment...'}
                    </span>
                  </p>
                </div>

                {/* Reschedule trigger form on FAILED */}
                {selectedOrder.status === 'FAILED' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span>Delivery Failed</span>
                    </div>
                    <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                      We were unable to complete the delivery attempt. Please schedule a new delivery date. We will assign a fresh available agent.
                    </p>
                    <div className="flex flex-col space-y-2">
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                      <button
                        onClick={handleReschedule}
                        disabled={!rescheduleDate}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-lg text-xs transition shadow"
                      >
                        Reschedule attempt
                      </button>
                    </div>
                    {rescheduleSuccess && <p className="text-green-700 text-xs font-semibold">{rescheduleSuccess}</p>}
                    {rescheduleError && <p className="text-red-700 text-xs font-semibold">{rescheduleError}</p>}
                  </div>
                )}
              </div>

              {/* Timeline Audits */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center space-x-1.5">
                  <Compass className="h-4 w-4 text-green-600" />
                  <span>Delivery Journey Stages</span>
                </h4>
                <div className="relative border-l pl-3 ml-1.5 space-y-4 text-xs">
                  {timeline.length === 0 ? (
                    <p className="text-gray-400">Loading timeline stages...</p>
                  ) : (
                    timeline.map((item) => (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[18px] top-1 bg-white border border-green-600 rounded-full h-2 w-2"></div>
                        <div className="flex justify-between font-bold text-gray-900 text-[10px]">
                          <span>{item.status}</span>
                          <span className="text-gray-400 font-normal">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-500 italic mt-0.5 text-[11px]">{item.notes}</p>
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
  );
}
