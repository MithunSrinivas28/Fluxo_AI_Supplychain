import re

with open('c:/Users/mithun/fluxo/frontend/src/services/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the API_URL definition
content = re.sub(
    r'const API_BASE.*?const API_URL.*?;',
    'export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";',
    content,
    flags=re.DOTALL
)

# Replace all ${API_URL}/something with ${API_URL}/api/something
# Use negative lookahead to prevent double-replacing /api/
content = re.sub(r'\$\{API_URL\}/(?!api/)', r'${API_URL}/api/', content)

with open('c:/Users/mithun/fluxo/frontend/src/services/api.ts', 'w', encoding='utf-8') as f:
    f.write(content)
