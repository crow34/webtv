import { Channel, ChannelGroup } from '../types/channel';

export function groupChannels(channels: Channel[]): ChannelGroup[] {
  const groupMap = new Map<string, Channel[]>();

  channels.forEach(channel => {
    const group = channel.group;
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)?.push(channel);
  });

  return Array.from(groupMap.entries())
    .map(([name, channels]) => ({
      name,
      channels: channels.sort((a, b) => a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}