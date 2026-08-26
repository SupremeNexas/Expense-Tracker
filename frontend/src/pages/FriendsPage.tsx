import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, UserPlus, Check, X, Mail, Copy,
  Users, Share2, HelpCircle, ArrowRight, CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/UI/Toast';
import EmptyState from '../components/UI/EmptyState';

export default function FriendsPage() {
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCustom, setCopiedCustom] = useState(false);
  const [nonExistentEmail, setNonExistentEmail] = useState<string | null>(null);

  // Fetch friends (accepted friendships)
  const { data: friendsData, isLoading: friendsLoading, refetch: refetchFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: () => api.getFriends(),
    enabled: !!user
  });

  // Fetch pending friend requests
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['friends-pending'],
    queryFn: () => api.getPendingFriends(),
    enabled: !!user
  });

  // Mutation for sending friend request
  const sendRequestMutation = useMutation({
    mutationFn: (email: string) => api.sendFriendRequest(email),
    onSuccess: () => {
      showToast('Friend request sent!', 'success');
      setAddEmail('');
      setNonExistentEmail(null);
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
    onError: (error: any) => {
      if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
        setNonExistentEmail(addEmail);
        showToast("We couldn't find a user with that email. You can invite them instead!", "info");
      } else {
        showToast(error.message || 'Failed to send friend request', 'error');
      }
    }
  });

  // Mutation for accepting friend request
  const acceptFriendMutation = useMutation({
    mutationFn: (requestId: string) => api.acceptFriendRequest(requestId),
    onSuccess: () => {
      showToast('Friend request accepted!', 'success');
      refetchFriends();
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to accept friend request', 'error');
    }
  });

  // Mutation for rejecting friend request
  const rejectFriendMutation = useMutation({
    mutationFn: (requestId: string) => api.rejectFriendRequest(requestId),
    onSuccess: () => {
      showToast('Friend request rejected', 'success');
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to reject friend request', 'error');
    }
  });

  // Mutation for removing a friend
  const removeFriendMutation = useMutation({
    mutationFn: (friendshipId: string) => api.removeFriend(friendshipId),
    onSuccess: () => {
      showToast('Friend removed', 'success');
      refetchFriends();
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to remove friend', 'error');
    }
  });

  const friends = friendsData?.friends || [];
  const pendingRequests = pendingData?.pendingRequests || [];

  // Filter friends by search query
  const filteredFriends = friends.filter((f: any) => {
    const friendInfo = f.toUserId === user?.id ? f.fromUser : f.toUser;
    const friendName = friendInfo?.name || '';
    const friendEmail = friendInfo?.email || '';
    return friendName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           friendEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get the other user in a friendship
  const getFriendInfo = (friendship: any) => {
    if (friendship.fromUserId === user?.id) {
      return friendship.toUser || { name: 'Friend', email: 'N/A' };
    }
    return friendship.fromUser || { name: 'Friend', email: 'N/A' };
  };

  // Generate invitation link
  const personalInviteLink = `${window.location.origin}/auth?invitedBy=${encodeURIComponent(user?.email || '')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(personalInviteLink);
    setCopiedLink(true);
    showToast('Invitation link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCustomLink = (email: string) => {
    const customLink = `${window.location.origin}/auth?invitedBy=${encodeURIComponent(user?.email || '')}&inviteEmail=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(customLink);
    setCopiedCustom(true);
    showToast(`Invite link copied for ${email}!`, 'success');
    setTimeout(() => setCopiedCustom(false), 2000);
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    sendRequestMutation.mutate(addEmail.trim());
  };

  if (friendsLoading || pendingLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0C0C0C]">
        <div className="animate-pulse text-sm text-gray-500 font-medium">Fetching friend network...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] overflow-hidden fade-in-up">
      {/* Sidebar Area - Invite Friends & Pending Requests */}
      <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pb-4 pr-1">

        {/* ADD FRIEND CARD */}
        <div className="premium-card p-4 border-black/[0.05] dark:border-white/[0.05] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
            <UserPlus className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold">Add Friend</h3>
          </div>

          <form onSubmit={handleAddFriendSubmit} className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-semibold">User Email Address</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={addEmail}
                  onChange={e => {
                    setAddEmail(e.target.value);
                    if (nonExistentEmail) setNonExistentEmail(null);
                  }}
                  className="input-premium py-2 text-xs flex-1"
                  placeholder="e.g. friend@example.com"
                  required
                />
                <button
                  type="submit"
                  disabled={sendRequestMutation.isPending}
                  className="btn-premium btn-premium-primary text-xs py-2 px-4 cursor-pointer shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
          </form>

          {/* Invitation generator alert for non-existing users */}
          {nonExistentEmail && (
            <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs space-y-2">
              <p className="text-gray-500 dark:text-gray-400">
                <strong className="text-orange-500">{nonExistentEmail}</strong> is not registered. Send them a personal invite link to auto-connect!
              </p>
              <button
                onClick={() => handleCopyCustomLink(nonExistentEmail)}
                className="flex items-center justify-center gap-1.5 w-full btn-premium btn-premium-primary text-[10px] py-1.5 px-3 cursor-pointer"
              >
                {copiedCustom ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedCustom ? 'Copied Invite Link!' : 'Copy Private Invite URL'}
              </button>
            </div>
          )}
        </div>

        {/* PERSONAL INVITATION CARD */}
        <div className="premium-card p-4 border-black/[0.05] dark:border-white/[0.05] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
            <Share2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold">Invite Link</h3>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Share your invite link with your external peers. When they register using your link, you'll instantly connect as friends!
          </p>

          <div className="flex items-center gap-2 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] px-3 py-2.5 rounded-xl">
            <span className="text-[10px] font-mono text-gray-400 truncate flex-1 leading-none select-all">
              {personalInviteLink}
            </span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 hover:text-black dark:hover:text-white rounded-lg cursor-pointer transition-colors"
              title="Copy link to clipboard"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* PENDING REQUESTS CARD */}
        <div className="premium-card p-4 border-black/[0.05] dark:border-white/[0.05] flex-1 flex flex-col overflow-hidden min-h-[250px]">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.04] mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold">Pending Invites</h3>
            </div>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 uppercase tracking-wide">
                {pendingRequests.length} Req
              </span>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-black/[0.04] dark:divide-white/[0.04] pr-1">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-8 text-gray-400">
                <Mail className="w-7 h-7 stroke-[1.5] text-gray-300 mb-2" />
                <p className="text-[11px]">No inbound requests</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Inbox is clean!</p>
              </div>
            ) : (
              pendingRequests.map((request: any) => (
                <div key={request.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {request.fromUser?.name || 'New Member'}
                    </p>
                    <p className="text-[10px] text-gray-450 truncate">{request.fromUser?.email}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => acceptFriendMutation.mutate(request.id)}
                      disabled={acceptFriendMutation.isPending}
                      className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors"
                      title="Accept Request"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => rejectFriendMutation.mutate(request.id)}
                      disabled={rejectFriendMutation.isPending}
                      className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-650 hover:text-red-700 cursor-pointer transition-colors"
                      title="Reject Request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Main Area - List of friends */}
      <div className="flex-1 premium-card border-black/[0.05] dark:border-white/[0.05] p-4 h-full flex flex-col overflow-hidden">

        {/* Search bar & statistics Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/[0.04] dark:border-white/[0.04] mb-4 shrink-0">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Connected network
            </h2>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wider">
              {friends.length} active workspace connections
            </p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search friends by name/email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium pl-8 py-1.5 text-xs w-full"
            />
          </div>
        </div>

        {/* Scrolling list */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04] pr-1">
          {friends.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <Users className="w-12 h-12 text-gray-300 stroke-[1.5] mb-3" />
              <h3 className="text-sm font-semibold">Build Your Network</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
                Add friends using the sidebar input or copy your invite link to collaborate.
              </p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No matching friends found for "{searchQuery}".
            </div>
          ) : (
            filteredFriends.map((friendship: any) => {
              const friend = getFriendInfo(friendship);
              return (
                <div key={friendship.id} className="flex justify-between items-center py-3.5 hover:bg-black/[0.005] dark:hover:bg-white/[0.005] transition-colors rounded-xl px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-sm font-bold">
                      {friend.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{friend.name || 'Friend'}</p>
                      <p className="text-[10px] text-gray-450 mt-0.5">{friend.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove "${friend.name}" from friends?`)) {
                        removeFriendMutation.mutate(friendship.id);
                      }
                    }}
                    disabled={removeFriendMutation.isPending}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                    title="Remove Friend"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
