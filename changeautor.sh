#!/bin/bash
set -e

# ============================================
# CONFIGURA ESTOS DATOS ANTES DE EJECUTAR
# ============================================

# Email(s) viejo(s) que quieres reemplazar (puedes agregar mas lineas si usaste varios emails)
OLD_EMAILS=("OLD email")

# Datos nuevos que quieres que aparezcan en TODOS los commits que coincidan
NEW_NAME="Rafael Encinas"
NEW_EMAIL="encinas008@gmail.com"

# ============================================
# NO NECESITAS TOCAR NADA DE AQUI PARA ABAJO
# ============================================

echo "Verificando que estas en un repositorio git..."
git rev-parse --is-inside-work-tree > /dev/null 2>&1 || {
  echo "ERROR: esta carpeta no es un repositorio git. Ejecuta este script dentro de tu repo."
  exit 1
}

echo "Verificando que git-filter-repo este instalado..."
if ! command -v git-filter-repo &> /dev/null; then
  echo "git-filter-repo no esta instalado. Instalando con pip..."
  pip install git-filter-repo --break-system-packages
fi

echo ""
echo "Se va a reescribir TODO el historial de commits en este repo."
echo "Nombre/email nuevos: $NEW_NAME <$NEW_EMAIL>"
echo "Se reemplazaran los commits de estos emails viejos: ${OLD_EMAILS[@]}"
echo ""
read -p "¿Confirmas que quieres continuar? (escribe 'si' para seguir): " CONFIRM

if [ "$CONFIRM" != "si" ]; then
  echo "Cancelado. No se hizo ningun cambio."
  exit 0
fi

# Construir la condicion para el commit-callback dinamicamente segun los emails viejos
CONDITION=""
for email in "${OLD_EMAILS[@]}"; do
  if [ -z "$CONDITION" ]; then
    CONDITION="commit.author_email == b\"$email\""
  else
    CONDITION="$CONDITION or commit.author_email == b\"$email\""
  fi
done

python3 - <<EOF
import subprocess

condition = '''$CONDITION'''
new_name = b"$NEW_NAME"
new_email = b"$NEW_EMAIL"

callback = f'''
if {condition}:
    commit.author_name = {new_name!r}
    commit.author_email = {new_email!r}
if {condition.replace("author_email", "committer_email")}:
    commit.committer_name = {new_name!r}
    commit.committer_email = {new_email!r}
'''

subprocess.run(["git", "filter-repo", "--force", "--commit-callback", callback], check=True)
EOF

echo ""
echo "Listo. El historial local ya quedo actualizado."
echo ""
echo "Para revisar los cambios, ejecuta:"
echo "  git log --pretty=format:'%h %an <%ae> %s'"
echo ""
echo "Si ya habias subido estos commits a GitHub/GitLab y quieres sincronizar el remoto,"
echo "ejecuta lo siguiente (esto SOBRESCRIBE el historial remoto, usalo solo si eres el unico que usa el repo):"
echo ""
echo "  git push --force --all"
echo "  git push --force --tags"