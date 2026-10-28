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
  CheckCircle2,
  TrendingUp,
  Map,
  Users,
  Coins,
  Inbox,
  Package,
  Calculator,
  X,
  Mail,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  MapPin
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
  const [activeTab, setActiveTab] = useState<'orders' | 'zones' | 'rates' | 'agents' | 'book'>('orders');

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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Admin Booking on Behalf of Customer form state
  const [bookCustomerEmail, setBookCustomerEmail] = useState('');
  const [bookPickupAddress, setBookPickupAddress] = useState('');
  const [bookPickupAreaId, setBookPickupAreaId] = useState('');
  const [bookDropAddress, setBookDropAddress] = useState('');
  const [bookDropAreaId, setBookDropAreaId] = useState('');
  const [bookLength, setBookLength] = useState(10);
  const [bookWidth, setBookWidth] = useState(10);
  const [bookHeight, setBookHeight] = useState(10);
  const [bookActualWeight, setBookActualWeight] = useState(1);
  const [bookOrderType, setBookOrderType] = useState<'B2B' | 'B2C'>('B2C');
  const [bookPaymentType, setBookPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');
  const [bookPreview, setBookPreview] = useState<any>(null);
  const [bookPreviewError, setBookPreviewError] = useState('');
  const [bookLoading, setBookLoading] = useState(false);

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
      if (data.length > 0) {
        if (!newAreaZoneId) setNewAreaZoneId(data[0].zoneId);
        if (!bookPickupAreaId) setBookPickupAreaId(data[0].id);
        if (!bookDropAreaId) setBookDropAreaId(data[0].id);
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
      showSuccess('Zone registered successfully!');
      fetchZones();
    } else {
      const d = await res.json();
      showError(d.error || 'Failed to create zone.');
    }
  };

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
      showSuccess('Postal hub mapped to zone!');
      fetchAreas();
    } else {
      const d = await res.json();
      showError(d.error || 'Failed to map area.');
    }
  };

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
      showSuccess('Rate card pricing matrix updated!');
      fetchRateCards();
    } else {
      const d = await res.json();
      showError(d.error || 'Failed to create rate card.');
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (confirm('Delete this zone? This deletes all mapped areas and rate cards!')) {
      await fetch(`/api/admin/zones/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      showSuccess('Zone deleted.');
      fetchZones();
      fetchAreas();
      fetchRateCards();
    }
  };

  const handleDeleteArea = async (id: string) => {
    await fetch(`/api/admin/areas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    showSuccess('Postal hub removed.');
    fetchAreas();
  };

  const handleDeleteRateCard = async (id: string) => {
    await fetch(`/api/admin/ratecards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    showSuccess('Rate card deleted.');
    fetchRateCards();
  };

  const handleAssignAgent = async (auto: boolean) => {
    if (!selectedOrder) return;
    const body: any = {};
    if (auto) body.auto = true;
    else {
      if (!assignAgentId) return showError('Please choose a specific agent to assign.');
      body.agentId = assignAgentId;
    }

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (res.ok) {
      showSuccess(d.message || 'Courier assigned successfully!');
    } else {
      showError(d.error || 'Failed to assign agent.');
    }
    fetchOrderDetails(selectedOrder.id);
    fetchOrders();
  };

  const handleOverrideStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !overrideStatus) return;

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/override-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: overrideStatus, notes: overrideNotes }),
    });

    if (res.ok) {
      showSuccess('Status overridden and customer/agent alerted.');
      fetchOrderDetails(selectedOrder.id);
      fetchOrders();
    } else {
      showError('Failed to override status.');
    }
  };

  const handleAdminPreviewPrice = async () => {
    if (!bookPickupAreaId || !bookDropAreaId) return;
    setBookPreviewError('');
    try {
      const res = await fetch('/api/customer/orders/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupAreaId: bookPickupAreaId,
          dropAreaId: bookDropAreaId,
          length: bookLength,
          width: bookWidth,
          height: bookHeight,
          actualWeight: bookActualWeight,
          orderType: bookOrderType,
          paymentType: bookPaymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed.');
      setBookPreview(data);
    } catch (err: any) {
      setBookPreviewError(err.message);
      setBookPreview(null);
    }
  };

  useEffect(() => {
    if (bookPickupAreaId && bookDropAreaId) {
      handleAdminPreviewPrice();
    }
  }, [bookPickupAreaId, bookDropAreaId, bookLength, bookWidth, bookHeight, bookActualWeight, bookOrderType, bookPaymentType]);

  const handleAdminPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPreview) return;
    setBookLoading(true);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerEmail: bookCustomerEmail,
          pickupAddress: bookPickupAddress,
          pickupAreaId: bookPickupAreaId,
          dropAddress: bookDropAddress,
          dropAreaId: bookDropAreaId,
          length: bookLength,
          width: bookWidth,
          height: bookHeight,
          actualWeight: bookActualWeight,
          orderType: bookOrderType,
          paymentType: bookPaymentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed.');

      setBookCustomerEmail('');
      setBookPickupAddress('');
      setBookDropAddress('');
      setBookPreview(null);
      
      showSuccess(`Consignment created on behalf of ${bookCustomerEmail}!`);
      fetchOrders();
      setActiveTab('orders');
    } catch (err: any) {
      showError(err.message || 'Failed to place order.');
    } finally {
      setBookLoading(false);
    }
  };

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

  const totalInvoice = orders.reduce((sum, o) => sum + o.totalCharge, 0);
  const activeAgents = agents.filter((a) => a.isAvailable).length;

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.pickupArea.name.toLowerCase().includes(q) ||
      o.dropArea.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. ADMIN KPI METRICS BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Billed Volume</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              ₹{totalInvoice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[10px] text-zinc-500 font-medium">Aggregated fleet revenue</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">All Shipments</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{orders.length}</h3>
            <span className="text-[10px] text-sky-600 font-medium">Live pipeline ledger</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100/80 flex items-center justify-center text-sky-600">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Available Couriers</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
              {activeAgents} <span className="text-sm font-normal text-zinc-400">/ {agents.length}</span>
            </h3>
            <span className="text-[10px] text-emerald-600 font-medium">Ready for nearest dispatch</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-sm card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Hub Sectors</span>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{zones.length}</h3>
            <span className="text-[10px] text-amber-600 font-medium">{areas.length} mapped postal hubs</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600">
            <Map className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. ADMIN HEADER & SUB-NAVIGATION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Operations Control Center</h1>
            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200 font-bold">
              SUPERADMIN
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Supervise courier allocations, override shipment stages, and manage distance rate rules.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap bg-zinc-100/80 p-1 rounded-xl border border-zinc-200/60 text-xs font-semibold gap-0.5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'orders' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All Shipments
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'book' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Create Order
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'zones' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Zones & Hubs
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'rates' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Rate Card Engine
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'agents' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Courier Fleet
          </button>
        </div>
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
          <AlertTriangle className="h-4 w-4 text-rose-600 mr-2 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. ALL SHIPMENTS TAB */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Main Table Column */}
          <div className={`${selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-4`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-zinc-100 gap-3">
              <div className="flex items-center space-x-2.5">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-zinc-900">Shipment Governance ({orders.length})</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg w-full sm:w-44 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50 text-zinc-700 font-semibold focus:outline-none"
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

                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50 text-zinc-700 font-semibold focus:outline-none"
                >
                  <option value="">All Zones</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>

                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50 text-zinc-700 font-semibold focus:outline-none"
                >
                  <option value="">All Couriers</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.user.name}</option>
                  ))}
                </select>

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
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Routing</th>
                    <th className="py-3 px-3">Charge</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Assigned Courier</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-400">
                        <Inbox className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                        <p className="font-bold text-zinc-600 text-xs">No matching consignments found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-zinc-900">
                          #{o.id.split('-')[0]}
                        </td>
                        <td className="py-3 px-3 font-semibold text-zinc-900">{o.customer.name}</td>
                        <td className="py-3 px-3">
                          <span className="text-zinc-800 font-medium">{o.pickupArea.name}</span>
                          <span className="text-zinc-400 mx-1">→</span>
                          <span className="text-zinc-800 font-medium">{o.dropArea.name}</span>
                        </td>
                        <td className="py-3 px-3 font-bold font-mono text-zinc-900">
                          ₹{o.totalCharge.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 px-3">
                          {o.agent ? (
                            <span className="font-bold text-zinc-900">{o.agent.user.name}</span>
                          ) : (
                            <span className="text-zinc-400 font-normal italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => fetchOrderDetails(o.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-900 hover:text-white transition"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Order Audit, Overrides & Reassignment */}
          {selectedOrder && (
            <div className="lg:col-span-1 bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-6 animate-fadeIn self-start">
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

              {/* Waybill summary */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-2 text-xs">
                <p>
                  <strong className="text-zinc-900">Customer:</strong> {selectedOrder.customer.name} ({selectedOrder.customer.email})
                </p>
                <p>
                  <strong className="text-zinc-900">Route:</strong> {selectedOrder.pickupAddress} → {selectedOrder.dropAddress}
                </p>
                <p>
                  <strong className="text-zinc-900">Volumetric:</strong> {selectedOrder.volumetricWeight.toFixed(2)} kg (Actual: {selectedOrder.actualWeight} kg)
                </p>
                <p>
                  <strong className="text-zinc-900">Invoice:</strong> Delivery ₹{selectedOrder.deliveryCharge.toFixed(2)} + COD ₹{selectedOrder.codSurcharge.toFixed(2)} = <span className="font-bold text-zinc-900 font-mono">₹{selectedOrder.totalCharge.toFixed(2)}</span>
                </p>
              </div>

              {/* Courier Re-assignment Block */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Courier Assignment & Dispatch
                </span>
                <div className="flex space-x-2">
                  <select
                    value={assignAgentId}
                    onChange={(e) => setAssignAgentId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
                    className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Assign
                  </button>
                </div>
                <button
                  onClick={() => handleAssignAgent(true)}
                  className="w-full border border-zinc-300 hover:border-zinc-900 text-zinc-800 text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 bg-white shadow-sm"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Execute Haversine Auto-Dispatch</span>
                </button>
              </div>

              {/* Status Override */}
              <form onSubmit={handleOverrideStatus} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Administrative Status Override
                </span>
                <div className="space-y-2">
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
                    placeholder="Log audit reason..."
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg transition shadow-sm"
                  >
                    Override Status & Notify Parties
                  </button>
                </div>
              </form>

              {/* Immutable Timeline */}
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                  Lifecycle Audit History
                </span>
                <div className="relative pl-4 space-y-3 border-l-2 border-zinc-100 ml-2 max-h-48 overflow-y-auto">
                  {selectedOrder.timelines?.map((tl: any) => (
                    <div key={tl.id} className="relative group text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white ring-2 ring-zinc-100"></div>
                      <div className="flex justify-between font-bold text-zinc-900 text-[11px]">
                        <span>{tl.status}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{new Date(tl.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-zinc-500 text-[11px] mt-0.5">{tl.notes}</p>
                      <span className="text-[9px] text-zinc-400 block font-mono">Actor: {tl.actor?.name || 'SYSTEM'} ({tl.actorRole})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Dispatch Ledger */}
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Live SMTP Notification Outbox
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto text-[11px]">
                  {selectedOrder.notifications?.length === 0 ? (
                    <p className="text-zinc-400 text-xs">No notifications recorded.</p>
                  ) : (
                    selectedOrder.notifications?.map((notif: any) => (
                      <div key={notif.id} className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1">
                        <div className="flex justify-between font-bold text-zinc-800 text-[10px]">
                          <span>{notif.type} → {notif.recipientEmail}</span>
                          <span className="text-emerald-600 font-mono uppercase">{notif.status}</span>
                        </div>
                        <p className="font-semibold text-zinc-900 text-[11px] truncate">{notif.subject}</p>
                        <p className="whitespace-pre-line text-zinc-500 text-[10px] line-clamp-2">{notif.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. CREATE ON BEHALF TAB */}
      {/* ==================================================== */}
      {activeTab === 'book' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 animate-fadeIn">
          <div className="flex items-center space-x-3 pb-5 mb-6 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Package className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Manual Enterprise Consignment Booking</h2>
              <p className="text-xs text-zinc-400">Place an order on behalf of an enterprise or retail client account.</p>
            </div>
          </div>

          <form onSubmit={handleAdminPlaceOrder} className="space-y-6">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-1.5">
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                Client Account Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={bookCustomerEmail}
                  onChange={(e) => setBookCustomerEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <p className="text-[10px] text-zinc-400">
                If the email is not yet registered, an account will be automatically provisioned for them.
              </p>
            </div>

            {/* Routing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-3">
                <label className="text-xs font-bold text-zinc-800">Origin / Pickup</label>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-medium mb-1">Postal Hub</label>
                  <select
                    value={bookPickupAreaId}
                    onChange={(e) => setBookPickupAreaId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.postalCode} — {a.name} ({a.zone.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-medium mb-1">Pickup Address</label>
                  <input
                    type="text"
                    required
                    value={bookPickupAddress}
                    onChange={(e) => setBookPickupAddress(e.target.value)}
                    placeholder="Full street address..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-3">
                <label className="text-xs font-bold text-zinc-800">Destination / Drop</label>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-medium mb-1">Postal Hub</label>
                  <select
                    value={bookDropAreaId}
                    onChange={(e) => setBookDropAreaId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.postalCode} — {a.name} ({a.zone.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-medium mb-1">Drop Address</label>
                  <input
                    type="text"
                    required
                    value={bookDropAddress}
                    onChange={(e) => setBookDropAddress(e.target.value)}
                    placeholder="Full street address..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bookLength}
                    onChange={(e) => setBookLength(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bookWidth}
                    onChange={(e) => setBookWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bookHeight}
                    onChange={(e) => setBookHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Mass (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={bookActualWeight}
                    onChange={(e) => setBookActualWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Category</label>
                  <select
                    value={bookOrderType}
                    onChange={(e) => setBookOrderType(e.target.value as 'B2B' | 'B2C')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium"
                  >
                    <option value="B2C">B2C Retail</option>
                    <option value="B2B">B2B Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Payment Method</label>
                  <select
                    value={bookPaymentType}
                    onChange={(e) => setBookPaymentType(e.target.value as 'PREPAID' | 'COD')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium"
                  >
                    <option value="PREPAID">Prepaid</option>
                    <option value="COD">Cash On Delivery</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-4 rounded-xl bg-zinc-900 text-white space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Rate Discovery:</span>
                <span className="text-emerald-400 font-mono font-bold text-base">
                  {bookPreview ? `₹${bookPreview.totalCharge.toFixed(2)}` : 'Awaiting parameters...'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={bookLoading || !bookPreview || !bookCustomerEmail}
              className="w-full bg-zinc-900 text-white py-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-zinc-800 disabled:opacity-50 transition shadow-sm"
            >
              {bookLoading ? 'Authorizing Dispatch...' : 'Confirm Admin Booking'}
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. ZONES & AREAS TAB */}
      {/* ==================================================== */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Zones */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <Map className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-zinc-900">Operating Zones ({zones.length})</h2>
              </div>
            </div>

            <form onSubmit={handleCreateZone} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Zone Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zone South"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Zone specifications..."
                    value={newZoneDesc}
                    onChange={(e) => setNewZoneDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white font-bold py-1.5 rounded-lg text-xs hover:bg-zinc-800 transition"
              >
                Register Operational Zone
              </button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {zones.map((z) => (
                <div key={z.id} className="flex justify-between items-center p-3 rounded-xl border border-zinc-200/70 hover:bg-zinc-50 transition text-xs">
                  <div>
                    <h4 className="font-bold text-zinc-900">{z.name}</h4>
                    <p className="text-zinc-500 text-[11px]">{z.description || 'No description'}</p>
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                      {z._count?.areas || 0} Areas Linked &bull; {z._count?.agentProfiles || 0} Assigned Couriers
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteZone(z.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Postal Areas Mapping */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-zinc-900">Pin Hubs to Zones ({areas.length})</h2>
              </div>
            </div>

            <form onSubmit={handleCreateArea} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 110001"
                    value={newAreaPostal}
                    onChange={(e) => setNewAreaPostal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Hub Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Connaught Place"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Linked Zone</label>
                  <select
                    value={newAreaZoneId}
                    onChange={(e) => setNewAreaZoneId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white font-bold py-1.5 rounded-lg text-xs hover:bg-zinc-800 transition"
              >
                Map Hub to Zone
              </button>
            </form>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-y border-zinc-100">
                  <tr>
                    <th className="py-2.5 px-3">Postal Code</th>
                    <th className="py-2.5 px-3">Hub Name</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {areas.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">{a.postalCode}</td>
                      <td className="py-2.5 px-3 font-medium text-zinc-800">{a.name}</td>
                      <td className="py-2.5 px-3 text-zinc-500">{a.zone.name}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteArea(a.id)}
                          className="text-zinc-400 hover:text-rose-600 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
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
      {/* 6. RATE CARDS MATRIX TAB */}
      {/* ==================================================== */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Configurable Dynamic Rate Matrix</h2>
              <p className="text-xs text-zinc-400">Configure base rate, weight tier multipliers, and COD surcharge per sector pairing.</p>
            </div>
          </div>

          <form onSubmit={handleCreateRateCard} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">From Zone</label>
                <select
                  value={newRcFromZone}
                  onChange={(e) => setNewRcFromZone(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">To Zone</label>
                <select
                  value={newRcToZone}
                  onChange={(e) => setNewRcToZone(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Order Type</label>
                <select
                  value={newRcType}
                  onChange={(e) => setNewRcType(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none"
                >
                  <option value="B2C">B2C Retail</option>
                  <option value="B2B">B2B Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Base Rate (₹)</label>
                <input
                  type="number"
                  required
                  value={newRcBase}
                  onChange={(e) => setNewRcBase(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rate / Kg (₹)</label>
                <input
                  type="number"
                  required
                  value={newRcPerKg}
                  onChange={(e) => setNewRcPerKg(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">COD Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={newRcCod}
                  onChange={(e) => setNewRcCod(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-zinc-900 text-white font-bold py-1.5 rounded-lg text-xs hover:bg-zinc-800 transition"
            >
              Commit Pricing Route Rule
            </button>
          </form>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-y border-zinc-100">
                <tr>
                  <th className="py-2.5 px-3">Pickup Zone</th>
                  <th className="py-2.5 px-3">Drop Zone</th>
                  <th className="py-2.5 px-3">Route Category</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Base Rate</th>
                  <th className="py-2.5 px-3">Rate / Kg</th>
                  <th className="py-2.5 px-3">COD Fee</th>
                  <th className="py-2.5 px-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {rateCards.map((rc) => {
                  const isIntra = rc.fromZoneId === rc.toZoneId;
                  return (
                    <tr key={rc.id} className="hover:bg-zinc-50/50">
                      <td className="py-2.5 px-3 font-semibold text-zinc-800">{rc.fromZone.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-800">{rc.toZone.name}</td>
                      <td className="py-2.5 px-3">
                        {isIntra ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            Intra-Zone
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-bold text-[10px]">
                            Inter-Zone
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-zinc-900">{rc.orderType}</td>
                      <td className="py-2.5 px-3 font-mono font-medium">₹{rc.baseCharge.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono font-medium">₹{rc.ratePerKg.toFixed(2)} / kg</td>
                      <td className="py-2.5 px-3 font-mono font-medium">₹{rc.codSurcharge.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteRateCard(rc.id)}
                          className="text-zinc-400 hover:text-rose-600 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
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
      {/* 7. COURIER FLEET TAB */}
      {/* ==================================================== */}
      {activeTab === 'agents' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Courier Fleet Registry & Telemetry ({agents.length})</h2>
              <p className="text-xs text-zinc-400">Real-time GPS coordinate telemetry and duty availability state.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-y border-zinc-100">
                <tr>
                  <th className="py-3 px-3">Agent Name</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Linked Sector</th>
                  <th className="py-3 px-3">Live Telemetry (Lat, Lng)</th>
                  <th className="py-3 px-3 text-center">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700 font-medium">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-3 font-bold text-zinc-900">{ag.user.name}</td>
                    <td className="py-3 px-3 text-zinc-500">{ag.user.email}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-800">{ag.currentZone?.name || 'Unassigned'}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-600">
                      {ag.currentLat !== null && ag.currentLng !== null 
                        ? `${ag.currentLat?.toFixed(4)}, ${ag.currentLng?.toFixed(4)}`
                        : 'Calibrating GPS...'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ag.isAvailable ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-1.5"></span>
                          Busy / Off Duty
                        </span>
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
