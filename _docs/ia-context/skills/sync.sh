#!/bin/bash

# Necessário ter o 'jq' instalado no ambiente (padrão em runners do GitHub)
CONFIG_FILE="skills-config.json"

# Lê o JSON e itera sobre cada objeto
jq -c '.[]' "$CONFIG_FILE" | while read -r item; do
    REPO_URL=$(echo "$item" | jq -r '.source_repo')
    BRANCH=$(echo "$item" | jq -r '.branch')
    SOURCE_PATH=$(echo "$item" | jq -r '.source_path')
    TARGET_DIR=$(echo "$item" | jq -r '.target_dir')

    echo "Sincronizando: $REPO_URL -> $SOURCE_PATH"

    # Cria diretório temporário isolado
    TEMP_DIR=$(mktemp -d)
    
    # Clone sem baixar os arquivos (treeless clone) para economizar tempo
    git clone --filter=blob:none --no-checkout --depth 1 "$REPO_URL" "$TEMP_DIR"
    
    cd "$TEMP_DIR" || exit

    # Configura o checkout esparso apenas para o caminho desejado
    git sparse-checkout init --cone
    git sparse-checkout set "$SOURCE_PATH"
    
    # Faz o checkout da branch baixando apenas os arquivos mapeados
    git checkout "$BRANCH"

    # Volta para a raiz do repositório principal
    cd - > /dev/null

    # Prepara o diretório de destino limpo
    rm -rf "$TARGET_DIR"
    mkdir -p "$(dirname "$TARGET_DIR")"

    # Copia os arquivos atualizados para o diretório de destino
    cp -r "$TEMP_DIR/$SOURCE_PATH" "$TARGET_DIR"

    # Limpa o diretório temporário
    rm -rf "$TEMP_DIR"
done
