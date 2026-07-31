import re

file_path = r'C:\Users\Heota\.gemini\antigravity-ide\brain\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\mermaid_diagrams.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove config blocks
# Match:
# ---
# config:
#   layout: elk
# ---
# ---
# config:
#   mirrorActors: false
# ---
content = re.sub(r'---\nconfig:.*?\n---\n?', '', content, flags=re.DOTALL)

# 2. Fix actor and participant aliases (remove colon)
# Match: actor Guest as : Guest
content = re.sub(r'(actor|participant) (.*?) as : (.*)', r'\1 \2 as \3', content)

# 3. Fix alt and else conditions (remove brackets)
# Match: alt [Condition]
content = re.sub(r'alt \[(.*?)\]', r'alt \1', content)
content = re.sub(r'else \[(.*?)\]', r'else \1', content)

# 4. Remove all activate / deactivate (it's causing issues with alt blocks in Mermaid)
content = re.sub(r'\s*activate [A-Za-z0-9_]+', '', content)
content = re.sub(r'\s*deactivate [A-Za-z0-9_]+', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done rewriting mermaid diagrams.')
