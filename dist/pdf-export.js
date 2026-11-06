/* jsPDF 4.2.1 (MIT), bundled locally; no external request during export. */
(function(root){
 function build({opportunities,apps,checked,horizon,filters=[],categoryOf=o=>apps[o.id].category,profileLabel=a=>a.cnpj}){
  if(!opportunities.length)throw new Error('Nenhuma ficha para exportar.');
  const pdf=new root.jspdf.jsPDF({unit:'mm',format:'a4',compress:true});
  pdf.setProperties({title:'Radar Games - Oportunidades e requisitos',author:'Radar Games'});
  const labels={current:'Chamadas e canais abertos',watch:'Em acompanhamento',closed:'Encerrado'};
  const clean=v=>String(v??'').replace(/[\u2010-\u2015\u2212]/g,'-').replace(/[\u202f\u00a0]/g,' ').replace(/[\u0000-\u0008\u000b-\u001f]/g,'');
  let y=20,continuation='Radar Games';
  const page=()=>{pdf.addPage();y=16;pdf.setFont('helvetica','normal').setFontSize(8).setTextColor(91,107,128);pdf.text(pdf.splitTextToSize(clean(continuation)+' (continuação)',178),16,y);y+=10;};
  function text(value,{size=10,bold=false,color=[35,52,74],after=2,url=null}={}){
   pdf.setFont('helvetica',bold?'bold':'normal').setFontSize(size).setTextColor(...color);
   const lines=pdf.splitTextToSize(clean(value),178),step=size*.35278*1.4;
   for(const line of lines){
    if(y+step>278){page();pdf.setFont('helvetica',bold?'bold':'normal').setFontSize(size).setTextColor(...color);}
    pdf.text(line,16,y);
    if(url&&/^https?:\/\//i.test(url))pdf.link(16,y-size*.35278,Math.min(178,pdf.getTextWidth(line)),step,{url});
    y+=step;
   }
   y+=after;
  }
  function heading(value){if(y>258)page();y+=3;text(value,{size:11,bold:true,color:[36,88,198],after:2});}
  const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)?v.split('-').reverse().join('/'):v;
  text('RADAR GAMES',{size:10,bold:true,color:[36,88,198]});
  text('Oportunidades e requisitos',{size:23,bold:true,after:4});
  text(`${opportunities.length} ${opportunities.length===1?'ficha':'fichas'} | Pesquisa: ${date(checked)} | Horizonte: ${date(horizon)}`,{size:10,bold:true});
  text(`Exportado em ${new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (Brasília)`,{size:9});
  text('Filtros: '+filters.join(' | '),{size:9});
  text('Síntese do levantamento. Confira edital, anexos e retificações antes da inscrição. Canais de parceria não garantem contratação ou financiamento.',{size:9,after:4});
  opportunities.forEach((o,index)=>{
   const a=apps[o.id];continuation=a.short;
   if(index){pdf.addPage();y=20;}
   text(`FICHA ${index+1} / ${opportunities.length} | ${labels[categoryOf(o)]||categoryOf(o)}`,{size:9,bold:true,color:[36,88,198]});
   text(a.short,{size:19,bold:true});text(a.host,{size:10});
   text(`${a.stage} | ${a.tags.join(' · ')}`,{size:9});
   text('Abrangência: '+a.territoryLabel,{bold:true});
   text(profileLabel(a),{bold:true});if(a.profileNote)text(a.profileNote);
   text(a.verdict,{bold:true,color:[128,75,28],after:3});
   heading('Prazo para participar');text(categoryOf(o)==='closed'&&a.category==='current'?'Prazo encerrado':a.deadline,{bold:true});text(a.deadlineDetail);
   heading('Apoio por projeto');text(a.support,{bold:true});text(a.supportDetail);
   heading('Quem pode participar');o.requirements.forEach(v=>text('- '+v));
   text('Contrapartida / custos: '+a.cost,{size:9});
   heading('O que preparar para a inscrição');
   a.deliverables.forEach(d=>text('- '+d.text+' ['+({unknown:'Não confirmado no levantamento',historical:'Referência da edição passada'}[d.state]||'Informado na fonte')+']'));
   text('Esta síntese não substitui a lista completa de anexos exigidos.',{size:9});
   heading('O que pode impedir a participação');a.blockers.forEach(v=>text('- '+v));
   heading('Como avançar');text(a.how);if(a.reason)text(a.reason);
   heading('Fonte, pendências e verificação');text(a.sourceLabel,{bold:true});text(a.evidenceNote);o.gaps.forEach(v=>text('- '+v));
   heading('Links para consulta');
   const links=[['Fonte oficial',a.sourceUrl],['Edital / documento',a.docsUrl],['Fonte do levantamento',o.url]].filter(([,url],i,all)=>url&&all.findIndex(([,other])=>other===url)===i);
   links.forEach(([label,url])=>{text(label,{size:9,bold:true,after:0});text(url,{size:8,color:[36,88,198],url});});
  });
  const pages=pdf.getNumberOfPages();
  for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setDrawColor(210,219,232).line(16,283,194,283);pdf.setFont('helvetica','normal').setFontSize(8).setTextColor(91,107,128);pdf.text('Radar Games | Pesquisa de '+date(checked),16,289);pdf.text(`${i} / ${pages}`,194,289,{align:'right'});}
  return pdf;
 }
 root.RADAR_PDF={build};
})(typeof window==='undefined'?globalThis:window);
