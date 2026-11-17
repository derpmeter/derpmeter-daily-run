import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface RadarChartProps {
    data: { label: string; value: number }[]; // Value between 0 and 100
    size?: number;
    color?: string; // Hex color for the filled area
    labelColor?: string;
    gridColor?: string;
}

export function RadarChart({
    data,
    size = 200,
    color = '#a855f7', // Purple-500 default
    labelColor = '#9ca3af',
    gridColor = 'rgba(255, 255, 255, 0.1)',
}: RadarChartProps) {
    const center = size / 2;
    const radius = (size / 2) * 0.7; // Leave valid margin for labels
    const angleStep = (Math.PI * 2) / data.length;

    // Helper to calculate coordinates
    const getCoordinates = (value: number, index: number, maxVal: number = 100) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top (-90 deg)
        const r = (value / maxVal) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    const points = useMemo(() => {
        return data.map((d, i) => getCoordinates(d.value, i));
    }, [data, radius, center]);

    const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

    // Grid polylines (0%, 25%, 50%, 75%, 100%)
    const gridLevels = [0.25, 0.5, 0.75, 1];

    return (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
            <svg width={size} height={size}>
                {/* Background Grids */}
                {gridLevels.map((level, idx) => {
                    const gridPoints = data.map((_, i) => {
                        const coords = getCoordinates(100 * level, i);
                        return `${coords.x},${coords.y}`;
                    }).join(' ');

                    return (
                        <polygon
                            key={idx}
                            points={gridPoints}
                            fill="transparent"
                            stroke={gridColor}
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Axes */}
                {data.map((_, i) => {
                    const end = getCoordinates(100, i);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={end.x}
                            y2={end.y}
                            stroke={gridColor}
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Data Polygon */}
                <motion.polygon
                    points={polygonPoints}
                    fill={color}
                    fillOpacity="0.4"
                    stroke={color}
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0, transformOrigin: 'center' }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                />

                {/* Point Dots */}
                {points.map((p, i) => (
                    <motion.circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        fill={color}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                    />
                ))}
            </svg>

            {/* Labels */}
            {data.map((d, i) => {
                // Push label slightly further out
                const coords = getCoordinates(125, i);
                // Simple offset based on alignment?
                const isTop = i === 0;
                const isBottom = i === 3;

                return (
                    <div
                        key={i}
                        className="absolute text-[10px] uppercase font-bold tracking-wider text-center"
                        style={{
                            left: coords.x,
                            top: coords.y,
                            transform: 'translate(-50%, -50%)',
                            color: labelColor
                        }}
                    >
                        {d.label}
                        <div className="text-[9px] opacity-60 font-normal">{d.value}</div>
                    </div>
                );
            })}
        </div>
    );
}
