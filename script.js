"use strict";

const $ = (selector) => document.querySelector(selector);

const authScreen = $("#auth-screen");
const authForm = $("#auth-form");
const authEmail = $("#auth-email");
const authPassword = $("#auth-password");
const authTitle = $("#auth-title");
const authDescription = $("#auth-description");
const authMessage = $("#auth-message");
const authSubmit = $("#auth-submit");
const authSwitch = $("#auth-switch");
const authSwitchCopy = $("#auth-switch-copy");
const appSidebar = $("#app-sidebar");
const appMain = $("#inicio");
const profileEmail = $("#profile-email");
const signOutButton = $("#sign-out");
const form = $("#task-form");
const titleInput = $("#task-title");
const categoryInput = $("#task-category");
const priorityInput = $("#task-priority");
const taskList = $("#task-list");
const searchInput = $("#task-search");
const filterInput = $("#task-filter");
const emptyState = $("#empty-state");
const toast = $("#toast");

const allowedCategories = ["Estudos", "Trabalho", "Pessoal", "Projetos"];
const allowedPriorities = ["Baixa", "Média", "Alta"];
let tasks = [];
let currentUser = null;
let authMode = "login";
let toastTimer;

const config = window.TASKFLOW_SUPABASE_CONFIG;
const supabaseClient = window.supabase && config?.url && config?.publishableKey
  ? window.supabase.createClient(config.url, config.publishableKey)
  : null;

function isValidTask(task) {
  return task &&
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    task.title.trim().length >= 1 &&
    task.title.trim().length <= 120 &&
    allowedCategories.includes(task.category) &&
    allowedPriorities.includes(task.priority) &&
    typeof task.completed === "boolean";
}

function setAuthMessage(message, kind = "info") {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${kind === "error" ? "is-error" : ""}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showAuthScreen() {
  authScreen.hidden = false;
  appSidebar.hidden = true;
  appMain.hidden = true;
}

function showApplication() {
  authScreen.hidden = true;
  appSidebar.hidden = false;
  appMain.hidden = false;
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  authTitle.textContent = isSignup ? "Crie sua conta" : "Entre na sua conta";
  authDescription.textContent = isSignup
    ? "Use seu email e crie uma senha com pelo menos 8 caracteres."
    : "Acesse suas tarefas com seu email e senha.";
  authSubmit.textContent = isSignup ? "Criar conta" : "Entrar";
  authSwitchCopy.textContent = isSignup ? "Já tem uma conta?" : "Ainda não tem uma conta?";
  authSwitch.textContent = isSignup ? "Entrar" : "Criar conta";
  authPassword.autocomplete = isSignup ? "new-password" : "current-password";
  authPassword.minLength = isSignup ? 8 : 1;
  setAuthMessage("");
}

function authErrorMessage(error) {
  const message = (error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "Email ou senha incorretos.";
  }
  if (message.includes("email not confirmed")) {
    return "Confirme seu email pelo link enviado antes de entrar.";
  }
  if (message.includes("already registered")) {
    return "Esse email já possui uma conta. Tente entrar.";
  }
  if (message.includes("password")) {
    return "A senha não atende aos requisitos configurados no Supabase.";
  }
  if (message.includes("rate limit")) {
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  }
  return "Não foi possível concluir a operação. Confira a conexão e tente novamente.";
}

function setSession(session) {
  const previousUserId = currentUser?.id;
  currentUser = session?.user ?? null;

  if (!currentUser) {
    tasks = [];
    render();
    showAuthScreen();
    return;
  }

  profileEmail.textContent = currentUser.email || "Conta TaskFlow";
  showApplication();
  if (previousUserId !== currentUser.id) {
    tasks = [];
    render();
    void loadTasks();
  }
}

async function loadTasks() {
  if (!currentUser) return;
  const userId = currentUser.id;

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("id, title, category, priority, completed")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (currentUser?.id !== userId) return;

  if (error) {
    tasks = [];
    render();
    showToast("Não foi possível carregar as tarefas. Confira a tabela, as permissões e as políticas RLS.");
    return;
  }

  tasks = (data || []).filter(isValidTask);
  render();
}

function createTaskRow(task) {
  if (!isValidTask(task)) return null;

  const item = createElement("li", task.completed ? "task-row completed" : "task-row");
  const nameContainer = createElement("div", "task-name");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Marcar "${task.title}" como ${task.completed ? "pendente" : "concluída"}`);
  checkbox.addEventListener("change", () => {
    void updateTaskCompletion(task, checkbox.checked);
  });

  const name = createElement("div", "task-name-text", task.title);
  name.appendChild(createElement("small", "", `Tarefa #${task.id.slice(0, 8)}`));
  nameContainer.append(checkbox, name);

  const category = createElement("span", "category-label", task.category);
  const priority = createElement("span", `priority priority-${task.priority}`, task.priority);
  const status = createElement(
    "span",
    task.completed ? "status status-completed" : "status status-pending",
    task.completed ? "Concluída" : "Pendente"
  );

  const actions = createElement("div", "row-actions");
  const deleteButton = createElement("button", "icon-button", "×");
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Excluir tarefa: ${task.title}`);
  deleteButton.title = "Excluir tarefa";
  deleteButton.addEventListener("click", () => {
    void deleteTask(task);
  });

  actions.appendChild(deleteButton);
  item.append(nameContainer, category, priority, status, actions);
  return item;
}

function getFilteredTasks() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const filter = filterInput.value;

  return tasks.filter(isValidTask).filter((task) => {
    const matchesSearch = task.title.toLocaleLowerCase("pt-BR").includes(query);
    let matchesFilter = true;
    if (filter === "Pendentes") matchesFilter = !task.completed;
    else if (filter === "Concluídas") matchesFilter = task.completed;
    else if (filter === "Alta") matchesFilter = task.priority === "Alta";
    return matchesSearch && matchesFilter;
  });
}

function updateStatistics() {
  const validTasks = tasks.filter(isValidTask);
  const total = validTasks.length;
  const completed = validTasks.filter((task) => task.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  $("#total-count").textContent = total;
  $("#completed-count").textContent = completed;
  $("#pending-count").textContent = total - completed;
  $("#progress-count").textContent = `${progress}%`;
  $("#progress-fill").value = progress;
}

function render() {
  const visibleTasks = getFilteredTasks();
  const fragment = document.createDocumentFragment();
  for (const task of visibleTasks) {
    const row = createTaskRow(task);
    if (row) fragment.appendChild(row);
  }
  taskList.replaceChildren(fragment);
  emptyState.hidden = visibleTasks.length !== 0;
  $("#result-count").textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? "tarefa" : "tarefas"}`;
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

async function updateTaskCompletion(task, completed) {
  if (!currentUser) return;
  const userId = currentUser.id;
  const { data, error } = await supabaseClient
    .from("tasks")
    .update({ completed })
    .eq("id", task.id)
    .eq("user_id", userId)
    .select("id, title, category, priority, completed")
    .single();

  if (error || currentUser?.id !== userId || !isValidTask(data)) {
    showToast("Não foi possível atualizar a tarefa. Confira as políticas RLS.");
    render();
    return;
  }

  tasks = tasks.map((entry) => entry.id === task.id ? data : entry);
  render();
  showToast(completed ? "Tarefa concluída!" : "Tarefa reaberta.");
}

async function deleteTask(task) {
  if (!currentUser) return;
  const userId = currentUser.id;
  const { error } = await supabaseClient
    .from("tasks")
    .delete()
    .eq("id", task.id)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || currentUser?.id !== userId) {
    showToast("Não foi possível excluir a tarefa. Confira as políticas RLS.");
    return;
  }

  tasks = tasks.filter((entry) => entry.id !== task.id);
  render();
  showToast("Tarefa excluída.");
}

authSwitch.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    setAuthMessage("A conexão com o Supabase não foi configurada. Confira a URL e a chave pública.", "error");
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password || (authMode === "signup" && password.length < 8)) {
    setAuthMessage("Informe um email válido e uma senha com pelo menos 8 caracteres.", "error");
    return;
  }

  authSubmit.disabled = true;
  setAuthMessage(authMode === "signup" ? "Criando sua conta..." : "Entrando...");
  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
      } else {
        setAuthMessage("Conta criada. Confira seu email e confirme o cadastro antes de entrar.");
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
    }
  } catch (error) {
    setAuthMessage(authErrorMessage(error), "error");
  } finally {
    authSubmit.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  const { error } = await supabaseClient.auth.signOut();
  signOutButton.disabled = false;
  if (error) {
    showToast("Não foi possível sair. Tente novamente.");
    return;
  }
  tasks = [];
  currentUser = null;
  setAuthMessage("Você saiu da sua conta.");
  showAuthScreen();
});

$("#open-form").addEventListener("click", openForm);
$("#cancel-form").addEventListener("click", closeForm);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const priority = priorityInput.value;

  if (title.length < 1 || title.length > 120) {
    showToast("O nome deve ter entre 1 e 120 caracteres.");
    titleInput.focus();
    return;
  }
  if (!allowedCategories.includes(category) || !allowedPriorities.includes(priority)) {
    showToast("Uma das opções selecionadas é inválida.");
    return;
  }
  if (!currentUser) {
    showToast("Entre na sua conta para criar tarefas.");
    showAuthScreen();
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  const { data, error } = await supabaseClient
    .from("tasks")
    .insert({ user_id: currentUser.id, title, category, priority, completed: false })
    .select("id, title, category, priority, completed")
    .single();
  submitButton.disabled = false;

  if (error || !isValidTask(data)) {
    showToast("Não foi possível salvar. Confira a tabela, as permissões e as políticas RLS.");
    return;
  }

  tasks.unshift(data);
  closeForm();
  render();
  showToast("Nova tarefa salva!");
});

searchInput.addEventListener("input", render);
filterInput.addEventListener("change", render);

render();
setAuthMode("login");

if (!supabaseClient) {
  setAuthMessage("A configuração pública do Supabase não foi carregada.", "error");
} else {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    setTimeout(() => setSession(session), 0);
  });

  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      setAuthMessage("Não foi possível verificar a sessão. Tente recarregar a página.", "error");
      showAuthScreen();
      return;
    }
    setSession(data.session);
  });
}
