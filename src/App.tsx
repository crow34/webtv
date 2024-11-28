import React, { useEffect, useState } from 'react';
import { Channel, Program, ChannelGroup } from './types/channel';
import { parseM3U } from './utils/m3uParser';
import { parseEPG } from './utils/epgParser';
import { ChannelList } from './components/ChannelList';
import { VideoPlayer } from './components/VideoPlayer';
import { ProgramGuide } from './components/ProgramGuide';
import { Header } from './components/Header';
import { M3U_URL, EPG_URL } from './config/constants';
import { groupChannels } from './utils/channelUtils';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function loadData() {
      try {
        setLoading(true);
        setError(undefined);

        // Load M3U data with retry logic
        try {
          const channelData = await parseM3U(M3U_URL);
          if (!mounted) return;
          
          if (channelData.length === 0) {
            throw new Error('No channels found in the M3U file');
          }

          setChannels(channelData);
          const groups = groupChannels(channelData);
          setChannelGroups(groups);
          setSelectedGroup(groups[0]?.name);
          
          // Reset retry count on success
          setRetryCount(0);
        } catch (err) {
          console.error('M3U loading error:', err);
          if (!mounted) return;
          
          if (retryCount < 3) {
            setError('Loading channels... Retrying...');
            setRetryCount(prev => prev + 1);
            retryTimeout = setTimeout(() => loadData(), 5000);
            return;
          }
          
          setError('Unable to load channels. Please try again later.');
          return;
        }

        // Load EPG data
        try {
          const programData = await parseEPG(EPG_URL);
          if (!mounted) return;
          setPrograms(programData);
        } catch (err) {
          console.error('EPG loading error:', err);
          // Don't fail the whole app if EPG fails
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading your channels...</p>
          <p className="text-sm text-gray-400 mt-2">
            {error || 'Please wait while we prepare your viewing experience'}
          </p>
        </div>
      </div>
    );
  }

  if (error && !channels.length) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-[#2a2a2a] rounded-xl shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Channel Loading Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => setRetryCount(0)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1e1e1e] flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ChannelList
          channelGroups={channelGroups}
          selectedChannel={selectedChannel}
          selectedGroup={selectedGroup}
          onSelectChannel={setSelectedChannel}
          onSelectGroup={setSelectedGroup}
        />
        <div className="flex-1 flex flex-col">
          <VideoPlayer channel={selectedChannel} />
          <ProgramGuide
            programs={programs}
            channelId={selectedChannel?.id}
          />
        </div>
      </div>
    </div>
  );
}