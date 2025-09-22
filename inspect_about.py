from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
start=text.find('<div class="space-y-6 text-gray-300 text-lg leading-relaxed">')
print(repr(text[start:start+200]))
