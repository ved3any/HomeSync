export function createModal(title, message, buttons) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const container = document.createElement('div');
    container.className = 'modal-container';

    const titleElement = document.createElement('h2');
    titleElement.className = 'modal-title';
    titleElement.textContent = title;

    const messageElement = document.createElement('p');
    messageElement.className = 'modal-message';
    messageElement.textContent = message;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';

    buttons.forEach(buttonInfo => {
        const button = document.createElement('button');
        button.className = `modal-button ${buttonInfo.type}`;
        button.textContent = buttonInfo.text;
        button.addEventListener('click', () => {
            if (buttonInfo.action) {
                buttonInfo.action();
            }
            closeModal(overlay);
        });
        buttonContainer.appendChild(button);
    });

    container.appendChild(titleElement);
    container.appendChild(messageElement);
    container.appendChild(buttonContainer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Animate the modal in
    setTimeout(() => {
        overlay.style.opacity = '1';
        container.style.transform = 'scale(1)';
    }, 50);

    function closeModal(overlay) {
        overlay.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }
}

export function createCookie(name, value) {
    let days = 90;
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export function readCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export function createLoader() {
    const overlay = document.createElement('div');
    overlay.className = 'loader-overlay';

    const container = document.createElement('div');
    container.className = 'loader-container';

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);

    return overlay;
}

export function closeLoader(overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 300);
}