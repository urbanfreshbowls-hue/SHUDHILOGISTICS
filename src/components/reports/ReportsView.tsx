import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CITIES } from '../../constants/network';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { bookings, agents, partners, settlements } = useApp();
  const [selectedCity, setSelectedCity] = useState('ALL');

  const filteredBookings = bookings.filter(b => {
    if (selectedCity !== 'ALL' && b.originCity !== selectedCity && b.destCity !== selectedCity) return false;
    return true;
  });

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 15 Standard Reports Definitions
  const reportsList = [
    {
      id: 'rep-1',
      title: '1. Daily Consignment Booking Report',
      description: 'Comprehensive day-by-day record of all consignments booked across the network.',
      category: 'Operations',
      onDownload: () => {
        const headers = ['Booking ID', 'Date', 'Source', 'Agent', 'Origin', 'Destination', 'Weight (kg)', 'Status', 'Customer Payable (₹)'];
        const rows = filteredBookings.map(b => [b.id, b.date, b.source, b.agentId, b.originCity, b.destCity, b.shipment.weightKg, b.status, b.commercial.totalCustomerPayable]);
        downloadCSV('shudhi_daily_bookings', headers, rows);
      }
    },
    {
      id: 'rep-2',
      title: '2. City-Wise Logistics Traffic Report',
      description: 'Volume and weight statistics segmented by originating and destination hub cities.',
      category: 'Operations',
      onDownload: () => {
        const headers = ['City Hub', 'Outbound Parcels', 'Inbound Parcels', 'Total Cargo Weight (kg)', 'Delivered Shipments'];
        const rows = CITIES.map(c => [
          c,
          filteredBookings.filter(b => b.originCity === c).length,
          filteredBookings.filter(b => b.destCity === c).length,
          filteredBookings.filter(b => b.originCity === c).reduce((sum, b) => sum + b.shipment.weightKg, 0),
          filteredBookings.filter(b => b.destCity === c && b.status === 'DELIVERED').length
        ]);
        downloadCSV('shudhi_city_traffic', headers, rows);
      }
    },
    {
      id: 'rep-3',
      title: '3. Regional Sub-Agent Performance Report',
      description: 'Breakdown of bookings, revenue, and delivery rates across all 13 sub-agents.',
      category: 'Agents',
      onDownload: () => {
        const headers = ['Agent ID', 'Agency Name', 'City', 'Total Bookings', 'Total Billed (₹)', 'Earned Margin (₹)', 'Delivered Ratio (%)'];
        const rows = agents.map(a => {
          const myB = filteredBookings.filter(b => b.agentId === a.id);
          const totalVal = myB.reduce((sum, b) => sum + b.commercial.totalCustomerPayable, 0);
          const earned = myB.reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);
          const deliv = myB.filter(b => b.status === 'DELIVERED').length;
          return [a.id, `"${a.name}"`, a.city, myB.length, totalVal, earned, myB.length ? Math.round((deliv / myB.length) * 100) : 0];
        });
        downloadCSV('shudhi_subagent_performance', headers, rows);
      }
    },
    {
      id: 'rep-4',
      title: '4. First-Mile Pickup Operations Audit',
      description: 'Pickup completion times, assigned partners, and photographic verification status.',
      category: 'Field',
      onDownload: () => {
        const headers = ['Booking ID', 'City', 'Sender', 'Sender Mobile', 'Assigned Partner', 'Pickup Status', 'Proof Photo Attached'];
        const rows = filteredBookings.filter(b => b.status.includes('PICKUP') || b.pickupProof).map(b => [
          b.id, b.originCity, `"${b.sender.name}"`, b.sender.mobile, b.assignedPickupPartnerId || 'N/A', b.status, b.pickupProof ? 'YES' : 'NO'
        ]);
        downloadCSV('shudhi_first_mile_operations', headers, rows);
      }
    },
    {
      id: 'rep-5',
      title: '5. Last-Mile Door Delivery Report',
      description: 'Door delivery execution, consignee confirmation, COD cash receipts, and POD status.',
      category: 'Field',
      onDownload: () => {
        const headers = ['Booking ID', 'City', 'Consignee', 'Mobile', 'Partner', 'COD Due (₹)', 'Status', 'POD Attached'];
        const rows = filteredBookings.filter(b => b.status.includes('DELIVERY') || b.status === 'DELIVERED').map(b => [
          b.id, b.destCity, `"${b.receiver.name}"`, b.receiver.mobile, b.assignedDeliveryPartnerId || 'N/A', b.commercial.paymentMode === 'TO_PAY_COD' ? b.commercial.totalCustomerPayable : 0, b.status, b.deliveryProof ? 'YES' : 'NO'
        ]);
        downloadCSV('shudhi_last_mile_deliveries', headers, rows);
      }
    },
    {
      id: 'rep-6',
      title: '6. APSRTC Transporter Bus Freight Statement',
      description: 'Detailed consignment audit of mid-mile bus freight payable to APSRTC Logistics.',
      category: 'Finance',
      onDownload: () => {
        const headers = ['Booking ID', 'APSRTC Ref', 'AWB', 'Route', 'Transporter Freight (₹)', 'Payment Status', 'Payment Ref'];
        const rows = filteredBookings.filter(b => b.apsrtcRef).map(b => [
          b.id, b.apsrtcRef || 'N/A', b.awb || 'N/A', `${b.originCity} -> ${b.destCity}`, b.commercial.apsrtcFreight, b.commercial.apsrtcPaymentStatus, b.commercial.apsrtcPaymentRef || 'N/A'
        ]);
        downloadCSV('shudhi_apsrtc_payables', headers, rows);
      }
    },
    {
      id: 'rep-7',
      title: '7. Customer Collection & Cash Inflow Statement',
      description: 'All collections received across Cash on Pickup, To-Pay COD, and UPI.',
      category: 'Finance',
      onDownload: () => {
        const headers = ['Booking ID', 'Date', 'Customer Name', 'City', 'Freight (₹)', 'Payment Mode', 'Collection Status'];
        const rows = filteredBookings.map(b => [
          b.id, b.date, `"${b.sender.name}"`, b.originCity, b.commercial.totalCustomerPayable, b.commercial.paymentMode, b.commercial.collectionStatus
        ]);
        downloadCSV('shudhi_customer_collections', headers, rows);
      }
    },
    {
      id: 'rep-8',
      title: '8. Pending Customer Receivables Report',
      description: 'Outstanding payments pending collection on deliveries and credit accounts.',
      category: 'Finance',
      onDownload: () => {
        const headers = ['Booking ID', 'Consignee', 'Mobile', 'Destination', 'Due Amount (₹)', 'Payment Mode', 'Status'];
        const rows = filteredBookings.filter(b => b.commercial.collectionStatus === 'PENDING').map(b => [
          b.id, `"${b.receiver.name}"`, b.receiver.mobile, b.destCity, b.commercial.totalCustomerPayable, b.commercial.paymentMode, b.status
        ]);
        downloadCSV('shudhi_pending_receivables', headers, rows);
      }
    },
    {
      id: 'rep-9',
      title: '9. Sub-Agent Margin & Commission Statement',
      description: 'Booking-wise commission statement calculated according to each agent’s contract terms.',
      category: 'Agents',
      onDownload: () => {
        const headers = ['Booking ID', 'Agent ID', 'Agency', 'Booking Freight (₹)', 'Commission Type', 'Margin Rate', 'Calculated Margin (₹)', 'Settlement Status'];
        const rows = filteredBookings.map(b => {
          const a = agents.find(ag => ag.id === b.agentId);
          return [b.id, b.agentId, `"${a?.name || b.agentId}"`, b.commercial.totalCustomerPayable, a?.commissionType || 'PERCENTAGE', a?.commissionRate || 10, b.commercial.subAgentMargin, b.commercial.subAgentMarginSettled ? 'SETTLED' : 'PENDING'];
        });
        downloadCSV('shudhi_agent_margins', headers, rows);
      }
    },
    {
      id: 'rep-10',
      title: '10. Sub-Agent Settlement Clearing Ledger',
      description: 'Historical records of all NEFT/bank settlement batches disbursed to sub-agents.',
      category: 'Finance',
      onDownload: () => {
        const headers = ['Settlement ID', 'Date', 'Agent ID', 'Agency Name', 'Amount (₹)', 'Payment Mode', 'Bank Ref', 'Period'];
        const rows = settlements.filter(s => s.entityType === 'SUB_AGENT').map(s => [
          s.id, s.date, s.entityId, `"${s.entityName}"`, s.amount, s.paymentMode, s.paymentReference, s.period
        ]);
        downloadCSV('shudhi_agent_settlements', headers, rows);
      }
    },
    {
      id: 'rep-11',
      title: '11. Local Ground Partner Payables Statement',
      description: 'Per-task pickup and delivery fees accrued by ground contractors.',
      category: 'Field',
      onDownload: () => {
        const headers = ['Partner ID', 'Partner Name', 'City Hub', 'Pickup Rate (₹)', 'Delivery Rate (₹)', 'Completed Tasks', 'Payable Amount (₹)'];
        const rows = partners.map(p => {
          const myB = filteredBookings.filter(b => b.assignedPickupPartnerId === p.id || b.assignedDeliveryPartnerId === p.id);
          const comp = myB.filter(b => ['PICKUP_COMPLETED', 'HANDED_AT_ORIGIN_HUB', 'DELIVERED'].includes(b.status));
          const totalEarned = comp.length * p.defaultPickupRate;
          return [p.id, `"${p.name}"`, p.city, p.defaultPickupRate, p.defaultDeliveryRate, comp.length, totalEarned];
        });
        downloadCSV('shudhi_partner_payables', headers, rows);
      }
    },
    {
      id: 'rep-12',
      title: '12. Partner Settlement & UPI Payout Statement',
      description: 'Disbursements and transaction UTR numbers for ground fleet partners.',
      category: 'Finance',
      onDownload: () => {
        const headers = ['Settlement ID', 'Date', 'Partner ID', 'Partner Name', 'Amount (₹)', 'Payment Mode', 'Reference'];
        const rows = settlements.filter(s => s.entityType === 'PARTNER').map(s => [
          s.id, s.date, s.entityId, `"${s.entityName}"`, s.amount, s.paymentMode, s.paymentReference
        ]);
        downloadCSV('shudhi_partner_payouts', headers, rows);
      }
    },
    {
      id: 'rep-13',
      title: '13. Shipment Exception & Failure Analysis',
      description: 'Log of failed pickups, failed deliveries, rejections, and documented reasons.',
      category: 'Governance',
      onDownload: () => {
        const headers = ['Booking ID', 'Route', 'Agent', 'Status', 'Failure / Rejection Reason', 'Customer Contact'];
        const rows = filteredBookings.filter(b => ['PICKUP_FAILED', 'DELIVERY_FAILED', 'REJECTED', 'EXCEPTION'].includes(b.status)).map(b => [
          b.id, `${b.originCity} -> ${b.destCity}`, b.agentId, b.status, `"${b.failureReason || b.rejectionReason || 'Under Exception'}"`, b.sender.mobile
        ]);
        downloadCSV('shudhi_exceptions_report', headers, rows);
      }
    },
    {
      id: 'rep-14',
      title: '14. Booking-Wise Profitability Statement',
      description: 'Granular net operational contribution per consignment using the master formula.',
      category: 'Finance',
      onDownload: () => {
        const headers = ['Booking ID', 'Route', 'Customer Billed (₹)', 'APSRTC Bus Freight (₹)', 'Pickup Cost (₹)', 'Delivery Cost (₹)', 'Sub-Agent Margin (₹)', 'Net Margin (₹)'];
        const rows = filteredBookings.map(b => [
          b.id, `${b.originCity} -> ${b.destCity}`, b.commercial.totalCustomerPayable, b.commercial.apsrtcFreight, b.commercial.pickupCost, b.commercial.deliveryCost, b.commercial.subAgentMargin, b.commercial.netOperationalMargin
        ]);
        downloadCSV('shudhi_profitability_report', headers, rows);
      }
    },
    {
      id: 'rep-15',
      title: '15. Monthly Consolidated Operational Performance',
      description: 'Executive rollup of volume, total freight, total transporter cost, and net margin.',
      category: 'Operations',
      onDownload: () => {
        const headers = ['Metric', 'Current Period Rollup Value'];
        const totRev = filteredBookings.reduce((sum, b) => sum + b.commercial.totalCustomerPayable, 0);
        const totApsrtc = filteredBookings.reduce((sum, b) => sum + b.commercial.apsrtcFreight, 0);
        const totMargin = filteredBookings.reduce((sum, b) => sum + b.commercial.netOperationalMargin, 0);
        const rows = [
          ['Total Consignments Processed', filteredBookings.length],
          ['Successfully Delivered Shipments', filteredBookings.filter(b => b.status === 'DELIVERED').length],
          ['Total Customer Freight Billed', `₹${totRev.toLocaleString()}`],
          ['Total APSRTC Transporter Bus Costs', `₹${totApsrtc.toLocaleString()}`],
          ['Total Net Operational Contribution', `₹${totMargin.toLocaleString()}`],
          ['Overall Network Profit Margin', `${Math.round((totMargin / (totRev || 1)) * 100)}%`]
        ];
        downloadCSV('shudhi_monthly_rollup', headers, rows);
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Analytical Statements</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-900 font-mono">
              15 Standard Export Formats
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time downloadable CSV ledgers derived dynamically from active database records.
          </p>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Scope:</span>
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none"
          >
            <option value="ALL">All Hubs (Network Wide)</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsList.map(rep => (
          <div
            key={rep.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-teal-500 transition-all space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {rep.category}
                </span>
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{rep.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{rep.description}</p>
            </div>

            <button
              onClick={rep.onDownload}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Report</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
