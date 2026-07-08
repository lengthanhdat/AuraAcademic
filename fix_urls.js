const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace backtick template literals
    content = content.replace(/\`http:\/\/localhost:8088(.*?)\`/g, '\`${process.env.NEXT_PUBLIC_API_BASE_URL || \'http://localhost:8088\'}$1\`');
    
    // Replace double quote literals
    content = content.replace(/\"http:\/\/localhost:8088(.*?)\"/g, '(process.env.NEXT_PUBLIC_API_BASE_URL || \"http://localhost:8088\") + \"$1\"');
    
    // Replace single quote literals
    content = content.replace(/\'http:\/\/localhost:8088(.*?)\'/g, '(process.env.NEXT_PUBLIC_API_BASE_URL || \'http://localhost:8088\') + \'$1\'');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
