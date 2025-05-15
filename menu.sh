#!/bin/bash

while true; do
  echo ""
  echo "===== MENU NEXIA ====="
  echo "1. Rodar projeto (start-project.sh)"
  echo "2. Sincronizar com GitHub (git_sync_quick_updated.sh)"
  echo "3. Publicar projeto (publicar-github.sh)"
  echo "4. Sair"
  echo "======================"
  echo -n "Escolha uma opção [1-4]: "
  read opcao

  case $opcao in
    1)
      echo "🔄 Iniciando projeto..."
      bash start-project.sh
      ;;
    2)
      echo "🔁 Sincronizando com GitHub..."
      bash git_sync_quick_updated.sh
      ;;
    3)
      echo "🚀 Publicando projeto..."
      bash publicar-github.sh
      ;;
    4)
      echo "👋 Saindo..."
      exit 0
      ;;
    *)
      echo "❌ Opção inválida. Tente novamente."
      ;;
  esac
done
