// script.js
// O navegador só envia o número e o token do Google para o servidor
// e exibe o SVG que recebe de volta.

const CLIENT_ID = "60451002008-jqtg3bkejebsmlvmvqmaqcccg55rqm67.apps.googleusercontent.com";


const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";
let idToken = null;

window.addEventListener("load", () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resposta) => {
      idToken = resposta.credential;
      mensagem.textContent = "Login feito. Agora escolha um número.";
    },
  });
  google.accounts.id.renderButton(
    document.getElementById("botao-google"),
    { theme: "outline", size: "large" }
  );
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  botaoBaixar.hidden = true;

  const numero = Number(campoNumero.value);

  const cabecalhos = { "Content-Type": "application/json" };
  if (idToken) {
    cabecalhos["Authorization"] = "Bearer " + idToken;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: digite um número inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent = "Erro 401: faça login com o Google (token ausente, inválido ou expirado).";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Erro inesperado: " + resposta.status;
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch (e) {
    mensagem.textContent = "Falha de rede. Tente de novo.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
