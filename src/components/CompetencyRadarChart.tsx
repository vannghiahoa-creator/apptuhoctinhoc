import React from 'react';

interface CompetencyData {
  logic: number; // 0 - 100
  debug: number; // 0 - 100
  safety: number; // 0 - 100
  hardware: number; // 0 - 100
}

interface CompetencyRadarChartProps {
  data: CompetencyData;
  studentName?: string;
  size?: number;
}

export const CompetencyRadarChart: React.FC<CompetencyRadarChartProps> = ({
  data,
  studentName,
  size = 280,
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.72;

  // 4 axes: top (logic), right (debug), bottom (safety), left (hardware)
  const axes = [
    { key: 'logic', label: 'Tư duy logic', value: Math.min(100, Math.max(15, data.logic)), angle: -Math.PI / 2, icon: '🧠', color: '#3b82f6' },
    { key: 'debug', label: 'Phân tích lỗi', value: Math.min(100, Math.max(15, data.debug)), angle: 0, icon: '🐞', color: '#a855f7' },
    { key: 'safety', label: 'An toàn số', value: Math.min(100, Math.max(15, data.safety)), angle: Math.PI / 2, icon: '🛡️', color: '#10b981' },
    { key: 'hardware', label: 'Thao tác máy tính', value: Math.min(100, Math.max(15, data.hardware)), angle: Math.PI, icon: '⌨️', color: '#f59e0b' },
  ];

  // Helper to compute (x, y) for an angle and distance
  const getPoint = (angle: number, distance: number) => {
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Concentric polygon grid levels: 25%, 50%, 75%, 100%
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Data polygon points string
  const dataPolygonPoints = axes
    .map((axis) => {
      const pt = getPoint(axis.angle, (axis.value / 100) * radius);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Radial Background & Concentric Grids */}
        {levels.map((lvl) => {
          const gridPoints = axes
            .map((axis) => {
              const pt = getPoint(axis.angle, lvl * radius);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={gridPoints}
              fill={lvl === 1.0 ? '#f8fafc' : 'none'}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray={lvl < 1.0 ? '3,3' : 'none'}
            />
          );
        })}

        {/* Cross Axes lines */}
        {axes.map((axis) => {
          const endPt = getPoint(axis.angle, radius);
          return (
            <line
              key={axis.key}
              x1={center}
              y1={center}
              x2={endPt.x}
              y2={endPt.y}
              stroke="#94a3b8"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Filled Data Area */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data vertex dots */}
        {axes.map((axis) => {
          const pt = getPoint(axis.angle, (axis.value / 100) * radius);
          return (
            <g key={axis.key}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill={axis.color}
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-xs"
              />
              <text
                x={pt.x}
                y={pt.y - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#1e293b"
              >
                {axis.value}%
              </text>
            </g>
          );
        })}

        {/* Axis Labels outside */}
        {axes.map((axis) => {
          const labelDist = radius + 24;
          const pt = getPoint(axis.angle, labelDist);
          let textAnchor = 'middle';
          if (axis.angle === 0) textAnchor = 'start';
          if (axis.angle === Math.PI) textAnchor = 'end';

          return (
            <g key={`lbl-${axis.key}`} transform={`translate(${pt.x}, ${pt.y})`}>
              <text
                textAnchor={textAnchor}
                fontSize="11"
                fontWeight="800"
                fill="#334155"
                dy="4"
              >
                {axis.icon} {axis.label}
              </text>
            </g>
          );
        })}
      </svg>

      {studentName && (
        <span className="text-xs font-bold text-slate-500 mt-2">
          Biểu đồ năng lực: <strong className="text-indigo-600">{studentName}</strong>
        </span>
      )}
    </div>
  );
};
