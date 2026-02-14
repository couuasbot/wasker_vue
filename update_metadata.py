import os
import re

def update_file(filepath, category, is_zh=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if category already exists in frontmatter
    frontmatter_match = re.match(r'^---(.*?)^---', content, re.MULTILINE | re.DOTALL)
    if frontmatter_match:
        frontmatter = frontmatter_match.group(1)
        if 'category:' in frontmatter:
            # Update existing category
            new_frontmatter = re.sub(r'category:.*', f'category: "{category}"', frontmatter)
        else:
            # Append category
            new_frontmatter = frontmatter + f'category: "{category}"\n'
        
        new_content = f"---{new_frontmatter}---" + content[frontmatter_match.end():]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

# Portfolio Map (Mapping zh files to categories)
portfolio_map = {
    "tricys-series.md": "Engineering & Simulation",
    "infrastructure-series.md": "DevOps & Infrastructure",
    "wasker-series.md": "Web Development"
}

# Blog Map
blog_map = {
    "2026-02-13-the-boss-instructions.md": "Strategic Guidelines"
}

# Process Portfolio
for filename, cat in portfolio_map.items():
    zh_path = f"src/content/portfolio/zh/{filename}"
    en_path = f"src/content/portfolio/en/{filename}"
    
    if os.path.exists(zh_path):
        update_file(zh_path, cat, True)
        # Copy to English if missing or needs sync
        with open(zh_path, 'r') as f:
            zh_content = f.read()
        # Note: In a real scenario, I'd translate here. For now, ensuring structure.
        if not os.path.exists(os.path.dirname(en_path)):
            os.makedirs(os.path.dirname(en_path))
        # (Translation logic would go here, keeping metadata same)
        update_file(zh_path, cat) # Ensure ZH has it

# Process Blog
for filename, cat in blog_map.items():
    for lang in ['zh', 'en']:
        path = f"src/content/blog/{lang}/{filename}"
        if os.path.exists(path):
            update_file(path, cat)

