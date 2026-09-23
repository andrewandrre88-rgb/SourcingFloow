import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Building2,
  ShieldCheck,
  Languages,
  Scale,
  Plane,
  Boxes,
  Award,
  FlaskConical,
  Sparkles,
  HelpCircle,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Share2,
  TrendingUp,
  Train,
  Hotel,
  Utensils,
  Receipt,
} from 'lucide-react';
import { ServiceRequest, ServiceStatus, ExchangeRates } from '../types';
import { formatCurrency } from '../lib/currency';
import { cleanPhoneNumber, openWhatsAppMessenger } from '../lib/countryFlags';

interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRequest | null;
  exchangeRates: ExchangeRates;
  onEdit: (service: ServiceRequest) => void;
  onDelete: (service: ServiceRequest) => void;
  onStatusChange: (service: ServiceRequest, status: ServiceStatus) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  isOpen,
  onClose,
  service,
  exchangeRates,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !service) return null;

  const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Medical & Clinic Assistance':
        return Stethoscope;
      case 'Company Registration':
        return Building2;
      case 'Factory Audit & Verification':
        return ShieldCheck;
      case 'Translation & Business Escort':
        return Languages;
      case 'Legal & Contract Review':
        return Scale;
      case 'Visa & Travel Support':
        return Plane;
      case 'Warehousing & Logistics':
        return Boxes;
      case 'Trademark & IP':
        return Award;
      case 'Sample Lab Testing':
        return FlaskConical;
      default:
        return Sparkles;
    }
  };

  const CategoryIcon = getCategoryIcon(service.category);

  const handleCopySummary = () => {
    const text = `🇨🇳 *China Service Update / Quotation*
━━━━━━━━━━━━━━━━━━━━
📌 *Ref:* ${service.serviceNumber}
📋 *Service:* ${service.title}
🏢 *Category:* ${service.category}
📍 *Location:* ${service.cityLocation || 'China'}
👤 *Client:* ${service.clientName}

💰 *Service Fee:* ${service.quoteCurrency === 'USD' ? '$' : '¥'}${service.clientFee.toLocaleString()}
📊 *Payment Status:* ${service.paymentStatus}
🗓️ *Target Date:* ${service.targetDate || 'TBD'}
🔄 *Status:* ${service.status}

📝 *Details:*
${service.description}

💬 *Questions?* Reach out anytime!`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyWechat = () => {
    if (service.wechatId) {
      navigator.clipboard.writeText(service.wechatId);
      setCopiedWechat(true);
      setTimeout(() => setCopiedWechat(false), 2000);
    }
  };

  const cleanPhone = cleanPhoneNumber(service.clientContact);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 rounded-t-xl shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {service.serviceNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    service.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : service.status === 'In Progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : service.status === 'Cancelled'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {service.status}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    service.priority === 'Urgent'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : service.priority === 'High'
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {service.priority} Priority
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 truncate mt-0.5">{service.title}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(service);
              }}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
              title="Edit Service Request"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Status Bar */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Quick Status:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                {(['New Request', 'In Progress', 'Completed'] as ServiceStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onStatusChange(service, st)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      service.status === st
                        ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedText ? 'Copied WhatsApp Text!' : 'Copy Client Quote'}</span>
              </button>

              {cleanPhone && (
                <button
                  type="button"
                  onClick={() => openWhatsAppMessenger(cleanPhone, `Hello ${service.clientName}, regarding your service request ${service.serviceNumber} (${service.title})...`)}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>

          {/* Client & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Client Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Client Details
              </div>
              <div className="text-sm font-bold text-slate-900">{service.clientName}</div>
              <div className="space-y-1 text-xs text-slate-600 font-medium">
                {service.country && <div>Country: <span className="font-semibold text-slate-800">{service.country}</span></div>}
                {service.clientContact && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="font-mono">{service.clientContact}</span>
                  </div>
                )}
                {service.wechatId && (
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span className="font-mono">WeChat: {service.wechatId}</span>
                    <button
                      type="button"
                      onClick={handleCopyWechat}
                      className="p-0.5 text-slate-400 hover:text-slate-600"
                    >
                      {copiedWechat ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scope & China Location Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Service Details & Location
              </div>
              <div className="text-xs space-y-1.5 text-slate-700">
                <div>
                  <span className="text-slate-500">Category:</span>{' '}
                  <span className="font-semibold text-indigo-700">{service.category}</span>
                </div>
                <div>
                  <span className="text-slate-500">City / China Hub:</span>{' '}
                  <span className="font-semibold text-slate-900">{service.cityLocation || 'Guangzhou / Mainland China'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Completion / Date:</span>{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {service.targetDate || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description / Scope Dossier */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Service Scope & Objectives
            </h3>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
              {service.description || 'No detailed scope provided.'}
            </p>
          </div>

          {/* Financial Breakdown Card (USD & RMB) */}
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Financial Overview & Net Profit
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                service.paymentStatus === 'Fully Paid'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : service.paymentStatus === 'Deposit Received'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                Payment: {service.paymentStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Client Service Fee</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {service.quoteCurrency === 'USD' ? '$' : '¥'}{service.clientFee.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {service.quoteCurrency === 'USD'
                    ? `¥${(service.clientFee * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : `$${(service.clientFee / rate).toFixed(2)}`}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">China Local Cost</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {service.quoteCurrency === 'USD' ? '$' : '¥'}{service.estimatedCost.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {service.quoteCurrency === 'USD'
                    ? `¥${(service.estimatedCost * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : `$${(service.estimatedCost / rate).toFixed(2)}`}
                </div>
              </div>

              <div className="p-2.5 bg-emerald-100/70 rounded-lg border border-emerald-300 sm:col-span-2">
                <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-700" />
                  {service.totalTravelCostRmb ? 'Adjusted Net Profit (After Travel)' : 'Agent Net Profit'}
                </div>
                <div className="text-lg font-extrabold text-emerald-800 font-mono mt-0.5">
                  +${(service.netProfitAfterExpensesUsd ?? service.estimatedProfitUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs font-bold text-emerald-700 font-mono">
                  +¥{(service.netProfitAfterExpensesRmb ?? service.estimatedProfitRmb ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Service Out-of-Pocket Expenses / Travel Costs */}
          {service.serviceExpenses && service.serviceExpenses.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Service Out-of-Pocket Expenses ({service.serviceExpenses.length})
                </span>
                <span className="text-xs font-bold font-mono text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full self-start sm:self-auto">
                  Total Expenses: -{formatCurrency(service.totalTravelCostUsd || 0, 'USD')} (-¥{formatCurrency(service.totalTravelCostRmb || 0, 'RMB')})
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {service.serviceExpenses.map((exp, idx) => (
                  <div key={exp.id || idx} className="p-3 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{exp.title || 'Service Cost'}</span>
                        {exp.hasFapiao && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                            发票 Fapiao
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 pl-6 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {exp.date && <span>Date: {exp.date}</span>}
                        {exp.supplierOrPayee && <span>Payee: {exp.supplierOrPayee}</span>}
                        {exp.paymentMethod && <span>Via: {exp.paymentMethod}</span>}
                        {exp.notes && <span className="italic text-slate-400">({exp.notes})</span>}
                      </div>
                    </div>
                    <div className="text-right sm:shrink-0 pl-6 sm:pl-0">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {exp.currency === 'USD' ? '$' : '¥'}{Number(exp.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {exp.currency === 'USD'
                          ? `≈ ¥${((Number(exp.amount) || 0) * (service.totalTravelCostRmb && service.totalTravelCostUsd ? service.totalTravelCostRmb / service.totalTravelCostUsd : 7.23)).toFixed(2)}`
                          : `≈ $${((Number(exp.amount) || 0) / (service.totalTravelCostRmb && service.totalTravelCostUsd ? service.totalTravelCostRmb / service.totalTravelCostUsd : 7.23)).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : service.travelExpenses && ((service.travelExpenses.transportCost || 0) + (service.travelExpenses.hotelCost || 0) + (service.travelExpenses.foodCost || 0) + (service.travelExpenses.otherCost || 0) > 0) ? (
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  On-Ground Travel & Factory Relocation Expenses
                </div>
                <span className="text-xs font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                  Total: ¥{(service.totalTravelCostRmb || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} (${(service.totalTravelCostUsd || 0).toFixed(2)})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white rounded border border-amber-200">
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Train className="w-3 h-3 text-blue-600" />
                    Transport / Gaotie
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {service.travelExpenses.currency === 'USD' ? '$' : '¥'}{service.travelExpenses.transportCost || 0}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-amber-200">
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Hotel className="w-3 h-3 text-indigo-600" />
                    Hotel & Lodging
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {service.travelExpenses.currency === 'USD' ? '$' : '¥'}{service.travelExpenses.hotelCost || 0}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-amber-200">
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-amber-600" />
                    Food & Meals
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {service.travelExpenses.currency === 'USD' ? '$' : '¥'}{service.travelExpenses.foodCost || 0}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-amber-200">
                  <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-emerald-600" />
                    Other / Tolls
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {service.travelExpenses.currency === 'USD' ? '$' : '¥'}{service.travelExpenses.otherCost || 0}
                  </div>
                </div>
              </div>

              {service.travelExpenses.notes && (
                <div className="text-[11px] text-amber-900/90 italic bg-white/70 p-2 rounded border border-amber-100">
                  Route / notes: {service.travelExpenses.notes}
                </div>
              )}
            </div>
          ) : null}

          {/* Assigned China Partner */}
          {service.assignedPartner && (
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Assigned China Partner / Service Provider
              </div>
              <div className="text-xs text-slate-700">
                <div className="font-bold text-slate-900">{service.assignedPartner}</div>
                {service.partnerContact && (
                  <div className="font-mono text-slate-600 mt-0.5">Contact: {service.partnerContact}</div>
                )}
                {service.partnerCommission ? (
                  <div className="text-slate-600 mt-0.5">
                    Commission / Fee: <span className="font-semibold">{service.quoteCurrency === 'USD' ? '$' : '¥'}{service.partnerCommission}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Notes */}
          {service.notes && (
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs text-amber-900">
              <div className="font-bold mb-1">Internal Notes:</div>
              <div className="whitespace-pre-wrap">{service.notes}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl shrink-0 gap-2 flex-wrap sm:flex-nowrap">
          {!isConfirmingDelete ? (
            <button
              type="button"
              id="detail-delete-btn"
              onClick={() => setIsConfirmingDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <span className="text-xs font-semibold text-rose-700 hidden sm:inline">Sure to delete?</span>
              <button
                type="button"
                id="confirm-detail-delete-btn"
                onClick={() => {
                  onDelete(service);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg font-semibold transition cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(service);
              }}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
