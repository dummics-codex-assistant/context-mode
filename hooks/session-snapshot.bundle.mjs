function a(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}var J=10;function h(t,r=4){return[...new Set(t.filter(o=>o.length>0))].slice(0,r).map(o=>o.length>80?o.slice(0,80):o)}function p(t,r){if(r.length===0)return"";let e=r.map(n=>`"${a(n)}"`).join(", ");return`
    For full details:
    ${a(t)}(
      queries: [${e}],
      source: "session-events"
    )`}function X(t,r){if(t.length===0)return"";let e=new Map;for(let f of t){let S=f.data,m=e.get(S);m||(m={ops:new Map},e.set(S,m));let d;f.type==="file_write"?d="write":f.type==="file_read"?d="read":f.type==="file_edit"?d="edit":d=f.type,m.ops.set(d,(m.ops.get(d)??0)+1)}let o=Array.from(e.entries()).slice(-J),i=[],c=[];for(let[f,{ops:S}]of o){let m=Array.from(S.entries()).map(([b,y])=>`${b}\xD7${y}`).join(", "),d=f.split("/").pop()??f;i.push(`    ${a(d)} (${a(m)})`),c.push(`${d} ${Array.from(S.keys()).join(" ")}`)}let s=h(c);return[`  <files count="${e.size}">`,...i,p(r,s),"  </files>"].join(`
`)}function z(t,r){if(t.length===0)return"";let e=[],n=[];for(let c of t)e.push(`    ${a(c.data)}`),n.push(c.data);let o=h(n);return[`  <errors count="${t.length}">`,...e,p(r,o),"  </errors>"].join(`
`)}function P(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t)e.has(s.data)||(e.add(s.data),n.push(`    ${a(s.data)}`),o.push(s.data));if(n.length===0)return"";let i=h(o);return[`  <decisions count="${n.length}">`,...n,p(r,i),"  </decisions>"].join(`
`)}function H(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t.slice(-12))e.has(s.data)||(e.add(s.data),n.push(`    ${a(s.data)}`),o.push(`session note ${s.data}`));if(n.length===0)return"";let i=h(o);return[`  <session_notes count="${n.length}">`,...n,p(r,i),"  </session_notes>"].join(`
`)}function K(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t)e.has(s.data)||(e.add(s.data),s.type==="rule_content"?n.push(`    ${a(s.data)}`):n.push(`    ${a(s.data)}`),o.push(s.data));if(n.length===0)return"";let i=h(o);return[`  <rules count="${n.length}">`,...n,p(r,i),"  </rules>"].join(`
`)}function Q(t,r){if(t.length===0)return"";let e=[],n=[];for(let c of t)e.push(`    ${a(c.data)}`),n.push(c.data);let o=h(n);return[`  <git count="${t.length}">`,...e,p(r,o),"  </git>"].join(`
`)}function U(t){if(t.length===0)return"";let r=[],e={};for(let s of t)try{let u=JSON.parse(s.data);typeof u.subject=="string"?r.push(u.subject):typeof u.taskId=="string"&&typeof u.status=="string"&&(e[u.taskId]=u.status)}catch{}if(r.length===0)return"";let n=new Set(["completed","deleted","failed"]),o=Object.keys(e).sort((s,u)=>Number(s)-Number(u)),i=[];for(let s=0;s<r.length;s++){let u=o[s],f=u?e[u]??"pending":"pending";n.has(f)||i.push(r[s])}if(i.length===0)return"";let c=[];for(let s of i)c.push(`    [pending] ${a(s)}`);return c.join(`
`)}function V(t,r){let e=U(t);if(!e)return"";let n=[];for(let s of t)try{let u=JSON.parse(s.data);typeof u.subject=="string"&&n.push(u.subject)}catch{}let o=h(n);return[`  <task_state count="${e.split(`
`).length}">`,e,p(r,o),"  </task_state>"].join(`
`)}function W(t,r,e){if(t.length===0&&r.length===0)return"";let n=[],o=[];if(t.length>0){let s=t[t.length-1];n.push(`    cwd: ${a(s.data)}`),o.push("working directory")}for(let s of r)n.push(`    ${a(s.data)}`),o.push(s.data);let i=h(o);return["  <environment>",...n,p(e,i),"  </environment>"].join(`
`)}function Y(t,r){if(t.length===0)return"";let e=[],n=[];for(let c of t){let s=c.type==="subagent_completed"?"completed":c.type==="subagent_launched"?"launched":"unknown";e.push(`    [${s}] ${a(c.data)}`),n.push(`subagent ${c.data}`)}let o=h(n);return[`  <subagents count="${t.length}">`,...e,p(r,o),"  </subagents>"].join(`
`)}function Z(t,r){if(t.length===0)return"";let e=new Map;for(let s of t){let u=s.data.split(":")[0].trim();e.set(u,(e.get(u)??0)+1)}let n=[],o=[];for(let[s,u]of e)n.push(`    ${a(s)} (${u}\xD7)`),o.push(`skill ${s} invocation`);let i=h(o);return[`  <skills count="${t.length}">`,...n,p(r,i),"  </skills>"].join(`
`)}function tt(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t)e.has(s.data)||(e.add(s.data),n.push(`    ${a(s.data)}`),o.push(s.data));if(n.length===0)return"";let i=h(o);return[`  <roles count="${n.length}">`,...n,p(r,i),"  </roles>"].join(`
`)}function nt(t){if(t.length===0)return"";let r=t[t.length-1];return`  <intent mode="${a(r.data)}"/>`}function et(t){if(t.length===0)return"";let r=t[t.length-1];return["  <session_goal>","  The active objective for this session. Keep working toward it until it is met; do not ask the user to restate it.",`    ${a(r.data)}`,"  </session_goal>"].join(`
`)}var st=3,rt=400;function ot(t,r){let e=[...t];return e.length<=r?t:e.slice(0,r).join("")}function it(t){if(t.length===0)return"";let e=t.slice(-st).map(n=>{let o=ot(n.data??"",rt);return o?`    <message>${a(o)}</message>`:""}).filter(Boolean);return e.length===0?"":[`  <recent_user_messages count="${e.length}">`,...e,"  </recent_user_messages>"].join(`
`)}function at(t,r){let e=r?.compactCount??1,n=r?.searchTool??"ctx_search",o=new Date().toISOString(),i=[],c=[],s=[],u=[],f=[],S=[],m=[],d=[],b=[],y=[],$=[],v=[],k=[],E=[],_=[];for(let g of t)switch(g.category){case"file":i.push(g);break;case"task":c.push(g);break;case"rule":s.push(g);break;case"decision":u.push(g);break;case"session-note":f.push(g);break;case"cwd":S.push(g);break;case"error":m.push(g);break;case"env":d.push(g);break;case"git":b.push(g);break;case"subagent":y.push(g);break;case"intent":$.push(g);break;case"goal":v.push(g);break;case"skill":k.push(g);break;case"role":E.push(g);break;case"user-prompt":_.push(g);break}let l=[];l.push(`  <how_to_search>
  Each section below contains a summary of prior work.
  For FULL DETAILS, run the exact tool call shown under each section.
  Do NOT ask the user to re-explain prior work. Search first.
  Do NOT invent your own queries \u2014 use the ones provided.
  </how_to_search>`);let w=et(v);w&&l.push(w);let q=X(i,n);q&&l.push(q);let j=z(m,n);j&&l.push(j);let T=P(u,n);T&&l.push(T);let L=H(f,n);L&&l.push(L);let M=K(s,n);M&&l.push(M);let N=Q(b,n);N&&l.push(N);let C=V(c,n);C&&l.push(C);let A=W(S,d,n);A&&l.push(A);let I=Y(y,n);I&&l.push(I);let O=Z(k,n);O&&l.push(O);let R=tt(E,n);R&&l.push(R);let x=nt($);x&&l.push(x);let D=it(_);D&&l.push(D);let F=`<session_resume events="${t.length}" compact_count="${e}" generated_at="${o}">`,B="</session_resume>",G=l.join(`

`);return G?`${F}

${G}

${B}`:`${F}
${B}`}export{at as buildResumeSnapshot,U as renderTaskState};
