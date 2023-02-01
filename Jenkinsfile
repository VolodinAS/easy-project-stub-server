pipeline {
  agent {
    docker {
      image 'node:14'
    }
  }

  stages {
    stage('install') {
      steps {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm install'
      }
    }

    stage('eslint') {
      steps {
        sh 'npm run eslint'
      }
    }

    stage('test') {
      steps {
        sh 'npm run test:start'
      }
    }

    stage('clean-all') {
      steps {
        sh 'rm -rf .[!.]*'
        sh 'rm -rf ./*'
        sh 'ls -a'
      }
    }
  }
}