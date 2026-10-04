import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../services/api';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { EmptyState, LoadingSpinner } from '../components/ui/FeedbackStates';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    checkedOutToday: 0,
    attendanceRate: 0,
    recentAttendance: [],
    attendanceTrend: [],
    statusDistribution: [],
    siteWiseStats: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.warn('Could not load real admin dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const hasActivity = stats.presentToday > 0 || stats.checkedOutToday > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Date Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time workforce monitoring • Adani Smart Meter Project
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* KPI Cards Row matching PDF Screen 9 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={Users}
          label="Total Field Force"
          value={stats.totalEmployees}
          change="Registered Technicians"
          trend="neutral"
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Present Today"
          value={stats.presentToday}
          change={`${stats.attendanceRate}% Attendance Rate`}
          trend="up"
          color="green"
        />
        <StatCard
          icon={UserX}
          label="Not Checked In"
          value={stats.absentToday}
          change="Pending Attendance"
          trend="down"
          color="red"
        />
        <StatCard
          icon={Clock}
          label="Completed Shifts"
          value={stats.checkedOutToday}
          change="Checked Out"
          trend="up"
          color="purple"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Attendance Trend (Bar Chart) */}
        <Card className="lg:col-span-8 p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Attendance Trends (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500">Daily present vs pending technicians</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Not Checked In
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.attendanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#0F172A' }}
                />
                <Bar dataKey="present" name="Present" fill="#22C55E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" name="Not Checked In" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Breakdown (Donut Chart) */}
        <Card className="lg:col-span-4 p-4 sm:p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Status Distribution</h3>
            <p className="text-xs text-slate-400">Today's active shifts</p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center">
            {!hasActivity ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p>No shifts checked in yet today</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(stats.statusDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div>
              <p className="text-[10px] text-slate-400">Present</p>
              <p className="text-xs font-bold text-emerald-600">{stats.presentToday}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Pending</p>
              <p className="text-xs font-bold text-rose-600">{stats.absentToday}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Checked Out</p>
              <p className="text-xs font-bold text-brand-600">{stats.checkedOutToday}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Attendance Section matching PDF Screen 9 */}
      <Card className="p-0 overflow-hidden shadow-card">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Recent Attendance</h3>
            <p className="text-xs text-slate-500">Live check-in stream across Smart Meter sites</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading live attendance stream..." />
          </div>
        ) : !stats.recentAttendance || stats.recentAttendance.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <EmptyState
              title="No check-ins recorded today"
              description="Technicians checking into field sites will appear in this real-time stream."
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-5">Substation Site</th>
                    <th className="py-3 px-5">Check-In Time</th>
                    <th className="py-3 px-5">Check-Out Time</th>
                    <th className="py-3 px-5">Working Duration</th>
                    <th className="py-3 px-5">Shift Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentAttendance.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{row.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{row.employeeId}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 font-medium">{row.site}</td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-900">
                        {row.checkIn || '--'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-900">
                        {row.checkOut && row.checkOut !== '--' ? row.checkOut : (
                          <span className="text-slate-400 italic">Active Shift</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-brand-600 font-bold">
                        {row.workingHours || '--'}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View matching Screen 9 */}
            <div className="sm:hidden divide-y divide-slate-100">
              {stats.recentAttendance.map((row) => (
                <div key={row.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{row.name} ({row.employeeId})</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{row.site}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                      <span>In: {row.checkIn || '--'}</span>
                      <span>•</span>
                      <span>Out: {row.checkOut || '--'}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <StatusBadge status={row.status} size="sm" />
                    <span className="text-[10px] font-bold text-brand-600">{row.workingHours}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
