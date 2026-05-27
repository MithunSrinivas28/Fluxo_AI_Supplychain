import urllib.request
import re

try:
    html = urllib.request.urlopen('https://fluxoai-lovat.vercel.app').read().decode('utf-8')
    match = re.search(r'src="(/assets/index-[^\.]+\.js)"', html)
    if not match:
        print('JS not found')
    else:
        js_url = 'https://fluxoai-lovat.vercel.app' + match.group(1)
        print('JS URL:', js_url)
        js = urllib.request.urlopen(js_url).read().decode('utf-8')
        
        print('\n--- VITE_API_URL hits ---')
        for m in re.finditer(r'.{0,50}onrender\.com.{0,50}', js):
            print(m.group(0))
            
        print('\n--- health hits ---')
        for m in re.finditer(r'.{0,50}/health.{0,50}', js):
            print(m.group(0))
            
        print('\n--- localhost hits ---')
        for m in re.finditer(r'.{0,50}localhost:5000.{0,50}', js):
            print(m.group(0))
            
        print('\n--- API_URL logic ---')
        for m in re.finditer(r'.{0,50}import\.meta\.env\.VITE_API_URL.{0,50}', js):
            print(m.group(0))
except Exception as e:
    print('Error:', e)
