import os
import sys

base_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(base_dir, 'project_content.txt')

EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.yaml', '.yml']
SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage']

lines = []

for root, dirs, files in os.walk(base_dir):
    # Skip unwanted directories
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    
    for filename in files:
        filepath = os.path.join(root, filename)
        ext = os.path.splitext(filename)[1].lower()
        
        if ext in EXTENSIONS:
            rel_path = os.path.relpath(filepath, base_dir)
            lines.append(f'\n\n{"="*80}')
            lines.append(f'FILE: {rel_path}')
            lines.append('='*80)
            
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                lines.append(content)
            except Exception as e:
                lines.append(f'ERROR reading file: {e}')

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Done! Written to {output_file}')
print(f'Total sections: {lines.count("="*80 + "")}')