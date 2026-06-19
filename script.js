document.addEventListener('DOMContentLoaded', () => {
  // Scroll bar logic
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    const scrollBar = document.getElementById('scroll-bar');

    if (scrollBar) {
      scrollBar.style.width = scrollPercent + '%';
    }
  });

  // Dark mode toggle logic
  const toggleBtn = document.getElementById('dark-mode-toggle');
  const body = document.body;

  if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
  }

  toggleBtn?.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  const terminal = document.getElementById('portfolio-terminal');
  const terminalLauncher = document.getElementById('terminal-launcher');
  const terminalClose = document.getElementById('terminal-close');
  const terminalForm = document.getElementById('terminal-form');
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');

  if (!terminal || !terminalLauncher || !terminalClose || !terminalForm || !terminalInput || !terminalOutput) {
    return;
  }

  const welcomeMessage = 'Portfolio terminal loaded.\nType "help" to see available commands.';
  const helpMessage = 'Available commands:\n\n* whoami\n* skills\n* projects\n* clear\n* exit\n* funky';
  const whoamiMessage = 'Karan Manhas\nR&D Engineer\nAI | Cybersecurity | Software Engineering';
  const skillsMessage = 'Technical Skills:\n\n* Python\n* Go\n* C++\n* SQL\n* AWS\n* Docker\n* Airflow\n* Redshift\n* Machine Learning\n* Fine-Tuning\n* QLoRA\n* LLM Engineering\n* Cybersecurity\n* Computer Vision';
  let previouslyFocusedElement = null;

  const appendOutput = (message, className = '') => {
    const entry = document.createElement('div');
    entry.className = `terminal-output-entry ${className}`.trim();
    entry.textContent = message;
    terminalOutput.appendChild(entry);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  };

  const getProjects = () => {
    const projectItems = document.querySelectorAll('#case-studies li');

    return Array.from(projectItems).map((item) => {
      const titleElement = item.querySelector('strong');
      const title = titleElement?.textContent.trim().replace(/:$/, '') || 'Untitled Project';
      const content = item.cloneNode(true);

      content.querySelectorAll('i, strong, a, br').forEach((element) => element.remove());
      const summary = content.textContent.replace(/\s+/g, ' ').trim();

      return `${title}\n${summary}`;
    }).join('\n\n');
  };

  const closeTerminal = () => {
    terminal.hidden = true;
    body.classList.remove('terminal-open');
    terminalLauncher.setAttribute('aria-expanded', 'false');
    previouslyFocusedElement?.focus();
  };

  const commandHandlers = {
    help: () => appendOutput(helpMessage),
    whoami: () => appendOutput(whoamiMessage),
    skills: () => appendOutput(skillsMessage),
    projects: () => appendOutput(getProjects() || 'No projects found.'),
    clear: () => terminalOutput.replaceChildren(),
    exit: closeTerminal,
    funky: () => {
      const enabled = terminal.classList.toggle('funky');
      appendOutput(`Funky mode ${enabled ? 'enabled' : 'disabled'}.`);
    }
  };

  const openTerminal = () => {
    previouslyFocusedElement = document.activeElement;
    terminal.hidden = false;
    body.classList.add('terminal-open');
    terminalLauncher.setAttribute('aria-expanded', 'true');
    terminalOutput.replaceChildren();
    appendOutput(welcomeMessage);
    terminalInput.value = '';
    terminalInput.focus();
  };

  terminalLauncher.setAttribute('aria-expanded', 'false');
  terminalLauncher.addEventListener('click', openTerminal);
  terminalClose.addEventListener('click', closeTerminal);

  terminalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const command = terminalInput.value.trim().toLowerCase();
    terminalInput.value = '';

    if (!command) {
      return;
    }

    appendOutput(`$ ${command}`, 'terminal-command');

    if (Object.hasOwn(commandHandlers, command)) {
      commandHandlers[command]();
    } else {
      appendOutput(`Command not found: ${command}. Type "help" to see available commands.`);
    }
  });

  terminal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTerminal();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = [terminalClose, terminalInput];
      const currentIndex = focusableElements.indexOf(document.activeElement);
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + direction + focusableElements.length) % focusableElements.length;

      event.preventDefault();
      focusableElements[nextIndex].focus();
    }
  });
});


// KL Divergence  logic
