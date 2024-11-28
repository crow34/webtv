import React from 'react';
import { Tv } from 'lucide-react';
import { Channel, ChannelGroup } from '../types/channel';

interface Props {
  channelGroups: ChannelGroup[];
  selectedChannel?: Channel;
  selectedGroup?: string;
  onSelectChannel: (channel: Channel) => void;
  onSelectGroup: (group: string) => void;
}

export function ChannelList({
  channelGroups,
  selectedChannel,
  selectedGroup,
  onSelectChannel,
  onSelectGroup,
}: Props) {
  return (
    <div className="w-72 bg-[#2a2a2a] flex flex-col">
      {/* Category selector */}
      <div className="p-4 border-b border-gray-800">
        <select
          value={selectedGroup}
          onChange={(e) => onSelectGroup(e.target.value)}
          className="w-full bg-[#1e1e1e] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {channelGroups.map((group) => (
            <option key={group.name} value={group.name}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {channelGroups
          .find((group) => group.name === selectedGroup)
          ?.channels.map((channel) => (
            <button
              key={channel.id}
              className={`w-full p-4 text-left hover:bg-[#363636] transition-colors ${
                selectedChannel?.id === channel.id ? 'bg-[#363636]' : ''
              }`}
              onClick={() => onSelectChannel(channel)}
            >
              <div className="flex items-center gap-3">
                {channel.logo ? (
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-10 h-10 object-contain rounded bg-black p-1"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.className = 'hidden';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-purple-600 rounded">
                    <Tv size={20} className="text-white" />
                  </div>
                )}
                <div>
                  <div className="text-white text-sm font-medium">{channel.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5">Now Playing</div>
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}