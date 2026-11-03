"""Create editable source records from visible Notion blocks and verified image mapping.

This preserves reported source text, not a rerun of the neural model. Standard library only.
"""
import argparse,json,re
from pathlib import Path
from html.parser import HTMLParser

class TableReader(HTMLParser):
    def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
    def handle_starttag(self,tag,attrs):
        if tag=='tr':self.row=[]
        if tag in {'td','th'}:self.cell=[]
        if tag=='br' and self.cell is not None:self.cell.append(' ')
    def handle_data(self,data):
        if self.cell is not None:self.cell.append(data)
    def handle_endtag(self,tag):
        if tag in {'td','th'} and self.cell is not None:
            self.row.append(re.sub(r'\s+',' ',''.join(self.cell)).strip().replace('|','\\|'));self.cell=None
        if tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def convert(source,mapping):
    page=source['url'];out=['# Captured source manuscript','',
      f'Source: {page}','',
      'This editable record preserves the supplied manuscript and figure captions. It is not an independent reproduction of the reported model results. Authoring reminders are omitted; the unaltered visible-block capture remains in the local research archive. The article-derived anatomy picture is replaced by a newly generated conceptual illustration, as identified below.','']
    for b in source['blocks']:
        text=b.get('text','').strip();cls=b.get('cls','')
        if text=='Other pages':break
        if re.match(r'^(?:UPDATE|ADD RESULT)\b',text):continue
        if 'image-block' in cls:
            f=mapping[b['id']]
            out.extend([f'![{f["label"]}]({f["official_url"]})',''])
            if f.get('substitution'):out.extend(['*Original conceptual illustration generated with OpenAI imagegen; not an anatomical reconstruction or measured connectivity map. This replaces the article-derived source picture.*',''])
            continue
        if not text:continue
        out.append(f'<!-- Source block: {b["id"]} -->')
        if 'table-block' in cls:
            table=TableReader();table.feed(b['html']);assert table.rows
            out.extend(['| '+' | '.join(table.rows[0])+' |','| '+' | '.join(['---']*len(table.rows[0]))+' |'])
            out.extend('| '+' | '.join(row)+' |' for row in table.rows[1:])
        elif 'sub_sub_header' in cls:out.append('#### '+text)
        elif 'sub_header' in cls:out.append('### '+text)
        elif 'header-block' in cls:out.append('## '+text)
        elif 'bulleted_list' in cls:out.append('- '+text)
        elif 'numbered_list' in cls:out.append('1. '+text)
        else:out.append(text)
        out.append('')
    return '\n'.join(out).rstrip()+'\n'

def main():
    p=argparse.ArgumentParser();p.add_argument('--archive-root',type=Path,required=True,help='Root of the restored zenodo-release research package');p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    package=a.archive_root/'aerosense-wiki/data/notion-model-2026-10-21'
    mapping={x['source_block_id']:x for x in json.loads((package/'publication-provenance.json').read_text(encoding='utf8'))['figures']}
    a.output.mkdir(parents=True,exist_ok=True)
    for name in ['model','engineering']:
        capture=json.loads((package/'sources'/f'{name}-blocks.json').read_text(encoding='utf8'))
        (a.output/f'{name}-source.md').write_text(convert(capture,mapping),encoding='utf8',newline='\n')

if __name__=='__main__':main()
