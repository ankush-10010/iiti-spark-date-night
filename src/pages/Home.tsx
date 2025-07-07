import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, MessageCircle, Settings, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";

interface Profile {
  id: string;
  username: string;
  gender: string;
  bio: string;
  interests: string[];
  year_of_study: number;
  looking_for: string;
  profile_image: string;
}

interface Match {
  id: number;
  user1: string;
  user2: string;
  created_at: string;
  profile: Profile;
}

const Home = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMatches, setShowMatches] = useState(false);
  const [chatProfile, setChatProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get chat state from URL parameters
  const chatUserId = searchParams.get('chat');
  const view = searchParams.get('view') || 'discover';

  useEffect(() => {
    if (!profile) {
      navigate('/create-profile');
      return;
    }
    
    fetchProfiles();
    fetchMatches();
  }, [profile, navigate]);

  // Handle URL-based chat state
  useEffect(() => {
    if (chatUserId && matches.length > 0) {
      const matchedProfile = matches.find(match => match.profile.id === chatUserId)?.profile;
      if (matchedProfile) {
        setChatProfile(matchedProfile);
      }
    } else if (!chatUserId) {
      setChatProfile(null);
    }
  }, [chatUserId, matches]);

  // Handle URL-based view state
  useEffect(() => {
    setShowMatches(view === 'matches');
  }, [view]);

  const fetchProfiles = async () => {
    if (!user) return;

    try {
      // Get already liked user IDs
      const { data: likes } = await supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', user.id);

      const likedUserIds = likes?.map(like => like.to_user) || [];

      // Fetch profiles excluding own and already liked
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .not('id', 'in', `(${likedUserIds.length > 0 ? likedUserIds.join(',') : '""'})`);

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1.eq.${user.id},user2.eq.${user.id}`);

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      // Get profiles for matches
      const processedMatches = [];
      for (const match of matchesData || []) {
        const otherUserId = match.user1 === user.id ? match.user2 : match.user1;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        if (profile) {
          processedMatches.push({
            ...match,
            profile
          });
        }
      }

      setMatches(processedMatches);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLike = async () => {
    if (!user || currentIndex >= profiles.length) return;

    const targetProfile = profiles[currentIndex];

    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          from_user: user.id,
          to_user: targetProfile.id
        });

      if (error) {
        console.error('Error liking profile:', error);
        toast.error('Failed to like profile');
        return;
      }

      // Check if it's a match
      const { data: mutualLike } = await supabase
        .from('likes')
        .select('*')
        .eq('from_user', targetProfile.id)
        .eq('to_user', user.id)
        .single();

      if (mutualLike) {
        toast.success("It's a match! 🎉");
        fetchMatches(); // Refresh matches
      }

      nextProfile();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleShowMatches = (show: boolean) => {
    setShowMatches(show);
    const newSearchParams = new URLSearchParams(searchParams);
    if (show) {
      newSearchParams.set('view', 'matches');
    } else {
      newSearchParams.set('view', 'discover');
    }
    // Remove chat parameter when switching views
    newSearchParams.delete('chat');
    setSearchParams(newSearchParams);
  };

  const handleOpenChat = (profile: Profile) => {
    setChatProfile(profile);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('chat', profile.id);
    newSearchParams.set('view', 'matches');
    setSearchParams(newSearchParams);
  };

  const handleCloseChat = () => {
    setChatProfile(null);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('chat');
    setSearchParams(newSearchParams);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/landing');
  };

  const filteredMatches = matches.filter(match =>
    match.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  // Telegram-style layout when matches view is active
  if (showMatches) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left Sidebar - Matches List */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="text-primary" size={24} />
                <span className="font-bold gradient-text">Campus Connect</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                  <Settings size={18} />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut size={18} />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex border-b border-border">
            <Button
              variant={showMatches ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => handleShowMatches(true)}
            >
              <MessageCircle size={16} className="mr-2" />
              Matches ({matches.length})
            </Button>
            <Button
              variant={!showMatches ? "default" : "ghost"}
              className="flex-1 rounded-none"
              onClick={() => handleShowMatches(false)}
            >
              Discover
            </Button>
          </div>

          {/* Matches List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredMatches.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No matches found' : 'No matches yet. Keep swiping!'}
                  </p>
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => handleOpenChat(match.profile)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      chatProfile?.id === match.profile.id ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={match.profile.profile_image} />
                      <AvatarFallback>{match.profile.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{match.profile.username}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        Matched on {new Date(match.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {chatProfile?.id === match.profile.id && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1 flex flex-col">
          {chatProfile ? (
            <ChatWindow
              chatProfile={{
                id: chatProfile.id,
                username: chatProfile.username,
                profile_image: chatProfile.profile_image,
              }}
              onBack={handleCloseChat}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a chat to start messaging</h3>
                <p className="text-muted-foreground">Choose from your matches on the left to begin a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original discovery view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Heart className="text-primary" size={24} />
          <span className="font-bold gradient-text">Campus Connect</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowMatches(true)}
            className="relative"
          >
            <MessageCircle size={20} />
            {matches.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                {matches.length}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <Settings size={20} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-md">
        {/* Profile Discovery */}
        <div className="relative h-[600px] flex items-center justify-center">
          <AnimatePresence>
            {currentProfile ? (
              <motion.div
                key={currentProfile.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0, x: -300 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm"
              >
                <Card className="card-gradient overflow-hidden">
                  <div className="aspect-square relative">
                    {currentProfile.profile_image ? (
                      <img
                        src={currentProfile.profile_image}
                        alt={currentProfile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <Avatar className="h-24 w-24">
                          <AvatarFallback className="text-2xl">
                            {currentProfile.username[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold">{currentProfile.username}</h2>
                        <p className="text-muted-foreground">
                          Year {currentProfile.year_of_study} • Looking for {currentProfile.looking_for}
                        </p>
                      </div>
                      
                      {currentProfile.bio && (
                        <p className="text-sm">{currentProfile.bio}</p>
                      )}
                      
                      {currentProfile.interests.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Interests</p>
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.interests.map((interest, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">No more profiles</h2>
                <p className="text-muted-foreground">Check back later for new connections!</p>
              </div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {currentProfile && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-4 mb-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePass}
                className="rounded-full h-14 w-14 p-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <X size={24} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleLike}
                className="rounded-full h-14 w-14 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Heart size={24} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;