/**
 * Markdown Preview Plugin
 * 
 * Este plugin combina a funcionalidade de preview de imagens e links,
 * renderizando ambos inline no editor para uma melhor experiência visual.
 * 
 * Funcionalidades:
 * - Integra imagePreviewPlugin para renderizar imagens
 * - Integra linkPreviewPlugin para adicionar ícones aos links
 * - Ambos funcionam de forma independente e complementar
 */

import { imagePreviewPlugin } from './image-widget'
import { linkPreviewPlugin } from './link-widget'

/**
 * Array de plugins combinados para preview de Markdown
 */
export const markdownPreviewPlugin = [
    imagePreviewPlugin,
    linkPreviewPlugin
]
