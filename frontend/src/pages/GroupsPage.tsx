import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, DollarSign, Handshake, Mail, Coins, X } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../components/UI/Toast';
import { formatCurrency } from '../utils/currency';
import useAuthStore from '../store/authStore';

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthStore();

  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  // Forms State
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ 
    title: '', 
    amount: '', 
    date: new Date().toISOString().substring(0, 10) 
  });

  // Queries
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.getGroups()
  });

  const { data: groupDetails, isLoading: detailsLoading, refetch: refetchDetails } = useQuery({
    queryKey: ['group-details', selectedGroup?.id],
    queryFn: () => api.getGroupDetails(selectedGroup.id),
    enabled: !!selectedGroup?.id
  });

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: (name: string) => api.createGroup({ name }),
    onSuccess: () => {
      showToast('Shared Group created!', 'success');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewGroupName('');
      setShowNewGroup(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create group', 'error');
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: (email: string) => api.addGroupMember(selectedGroup.id, { email }),
    onSuccess: () => {
      showToast('Member added successfully!', 'success');
      refetchDetails();
      setNewMemberEmail('');
      setShowAddMember(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to add member', 'error');
    }
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data: any) => api.addGroupExpense(selectedGroup.id, data),
    onSuccess: () => {
      showToast('Expense recorded & split equally!', 'success');
      refetchDetails();
      setExpenseForm({ title: '', amount: '', date: new Date().toISOString().substring(0, 10) });
      setShowAddExpense(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to log shared expense', 'error');
    }
  });

  const settleMutation = useMutation({
    mutationFn: ({ paidToId, amount }: { paidToId: string; amount: number }) => 
      api.addGroupSettlement(selectedGroup.id, {
        paid_to_user_id: paidToId,
        amount,
        date: new Date().toISOString().substring(0, 10)
      }),
    onSuccess: () => {
      showToast('Settlement logged successfully!', 'success');
      refetchDetails();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to log settlement', 'error');
    }
  });

  // Handlers
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate(newGroupName);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    addMemberMutation.mutate(newMemberEmail);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !groupDetails || !user) return;

    const totalAmount = parseFloat(expenseForm.amount);
    const splitAmount = totalAmount / groupDetails.members.length;

    const splits = groupDetails.members.map((m: any) => ({
      user_id: m.id,
      amount_owed: splitAmount
    }));

    addExpenseMutation.mutate({
      title: expenseForm.title,
      amount: totalAmount,
      date: new Date(expenseForm.date).toISOString(),
      paid_by_user_id: user.id,
      splits
    });
  };

  const handleSettleUp = (payeeId: string, amount: number) => {
    if (window.confirm(`Log settlement of ₹${amount.toFixed(2)} paid?`)) {
      settleMutation.mutate({ paidToId: payeeId, amount });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)] overflow-hidden fade-in-up">
      {/* Sidebar - Groups list */}
      <div className="premium-card w-full md:w-80 flex flex-col justify-between border-black/[0.05] dark:border-white/[0.05] p-4 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-black/[0.04] dark:border-white/[0.04] mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Shared Groups
            </h3>
            <button 
              onClick={() => setShowNewGroup(!showNewGroup)}
              className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-400 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNewGroup && (
            <form onSubmit={handleCreateGroup} className="p-3 mb-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] space-y-3">
              <input 
                type="text" 
                placeholder="e.g. Goa Trip, Flatmates" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                className="input-premium py-1.5 px-3 text-xs w-full"
                required 
                autoFocus 
              />
              <div className="flex gap-2 text-xs">
                <button type="submit" className="flex-1 btn-premium btn-premium-primary py-1 cursor-pointer">Create</button>
                <button type="button" className="flex-1 btn-premium btn-premium-secondary py-1 cursor-pointer" onClick={() => setShowNewGroup(false)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Scrolling group listing */}
          <div className="overflow-y-auto flex-1 space-y-2">
            {groupsLoading ? (
              <div className="text-center text-xs text-gray-400 py-6">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-10">No active shared workspaces found.</div>
            ) : (
              groups.map((g: any) => (
                <div 
                  key={g.id}
                  onClick={() => setSelectedGroup(g)}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors text-left
                    ${selectedGroup?.id === g.id 
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-semibold' 
                      : 'border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
                    }
                  `}
                >
                  <div className="text-sm">{g.name}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{g.member_count} members synced</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!selectedGroup ? (
          <div className="premium-card flex flex-col items-center justify-center text-center flex-1 border-black/[0.05] dark:border-white/[0.05] py-20">
            <Users className="w-12 h-12 text-gray-400 mb-3" />
            <h3 className="text-base font-semibold">Select Shared Group</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Establish trip trackers or split bills with members easily.</p>
          </div>
        ) : detailsLoading || !groupDetails ? (
          <div className="premium-card flex items-center justify-center flex-1">
            <span className="text-sm text-gray-400">Fetching group parameters...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden h-full">
            {/* Upper details summary */}
            <div className="premium-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-black/[0.05] dark:border-white/[0.05]">
              <div>
                <h2 className="text-xl font-bold">{groupDetails.group.name}</h2>
                <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{groupDetails.members.length} MEMBERS SYNCED</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="btn-premium btn-premium-secondary py-1.5 px-4 text-xs cursor-pointer"
                >
                  Add Member
                </button>
                <button 
                  onClick={() => setShowAddExpense(true)}
                  className="btn-premium btn-premium-primary py-1.5 px-4 text-xs cursor-pointer"
                >
                  Log Expense
                </button>
              </div>
            </div>

            {/* Member add popup */}
            {showAddMember && (
              <div className="premium-card p-4 border-emerald-500/20 bg-emerald-500/5">
                <form onSubmit={handleAddMember} className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 w-4 h-4 text-gray-400 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      placeholder="Enter register email (e.g. friend@example.com)" 
                      value={newMemberEmail} 
                      onChange={e => setNewMemberEmail(e.target.value)} 
                      className="input-premium pl-9 py-2 text-xs w-full bg-white dark:bg-[#151515]"
                      required 
                    />
                  </div>
                  <button type="submit" className="btn-premium btn-premium-primary py-2 text-xs cursor-pointer">Invite</button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddMember(false)} 
                    className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Shared Expense form */}
            {showAddExpense && (
              <div className="premium-card p-4 border-black/[0.05] dark:border-white/[0.05] space-y-4">
                <h4 className="text-sm font-semibold">Log Shared Expense</h4>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase font-semibold">Description</label>
                    <input 
                      type="text" 
                      value={expenseForm.title} 
                      onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} 
                      className="input-premium py-1.5 text-xs" 
                      placeholder="e.g. Dinner buffet"
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase font-semibold">Amount</label>
                    <input 
                      type="number" 
                      value={expenseForm.amount} 
                      onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                      className="input-premium py-1.5 text-xs" 
                      placeholder="0.00"
                      required 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 btn-premium btn-premium-primary py-2 text-xs cursor-pointer">Split Equal</button>
                    <button 
                      type="button" 
                      onClick={() => setShowAddExpense(false)}
                      className="btn-premium btn-premium-secondary py-2 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Split Details columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-0">
              
              {/* Balances panel */}
              <div className="premium-card flex flex-col justify-between border-black/[0.05] dark:border-white/[0.05] p-4 h-full overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">
                  <h3 className="text-sm font-bold flex items-center gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.04] mb-3">
                    <Handshake className="w-4 h-4 text-emerald-500" />
                    Ledger Balances
                  </h3>
                  <div className="overflow-y-auto flex-1 divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {user && Object.keys(groupDetails.balances[user.id] || {}).map(otherId => {
                      const amount = groupDetails.balances[user.id][otherId];
                      if (amount === 0) return null;
                      const otherUser = groupDetails.members.find((m: any) => m.id == otherId);
                      if (!otherUser) return null;
                      const absAmount = Math.abs(amount);
                      
                      return (
                        <div key={otherId} className="flex justify-between items-center py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-semibold">
                              {otherUser.name.charAt(0)}
                            </div>
                            <div className="text-xs">
                              {amount > 0 ? (
                                <span>You owe <strong className="font-semibold">{otherUser.name}</strong></span>
                              ) : (
                                <span><strong className="font-semibold">{otherUser.name}</strong> owes you</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold font-sans ${amount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              ₹{absAmount.toFixed(2)}
                            </span>
                            {amount > 0 && (
                              <button 
                                onClick={() => handleSettleUp(otherId, absAmount)}
                                className="btn-premium btn-premium-secondary py-1 px-2.5 text-[10px] font-semibold cursor-pointer"
                              >
                                Settle Up
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {user && Object.values(groupDetails.balances[user.id] || {}).every(amt => amt === 0) && (
                      <div className="text-center text-xs text-gray-400 py-10">You are completely settled up with this group!</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions log panel */}
              <div className="premium-card flex flex-col justify-between border-black/[0.05] dark:border-white/[0.05] p-4 h-full overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">
                  <h3 className="text-sm font-bold flex items-center gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.04] mb-3">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Group Ledgers
                  </h3>
                  <div className="overflow-y-auto flex-1 divide-y divide-black/[0.04] dark:divide-white/[0.04] space-y-2">
                    {groupDetails.expenses.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-10">No transactions recorded.</div>
                    ) : (
                      groupDetails.expenses.map((exp: any) => (
                        <div key={exp.id} className="flex justify-between items-center py-2.5">
                          <div>
                            <div className="text-xs font-semibold">{exp.title}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              Paid by {user && exp.paid_by_user_id === user.id ? 'You' : exp.paid_by_name} • {new Date(exp.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs font-bold font-sans">₹{Number(exp.amount).toFixed(2)}</div>
                        </div>
                      ))
                    )}

                    {/* Settlements list */}
                    {groupDetails.settlements && groupDetails.settlements.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
                        <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Settlement records</h4>
                        {groupDetails.settlements.slice(0, 4).map((s: any) => (
                          <div key={s.id} className="text-[10px] text-gray-400 bg-black/[0.01] dark:bg-white/[0.01] p-2 rounded-lg border border-black/[0.02] dark:border-white/[0.02]">
                            <strong>{user && s.paid_by_user_id === user.id ? 'You' : s.paid_by_name}</strong> paid <strong>{user && s.paid_to_user_id === user.id ? 'You' : s.paid_to_name}</strong> ₹{Number(s.amount).toFixed(2)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
