import React from 'react';
import { Disk as DiskType, TowerId } from '../types';
import DiskComponent from './Disk';

interface TowerProps {
  id: TowerId;
  disks: DiskType[];
  totalDisks: number;
  isSelected: boolean;
  isSource: boolean;
  onTowerClick: (id: TowerId) => void;
}

const Tower: React.FC<TowerProps> = ({ 
  id, 
  disks, 
  totalDisks, 
  isSelected, 
  isSource,
  onTowerClick 
}) => {
  const isTarget = isSelected && !isSource;

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-end h-64 w-full md:w-1/3 
        rounded-xl p-4 transition-colors duration-200 cursor-pointer
        ${isSource ? 'bg-indigo-900/20 ring-2 ring-indigo-500/50' : ''}
        ${isTarget ? 'bg-emerald-900/20 ring-2 ring-emerald-500/50' : ''}
        hover:bg-slate-800/50
      `}
      onClick={() => onTowerClick(id)}
    >
      {/* The Rod */}
      <div className="absolute bottom-0 w-2 h-48 bg-slate-700 rounded-t-lg z-0"></div>
      
      {/* Base */}
      <div className="absolute bottom-0 w-full h-2 bg-slate-700 rounded-full z-0"></div>

      {/* Disks Stack */}
      <div className="flex flex-col-reverse items-center w-full z-10 gap-1 mb-2">
        {disks.map((diskSize, index) => {
          // The disk is the top one if it's the last in the array
          const isTop = index === disks.length - 1;
          // It is selected if this tower is the source and this is the top disk
          const isDiskSelected = isSource && isTop;

          return (
            <DiskComponent
              key={diskSize}
              size={diskSize}
              totalDisks={totalDisks}
              isTop={isTop}
              isSelected={isDiskSelected}
            />
          );
        })}
      </div>

      {/* Label */}
      <div className="absolute -bottom-8 text-slate-400 font-mono text-sm">
        {id === 0 ? 'SOURCE' : id === 1 ? 'AUX' : 'TARGET'}
      </div>
    </div>
  );
};

export default Tower;
