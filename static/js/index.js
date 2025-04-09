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
