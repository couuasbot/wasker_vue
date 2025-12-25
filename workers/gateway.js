export default {
    async fetch(request) {
        const url = new URL(request.url);
        const hostname = url.hostname;
        const path = url.pathname + url.search + url.hash;

        const rootDomain = 'couuas.pp.ua';
        const nodes = [
            { id: 'cf', name: 'Cloudflare Pages', desc_cn: '全球边缘网络', desc_en: 'Global Edge Network' },
            { id: 'vc', name: 'Vercel Edge', desc_cn: '亚太路由优化', desc_en: 'APAC Optimized' },
            { id: 'gh', name: 'GitHub Pages', desc_cn: '原始镜像仓库', desc_en: 'Original Mirror' }
        ];

        if (hostname !== rootDomain) return fetch(request);

        const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>智能优选 | Smart Routing</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .dark .skeleton { background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size: 200% 100%; }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        body { font-family: system-ui, -apple-system, sans-serif; -webkit-tap-highlight-color: transparent; }
    </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-500">

    <div class="w-full max-w-lg relative">
        <div class="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full"></div>
        <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>

        <div class="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
            
            <header class="text-center mb-8 sm:mb-10">
                <div class="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 sm:mb-6">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h1 class="text-xl sm:text-2xl font-black tracking-tight flex flex-col gap-1">
                    <span>智能线路优选</span>
                    <span class="text-slate-400 text-xs sm:text-sm font-medium tracking-normal uppercase">Smart Routing Optimization</span>
                </h1>
                <div class="mt-4 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full inline-flex items-center gap-2 max-w-full">
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Path</span>
                    <span class="text-[11px] font-mono text-blue-500 font-medium truncate break-all">${path}</span>
                </div>
            </header>

            <div id="node-container" class="space-y-3 sm:space-y-4">
                ${nodes.map(() => `<div class="h-20 sm:h-24 w-full skeleton rounded-2xl opacity-40"></div>`).join('')}
            </div>

            <div class="mt-8 sm:mt-10">
                <div id="status-card" class="flex flex-col sm:flex-row items-center sm:justify-between gap-6 sm:gap-2 px-1">
                    <div class="flex items-center text-center sm:text-left">
                        <span class="relative flex h-3 w-3 mr-4 flex-shrink-0">
                            <span id="status-ping" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span id="status-dot" class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <div class="flex flex-col leading-tight">
                            <span id="status-cn" class="text-sm font-bold text-slate-600 dark:text-slate-300">正在探测延迟...</span>
                            <span id="status-en" class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Probing Latency...</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 w-full sm:w-auto justify-center">
                        <button onclick="location.reload()" class="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 active:scale-95 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                        <button id="cancel-btn" class="hidden px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95">
                            STOP
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const nodes = ${JSON.stringify(nodes)};
        const rootDomain = "couuas.pp.ua";
        const currentPath = "${path}";
        let isStopped = false;
        let countdownValue = 3;
        let countdownInterval = null;

        async function probe(node) {
            const start = performance.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);
            try {
                await fetch("https://" + node.id + "." + rootDomain + "/favicon.ico?t=" + Date.now(), { mode: 'no-cors', cache: 'no-cache', signal: controller.signal });
                clearTimeout(timeout);
                return { ...node, latency: Math.round(performance.now() - start) };
            } catch (e) {
                return { ...node, latency: 9999 };
            }
        }

        async function init() {
            const results = await Promise.all(nodes.map(probe));
            results.sort((a, b) => a.latency - b.latency);

            const container = document.getElementById('node-container');
            container.innerHTML = results.map((n, i) => {
                const isBest = i === 0 && n.latency < 9999;
                const latColor = n.latency < 250 ? 'text-emerald-500' : (n.latency < 600 ? 'text-amber-500' : 'text-slate-400');
                
                return \`
                <div onclick="window.location.href='https://\${n.id}.\${rootDomain}\${currentPath}'" 
                     class="fade-in group flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-800/50 border \${isBest ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-slate-100 dark:border-slate-800'} rounded-2xl cursor-pointer hover:border-blue-400 transition-all shadow-sm">
                    <div class="flex items-center gap-3 sm:gap-4">
                        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm flex-shrink-0">\${n.id.toUpperCase()}</div>
                        <div class="flex flex-col min-w-0">
                            <span class="text-sm font-bold truncate \${isBest ? 'text-blue-600' : ''}">\${n.name} \${isBest ? '⚡' : ''}</span>
                            <div class="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate">
                                <div class="truncate">\${n.desc_cn}</div>
                                <div class="opacity-70 font-mono text-[9px] truncate">\${n.desc_en}</div>
                            </div>
                        </div>
                    </div>
                    <div class="text-right font-mono text-xs sm:text-sm font-black \${latColor} flex-shrink-0 ml-2">
                        \${n.latency >= 9999 ? 'FAIL' : n.latency + 'ms'}
                    </div>
                </div>\`;
            }).join('');

            const best = results[0];
            const stCn = document.getElementById('status-cn');
            const stEn = document.getElementById('status-en');
            const stDot = document.getElementById('status-dot');
            const stPing = document.getElementById('status-ping');
            const btn = document.getElementById('cancel-btn');

            if (best.latency < 9999) {
                btn.classList.remove('hidden');
                stCn.classList.add('text-emerald-600');
                stDot.classList.replace('bg-blue-500', 'bg-emerald-500');
                stPing.classList.replace('bg-blue-400', 'bg-emerald-400');

                const updateUI = () => {
                    stCn.innerHTML = \`已优选线路，<span class="inline-block min-w-[12px] text-lg font-black text-emerald-600 mx-0.5">\${countdownValue}</span> 秒后接入\`;
                    stEn.innerText = \`Optimal route ready, jumping in \${countdownValue}s\`;
                };

                updateUI();
                countdownInterval = setInterval(() => {
                    if (isStopped) return;
                    countdownValue--;
                    if (countdownValue <= 0) {
                        clearInterval(countdownInterval);
                        window.location.replace("https://" + best.id + "." + rootDomain + currentPath);
                    } else {
                        updateUI();
                    }
                }, 1000);

                btn.onclick = () => {
                    isStopped = true;
                    clearInterval(countdownInterval);
                    btn.classList.add('hidden');
                    stCn.innerText = "已切换为手动模式";
                    stEn.innerText = "Manual selection mode active";
                    stCn.className = "text-sm font-bold text-slate-500";
                    stDot.className = "relative inline-flex rounded-full h-3 w-3 bg-slate-400";
                    stPing.classList.add('hidden');
                };
            } else {
                stCn.innerText = "所有节点探测超时";
                stEn.innerText = "All nodes probe timeout";
                stDot.classList.replace('bg-blue-500', 'bg-red-500');
            }
        }
        window.onload = init;
    </script>
</body>
</html>`;

        return new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    }
};