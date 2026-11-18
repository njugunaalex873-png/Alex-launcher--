const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let content = fs.readFileSync(manifestPath, 'utf8');
  const homeFilter = `
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>`;
  
  if (!content.includes('android.intent.category.HOME')) {
    content = content.replace('</activity>', `    ${homeFilter}\n        </activity>`);
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('Successfully added HOME intent filter to AndroidManifest.xml');
  } else {
    console.log('HOME intent filter already present in AndroidManifest.xml');
  }
} else {
  console.log('AndroidManifest.xml not found at', manifestPath);
}
