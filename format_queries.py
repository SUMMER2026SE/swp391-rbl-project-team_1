import re

file_path = r'C:\Users\Heota\.gemini\antigravity-ide\brain\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\report_uc_data_correction.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to match:
# 1. Something:
# `sql
# QUERY
# `
pattern = r'(?m)^\d+\.\s+([^:\n]+):\s*\n`sql\n(.*?)\n`'

def replacer(match):
    title = match.group(1).strip()
    # Capitalize first letter of title if not already
    title = title[0].upper() + title[1:]
    query = match.group(2).strip()
    return f"**{title}:**\n{query}\n"

new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done rewriting queries.')
