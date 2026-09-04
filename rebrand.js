const fs = require('fs');
const path = require('path');

const directoryToSearch = path.join(__dirname, 'src');

const replacements = [
  // Brand Names
  { regex: /Bloom & Bliss/gi, replacement: 'PriyoUpohar' },
  { regex: /Bloom &amp; Bliss/gi, replacement: 'PriyoUpohar' },
  { regex: /Bloom \u003cspan className="text-brand"\u003e&\u003c\/span\u003e Bliss/g, replacement: 'PriyoUpohar' },
  { regex: /Bloom \u003cspan className="text-gold"\u003e&amp;\u003c\/span\u003e Bliss/g, replacement: 'PriyoUpohar' },
  // Emails & Domains
  { regex: /bloombliss\.test/gi, replacement: 'priyoupohar.com' },
  { regex: /bloombliss\.in/gi, replacement: 'priyoupohar.com' },
  { regex: /bloom-bliss/gi, replacement: 'priyo-upohar' },
  // Loyalty & Coupons
  { regex: /Bloom Club/gi, replacement: 'Priyo Club' },
  { regex: /Bloom Rewards/gi, replacement: 'Priyo Rewards' },
  { regex: /BLOOM100/g, replacement: 'PRIYO100' },
  { regex: /bloom-club/g, replacement: 'priyo-club' },
  // Specific taglines
  { regex: /Make every moment bloom\./g, replacement: 'Make every moment special.' },
  { regex: /\<span className="text-gradient-brand"\>bloom\.\<\/span\>/g, replacement: '<span className="text-gradient-brand">priyo.</span>' },
  { regex: /something lovely is always blooming\./g, replacement: 'something lovely is always waiting.' },
  { regex: /get the catalogue blooming/g, replacement: 'get the catalogue ready' },
  { regex: /preview blooms here/g, replacement: 'preview appears here' },
  { regex: /Cake, blooms & joy/g, replacement: 'Cake, gifts & joy' },
  { regex: /wedding-day blooms/g, replacement: 'wedding-day gifts' },
  { regex: /bloom with joy/g, replacement: 'fill with joy' },
  { regex: /keeps blooming/g, replacement: 'keeps growing' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = false;
      
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          updated = true;
        }
      }
      
      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryToSearch);
console.log('Rebranding complete!');
