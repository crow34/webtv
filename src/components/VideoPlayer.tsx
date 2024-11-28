import React from 'react';
import ReactPlayer from 'react-player';
import { Channel } from '../types/channel';
import { Tv } from 'lucide-react';

interface Props {
  channel?: Channel;
}

export function VideoPlayer({ channel }: Props) {
  if (!channel) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center flex-col">
        <Tv size={48} className="text-gray-600 mb-4" />
        <p className="text-gray-500 text-lg">Select a channel to start watching</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black relative">
      <ReactPlayer
        url={channel.url}
        width="100%"
        height="100%"
        playing
        controls
        config={{
          file: {
            forceHLS: true,
            attributes: {
              crossOrigin: "anonymous"
            }
          }
        }}
      />
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1.5 rounded-lg">
        <span className="text-white font-medium">{channel.name}</span>
      </div>
    </div>
  );
}