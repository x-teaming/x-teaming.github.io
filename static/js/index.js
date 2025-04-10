function toggleExample(id) {
  var table = document.getElementById('example-' + id);
  var btn = document.getElementById('btn-' + id);
  var btnIcon = btn.querySelector('span') && btn.querySelector('span').children[0];
  if (table.style.display === 'none') {
    table.style.display = '';
    if (btnIcon) {
      btnIcon.classList.remove('fa-chevron-right');
      btnIcon.classList.add('fa-chevron-down');
    }
  } else {
    table.style.display = 'none';
    if (btnIcon) {
      btnIcon.classList.remove('fa-chevron-down');
      btnIcon.classList.add('fa-chevron-right');
    }
  }
}

const conversations = {};
var mode = 'no-jailbreak';

async function preloadConversation(model) {
  if (model in conversations) {
    return;
  }
  const res = await fetch(`/static/js/${model}.json`);
  const json = await res.json();
  conversations[model] = json;
}

function createModelItem(model) {
  const item = document.createElement('div');
  item.className = `model-item`;
  item.innerHTML = `
      <div class="has-text-centered has-text-dark">${model.name}</div>
  `;
  item.addEventListener('click', e => selectModel(e.currentTarget, model.name));
  return item;
}

async function selectModel(el, modelName) {
  await preloadConversation(modelName);
  document.querySelectorAll('.model-item').forEach(item => item.classList.remove('is-active'));
  el.classList.add('is-active');
  updateConversation(modelName);
}

function updateConversation(modelName) {
  const container = document.getElementById('conversation-container');
  container.innerHTML = "";
  var attemptNum = 1;
  var convo = conversations[modelName][mode];
  for (var i = 0; i < convo.length; i++) {
    var msg = convo[i];
    var nextPhase = Infinity;
    if (i < convo.length - 1) {
      nextPhase = convo[i+1].phase;
    }
    if (msg.phase < nextPhase) {
      var html = `<div class="message user-message">`;
      if (attemptNum > 1) {
        html += `<strong>(TextGrad Revision #${attemptNum})</strong><br>`;
      }
      html += `${msg.attacker}</div>`;
      html += `<div class="message ai-message">${marked.parse(msg.target)}</div>`;
      container.innerHTML += html;
      attemptNum = 1;
    } else {
      attemptNum++;
    }
  }

  const messages = document.querySelectorAll('.message');

  messages.forEach(message => {
    // Get the content directly if it's not wrapped in a <p>
    const content = message.innerHTML.trim();
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'pre-wrap'; // Preserve line breaks
    document.body.appendChild(tempElement);

    // Calculate the number of lines
    const lineHeight = parseFloat(window.getComputedStyle(message).lineHeight);
    const numberOfLines = parseInt(tempElement.clientHeight / lineHeight);

    // Clean up the temporary element
    document.body.removeChild(tempElement);

    if (numberOfLines > 15) {
      message.classList.add('expandable', 'collapsed');

      const fade = document.createElement('div');
      fade.className = 'fade';
      message.appendChild(fade);

      const toggleContainer = document.createElement('div');
      toggleContainer.classList.add('toggle-container');
      if (message.classList.contains('ai-message')) {
        toggleContainer.classList.add('mr-auto');
      } else {
        toggleContainer.classList.add('ml-auto');
      }

      const toggle = document.createElement('button');
      toggle.classList.add('toggle', 'has-text-link', 'button');
      toggle.textContent = 'Show more';
      toggle.addEventListener('click', () => {
        const expanded = message.classList.contains('expanded');

        if (!expanded) {
          // Expand the message
          message.style.maxHeight = `${message.scrollHeight}px`; // Set to exact content height
          message.classList.add('expanded');
          toggle.textContent = 'Show less';

          // Add transition handling for expanding
          message.addEventListener(
            'transitionend',
            () => {
              message.style.maxHeight = 'none'; // Allow natural height after expansion
            },
            { once: true }
          );
        } else {
          // Retract the message
          message.style.maxHeight = `${message.scrollHeight}px`; // Reset to current height
          requestAnimationFrame(() => {
            message.style.maxHeight = '22.5em'; // Retract to collapsed height
          });
          message.classList.remove('expanded');
          toggle.textContent = 'Show more';
        }
      });

      toggleContainer.appendChild(toggle);
      message.parentNode.insertBefore(toggleContainer, message.nextSibling); // Insert after the message
    }
  });
}

// Initialize models
const models = [
  { name: "GPT-4o", icon: "fab fa-accessible-icon" },
  { name: "Claude 3.7 Sonnet", icon: "fas fa-cloud-moon" },
  { name: "Gemini 2.0 Flash", icon: "fas fa-gem" },
  { name: "Llama-3-70B-IT", icon: "fas fa-horse-head" },
  { name: "Llama-3-8B-IT (SafeMTData)", icon: "fas fa-shield-alt" },
  { name: "Deepseek V3", icon: "fas fa-search-plus" }
];

document.addEventListener('DOMContentLoaded', function () {
  const modelList = document.getElementById('model-list');
  models.forEach(model => modelList.appendChild(createModelItem(model)));

  // Tab handling
  document.querySelectorAll('.tabs li').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tabs li').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        mode = tab.dataset.mode;
        const activeModel = document.querySelector('.model-item.is-active');
        if (activeModel) {
            const modelName = activeModel.children[0].textContent;
            updateConversation(modelName, mode);
        }
    });
  });

  var firstModel = modelList.children[0];
  selectModel(firstModel, firstModel.children[0].textContent);
});
