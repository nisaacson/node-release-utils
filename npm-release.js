var path = require('path')
var fs = require('fs');
var child_process = require('child_process');

var PACKAGE_JSON_FILE = 'package.json';
var JSON_INDENT = 2;
var repoPath = path.join(__dirname, '../..')
function buildCommitCmd(message) {
  return '(cd '+ repoPath + ' && git add package.json && git commit -m "' + message + '" package.json && git push origin master)'
}

function commitPackageFile(version, callback) {
  var commitMessage = 'Incrementing version number to ' + version
  var cmd = buildCommitCmd(commitMessage)
  exec(cmd, callback)
}

function tagRepo(tagName, callback) {
  var tagCmd = '(cd ' + repoPath + ' && git tag ' + tagName + ')'
  exec(tagCmd, callback)
}

function exec(cmd, callback) {
  console.log("Running %s", cmd)
  child_process.exec(cmd, callback)
}

function readJSON(file) {
  var jsonStr = fs.readFileSync(PACKAGE_JSON_FILE)
  return JSON.parse(jsonStr);
}

function writeJSON(file) {
  var jsonStr = JSON.stringify(file, null, JSON_INDENT)
  fs.writeFileSync(PACKAGE_JSON_FILE, jsonStr)
}

function incrementVersionInJson(packageJson) {
  var version = packageJson.version.split('.');
  version[version.length-1]++;
  var newVersion = version.join('.');
  packageJson.version = newVersion;
  return newVersion;
}

function tagAndIncrementVersion(callback) {
  var packageJson = readJSON(PACKAGE_JSON_FILE);
  var tagName = packageJson.name + '-' + packageJson.version
  tagRepo(tagName, function (error, stdout, stderr) {
    var newVersion = incrementVersionInJson(packageJson)
    console.log("Updating version in package.json to %s", newVersion)
    writeJSON(packageJson)
    commitPackageFile(newVersion, function (error, stdout, stderr) {
      callback(packageJson.name, tagName)
    })
  })
}

function publish(packageName, newTag) {
  var cmd = '(cd ' + repoPath + ' && npm publish)'
  exec(cmd, function (error, stdout, stderr) {
    var fileName = stdout.replace('./','').replace('\n', '')
    pushTag(newTag)
  })
}

function pushTag(tagName) {
  var cmd = '(cd ' + repoPath + ' && git push origin ' + tagName
  child_process.exec(cmd, function (error, stdout, stderr) {
  })
}

tagAndIncrementVersion(function(packageName, newTag) {
  publish(packageName, newTag);
})
