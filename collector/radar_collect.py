"""Coleta pública conservadora. Descobertas vão para revisão, nunca viram edital aberto por heurística."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, date, timezone, timedelta
from hashlib import sha256
from html.parser import HTMLParser
import io, ipaddress, json, re, sys, threading, time
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit, parse_qsl, urlencode
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError
from urllib.robotparser import RobotFileParser
import unicodedata

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'vendor'))
UA = 'FaseBonusResearch/1.0'
BR = timezone(timedelta(hours=-3), 'America/Sao_Paulo')
MAX_BYTES = 8 * 1024 * 1024
DISCOVERY_TERMS = ['edital','chamada','desafio','retifica','cronograma','apply','pitch','inscri','submission','grant','funding','oportunidade','financi',
                   'games','jogos','gamific','serious','premio','concurso','convocatoria','open call','challenge','jam','fomento','aceleracao','bolsa']
# Busca por palavra-chave em bases públicas nacionais: o resultado só vai para revisão humana.
GAME_TERMS = ['"jogos digitais"','"jogo digital"','"jogos eletrônicos"','"jogo eletrônico"','gamificação','"jogo educativo"','"jogos educativos"','"serious game"','"jogos sérios"']
GAME_RE = re.compile(r'jogos?\s+(digita|eletronic|educativ|serio)|gamific|serious game|desenvolvimento de (jogo|game)|\bgames?\b')
CALL_RE = re.compile(r'edital|chamamento|chamada publica|concurso|premiac|selecao de projetos|credenciamento|licitac|contratac|pregao')
NOISE_RE = re.compile(r'jogos? (escolar|de azar|de mesa|de futebol|de tabuleiro para|recreativ|pedagogic)|jogos estudantis|jogos abertos|jogos municipais|loteria|kits? de|brinquedo|academia|material esportivo|uniforme|materia(l|is) (pedagogic|didatic|escolar)|recursos didaticos|laboratorio de matematica|aquisicao de programa')
DOMAIN_LOCKS: dict[str, threading.Lock] = {}
GUARD = threading.Lock()

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')

def canonical(url):
    p = urlsplit(url)
    query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
             if not k.lower().startswith('utm_') and k.lower() not in {'fbclid','gclid','trk'}]
    return urlunsplit((p.scheme.lower(), p.netloc.lower(), p.path or '/', urlencode(sorted(query)), ''))

def public_url(url):
    p = urlsplit(url)
    if p.scheme not in {'https','http'} or not p.hostname or p.username or p.password:
        return False
    h = p.hostname.lower()
    if h == 'localhost' or h.endswith(('.localhost','.local','.internal')) or '.' not in h:
        return False
    try:
        return ipaddress.ip_address(h).is_global
    except ValueError:
        return True

class SafeRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not public_url(newurl) or urlsplit(newurl).hostname.removeprefix('www.') != urlsplit(req.full_url).hostname.removeprefix('www.'):
            raise ValueError('Redirecionamento para destino não público recusado')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

class PageParser(HTMLParser):
    ignored = {'script','style','nav','footer','header','noscript','template'}
    blocks = {'p','div','section','article','h1','h2','h3','h4','li','tr','br','dt','dd'}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts=[]; self.links=[]; self.skip=0; self.a=None; self.title_parts=[]; self.in_title=False
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if tag in self.ignored: self.skip+=1
        if tag=='title': self.in_title=True
        if self.skip: return
        if tag in self.blocks: self.parts.append('\n')
        if tag=='a': self.a={'href':d.get('href',''),'parts':[]}
    def handle_endtag(self, tag):
        if tag=='title': self.in_title=False
        if tag in self.ignored:
            self.skip=max(0,self.skip-1); return
        if self.skip: return
        if tag=='a' and self.a:
            self.links.append({'href':self.a['href'],'text':' '.join(self.a['parts']).strip()}); self.a=None
        if tag in self.blocks: self.parts.append('\n')
    def handle_data(self, data):
        if self.in_title: self.title_parts.append(data)
        if not self.skip:
            self.parts.append(data.strip()+' ')
            if self.a: self.a['parts'].append(data.strip())
    @property
    def text(self):
        return '\n'.join(re.sub(r'\s+',' ',line).strip() for line in ''.join(self.parts).splitlines() if line.strip())

def parse_document(body, content_type, url):
    if 'pdf' in content_type.lower() or body.startswith(b'%PDF'):
        try: from pypdf import PdfReader
        except ImportError as e: raise RuntimeError('Instale requirements.txt no diretório vendor para ler PDFs') from e
        reader=PdfReader(io.BytesIO(body))
        text='\n'.join((page.extract_text() or '') for page in list(reader.pages)[:100])[:350000]
        if len(text.strip())<60: raise RuntimeError('PDF sem texto suficiente; requer revisão/OCR')
        return {'title':urlsplit(url).path.rsplit('/',1)[-1], 'text':text, 'links':[], 'kind':'pdf'}
    parser=PageParser()
    charset=re.search(r'charset=([\w-]+)', content_type)
    parser.feed(body.decode(charset.group(1) if charset else 'utf-8',errors='replace'))
    if len(re.findall(r'\{\{[^{}]{1,180}\}\}',parser.text))>=5:
        raise RuntimeError('Página com template não renderizado; requer JavaScript e revisão em navegador')
    if len(parser.text)<60: raise RuntimeError('Página sem conteúdo suficiente; pode exigir JavaScript ou revisão manual')
    return {'title':' '.join(parser.title_parts).strip(), 'text':parser.text[:350000], 'links':parser.links, 'kind':'html'}

def date_evidence(text):
    out=[]
    for m in re.finditer(r'\b(\d{2})/(\d{2})/(20\d{2})\b|\b(20\d{2})-(\d{2})-(\d{2})\b', text):
        try:
            iso=date(int(m[3]),int(m[2]),int(m[1])) if m[1] else date(int(m[4]),int(m[5]),int(m[6]))
        except ValueError: continue
        context=text[max(0,m.start()-110):m.end()+140].strip()
        n=norm(context)
        labels=[]
        for kind,terms in {'inscricao':['inscri','submiss','submission','apply by'], 'execucao':['execucao','experimentacao','inicio das aulas'], 'resultado':['resultado','avaliacao','notices','review period']}.items():
            if any(t in n for t in terms): labels.append(kind)
        out.append({'date':iso.isoformat(),'possible_roles':labels or ['nao_identificado'],'context':context,'requires_review':True})
    return out[:100]

def discovery_links(page, base, allowed_domains):
    unique={}
    for link in page['links']:
        url=canonical(urljoin(base,link['href']))
        # Alguns portais oficiais usam wrappers de documentos com URL pública em query string.
        wrapped=dict(parse_qsl(urlsplit(url).query)).get('url')
        if wrapped and urlsplit(wrapped).hostname in allowed_domains and public_url(wrapped):
            url=canonical(wrapped)
        if not public_url(url) or urlsplit(url).hostname not in allowed_domains: continue
        if url==canonical(base): continue
        n=norm(link['text']+' '+urlsplit(url).path)
        if not any(w in n for w in DISCOVERY_TERMS): continue
        if any(w in n for w in ['login','logout','wp-login','privacy','politica-de-privacidade','/tag/','/category/']): continue
        unique.setdefault(url,{'url':url,'label':link['text'][:180] or urlsplit(url).path,'requires_review':True,'kind':'document' if urlsplit(url).path.lower().endswith('.pdf') else 'candidate_or_listing'})
    return list(unique.values())[:60]

def atomic_json(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    tmp.replace(path)

def merge_result(previous, result):
    """Falha preserva evidência anterior e o último sucesso."""
    merged={**(previous or {}),**result}
    if result.get('status') not in {'ok','unchanged','cached','partial'}:
        for key in ['last_success','documents','candidates','content_hash']:
            if previous and key in previous: merged[key]=previous[key]
    return merged

class Fetcher:
    def __init__(self):
        self.opener=build_opener(SafeRedirect()); self.robots={}
    def raw(self,url):
        if not public_url(url): raise ValueError('Destino não público recusado')
        last=None
        for attempt in range(2):
            try:
                with self.opener.open(Request(url,headers={'User-Agent':UA,'Accept':'text/html,application/pdf;q=0.9,*/*;q=0.2'}),timeout=12) as r:
                    size=r.headers.get('Content-Length')
                    if size and int(size)>MAX_BYTES: raise ValueError('Documento excede 8 MB')
                    body=r.read(MAX_BYTES+1)
                    if len(body)>MAX_BYTES: raise ValueError('Documento excede 8 MB')
                    return body,r.headers.get('Content-Type',''),r.url
            except HTTPError as e:
                if e.code not in {500,502,503,504}: raise
                last=e
            except (URLError,TimeoutError) as e: last=e
            if attempt==0: time.sleep(1.0)
        raise last
    def fetch(self,url):
        host=urlsplit(url).netloc
        with GUARD: lock=DOMAIN_LOCKS.setdefault(host,threading.Lock())
        with lock:
            if host not in self.robots:
                robot_url=urlunsplit((urlsplit(url).scheme,host,'/robots.txt','',''))
                rp=RobotFileParser()
                try:
                    body,_,_=self.raw(robot_url); rp.parse(body.decode('utf-8',errors='replace').splitlines())
                except HTTPError as e:
                    if e.code==404: rp.parse(['User-agent: *','Allow: /'])
                    else: raise RuntimeError('robots.txt indisponível ou acesso recusado') from e
                self.robots[host]=rp
            rp=self.robots[host]
            if not rp.can_fetch(UA,url): raise RuntimeError('Acesso não permitido pelo robots.txt')
            delay=max(rp.crawl_delay(UA) or 0,0.8)
            if delay>10: raise RuntimeError('Crawl-delay elevado; requer uma coleta com intervalo dedicado')
            time.sleep(delay)
            result=self.raw(url)
            if result[2]!=url and not rp.can_fetch(UA,result[2]) and urlsplit(result[2]).netloc==host:
                raise RuntimeError('Destino redirecionado não permitido pelo robots.txt')
            return result

def collect_source(source,previous,fetcher,state_dir,max_details,now):
    sid=source['id']; attempted={'id':sid,'name':source['name'],'url':source['url'],'last_attempt':now}
    try:
        documents=[]; candidates=[]
        urls=[source['url']]+source.get('documents',[])
        body,ct,final=fetcher.fetch(urls[0]); page=parse_document(body,ct,final)
        if any(norm(term) not in norm(page['text']) for term in source.get('required_text',[])):
            raise RuntimeError('Conteúdo esperado da chamada ausente; página pode exigir JavaScript e revisão em navegador')
        links=discovery_links(page,final,set(source.get('allowed_domains',[]))|{urlsplit(final).hostname})
        candidates=links
        # Apenas anexos explicitamente configurados e descoberta limitada de documentos do mesmo portal.
        urls += [c['url'] for c in links if urlsplit(c['url']).path.lower().endswith('.pdf')]
        urls=list(dict.fromkeys(urls))[:1+max_details]
        for index,url in enumerate(urls):
            try:
                if index: body,ct,final=fetcher.fetch(url); page=parse_document(body,ct,final)
                digest=sha256(body).hexdigest()
                snapshot=state_dir/'snapshots'/(digest+('.pdf' if page['kind']=='pdf' else '.html'))
                snapshot.parent.mkdir(parents=True,exist_ok=True)
                if not snapshot.exists(): snapshot.write_bytes(body)
                documents.append({'url':url,'final_url':final,'hash':digest,'title':page['title'],'kind':page['kind'],'dates':date_evidence(page['text']),'cnpj_contexts':[line[:350] for line in page['text'].splitlines() if any(w in norm(line) for w in ['cnpj','pessoa fisica','sem empresa','legal entity'])][:20],'review_required':True})
            except Exception as e:
                old_doc=next((d for d in (previous or {}).get('documents',[]) if canonical(d['url'])==canonical(url)),{})
                documents.append({**old_doc,'url':url,'status':'error','error':str(e)[:180]})
        hashes=sha256(''.join(d.get('hash','error') for d in documents).encode()).hexdigest()
        partial=any(d.get('status')=='error' for d in documents)
        status='partial' if partial else 'unchanged' if previous and hashes==previous.get('content_hash') else 'ok'
        last_success=(previous or {}).get('last_success') if partial else now
        return merge_result(previous,{**attempted,'status':status,'last_success':last_success,'content_hash':hashes,'documents':documents,'candidates':candidates,'error':'Uma página ou anexo não pôde ser atualizado' if partial else None})
    except Exception as e:
        return merge_result(previous,{**attempted,'status':'error','error':str(e)[:220]})

def is_game_call(text):
    """Separa chamada ligada a jogos de ruído como jogos escolares ou compra de kits."""
    n=norm(text)
    return bool(GAME_RE.search(n)) and bool(CALL_RE.search(n)) and not NOISE_RE.search(n)

class PublicRedirect(HTTPRedirectHandler):
    """As APIs de descoberta redirecionam entre subdomínios; só o destino público é exigido."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not public_url(newurl): raise ValueError('Redirecionamento para destino não público recusado')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def api_json(url,attempts=5,timeout=40):
    last=None
    for attempt in range(attempts):
        try:
            with build_opener(PublicRedirect()).open(Request(url,headers={'User-Agent':UA,'Accept':'application/json'}),timeout=timeout) as r:
                return json.loads(r.read(MAX_BYTES))
        except (OSError,ValueError) as e:
            last=e;time.sleep(1.5+attempt)
    raise RuntimeError(str(last)[:160])

def discover_pncp(terms,sleep=1.5):
    """Portal Nacional de Contratações Públicas: editais recebendo proposta."""
    found={};errors=[]
    for term in terms:
        url='https://pncp.gov.br/api/search/?'+urlencode({'q':term,'tipos_documento':'edital','status':'recebendo_proposta','ordenacao':'-data','pagina':1,'tam_pagina':30})
        try: items=api_json(url).get('items',[])
        except RuntimeError as e:
            errors.append(f'PNCP {term}: {e}');continue
        for i in items:
            text=f"{i.get('title','')} {i.get('description','')}"
            if not is_game_call(text) or not i.get('item_url'): continue
            link='https://pncp.gov.br/app/editais'+i['item_url'].removeprefix('/compras')
            found[link]={'url':link,'source':'PNCP','title':(i.get('title') or 'Edital')[:160],'excerpt':(i.get('description') or '')[:320],'org':i.get('orgao_nome'),'uf':i.get('uf'),'date':(i.get('data_fim_vigencia') or '')[:10],'dateLabel':'Propostas até','term':term,'requires_review':True}
        time.sleep(sleep)
    return list(found.values()),errors

def discover_diarios(terms,since,sleep=1.5):
    """Querido Diário: diários oficiais municipais com menção a jogos e a edital."""
    found={};errors=[]
    for term in terms:
        url='https://queridodiario.ok.org.br/api/gazettes?'+urlencode({'querystring':term,'published_since':since,'size':30,'excerpt_size':500,'number_of_excerpts':1,'sort_by':'descending_date'})
        try: gazettes=api_json(url).get('gazettes',[])
        except RuntimeError as e:
            errors.append(f'Querido Diário {term}: {e}');continue
        for g in gazettes:
            excerpt=' '.join((g.get('excerpts') or [''])[0].split())
            if not is_game_call(excerpt) or not g.get('url'): continue
            found[g['url']]={'url':g['url'],'source':'Querido Diário','title':f"Diário oficial de {g.get('territory_name')}",'excerpt':excerpt[:320],'org':g.get('territory_name'),'uf':g.get('state_code'),'date':g.get('date'),'dateLabel':'Publicado em','term':term,'requires_review':True}
        time.sleep(sleep)
    return list(found.values()),errors

def discover(now):
    since=(datetime.fromisoformat(now)-timedelta(days=60)).date().isoformat()
    pncp,pncp_errors=discover_pncp(GAME_TERMS)
    diarios,diario_errors=discover_diarios(GAME_TERMS,since)
    items=sorted(pncp,key=lambda x:x['date'] or '')+sorted(diarios,key=lambda x:x['date'] or '',reverse=True)
    return {'lastRun':now,'since':since,'terms':GAME_TERMS,'items':items,'errors':pncp_errors+diario_errors}

def build_site(reviewed_path, state, dist, now):
    catalog=json.loads(reviewed_path.read_text(encoding='utf-8'))
    radar=catalog['radar']; apps=catalog['applications']
    today=datetime.fromisoformat(now).astimezone(BR).date().isoformat()
    by_url={canonical(s['url']):s for s in state.get('sources',{}).values()}
    for o in radar['opportunities']:
        a=apps[o['id']]
        close=a.get('closeDate')
        close_at=a.get('closeAt')
        expired=(datetime.fromisoformat(close_at)<datetime.fromisoformat(now)) if close_at else bool(close and close<today)
        if expired and a['category']=='current':
            a['category']='closed';a['ready']='Prazo encerrado';a['tone']='gray'
        # Consulta técnica não substitui verificação editorial.
        health=by_url.get(canonical(a['sourceUrl']))
        if health:
            a['collectionStatus']=health['status'];a['lastFetched']=health.get('last_success')
    dist.mkdir(parents=True,exist_ok=True)
    for name,var,value in [('data.js','RADAR',radar),('application.js','APPLICATIONS',apps)]:
        encoded='window.'+var+' = '+json.dumps(value,ensure_ascii=False,indent=2)+';\n'
        target=dist/name
        if not target.exists() or target.read_text(encoding='utf-8')!=encoded:
            tmp=target.with_suffix('.tmp');tmp.write_text(encoded,encoding='utf-8');tmp.replace(target)
    report={'mode':'semanal','scheduled':True,'lastRun':state.get('last_run'),'sourceCount':len(radar['sources']),'registeredSources':len(state.get('sources',{})), 'successCount':sum(s['status'] in {'ok','unchanged','cached'} for s in state.get('sources',{}).values()),'errorCount':sum(s['status'] in {'error','partial'} for s in state.get('sources',{}).values()),'candidateCount':len({canonical(c['url']) for s in state.get('sources',{}).values() for c in s.get('candidates',[])}),'sources':[{'id':s['id'],'name':s['name'],'url':s['url'],'status':s['status'],'lastAttempt':s.get('last_attempt'),'lastSuccess':s.get('last_success'),'error':s.get('error'),'documentCount':sum('hash' in d for d in s.get('documents',[]))} for s in state.get('sources',{}).values()]}
    (dist/'collection-status.js').write_text('window.COLLECTION = '+json.dumps(report,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    discoveries=state.get('discoveries') or {'lastRun':None,'items':[],'errors':[],'terms':GAME_TERMS}
    (dist/'discoveries.js').write_text('window.DISCOVERIES = '+json.dumps(discoveries,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    return report

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',action='append',help='IDs das fontes; repita para escolher várias')
    p.add_argument('--limit',type=int,default=100)
    p.add_argument('--max-details',type=int,default=1)
    p.add_argument('--workers',type=int,default=3)
    p.add_argument('--build-only',action='store_true',help='Gera o site a partir da curadoria; não acessa a rede')
    p.add_argument('--discover',action='store_true',help='Procura editais de jogos no PNCP e no Querido Diário; os achados vão apenas para revisão')
    p.add_argument('--state-dir',type=Path,default=ROOT/'state')
    args=p.parse_args()
    sources=json.loads((ROOT/'sources.json').read_text(encoding='utf-8'))
    if args.source:
        unknown=set(args.source)-{s['id'] for s in sources}
        if unknown: p.error('Fontes desconhecidas: '+', '.join(sorted(unknown)))
        sources=[s for s in sources if s['id'] in args.source]
    sources=sources[:max(0,args.limit)]
    args.state_dir.mkdir(parents=True,exist_ok=True)
    state_path=args.state_dir/'state.json'
    state=json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {'sources':{}}
    now=datetime.now(BR).isoformat(timespec='seconds')
    if args.discover:
        previous=state.get('discoveries') or {}
        result=discover(now)
        # Base fora do ar não apaga o que já tinha sido encontrado.
        if not result['items'] and result['errors'] and previous.get('items'):
            result={**previous,'errors':result['errors']}
        state['discoveries']=result;atomic_json(state_path,state)
        print(f"descoberta: {len(result['items'])} achados; {len(result['errors'])} consultas com falha",flush=True)
    elif not args.build_only:
        fetcher=Fetcher()
        with ThreadPoolExecutor(max_workers=max(1,min(args.workers,4))) as pool:
            jobs={pool.submit(collect_source,s,state['sources'].get(s['id']),fetcher,args.state_dir,max(0,min(args.max_details,3)),now):s for s in sources}
            for job in as_completed(jobs):
                result=job.result();state['sources'][result['id']]=result
                print(f"{result['id']}: {result['status']} ({len(result.get('documents',[]))} documentos)",flush=True)
                atomic_json(state_path,state)
        state['last_run']=now;atomic_json(state_path,state)
        queue={}
        for sid,source in state['sources'].items():
            for c in source.get('candidates',[]):
                key=canonical(c['url'])
                item=queue.setdefault(key,{'candidate_id':sha256(key.encode()).hexdigest()[:16],'source_ids':[],**c})
                item['source_ids'].append(sid)
        atomic_json(args.state_dir/'review-queue.json',list(queue.values()))
    report=build_site(ROOT/'reviewed.json',state,ROOT.parent/'dist',now)
    print(json.dumps({k:report[k] for k in ['mode','successCount','errorCount','candidateCount']},ensure_ascii=False),flush=True)

if __name__=='__main__': main()
