import React from 'react';
import { format } from 'date-fns';
import { Program } from '../types/channel';
import { Calendar } from 'lucide-react';

interface Props {
  programs: Program[];
  channelId?: string;
}

export function ProgramGuide({ programs, channelId }: Props) {
  const channelPrograms = programs.filter(
    (program) => program.channelId === channelId
  );

  const currentTime = new Date();
  const currentProgram = channelPrograms.find(
    (program) => program.start <= currentTime && program.end >= currentTime
  );

  return (
    <div className="h-48 bg-[#2a2a2a] border-t border-gray-800 overflow-hidden flex flex-col">
      {channelId ? (
        <>
          <div className="flex items-center justify-between px-4 py-2 bg-[#363636]">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Calendar size={16} />
              Program Guide
            </h3>
            {currentProgram && (
              <span className="text-purple-400 text-sm">
                Now: {currentProgram.title}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {channelPrograms.map((program) => (
                <div
                  key={program.id}
                  className={`bg-[#363636] p-3 rounded-lg ${
                    currentProgram?.id === program.id
                      ? 'border-l-4 border-purple-500'
                      : ''
                  }`}
                >
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>{format(program.start, 'HH:mm')}</span>
                    <span>{format(program.end, 'HH:mm')}</span>
                  </div>
                  <h4 className="text-white font-medium">{program.title}</h4>
                  {program.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {program.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
          <Calendar size={24} />
          <span>Select a channel to view its program guide</span>
        </div>
      )}
    </div>
  );
}