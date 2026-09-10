const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'layer.html');
const outputDir = path.join(__dirname, 'Layer_1_Mastery_Notes');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const rawText = fs.readFileSync(inputFile, 'utf-8');
const sections = rawText.split(/(?=## PILLAR)/);

// Extract titles and generate file names dynamically
const sectionData = sections.map((content, index) => {
    let title = 'Introduction';
    let shortTitle = '00. Introduction';
    
    if (index > 0) {
        const match = content.match(/## PILLAR \d+:\s*(.*)/);
        if (match) {
            title = match[0].replace('## ', '').trim();
            shortTitle = `${index < 10 ? '0' + index : index}. ${match[1].substring(0, 25)}...`;
        } else {
            title = `Section ${index}`;
            shortTitle = `${index < 10 ? '0' + index : index}. Section`;
        }
    }
    
    return {
        index,
        content,
        title,
        shortTitle,
        fileName: `${index < 10 ? '0' + index : index}_section.html`
    };
});

console.log(`Found ${sectionData.length} sections.`);

// Generate global TOC HTML
const tocHtml = sectionData.map(s => 
    `<li><a href="${s.fileName}">${s.shortTitle}</a></li>`
).join('\n            ');

const generateHtml = (currentSection, allSections) => {
    const { title, content, fileName, index } = currentSection;
    const prevLink = index > 0 ? allSections[index - 1].fileName : null;
    const nextLink = index < allSections.length - 1 ? allSections[index + 1].fileName : null;

    const safeContent = content.replace(/`/g, '\\`').replace(/<\/script>/g, '<\\/script>');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Engineering Mastery</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

    <style>
        :root {
            --bg-primary: #0f1115;
            --bg-card: #1c2128;
            --text-primary: #f0f6fc;
            --text-secondary: #8b949e;
            --accent: #3b82f6; /* Blue accent */
            --border: #30363d;
            --font-sans: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-family: var(--font-sans);
            line-height: 1.7;
        }

        .top-nav {
            background: rgba(15, 17, 21, 0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
        }

        .brand { font-weight: 700; font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
        .brand-badge { background: var(--accent); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }

        .nav-links { display: flex; gap: 1rem; }
        .nav-btn {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            text-decoration: none;
            color: var(--text-secondary);
            background: var(--bg-card);
            border: 1px solid var(--border);
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        .nav-btn:hover { border-color: var(--accent); color: var(--text-primary); }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 3rem 1.5rem 6rem;
        }

        #content-area h1, #content-area h2, #content-area h3 {
            color: var(--text-primary);
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.5rem;
        }
        #content-area h1 { font-size: 2.2rem; border-bottom: none; margin-top: 0; background: linear-gradient(90deg, #fff, #8b949e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;}
        #content-area h2 { font-size: 1.7rem; color: var(--accent); border-color: rgba(59, 130, 246, 0.2); }
        #content-area h3 { font-size: 1.3rem; margin-top: 2rem; }
        
        #content-area p { margin-bottom: 1.2rem; color: var(--text-secondary); }
        
        #content-area pre {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            font-family: var(--font-mono);
            font-size: 0.9rem;
        }
        #content-area code { font-family: var(--font-mono); }
        #content-area p code, #content-area li code { background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.85rem;}
        
        #content-area ul, #content-area ol { margin-bottom: 1.2rem; padding-left: 2rem; color: var(--text-secondary); }
        #content-area li { margin-bottom: 0.5rem; }

        hr { border: 0; border-top: 1px solid var(--border); margin: 3rem 0; }
        
        .toc {
            position: fixed;
            left: 2rem;
            top: 6rem;
            width: 280px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
            max-height: calc(100vh - 8rem);
            overflow-y: auto;
            display: none;
        }
        @media (min-width: 1400px) {
            .toc { display: block; }
            .container { margin-left: 340px; }
        }
        .toc h4 { margin-bottom: 1rem; color: var(--text-primary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .toc-list { list-style: none; padding: 0; }
        .toc-list li { margin-bottom: 0.5rem; }
        .toc-list a { color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; transition: 0.2s; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
        .toc-list a:hover { color: var(--accent); }
        .toc-list a.active { color: var(--accent); font-weight: 600; }
    </style>
</head>
<body>

    <nav class="top-nav">
        <div class="brand">
            <span class="brand-badge">ENG</span>
            Engineering Mastery
        </div>
        <div class="nav-links">
            ${prevLink ? '<a href="' + prevLink + '" class="nav-btn">⬅️ Previous</a>' : ''}
            ${nextLink ? '<a href="' + nextLink + '" class="nav-btn">Next ➡️</a>' : ''}
        </div>
    </nav>

    <div class="toc" id="toc-container">
        <h4>Curriculum</h4>
        <ul class="toc-list" id="toc-list">
            ${tocHtml.replace(`href="${fileName}"`, `href="${fileName}" class="active"`)}
        </ul>
    </div>

    <main class="container" id="content-area">
        <!-- Rendered markdown will go here -->
    </main>

    <!-- UNTOUCHED RAW CONTENT -->
    <script type="text/markdown" id="raw-markdown">
${content}
    </script>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const rawMarkdown = document.getElementById('raw-markdown').textContent;
            
            marked.setOptions({
                breaks: true,
                gfm: true
            });
            
            document.getElementById('content-area').innerHTML = marked.parse(rawMarkdown);
            hljs.highlightAll();
        });
    </script>
</body>
</html>`;
};

sectionData.forEach(section => {
    const htmlContent = generateHtml(section, sectionData);
    fs.writeFileSync(path.join(outputDir, section.fileName), htmlContent);
    console.log(`Generated ${section.fileName}`);
});

console.log('All notes generated successfully in Layer_1_Mastery_Notes/');
