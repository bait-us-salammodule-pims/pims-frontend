const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/organization/Departments.jsx',
  'src/pages/organization/Branches.jsx',
  'src/pages/organization/Stores.jsx',
  'src/pages/master-data/Categories.jsx',
  'src/pages/master-data/Items.jsx',
  'src/pages/master-data/Vendors.jsx'
];

const basePath = 'c:/Users/asif_/OneDrive/Desktop/Bait-us-salam-PIMS/frontend';

filesToFix.forEach(relPath => {
  const fullPath = path.join(basePath, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // The regex will find the old modal wrapper and replace it with the new simplified one
  const oldModalStart = /\{isModalOpen && \(\s*<div className="fixed inset-0 z-50 overflow-y-auto">\s*<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">\s*<div className="fixed inset-0 transition-opacity" aria-hidden="true">\s*<div className="absolute inset-0 bg-gray-500 opacity-75"><\/div>\s*<\/div>\s*<span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;<\/span>\s*<div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-[a-zA-Z]+ sm:w-full">/g;

  content = content.replace(oldModalStart, (match) => {
    // Determine max-width from the old string
    let maxWidth = 'max-w-lg';
    if (match.includes('max-w-md')) maxWidth = 'max-w-md';
    if (match.includes('max-w-xl')) maxWidth = 'max-w-xl';
    
    return `{isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${maxWidth} overflow-hidden max-h-[90vh] overflow-y-auto">`;
  });

  // Now replace the closing tags of the old modal structure.
  // The old structure had 3 extra closing divs than the new one.
  // Old: </form> </div> </div> </div> )}
  // New: </form> </div> </div> )}
  
  const oldModalEnd = /<\/form>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)}/g;
  content = content.replace(oldModalEnd, `</form>\n          </div>\n        </div>\n      )}`);

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed modal in ${relPath}`);
});
