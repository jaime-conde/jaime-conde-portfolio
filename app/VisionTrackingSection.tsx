"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import VisionTrackingPanel from "./VisionTrackingPanel";

export default function VisionTrackingSection() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const aeroponics = document.getElementById("aeroponics");
    if (!aeroponics) return;

    const host = document.createElement("div");
    host.dataset.visionProjectHost = "true";
    aeroponics.insertAdjacentElement("afterend", host);
    setMount(host);

    return () => host.remove();
  }, []);

  if (!mount) return null;

  return createPortal(
    <section className="project shell" id="vision-tracking">
      <div className="stage-label"><b>▮</b> Specialized Project · Computer Vision & Tracking</div>
      <div className="project-grid">
        <div>
          <p className="project-number">CV</p>
          <h2>Tracking fast-moving targets with YOLO, ByteTrack, and Kalman filtering</h2>
        </div>
        <div className="project-body">
          <p>
            An independent computer-vision project focused on detecting and tracking small,
            fast-moving aerospace targets in video. I trained a custom YOLOv8 model, tuned
            ByteTrack for persistent target IDs, and built an OpenCV Kalman-filter model to
            explore position and velocity prediction under noisy measurements.
          </p>
          <div className="metrics">
            <div><strong>81.9%</strong><span>mAP@50</span></div>
            <div><strong>75.4%</strong><span>final recall</span></div>
            <div><strong>20</strong><span>validation epochs</span></div>
          </div>
          <div className="tags">
            <span>Python</span><span>OpenCV</span><span>YOLOv8</span><span>ByteTrack</span><span>Kalman filtering</span><span>Computer vision</span>
          </div>
        </div>
      </div>
      <VisionTrackingPanel />
    </section>,
    mount,
  );
}
