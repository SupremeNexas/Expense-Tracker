import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, Users, Plus, Shield, ShieldAlert, Sparkles, 
  Trash2, Mail, Download, Clock, PlayCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import { Badge } from '../components/UI/Badge';
import { SkeletonCard, SkeletonList } from '../components/UI/Skeleton';

export default function WorkspaceSettings() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'members' | 'automations' | 'logs' | 'export'>('members');

  // New workspace creation state
  const [newWsName, setNewWsName] = useState('');
  const [newWsType, setNewWsType] = useState('FAMILY');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');

  // Automation rule creation state
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState('TRANSACTION_CREATED');
  const [condCategory, setCondCategory] = useState('');
  const [condAmount, setCondAmount] = useState('');
  const [actType, setActType] = useState('TAG_TRANSACTION');
  const [actValue, setActValue] = useState('');

  // Active workspace scoping
  const activeWsId = localStorage.getItem('fintech_workspace_id') || '';

  // Queries: List all workspaces
  const { data: workspaces = [], isLoading: isLoadingWs, refetch: refetchWs } = useQuery<any[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.request('/workspaces')
  });

  const activeWs = workspaces.find(w => w.id === activeWsId) || workspaces[0];
  const userRole = activeWs?.userRole || 'VIEWER';
  const isPrivileged = ['OWNER', 'ADMIN'].includes(userRole);

  // Queries: Fetch active workspace audit logs
  const { data: auditLogs = [], isLoading: isLoadingLogs } = useQuery<any[]>({
    queryKey: ['audit-logs', activeWsId],
    queryFn: () => api.request(`/workspaces/${activeWsId}/audit-logs`),
    enabled: !!activeWsId
  });

  // Queries: Fetch active workspace automations
  const { data: automations = [], isLoading: isLoadingRules } = useQuery<any[]>({
    queryKey: ['automations', activeWsId],
    queryFn: () => api.request('/automations'),
    enabled: !!activeWsId
  });

  // Mutations: Create workspace
  const createWsMutation = useMutation({
    mutationFn: (data: any) => api.request('/workspaces', { method: 'POST', body: data }),
    onSuccess: (res) => {
      showToast('Workspace created successfully!', 'success');
      setNewWsName('');
      setIsCreatingWs(false);
      refetchWs();
      // Switch active workspace to the new one
      localStorage.setItem('fintech_workspace_id', res.id);
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create workspace', 'error');
    }
  });

  // Mutations: Invite member
  const inviteMutation = useMutation({
    mutationFn: (data: any) => api.request(`/workspaces/${activeWsId}/invite`, { method: 'POST', body: data }),
    onSuccess: () => {
      showToast('Invitation sent successfully!', 'success');
      setInviteEmail('');
      refetchWs();
    },
    onError: (err: any) => {
      showToast(err.message || 'Invitation failed', 'error');
    }
  });

  // Mutations: Update member role
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => 
      api.request(`/workspaces/${activeWsId}/members/${userId}`, { method: 'PUT', body: { role } }),
    onSuccess: () => {
      showToast('Member role updated!', 'success');
      refetchWs();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update role', 'error');
    }
  });

  // Mutations: Remove member
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => 
      api.request(`/workspaces/${activeWsId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      showToast('Member removed from workspace', 'success');
      refetchWs();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  });

  // Mutations: Create automation rule
  const createRuleMutation = useMutation({
    mutationFn: (data: any) => api.request('/automations', { method: 'POST', body: data }),
    onSuccess: () => {
      showToast('Automation rule created!', 'success');
      setRuleName('');
      setCondCategory('');
      setCondAmount('');
      setActValue('');
      queryClient.invalidateQueries({ queryKey: ['automations', activeWsId] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create automation rule', 'error');
    }
  });

  // Mutations: Toggle rule status
  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      api.request(`/automations/${id}`, { method: 'PUT', body: { isActive } }),
    onSuccess: () => {
      showToast('Rule status updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['automations', activeWsId] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update rule status', 'error');
    }
  });

  // Handlers
  const handleCreateWs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWsMutation.mutate({ name: newWsName.trim(), type: newWsType });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const conditions = {
      category: condCategory ? condCategory : undefined,
      amountGreaterThan: condAmount ? Number(condAmount) : undefined
    };

    const actions = [
      {
        type: actType,
        value: actValue || 'automated'
      }
    ];

    createRuleMutation.mutate({
      name: ruleName.trim(),
      triggerType: ruleTrigger,
      conditions,
      actions
    });
  };

  // Export system handler
  const handleExportCSV = async () => {
    try {
      showToast('Preparing CSV export...', 'info');
      const expenses = await api.request('/expenses');
      
      const headers = ['Transaction ID', 'Title', 'Amount', 'Type', 'Date', 'Payment Method', 'Notes', 'Creator'];
      const rows = expenses.map((e: any) => [
        e.id,
        e.title,
        e.amount,
        e.type,
        e.date.split('T')[0],
        e.payment_method || '',
        e.notes || '',
        e.creator || ''
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map((r: any) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `workspace_ledger_${activeWsId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV export downloaded!', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  const handleExportJSON = async () => {
    try {
      showToast('Preparing JSON export...', 'info');
      const expenses = await api.request('/expenses');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `workspace_backup_${activeWsId}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('JSON export downloaded!', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-border gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-500" />
            Workspace Settings
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage active workspace members, configure notifications rules, and inspect immutable audit logs.
          </p>
        </div>

        {/* Create workspace button */}
        <Button 
          variant="secondary"
          onClick={() => setIsCreatingWs(!isCreatingWs)}
          className="cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Workspace
        </Button>
      </div>

      {/* Create Workspace Modal-like card overlay */}
      {isCreatingWs && (
        <div className="premium-card p-6 border-emerald-500/20 bg-emerald-500/[0.01] text-left">
          <h3 className="text-base font-bold mb-4">Create Collaborative Workspace</h3>
          <form onSubmit={handleCreateWs} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input 
                label="Workspace Name" 
                placeholder="e.g. Acme Business, Family Ledger" 
                value={newWsName} 
                onChange={e => setNewWsName(e.target.value)}
                required
              />
            </div>
            <div className="w-full sm:w-48">
              <Select 
                label="Workspace Type" 
                value={newWsType} 
                onChange={e => setNewWsType(e.target.value)}
              >
                <option value="PERSONAL">Personal</option>
                <option value="FAMILY">Family</option>
                <option value="BUSINESS">Business</option>
                <option value="PROJECT">Project</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreatingWs(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-emerald-500 text-white" loading={createWsMutation.isPending}>
                Create
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sub tabs switcher */}
      <div className="flex border-b border-border gap-6">
        {[
          { id: 'members', label: 'Members & Access', icon: Users },
          { id: 'automations', label: 'Rule Automations', icon: Sparkles },
          { id: 'logs', label: 'Audit Trail Logs', icon: Clock },
          { id: 'export', label: 'Data Exporter', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all
                ${activeSubTab === tab.id 
                  ? 'border-emerald-500 text-emerald-500' 
                  : 'border-transparent text-gray-400 hover:text-text'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MEMBERS TAB */}
      {activeSubTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members list */}
          <div className="lg:col-span-2 premium-card p-6 text-left">
            <h3 className="text-base font-bold mb-4">Workspace Members ({activeWs?.members?.length || 0})</h3>
            
            <div className="divide-y divide-border">
              {(activeWs?.members || []).map((m: any) => (
                <div key={m.id} className="flex justify-between items-center py-4">
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      {m.name}
                      {m.role === 'OWNER' && <Badge variant="success">Owner</Badge>}
                      {m.role === 'ADMIN' && <Badge variant="warning">Admin</Badge>}
                    </div>
                    <div className="text-xs text-gray-400">{m.email}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role update drop-down for owners/admins (except on OWNER rows) */}
                    {isPrivileged && m.role !== 'OWNER' && m.id !== activeWs.members.find((mem: any) => mem.role === 'OWNER')?.id ? (
                      <select
                        value={m.role}
                        onChange={(e) => updateRoleMutation.mutate({ userId: m.id, role: e.target.value })}
                        className="bg-black/[0.03] dark:bg-white/[0.03] border border-border px-2 py-1 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">{m.role}</span>
                    )}

                    {/* Delete member button */}
                    {isPrivileged && m.role !== 'OWNER' && (
                      <button 
                        onClick={() => {
                          if (confirm(`Remove ${m.name} from workspace?`)) {
                            removeMemberMutation.mutate(m.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invitation Card */}
          <div className="premium-card p-6 text-left space-y-4 h-fit">
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <Mail className="w-5 h-5 text-emerald-500" />
                Invite Member
              </h3>
              <p className="text-xs text-muted mt-1">Collaborate on this shared budget workspace.</p>
            </div>

            {isPrivileged ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <Input 
                  label="Email Address" 
                  placeholder="name@example.com" 
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                />
                
                <Select 
                  label="Role Level" 
                  value={inviteRole} 
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="ADMIN">Admin (Invite, edit, delete)</option>
                  <option value="EDITOR">Editor (Create, edit, view)</option>
                  <option value="VIEWER">Viewer (Read logs and reports only)</option>
                </Select>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20"
                  loading={inviteMutation.isPending}
                >
                  Send Invitation
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 text-xs">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Only Owners or Admins can invite new users.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTOMATIONS TAB */}
      {activeSubTab === 'automations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules lists */}
          <div className="lg:col-span-2 premium-card p-6 text-left">
            <h3 className="text-base font-bold mb-4">Workspace Automation Rules</h3>

            {isLoadingRules ? (
              <SkeletonList />
            ) : automations.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No rules configured. Write a rule on the right panel.</p>
            ) : (
              <div className="space-y-4">
                {automations.map((rule) => {
                  const conds = rule.conditions as any;
                  const acts = rule.actions as any;
                  return (
                    <div key={rule.id} className="flex justify-between items-start p-4 border border-border rounded-2xl hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all">
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{rule.name}</span>
                          <span className="text-[10px] bg-black/[0.04] dark:bg-white/[0.04] px-1.5 py-0.5 rounded text-gray-400">
                            {rule.triggerType}
                          </span>
                        </div>
                        <div className="text-xs text-muted leading-normal space-y-1">
                          <div>
                            <span className="font-semibold text-gray-500">Conditions: </span>
                            {conds.category ? `Category matches "${conds.category}"` : ''}
                            {conds.amountGreaterThan ? ` Amount exceeds ${conds.amountGreaterThan}` : ''}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500">Action: </span>
                            {acts.map((a: any, i: number) => (
                              <span key={i}>
                                {a.type === 'TAG_TRANSACTION' ? `Append Tag "${a.value}"` : ''}
                                {a.type === 'SEND_NOTIFICATION' ? `Push Alert "${a.value}"` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleRuleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                          className="text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
                        >
                          {rule.isActive ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                        
                        {isPrivileged && (
                          <button 
                            onClick={() => {
                              if (confirm('Delete this rule?')) {
                                api.request(`/automations/${rule.id}`, { method: 'DELETE' }).then(() => {
                                  showToast('Rule deleted', 'success');
                                  queryClient.invalidateQueries({ queryKey: ['automations', activeWsId] });
                                });
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Rule Form */}
          <div className="premium-card p-6 text-left space-y-4 h-fit">
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Configure Rule
              </h3>
              <p className="text-xs text-muted mt-1">Automatically execute operations on transaction logs.</p>
            </div>

            {['OWNER', 'ADMIN', 'EDITOR'].includes(userRole) ? (
              <form onSubmit={handleCreateRule} className="space-y-4">
                <Input 
                  label="Rule Name" 
                  placeholder="e.g. Auto Tag fuel" 
                  value={ruleName} 
                  onChange={e => setRuleName(e.target.value)}
                  required
                />
                
                <Select 
                  label="Trigger Type" 
                  value={ruleTrigger} 
                  onChange={e => setRuleTrigger(e.target.value)}
                >
                  <option value="TRANSACTION_CREATED">On Transaction Logged</option>
                  <option value="BUDGET_OVERRUN">On Budget Limit Exceeded</option>
                </Select>

                <div className="border border-border p-3 rounded-xl space-y-3">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">IF Conditions</div>
                  <Input 
                    label="Category Contains" 
                    placeholder="e.g. Fuel, Grocery" 
                    value={condCategory}
                    onChange={e => setCondCategory(e.target.value)}
                  />
                  <Input 
                    label="Amount Greater Than" 
                    placeholder="e.g. 10000" 
                    type="number"
                    value={condAmount}
                    onChange={e => setCondAmount(e.target.value)}
                  />
                </div>

                <div className="border border-border p-3 rounded-xl space-y-3">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">THEN Action</div>
                  <Select 
                    label="Action Type" 
                    value={actType} 
                    onChange={e => setActType(e.target.value)}
                  >
                    <option value="TAG_TRANSACTION">Append Transaction Tag</option>
                    <option value="SEND_NOTIFICATION">Push Workspace Alert Notification</option>
                  </Select>
                  <Input 
                    label="Action Value" 
                    placeholder="e.g. Vehicle, Large Spend Alert" 
                    value={actValue}
                    onChange={e => setActValue(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20"
                  loading={createRuleMutation.isPending}
                >
                  Add Rule
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 text-xs">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Only Owners, Admins, or Editors can write automation rules.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeSubTab === 'logs' && (
        <div className="premium-card p-6 text-left">
          <h3 className="text-base font-bold flex items-center gap-1.5 mb-4">
            <Clock className="w-5 h-5 text-emerald-500" />
            Immutable Audit Trail
          </h3>

          {isLoadingLogs ? (
            <SkeletonList />
          ) : auditLogs.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No audit logs logged in this workspace yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Actor</th>
                    <th className="pb-3">Operation</th>
                    <th className="pb-3">Target Resource</th>
                    <th className="pb-3">Change Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((log) => {
                    const changes = log.newValues ? JSON.stringify(log.newValues) : '';
                    return (
                      <tr key={log.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 text-gray-500 font-sans">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3 font-semibold">{log.user?.name || 'System'}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-black/[0.04] dark:bg-white/[0.04] border border-border rounded-md font-mono text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-300 font-semibold">{log.resource}</td>
                        <td className="py-3 text-muted max-w-[240px] truncate">{changes || 'Resource Mutated'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EXPORT TAB */}
      {activeSubTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* CSV Card */}
          <div className="premium-card p-6 flex flex-col justify-between h-48">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                CSV Spreadsheet Export
              </h4>
              <p className="text-xs text-muted mt-1 leading-normal">
                Downloads a clean, comma-separated values ledger file containing all workspace transactions, amounts, category names, dates, and creator identities. Preserves cell formatting for MS Excel and Google Sheets.
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={handleExportCSV} 
              className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
            >
              Download CSV
            </Button>
          </div>

          {/* JSON Card */}
          <div className="premium-card p-6 flex flex-col justify-between h-48">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                JSON Structured Backup
              </h4>
              <p className="text-xs text-muted mt-1 leading-normal">
                Downloads a complete, machine-readable JSON backup dump of the workspace database schema rows. Highly suitable for data migrations, audits, and pipeline inputs.
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={handleExportJSON}
              className="cursor-pointer"
            >
              Download JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
