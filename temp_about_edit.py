from pathlib import Path
text = Path('index.html').read_text(encoding='utf-8')
start = text.find('              <div class="space-y-6 text-gray-300 text-lg leading-relaxed">')
if start == -1:
    raise SystemExit('start marker not found')
end = text.find('              </div>', start)
if end == -1:
    raise SystemExit('end marker not found')
end += len('              </div>\n')  # text normalized to \n

lines = [
    '              <div class="space-y-6 text-gray-300 text-lg leading-relaxed">',
    '                <p>',
    '                  PK Paints is an owner-led crew serving Philadelphia and the tri-state area. We show up when we say we',
    '                  will, communicate along the way, and treat your home with respect.',
    '                </p>',
    '                <p>',
    '                  From color consults to meticulous prep, custom trim, and a spotless wrap-up, we handle the details so',
    '                  you can enjoy a refreshed space without the stress.',
    '                </p>',
    '                <p>',
    "                  Let's plan the updates that will make your place feel like new.",
    '                </p>',
    '                <ul class="about-highlights">',
    '                  <li>Clear timelines, daily communication, and tidy job sites</li>',
    '                  <li>Premium finishes for interiors, exteriors, and custom trim</li>',
    '                  <li>Proudly serving homeowners, designers, and contractors across Greater Philadelphia</li>',
    '                </ul>',
    '              </div>',
    ''
]
new_block = '\n'.join(lines)
updated = text[:start] + new_block + text[end:]
Path('index.html').write_text(updated, encoding='utf-8', newline='\n')
