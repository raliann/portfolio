document.addEventListener('DOMContentLoaded', function () {

    // Lock screen elements
    const preLockScreen = document.querySelector('.pre-lock-screen');
    const lockScreen = document.querySelector('.lock-screen');
    const wallpaper = document.querySelector('.wallpaper');
    const passcodeBackground = document.querySelector('.passcode-background');
    const unlockIndicator = document.querySelector('.unlock-indicator');
    const passcodeDots = document.querySelectorAll('.passcode-dots .dot');
    const passcodeError = document.querySelector('.passcode-error');
    const keys = document.querySelectorAll('.lock-screen .key:not(.empty)');
    const deleteKey = document.querySelector('.lock-screen .key.delete');
    const iphoneContainer = document.querySelector('.iphone-container');

    // App elements
    const views = document.querySelectorAll('.view');
    const appGrid = document.querySelector('.app-grid');
    const dock = document.querySelector('.dock');
    const backButtons = document.querySelectorAll('.back-button');
    const tabButtons = document.querySelectorAll('.tab-button');
    const phoneTabs = document.querySelectorAll('.phone-tab');
    const noteItems = document.querySelectorAll('.note-item');
    const noteEditor = document.querySelector('.note-editor');
    const newNoteButton = document.querySelector('.new-note');

    // Configuration
    const CORRECT_PASSCODE = "123456";
    let enteredPasscode = "";
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    // Initialize
    updateDateTime();
    initializeApps();
    setupEventListeners();

    // Set the same wallpaper for passcode screen and home screen
    if (passcodeBackground && wallpaper) {
        passcodeBackground.style.backgroundImage = `url('${wallpaper.src}')`;
    }
    const homeScreenWallpaper = document.querySelector('.home-screen-wallpaper');
    if (homeScreenWallpaper && wallpaper) {
        homeScreenWallpaper.src = wallpaper.src;
    }

    function updateDateTime() {
        const now = new Date();
        const timeElements = document.querySelectorAll('.time');
        const dateElements = document.querySelectorAll('.date');

        // Format time in military style for ALL time displays
        const hours24 = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const militaryTime = `${hours24}:${minutes}`;

        // Update all time displays to military time
        timeElements.forEach(el => {
            el.textContent = militaryTime;
        });

        // Format date
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateElements.forEach(el => {
            el.textContent = now.toLocaleDateString('en-US', options);
        });
    }

    function setupEventListeners() {
        // Swipe to unlock
        let startY;
        if (unlockIndicator) {
            unlockIndicator.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
            });

            unlockIndicator.addEventListener('mousedown', (e) => {
                startY = e.clientY;
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                });
            });

            function handleMouseMove(e) {
                const deltaY = startY - e.clientY;
                if (deltaY > 50) {
                    showPasscodeScreen();
                }
            }

            unlockIndicator.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const deltaY = startY - touchY;

                if (deltaY > 50) {
                    showPasscodeScreen();
                }
            });
        }

        // Passcode input
        keys.forEach(key => {
            key.addEventListener('click', function () {
                if (this.classList.contains('delete')) {
                    enteredPasscode = enteredPasscode.slice(0, -1);
                } else {
                    const value = this.getAttribute('data-value');
                    if (enteredPasscode.length < 6) {
                        enteredPasscode += value;
                    }
                }
                updateDots();
                verifyPasscode();
            });
        });

        // Flashlight and camera tap and hold functionality
        const flashlightBtn = document.querySelector('.flashlight-btn');
        const cameraBtn = document.querySelector('.camera-btn');
        
        if (flashlightBtn && cameraBtn) {
            const flashlightIcon = document.querySelector('.flashlight-btn img');
            const cameraIcon = document.querySelector('.camera-btn img');

            let flashlightTimeout, cameraTimeout;

            // Flashlight functionality
            flashlightBtn.addEventListener('mousedown', startFlashlightOn);
            flashlightBtn.addEventListener('touchstart', startFlashlightOn);
            flashlightBtn.addEventListener('mouseup', endFlashlightOn);
            flashlightBtn.addEventListener('touchend', endFlashlightOn);
            flashlightBtn.addEventListener('mouseleave', endFlashlightOn);

            // Camera functionality
            cameraBtn.addEventListener('mousedown', startCameraOn);
            cameraBtn.addEventListener('touchstart', startCameraOn);
            cameraBtn.addEventListener('mouseup', endCameraOn);
            cameraBtn.addEventListener('touchend', endCameraOn);
            cameraBtn.addEventListener('mouseleave', endCameraOn);

            function startFlashlightOn() {
                flashlightTimeout = setTimeout(() => {
                    flashlightIcon.src = 'icons/Lock screen/flashlight-on.png';
                }, 300);
            }

            function endFlashlightOn() {
                clearTimeout(flashlightTimeout);
                flashlightIcon.src = 'icons/Lock screen/flashlight-off.png';
            }

            function startCameraOn() {
                cameraTimeout = setTimeout(() => {
                    cameraIcon.src = 'icons/Lock screen/camera-dark.png';
                }, 300);
            }

            function endCameraOn() {
                clearTimeout(cameraTimeout);
                cameraIcon.src = 'icons/Lock screen/camera-light.png';
            }
        }

        // Back buttons
        backButtons.forEach(button => {
            button.addEventListener('click', () => {
                showView('home-screen');
            });
        });

        // Phone app tab switching
        const phoneTabButtons = document.querySelectorAll('.phone-tab-button');
        const phoneTabs = document.querySelectorAll('.phone-tab');

        phoneTabButtons.forEach(button => {
            button.addEventListener('click', function () {
                const tabName = this.getAttribute('data-tab');

                // Update tab buttons
                phoneTabButtons.forEach(btn => {
                    const icon = btn.querySelector('.tab-icon');
                    const tab = btn.getAttribute('data-tab');
                    icon.src = `phone/${tab}-gray.png`;
                    btn.classList.remove('active');
                });

                this.classList.add('active');
                const activeIcon = this.querySelector('.tab-icon');
                activeIcon.src = `phone/${tabName}-blue.png`;

                // Update tab content
                phoneTabs.forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector(`.${tabName}-tab`).classList.add('active');

                // Update title
                const phoneTitle = document.querySelector('.phone-title');
                if (phoneTitle) {
                    phoneTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
                }
            });
        });

        // Phone keypad functionality
        const phoneKeys = document.querySelectorAll('.phone-keypad .key');
        const phoneNumberDisplay = document.querySelector('.phone-number');
        let phoneNumber = '';

        phoneKeys.forEach(key => {
            key.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                if (value && phoneNumberDisplay) {
                    phoneNumber += value;
                    phoneNumberDisplay.textContent = phoneNumber;
                }
            });
        });

        // Sample call data
        const recentCalls = [
            { name: "John Doe", type: "mobile", answered: true, time: "10:30", initials: "JD", color: "#4CD964" },
            { name: "Jane Smith", type: "mobile", answered: false, time: "Yesterday", initials: "JS", color: "#FF3B30" },
            { name: "Mom", type: "home", answered: true, time: "Tuesday", initials: "M", color: "#FFCC00" },
            { name: "Work", type: "work", answered: true, time: "Monday", initials: "W", color: "#5AC8FA" },
            { name: "Sarah Johnson", type: "mobile", answered: false, time: "Sunday", initials: "SJ", color: "#FF2D55" },
            { name: "Mike Wilson", type: "mobile", answered: true, time: "12:15", initials: "MW", color: "#5856D6" },
            { name: "Doctor", type: "work", answered: false, time: "Friday", initials: "D", color: "#007AFF" },
            { name: "David Brown", type: "mobile", answered: true, time: "11:45", initials: "DB", color: "#FF9500" },
            { name: "Emergency", type: "mobile", answered: false, time: "Thursday", initials: "E", color: "#FF3B30" }
        ];

        // Function to generate call list
        function generateCallList() {
            const callList = document.querySelector('.call-list');
            if (callList) {
                callList.innerHTML = '';

                recentCalls.forEach(call => {
                    const callItem = document.createElement('div');
                    callItem.className = 'call-item';

                    // Calculate darker color for initials
                    const darkerColor = adjustColorBrightness(call.color, -40);

                    callItem.innerHTML = `
                <div class="call-avatar" style="background-color: ${call.color}">
                    <span style="color: ${darkerColor}">${call.initials}</span>
                </div>
                <div class="call-info">
                    <div class="call-name ${call.answered ? '' : 'missed'}">${call.name}</div>
                    <div class="call-type">${call.type}</div>
                </div>
                <div class="call-details">
                    <div class="call-time">${call.time}</div>
                    <div class="info-button">i</div>
                </div>
            `;

                    callList.appendChild(callItem);
                });
            }
        }

        // Generate call list on load
        generateCallList();

        // Messages app functionality
        const messageThreads = document.querySelectorAll('.message-thread');
        const messagesListView = document.querySelector('.messages-list');
        const chatView = document.querySelector('.chat-view');
        const chatBackButton = document.querySelector('.chat-back-button');

        messageThreads.forEach(thread => {
            thread.addEventListener('click', function() {
                const contactName = this.querySelector('.thread-name').textContent;
                openMessageChat(contactName);
            });
        });

        if (chatBackButton) {
            chatBackButton.addEventListener('click', () => {
                closeMessageChat();
            });
        }

        function openMessageChat(contactName) {
            if (messagesListView && chatView) {
                messagesListView.classList.remove('active');
                chatView.classList.add('active');
                
                const chatContactName = document.querySelector('.chat-contact-name');
                if (chatContactName) {
                    chatContactName.textContent = contactName;
                }
            }
        }

        function closeMessageChat() {
            if (messagesListView && chatView) {
                chatView.classList.remove('active');
                messagesListView.classList.add('active');
            }
        }

        // Instagram swipe functionality
        const instagramApp = document.querySelector('.instagram-app');
        const instagramFeed = document.querySelector('.instagram-feed');
        const instagramMessages = document.querySelector('.instagram-messages');
        const messagesBackButton = document.querySelector('.messages-back-button');

        if (instagramApp) {
            let startX;
            instagramApp.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            });

            instagramApp.addEventListener('touchmove', (e) => {
                const currentX = e.touches[0].clientX;
                const deltaX = startX - currentX;

                if (deltaX > 50 && instagramFeed && instagramFeed.classList.contains('active')) {
                    // Swipe left to messages
                    instagramFeed.classList.remove('active');
                    instagramMessages.classList.add('active');
                } else if (deltaX < -50 && instagramMessages && instagramMessages.classList.contains('active')) {
                    // Swipe right to feed
                    instagramMessages.classList.remove('active');
                    instagramFeed.classList.add('active');
                }
            });

            // Mouse events for desktop
            instagramApp.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                instagramApp.addEventListener('mousemove', handleInstagramMouseMove);
                instagramApp.addEventListener('mouseup', () => {
                    instagramApp.removeEventListener('mousemove', handleInstagramMouseMove);
                });
            });

            function handleInstagramMouseMove(e) {
                const deltaX = startX - e.clientX;
                if (deltaX > 50 && instagramFeed && instagramFeed.classList.contains('active')) {
                    instagramFeed.classList.remove('active');
                    instagramMessages.classList.add('active');
                } else if (deltaX < -50 && instagramMessages && instagramMessages.classList.contains('active')) {
                    instagramMessages.classList.remove('active');
                    instagramFeed.classList.add('active');
                }
            }
        }

        if (messagesBackButton) {
            messagesBackButton.addEventListener('click', () => {
                if (instagramMessages && instagramFeed) {
                    instagramMessages.classList.remove('active');
                    instagramFeed.classList.add('active');
                }
            });
        }

        // Notes app functionality
        const notesTabs = document.querySelectorAll('.notes-tab');
        const notesPeriods = document.querySelectorAll('.notes-period');
        const notesListView = document.querySelector('.notes-list');
        const noteEditorView = document.querySelector('.note-editor');
        const editorBackButton = document.querySelector('.editor-back-button');
        const editorDoneButton = document.querySelector('.editor-done');

        notesTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const period = this.getAttribute('data-period');
                
                // Update active tab
                notesTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update active period content
                notesPeriods.forEach(p => p.classList.remove('active'));
                const targetPeriod = document.querySelector(`.notes-period[data-period="${period}"]`);
                if (targetPeriod) {
                    targetPeriod.classList.add('active');
                }
            });
        });

        // Note item clicks
        document.addEventListener('click', function(e) {
            if (e.target.closest('.note-item')) {
                openNoteEditor();
            }
        });

        if (newNoteButton) {
            newNoteButton.addEventListener('click', () => {
                openNoteEditor();
                const noteTextarea = document.querySelector('.note-textarea');
                if (noteTextarea) {
                    noteTextarea.value = '';
                }
            });
        }

        if (editorBackButton) {
            editorBackButton.addEventListener('click', closeNoteEditor);
        }

        if (editorDoneButton) {
            editorDoneButton.addEventListener('click', closeNoteEditor);
        }

        function openNoteEditor() {
            if (notesListView && noteEditorView) {
                notesListView.classList.remove('active');
                noteEditorView.classList.add('active');
            }
        }

        function closeNoteEditor() {
            if (notesListView && noteEditorView) {
                noteEditorView.classList.remove('active');
                notesListView.classList.add('active');
            }
        }

        // ChatGPT functionality (keeping existing)
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', function () {
                const chatName = this.querySelector('.chat-name').textContent;
                openChat(chatName);
            });
        });

        const chatContentBackButton = document.querySelector('.chat-content-view .back-button');
        if (chatContentBackButton) {
            chatContentBackButton.addEventListener('click', closeChat);
        }

        function openChat(chatName) {
            let chatUrl;

            switch (chatName) {
                case 'Gabi':
                    chatUrl = 'https://www.youtube.com';
                    break;
                case 'Rali':
                    chatUrl = 'https://chatgpt.com/share/68b88b5c-9ec0-8006-a354-bb97e1bc1096';
                    break;
                case 'MVR':
                    chatUrl = 'https://chat.openai.com/chat-mvr-link';
                    break;
                default:
                    console.log('Unknown chat:', chatName);
                    return;
            }

            if (chatName === 'Rali') {
                const chatGPTApp = document.querySelector('.chatgpt-app');
                const chatContentView = document.querySelector('.chat-content-view');
                const chatIframe = document.getElementById('chat-iframe');

                if (chatIframe && chatGPTApp && chatContentView) {
                    chatIframe.src = chatUrl;
                    chatGPTApp.classList.remove('active');
                    chatContentView.classList.add('active');
                }
            } else {
                window.open(chatUrl, '_blank');
            }
        }

        function closeChat() {
            const chatGPTApp = document.querySelector('.chatgpt-app');
            const chatContentView = document.querySelector('.chat-content-view');
            const chatIframe = document.getElementById('chat-iframe');

            if (chatIframe && chatGPTApp && chatContentView) {
                chatIframe.src = '';
                chatContentView.classList.remove('active');
                chatGPTApp.classList.add('active');
            }
        }
    }

    function showPasscodeScreen() {
        if (preLockScreen && lockScreen) {
            preLockScreen.classList.add('hidden');
            lockScreen.classList.add('active');
        }
    }

    function updateDots() {
        passcodeDots.forEach((dot, index) => {
            dot.classList.toggle('filled', index < enteredPasscode.length);
        });
    }

    function verifyPasscode() {
        if (enteredPasscode.length === 6) {
            if (enteredPasscode === CORRECT_PASSCODE) {
                if (lockScreen && iphoneContainer) {
                    lockScreen.classList.remove('active');
                    setTimeout(() => {
                        lockScreen.classList.add('hidden');
                        iphoneContainer.style.display = 'flex';
                        iphoneContainer.style.justifyContent = 'center';
                        iphoneContainer.style.alignItems = 'center';
                    }, 500);
                }
                enteredPasscode = "";
                updateDots();
                attempts = 0;
            } else {
                // Incorrect passcode
                const dotsContainer = document.querySelector('.passcode-dots');
                if (dotsContainer) {
                    dotsContainer.classList.add('shake-dots');
                    setTimeout(() => {
                        dotsContainer.classList.remove('shake-dots');
                    }, 500);
                }

                attempts++;
                if (passcodeError) {
                    passcodeError.classList.remove('hidden');
                    setTimeout(() => {
                        enteredPasscode = "";
                        updateDots();
                        passcodeError.classList.add('hidden');
                    }, 1000);
                }

                if (attempts >= MAX_ATTEMPTS) {
                    if (passcodeError) {
                        passcodeError.textContent = "iPhone is disabled. Try again later.";
                    }
                    disableKeypad();
                    setTimeout(() => {
                        enableKeypad();
                        attempts = 0;
                    }, 30000);
                }
            }
        }
    }

    function disableKeypad() {
        keys.forEach(key => {
            key.disabled = true;
            key.style.opacity = '0.5';
        });
    }

    function enableKeypad() {
        keys.forEach(key => {
            key.disabled = false;
            key.style.opacity = '1';
        });
    }

    function initializeApps() {
        const apps = [
            { name: "Phone", icon: "icons/phone.png", class: "phone-app" },
            { name: "Messages", icon: "icons/messages.png", class: "messages-app" },
            { name: "Messenger", icon: "icons/messenger.png", class: "messenger-app" },
            { name: "Instagram", icon: "icons/instagram.png", class: "instagram-app" },
            { name: "Photos", icon: "icons/photos.png", class: "photos-app" },
            { name: "Google", icon: "icons/google.png", class: "google-app" },
            { name: "Notes", icon: "icons/notes.png", class: "notes-app" },
            { name: "ChatGPT", icon: "icons/chatgpt.png", class: "chatgpt-app" },
            { name: "Voicememos", icon: "icons/voicememos.png", class: "voicememos-app" }
        ];

        // Add apps to home screen
        if (appGrid) {
            apps.forEach(app => {
                const appElement = document.createElement('div');
                appElement.className = 'app-icon';
                appElement.innerHTML = `
                    <img src="${app.icon}" alt="${app.name}">
                    <span>${app.name}</span>
                `;
                appElement.addEventListener('click', (e) => {
                    if (e.target === appElement || e.target === appElement.querySelector('img') || e.target === appElement.querySelector('span')) {
                        showView(app.class);
                    }
                });
                appGrid.appendChild(appElement);
            });
        }

        // Add 4 apps to dock
        const dockApps = apps.slice(0, 4);
        if (dock) {
            dockApps.forEach(app => {
                const appElement = document.createElement('div');
                appElement.className = 'app-icon';
                appElement.innerHTML = `
                    <img src="${app.icon}" alt="${app.name}">
                `;
                appElement.addEventListener('click', (e) => {
                    if (e.target === appElement || e.target === appElement.querySelector('img')) {
                        showView(app.class);
                    }
                });
                dock.appendChild(appElement);
            });
        }
    }

    function showView(viewName) {
        views.forEach(view => {
            view.classList.remove('active');
            if (view.classList.contains(viewName)) {
                view.classList.add('active');
            }
        });
    }

    function adjustColorBrightness(color, amount) {
        const usePound = color[0] === "#";
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let b = (num >> 8 & 0x00FF) + amount;
        let g = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        b = b > 255 ? 255 : b < 0 ? 0 : b;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
    }

    // Update time every minute
    setInterval(updateDateTime, 60000);

    function adjustPhoneSize() {
        const iphoneFrame = document.querySelector('.iphone-frame');
        const lockScreens = document.querySelectorAll('.pre-lock-screen, .lock-screen');
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const aspectRatio = 0.461; // iPhone 16 Pro Max

        if (iphoneFrame && lockScreens.length > 0) {
            // For very tall screens (mobile phones in portrait)
            if (viewportHeight > viewportWidth * 2.0) {
                const maxHeight = viewportHeight * 0.95;
                iphoneFrame.style.height = maxHeight + 'px';
                iphoneFrame.style.width = (maxHeight * aspectRatio) + 'px';

                lockScreens.forEach(screen => {
                    screen.style.height = maxHeight + 'px';
                    screen.style.width = (maxHeight * aspectRatio) + 'px';
                });
            }
            // For desktop/laptop screens
            else {
                const maxWidth = viewportWidth * 0.4;
                iphoneFrame.style.width = Math.min(430, maxWidth) + 'px';
                iphoneFrame.style.height = (Math.min(430, maxWidth) / aspectRatio) + 'px';

                lockScreens.forEach(screen => {
                    screen.style.width = Math.min(430, maxWidth) + 'px';
                    screen.style.height = (Math.min(430, maxWidth) / aspectRatio) + 'px';
                });
            }
        }
    }

    window.addEventListener('load', adjustPhoneSize);
    window.addEventListener('resize', adjustPhoneSize);
    adjustPhoneSize();
});