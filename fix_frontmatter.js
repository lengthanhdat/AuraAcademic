const fs = require('fs');
const path = require('path');

const dir = 'c:\\AWS\\fcj-workshop-template\\content\\6-Project';

const mappings = {
  '6.1-Project-overview-user': { num: '6.1', vi: 'Chức năng Học sinh (Phần 1)', en: 'Student Features (Part 1)' },
  '6.2-Project-overview-user2': { num: '6.2', vi: 'Chức năng Học sinh (Phần 2)', en: 'Student Features (Part 2)' },
  '6.3-Project-overview-user3': { num: '6.3', vi: 'Chức năng Học sinh (Phần 3)', en: 'Student Features (Part 3)' },
  '6.4-Admin Function Pages': { num: '6.4', vi: 'Chức năng Quản trị viên (Phần 1)', en: 'Admin Features (Part 1)' },
  '6.5-Admin Function Pages2': { num: '6.5', vi: 'Chức năng Quản trị viên (Phần 2)', en: 'Admin Features (Part 2)' },
  '6.6-Teacher Function Pages': { num: '6.6', vi: 'Chức năng Giáo viên', en: 'Teacher Features' }
};

for (const [folder, meta] of Object.entries(mappings)) {
  const baseDir = path.join(dir, folder);
  if (!fs.existsSync(baseDir)) continue;
  
  for (const file of ['_index.vi.md', '_index.md']) {
    const fullPath = path.join(baseDir, file);
    if (!fs.existsSync(fullPath)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const title = file.includes('vi') ? meta.vi : meta.en;
    const weight = meta.num.split('.')[1];
    
    content = content.replace(/title\s*:\s*".*?"/, `title : "${title}"`);
    content = content.replace(/weight\s*:\s*\d+/, `weight : ${weight}`);
    content = content.replace(/pre\s*:\s*".*?"/, `pre : " <b> ${meta.num}. </b> "`);
    
    fs.writeFileSync(fullPath, content);
  }
}
console.log('Done!');
