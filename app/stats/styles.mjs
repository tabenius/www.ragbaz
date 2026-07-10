export const statsPageStyles = `
  body{margin:0;background:var(--bg-0,#0a0908);color:var(--fg-2,#d8c29d);font-family:"Noto Sans",system-ui,sans-serif;line-height:1.6}
  .rb-stats{max-width:1100px;margin:0 auto;padding:1.25rem clamp(.9rem,4vw,1.25rem) 3rem}
  .rb-stats h1,.rb-stats h2{font-family:"Intel One Mono",monospace;letter-spacing:0}
  .rb-stats h1{font-size:1.5rem;margin:0}
  .rb-stats p{line-height:1.6}
  .rb-stats .hero{display:grid;gap:1rem;padding:1rem 0 1.5rem}
  .rb-stats .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem}
  .rb-stats .summary .panel,.rb-stats .project,.rb-stats .empty,.rb-stats .error-panel{border:1px solid var(--border-2,#2a2a2a);background:var(--bg-2,#121212);border-radius:8px}
  .rb-stats .summary .panel,.rb-stats .error-panel{padding:1rem}
  .rb-stats .summary span,.rb-stats .metrics span,.rb-stats .eyebrow,.rb-stats .path,.rb-stats .meta,.rb-stats th{font-family:"Intel One Mono",monospace;font-size:.72rem;text-transform:uppercase;color:var(--fg-4,#9f9f9f)}
  .rb-stats .summary strong,.rb-stats .metrics strong{display:block;margin-top:.3rem;color:var(--fg-1,#f6d7a7);font-size:1.15rem}
  .rb-stats .traffic{display:grid;gap:1rem;margin:0 0 1.5rem}
  .rb-stats .traffic-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
  .rb-stats .traffic-widget{border:1px solid var(--border-2,#2a2a2a);border-radius:8px;background:var(--bg-2,#121212);padding:1rem;display:grid;gap:.8rem}
  .rb-stats .traffic-widget-head{display:flex;justify-content:space-between;gap:.8rem;align-items:flex-start}
  .rb-stats .traffic-widget strong{display:block;margin-top:.28rem;color:var(--fg-1,#f6d7a7);font-size:1.28rem}
  .rb-stats .traffic-widget .sub{font-family:"Intel One Mono",monospace;font-size:.7rem;color:var(--fg-5,#737373);text-transform:uppercase}
  .rb-stats .traffic-chart{width:100%;height:auto;display:block}
  .rb-stats .traffic-chart .grid{stroke:rgba(255,255,255,.06);stroke-width:1}
  .rb-stats .traffic-chart .bar{fill:var(--orange-3,#ff9900)}
  .rb-stats .traffic-chart .bar.blue{fill:var(--blue-1,#7ab8ff)}
  .rb-stats .traffic-chart .axis{fill:var(--fg-5,#737373);font-family:"Intel One Mono",monospace;font-size:8px}
  .rb-stats .traffic-list{list-style:none;padding:0;margin:0;display:grid;gap:.55rem}
  .rb-stats .traffic-list li{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:.7rem;align-items:baseline;font-size:.9rem;color:var(--fg-3,#d4c19a)}
  .rb-stats .traffic-list code{font-family:"Intel One Mono",monospace;font-size:.72rem;color:var(--fg-2,#d8c29d);overflow-wrap:anywhere}
  .rb-stats .traffic-list .mono{font-size:.72rem;color:var(--fg-5,#737373)}
  .rb-stats .traffic-empty{border:1px dashed var(--border-2,#2a2a2a);border-radius:8px;padding:1rem;color:var(--fg-4,#9f9f9f);font-size:.92rem}
  .rb-stats .projects{display:grid;gap:1rem}
  .rb-stats .project{padding:1rem}
  .rb-stats .project-head{display:grid;gap:1rem}
  .rb-stats .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem}
  .rb-stats .metrics div{padding:.75rem;border:1px solid var(--border-3,#2d2d2d);border-radius:8px;background:var(--bg-3,#161616)}
  .rb-stats .eyebrow,.rb-stats .path,.rb-stats .meta{margin:0}
  .rb-stats .path,.rb-stats .meta{font-size:.7rem}
  .rb-stats .path{overflow-wrap:anywhere}
  .rb-stats h2{font-size:1rem;margin:.2rem 0 .25rem;color:var(--fg-1,#f6d7a7)}
  .rb-stats .history-wrap{overflow:auto;-webkit-overflow-scrolling:touch}
  .rb-stats table{width:100%;border-collapse:collapse;margin-top:.9rem;min-width:36rem}
  .rb-stats th,.rb-stats td{text-align:left;padding:.55rem 0;border-top:1px solid var(--border-3,#2d2d2d);vertical-align:top}
  .rb-stats td{font-size:.92rem}
  .rb-stats .empty,.rb-stats .error-panel{padding:1rem}
  .rb-stats .error-panel h1{margin-bottom:.6rem}
  .rb-stats .error-actions{margin-top:1rem}
  .rb-stats .retry-btn{font-family:"Intel One Mono",monospace;font-size:.82rem;border:1px solid var(--border-warm,#3a2a18);border-radius:8px;padding:.62rem .9rem;background:var(--bg-3,#161616);color:var(--orange-1,#f3c46c);cursor:pointer}
  .rb-stats .retry-btn:hover{border-color:var(--orange-3,#ff9900);color:var(--fg-1,#f6d7a7)}
  .rb-stats .skeleton{position:relative;overflow:hidden;background:var(--bg-3,#161616)}
  .rb-stats .skeleton::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);animation:rb-stats-shimmer 1.5s infinite}
  .rb-stats .skeleton-line{height:.95rem;border-radius:999px}
  .rb-stats .skeleton-line.short{width:42%}
  .rb-stats .skeleton-line.medium{width:64%}
  .rb-stats .skeleton-line.long{width:100%}
  .rb-stats .summary-skeleton .panel{display:grid;gap:.6rem}
  .rb-stats .project-skeleton{display:grid;gap:1rem;padding:1rem}
  .rb-stats .project-skeleton-head{display:grid;gap:1rem}
  .rb-stats .project-skeleton-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem}
  .rb-stats .project-skeleton-metrics .metric{display:grid;gap:.45rem;padding:.75rem;border:1px solid var(--border-3,#2d2d2d);border-radius:8px;background:var(--bg-3,#161616)}
  .rb-stats .traffic-skeleton-card{display:grid;gap:.65rem}
  .rb-stats .table-skeleton{display:grid;gap:.55rem;margin-top:.9rem}
  .rb-stats .table-skeleton .row{height:.85rem;border-radius:999px}
  @keyframes rb-stats-shimmer{100%{transform:translateX(100%)}}
  @media (min-width:760px){
    .rb-stats .hero{grid-template-columns:minmax(0,1.3fr) minmax(320px,1fr);align-items:end}
    .rb-stats .project-head,.rb-stats .project-skeleton-head{grid-template-columns:minmax(0,1fr) minmax(320px,1fr)}
  }
  @media (max-width:640px){
    .rb-stats h1{font-size:1.3rem}
    .rb-stats .summary,.rb-stats .metrics,.rb-stats .project-skeleton-metrics{grid-template-columns:1fr}
    .rb-stats .project,.rb-stats .project-skeleton{padding:.9rem}
    .rb-stats table{min-width:30rem}
  }
  @media (max-width:420px){
    .rb-stats .summary strong,.rb-stats .metrics strong{font-size:1rem}
    .rb-stats th,.rb-stats td{padding:.5rem 0}
    .rb-stats table{min-width:26rem}
  }
`;
