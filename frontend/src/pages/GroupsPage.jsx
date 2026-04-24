import React, { useState, useEffect } from 'react';
import { Plus, Users, DollarSign, Handshake } from 'lucide-react';
import { api } from '../api/client';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../components/UI/Toast';

export const GroupsPage = () => {
  const { user } = useAppContext();
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms State
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', date: new Date().toISOString().substring(0, 10), splits: [] });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (err) {
      showToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (id) => {
    try {
      const data = await api.getGroupDetails(id);
      setGroupDetails(data);
    } catch (err) {
      showToast('Failed to load group details', 'error');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.createGroup({ name: newGroupName });
      setNewGroupName('');
      setShowNewGroup(false);
      showToast('Group created', 'success');
      fetchGroups();
    } catch (err) {
      showToast('Failed to create group', 'error');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.addGroupMember(selectedGroup.id, { email: newMemberEmail });
      setNewMemberEmail('');
      setShowAddMember(false);
      showToast('Member added', 'success');
      fetchGroupDetails(selectedGroup.id);
    } catch (err) {
      showToast(err.message || 'Failed to add member', 'error');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const totalAmount = parseFloat(expenseForm.amount);
      const splitAmount = totalAmount / groupDetails.members.length;
      
      const splits = groupDetails.members.map(m => ({
        user_id: m.id,
        amount_owed: splitAmount
      }));

      await api.addGroupExpense(selectedGroup.id, {
        title: expenseForm.title,
        amount: totalAmount,
        date: expenseForm.date,
        paid_by_user_id: user.id,
        splits
      });
      
      setExpenseForm({ title: '', amount: '', date: new Date().toISOString().substring(0, 10), splits: [] });
      setShowAddExpense(false);
      showToast('Expense added and split equally', 'success');
      fetchGroupDetails(selectedGroup.id);
    } catch (err) {
      showToast(err.message || 'Failed to add expense', 'error');
    }
  };

  const handleSettleUp = async (payeeId, amount) => {
    try {
      await api.addGroupSettlement(selectedGroup.id, {
        paid_to_user_id: payeeId,
        amount: amount,
        date: new Date().toISOString().substring(0, 10)
      });
      showToast('Settled up', 'success');
      fetchGroupDetails(selectedGroup.id);
    } catch (err) {
      showToast('Failed to settle up', 'error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 'var(--space-lg)', height: 'calc(100vh - var(--header-height) - var(--space-2xl))' }}>
      
      {/* Sidebar - Group List */}
      <div className="glass-card" style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Shared Groups</h3>
          <button className="btn btn--icon btn--ghost" onClick={() => setShowNewGroup(true)}>
            <Plus size={18} />
          </button>
        </div>
        
        {showNewGroup && (
          <form onSubmit={handleCreateGroup} style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--glass-border)' }}>
            <input type="text" className="form-input mb-2" placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required autoFocus />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn--primary" style={{ flex: 1, padding: '6px' }}>Create</button>
              <button type="button" className="btn btn--secondary" style={{ flex: 1, padding: '6px' }} onClick={() => setShowNewGroup(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
             <div style={{ padding: 'var(--space-md)' }}>Loading...</div>
          ) : groups.length === 0 ? (
             <div className="text-secondary" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>No groups yet. Create one to start sharing expenses.</div>
          ) : (
            groups.map(g => (
              <div 
                key={g.id} 
                onClick={() => { setSelectedGroup(g); fetchGroupDetails(g.id); }}
                style={{ 
                  padding: 'var(--space-md)', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid var(--glass-border)',
                  background: selectedGroup?.id === g.id ? 'var(--bg-input)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ fontWeight: 600 }}>{g.name}</div>
                <div className="text-secondary" style={{ fontSize: '0.8125rem' }}>{g.member_count} Members</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Group Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedGroup ? (
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={48} className="text-muted mb-4" />
            <h3>Select or create a group</h3>
            <p className="text-secondary">Share expenses, split bills, and settle up easily.</p>
          </div>
        ) : !groupDetails ? (
          <div className="glass-card" style={{ flex: 1, padding: 'var(--space-xl)' }}>Loading details...</div>
        ) : (
          <>
            {/* Header & Actions */}
            <div className="glass-card mb-4" style={{ padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>{groupDetails.group.name}</h2>
                <div className="text-secondary mt-1">{groupDetails.members.length} Members</div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn--secondary" onClick={() => setShowAddMember(true)}>Add Member</button>
                <button className="btn btn--primary" onClick={() => setShowAddExpense(true)}>Add Expense</button>
              </div>
            </div>

            {showAddMember && (
              <div className="glass-card mb-4" style={{ padding: 'var(--space-md)' }}>
                <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px' }}>
                  <input type="email" className="form-input" placeholder="User Email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required style={{ flex: 1 }} />
                  <button type="submit" className="btn btn--primary">Add</button>
                  <button type="button" className="btn btn--ghost" onClick={() => setShowAddMember(false)}>Cancel</button>
                </form>
              </div>
            )}

            {showAddExpense && (
              <div className="glass-card mb-4" style={{ padding: 'var(--space-md)' }}>
                <h4>Add Shared Expense</h4>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>This expense will be split equally among all members.</p>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: '12px' }}>
                  <div style={{ flex: 2 }}>
                    <label className="form-label">Description</label>
                    <input type="text" className="form-input" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Amount</label>
                    <input type="number" step="0.01" min="0.01" className="form-input" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Date</label>
                    <input type="date" className="form-input" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn--primary" style={{ padding: '10px' }}>Save</button>
                  <button type="button" className="btn btn--ghost" style={{ padding: '10px' }} onClick={() => setShowAddExpense(false)}>Cancel</button>
                </form>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', flex: 1, minHeight: 0 }}>
              
              {/* Balances Section */}
              <div className="glass-card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 var(--space-md) 0' }}><Handshake size={20} style={{ display: 'inline', verticalAlign: 'sub', marginRight: '8px' }}/> Who Owes Whom</h3>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {Object.keys(groupDetails.balances[user.id] || {}).map(otherId => {
                    const amount = groupDetails.balances[user.id][otherId];
                    if (amount === 0) return null;
                    const otherUser = groupDetails.members.find(m => m.id == otherId);
                    const absAmount = Math.abs(amount);
                    
                    return (
                      <div key={otherId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px' }}>{otherUser.name.charAt(0)}</div>
                          <div>
                            {amount > 0 ? (
                              <span>You owe <strong>{otherUser.name}</strong></span>
                            ) : (
                              <span><strong>{otherUser.name}</strong> owes you</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontWeight: 700, color: amount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {formatCurrency(absAmount, user.base_currency)}
                          </span>
                          {amount > 0 && (
                            <button className="btn btn--secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => handleSettleUp(otherId, absAmount)}>
                              Settle Up
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(groupDetails.balances[user.id] || {}).every(amt => amt === 0) && (
                    <div className="text-secondary" style={{ textAlign: 'center', marginTop: '32px' }}>You are all settled up!</div>
                  )}
                </div>
              </div>

              {/* Expense Timeline */}
              <div className="glass-card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 var(--space-md) 0' }}><DollarSign size={20} style={{ display: 'inline', verticalAlign: 'sub', marginRight: '8px' }}/> Group Expenses</h3>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {groupDetails.expenses.length === 0 ? (
                    <div className="text-secondary" style={{ textAlign: 'center', marginTop: '32px' }}>No expenses recorded yet.</div>
                  ) : (
                    groupDetails.expenses.map(e => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{e.title}</div>
                          <div className="text-secondary" style={{ fontSize: '0.8125rem' }}>Paid by {e.paid_by_user_id === user.id ? 'You' : e.paid_by_name} on {new Date(e.date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ fontWeight: 700 }}>{formatCurrency(e.amount, user.base_currency)}</div>
                      </div>
                    ))
                  )}
                  {groupDetails.settlements.length > 0 && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                      <h4 className="text-secondary" style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Settlements</h4>
                      {groupDetails.settlements.slice(0, 5).map(s => (
                        <div key={s.id} style={{ padding: '8px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <strong>{s.paid_by_user_id === user.id ? 'You' : s.paid_by_name}</strong> paid <strong>{s.paid_to_user_id === user.id ? 'You' : s.paid_to_name}</strong> {formatCurrency(s.amount, user.base_currency)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};
