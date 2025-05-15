#!/bin/bash

# Script rápido para sincronizar alterações com GitHub

echo "Digite uma mensagem de commit:"
read COMMIT_MSG

# Adiciona, commita e envia mudanças
git add .
git commit -m "$COMMIT_MSG"
git push

# Atualiza com possíveis mudanças do repositório remoto
git pull
