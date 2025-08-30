document.addEventListener('DOMContentLoaded', () => {
    const languageSelector = document.getElementById('language-selector');
    const snippetContainer = document.getElementById('snippet-container');
    let snippetData = null;

    // Fetch snippet data from the JSON file
    fetch('snippets.json')
        .then(response => response.json())
        .then(data => {
            snippetData = data.languages;
            populateLanguageButtons();
            // Display snippets for the first language by default
            if (snippetData && snippetData.length > 0) {
                displaySnippets(snippetData[0].name);
                highlightActiveButton(snippetData[0].name);
            }
        })
        .catch(error => {
            console.error('Error fetching snippet data:', error);
            snippetContainer.innerHTML = '<p>Error loading snippets. Please try again later.</p>';
        });

    // Create and add language buttons to the navigation
    function populateLanguageButtons() {
        snippetData.forEach(language => {
            const button = document.createElement('button');
            button.className = 'lang-button';
            button.textContent = language.name;
            button.dataset.lang = language.name;
            button.addEventListener('click', () => {
                displaySnippets(language.name);
                highlightActiveButton(language.name);
            });
            languageSelector.appendChild(button);
        });
    }

    // Display snippets for the selected language
    function displaySnippets(languageName) {
        const language = snippetData.find(lang => lang.name === languageName);
        if (!language) {
            snippetContainer.innerHTML = '<p>No snippets found for this language.</p>';
            return;
        }

        snippetContainer.innerHTML = ''; // Clear existing snippets
        language.snippets.forEach(snippet => {
            const card = document.createElement('div');
            card.className = 'snippet-card';
            // Store raw code and explanation in data attributes for easy access
            card.innerHTML = `
                <h3>${snippet.title}</h3>
                <pre><code data-code="${escapeHtml(snippet.code)}">${escapeHtml(snippet.code)}</code></pre>
                <div class="snippet-controls" data-explanation="${escapeHtml(snippet.explanation)}">
                    <button class="snippet-btn run-btn">Run</button>
                    <button class="snippet-btn copy-btn">Copy</button>
                    <button class="snippet-btn help-btn">Help</button>
                </div>
            `;
            snippetContainer.appendChild(card);
        });
    }

    // Event Delegation for snippet controls
    snippetContainer.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.snippet-card');
        if (!card) return;

        const code = card.querySelector('code').dataset.code;

        if (target.classList.contains('run-btn')) {
            const activeLangButton = document.querySelector('.lang-button.active');
            const language = activeLangButton.dataset.lang;
            executeCode(language, code);
        } else if (target.classList.contains('copy-btn')) {
            navigator.clipboard.writeText(code).then(() => {
                target.textContent = 'Copied!';
                setTimeout(() => {
                    target.textContent = 'Copy';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code:', err);
                alert('Failed to copy code to clipboard.');
            });
        } else if (target.classList.contains('help-btn')) {
            const explanation = card.querySelector('.snippet-controls').dataset.explanation;
            alert(explanation);
        }
    });

    // Execute code via backend API call
    async function executeCode(language, code) {
        const outputConsole = document.getElementById('output-console');
        outputConsole.textContent = 'Running...';

        try {
            const response = await fetch('http://127.0.0.1:8080/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: language,
                    code: code,
                }),
            });

            const result = await response.json();
            if (result.error) {
                outputConsole.textContent = `Error: ${result.error}`;
            } else {
                outputConsole.textContent = result.output;
            }
        } catch (error) {
            console.error('Error executing code:', error);
            outputConsole.textContent = `Failed to connect to the execution service. Please ensure the backend is running.`;
        }
    }

    // Highlight the currently active language button
    function highlightActiveButton(languageName) {
        const buttons = document.querySelectorAll('.lang-button');
        buttons.forEach(button => {
            if (button.dataset.lang === languageName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // Utility function to escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
