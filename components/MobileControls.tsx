
"use client";

import { useEffect, useState } from "react";
import { isMobile } from "@/lib/game-utils";

/**
 * MobileControls
 * Renders a visual overlay for touch zones.
 * It strictly acts as a visual guide and input trigger helper.
 *
 * Layout:
 * - Left 50% Screen: Move Left
 * - Right 50% Screen: Move Right
 * - Bottom Center: Action (Jump/Shoot)
 */
export const MobileControls = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show on touch devices
        if (typeof window !== 'undefined' && ('ontouchstart' in window || isMobile())) {
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    // We simulate key presses for the visual feedback,
    // but the actual input logic is handled by the unified event listeners in GameRunnerPage
    // This component is mostly purely visual cues + some direct button helpers if needed.
    // However, since we map "touchstart" on the canvas globally, these buttons are
    // effectively just visual indicators of the "Zones".

    return (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end pb-8">
            <div className="w-full h-1/2 flex justify-between px-4 items-end">
                {/* D-Pad Left Visual */}
                <div className="w-24 h-24 border-2 border-white/20 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-sm">
                    <span className="font-press-start text-white/50 text-2xl">←</span>
                </div>

                {/* Action Button Visual */}
                <div className="w-24 h-24 border-2 border-arcade-pink/30 rounded-full flex items-center justify-center bg-arcade-pink/10 backdrop-blur-sm mb-12 animate-pulse">
                    <span className="font-press-start text-arcade-pink/80 text-xl">A</span>
                </div>

                {/* D-Pad Right Visual */}
                <div className="w-24 h-24 border-2 border-white/20 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-sm">
                    <span className="font-press-start text-white/50 text-2xl">→</span>
                </div>
            </div>

            <div className="absolute bottom-2 w-full text-center">
                <p className="font-vt323 text-white/30 text-lg">VIRTUAL CONTROLS ENGAGED</p>
            </div>
        </div>
    );
};
