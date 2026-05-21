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
            <p class="text-gray-400 text-lg">AI Assistant Control Panel & Permission Manager</p>
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

                    const html = \`
                        <div class="flex items-center justify-between p-4 bg-gray-900/40 rounded-xl hover:bg-gray-800/60 transition-colors">
                            <div class="flex items-start">
                                <div class="mt-1.5 mr-3 w-2.5 h-2.5 rounded-full \${dotColor} shadow-[0_0_8px_rgba(var(--tw-colors-\${meta.color}-500),0.8)]"></div>
                                <div>
                                    <div class="text-white font-medium">\${meta.title} <span class="text-xs text-gray-500 font-mono ml-2">(\${key})</span></div>
                                    <div class="text-sm text-gray-400">\${meta.desc}</div>
                                </div>
                            </div>
                            <div class="relative inline-block w-12 ml-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="tool_\${key}" id="tool_\${key}" \${tools[key] ? 'checked' : ''} class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                <label for="tool_\${key}" class="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer"></label>
                            </div>
                        </div>
                    \`;
                    toolsContainer.insertAdjacentHTML('beforeend', html);
                });

                // Render Search Engine
                searchEngineToggle.checked = config.search?.enable_vector_search === true;
                
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
