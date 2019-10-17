# CI Tools

Allgemeines Tooling, welches im Rahmen unseres Release-Prozesses verwendet wird.

## Was sind die Ziele dieses Projekts?

Automatisierung.

## Wie kann ich das Projekt aufsetzen?


### Voraussetzungen

* Node `>= 10.0.0`
* npm `>= 6.0.0`


### Setup/Installation

```shell
$ npm install @process-engine/ci_tools
```

## Wie kann ich das Projekt benutzen?


### Benutzung

```shell
$ ci_tools --help
```

### Legacy Scripts

CI Tools wurden mit Version `2.0.0` komplett überarbeitet und neu ausgerichtet.

Die folgenden "Legacy Scripts" wurden in ihrer Funktionalität erhalten:

#### Create GitHub Release

This script interfaces with the GitHub API to create new releases on the
repository page.

**Synopsis**

```
create-github-release <github namespace> <github repository> <version to release> <target commit> <is draft> <is prerelease> [files to upload...]
```

**Example usage:**

```bash
RELEASE_GH_TOKEN="InsertGitHubTokenHere" create-github-release process-engine bpmn-studio 3.0.0 master false true dist/bpmn-studio.dmg CHANGELOG.md
```

This will create a new release for the tag `v3.0.0` in the repository
`process-engine/bpmn-studio`. The files `dist/bpmn-studio.dmg` and
`CHANGELOG.md` will be attached to the release.

#### Is NuGet Package Published

This script uses the NuGet API to check if a specified version of a given
package is published.

It will return either `true` or `false`. A non zero exit code indicates an
error occurred.

**Synopsis**

```
is-nuget-package-published <NuGet V3 feed URL> <package> <version>
```

**Example usage:**

```bash
NUGET_ACCESS_TOKEN="NuGetAPITokenHere" is-nuget-packet-published https://5minds.myget.org/F/process_engine_public/api/v3/index.json ProcessEngine.Runtime 3.8.2-pre1
```

This will check if the package `ProcessEngine.Runtime`, version `3.8.2-pre1` is
published on the feed `process_engine_public`.
