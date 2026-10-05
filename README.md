# Skyjo — Marcador de pontos

App PWA (React + Vite) para marcar a pontuação do jogo de cartas **Skyjo**.
Mesma estrutura do Dadinho: instalável na tela inicial, funciona offline, placar salvo no aparelho.

## Rodar localmente
```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # gera a pasta dist/ para publicar
```

## Publicar no Vercel (mesmo caminho do Dadinho)
1. Crie um repositório novo no GitHub e suba **todos os arquivos deste projeto**
   (não precisa subir `node_modules/` nem `dist/`).
2. No Vercel: **Add New… → Project → Import** o repositório.
   - Framework Preset: **Vite** (detecta sozinho)
   - Build Command: `npm run build` · Output: `dist`
3. **Deploy**. O link de produção é o que você compartilha no WhatsApp.

### Para atualizar depois
Edite o arquivo direto no GitHub (ícone do lápis → alterar → *Commit changes*).
O Vercel republica sozinho. O arquivo do jogo é `src/App.jsx`.

## Regras embutidas
- Cada carta vale de −2 a 12; vence o **menor total**.
- A cada rodada você digita a **soma das 12 cartas** de cada jogador.
- Marcando quem **fechou** a rodada, o app **dobra** os pontos dessa pessoa
  automaticamente quando ela não tem a menor soma da rodada (mostra `×2` no histórico).
- A partida acaba quando alguém atinge o alvo (padrão 100).
