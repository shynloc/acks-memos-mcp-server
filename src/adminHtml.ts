export const ADMIN_HTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ACKS Memos - Control Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            500: '#8b5cf6', // Violet
                            600: '#7c3aed',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        /* Custom Toggle Switch Styles */
        .toggle-checkbox:checked {
            right: 0;
            border-color: #8b5cf6;
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #8b5cf6;
        }
        .toggle-checkbox {
            right: 4px;
            z-index: 1;
            border-color: #e5e7eb;
            transition: all 0.3s;
        }
        .toggle-label {
            background-color: #374151;
            transition: all 0.3s;
        }
        
        /* Glassmorphism panel */
        .glass-panel {
            background: rgba(31, 41, 55, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .blur-sm {
            filter: blur(8px);
            transition: filter 0.3s ease;
        }
    </style>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen font-sans selection:bg-brand-500 selection:text-white">

    <!-- Login Overlay -->
    <div id="loginOverlay" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md hidden">
        <div class="glass-panel p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/20 mb-4">
                    <svg class="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h2 class="text-2xl font-bold text-white">Admin Access</h2>
                <p class="text-gray-400 mt-2 text-sm">Please enter the security password to manage MCP permissions.</p>
            </div>
            <form id="loginForm" class="space-y-6">
                <div>
                    <input type="password" id="adminPassword" required placeholder="Enter password..." class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                    <p id="loginError" class="text-red-500 text-sm mt-2 hidden">Invalid password. Please try again.</p>
                </div>
                <button type="submit" class="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-none">
                    Unlock Panel
                </button>
            </form>
        </div>
    </div>

    <div id="mainContent" class="max-w-4xl mx-auto px-4 py-12 transition-all duration-300">
        <!-- Header -->
        <div class="mb-10 text-center">
            <h1 class="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-brand-500 to-pink-500 text-transparent bg-clip-text">ACKS Memos MCP</h1>
            <p class="text-gray-400">Secure configuration panel for your AI Agent connector</p>
        </div>

        <!-- Connection URL Card -->
        <div class="glass-panel p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] mb-8 relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg class="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            </div>
            <h2 class="text-xl font-bold mb-2 flex items-center text-emerald-400">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                Your AI Connection URL
            </h2>
            <p class="text-gray-400 text-sm mb-4 pr-12">Copy this URL and paste it into your MCP client (Grok, Claude Desktop, Cursor) to securely connect to your Memos.</p>
            
            <div class="flex items-center bg-gray-950/80 rounded-xl p-1 border border-gray-700 shadow-inner group/input">
                <input type="text" id="clientUrlInput" readonly class="bg-transparent w-full px-4 py-3 text-emerald-100 font-mono text-sm focus:outline-none selection:bg-emerald-500/30" value="Loading...">
                <button id="copyUrlBtn" type="button" class="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 px-4 rounded-lg shadow transition-colors focus:outline-none border border-gray-600 mr-1 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    Copy
                </button>
            </div>
            <p class="text-xs text-rose-400/80 mt-3 flex items-center font-medium">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                Treat this URL like a password. Do not share it publicly.
            </p>
        </div>

        <!-- Notification Toast -->
        <div id="toast" class="fixed top-5 right-5 transform transition-all duration-300 translate-y-[-150%] opacity-0 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium flex items-center z-50">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Settings saved successfully!
        </div>

        <!-- Main Form -->
        <form id="configForm" class="space-y-8">
            
            <!-- Section 1: Tool Permissions -->
            <div class="glass-panel rounded-2xl p-8 shadow-xl">
                <div class="mb-6 border-b border-gray-700 pb-4">
                    <h2 class="text-2xl font-bold flex items-center">
                        <svg class="w-6 h-6 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        Tool Permissions
                    </h2>
                    <p class="text-sm text-gray-400 mt-1">Control exactly what actions the AI agent is allowed to perform on your Memos.</p>
                </div>

                <div class="space-y-5" id="toolsContainer">
                    <!-- Tool Rows Injected by JS -->
                </div>
            </div>

            <!-- Section 2: Brain Engine -->
            <div class="glass-panel rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
                        Pro Feature
                    </span>
                </div>
                
                <div class="mb-6 border-b border-gray-700 pb-4">
                    <h2 class="text-2xl font-bold flex items-center">
                        <svg class="w-6 h-6 mr-2 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Search Engine Level
                    </h2>
                    <p class="text-sm text-gray-400 mt-1">Upgrade the AI's "Brain" for finding past memories.</p>
                </div>

                <div class="flex items-start bg-gray-900/50 p-5 rounded-xl border border-gray-700 hover:border-brand-500/50 transition-colors">
                    <div class="flex-1">
                        <label for="search-engine-toggle" class="text-lg font-medium text-white block mb-1">Tier 2: Semantic Vector Search</label>
                        <p class="text-sm text-gray-400">If enabled, the MCP server will download a local AI model to embed your notes, enabling true "meaning-based" search (e.g. searching "flight" finds "travel plans").</p>
                        <div class="mt-3 text-xs text-yellow-500 flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            Note: First activation will take a moment to download models.
                        </div>
                    </div>
                    
                    <div class="ml-4 pt-1">
                        <div class="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="enable_vector_search" id="search-engine-toggle" class="toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                            <label for="search-engine-toggle" class="toggle-label block overflow-hidden h-7 rounded-full cursor-pointer"></label>
                        </div>
                    </div>
                </div>

                <!-- Live Status Indicator (Injected by JS) -->
                <div id="engineStatusIndicator" class="mt-5 hidden p-5 bg-gray-950/80 rounded-xl border border-gray-700 shadow-inner">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-brand-400 flex items-center" id="engineStatusText">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Downloading Neural Weights & Initializing...
                        </span>
                        <span class="text-xs text-gray-500 font-mono" id="engineStatusTime">Usually takes 1-2 mins</span>
                    </div>
                    <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                        <div id="engineProgressBar" class="bg-gradient-to-r from-brand-600 to-brand-400 h-2 rounded-full w-1/3 relative overflow-hidden transition-all duration-1000">
                           <div class="absolute top-0 left-0 bottom-0 right-0 w-full animate-[ping_1.5s_ease-in-out_infinite] bg-white opacity-20"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Submit -->
            <div class="flex justify-end pt-4">
                <button type="submit" id="saveBtn" class="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    Save Configuration
                </button>
            </div>
        </form>
    </div>

    <script>
        // Metadata for rendering tool descriptions beautifully
        const TOOL_META = {
            search_memos: { title: "Search Memos", desc: "Allows AI to search through your notes. (Safe, Read-only)", color: "green" },
            list_memos: { title: "List Memos", desc: "Allows AI to list recent memos. (Safe, Read-only)", color: "green" },
            get_memo: { title: "Get Memo", desc: "Allows AI to read a specific memo. (Safe, Read-only)", color: "green" },
            list_tags: { title: "List Tags", desc: "Allows AI to see your used tags. (Safe, Read-only)", color: "green" },
            create_memo: { title: "Create Memo", desc: "Allows AI to write NEW memos. (Write permission)", color: "yellow" },
            update_memo: { title: "Update Memo", desc: "Allows AI to modify or archive existing memos. (Write permission)", color: "yellow" },
            delete_memo: { title: "Delete Memo", desc: "Allows AI to permanently delete memos. (DANGER)", color: "red" }
        };

        const toolsContainer = document.getElementById('toolsContainer');
        const searchEngineToggle = document.getElementById('search-engine-toggle');
        const form = document.getElementById('configForm');
        const toast = document.getElementById('toast');
        const saveBtn = document.getElementById('saveBtn');

        // Dynamically compute API URL based on current path to support reverse proxy sub-paths (like /mcp/admin)
        const getApiUrl = () => {
            const path = window.location.pathname;
            // If path ends with /, strip it
            const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
            return cleanPath + '/api/config';
        };

        const getHeaders = () => {
            return {
                'Content-Type': 'application/json',
                'x-admin-password': localStorage.getItem('adminPassword') || ''
            };
        };

        const showLogin = () => {
            document.getElementById('loginOverlay').classList.remove('hidden');
            document.getElementById('mainContent').classList.add('blur-sm');
        };

        const hideLogin = () => {
            document.getElementById('loginOverlay').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('blur-sm');
            document.getElementById('loginError').classList.add('hidden');
        };

        // Login Handler
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const pwd = document.getElementById('adminPassword').value;
            localStorage.setItem('adminPassword', pwd);
            loadConfig();
        });

        // Copy URL Logic
        document.getElementById('copyUrlBtn').addEventListener('click', () => {
            const input = document.getElementById('clientUrlInput');
            input.select();
            input.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(input.value);
            
            const btn = document.getElementById('copyUrlBtn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<svg class="w-4 h-4 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-emerald-400">Copied!</span>';
            setTimeout(() => {
                btn.innerHTML = originalHtml;
            }, 2000);
        });

        // Fetch current config
        async function loadConfig() {
            try {
                const res = await fetch(getApiUrl(), { headers: getHeaders() });
                
                if (res.status === 401 || res.status === 500) {
                    showLogin();
                    if (localStorage.getItem('adminPassword')) {
                        document.getElementById('loginError').classList.remove('hidden');
                        localStorage.removeItem('adminPassword');
                    }
                    return;
                }
                
                hideLogin();
                const config = await res.json();
                
                // Set Client URL
                const baseUrl = window.location.origin + window.location.pathname.replace(/\/admin\/?$/, '');
                const clientToken = config.security && config.security.client_token ? config.security.client_token : 'MISSING_TOKEN';
                document.getElementById('clientUrlInput').value = baseUrl + '/sse?token=' + clientToken;
                
                // Render Tools
                toolsContainer.innerHTML = '';
                const tools = config.tools || {};
                
                // Order: Read-only first, then write, then danger
                const orderedKeys = ['search_memos', 'list_memos', 'get_memo', 'list_tags', 'create_memo', 'update_memo', 'delete_memo'];
                
                orderedKeys.forEach(key => {
                    if (tools[key] === undefined) return;
                    
                    const meta = TOOL_META[key] || { title: key, desc: "Custom tool", color: "gray" };
                    let dotColor = "bg-gray-500";
                    if (meta.color === "green") dotColor = "bg-emerald-500";
                    if (meta.color === "yellow") dotColor = "bg-yellow-500";
                    if (meta.color === "red") dotColor = "bg-red-500";

                    const checkedStr = tools[key] ? 'checked' : '';
                    const html = '<div class="flex items-center justify-between p-4 bg-gray-900/40 rounded-xl hover:bg-gray-800/60 transition-colors">' +
                        '<div class="flex items-start">' +
                            '<div class="mt-1.5 mr-3 w-2.5 h-2.5 rounded-full ' + dotColor + ' shadow-[0_0_8px_rgba(255,255,255,0.2)]"></div>' +
                            '<div>' +
                                '<div class="text-white font-medium">' + meta.title + ' <span class="text-xs text-gray-500 font-mono ml-2">(' + key + ')</span></div>' +
                                '<div class="text-sm text-gray-400">' + meta.desc + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="relative inline-block w-12 ml-2 align-middle select-none transition duration-200 ease-in">' +
                            '<input type="checkbox" name="tool_' + key + '" id="tool_' + key + '" ' + checkedStr + ' class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>' +
                            '<label for="tool_' + key + '" class="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer"></label>' +
                        '</div>' +
                    '</div>';
                    toolsContainer.insertAdjacentHTML('beforeend', html);
                });

                // Render Search Engine
                searchEngineToggle.checked = config.search?.enable_vector_search === true;
                
                // If it's already checked on load, verify the status
                if (searchEngineToggle.checked) {
                    checkEngineStatus();
                }
                
            } catch (err) {
                console.error("Failed to load config", err);
                alert("Failed to connect to the MCP server. Is it running?");
            }
        }

        function showToast() {
            toast.classList.remove('translate-y-[-150%]', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-[-150%]', 'opacity-0');
            }, 3000);
        }

        let pollInterval = null;
        async function checkEngineStatus() {
            try {
                const statusUrl = getApiUrl().replace('/config', '/engine-status');
                const res = await fetch(statusUrl, { headers: getHeaders() });
                if (!res.ok) return;
                
                const { ready } = await res.json();
                const statusDiv = document.getElementById('engineStatusIndicator');
                const isToggleChecked = document.getElementById('search-engine-toggle').checked;
                
                if (isToggleChecked) {
                    statusDiv.classList.remove('hidden');
                    if (ready) {
                        document.getElementById('engineStatusText').innerHTML = '<svg class="w-4 h-4 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Engine Ready & Active';
                        document.getElementById('engineStatusText').className = "text-sm font-semibold text-emerald-400 flex items-center";
                        document.getElementById('engineProgressBar').className = 'bg-emerald-500 h-2 rounded-full w-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500';
                        document.getElementById('engineProgressBar').innerHTML = '';
                        document.getElementById('engineStatusTime').innerText = 'Online';
                        if (pollInterval) clearInterval(pollInterval);
                    } else {
                        // Keep polling
                        document.getElementById('engineStatusText').innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Downloading Neural Weights & Initializing...';
                        document.getElementById('engineStatusText').className = "text-sm font-semibold text-brand-400 flex items-center";
                        document.getElementById('engineProgressBar').className = 'bg-gradient-to-r from-brand-600 to-brand-400 h-2 rounded-full w-2/3 relative overflow-hidden transition-all duration-1000';
                        document.getElementById('engineStatusTime').innerText = 'Usually takes 1-2 mins';
                        if (!pollInterval) {
                            pollInterval = setInterval(checkEngineStatus, 2000);
                        }
                    }
                } else {
                    statusDiv.classList.add('hidden');
                    if (pollInterval) clearInterval(pollInterval);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }

        // Save Config
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnOriginalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...';
            saveBtn.disabled = true;

            const formData = new FormData(form);
            const newConfig = {
                tools: {},
                search: {
                    enable_vector_search: searchEngineToggle.checked
                }
            };

            // Build tools object from form
            const keys = ['search_memos', 'list_memos', 'get_memo', 'list_tags', 'create_memo', 'update_memo', 'delete_memo'];
            keys.forEach(k => {
                // If checkbox is checked, it exists in formData
                newConfig.tools[k] = formData.has(\`tool_\${k}\`);
            });

            try {
                const res = await fetch(getApiUrl(), {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(newConfig)
                });
                if (res.ok) {
                    showToast();
                    // If Vector search was enabled, start polling for status
                    if (searchEngineToggle.checked) {
                        checkEngineStatus();
                    } else {
                        document.getElementById('engineStatusIndicator').classList.add('hidden');
                        if (pollInterval) clearInterval(pollInterval);
                    }
                } else {
                    const err = await res.json();
                    alert("Error saving: " + err.error);
                }
            } catch (err) {
                alert("Network error: " + err.message);
            } finally {
                saveBtn.innerHTML = btnOriginalText;
                saveBtn.disabled = false;
            }
        });

        // Init
        loadConfig();
    </script>
</body>
</html>
`;
