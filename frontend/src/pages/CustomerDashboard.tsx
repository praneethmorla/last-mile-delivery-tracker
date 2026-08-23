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
  Info
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

  // State
  const [areas, setAreas] = useState<Area[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

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

      // Reset form & update orders
      setPickupAddress('');
      setDropAddress('');
      setPricingPreview(null);
      fetchOrders();
      alert('Order placed and processed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
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

  // Helpers for formatting
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
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Customer Dashboard</h1>
        <p className="text-gray-500 mt-1">Book new deliveries and track active packages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Book Order Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-6 border-b border-gray-100 pb-3">
            <Package className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-800">Book New Delivery</h2>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            
            {/* Pickup details */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Pickup Address</label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="123 Alpha Road, Apartment 4B"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Pickup Area (Postal Code)</label>
              <select
                value={pickupAreaId}
                onChange={(e) => setPickupAreaId(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.postalCode} - {a.name} ({a.zone.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Drop details */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Drop Address</label>
              <input
                type="text"
                required
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                placeholder="456 Omega Street, Office 12"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Drop Area (Postal Code)</label>
              <select
                value={dropAreaId}
                onChange={(e) => setDropAreaId(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.postalCode} - {a.name} ({a.zone.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Package stats */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Width (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Actual Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={actualWeight}
                  onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as 'B2B' | 'B2C')}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="B2C">B2C (Retail)</option>
                  <option value="B2B">B2B (Business)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'PREPAID' | 'COD')}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="PREPAID">Prepaid</option>
                <option value="COD">Cash On Delivery (COD)</option>
              </select>
            </div>

            {/* LIVE RATE PREVIEW PANEL */}
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-200/60 mt-4 space-y-2">
              <div className="flex items-center space-x-1.5 text-green-800 font-bold text-sm">
                <Calculator className="h-4 w-4" />
                <span>Live Charge Calculator</span>
              </div>
              {previewError && <p className="text-red-600 text-xs">{previewError}</p>}
              {pricingPreview ? (
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div className="flex justify-between border-b border-green-100 pb-1">
                    <span>Volumetric Weight:</span>
                    <span className="font-semibold text-gray-900">{pricingPreview.volumetricWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-green-100 pb-1">
                    <span>Chargeable Weight:</span>
                    <span className="font-semibold text-gray-900">{pricingPreview.chargeableWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-green-100 pb-1">
                    <span>Delivery Charge:</span>
                    <span className="font-semibold text-gray-900">₹{pricingPreview.deliveryCharge.toFixed(2)}</span>
                  </div>
                  {pricingPreview.codSurcharge > 0 && (
                    <div className="flex justify-between border-b border-green-100 pb-1">
                      <span>COD Surcharge:</span>
                      <span className="font-semibold text-gray-900">₹{pricingPreview.codSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-green-900 pt-1.5">
                    <span>Total Charge:</span>
                    <span>₹{pricingPreview.totalCharge.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs">Enter address details to fetch live preview estimate.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={bookingLoading || !pricingPreview}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow disabled:opacity-50 transition"
            >
              {bookingLoading ? 'Processing Booking...' : 'Confirm & Place Order'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Orders List & Tracking Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Orders Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-800">Your Booking History</h2>
              </div>
              <button onClick={fetchOrders} className="text-xs text-green-600 hover:underline">Refresh</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Cost</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assigned Agent</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-400">
                        No orders booked yet. Use the booking form on the left.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-mono text-xs">{o.id.split('-')[0]}</td>
                        <td className="py-3 px-3">
                          {o.pickupArea.name} → {o.dropArea.name}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900">₹{o.totalCharge.toFixed(2)}</td>
                        <td className="py-3 px-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 px-3 text-gray-500 text-xs">
                          {o.agent ? o.agent.user.name : <em className="text-gray-400">Unassigned</em>}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => fetchOrderDetails(o.id)}
                            className="bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 px-2 py-1 rounded flex items-center inline-flex space-x-1 transition text-xs font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Track</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active tracking detail & timeline section */}
          {selectedOrder && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              
              {/* Order Info Summary */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3">
                  Tracking Order #{selectedOrder.id.split('-')[0]}
                </h3>
                
                <div className="space-y-2.5 text-sm text-gray-700">
                  <p>
                    <strong>Route Details:</strong> <br />
                    Pickup: {selectedOrder.pickupAddress} ({selectedOrder.pickupArea.name}) <br />
                    Drop: {selectedOrder.dropAddress} ({selectedOrder.dropArea.name})
                  </p>
                  <p>
                    <strong>Package Specs:</strong> <br />
                    Dimensions: {selectedOrder.length}x{selectedOrder.width}x{selectedOrder.height} cm <br />
                    Weight: {selectedOrder.actualWeight} kg (Volumetric: {selectedOrder.volumetricWeight.toFixed(2)} kg)
                  </p>
                  <p>
                    <strong>Payment & Pricing:</strong> <br />
                    Charge: <strong>₹{selectedOrder.totalCharge.toFixed(2)}</strong> ({selectedOrder.paymentType})
                  </p>
                  <p>
                    <strong>Current status:</strong> {getStatusBadge(selectedOrder.status)}
                  </p>
                  <p>
                    <strong>Assigned Agent:</strong> {selectedOrder.agent ? selectedOrder.agent.user.name : 'Searching nearest agent...'}
                  </p>
                </div>

                {/* Reschedule Section on Delivery FAILED */}
                {selectedOrder.status === 'FAILED' && (
                  <div className="mt-5 p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
                    <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span>Delivery Failed. Action Required!</span>
                    </div>
                    <p className="text-xs text-red-700 font-medium">
                      The package could not be delivered. Please select a rescheduled delivery date. We will re-assign a fresh available agent.
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-grow">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="pl-9 pr-3 py-1.5 w-full border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <button
                        onClick={handleReschedule}
                        disabled={!rescheduleDate}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow"
                      >
                        Reschedule
                      </button>
                    </div>
                    {rescheduleSuccess && <p className="text-green-700 text-xs font-semibold mt-1">{rescheduleSuccess}</p>}
                    {rescheduleError && <p className="text-red-700 text-xs font-semibold mt-1">{rescheduleError}</p>}
                  </div>
                )}
              </div>

              {/* Immutable Status Timeline */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3 flex items-center space-x-1.5">
                  <Compass className="h-5 w-5 text-green-600" />
                  <span>Tracking Timeline</span>
                </h3>

                <div className="relative border-l-2 border-green-200 pl-4 ml-2 space-y-4 text-sm">
                  {timeline.length === 0 ? (
                    <p className="text-gray-400 text-xs">Timeline log loading...</p>
                  ) : (
                    timeline.map((item) => (
                      <div key={item.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[23px] top-1 bg-white border-2 border-green-500 rounded-full h-3 w-3"></div>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                            {item.status}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 italic mt-0.5">
                          {item.notes}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Actor: {item.actor ? item.actor.name : 'SYSTEM'} ({item.actorRole})
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
