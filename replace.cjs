const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

walk('./src').forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  content = content
    .replace(/Rahim Uddin/g, 'Adnan')
    .replace(/Rahim Karim/g, 'Adnan')
    .replace(/Rahim's/g, "Adnan's")
    .replace(/Rahim/g, 'Adnan')
    .replace(/Fatema Khatun/g, 'Rehnuma')
    .replace(/Rifat Ahmed/g, 'Rumi')
    .replace(/Karim Uddin/g, 'Jabed')
    .replace(/Dr\. Nusrat Jahan/g, 'DR. Rohan')
    .replace(/Dr\. Hasan/g, 'DR. Rohan')
    .replace(/Dr\. Chen/g, 'DR. Rohan')
    .replace(/Dr\. Nusrat/g, 'DR. Rohan');
  
  if (original !== content) {
    fs.writeFileSync(f, content);
    console.log('Updated:', f);
  }
});
