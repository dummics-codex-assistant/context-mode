function a(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}var B=10;function p(t,r=4){return[...new Set(t.filter(o=>o.length>0))].slice(0,r).map(o=>o.length>80?o.slice(0,80):o)}function h(t,r){if(r.length===0)return"";let e=r.map(n=>`"${a(n)}"`).join(", ");return`
    For full details:
    ${a(t)}(
      queries: [${e}],
      source: "session-events"
    )`}function J(t,r){if(t.length===0)return"";let e=new Map;for(let f of t){let S=f.data,m=e.get(S);m||(m={ops:new Map},e.set(S,m));let d;f.type==="file_write"?d="write":f.type==="file_read"?d="read":f.type==="file_edit"?d="edit":d=f.type,m.ops.set(d,(m.ops.get(d)??0)+1)}let o=Array.from(e.entries()).slice(-B),i=[],c=[];for(let[f,{ops:S}]of o){let m=Array.from(S.entries()).map(([b,y])=>`${b}\xD7${y}`).join(", "),d=f.split("/").pop()??f;i.push(`    ${a(d)} (${a(m)})`),c.push(`${d} ${Array.from(S.keys()).join(" ")}`)}let s=p(c);return[`  <files count="${e.size}">`,...i,h(r,s),"  </files>"].join(`
`)}function X(t,r){if(t.length===0)return"";let e=[],n=[];for(let c of t)e.push(`    ${a(c.data)}`),n.push(c.data);let o=p(n);return[`  <errors count="${t.length}">`,...e,h(r,o),"  </errors>"].join(`
`)}function G(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t)e.has(s.data)||(e.add(s.data),n.push(`    ${a(s.data)}`),o.push(s.data));if(n.length===0)return"";let i=p(o);return[`  <decisions count="${n.length}">`,...n,h(r,i),"  </decisions>"].join(`
`)}function z(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t.slice(-12))e.has(s.data)||(e.add(s.data),n.push(`    ${a(s.data)}`),o.push(`session note ${s.data}`));if(n.length===0)return"";let i=p(o);return[`  <session_notes count="${n.length}">`,...n,h(r,i),"  </session_notes>"].join(`
`)}function H(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t)e.has(s.data)||(e.add(s.data),s.type==="rule_content"?n.push(`    ${a(s.data)}`):n.push(`    ${a(s.data)}`),o.push(s.data));if(n.length===0)return"";let i=p(o);return[`  <rules count="${n.length}">`,...n,h(r,i),"  </rules>"].join(`
`)}function P(t,r){if(t.length===0)return"";let e=[],n=[];for(let c of t)e.push(`    ${a(c.data)}`),n.push(c.data);let o=p(n);return[`  <git count="${t.length}">`,...e,h(r,o),"  </git>"].join(`
`)}function Q(t){if(t.length===0)return"";let r=[],e={};for(let s of t)try{let u=JSON.parse(s.data);typeof u.subject=="string"?r.push(u.subject):typeof u.taskId=="string"&&typeof u.status=="string"&&(e[u.taskId]=u.status)}catch{}if(r.length===0)return"";let n=new Set(["completed","deleted","failed"]),o=Object.keys(e).sort((s,u)=>Number(s)-Number(u)),i=[];for(let s=0;s<r.length;s++){let u=o[s],f=u?e[u]??"pending":"pending";n.has(f)||i.push(r[s])}if(i.length===0)return"";let c=[];for(let s of i)c.push(`    [pending] ${a(s)}`);return c.join(`
`)}function U(t,r){let e=Q(t);if(!e)return"";let n=[];for(let s of t)try{let u=JSON.parse(s.data);typeof u.subject=="string"&&n.push(u.subject)}catch{}let o=p(n);return[`  <task_state count="${e.split(`
`).length}">`,e,h(r,o),"  </task_state>"].join(`
`)}function V(t,r,e){if(t.length===0&&r.length===0)return"";let n=[],o=[];if(t.length>0){let s=t[t.length-1];n.push(`    cwd: ${a(s.data)}`),o.push("working directory")}for(let s of r)n.push(`    ${a(s.data)}`),o.push(s.data);let i=p(o);return["  <environment>",...n,h(e,i),"  </environment>"].join(`
`)}function K(t,r){if(t.length===0)return"";let e=[],n=[];for(let c of t){let s=c.type==="subagent_completed"?"completed":c.type==="subagent_launched"?"launched":"unknown";e.push(`    [${s}] ${a(c.data)}`),n.push(`subagent ${c.data}`)}let o=p(n);return[`  <subagents count="${t.length}">`,...e,h(r,o),"  </subagents>"].join(`
`)}function W(t,r){if(t.length===0)return"";let e=new Map;for(let s of t){let u=s.data.split(":")[0].trim();e.set(u,(e.get(u)??0)+1)}let n=[],o=[];for(let[s,u]of e)n.push(`    ${a(s)} (${u}\xD7)`),o.push(`skill ${s} invocation`);let i=p(o);return[`  <skills count="${t.length}">`,...n,h(r,i),"  </skills>"].join(`
`)}function Y(t,r){if(t.length===0)return"";let e=new Set,n=[],o=[];for(let s of t)e.has(s.data)||(e.add(s.data),n.push(`    ${a(s.data)}`),o.push(s.data));if(n.length===0)return"";let i=p(o);return[`  <roles count="${n.length}">`,...n,h(r,i),"  </roles>"].join(`
`)}function Z(t){if(t.length===0)return"";let r=t[t.length-1];return`  <intent mode="${a(r.data)}"/>`}var tt=3,nt=400;function et(t,r){let e=[...t];return e.length<=r?t:e.slice(0,r).join("")}function st(t){if(t.length===0)return"";let e=t.slice(-tt).map(n=>{let o=et(n.data??"",nt);return o?`    <message>${a(o)}</message>`:""}).filter(Boolean);return e.length===0?"":[`  <recent_user_messages count="${e.length}">`,...e,"  </recent_user_messages>"].join(`
`)}function it(t,r){let e=r?.compactCount??1,n=r?.searchTool??"ctx_search",o=new Date().toISOString(),i=[],c=[],s=[],u=[],f=[],S=[],m=[],d=[],b=[],y=[],$=[],v=[],k=[],E=[];for(let g of t)switch(g.category){case"file":i.push(g);break;case"task":c.push(g);break;case"rule":s.push(g);break;case"decision":u.push(g);break;case"session-note":f.push(g);break;case"cwd":S.push(g);break;case"error":m.push(g);break;case"env":d.push(g);break;case"git":b.push(g);break;case"subagent":y.push(g);break;case"intent":$.push(g);break;case"skill":v.push(g);break;case"role":k.push(g);break;case"user-prompt":E.push(g);break}let l=[];l.push(`  <how_to_search>
  Each section below contains a summary of prior work.
  For FULL DETAILS, run the exact tool call shown under each section.
  Do NOT ask the user to re-explain prior work. Search first.
  Do NOT invent your own queries \u2014 use the ones provided.
  </how_to_search>`);let _=J(i,n);_&&l.push(_);let w=X(m,n);w&&l.push(w);let q=G(u,n);q&&l.push(q);let j=z(f,n);j&&l.push(j);let L=H(s,n);L&&l.push(L);let T=P(b,n);T&&l.push(T);let C=U(c,n);C&&l.push(C);let M=V(S,d,n);M&&l.push(M);let N=K(y,n);N&&l.push(N);let I=W(v,n);I&&l.push(I);let A=Y(k,n);A&&l.push(A);let O=Z($);O&&l.push(O);let R=st(E);R&&l.push(R);let D=`<session_resume events="${t.length}" compact_count="${e}" generated_at="${o}">`,F="</session_resume>",x=l.join(`

`);return x?`${D}

${x}

${F}`:`${D}
${F}`}export{it as buildResumeSnapshot,Q as renderTaskState};
