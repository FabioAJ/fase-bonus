import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('radar_collect',Path(__file__).with_name('radar_collect.py'))
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

class CollectorTests(unittest.TestCase):
    def test_dates_preserve_roles_and_do_not_invent_year(self):
        found=mod.date_evidence('Inscrições até 30/11/2026.\n'+' '*300+'Execução começa em 15/02/2027. Dia 31/02/2027 inválido; 10/12 sem ano.')
        self.assertEqual([d['date'] for d in found],['2026-11-30','2027-02-15'])
        self.assertEqual(found[0]['possible_roles'],['inscricao'])
        self.assertEqual(found[1]['possible_roles'],['execucao'])
        self.assertTrue(all(d['requires_review'] for d in found))
    def test_failure_retains_last_good_evidence(self):
        old={'status':'ok','last_success':'2026-11-05','documents':[{'hash':'good'}],'candidates':[{'url':'https://example.com/a'}]}
        result=mod.merge_result(old,{'status':'error','last_attempt':'2026-11-06','error':'timeout'})
        self.assertEqual(result['documents'],old['documents'])
        self.assertEqual(result['last_success'],'2026-11-05')
        self.assertEqual(result['status'],'error')
    def test_dedup_keeps_edition_and_discards_tracking(self):
        self.assertEqual(mod.canonical('https://EXAMPLE.com/call?utm_source=a&edition=2027#x'),'https://example.com/call?edition=2027')
        self.assertNotEqual(mod.canonical('https://example.com/call?edition=2026'),mod.canonical('https://example.com/call?edition=2027'))
    def test_parser_ignores_scripts_and_only_approved_links(self):
        parser=mod.PageParser();parser.feed('<main><h1>Jogos</h1><script>execute evil()</script><a href="/edital?utm_source=x">Edital 2027</a><a href="https://example.com/edital">Ed</a><a href="http://127.0.0.1/edital">Local</a><a href="https://other.com/edital">Fora</a></main>')
        self.assertNotIn('execute',parser.text)
        links=mod.discovery_links({'links':parser.links},'https://example.com/',{'example.com'})
        self.assertEqual(len(links),1)
        self.assertTrue(links[0]['requires_review'])
    def test_private_and_credential_urls_are_rejected(self):
        for url in ['http://localhost/x','http://127.0.0.1/x','http://192.168.1.10/x','https://user:pass@example.com/x','file:///secret','https://x.internal/call']:
            self.assertFalse(mod.public_url(url),url)
        self.assertTrue(mod.public_url('https://garagem.bndes.gov.br/inscreva-se/'))
    def test_pdf_text_is_extracted(self):
        # PDF real obtido do BNDES: evita teste sintético que espelha a implementação.
        snapshots=Path(__file__).parent/'state'/'snapshots'
        pdfs=list(snapshots.glob('*.pdf')) if snapshots.exists() else []
        if not pdfs:self.skipTest('Sem PDF coletado ainda')
        parsed=mod.parse_document(pdfs[0].read_bytes(),'application/pdf',pdfs[0].as_uri())
        self.assertGreater(len(parsed['text']),100)
        self.assertEqual(parsed['kind'],'pdf')
    def test_build_is_stable_and_does_not_promote_candidates(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);reviewed=root/'reviewed.json';dist=root/'dist'
            reviewed.write_text(json.dumps({'radar':{'opportunities':[{'id':'past'}],'sources':[]},'applications':{'past':{'category':'current','closeDate':'2026-10-21','sourceUrl':'https://example.com/'}}}),encoding='utf-8')
            state={'sources':{'x':{'id':'x','name':'X','url':'https://example.com/','status':'error','candidates':[{'url':'https://example.com/new'}]}}}
            mod.build_site(reviewed,state,dist,'2026-11-05T12:00:00-03:00')
            first=(dist/'application.js').read_bytes()
            self.assertIn(b'closed',first)
            self.assertNotIn(b'example.com/new',(dist/'data.js').read_bytes())
            mod.build_site(reviewed,state,dist,'2026-11-05T12:00:00-03:00')
            self.assertEqual(first,(dist/'application.js').read_bytes())
    def test_deadline_timezone_is_respected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);reviewed=root/'reviewed.json'
            reviewed.write_text(json.dumps({'radar':{'opportunities':[{'id':'x'}],'sources':[]},'applications':{'x':{'category':'current','closeDate':'2027-02-02','closeAt':'2027-02-02T17:00:00+01:00','sourceUrl':'https://example.com/'}}}),encoding='utf-8')
            mod.build_site(reviewed,{'sources':{}},root/'dist','2027-02-02T13:01:00-03:00')
            self.assertIn('"category": "closed"',(root/'dist'/'application.js').read_text(encoding='utf-8'))
    def test_curated_catalog_has_complete_unique_application_records(self):
        c=json.loads((Path(__file__).parent/'reviewed.json').read_text(encoding='utf-8'))
        ids=[o['id'] for o in c['radar']['opportunities']]
        self.assertEqual(len(ids),len(set(ids)))
        self.assertEqual(set(ids),set(c['applications']))
        for a in c['applications'].values():
            for field in ['sourceUrl','deliverables','profileFit','cnpj','profileNote']:
                self.assertTrue(a.get(field),field)
            self.assertIn(a['cnpj'],{'required','not_required','later','pitch_only','unknown'})

if __name__=='__main__': unittest.main()
