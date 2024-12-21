// Theme handling logic
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.classList.add(`${savedTheme}-mode`);
updateThemeIcon();

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    
    updateThemeIcon();
});

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

// Input field handler
const inputField = document.getElementById('input');
const sendButton = document.getElementById('send');

inputField.addEventListener('input', () => {
    sendButton.disabled = !inputField.value.trim() && !uploadedImage;
});