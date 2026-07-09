const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

walk('src/app', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace /${locale}/ with / (when inside a template string used for routing)
  content = content.replace(/href=\{\`\/\$\{locale\}\//g, 'href={`/');
  content = content.replace(/router\.push\(\`\/\$\{locale\}\//g, 'router.push(`/');
  content = content.replace(/router\.replace\(\`\/\$\{locale\}\//g, 'router.replace(`/');

  // Insert trailing slash before ? for route paths to avoid Next.js redirect dropping query strings
  // Example: detail?id= -> detail/?id=
  content = content.replace(/([a-zA-Z0-9_-])\?([a-zA-Z0-9_]+)=/g, '$1/?$2=');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
    modifiedCount++;
  }
});

console.log('Total files modified:', modifiedCount);
