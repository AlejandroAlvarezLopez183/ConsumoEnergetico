(function(){
const S=SNRGY,$=S.$,t=S.t;
const sum=a=>a.reduce((x,y)=>x+y,0);
const median=a=>{const b=a.slice().sort((x,y)=>x-y),m=b.length>>1;return b.length?(b.length%2?b[m]:(b[m-1]+b[m])/2):0};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=(n,d=1)=>n.toLocaleString(S.lang()==='en'?'en-US':'es-MX',{minimumFractionDigits:d,maximumFractionDigits:d});
const MES={es:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
const DIA={es:['dom','lun','mar','mié','jue','vie','sáb'],en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']};
const hh=h=>String(h).padStart(2,'0')+':00';

S.addEN({
"Mi vivienda · SNRGY":"My home · SNRGY","Mi vivienda":"My home","Cerrar sesión":"Sign out","Idioma":"Language","Días a mostrar":"Days to show",
"7 días":"7 days","14 días":"14 days","20 días":"20 days","Cargando tus datos…":"Loading your data…",
"No pudimos cargar tus datos":"We couldn't load your data","Revisa tu conexión e inténtalo de nuevo. Si sigue pasando, avisa al laboratorio.":"Check your connection and try again. If it keeps happening, let the lab know.","Reintentar":"Try again",
"Las recomendaciones son orientativas: se calculan con tus lecturas confiables del periodo elegido y no sustituyen la revisión de una persona técnica. Los días con lecturas incompletas se estiman a partir del contador del medidor y se marcan con rayas.":"Recommendations are indicative: they are computed from your reliable readings in the chosen period and do not replace an inspection by a technician. Days with incomplete readings are estimated from the meter's counter and shown striped.",
"Tu consumo":"Your consumption","Consumo de {v}":"Energy use of {v}",
"Datos del {a} al {b}":"Data from {a} to {b}",
"Última lectura: {d}":"Last reading: {d}","Última lectura: {d} ({ago})":"Last reading: {d} ({ago})",
"hace {n} día":"{n} day ago","hace {n} días":"{n} days ago","hace {n} h":"{n} h ago","hace un momento":"just now",
"Consumo diario promedio":"Average daily consumption","Total del periodo":"Period total","Hora de mayor consumo":"Peak hour","Consumo base de madrugada":"Overnight base load","Factor de potencia":"Power factor","Voltaje promedio":"Average voltage",
"{a} de {b} días con dato":"{a} of {b} days with data","últimos {n} días":"last {n} days","{x} kWh por hora":"{x} kWh per hour","{p} % de tu consumo":"{p} % of your consumption",
"Sin dato":"No data","Rango normal {a}–{b} V":"Normal range {a}–{b} V","Entre 0 y 1; más cerca de 1 es mejor":"Between 0 and 1; closer to 1 is better",
"Recomendaciones para ti":"Recommendations for you","Calculadas con tus lecturas confiables de los últimos {n} días.":"Computed from your reliable readings of the last {n} days.",
"Dato: {x}":"Data: {x}",
"Tu consumo se dispara a las {h}":"Your consumption spikes at {h}",
"Tu pico está entre las {a} y las {b}: usas {x} kWh por hora, {r} veces lo habitual del resto del día. Evita encender al mismo tiempo varios equipos de alto consumo (lavadora, plancha, horno, aire acondicionado) y reparte su uso en otros horarios.":"Your peak is between {a} and {b}: you use {x} kWh per hour, {r} times your usual level for the rest of the day. Avoid running several high-consumption appliances at once (washer, iron, oven, air conditioning) and spread their use across other times.",
"pico {x} kWh a las {h}; valor típico por hora {m} kWh":"peak {x} kWh at {h}; typical hourly value {m} kWh",
"Aun de madrugada consumes {x} kW":"Even at night you draw {x} kW",
"Eso es el {p} % de todo lo que gastas al día. Desconecta equipos en espera (TV, consolas, decodificadores, cargadores) y revisa si hay un refrigerador, boiler o bomba trabajando de más.":"That is {p} % of everything you use per day. Unplug standby devices (TV, consoles, set-top boxes, chargers) and check whether a fridge, water heater or pump is working more than needed.",
"promedio entre 1:00 y 5:00 h: {x} kW; consumo diario promedio {y} kWh":"average between 1:00 and 5:00 am: {x} kW; average daily consumption {y} kWh",
"Tu consumo base es bajo":"Your base load is low",
"Por las noches solo gastas {x} kW ({p} % del total): los equipos en espera pesan poco en tu recibo.":"At night you only use {x} kW ({p} % of the total): standby devices weigh little on your bill.",
"Los fines de semana gastas {p} % más":"You use {p} % more on weekends",
"Tu consumo diario sube de {a} a {b} kWh cuando estás en casa. Si puedes, concentra las tareas pesadas (lavado, planchado) en pocos momentos y apaga lo que no uses.":"Your daily consumption goes from {a} to {b} kWh when you are at home. If you can, group heavy chores (laundry, ironing) into a few moments and switch off what you don't use.",
"entre semana {a} kWh/día; fin de semana {b} kWh/día":"weekdays {a} kWh/day; weekends {b} kWh/day",
"Tu consumo subió {p} % esta semana":"Your consumption rose {p} % this week",
"Los últimos 7 días promedias {a} kWh al día, contra {b} kWh en los 7 días anteriores. Revisa si estrenaste algún equipo o si el clima te hizo usar más el aire acondicionado o el ventilador.":"Over the last 7 days you average {a} kWh a day, versus {b} kWh in the previous 7 days. Check whether you started using a new appliance or whether the weather made you use air conditioning or fans more.",
"Tu consumo bajó {p} % esta semana":"Your consumption dropped {p} % this week",
"Los últimos 7 días promedias {a} kWh al día, contra {b} kWh en los 7 días anteriores. ¡Buen avance! Mantén esos hábitos.":"Over the last 7 days you average {a} kWh a day, versus {b} kWh in the previous 7 days. Nice progress! Keep those habits.",
"últimos 7 días {a} kWh/día; 7 días previos {b} kWh/día":"last 7 days {a} kWh/day; previous 7 days {b} kWh/day",
"Tu factor de potencia es bajo ({x})":"Your power factor is low ({x})",
"Significa que parte de la corriente no se aprovecha como trabajo útil; es típico de motores y compresores (aire acondicionado, refrigerador, bombas) o de equipos viejos. En tarifas domésticas normalmente no se cobra, pero puede señalar aparatos ineficientes que vale la pena revisar.":"It means part of the current is not used as useful work; this is typical of motors and compressors (air conditioning, fridge, pumps) or old appliances. It is normally not charged on household tariffs, but it may point to inefficient appliances worth checking.",
"factor de potencia promedio {x}; lo ideal es 0.90 o más":"average power factor {x}; ideal is 0.90 or higher",
"Tu factor de potencia es bueno ({x})":"Your power factor is good ({x})",
"Tu instalación aprovecha bien la corriente que recibe.":"Your installation makes good use of the current it receives.",
"El factor de potencia medido es muy bajo ({x})":"The measured power factor is very low ({x})",
"Un valor tan bajo suele indicar un problema de medición, no de tus equipos. Lo revisaremos en el laboratorio.":"A value this low usually points to a measurement problem, not your appliances. We will check it at the lab.",
"El voltaje salió de rango el {p} % del tiempo":"Voltage was out of range {p} % of the time",
"Un voltaje muy alto o muy bajo acorta la vida de los electrodomésticos. Considera un regulador o supresor de picos para equipos sensibles y repórtalo a CFE si persiste.":"Voltage that is too high or too low shortens appliance life. Consider a voltage regulator or surge protector for sensitive equipment and report it to the utility (CFE) if it persists.",
"rango normal {a}–{b} V; tu promedio fue {x} V":"normal range {a}–{b} V; your average was {x} V",
"Algunas lecturas no son confiables":"Some readings are not reliable",
"En el periodo hubo {n} días sin dato completo o con estimación, o un medidor con problemas ({m}). Tus gráficas usan solo lecturas confiables; avisa al laboratorio si el problema continúa.":"In this period there were {n} days without complete data or estimated, or a meter with problems ({m}). Your charts only use reliable readings; let the lab know if the problem continues.",
"En el periodo hubo {n} días sin dato completo o con estimación. Tus gráficas usan solo lecturas confiables; avisa al laboratorio si el problema continúa.":"In this period there were {n} days without complete data or estimated. Your charts only use reliable readings; let the lab know if the problem continues.",
"días con estimación o sin dato: {n} de {t}":"days estimated or without data: {n} of {t}",
"Todavía no hay lecturas confiables de tu vivienda":"There are no reliable readings from your home yet",
"Tus medidores no han enviado datos válidos en el periodo elegido, así que no podemos calcular tu consumo ni darte recomendaciones. El laboratorio ya recibe este aviso; si tienes dudas, contáctalos.":"Your meters have not sent valid data in the chosen period, so we cannot calculate your consumption or give you recommendations. The lab receives this notice; contact them if you have questions.",
"Consumo diario":"Daily consumption","Energía total de cada día (kWh). Las barras con rayas son estimaciones.":"Total energy each day (kWh). Striped bars are estimates.",
"Día completo":"Complete day","Día estimado":"Estimated day","Sin dato":"No data","Promedio":"Average",
"Consumo por hora del día":"Consumption by hour of day","Promedio de cada hora (kWh). La más alta se marca en naranja.":"Average for each hour (kWh). The highest is shown in orange.",
"Potencia máxima por día":"Maximum power per day","Lo más alto que llegó tu consumo en una hora (kW).":"The highest your consumption reached in an hour (kW).",
"Voltaje":"Voltage","Voltaje de tu instalación (V). La franja gris es el rango normal.":"Your installation's voltage (V). The grey band is the normal range.",
"Rango normal":"Normal range",
"Mis medidores":"My meters","Estado de cada medidor instalado en tu vivienda.":"Status of each meter installed in your home.",
"Funciona bien":"Working well","Señal intermitente":"Intermittent signal","Sin lecturas nuevas":"No new readings","Sin datos":"No data","Sin voltaje":"No voltage",
"Última lectura confiable: {d}":"Last reliable reading: {d}","Última lectura confiable: ninguna":"Last reliable reading: none",
"Medidor {c}":"Meter {c}",
"{d} kWh":"{d} kWh",
"{x} kWh el {d}":"{x} kWh on {d}","{x} kWh a las {h}":"{x} kWh at {h}","{x} kW el {d}":"{x} kW on {d}","{x} V":"{x} V"
});

let H,META,state={range:20},ND,NH,START;
const dayDate=d=>new Date(START[0],START[1]-1,START[2]+d);
const dLab=d=>{const x=dayDate(d);return S.lang()==='en'?MES.en[x.getMonth()]+' '+x.getDate():x.getDate()+' '+MES.es[x.getMonth()]};
const dLabL=d=>{const x=dayDate(d);return DIA[S.lang()][x.getDay()]+', '+dLab(d)};
function fmtDT(str){const [dd,tm]=str.replace('T',' ').split(' '),[y,m,d]=dd.split('-').map(Number);return (S.lang()==='en'?MES.en[m-1]+' '+d:d+' '+MES.es[m-1])+', '+tm}

/* ---------- estadisticas (misma logica que el mapa de administración) ---------- */
function stats(h,n){
  const d0=Math.max(0,ND-n),k0=d0*24,sens=h.sensores_det||[],days=[];
  for(let d=d0;d<ND;d++){
    let nulls=0,rel=0,tot=0;
    for(let k=d*24;k<d*24+24;k++){const e=h.e[k];if(e===null)nulls++;else tot+=e;if(h.cls[k]===0)rel++}
    let kind='nodata',val=null,mx=null;
    if(nulls===0){kind=rel>=22?'ok':'est';val=tot}
    for(let k=d*24;k<d*24+24;k++)if(h.cls[k]===0&&h.p[k]!==null&&(mx===null||h.p[k]>mx))mx=h.p[k];
    days.push({d,kind,val,mx});
  }
  const wv=days.filter(x=>x.val!==null),total=sum(wv.map(x=>x.val));
  const prof=new Array(24).fill(0),cnt=new Array(24).fill(0);
  for(let k=k0;k<NH;k++)if(h.cls[k]===0&&h.e[k]!==null){prof[k%24]+=h.e[k];cnt[k%24]++}
  const profile=prof.map((v,i)=>cnt[i]>=3?v/cnt[i]:null);
  let pk=-1;profile.forEach((v,i)=>{if(v!==null&&(pk<0||v>profile[pk]))pk=i});
  const mean=key=>{const a=[];for(let k=k0;k<NH;k++)if(h.cls[k]===0&&h[key][k]!==null)a.push(h[key][k]);return a.length?sum(a)/a.length:null};
  let vOut=0,vN=0;for(let k=k0;k<NH;k++)if(h.cls[k]===0&&h.va[k]!==null){vN++;if(h.va[k]<114.3||h.va[k]>139.7)vOut++}
  return {n,d0,k0,days,nDays:wv.length,total,avg:wv.length?total/wv.length:null,profile,pk,
    pf:mean('pf'),va:mean('va'),vOutPct:vN?100*vOut/vN:null,vN};
}

/* ---------- recomendaciones ---------- */
function recs(h,s){
  const R=[],add=(sev,title,body,why)=>R.push({sev,title,body,why});
  if(s.avg===null)return R;
  const prof=s.profile,vals=prof.filter(v=>v!==null),med=median(vals);
  if(s.pk>=0){const pv=prof[s.pk],r=med>0?pv/med:0;
    if(r>=1.8&&pv>=0.5)add('warn',t('Tu consumo se dispara a las {h}',{h:hh(s.pk)}),t('Tu pico está entre las {a} y las {b}: usas {x} kWh por hora, {r} veces lo habitual del resto del día. Evita encender al mismo tiempo varios equipos de alto consumo (lavadora, plancha, horno, aire acondicionado) y reparte su uso en otros horarios.',{a:hh(s.pk),b:hh((s.pk+1)%24),x:fmt(pv,2),r:fmt(r,1)}),t('pico {x} kWh a las {h}; valor típico por hora {m} kWh',{x:fmt(pv,2),h:hh(s.pk),m:fmt(med,2)}))}
  const nb=[1,2,3,4,5].map(i=>prof[i]).filter(v=>v!==null);
  if(nb.length>=3){const base=sum(nb)/nb.length,share=Math.min(100,100*base*24/s.avg);
    if(share>=40&&base>=0.25)add('warn',t('Aun de madrugada consumes {x} kW',{x:fmt(base,2)}),t('Eso es el {p} % de todo lo que gastas al día. Desconecta equipos en espera (TV, consolas, decodificadores, cargadores) y revisa si hay un refrigerador, boiler o bomba trabajando de más.',{p:fmt(share,0)}),t('promedio entre 1:00 y 5:00 h: {x} kW; consumo diario promedio {y} kWh',{x:fmt(base,2),y:fmt(s.avg,1)}));
    else if(share<30)add('good',t('Tu consumo base es bajo'),t('Por las noches solo gastas {x} kW ({p} % del total): los equipos en espera pesan poco en tu recibo.',{x:fmt(base,2),p:fmt(share,0)}),t('promedio entre 1:00 y 5:00 h: {x} kW; consumo diario promedio {y} kWh',{x:fmt(base,2),y:fmt(s.avg,1)}));
    s.base=base;s.baseShare=share}
  const we=s.days.filter(x=>x.val!==null&&[0,6].includes(dayDate(x.d).getDay())),wd=s.days.filter(x=>x.val!==null&&![0,6].includes(dayDate(x.d).getDay()));
  if(we.length>=2&&wd.length>=3){const a=sum(wd.map(x=>x.val))/wd.length,b=sum(we.map(x=>x.val))/we.length;
    if(b>=a*1.25)add('info',t('Los fines de semana gastas {p} % más',{p:fmt(100*(b/a-1),0)}),t('Tu consumo diario sube de {a} a {b} kWh cuando estás en casa. Si puedes, concentra las tareas pesadas (lavado, planchado) en pocos momentos y apaga lo que no uses.',{a:fmt(a,1),b:fmt(b,1)}),t('entre semana {a} kWh/día; fin de semana {b} kWh/día',{a:fmt(a,1),b:fmt(b,1)}))}
  if(s.n>=14){const last=s.days.slice(-7).filter(x=>x.val!==null),prev=s.days.slice(-14,-7).filter(x=>x.val!==null);
    if(last.length>=5&&prev.length>=5){const a=sum(last.map(x=>x.val))/last.length,b=sum(prev.map(x=>x.val))/prev.length,ch=100*(a/b-1);
      const why=t('últimos 7 días {a} kWh/día; 7 días previos {b} kWh/día',{a:fmt(a,1),b:fmt(b,1)});
      if(ch>=15)add('info',t('Tu consumo subió {p} % esta semana',{p:fmt(ch,0)}),t('Los últimos 7 días promedias {a} kWh al día, contra {b} kWh en los 7 días anteriores. Revisa si estrenaste algún equipo o si el clima te hizo usar más el aire acondicionado o el ventilador.',{a:fmt(a,1),b:fmt(b,1)}),why);
      else if(ch<=-15)add('good',t('Tu consumo bajó {p} % esta semana',{p:fmt(-ch,0)}),t('Los últimos 7 días promedias {a} kWh al día, contra {b} kWh en los 7 días anteriores. ¡Buen avance! Mantén esos hábitos.',{a:fmt(a,1),b:fmt(b,1)}),why)}}
  if(s.pf!==null){const w=t('factor de potencia promedio {x}; lo ideal es 0.90 o más',{x:fmt(s.pf,2)});
    if(s.pf<0.3)add('info',t('El factor de potencia medido es muy bajo ({x})',{x:fmt(s.pf,2)}),t('Un valor tan bajo suele indicar un problema de medición, no de tus equipos. Lo revisaremos en el laboratorio.'),w);
    else if(s.pf<0.85)add('warn',t('Tu factor de potencia es bajo ({x})',{x:fmt(s.pf,2)}),t('Significa que parte de la corriente no se aprovecha como trabajo útil; es típico de motores y compresores (aire acondicionado, refrigerador, bombas) o de equipos viejos. En tarifas domésticas normalmente no se cobra, pero puede señalar aparatos ineficientes que vale la pena revisar.'),w);
    else if(s.pf>=0.9)add('good',t('Tu factor de potencia es bueno ({x})',{x:fmt(s.pf,2)}),t('Tu instalación aprovecha bien la corriente que recibe.'),w)}
  if(s.vOutPct!==null&&s.vOutPct>=5)add('warn',t('El voltaje salió de rango el {p} % del tiempo',{p:fmt(s.vOutPct,0)}),t('Un voltaje muy alto o muy bajo acorta la vida de los electrodomésticos. Considera un regulador o supresor de picos para equipos sensibles y repórtalo a CFE si persiste.'),t('rango normal {a}–{b} V; tu promedio fue {x} V',{a:'114',b:'140',x:fmt(s.va,0)}));
  const badS=(h.sensores_det||[]).filter(x=>x.estado!=='OK'),bad=s.n-s.days.filter(x=>x.kind==='ok').length;
  if(badS.length||bad>=3)add('info',t('Algunas lecturas no son confiables'),(badS.length?t('En el periodo hubo {n} días sin dato completo o con estimación, o un medidor con problemas ({m}). Tus gráficas usan solo lecturas confiables; avisa al laboratorio si el problema continúa.',{n:bad,m:badS.map(x=>x.codigo).join(', ')}):t('En el periodo hubo {n} días sin dato completo o con estimación. Tus gráficas usan solo lecturas confiables; avisa al laboratorio si el problema continúa.',{n:bad})),t('días con estimación o sin dato: {n} de {t}',{n:bad,t:s.n}));
  const ord={warn:0,info:1,good:2};R.sort((a,b)=>ord[a.sev]-ord[b.sev]);return R;
}

/* ---------- graficas ---------- */
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),f=v/p;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
function frame(W,Hh,ymax,yfmt,m){
  const ticks=4;let g='';const tf=v=>Number.isInteger(v)?fmt(v,0):fmt(v,1);
  for(let i=0;i<=ticks;i++){const v=ymax*i/ticks,y=m.t+(Hh-m.t-m.b)*(1-i/ticks);
    g+='<line class="gl" x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y+'" y2="'+y+'"/><text class="tx" x="'+(m.l-6)+'" y="'+(y+4)+'" text-anchor="end">'+tf(v)+'</text>'}
  return g;
}
function chartDaily(el,s){
  const W=Math.max(el.clientWidth,260),Hh=230,m={l:38,r:8,t:10,b:26},n=s.days.length,vs=s.days.filter(x=>x.val!==null).map(x=>x.val),ymax=niceMax(Math.max(...vs,0.1)*1.08);
  const iw=W-m.l-m.r,bw=iw/n,y=v=>m.t+(Hh-m.t-m.b)*(1-v/ymax);let g=frame(W,Hh,ymax,v=>fmt(v,v<10&&ymax<10?1:0),m);
  const step=Math.ceil(n/Math.max(2,Math.floor(iw/52)));
  s.days.forEach((x,i)=>{const cx=m.l+bw*i+bw/2,w=Math.min(bw*0.68,34),lab=dLabL(x.d);
    if(x.val===null){g+='<g><title>'+esc(lab+': '+t('Sin dato'))+'</title><rect x="'+(cx-w/2)+'" y="'+(Hh-m.b-3)+'" width="'+w+'" height="3" rx="1.5" fill="#c7c7cc"/></g>'}
    else{const top=y(x.val);g+='<g><title>'+esc(t('{x} kWh el {d}',{x:fmt(x.val,1),d:lab}))+'</title><rect x="'+(cx-w/2)+'" y="'+top+'" width="'+w+'" height="'+Math.max(1,Hh-m.b-top)+'" rx="3" fill="'+(x.kind==='ok'?'#2a78d6':'url(#hat)')+'" stroke="#2a78d6" stroke-width="'+(x.kind==='ok'?0:1.4)+'"/></g>'}
    if(i%step===0||i===n-1&&n<=8)g+='<text class="tx" x="'+cx+'" y="'+(Hh-8)+'" text-anchor="middle">'+dLab(x.d)+'</text>'});
  if(s.avg!==null){const ya=y(s.avg);g+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+ya+'" y2="'+ya+'" stroke="#eb6834" stroke-width="1.6" stroke-dasharray="5 4"/>'}
  el.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="'+esc(t('Consumo diario'))+'"><defs><pattern id="hat" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><rect width="2.6" height="6" fill="#9ec5f4"/></pattern></defs>'+g+'<line class="ax" x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+(Hh-m.b)+'" y2="'+(Hh-m.b)+'"/></svg>';
}
function chartHourly(el,s){
  const W=Math.max(el.clientWidth,260),Hh=230,m={l:38,r:8,t:10,b:26},vs=s.profile.filter(v=>v!==null),ymax=niceMax(Math.max(...vs,0.1)*1.1),iw=W-m.l-m.r,bw=iw/24,y=v=>m.t+(Hh-m.t-m.b)*(1-v/ymax);
  let g=frame(W,Hh,ymax,v=>fmt(v,ymax<5?1:0),m);
  s.profile.forEach((v,i)=>{if(v===null)return;const cx=m.l+bw*i+bw/2,w=bw*0.72,top=y(v);
    g+='<g><title>'+esc(t('{x} kWh a las {h}',{x:fmt(v,2),h:hh(i)}))+'</title><rect x="'+(cx-w/2)+'" y="'+top+'" width="'+w+'" height="'+Math.max(1,Hh-m.b-top)+'" rx="2.5" fill="'+(i===s.pk?'#eb6834':'#2a78d6')+'"/></g>'});
  [0,6,12,18,23].forEach(i=>{g+='<text class="tx" x="'+(m.l+bw*i+bw/2)+'" y="'+(Hh-8)+'" text-anchor="middle">'+i+'</text>'});
  el.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="'+esc(t('Consumo por hora del día'))+'">'+g+'<line class="ax" x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+(Hh-m.b)+'" y2="'+(Hh-m.b)+'"/></svg>';
}
function chartPower(el,s){
  const W=Math.max(el.clientWidth,260),Hh=230,m={l:38,r:10,t:12,b:26},n=s.days.length,pts=s.days.filter(x=>x.mx!==null),ymax=niceMax(Math.max(...pts.map(x=>x.mx),0.1)*1.1),iw=W-m.l-m.r,bw=iw/n,y=v=>m.t+(Hh-m.t-m.b)*(1-v/ymax);
  let g=frame(W,Hh,ymax,v=>fmt(v,ymax<5?1:0),m),line='',pen=false;
  const step=Math.ceil(n/Math.max(2,Math.floor(iw/52)));
  s.days.forEach((x,i)=>{const cx=m.l+bw*i+bw/2;if(x.mx!==null){line+=(pen?'L':'M')+cx.toFixed(1)+' '+y(x.mx).toFixed(1);pen=true}else pen=false;
    if(i%step===0)g+='<text class="tx" x="'+cx+'" y="'+(Hh-8)+'" text-anchor="middle">'+dLab(x.d)+'</text>'});
  g+='<path d="'+line+'" fill="none" stroke="#2a78d6" stroke-width="2" stroke-linejoin="round"/>';
  s.days.forEach((x,i)=>{if(x.mx!==null)g+='<g><title>'+esc(t('{x} kW el {d}',{x:fmt(x.mx,2),d:dLabL(x.d)}))+'</title><circle cx="'+(m.l+bw*i+bw/2)+'" cy="'+y(x.mx)+'" r="3.6" fill="#fff" stroke="#2a78d6" stroke-width="2"/></g>'});
  el.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="'+esc(t('Potencia máxima por día'))+'">'+g+'<line class="ax" x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+(Hh-m.b)+'" y2="'+(Hh-m.b)+'"/></svg>';
}
function chartVolt(el,h,s){
  const W=Math.max(el.clientWidth,260),Hh=230,m={l:38,r:10,t:12,b:26},k0=s.k0,N=NH-k0,iw=W-m.l-m.r,lo=105,hi=145,y=v=>m.t+(Hh-m.t-m.b)*(1-(v-lo)/(hi-lo));
  let g='';[110,120,130,140].forEach(v=>{g+='<line class="gl" x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text class="tx" x="'+(m.l-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v+'</text>'});
  g+='<rect x="'+m.l+'" y="'+y(139.7)+'" width="'+iw+'" height="'+(y(114.3)-y(139.7))+'" fill="rgba(10,10,11,.06)"/>';
  let line='',pen=false;
  for(let k=k0;k<NH;k++){const v=h.cls[k]===0?h.va[k]:null,x=m.l+iw*(k-k0)/(N-1);if(v!==null){line+=(pen?'L':'M')+x.toFixed(1)+' '+y(Math.min(hi,Math.max(lo,v))).toFixed(1);pen=true}else pen=false}
  g+='<path d="'+line+'" fill="none" stroke="#1baf7a" stroke-width="1.6" stroke-linejoin="round"/>';
  const nd=s.days.length,step=Math.ceil(nd/Math.max(2,Math.floor(iw/52)));
  s.days.forEach((x,i)=>{if(i%step===0)g+='<text class="tx" x="'+(m.l+iw*(i*24)/(N-1))+'" y="'+(Hh-8)+'" text-anchor="start">'+dLab(x.d)+'</text>'});
  el.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" role="img" aria-label="'+esc(t('Voltaje'))+'">'+g+'<line class="ax" x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+(Hh-m.b)+'" y2="'+(Hh-m.b)+'"/></svg>';
}

/* ---------- pantalla ---------- */
const ICON={warn:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b97b00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
 good:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a850a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
 info:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a78d6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'};
const SLAB={OK:'Funciona bien',INTERMITENTE:'Señal intermitente',CONGELADO:'Sin lecturas nuevas',SIN_DATOS:'Sin datos',SIN_VOLTAJE:'Sin voltaje'};
const SSEV={OK:'good',INTERMITENTE:'warn',SIN_VOLTAJE:'warn',CONGELADO:'crit',SIN_DATOS:'crit'};
let S0=null;

function sensorsHtml(){
  return '<h2 class="sh">'+t('Mis medidores')+'</h2><p class="sh-p">'+t('Estado de cada medidor instalado en tu vivienda.')+'</p><div class="sens">'+
  (H.sensores_det||[]).map(x=>{let k=-1;for(let i=NH-1;i>=0;i--)if(x.cls[i]===0){k=i;break}
    const last=k<0?t('Última lectura confiable: ninguna'):t('Última lectura confiable: {d}',{d:dLabL(Math.floor(k/24))+', '+hh(k%24)});
    return '<div class="sn"><b>'+esc(t('Medidor {c}',{c:x.codigo}))+'</b><span class="m">'+esc(last)+'</span><span class="pill '+SSEV[x.estado]+'"><i></i>'+t(SLAB[x.estado])+'</span></div>'}).join('')+'</div>';
}
function render(){
  const s=S0=stats(H,state.range),n=state.range;
  document.title=t('Mi vivienda · SNRGY');
  $('#hT').textContent=H.codigo;
  $('#hS').textContent=t('Datos del {a} al {b}',{a:dLab(ND-n),b:dLab(ND-1)});
  const end=Date.parse(META.datos_hasta+':00-06:00'),age=Date.now()-end,m=Math.round(age/60000),hrs=Math.round(m/60),dd=Math.round(hrs/24);
  const ago=m<2?t('hace un momento'):m<60?'':hrs<48?t('hace {n} h',{n:hrs}):t(dd===1?'hace {n} día':'hace {n} días',{n:dd});
  const fr=$('#fresh');fr.className='fresh '+(age<=90*60000?'live':age<=24*3600000?'late':'');
  fr.querySelector('span').textContent=t('Última lectura: {d} ({ago})',{d:fmtDT(META.datos_hasta),ago:ago||(m+' min')});
  let html='';
  if(s.avg===null){
    html='<div class="empty" style="margin-top:20px"><h2>'+t('Todavía no hay lecturas confiables de tu vivienda')+'</h2><p>'+t('Tus medidores no han enviado datos válidos en el periodo elegido, así que no podemos calcular tu consumo ni darte recomendaciones. El laboratorio ya recibe este aviso; si tienes dudas, contáctalos.')+'</p></div>'+sensorsHtml();
    $('#body').innerHTML=html;return;
  }
  const R=recs(H,s);
  const kp=(l,v,u,sub)=>'<div class="kpi"><div class="l">'+l+'</div><div class="v">'+v+(u?'<small>'+u+'</small>':'')+'</div><div class="s">'+sub+'</div></div>';
  html+='<div class="kpis">'
   +kp(t('Consumo diario promedio'),fmt(s.avg,1),'kWh',t('{a} de {b} días con dato',{a:s.nDays,b:s.n}))
   +kp(t('Total del periodo'),fmt(s.total,0),'kWh',t('últimos {n} días',{n:s.n}))
   +kp(t('Hora de mayor consumo'),s.pk>=0?hh(s.pk):'—','',s.pk>=0?t('{x} kWh por hora',{x:fmt(s.profile[s.pk],2)}):t('Sin dato'))
   +kp(t('Consumo base de madrugada'),s.base!==undefined?fmt(s.base,2):'—',s.base!==undefined?'kW':'',s.base!==undefined?t('{p} % de tu consumo',{p:fmt(s.baseShare,0)}):t('Sin dato'))
   +kp(t('Factor de potencia'),s.pf!==null?fmt(s.pf,2):'—','',s.pf!==null?t('Entre 0 y 1; más cerca de 1 es mejor'):t('Sin dato'))
   +kp(t('Voltaje promedio'),s.va!==null?fmt(s.va,0):'—',s.va!==null?'V':'',t('Rango normal {a}–{b} V',{a:114,b:140}))
   +'</div>';
  html+='<h2 class="sh">'+t('Recomendaciones para ti')+'</h2><p class="sh-p">'+t('Calculadas con tus lecturas confiables de los últimos {n} días.',{n})+'</p><div class="recs">'
   +R.map(r=>'<article class="rec '+r.sev+'"><h3>'+ICON[r.sev]+'<span>'+esc(r.title)+'</span></h3><p>'+esc(r.body)+'</p><div class="why">'+esc(t('Dato: {x}',{x:r.why}))+'</div></article>').join('')+'</div>';
  html+='<h2 class="sh">'+t('Tu consumo')+'</h2><div class="charts">'
   +'<div class="card wide"><h3>'+t('Consumo diario')+'</h3><p class="cs">'+t('Energía total de cada día (kWh). Las barras con rayas son estimaciones.')+'</p><div class="ch" id="c1"></div><div class="lg"><span><i style="background:#2a78d6"></i>'+t('Día completo')+'</span><span><i style="background:repeating-linear-gradient(45deg,#9ec5f4 0 3px,#fff 3px 6px);border:1px solid #2a78d6"></i>'+t('Día estimado')+'</span><span><i style="background:#c7c7cc;height:4px"></i>'+t('Sin dato')+'</span><span><i style="background:none;border-top:2px dashed #eb6834;height:0;border-radius:0"></i>'+t('Promedio')+' '+fmt(s.avg,1)+' kWh</span></div></div>'
   +'<div class="card"><h3>'+t('Consumo por hora del día')+'</h3><p class="cs">'+t('Promedio de cada hora (kWh). La más alta se marca en naranja.')+'</p><div class="ch" id="c2"></div></div>'
   +'<div class="card"><h3>'+t('Potencia máxima por día')+'</h3><p class="cs">'+t('Lo más alto que llegó tu consumo en una hora (kW).')+'</p><div class="ch" id="c3"></div></div>'
   +(s.va!==null?'<div class="card wide"><h3>'+t('Voltaje')+'</h3><p class="cs">'+t('Voltaje de tu instalación (V). La franja gris es el rango normal.')+'</p><div class="ch" id="c4"></div></div>':'')
   +'</div>'+sensorsHtml();
  $('#body').innerHTML=html;drawCharts();
}
function drawCharts(){
  if(!S0||S0.avg===null)return;const s=S0;
  const a=$('#c1'),b=$('#c2'),c=$('#c3'),d=$('#c4');
  if(a)chartDaily(a,s);if(b)chartHourly(b,s);if(c)chartPower(c,s);if(d)chartVolt(d,H,s);
}

async function init(){
  const p=await S.require('habitante');if(!p)return;
  ['hT','banner','body'].forEach(id=>$('#'+id).setAttribute('data-noi18n',''));
  S.bindLang(()=>{if(H)render()});
  $('#out').addEventListener('click',async()=>{await S.logout();location.href='index.html'});
  document.querySelectorAll('#range button').forEach(b=>b.addEventListener('click',()=>{state.range=+b.dataset.n;document.querySelectorAll('#range button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()}));
  try{META=await S.loadMeta();H=await S.loadHouse(p.vivienda)}
  catch(e){$('#loading').hidden=true;$('#fail').hidden=false;return}
  ND=META.dias;NH=META.horas;START=META.inicio.slice(0,10).split('-').map(Number);
  $('#loading').hidden=true;$('#app').hidden=false;render();
  let w=0;new ResizeObserver(()=>{const x=$('#app').clientWidth;if(x!==w){w=x;requestAnimationFrame(drawCharts)}}).observe($('#app'));
}
init();
})();
