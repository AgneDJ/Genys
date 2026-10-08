import concurrent.futures, hashlib, json, pathlib, subprocess
ROOT=pathlib.Path(__file__).resolve().parent.parent
path=ROOT/'tools/source-cache/manifest.json';m=json.loads(path.read_text(encoding='utf8'))
def retry(item):
    url,_=item
    variants=[url.replace('https://sites.google.com/sitesv-images-rt/','https://lh3.googleusercontent.com/sitesv-images-rt/'),url.replace('=w1280','=s1600'),url.replace('https://sites.google.com/sitesv-images-rt/','https://lh3.googleusercontent.com/sitesv/')]
    dst=ROOT/'assets/google-site'/ (hashlib.sha256(url.encode()).hexdigest()[:16]+'.jpg')
    codes=[]
    for candidate in variants:
        r=subprocess.run(['curl.exe','-L','-sS','-f','--max-time','30','-w','%{http_code}',candidate,'-o',str(dst)],capture_output=True,text=True)
        codes.append(r.stdout)
        if r.returncode==0:
            sig=dst.read_bytes()[:16]; ext='.png' if sig.startswith(b'\x89PNG') else '.webp' if sig[8:12]==b'WEBP' else '.gif' if sig.startswith(b'GIF8') else '.jpg'
            dst2=dst.with_suffix(ext)
            if dst!=dst2:dst.replace(dst2)
            return url,dst2.relative_to(ROOT).as_posix(),codes
    return url,None,codes
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(retry,[(u,a) for u,a in m['assets'].items() if not a]))
for u,a,codes in results:
    print(hashlib.sha256(u.encode()).hexdigest()[:16],a,codes)
    if a:m['assets'][u]=a
path.write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf8')
