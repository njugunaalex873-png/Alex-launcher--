const fs = require('fs');
const path = require('path');

// 1. Patch AndroidManifest.xml
const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let content = fs.readFileSync(manifestPath, 'utf8');

  // Ensure tools namespace
  if (!content.includes('xmlns:tools=')) {
    content = content.replace(
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools"'
    );
  }

  // Ensure QUERY_ALL_PACKAGES permission
  if (!content.includes('android.permission.QUERY_ALL_PACKAGES')) {
    const permTag = '    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" tools:ignore="QueryAllPackagesPermission" />\n';
    if (content.includes('<!-- Permissions -->')) {
      content = content.replace('<!-- Permissions -->', `<!-- Permissions -->\n${permTag}`);
    } else {
      content = content.replace('</manifest>', `${permTag}</manifest>`);
    }
  }

  // Ensure <queries> launcher intent block for Android 11+ (API 30+)
  if (!content.includes('<category android:name="android.intent.category.LAUNCHER" />') || !content.includes('<queries>')) {
    const queriesBlock = `
    <!-- Queries for launchers on Android 11+ (API 30+) -->
    <queries>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent>
    </queries>
`;
    if (!content.includes('<queries>')) {
      content = content.replace('<application', `${queriesBlock}    <application`);
    }
  }

  // Ensure HOME intent filter in MainActivity
  const homeFilter = `
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>`;
  
  if (!content.includes('android.intent.category.HOME')) {
    content = content.replace('</activity>', `    ${homeFilter}\n        </activity>`);
    console.log('Successfully added HOME intent filter to AndroidManifest.xml');
  } else {
    console.log('HOME intent filter already present in AndroidManifest.xml');
  }

  fs.writeFileSync(manifestPath, content, 'utf8');
  console.log('Successfully validated AndroidManifest.xml configuration');
} else {
  console.log('AndroidManifest.xml not found at', manifestPath);
}

// 2. Validate MainActivity.java has AlexAndroidBridge
const mainActivityPath = path.join(__dirname, '../android/app/src/main/java/com/alexlauncher/app/MainActivity.java');
if (fs.existsSync(mainActivityPath)) {
  const activityContent = fs.readFileSync(mainActivityPath, 'utf8');
  if (!activityContent.includes('AlexAndroidBridge')) {
    console.warn('Warning: MainActivity.java does not contain AlexAndroidBridge. Ensure native bridge is preserved.');
  } else {
    console.log('Verified AlexAndroidBridge is present in MainActivity.java');
  }
}
