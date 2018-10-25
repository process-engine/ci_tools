# CI Tools

This projects contains shared scripts for our ci pipeline.

## What Are the Goals of This Project?

The goal of the project is to provide useful scripts for our ci pipeline.

## Relevant URLs

1. https://ci.process-engine.io

## How Do I Set This Project Up?

### Prerequesites

- Node

### Setup/Installation

Install dependencies:

```bash
npm install
```

Build the sources:

```bash
npm run build
```

Link the package, to execute commands from the terminal:

```bash
npm link
```

## How Do I Use This Project?

### Installation

Install and save this package into your dev dependencies:

```bash
npm install --save-dev @process-engine/ci_tools
```

Now use it inside the `scripts` block:

```json
(...)
  "scripts": {
    "do-release": "create-github-release",
    (...)
  },
(...)
```

### Usage

Provided scripts:

#### Create GitHub Release

This script interfaces with the GitHub API to create new releases on the
repository page.

**Synopsis**

```
create-github-release <github namespace> <github repository> <version to release> <target commit> <is draft> <is prerelease> [files to upload...]
```

**Exmaple usage:**

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

**Exmaple usage:**

```bash
NUGET_ACCESS_TOKEN="NuGetAPITokenHere" is-nuget-packet-published https://5minds.myget.org/F/process_engine_public/api/v3/index.json ProcessEngine.Runtime 3.8.2-pre1
```

This will check if the package `ProcessEngine.Runtime`, version `3.8.2-pre1` is
published on the feed `process_engine_public`.

### Deployment (*)

> **TODO:** optional section; please refer to the german template for hints on how to fill this section.

## What Else Is There to Know?

> **TODO:** please refer to the german template for hints on how to fill this section.

### Authors/Contact Information

- Paul Heidenreich <paul.heidenreich@5minds.de>
