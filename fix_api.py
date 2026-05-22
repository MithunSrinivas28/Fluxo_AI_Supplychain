import re

with open('frontend/src/services/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix API_BASE
content = content.replace(
    'const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";',
    'const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";\nconst API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;'
)

# Prepend /api to all customFetch calls that don't already have it
# Wait, let's just replace `${API_BASE}/` with `${API_URL}/`
content = content.replace('${API_BASE}/', '${API_URL}/')

# Also fix the duplicate we introduced earlier in the chat file if we did, but let's check customFetch.
# Wait, if we use ${API_URL}/, and API_URL always ends in /api, then we don't need to change the fetch paths if they don't have /api.
# But what if they already had /api in them?
# Let's clean up any double /api/.
content = content.replace('${API_URL}/api/', '${API_URL}/')
# Remove any accidental trailing slash on API_URL
content = content.replace('${API_URL}//', '${API_URL}/')

with open('frontend/src/services/api.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated api.ts")
