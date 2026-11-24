"""Pull each game out of the Google Sites embed blocks into games/<id>.html.

Usage: python extract_embeds.py <dir with downloaded Google Sites pages> <output games dir>
Each Google Sites page stores its "Embed code" block HTML-escaped in a data-code attribute.
"""
import html, os, re, sys

SRC, OUT = sys.argv[1], sys.argv[2]
MAP = {  # page file -> game id
    'choppyorcforall_amogus': 'among-us',
    'choppyorcforall_cookie-clicker': 'cookie-clicker',
    'choppyorcforall_moto-x3m-winter': 'moto-x3m-winter',
    'choppyorcforall_pacman': 'pacman',
    'choppyorcforall_paper-io': 'paper-io-2',
    'choppyorcforall_stickman-hook': 'stickman-hook',
    'choppyorcforall_tag': 'tag',
    'choppyorcforall_unicycle-hero': 'unicycle-hero',
    'eddynardogames_choppy-orc': 'choppy-orc',  # smaller of the two copies
    'eddynardogames_dozenbear': 'dozenbear',
    'eddynardogames_greedy-mimic': 'greedy-mimic',
    'eddynardogames_hasty-shaman': 'hasty-shaman',
    'eddynardogames_jellybots': 'jellybots',
    'eddynardogames_one-trick-mage': 'one-trick-mage',
    'eddynardogames_orcs-vs-elves': 'orcs-vs-elves',
    'eddynardogames_sleepy-knight': 'sleepy-knight',
    'eddynardogames_sticky-sorcerer': 'sticky-sorcerer',
    'freegamessite3_idle-breakout': 'idle-breakout',
    'freegamessite3_just-one-boss': 'just-one-boss',
    'mario_mario': 'full-screen-mario',
    'mario_slope': 'slope',
}

def clean_paper_io(s):
    # The paper.io file is a saved page that still carries an ad SDK's empty containers.
    s = re.sub(r'<div id="imaContainer(_new)?".*?</div>', '', s, flags=re.S)
    i = s.find('<div id="sdk__advertisement"')
    if i != -1:
        j = s.find('</body>', i)
        s = s[:i] + s[j:]
    s = s.replace('<script src=""></script>', '')
    return s

for page, gid in MAP.items():
    raw = open(os.path.join(SRC, page + '.html'), encoding='utf-8', errors='replace').read()
    codes = re.findall(r'data-code="([^"]*)"', raw)
    if not codes:
        print('NO EMBED', page); continue
    code = html.unescape(max(codes, key=len))
    if gid == 'paper-io-2':
        code = clean_paper_io(code)
    if not code.lstrip().lower().startswith(('<!doctype', '<html')):
        code = '<!DOCTYPE html>\n<meta charset="utf-8">\n' + code
    with open(os.path.join(OUT, gid + '.html'), 'w', encoding='utf-8') as f:
        f.write(code)
    print(f'{gid:20s} {len(code)/1e6:6.2f} MB')
