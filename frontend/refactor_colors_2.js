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

            // Replace zinc 900
            content = content.replace(/bg-\[#18181b\]/g, 'bg-secondary');
            
            // Replace text-white on primary button that became text-foreground (which is black in light mode)
            // Wait, we can't blindly replace text-foreground. But we can replace bg-primary text-foreground
            // Actually I'll just change the select in training/page manually.
            
            // For now, let's replace bg-black/50 and bg-black/40 with bg-secondary/50 and bg-secondary/80
            // BUT NOT in modal backdrops.
            if (!fullPath.includes('modal.tsx') && !fullPath.includes('top-navbar.tsx')) {
                content = content.replace(/bg-black\/50/g, 'bg-secondary/50');
                content = content.replace(/bg-black\/40/g, 'bg-secondary/80');
            }

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

console.log("Done refactoring missed colors.");
