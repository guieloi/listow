import re
import sys

# Read the build.gradle file
with open('android/app/build.gradle', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the import and version functions after the projectRoot definition
import_and_functions = '''
// Read version from app.json
import groovy.json.JsonSlurper
def getAppVersion() {
    def appJsonFile = file("$projectRoot/app.json")
    def appJson = new JsonSlurper().parseText(appJsonFile.text)
    return appJson.expo.version
}

def getVersionCode() {
    def version = getAppVersion()
    // Convert version string "0.0.1" to version code
    // Example: "0.0.1" -> 1, "0.0.2" -> 2, "1.0.0" -> 10000
    def parts = version.tokenize('.')
    return (parts[0].toInteger() * 10000) + (parts[1].toInteger() * 100) + parts[2].toInteger()
}
'''

# Insert after projectRoot definition
content = re.sub(
    r'(def projectRoot = rootDir\.getAbsoluteFile\(\)\.getParentFile\(\)\.getAbsolutePath\(\))',
    r'\1\n' + import_and_functions,
    content
)

# Replace versionCode and versionName
content = re.sub(r'versionCode\s+\d+', 'versionCode getVersionCode()', content)
content = re.sub(r'versionName\s+"[^"]+"', 'versionName getAppVersion()', content)

# Write back
with open('android/app/build.gradle', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ build.gradle updated successfully!")
print("   - versionCode will be calculated from app.json")
print("   - versionName will be read from app.json")
