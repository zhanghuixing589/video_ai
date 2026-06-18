import { useState, useRef } from 'react';

interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [spotlightPosition, setSpotlightPosition] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setSpotlightPosition({ x, y });
    };

    return (
        <div
            ref={cardRef}
    className={`linear-card ${className}`}
    onMouseMove={handleMouseMove}
    onMouseEnter={() => setIsHovering(true)}
    onMouseLeave={() => setIsHovering(false)}
    style={{ position: 'relative' }}
>
    {isHovering && (
        <div
            style={{
        position: 'absolute',
            inset: 0,
            borderRadius: '20px',
            background: `radial-gradient(circle at ${spotlightPosition.x}% ${spotlightPosition.y}%, rgba(0, 113, 227, 0.10), transparent 60%)`,
            pointerEvents: 'none',
            zIndex: 1,
    }}
        />
    )}
    {children}
    </div>
);
}
