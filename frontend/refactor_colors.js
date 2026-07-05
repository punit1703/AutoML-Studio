const fs = require('fs');
const path = require('path');

const directories = ['app', 'components'];

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Replace hardcoded dark mode colors with theme variables
            content = content.replace(/bg-\[#09090b\]/g, 'bg-card');
            content = content.replace(/border-white\/10/g, 'border-border');
            content = content.replace(/border-white\/5/g, 'border-border/50');
            content = content.replace(/bg-white\/5/g, 'bg-secondary');
            content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-secondary/50');
            content = content.replace(/text-white/g, 'text-foreground');
            content = content.replace(/text-black/g, 'text-background');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

directories.forEach(dir => {
    processDirectory(path.join(__dirname, dir));
});

console.log("Done refactoring hardcoded colors.");
