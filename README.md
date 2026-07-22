# Alexandre & Julyanna 🤍

Site de confirmação de presença (RSVP) para o casamento de Alexandre e Julyanna — data a definir.

## Sobre

Página única com contagem regressiva, formulário de confirmação de presença e integração com Google Sheets: cada resposta enviada pelo convidado é salva automaticamente numa planilha, via Google Apps Script.

## Estrutura

```
.
├── index.html      # Página
├── style.css       # Estilo
├── script.js       # Formulário, contagem regressiva e envio para a planilha
└── apps-script.gs  # Código do Google Apps Script (roda no Google, não no site)
```

## Publicando no GitHub Pages

1. Faça upload de `index.html`, `style.css` e `script.js` para o repositório.
2. Vá em **Settings → Pages**.
3. Em "Source", selecione a branch `main` e a pasta `/root`.
4. Salve. O site fica disponível em `seu-usuario.github.io/nome-do-repositorio`.

## Tecnologias

HTML, CSS e JavaScript puros — sem frameworks ou build. Google Apps Script como backend para gravação na planilha.

---

Feito com carinho para Alexandre & Julyanna 💛
