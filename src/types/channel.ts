export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string;
}

export interface Program {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  channelId: string;
}

export interface ChannelGroup {
  name: string;
  channels: Channel[];
}