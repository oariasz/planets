#!/usr/bin/env bash
# ============================================================
# create_repo.sh — Crear repo GitHub para planets (Estratek)
# ============================================================
# Requisitos:
#   - gh CLI instalado y autenticado:  gh auth status
#   - git instalado
#   - ejecutarse desde la raíz del proyecto: ./create_repo.sh
#
# Variables que puedes ajustar:
REPO_NAME="${REPO_NAME:-planets}"
REPO_VISIBILITY="${REPO_VISIBILITY:-public}"   # public | private
REPO_DESC="${REPO_DESC:-Sistema Solar Interactivo · demo Estratek (Three.js)}"
GH_OWNER="${GH_OWNER:-}"                       # vacío = usuario logueado en gh
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
# ============================================================

set -euo pipefail

# Colores
G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; C=$'\e[36m'; B=$'\e[1m'; N=$'\e[0m'

err()  { echo "${R}[ERROR]${N} $*" >&2; exit 1; }
info() { echo "${C}[info]${N}  $*"; }
ok()   { echo "${G}[ok]${N}    $*"; }
warn() { echo "${Y}[warn]${N}  $*"; }

# 1. Verificar prerequisites
command -v git >/dev/null 2>&1 || err "git no está instalado"
command -v gh  >/dev/null 2>&1 || err "GitHub CLI (gh) no está instalado. Instálalo con: brew install gh"

if ! gh auth status >/dev/null 2>&1; then
  err "No estás autenticado con gh. Ejecuta: gh auth login"
fi

# 2. Determinar owner (si no se especificó, usar el usuario actual de gh)
if [[ -z "${GH_OWNER}" ]]; then
  GH_OWNER=$(gh api user --jq .login)
fi
FULL_NAME="${GH_OWNER}/${REPO_NAME}"

info "Creando repo: ${B}${FULL_NAME}${N} (${REPO_VISIBILITY})"
info "Descripción: ${REPO_DESC}"

# 3. Ir a la raíz del proyecto
cd "$(dirname "$0")"

# 4. Inicializar git si hace falta
if [[ ! -d .git ]]; then
  git init -b "${DEFAULT_BRANCH}"
  ok "git init en ${DEFAULT_BRANCH}"
else
  info "Repositorio git ya inicializado"
  CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
  if [[ "${CURRENT_BRANCH}" != "${DEFAULT_BRANCH}" && -n "${CURRENT_BRANCH}" ]]; then
    warn "Branch actual: ${CURRENT_BRANCH} (esperado: ${DEFAULT_BRANCH})"
  fi
fi

# 5. Asegurar .gitignore
if [[ ! -f .gitignore ]]; then
  warn ".gitignore no existe — crea uno antes de continuar"
fi

# 6. Verificar si el repo remoto ya existe
if gh repo view "${FULL_NAME}" >/dev/null 2>&1; then
  warn "El repo ${FULL_NAME} ya existe en GitHub"
  read -r -p "${Y}¿Continuar y configurar 'origin' apuntando a ese repo? [y/N]:${N} " ans
  [[ "${ans,,}" == "y" ]] || err "Abortado por el usuario"
else
  info "Creando repo remoto en GitHub..."
  gh repo create "${FULL_NAME}" \
    --"${REPO_VISIBILITY}" \
    --description "${REPO_DESC}" \
    --homepage "https://demo.estratekdata.com/planets/" \
    --disable-wiki
  ok "Repo creado: https://github.com/${FULL_NAME}"
fi

# 7. Configurar remote 'origin'
if git remote get-url origin >/dev/null 2>&1; then
  CURRENT_ORIGIN=$(git remote get-url origin)
  info "remote origin existente: ${CURRENT_ORIGIN}"
  EXPECTED_HTTPS="https://github.com/${FULL_NAME}.git"
  EXPECTED_SSH="git@github.com:${FULL_NAME}.git"
  if [[ "${CURRENT_ORIGIN}" != "${EXPECTED_HTTPS}" && "${CURRENT_ORIGIN}" != "${EXPECTED_SSH}" ]]; then
    warn "remote origin no coincide. Actualizando..."
    git remote set-url origin "${EXPECTED_HTTPS}"
  fi
else
  git remote add origin "https://github.com/${FULL_NAME}.git"
  ok "remote origin añadido"
fi

# 8. Add + commit inicial si no hay commits
if [[ -z "$(git log -1 --oneline 2>/dev/null)" ]]; then
  git add .
  git commit -m "chore: initial commit — Sistema Solar Interactivo (Estratek)"
  ok "Commit inicial creado"
else
  info "Ya existen commits — saltando commit inicial"
fi

# 9. Push
info "Pushing a ${DEFAULT_BRANCH}..."
git push -u origin "${DEFAULT_BRANCH}"
ok "Push completado"

echo ""
echo "${G}${B}✓ Listo${N}"
echo "Repo:    ${B}https://github.com/${FULL_NAME}${N}"
echo "Homepage: ${B}https://demo.estratekdata.com/planets/${N}"
echo ""
echo "Próximos pasos:"
echo "  1. (Opcional) Activar GitHub Pages:"
echo "     gh repo edit ${FULL_NAME} --enable-pages --source-branch ${DEFAULT_BRANCH} --source-path /"
echo "  2. Deploy a producción (ver deploy/README-DEPLOY.md)"
