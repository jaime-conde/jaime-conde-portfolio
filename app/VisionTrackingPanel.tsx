const map50 = [0.37489,0.41890,0.50646,0.48670,0.62812,0.58370,0.65366,0.64976,0.63385,0.64247,0.68368,0.73464,0.76517,0.73708,0.77745,0.77223,0.79134,0.78689,0.81017,0.81933];
const map5095 = [0.12624,0.16182,0.19280,0.20987,0.25908,0.23494,0.28027,0.27799,0.28125,0.27667,0.30071,0.32861,0.34694,0.33525,0.36645,0.37209,0.38465,0.38444,0.39882,0.40069];

const demos = [
  { src: "/portfolio/images/Missile_vid_output.mp4", label: "Tracking demo 01" },
  { src: "/portfolio/images/Missile_vid2_output.mp4", label: "Tracking demo 02" },
  { src: "/portfolio/images/Missile_vid4_output.mp4", label: "Tracking demo 03" },
];

const pointsFor = (values: number[]) => values.map((value, index) => {
  const x = 22 + (index / (values.length - 1)) * 356;
  const y = 136 - value * 128;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

export default function VisionTrackingPanel() {
  return (
    <div className="vision-panel">
      <style>{`
        .vision-panel{margin-top:2.5rem;border:1px solid rgba(125,190,219,.2);background:rgba(5,16,31,.72);padding:clamp(18px,3vw,34px);position:relative;overflow:hidden}.vision-panel:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(81,220,255,.035),transparent 38%,transparent 62%,rgba(81,220,255,.025))}.vision-demo-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:12px;position:relative}.vision-demo-head p{margin:0}.vision-demo-head span{font:10px/1.3 var(--font-geist-mono),monospace;color:#8796aa;text-transform:uppercase;letter-spacing:.1em}.vision-demos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:clamp(24px,4vw,40px);position:relative}.vision-demo{border:1px solid rgba(125,190,219,.18);background:rgba(3,8,18,.72);overflow:hidden}.vision-demo video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#030812}.vision-demo figcaption{display:flex;justify-content:space-between;gap:12px;padding:9px 10px;font:10px/1.25 var(--font-geist-mono),monospace;color:#8796aa;text-transform:uppercase;letter-spacing:.08em}.vision-demo figcaption b{font-weight:600;color:#51dcff}.vision-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);gap:clamp(22px,4vw,52px);position:relative}.vision-kicker{font:600 11px/1.3 var(--font-geist-mono),monospace;letter-spacing:.16em;color:#51dcff;text-transform:uppercase}.vision-pipeline{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0}.vision-step{border:1px solid rgba(125,190,219,.18);padding:14px 12px;background:rgba(9,25,48,.48)}.vision-step b{display:block;font:600 12px/1.2 var(--font-geist-mono),monospace;color:#eaf4ff}.vision-step span{display:block;margin-top:5px;font-size:12px;color:#8796aa}.vision-findings{margin:18px 0 0;padding:0;list-style:none;display:grid;gap:8px}.vision-findings li{padding-left:16px;position:relative;color:#a8b7c9;font-size:14px;line-height:1.55}.vision-findings li:before{content:"+";position:absolute;left:0;color:#51dcff}.vision-chart{border:1px solid rgba(125,190,219,.18);background:rgba(3,8,18,.65);padding:14px}.vision-chart-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:8px}.vision-chart-head strong{font:600 12px/1.2 var(--font-geist-mono),monospace;letter-spacing:.08em;color:#eaf4ff}.vision-chart-head span{font:10px/1.2 var(--font-geist-mono),monospace;color:#8796aa}.vision-chart svg{display:block;width:100%;height:auto}.vision-legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;font:10px/1.3 var(--font-geist-mono),monospace;color:#8796aa}.vision-legend span:before{content:"";display:inline-block;width:14px;height:2px;margin-right:6px;vertical-align:middle;background:currentColor}.vision-legend .map50{color:#51dcff}.vision-legend .map95{color:#ffb84c}.vision-metric-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:12px;background:rgba(125,190,219,.14)}.vision-metric-strip div{background:#06101f;padding:12px 10px}.vision-metric-strip strong{display:block;font:600 18px/1 var(--font-geist-mono),monospace;color:#eaf4ff}.vision-metric-strip span{display:block;margin-top:5px;font:9px/1.25 var(--font-geist-mono),monospace;color:#8796aa;text-transform:uppercase;letter-spacing:.09em}@media(max-width:900px){.vision-demos{grid-template-columns:1fr 1fr}.vision-demo:last-child{grid-column:1/-1;max-width:520px;width:100%;justify-self:center}}@media(max-width:760px){.vision-grid{grid-template-columns:1fr}.vision-pipeline{grid-template-columns:1fr}.vision-metric-strip{grid-template-columns:repeat(2,1fr)}.vision-demos{grid-template-columns:1fr}.vision-demo:last-child{grid-column:auto;max-width:none}.vision-demo-head{align-items:start;flex-direction:column;gap:6px}}
      `}</style>

      <div className="vision-demo-head">
        <p className="vision-kicker">Tracked output / detection + state estimation</p>
        <span>Three evaluation clips · annotated output only</span>
      </div>
      <div className="vision-demos" aria-label="Computer vision tracking demonstrations">
        {demos.map((demo, index) => (
          <figure className="vision-demo" key={demo.src}>
            <video controls muted playsInline preload="metadata" aria-label={demo.label}>
              <source src={demo.src} type="video/mp4" />
              Your browser does not support embedded MP4 video.
            </video>
            <figcaption><b>0{index + 1}</b><span>{demo.label}</span></figcaption>
          </figure>
        ))}
      </div>

      <div className="vision-grid">
        <div>
          <p className="vision-kicker">Tracking architecture / experimental pipeline</p>
          <div className="vision-pipeline" aria-label="Computer vision tracking pipeline">
            <div className="vision-step"><b>01 · YOLOv8</b><span>Custom-trained target detection</span></div>
            <div className="vision-step"><b>02 · ByteTrack</b><span>Persistent IDs across video frames</span></div>
            <div className="vision-step"><b>03 · Kalman</b><span>OpenCV position-state estimation</span></div>
          </div>
          <ul className="vision-findings">
            <li>Tuned ByteTrack thresholds for small, fast-moving targets and persistent frame-to-frame association.</li>
            <li>Built an OpenCV Kalman filter with position and velocity states to explore prediction between noisy measurements.</li>
            <li>Validation performance continued improving through epoch 20, with mAP@50 reaching 81.9% and mAP@50–95 reaching 40.1%.</li>
          </ul>
        </div>
        <div>
          <div className="vision-chart">
            <div className="vision-chart-head"><strong>YOLO validation progression</strong><span>20 epochs</span></div>
            <svg viewBox="0 0 400 150" role="img" aria-label="YOLO mAP validation progression over 20 epochs">
              <line x1="22" y1="136" x2="378" y2="136" stroke="rgba(135,150,170,.25)" strokeWidth="1" />
              <line x1="22" y1="72" x2="378" y2="72" stroke="rgba(135,150,170,.12)" strokeWidth="1" />
              <line x1="22" y1="8" x2="378" y2="8" stroke="rgba(135,150,170,.12)" strokeWidth="1" />
              <polyline points={pointsFor(map50)} fill="none" stroke="#51dcff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={pointsFor(map5095)} fill="none" stroke="#ffb84c" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
              <text x="22" y="148" fill="#8796aa" fontSize="8">1</text><text x="366" y="148" fill="#8796aa" fontSize="8">20</text>
            </svg>
            <div className="vision-legend"><span className="map50">mAP@50</span><span className="map95">mAP@50–95</span></div>
          </div>
          <div className="vision-metric-strip">
            <div><strong>81.9%</strong><span>final mAP@50</span></div>
            <div><strong>80.5%</strong><span>final precision</span></div>
            <div><strong>75.4%</strong><span>final recall</span></div>
            <div><strong>82.6%</strong><span>peak precision</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
