import { Channel } from '../types/channel';
import { fetchWithRetry } from './fetchUtils';
import { DEFAULT_GROUP, DEFAULT_CHANNEL_NAME } from '../config/constants';

export async function parseM3U(url: string): Promise<Channel[]> {
  try {
    const response = await fetchWithRetry(url);
    const text = await response.text();

    if (!text.trim()) {
      throw new Error('Empty M3U file received');
    }

    if (!text.includes('#EXTM3U')) {
      throw new Error('Invalid M3U format: Missing #EXTM3U header');
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const channels: Channel[] = [];
    let currentChannel: Partial<Channel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        try {
          // Handle different M3U formats
          const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
          const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
          const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
          const groupTitleMatch = line.match(/group-title="([^"]*)"/);
          const channelNameMatch = line.match(/,(.*)$/);

          const channelName = channelNameMatch?.[1]?.trim() || '';
          
          currentChannel = {
            id: tvgIdMatch?.[1] || String(channels.length + 1),
            name: tvgNameMatch?.[1] || channelName || DEFAULT_CHANNEL_NAME,
            logo: tvgLogoMatch?.[1] || '',
            group: groupTitleMatch?.[1] || DEFAULT_GROUP
          };
        } catch (error) {
          console.warn('Error parsing EXTINF line:', error);
          currentChannel = {};
          continue;
        }
      } else if (line.startsWith('http')) {
        try {
          if (Object.keys(currentChannel).length > 0) {
            // Validate URL
            new URL(line);
            
            channels.push({
              ...currentChannel,
              url: line,
              id: currentChannel.id || String(channels.length + 1),
              name: currentChannel.name || DEFAULT_CHANNEL_NAME,
              logo: currentChannel.logo || '',
              group: currentChannel.group || DEFAULT_GROUP
            } as Channel);
          }
        } catch (error) {
          console.warn('Invalid channel URL:', error);
        }
        currentChannel = {};
      }
    }

    if (channels.length === 0) {
      throw new Error('No valid channels found in M3U file');
    }

    console.log(`Successfully parsed ${channels.length} channels`);
    return channels;
  } catch (error) {
    console.error('Error parsing M3U:', error);
    throw error;
  }
}