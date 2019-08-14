#!/usr/bin/env groovy

def cleanup_workspace() {
  cleanWs()
  dir("${env.WORKSPACE}@tmp") {
    deleteDir()
  }
  dir("${env.WORKSPACE}@script") {
    deleteDir()
  }
  dir("${env.WORKSPACE}@script@tmp") {
    deleteDir()
  }
}

pipeline {
  agent any
  tools {
    nodejs "node-lts"
  }
  environment {
    NPM_RC_FILE = 'process-engine-ci-token'
    NODE_JS_VERSION = 'node-lts'
  }

  stages {
    stage('Prepare version') {
      steps {
        sh('npm ci')
        sh('node dist/ci_tools.js npm-install-only @process-engine/ @essential-projects/')

        // does prepare the version, but not commit it
        sh('node dist/ci_tools.js prepare-version --allow-dirty-workdir')

        stash(includes: 'package.json', name: 'package_json')
        stash(includes: 'node_modules/', name: 'npm_package_node_modules')
      }
    }
    stage('Build & Test') {
      steps {
        unstash('npm_package_node_modules')
        unstash('package_json')

        sh('npm run build')

        sh('npm test')
      }
    }
    stage('Lint sources') {
      steps {
        unstash('npm_package_node_modules')
        unstash('package_json')

        sh('npm run lint')
      }
    }
    // stage('Commit & tag version') {
    //   when {
    //     anyOf {
    //       branch "master"
    //       branch "beta"
    //       branch "develop"
    //     }
    //   }
    //   steps {
    //     unstash('npm_package_node_modules')
    //     unstash('package_json')

    //     withCredentials([
    //       usernamePassword(credentialsId: 'process-engine-ci_github-token', passwordVariable: 'GH_TOKEN', usernameVariable: 'GH_USER')
    //     ]) {
    //       // does not change the version, but commit and tag it
    //       sh('node dist/ci_tools.js commit-and-tag-version --only-on-primary-branches')

    //       sh('node dist/ci_tools.js update-github-release --only-on-primary-branches --use-title-and-text-from-git-tag');
    //     }

    //     stash(includes: 'package.json', name: 'package_json')
    //   }
    // }
    // stage('Publish') {
    //   steps {
    //     script {
    //       unstash('npm_package_node_modules')
    //       unstash('package_json')

    //       nodejs(configId: env.NPM_RC_FILE, nodeJSInstallationName: env.NODE_JS_VERSION) {
    //         sh('node dist/ci_tools.js publish-npm-package --create-tag-from-branch-name')
    //       }
    //     }
    //   }
    // }
    stage('cleanup') {
      steps {
        script {
          // this stage just exists, so the cleanup-work that happens in the post-script
          // will show up in its own stage in Blue Ocean
          sh(script: ':', returnStdout: true);
        }
      }
    }
  }
  post {
    always {
      script {
        cleanup_workspace();
      }
    }
  }
}
