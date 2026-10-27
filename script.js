
"use strict";

const $ = (selector) => document.querySelector(selector);

const form = $("#task-form");
const titleInput = $("#task-title");
const categoryInput = $("#task-category");
const priorityInput = $("#task-priority");
const taskList = $("#task-list");
const searchInput = $("#task-search");
const filterInput = $("#task-filter");
const emptyState = $("#empty-state");
const toast = $("#toast");

let nextId = 4;
let toastTimer;

const tasks = [
  {
    id: 1,
    title: "Estudar HTML semântico",
    category: "Estudos",
    priority: "Alta",
    completed: true
  },
  {
    id: 2,
    title: "Praticar funções em JavaScript",
    category: "Estudos",
    priority: "Alta",
    completed: false
  },
  {
    id: 3,
    title: "Organizar o projeto pessoal",
    category: "Projetos",
    priority: "Média",
    completed: false
  }
];

const allowedCategories = ["Estudos", "Trabalho", "Pessoal", "Projetos"];
const allowedPriorities = ["Baixa", "Média", "Alta"];

function isValidTask(task) {
  return typeof task.title === "string" &&
    task.title.trim().length >= 1 &&
    task.title.trim().length <= 120 &&
    allowedCategories.includes(task.category) &&
    allowedPriorities.includes(task.priority) &&
    typeof task.completed === "boolean";
}

function showToast(message) {
  // O conteúdo da notificação também é tratado como texto.
  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function createTaskRow(task) {
  if (!isValidTask(task)) {
    return null;
  }

  const item = createElement(
    "li",
    task.completed ? "task-row completed" : "task-row"
  );

  const nameContainer = createElement("div", "task-name");
  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute(
    "aria-label",
    `Marcar "${task.title}" como ${task.completed ? "pendente" : "concluída"}`
  );

  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked;
    render();
    showToast(task.completed ? "Tarefa concluída!" : "Tarefa reaberta.");
  });

  const name = createElement("div", "task-name-text", task.title);
  name.appendChild(
    createElement("small", "", `Tarefa #${task.id}`)
  );

  nameContainer.append(checkbox, name);

  const category = createElement("span", "category-label", task.category);
  const priority = createElement(
    "span",
    `priority priority-${task.priority}`,
    task.priority
  );

  const status = createElement(
    "span",
    task.completed
      ? "status status-completed"
      : "status status-pending",
    task.completed ? "Concluída" : "Pendente"
  );

  const actions = createElement("div", "row-actions");
  const deleteButton = createElement("button", "icon-button", "×");

  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Excluir tarefa: ${task.title}`);
  deleteButton.title = "Excluir tarefa";

  deleteButton.addEventListener("click", () => {
    const index = tasks.findIndex((entry) => entry.id === task.id);

    if (index === -1) {
      return;
    }

    tasks.splice(index, 1);
    render();
    showToast("Tarefa excluída.");
  });

  actions.appendChild(deleteButton);
  item.append(nameContainer, category, priority, status, actions);

  return item;
}

function getFilteredTasks() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const filter = filterInput.value;

  return tasks.filter(isValidTask).filter((task) => {
    const matchesSearch = task.title
      .toLocaleLowerCase("pt-BR")
      .includes(query);

    let matchesFilter = true;

    if (filter === "Pendentes") {
      matchesFilter = !task.completed;
    } else if (filter === "Concluídas") {
      matchesFilter = task.completed;
    } else if (filter === "Alta") {
      matchesFilter = task.priority === "Alta";
    }

    return matchesSearch && matchesFilter;
  });
}

function updateStatistics() {
  const validTasks = tasks.filter(isValidTask);
  const total = validTasks.length;
  const completed = validTasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  $("#total-count").textContent = total;
  $("#completed-count").textContent = completed;
  $("#pending-count").textContent = pending;
  $("#progress-count").textContent = `${progress}%`;
  $("#progress-fill").value = progress;
}

function render() {
  const visibleTasks = getFilteredTasks();
  const fragment = document.createDocumentFragment();

  for (const task of visibleTasks) {
    const row = createTaskRow(task);

    if (row) {
      fragment.appendChild(row);
    }
  }

  // Reconstrói a lista com elementos criados pelo próprio código.
  taskList.replaceChildren(fragment);

  emptyState.hidden = visibleTasks.length !== 0;
  $("#result-count").textContent =
    `${visibleTasks.length} ${visibleTasks.length === 1 ? "tarefa" : "tarefas"}`;

  updateStatistics();
}

function openForm() {
  form.hidden = false;
  titleInput.focus();
}

function closeForm() {
  form.reset();
  form.hidden = true;
  $("#open-form").focus();
}

$("#open-form").addEventListener("click", openForm);
$("#cancel-form").addEventListener("click", closeForm);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const priority = priorityInput.value;

  if (title.length < 1 || title.length > 120) {
    showToast("O nome deve ter entre 1 e 120 caracteres.");
    titleInput.focus();
    return;
  }

  if (
    !allowedCategories.includes(category) ||
    !allowedPriorities.includes(priority)
  ) {
    showToast("Uma das opções selecionadas é inválida.");
    return;
  }

  tasks.unshift({
    id: nextId++,
    title,
    category,
    priority,
    completed: false
  });

  closeForm();
  render();
  showToast("Nova tarefa criada!");
});

searchInput.addEventListener("input", render);
filterInput.addEventListener("change", render);

render();
