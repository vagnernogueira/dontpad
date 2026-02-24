// Provide Markdown CSS styles similar to GitHub
// We need !important to override TailwindCSS preflight resets that strip lists, italics, etc.
export const markdownStyles = `
  <style>
    .markdown-body {
      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      font-size: 16px !important;
      line-height: 1.6 !important;
      color: #333333 !important;
      padding: 20px !important;
      background-color: white !important;
    }
    .markdown-body em, .markdown-body i {
      font-style: italic !important;
    }
    .markdown-body strong, .markdown-body b {
      font-weight: 700 !important;
    }
    .markdown-body del {
      text-decoration: line-through !important;
    }
    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {
      margin-top: 24px !important;
      margin-bottom: 16px !important;
      font-weight: 600 !important;
      line-height: 1.25 !important;
      color: #000000 !important;
    }
    .markdown-body h1 { font-size: 2em !important; border-bottom: none !important; padding-bottom: 0.3em !important; }
    .markdown-body h2 { font-size: 1.5em !important; border-bottom: none !important; padding-bottom: 0.3em !important; }
    .markdown-body h3 { font-size: 1.25em !important; }
    
    /* Fix lists stripped by Tailwind */
    .markdown-body ul, .markdown-body ol { 
      padding-left: 2em !important; 
      margin-bottom: 16px !important; 
    }
    .markdown-body ul { list-style-type: disc !important; }
    .markdown-body ol { list-style-type: decimal !important; }
    .markdown-body li { display: list-item !important; margin-bottom: 0.25em !important; }

    .markdown-body p, .markdown-body blockquote, .markdown-body table, .markdown-body pre, .markdown-body details {
      margin-top: 0 !important;
      margin-bottom: 16px !important;
    }
    /* Beautiful Blockquotes */
    .markdown-body blockquote {
      padding: 10px 20px !important;
      color: #6a737d !important;
      border-left: 5px solid #dfe2e5 !important;
      background-color: #f9f9f9 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
    .markdown-body code {
      padding: 0.2em 0.4em !important;
      margin: 0 !important;
      font-size: 85% !important;
      white-space: pre-wrap !important;
      background-color: rgba(27,31,35,0.05) !important;
      border-radius: 3px !important;
      font-family: inherit !important;
    }
    .markdown-body pre {
      padding: 16px !important;
      overflow: auto !important;
      font-size: 85% !important;
      line-height: 1.45 !important;
      background-color: #f6f8fa !important;
      border-radius: 6px !important;
      page-break-inside: avoid !important;
    }
    .markdown-body pre code {
      padding: 0 !important;
      background-color: transparent !important;
      white-space: pre !important;
    }
    .markdown-body a { color: #0366d6 !important; text-decoration: none !important; }
    .markdown-body hr { height: 0.25em !important; padding: 0 !important; margin: 24px 0 !important; background-color: #e1e4e8 !important; border: 0 !important; }
    
    /* Fix Image Overlapping and Breakage */
    .markdown-body img { 
      max-width: 100% !important; 
      height: auto !important; 
      display: block !important; 
      margin: 16px 0 !important;
      page-break-inside: avoid !important; 
    }
  </style>
`
