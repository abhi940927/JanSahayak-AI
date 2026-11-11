import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Users,
  ShieldAlert,
  ArrowUpRight,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  Award
} from 'lucide-react';

const PRIORITY_COLORS = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Low: '#94A3B8'
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    summary: { total: 0, pending: 0, in_progress: 0, resolved: 0, critical: 0 },
    departmentDistribution: [],
    priorityDistribution: []
  });
  const [departments, setDepartments] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAdminAnalytics();
  }, [filterDepartment]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.warn('Could not load departments:', err);
    }
  };

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/admin${filterDepartment ? `?department_id=${filterDepartment}` : ''}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Department,Total Grievances,Resolved,Resolution Rate"].concat(
        data.departmentDistribution.map(d => `"${d.name}",${d.complaints},${d.resolved},${d.resolution_rate}%`)
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JanSahayak_Admin_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout
      title="Administrative Governance & Redressal Analytics"
      subtitle="Real-time multi-department oversight, SLA compliance telemetry and civic load analysis."
    >
      <div className="space-y-6">
        {/* Dynamic Administrator Identity & Authority Banner */}
        <div className="bg-gradient-to-r from-gov-navy-900 to-gov-navy-800 text-white rounded-2xl p-6 shadow-sm border border-gov-navy-700/60">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gov-navy-700 text-amber-400 flex items-center justify-center font-black text-2xl uppercase border-2 border-amber-400/40 shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0) : 'A'}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {user?.full_name || 'System Administrator'}
                  </h2>
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    user?.role === 'super_admin'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'bg-gov-teal-500/20 text-gov-teal-300 border border-gov-teal-400/30'
                  }`}>
                    <Award className="w-3 h-3" />
                    <span className="capitalize">{user?.role?.replace('_', ' ') || 'Administrator'} Authority</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">
                  {user?.designation || (user?.role === 'super_admin' ? 'Principal Secretary of Governance' : 'Department Administrator')}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{user?.email || 'N/A'}</span>
                  </span>
                  {user?.phone_number && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.phone_number}</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Access Level: {user?.role === 'super_admin' ? 'All Municipal & State Departments' : 'Municipal Corporation (MCD)'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href="/profile"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Profile</span>
              </a>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Complaints</span>
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">{data.summary.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Cross-department intake</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Escalations</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-black text-red-600 mt-2">{data.summary.critical}</div>
            <div className="text-[11px] text-slate-500 mt-1">Requiring immediate audit</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Active Field Work</span>
              <TrendingUp className="w-5 h-5 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-sky-600 mt-2">{data.summary.in_progress}</div>
            <div className="text-[11px] text-slate-500 mt-1">Under investigation</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">{data.summary.resolved}</div>
            <div className="text-[11px] text-slate-500 mt-1">Completed & verified</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Load Distribution Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Department Grievance Volume & Resolution</h3>
                <p className="text-[11px] text-slate-500">Total received vs. resolved across civic boards</p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-gov-teal-500 max-w-[200px] truncate"
                >
                  <option value="all">🌐 All Departments (Multi-Agency View)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gov-teal-700 bg-gov-teal-50 hover:bg-gov-teal-100 border border-gov-teal-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              {data.departmentDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="complaints" name="Total Filed" fill="#1B365D" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" fill="#0D9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
              )}
            </div>
          </div>

          {/* Priority Breakdown Pie Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Priority Categorization</h3>
            <p className="text-[11px] text-slate-500 mb-4">Urgency & Safety Threat Breakdown</p>

            <div className="h-48 w-full flex items-center justify-center">
              {data.priorityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.priorityDistribution}
                      dataKey="count"
                      nameKey="priority"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {data.priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#3B82F6'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">Loading breakdown...</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              {data.priorityDistribution.map(p => (
                <div key={p.priority} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p.priority] }}></span>
                  <span className="text-slate-600">{p.priority}: <strong className="text-slate-800">{p.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department SLA Scorecard Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Civic Agency SLA Performance Scorecard</h3>
            <p className="text-[11px] text-slate-500">Live operational compliance calculated from grievance logs</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4 text-center">Grievances</th>
                  <th className="py-3 px-4 text-center">Resolved</th>
                  <th className="py-3 px-4 text-center">Resolution Rate</th>
                  <th className="py-3 px-4 text-right">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.departmentDistribution.map(dept => (
                  <tr key={dept.code} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{dept.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gov-navy-900">{dept.code}</td>
                    <td className="py-3.5 px-4 text-center font-semibold">{dept.complaints}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">{dept.resolved}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800">{dept.resolution_rate}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Operational
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
