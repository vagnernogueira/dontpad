#!/usr/bin/env bash
#
# bump-version.sh — Atualiza a versão de um dos releases do monorepo e
# dispara o workflow correspondente.
#
# Uso:  scripts/bump-version.sh <app|cli> X.Y.Z
#
#   app  — bumpa backend/ e frontend/ juntos (sempre sincronizados), tag
#          vX.Y.Z, dispara .github/workflows/docker-publish.yml (imagens
#          dontpad-backend/dontpad-frontend no GHCR).
#   cli  — bumpa cli/, tag cli-vX.Y.Z, dispara
#          .github/workflows/cli-release.yml (binários standalone + skill).
#
# Passos (nesta ordem):
#   1. Valida os argumentos (modo + semver X.Y.Z, apenas dígitos).
#   2. Verifica se a working tree está limpa.
#   3. Atualiza package.json e package-lock.json dos pacotes do modo.
#   4. Cria commit com mensagem "chore(release): bump <modo> version to X.Y.Z".
#   5. Cria tag anotada (vX.Y.Z ou cli-vX.Y.Z).
#   6. Executa git push --follow-tags.
#
# Qualquer falha aborta o script imediatamente (set -euo pipefail).
#
# Nota: cli/README.md tem um badge de versão, mas é atualizado pelo próprio
# cli-release.yml (job update-readme-badge) — este script não mexe nele.
# backend/frontend não têm um src/version.* separado — a versão do app só
# importa como metadata de package.json, o build da imagem é tageado pelo
# metadata-action a partir da tag git.

set -euo pipefail

if [ $# -ne 2 ]; then
    echo "Erro: uso: $0 <app|cli> X.Y.Z" >&2
    exit 1
fi

MODE="$1"
NEW_VERSION="$2"

case "$MODE" in
    app)
        PKG_DIRS=(backend frontend)
        TAG="v$NEW_VERSION"
        ;;
    cli)
        PKG_DIRS=(cli)
        TAG="cli-v$NEW_VERSION"
        ;;
    *)
        echo "Erro: modo invalido '$MODE' — esperado 'app' ou 'cli'" >&2
        exit 1
        ;;
esac

if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "Erro: versao invalida '$NEW_VERSION' — esperado formato X.Y.Z (apenas digitos)" >&2
    exit 1
fi

# ---------------------------------------------------------------
# Rollback state machine — evita estado parcial se algo falhar
# ---------------------------------------------------------------
STEP="validated"

_changed_files() {
    for dir in "${PKG_DIRS[@]}"; do
        echo "$dir/package.json"
        echo "$dir/package-lock.json"
    done
}

_cleanup() {
    local ec=$?
    [ $ec -eq 0 ] && return 0
    case "$STEP" in
        files_updated)
            echo "ERRO: falha na etapa de commit apos editar arquivos. Revertendo alteracoes..." >&2
            git checkout -- $(_changed_files)
            echo "OK: arquivos restaurados via checkout. Nenhum commit foi criado." >&2
            ;;
        committed)
            echo "ERRO: falha na etapa de tag apos commit. Revertendo..." >&2
            if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
                git tag -d "$TAG"
            fi
            git reset --hard HEAD~1
            echo "OK: commit desfeito via reset --hard HEAD~1 e tag removida (se existir)." >&2
            ;;
        tagged)
            echo "ERRO: falha no push. Removendo tag local e desfazendo commit..." >&2
            git tag -d "$TAG" 2>/dev/null || true
            git reset --hard HEAD~1
            echo "OK: estado local revertido. O autor pode re-rodar o script para tentar novamente." >&2
            ;;
    esac
}

trap _cleanup EXIT

# ---------------------------------------------------------------
# Passo 2 — validar working tree limpa
# ---------------------------------------------------------------
if [ -n "$(git status --porcelain)" ]; then
    echo "Erro: working tree suja — ha mudancas pendentes ou arquivos nao rastreados" >&2
    exit 1
fi

# ---------------------------------------------------------------
# Passo 3 — atualizar arquivos
# ---------------------------------------------------------------
STEP="files_updated"

for dir in "${PKG_DIRS[@]}"; do
    echo "Atualizando $dir/package.json ..."
    sed -i 's/"version": "[0-9.]*"/"version": "'"$NEW_VERSION"'"/' "$dir/package.json"

    echo "Atualizando $dir/package-lock.json ..."
    npm install --package-lock-only --silent --prefix "$dir"
done

# ---------------------------------------------------------------
# Passo 4 — commit
# ---------------------------------------------------------------
COMMIT_MSG="chore(release): bump $MODE version to $NEW_VERSION"
git add $(_changed_files)
git commit -m "$COMMIT_MSG"

STEP="committed"

# ---------------------------------------------------------------
# Passo 5 — tag anotada
# ---------------------------------------------------------------
git tag -a "$TAG" -m "$COMMIT_MSG"

STEP="tagged"

# ---------------------------------------------------------------
# Passo 6 — push
# ---------------------------------------------------------------
git push --follow-tags
