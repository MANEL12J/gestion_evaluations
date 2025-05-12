class Chat {
    constructor() {
        this.currentChatUser = null;
        this.messageCheckInterval = null;
        this.init();
    }

    init() {
        // Add chat HTML to the page
        const chatHTML = `
            <div class="chat-icon" id="chatIcon">
                <i class="fas fa-comments"></i>
                <span class="unread-badge" style="display: none;">0</span>
            </div>
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <span class="back-to-users" style="display: none;"><i class="fas fa-arrow-left"></i></span>
                    <span id="chatTitle"><i class="fas fa-inbox"></i> Messages</span>
                </div>
                <div class="chat-search">
                    <div class="search-wrapper">
                        <input type="text" placeholder="Rechercher..." id="userSearch">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
                <div class="chat-users" id="chatUsers"></div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input">
                    <div class="input-wrapper">
                        <input type="text" placeholder="Écrivez votre message..." id="messageInput">
                        <button class="send-button"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatHTML);

        // Add event listeners
        this.addEventListeners();
        
        // Start checking for new messages
        this.startCheckingMessages();
    }

    addEventListeners() {
        const chatIcon = document.getElementById('chatIcon');
        const chatWindow = document.getElementById('chatWindow');
        const userSearch = document.getElementById('userSearch');
        const messageInput = document.getElementById('messageInput');
        const backButton = document.querySelector('.back-to-users');
        const sendButton = document.querySelector('.send-button');

        chatIcon.addEventListener('click', () => {
            chatWindow.classList.toggle('active');
            if (chatWindow.classList.contains('active')) {
                this.loadUsers();
                userSearch.focus();
            }
        });

        userSearch.addEventListener('input', debounce(() => {
            this.searchUsers(userSearch.value);
        }, 300));

        const sendMessage = () => {
            const message = messageInput.value.trim();
            if (message) {
                this.sendMessage(message);
                messageInput.value = '';
                messageInput.focus();
            }
        };

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        sendButton.addEventListener('click', sendMessage);

        backButton.addEventListener('click', () => {
            this.showUserList();
            userSearch.focus();
        });

        // Fermer le chat si on clique en dehors
        document.addEventListener('click', (e) => {
            if (!chatWindow.contains(e.target) && !chatIcon.contains(e.target) && chatWindow.classList.contains('active')) {
                chatWindow.classList.remove('active');
            }
        });
    }

    async searchUsers(query) {
        try {
            console.log('Searching users with query:', query);
            const response = await fetch(`/gestion_evaluations/api/search_users.php?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            console.log('Search response:', data);
            
            if (data.success) {
                this.displayUsers(data.users);
            } else if (data.error) {
                console.error('Server error:', data.error, data.debug);
            }
        } catch (error) {
            console.error('Erreur lors de la recherche des utilisateurs:', error);
        }
    }

    displayUsers(users) {
        const chatUsers = document.getElementById('chatUsers');
        const chatIcon = document.getElementById('chatIcon');
        const unreadBadge = chatIcon.querySelector('.unread-badge');
        const searchInput = document.getElementById('userSearch');
        const isSearching = searchInput.value.trim().length > 0;
        
        // Calculate total unread messages
        const totalUnread = users.reduce((sum, user) => sum + (parseInt(user.unread_count) || 0), 0);
        
        // Update the main chat icon badge
        if (totalUnread > 0) {
            unreadBadge.style.display = 'flex';
            unreadBadge.textContent = totalUnread;
        } else {
            unreadBadge.style.display = 'none';
        }
        
        // Display users with conversations first, then other users if searching
        const sortedUsers = [...users].sort((a, b) => {
            if (parseInt(a.has_conversation) === parseInt(b.has_conversation)) {
                return 0;
            }
            return parseInt(b.has_conversation) - parseInt(a.has_conversation);
        });

        chatUsers.innerHTML = sortedUsers.map(user => `
            <div class="chat-user-item${parseInt(user.has_conversation) > 0 ? ' has-conversation' : ''}" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas ${user.type === 'enseignant' ? 'fa-chalkboard-teacher' : 'fa-user-graduate'}"></i>
                    </div>
                    <div class="user-details">
                        <span class="user-name">${user.nom}</span>
                        ${parseInt(user.has_conversation) > 0 ? '<span class="last-message"><i class="fas fa-check"></i> Conversation existante</span>' : ''}
                    </div>
                </div>
                ${parseInt(user.unread_count) > 0 ? `<span class="unread-count">${user.unread_count}</span>` : ''}
            </div>
        `).join('');

        chatUsers.querySelectorAll('.chat-user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                this.openChat(userId, item.textContent);
            });
        });
    }

    async openChat(userId, userName) {
        this.currentChatUser = userId;
        document.getElementById('chatTitle').textContent = userName;
        document.querySelector('.back-to-users').style.display = 'inline';
        document.getElementById('chatUsers').style.display = 'none';
        document.getElementById('chatMessages').classList.add('active');
        document.querySelector('.chat-input').classList.add('active');
        document.querySelector('.chat-search').style.display = 'none';

        // Marquer les messages comme lus
        try {
            await fetch('/gestion_evaluations/api/mark_messages_read.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender_id: userId
                })
            });
        } catch (error) {
            console.error('Erreur lors du marquage des messages comme lus:', error);
        }

        await this.loadMessages();
    }

    showUserList() {
        this.currentChatUser = null;
        document.getElementById('chatTitle').textContent = 'Messages';
        document.querySelector('.back-to-users').style.display = 'none';
        document.getElementById('chatUsers').style.display = 'block';
        document.getElementById('chatMessages').classList.remove('active');
        document.querySelector('.chat-input').classList.remove('active');
        document.querySelector('.chat-search').style.display = 'block';
        this.loadUsers();
    }

    async loadMessages() {
        if (!this.currentChatUser) return;

        try {
            const response = await fetch(`/gestion_evaluations/api/get_messages.php?user_id=${this.currentChatUser}`);
            const data = await response.json();
            
            if (data.success) {
                this.displayMessages(data.messages);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    displayMessages(messages) {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = messages.map(message => {
            const messageDate = new Date(message.timestamp);
            const formattedTime = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const formattedDate = messageDate.toLocaleDateString();
            
            return `
                <div class="message ${message.sender_id == this.currentChatUser ? 'received' : 'sent'}">
                    <div class="message-content">
                        <div class="message-text">${this.formatMessageText(message.message)}</div>
                        <div class="message-meta">
                            <span class="message-time" title="${formattedDate}">
                                <i class="far fa-clock"></i> 
                                ${formattedTime}
                            </span>
                            ${message.sender_id != this.currentChatUser ? `
                                <span class="message-status">
                                    <i class="fas ${message.is_read ? 'fa-check-double' : 'fa-check'}"></i>
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessageText(text) {
        return text; // Affichage simple du texte sans modification
    }

    async sendMessage(message) {
        if (!this.currentChatUser) return;

        try {
            const response = await fetch('/gestion_evaluations/api/send_message.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiver_id: this.currentChatUser,
                    message: message
                })
            });
            
            const data = await response.json();
            if (data.success) {
                await this.loadMessages();
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
        }
    }

    async loadUsers(query = '') {
        try {
            // If no query, load existing conversations
            const response = await fetch(`/gestion_evaluations/api/search_users.php?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                this.displayUsers(data.users);
                
                // If searching and no results, show a message
                const chatUsers = document.getElementById('chatUsers');
                if (query && data.users.length === 0) {
                    chatUsers.innerHTML = '<div class="no-results">Aucun utilisateur trouvé</div>';
                }
            } else if (data.error) {
                console.error('Erreur serveur:', data.error);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        }
    }

    startCheckingMessages() {
        if (this.messageCheckInterval) {
            clearInterval(this.messageCheckInterval);
        }
        
        this.messageCheckInterval = setInterval(() => {
            if (this.currentChatUser) {
                this.loadMessages();
            } else {
                this.loadUsers();
            }
        }, 5000);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize chat when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chat = new Chat();
});
