import React from 'react';
import {
  Calendar,
  Download,
  ExternalLink,
  Sparkles,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const HOLIDAYS_2026_DATA = [
  { sr: 1, date: '26-Jan-2026', day: 'Monday', festival: 'Republic Day', isoDate: '2026-01-26' },
  { sr: 2, date: '04-Mar-2026', day: 'Wednesday', festival: 'Dhulandi', isoDate: '2026-03-04' },
  { sr: 3, date: '19-Mar-2026', day: 'Thursday', festival: 'Gudi Padwa', isoDate: '2026-03-19' },
  { sr: 4, date: '01-May-2026', day: 'Friday', festival: 'Maharashtra Day', isoDate: '2026-05-01' },
  { sr: 5, date: '15-Aug-2026', day: 'Saturday', festival: 'Independence Day', isoDate: '2026-08-15' },
  { sr: 6, date: '25-Sep-2026', day: 'Friday', festival: 'Anant Chaturdashi', isoDate: '2026-09-25' },
  { sr: 7, date: '02-Oct-2026', day: 'Friday', festival: 'Gandhi Jayanti', isoDate: '2026-10-02' },
  { sr: 8, date: '20-Oct-2026', day: 'Tuesday', festival: 'Dussehra', isoDate: '2026-10-20' },
  { sr: 9, date: '08-Nov-2026', day: 'Sunday', festival: 'Diwali', isoDate: '2026-11-08' },
  { sr: 10, date: '09-Nov-2026', day: 'Monday', festival: 'Goverdhan Pooja', isoDate: '2026-11-09' },
];

export const downloadHolidayPdfFile = () => {
  const link = document.createElement('a');
  link.href = '/holiday_list_2026.pdf';
  link.download = 'Holiday List 2026 - b4S Solutions.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const HolidayModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Company Holidays Calendar 2026"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Company Header Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500/30 text-brand-300 border border-brand-400/30">
                  Official Document
                </span>
                <span className="text-[11px] text-slate-300 font-mono">CIN: U74920DL1999PTC099070</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
                b4S SOLUTIONS PVT. LTD.
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 & ISO 50001:2018 Certified
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                onClick={downloadHolidayPdfFile}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm flex items-center gap-2 px-4 py-2"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download PDF</span>
              </Button>
              <a
                href="/holiday_list_2026.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Full PDF</span>
              </a>
            </div>
          </div>
        </div>

        {/* Holiday Schedule Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Gazetted & Public Holiday Schedule (10 Days)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">Year 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-4 text-center w-14">Sr.</th>
                  <th className="py-2.5 px-4">Holiday Date</th>
                  <th className="py-2.5 px-4">Day</th>
                  <th className="py-2.5 px-4">Holiday / Festival</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {HOLIDAYS_2026_DATA.map((h) => {
                  const isPast = h.isoDate < todayStr;
                  const isUpcoming = h.isoDate >= todayStr;

                  return (
                    <tr
                      key={h.sr}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isUpcoming ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                        {h.sr}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {h.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {h.day}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{h.festival}</span>
                        {h.festival === 'Diwali' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                            Major
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPast ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Upcoming
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Corporate Address & Compliance Footer from PDF */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-[11px] text-slate-600 space-y-1 leading-relaxed">
          <p className="font-bold text-slate-800">b4S Solutions Pvt. Ltd. Official Registered Offices:</p>
          <p><span className="font-semibold text-slate-700">H.O.:</span> S-40, (Harsha Compound) Site-2, Loni Road, Mohan Nagar, Ghaziabad Ph. (0120) 4188300</p>
          <p><span className="font-semibold text-slate-700">R.O.:</span> 806, 8th Floor, 56, Eros Apartment, Nehru Place, New Delhi - 110 019</p>
          <p><span className="font-semibold text-slate-700">Pune Office:</span> S. No. 22/1/A/1A, Off. No. 601 & 606, Pride Icon, Kharadi, Pune, Maharashtra - 411 014</p>
        </div>

        {/* Bottom Download Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Click below to download the official stamped PDF document to your system.</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={downloadHolidayPdfFile}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download PDF File</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HolidayModal;
