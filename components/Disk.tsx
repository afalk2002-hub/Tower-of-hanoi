import React from 'react';

interface DiskProps {
  size: number;
  totalDisks: number;
  isTop: boolean;
  isSelected: boolean;
}

const DiskComponent: React.FC<DiskProps> = ({ size, totalDisks, isTop, isSelected }) => {
  // Calculate width percentage based on size (1 is smallest, totalDisks is largest)
  // Base width 20%, max width 100%
  const widthPercentage = 20 + (size / totalDisks) * 80;
  
  // Dynamic color based on size index to create a rainbow/gradient effect
  const hue = Math.floor((size / totalDisks) * 360);
  
  return (
    <div
      className={`
        h-8 rounded-full shadow-lg border-2 border-slate-900/20 backdrop-blur-sm
        transition-all duration-300 ease-in-out
        flex items-center justify-center text-xs font-bold text-white/50
        ${isSelected ? 'transform -translate-y-4 shadow-xl ring-2 ring-white/50' : ''}
        ${isTop ? 'cursor-pointer hover:brightness-110' : ''}
      `}
      style={{
        width: `${widthPercentage}%`,
        backgroundColor: `hsl(${hue}, 70%, 50%)`,
        boxShadow: isSelected ? `0 0 20px hsl(${hue}, 70%, 50%)` : 'none'
      }}
    >
      <span className="sr-only">Disk {size}</span>
      {/* Optional: Show number on larger disks */}
      {size}
    </div>
  );
};

export default DiskComponent;
