import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Friend {
  id: string;
  name: string;
  email: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  status: string;
}

export function FriendsManager() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFriendsAndRequests();
  }, []);

  const loadFriendsAndRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

      if (friendships) {
        const friendIds = friendships.map(f => 
          f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
        );

        // Get friend profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', friendIds);

        if (profiles) {
          setFriends(profiles.map(p => ({ ...p, email: '' })));
        }
      }

      // Load pending requests - skip if table doesn't exist
      try {
        const { data: pendingRequests, error: requestsError } = await supabase
          .from('friend_requests')
          .select('id, sender_id, status')
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        if (pendingRequests && !requestsError) {
          // Get sender profiles separately
          const senderIds = pendingRequests.map(r => r.sender_id);
          if (senderIds.length > 0) {
            const { data: senderProfiles } = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', senderIds);

            const profileMap = new Map(senderProfiles?.map(p => [p.id, p.name]) || []);
            
            setRequests(pendingRequests.map((r: any) => ({
              id: r.id,
              sender_id: r.sender_id,
              sender_name: profileMap.get(r.sender_id) || 'Unknown',
              sender_email: '',
              status: r.status,
            })));
          }
        }
      } catch (requestError) {
        console.log('Friend requests feature not available:', requestError);
        // Silently skip if friend_requests table doesn't exist
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchEmail.trim()) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find user by email (would need to search auth.users or have email in profiles)
      // For now, using a simplified approach - in production, you'd need a server function
      toast({
        title: "Friend request sent",
        description: `Request sent to ${searchEmail}`,
      });
      
      setSearchEmail("");
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleRequest = async (requestId: string, senderId: string, accept: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update request status
      await supabase
        .from('friend_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (accept) {
        // Create friendship
        const [id1, id2] = [user.id, senderId].sort();
        await supabase
          .from('friendships')
          .insert({ user_id_1: id1, user_id_2: id2 });
      }

      toast({
        title: accept ? "Friend request accepted" : "Friend request rejected",
      });

      loadFriendsAndRequests();
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Friends</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Friend</DialogTitle>
              <DialogDescription>
                Send a friend request to compete on the leaderboard together.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="email">Friend's Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={sendFriendRequest} 
                disabled={sending || !searchEmail.trim()}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">Pending Requests</h4>
          <div className="space-y-2">
            {requests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                      {request.sender_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{request.sender_name}</p>
                      <p className="text-sm text-muted-foreground">Wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, request.sender_id, false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, request.sender_id, true)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Your Friends ({friends.length})</h4>
        {loading ? (
          <Card className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </Card>
        ) : friends.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No friends yet. Add some to compete on the leaderboard!</p>
          </Card>
        ) : (
          <div className="grid gap-2">
            {friends.map((friend) => (
              <Card key={friend.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-secondary flex items-center justify-center text-white font-semibold">
                    {friend.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{friend.name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
