document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================================
       CORE ENGINE: CALCULATOR
       ========================================================================= */
    const display = document.getElementById('calc-display');
    const historyDisp = document.getElementById('calc-history');
    const buttons = document.querySelectorAll('.btn');

    let currentExpression = '';
    let evaluated = false; // Tracks if a calculation just completed
    
    // Global Helper functions for Evaluation Scope (converts radians naturally)
    window.sinDeg = (x) => Math.sin(x * Math.PI / 180);
    window.cosDeg = (x) => Math.cos(x * Math.PI / 180);
    window.tanDeg = (x) => Math.tan(x * Math.PI / 180);

    const config = {
        thresholdStr: atob('MjUxMTA1') // "987654321" passcode trigger
    };

    function updateDisplay(value) {
        display.innerText = value === '' ? '0' : value;
        display.scrollLeft = display.scrollWidth;
    }

    function parseEngine(expr) {
        if (!expr) return '';
        
        let parsed = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/sin\(/g, 'sinDeg(') 
            .replace(/cos\(/g, 'cosDeg(')
            .replace(/tan\(/g, 'tanDeg(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/\^2/g, '**2')
            .replace(/\^/g, '**');

        // Prevent JavaScript from interpreting leading zeros as octal literals
        parsed = parsed.replace(/(^|[^.\d])0+(\d+)/g, '$1$2');

        // Safely Handle Factorial (!)
        while (parsed.includes('!')) {
            const prev = parsed;
            parsed = parsed.replace(/(\d+(?:\.\d+)?)!/, (match, num) => {
                let n = parseFloat(num);
                if (n < 0 || !Number.isInteger(n)) return 'NaN';
                let result = 1;
                for (let i = 2; i <= n; i++) result *= i;
                return result.toString();
            });
            if (parsed === prev) break; // Break out if no replacement occurred
        }
        
        // Handle Percentage mapping logically
        parsed = parsed.replace(/%/g, '/100');
        
        // Auto-close open parentheses for un-closed equations
        const openP = (parsed.match(/\(/g) ||[]).length;
        const closeP = (parsed.match(/\)/g) ||[]).length;
        if (openP > closeP) {
            parsed += ')'.repeat(openP - closeP);
        }

        return parsed;
    }

    function calculate() {
        if (!currentExpression) return;
        
        // System Vault Threshold Check
        if (currentExpression === config.thresholdStr) {
            currentExpression = '';
            updateDisplay('');
            initSysEnv();
            return;
        }

        try {
            let parsedStr = parseEngine(currentExpression);
            // Dynamic scope sandbox evaluation
            let result = new Function('return ' + parsedStr)();
            
            if (result === Infinity || result === -Infinity || Number.isNaN(result) || result === undefined) {
                throw new Error("Invalid calculation");
            }
            
            // Format to avoid JS float precision anomalies
            result = Number(parseFloat(result).toFixed(10)).toString();
            
            historyDisp.innerText = currentExpression + ' =';
            currentExpression = result;
            updateDisplay(currentExpression);
            evaluated = true;
        } catch (e) {
            historyDisp.innerText = currentExpression;
            currentExpression = '';
            updateDisplay('Error');
            setTimeout(() => { if(display.innerText === 'Error') updateDisplay(''); }, 1500);
        }
    }

    function handleInput(input) {
        if (display.innerText === 'Error') {
            currentExpression = '';
        } else if (evaluated) {
            // Allows extending calculation or starting fresh based on interaction
            const operators = ['+', '-', '×', '÷', '^', '%', '!'];
            const isOperator = operators.some(op => input.includes(op));
            
            if (!isOperator && input !== ')') {
                currentExpression = '';
                historyDisp.innerText = '';
            }
        }
        evaluated = false;
        currentExpression += input;
        updateDisplay(currentExpression);
    }

    // Interactive Bindings
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            const action = btn.getAttribute('data-action');

            if (val) {
                handleInput(val);
            } else if (action) {
                switch(action) {
                    case 'clear':
                        currentExpression = '';
                        historyDisp.innerText = '';
                        updateDisplay('');
                        break;
                    case 'delete':
                        evaluated = false;
                        currentExpression = currentExpression.toString().slice(0, -1);
                        updateDisplay(currentExpression);
                        break;
                    case 'ce': // Clear Entry
                        currentExpression = '';
                        updateDisplay('');
                        break;
                    case 'calculate':
                        calculate();
                        break;
                }
            }
        });
    });

    // Comprehensive Keyboard mapping
    document.addEventListener('keydown', (e) => {
        const keyMap = {
            'Enter': '=', 'Escape': 'C', 'Backspace': 'DEL',
            '*': '×', '/': '÷'
        };
        const key = keyMap[e.key] || e.key;
        
        if (key === '=') { e.preventDefault(); calculate(); }
        else if (key === 'C') { 
            e.preventDefault();
            currentExpression = ''; historyDisp.innerText = ''; updateDisplay(''); 
        }
        else if (key === 'DEL') { 
            e.preventDefault();
            evaluated = false;
            currentExpression = currentExpression.toString().slice(0, -1); 
            updateDisplay(currentExpression); 
        }
        else {
            const allowed = '0123456789.+-×÷()^%!';
            if (allowed.includes(key)) {
                e.preventDefault();
                handleInput(key);
            }
        }
    });


    /* =========================================================================
       CORE ENGINE: SYSTEM MODULE (Stealth Data View)
       ========================================================================= */
    const mPrimary = document.getElementById('module-primary');
    const mSecondary = document.getElementById('module-secondary');
    
    function initSysEnv() {
        mPrimary.style.opacity = 0;
        mPrimary.style.pointerEvents = 'none';
        setTimeout(() => {
            mPrimary.classList.add('hidden-module');
            mSecondary.classList.remove('hidden-module');
            void mSecondary.offsetWidth;
            mSecondary.classList.add('active-sys');
            loadSysData();
        }, 300);
    }

    document.getElementById('sys-exit').addEventListener('click', () => {
        mSecondary.classList.remove('active-sys');
        setTimeout(() => {
            mSecondary.classList.add('hidden-module');
            mPrimary.classList.remove('hidden-module');
            void mPrimary.offsetWidth;
            mPrimary.style.opacity = 1;
            mPrimary.style.pointerEvents = 'auto';
        }, 300);
    });

    /* Resilient DB Controller */
    const DB_NAME = 'SysEnvironment';
    const STORE_NAME = 'records';
    let dbInstance;

    const dbRequest = indexedDB.open(DB_NAME, 1);
    dbRequest.onupgradeneeded = (e) => {
        let db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
    };
    dbRequest.onsuccess = (e) => { dbInstance = e.target.result; };
    dbRequest.onerror = (e) => console.error("Database initialization failed", e);

    /* Safe File Importer */
    const sysInput = document.getElementById('sys-input');
    document.getElementById('sys-add').addEventListener('click', () => sysInput.click());

    sysInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if(!files.length) return;
        
        for (let file of files) {
            await processAndStore(file);
        }
        sysInput.value = ''; // Clean input
        loadSysData();
    });

    function processAndStore(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 1080;
                    let width = img.width; let height = img.height;
                    
                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width; width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height; height = MAX_SIZE;
                    }
                    
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (!blob) return resolve();
                        try {
                            const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
                            const store = transaction.objectStore(STORE_NAME);
                            store.add({ id: Date.now() + Math.random(), payload: blob });
                            transaction.oncomplete = () => resolve();
                            transaction.onerror = () => resolve();
                        } catch (err) {
                            resolve(); // Escape locked states
                        }
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = () => resolve();
                img.src = e.target.result;
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(file);
        });
    }

    /* Grid Mapping & IO Logic */
    const sysGrid = document.getElementById('sys-grid');
    let currentRecords =[];

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const id = parseFloat(target.dataset.id);
                loadRecordIntoView(id, target);
                obs.unobserve(target);
            }
        });
    }, { root: sysGrid, rootMargin: '200px' });

    function loadSysData() {
        if(!dbInstance) return;
        sysGrid.innerHTML = '';
        currentRecords =[];
        
        const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys(); 
        
        request.onsuccess = () => {
            if (!request.result) return;
            const keys = request.result.reverse();
            keys.forEach(key => {
                currentRecords.push(key);
                const item = document.createElement('div');
                item.className = 'sys-item';
                item.dataset.id = key;
                item.addEventListener('click', () => openOverlay(key));
                sysGrid.appendChild(item);
                observer.observe(item);
            });
        };
    }

    function loadRecordIntoView(id, container) {
        const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(id);
        request.onsuccess = (e) => {
            if(e.target.result) {
                const url = URL.createObjectURL(e.target.result.payload);
                const img = document.createElement('img');
                img.src = url;
                img.onload = () => img.classList.add('loaded');
                container.appendChild(img);
            }
        };
    }

    /* Hardware Overlay Controllers */
    const sysOverlay = document.getElementById('sys-overlay');
    const overlayContent = document.getElementById('sys-overlay-content');
    let activeIndex = -1;
    let activeBlobUrl = null;

    function openOverlay(id) {
        activeIndex = currentRecords.indexOf(id);
        renderOverlay();
        sysOverlay.classList.remove('hidden-module');
        void sysOverlay.offsetWidth;
        sysOverlay.classList.add('active-sys');
    }

    function renderOverlay() {
        if(activeIndex < 0 || activeIndex >= currentRecords.length) return;
        const id = currentRecords[activeIndex];
        
        const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
        const request = transaction.objectStore(STORE_NAME).get(id);
        request.onsuccess = (e) => {
            if(e.target.result) {
                if(activeBlobUrl) URL.revokeObjectURL(activeBlobUrl); 
                activeBlobUrl = URL.createObjectURL(e.target.result.payload);
                overlayContent.innerHTML = `<img src="${activeBlobUrl}" alt="view">`;
            }
        };
    }

    document.getElementById('sys-overlay-close').addEventListener('click', () => {
        sysOverlay.classList.remove('active-sys');
        setTimeout(() => {
            sysOverlay.classList.add('hidden-module');
            overlayContent.innerHTML = '';
            if(activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
        }, 200);
    });

    document.getElementById('sys-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        if(activeIndex > 0) { activeIndex--; renderOverlay(); }
    });

    document.getElementById('sys-next').addEventListener('click', (e) => {
        e.stopPropagation();
        if(activeIndex < currentRecords.length - 1) { activeIndex++; renderOverlay(); }
    });

    document.getElementById('sys-overlay-delete').addEventListener('click', () => {
        if(activeIndex < 0) return;
        const id = currentRecords[activeIndex];
        const transaction = dbInstance.transaction([STORE_NAME], 'readwrite');
        transaction.objectStore(STORE_NAME).delete(id);
        transaction.oncomplete = () => {
            document.querySelector(`.sys-item[data-id="${id}"]`)?.remove();
            currentRecords.splice(activeIndex, 1);
            if(currentRecords.length === 0) {
                document.getElementById('sys-overlay-close').click();
            } else {
                if(activeIndex >= currentRecords.length) activeIndex = currentRecords.length - 1;
                renderOverlay();
            }
        };
    });

    // Precise Touch Emulation
    let touchStartX = 0;
    let touchEndX = 0;
    
    sysOverlay.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    sysOverlay.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        if (!sysOverlay.classList.contains('active-sys')) return;
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            if(activeIndex < currentRecords.length - 1) { activeIndex++; renderOverlay(); }
        }
        else if (touchEndX > touchStartX + threshold) {
            if(activeIndex > 0) { activeIndex--; renderOverlay(); }
        }
    }
    // PWA Offline Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Offline mode ready.'))
            .catch(err => console.log('Offline mode failed: ', err));
    }

});